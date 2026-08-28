// src/modules/auth/auth.service.ts

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, and, gt, desc } from 'drizzle-orm';
import { db } from '@/db/index.js';
import {
  users,
  accounts,
  refreshTokens,
  passwordResets,
  emailVerifications,
  mobileOtps,
  type User,
} from '@/db/schema/index.js';
import { env } from '@/config/env.js';
import { ApiError } from '@/shared/errors/api-error.js';
import { EmailService } from '@/shared/services/email.service.js';
import { SmsService } from '@/shared/services/sms.service.js';
import type { JwtTokenPair, OAuthUserProfile, UserPayload } from '@/shared/types/index.js';
import type {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ResendVerificationInput,
  SendMobileOtpInput,
  VerifyMobileOtpInput,
} from '@/modules/auth/auth.schema.js';

export class AuthService {
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public static sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  public static generateAccessToken(user: {
    id: string;
    email: string | null;
    role: string;
  }): string {
    const payload: UserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRATION as jwt.SignOptions['expiresIn'],
    });
  }

  private static async createRefreshTokenSession(
    userId: string,
    existingFamilyId?: string,
  ): Promise<string> {
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const familyId = existingFamilyId || crypto.randomUUID();

    // Calculate expiration date (7 days default)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(refreshTokens).values({
      userId,
      tokenHash,
      familyId,
      expiresAt,
      isRevoked: false,
    });

    return rawRefreshToken;
  }

  public static async register(input: RegisterInput) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        passwordHash,
        emailVerified: false,
        role: 'user',
      })
      .returning();

    if (env.REQUIRE_EMAIL_VERIFICATION && newUser.email) {
      await this.sendEmailVerificationToken(newUser.id, newUser.email);
    }

    const accessToken = this.generateAccessToken(newUser);
    const refreshToken = await this.createRefreshTokenSession(newUser.id);

    return {
      user: this.sanitizeUser(newUser),
      accessToken,
      refreshToken,
    };
  }

  public static async login(input: LoginInput) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Check account lockout status
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const minutesLeft = Math.ceil(
        (new Date(user.lockoutUntil).getTime() - new Date().getTime()) / 60000,
      );
      throw ApiError.forbidden(
        `Account is temporarily locked due to consecutive failed attempts. Try again in ${minutesLeft} minute(s).`,
      );
    }

    // OAuth-only user password attempt check
    if (!user.passwordHash) {
      throw ApiError.badRequest(
        'This account was created via social login (Google/GitHub). Please sign in using your OAuth provider.',
      );
    }

    const isPasswordMatch = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordMatch) {
      const updatedAttempts = user.failedLoginAttempts + 1;
      let lockoutUntil: Date | null = null;

      if (updatedAttempts >= 5) {
        // Lock account for 15 minutes after 5 consecutive failures
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await db
        .update(users)
        .set({
          failedLoginAttempts: updatedAttempts,
          lockoutUntil,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      throw ApiError.unauthorized('Invalid email or password');
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockoutUntil !== null) {
      await db
        .update(users)
        .set({
          failedLoginAttempts: 0,
          lockoutUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshTokenSession(user.id);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  public static async refresh(rawRefreshToken: string): Promise<JwtTokenPair> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const existingToken = await db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenHash, tokenHash),
    });

    if (!existingToken) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    // Security reuse detection: if token is already revoked, someone reused a stale token!
    if (existingToken.isRevoked) {
      // Revoke all tokens in this family to protect user session
      await db
        .update(refreshTokens)
        .set({ isRevoked: true })
        .where(eq(refreshTokens.familyId, existingToken.familyId));

      throw ApiError.unauthorized(
        'Security alert: Refresh token reuse detected. All active sessions have been revoked.',
      );
    }

    // Check expiration
    if (new Date(existingToken.expiresAt) < new Date()) {
      throw ApiError.unauthorized('Refresh token has expired');
    }

    // Mark current token as revoked (rotated)
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.id, existingToken.id));

    const user = await db.query.users.findFirst({
      where: eq(users.id, existingToken.userId),
    });

    if (!user) {
      throw ApiError.unauthorized('User associated with token no longer exists');
    }

    // Issue new tokens maintaining original family ID
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.createRefreshTokenSession(user.id, existingToken.familyId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  public static async logout(rawRefreshToken?: string) {
    if (!rawRefreshToken) return;

    const tokenHash = this.hashToken(rawRefreshToken);

    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  public static async forgotPassword({ email }: { email: string }) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Always return success message even if user not found to prevent user enumeration
    if (!user) {
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawResetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    await db.insert(passwordResets).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Exposed for development / email dispatcher integrations
      resetToken: env.NODE_ENV === 'development' ? rawResetToken : undefined,
    };
  }

  public static async resetPassword(input: ResetPasswordInput) {
    const tokenHash = this.hashToken(input.token);

    const resetRecord = await db.query.passwordResets.findFirst({
      where: and(eq(passwordResets.tokenHash, tokenHash), gt(passwordResets.expiresAt, new Date())),
    });

    if (!resetRecord || resetRecord.usedAt !== null) {
      throw ApiError.badRequest('Invalid or expired password reset token');
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, 12);

    // Update password and reset lockout counters
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, resetRecord.userId));

    // Mark reset token as used
    await db
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(eq(passwordResets.id, resetRecord.id));

    // Revoke all existing refresh token sessions for security
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.userId, resetRecord.userId));

    return { message: 'Password reset successful. Please log in with your new password.' };
  }

  public static async handleOAuthUser(profile: OAuthUserProfile) {
    // 1. Check if OAuth account link already exists
    const existingAccount = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.provider, profile.provider),
        eq(accounts.providerAccountId, profile.providerAccountId),
      ),
    });

    let user: User | undefined;

    if (existingAccount) {
      user = await db.query.users.findFirst({
        where: eq(users.id, existingAccount.userId),
      });
    }

    if (!user) {
      // 2. Check if a user with the same email already exists (Account Linking)
      const userWithEmail = await db.query.users.findFirst({
        where: eq(users.email, profile.email),
      });

      if (userWithEmail) {
        user = userWithEmail;

        // Link existing account with new OAuth provider
        await db.insert(accounts).values({
          userId: user.id,
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        });

        // Update email verification if social provider verified it
        if (profile.emailVerified && !user.emailVerified) {
          await db
            .update(users)
            .set({ emailVerified: true, updatedAt: new Date() })
            .where(eq(users.id, user.id));
        }
      } else {
        // 3. Create new user and OAuth account record
        const [newUser] = await db
          .insert(users)
          .values({
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
            emailVerified: profile.emailVerified,
            passwordHash: null, // Social user
            role: 'user',
          })
          .returning();

        user = newUser;

        await db.insert(accounts).values({
          userId: user.id,
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        });
      }
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshTokenSession(user.id);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  public static async sendEmailVerificationToken(userId: string, email: string): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(emailVerifications).values({
      userId,
      tokenHash,
      expiresAt,
    });

    await EmailService.sendVerificationEmail(email, rawToken);
    return rawToken;
  }

  public static async verifyEmailToken(input: VerifyEmailInput) {
    const tokenHash = this.hashToken(input.token);

    const verificationRecord = await db.query.emailVerifications.findFirst({
      where: and(
        eq(emailVerifications.tokenHash, tokenHash),
        gt(emailVerifications.expiresAt, new Date()),
      ),
    });

    if (!verificationRecord || verificationRecord.usedAt) {
      throw ApiError.badRequest('Invalid or expired email verification token');
    }

    // Mark token as used
    await db
      .update(emailVerifications)
      .set({ usedAt: new Date() })
      .where(eq(emailVerifications.id, verificationRecord.id));

    // Update user's emailVerified status
    const [updatedUser] = await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, verificationRecord.userId))
      .returning();

    if (!updatedUser) {
      throw ApiError.notFound('User associated with this token was not found');
    }

    return {
      message: 'Email verified successfully',
      user: this.sanitizeUser(updatedUser),
    };
  }

  public static async resendEmailVerification(input: ResendVerificationInput) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (!user) {
      return {
        message: 'No account found with this email address.',
      };
    }

    if (user.emailVerified) {
      throw ApiError.badRequest('This email address is already verified');
    }

    await this.sendEmailVerificationToken(user.id, user.email!);

    return {
      message:
        env.NODE_ENV === 'development'
          ? 'Email was not sent in development mode because SMTP is not configured. Check the backend terminal for the verification link.'
          : 'Verification email has been sent successfully.',
    };
  }

  public static async sendMobileOtp(input: SendMobileOtpInput) {
    if (!env.ENABLE_MOBILE_AUTH) {
      throw ApiError.forbidden('Mobile authentication is currently disabled by administrator.');
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = this.hashToken(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(mobileOtps).values({
      phone: input.phone,
      otpHash,
      expiresAt,
    });

    await SmsService.sendOtp(input.phone, otpCode);

    return {
      message:
        env.NODE_ENV === 'development'
          ? 'SMS was not sent in development mode. Check the backend terminal for your OTP.'
          : 'OTP sent successfully to your mobile number',
      expiresIn: '10m',
    };
  }

  public static async verifyMobileOtp(input: VerifyMobileOtpInput) {
    if (!env.ENABLE_MOBILE_AUTH) {
      throw ApiError.forbidden('Mobile authentication is currently disabled by administrator.');
    }

    const otpHash = this.hashToken(input.code);

    const otpRecord = await db.query.mobileOtps.findFirst({
      where: and(
        eq(mobileOtps.phone, input.phone),
        eq(mobileOtps.otpHash, otpHash),
        gt(mobileOtps.expiresAt, new Date()),
      ),
      orderBy: [desc(mobileOtps.createdAt)],
    });

    if (!otpRecord || otpRecord.verifiedAt) {
      throw ApiError.badRequest('Invalid or expired OTP code');
    }

    // Mark OTP as verified
    await db
      .update(mobileOtps)
      .set({ verifiedAt: new Date() })
      .where(eq(mobileOtps.id, otpRecord.id));

    // Find or create user by phone number
    let user = await db.query.users.findFirst({
      where: eq(users.phone, input.phone),
    });

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          phone: input.phone,
          name: input.name || 'User',
          phoneVerified: true,
          emailVerified: false,
          role: 'user',
        })
        .returning();
      user = newUser;
    } else if (!user.phoneVerified) {
      const [updatedUser] = await db
        .update(users)
        .set({ phoneVerified: true, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();
      user = updatedUser;
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshTokenSession(user.id);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  public static getAuthConfig() {
    return {
      enableEmailAuth: env.ENABLE_EMAIL_AUTH,
      enableMobileAuth: env.ENABLE_MOBILE_AUTH,
      enableOAuthAuth: env.ENABLE_OAUTH_AUTH,
      enableGoogleAuth: env.ENABLE_GOOGLE_AUTH,
      enableGithubAuth: env.ENABLE_GITHUB_AUTH,
      requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION,
      requireMobileVerification: env.REQUIRE_MOBILE_VERIFICATION,
    };
  }
}
