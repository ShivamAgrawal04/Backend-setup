// src/modules/user/user.service.ts

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db/index.js';
import { users, accounts, refreshTokens } from '@/db/schema/index.js';
import { ApiError } from '@/shared/errors/api-error.js';
import { AuthService } from '@/modules/auth/auth.service.js';
import type { UpdateProfileInput, ChangePasswordInput } from '@/modules/user/user.schema.js';

export class UserService {
  public static async getProfile(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const userAccounts = await db.query.accounts.findMany({
      where: eq(accounts.userId, userId),
    });

    const linkedProviders = userAccounts.map((acc) => acc.provider);

    return {
      ...AuthService.sanitizeUser(user),
      linkedProviders,
    };
  }

  public static async updateProfile(userId: string, input: UpdateProfileInput) {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...(input.name ? { name: input.name } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw ApiError.notFound('User not found');
    }

    return AuthService.sanitizeUser(updatedUser);
  }

  public static async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.passwordHash) {
      throw ApiError.badRequest(
        'Cannot change password for accounts created exclusively with social login.',
      );
    }

    const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, 12);

    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Revoke existing refresh tokens for security
    await db.update(refreshTokens).set({ isRevoked: true }).where(eq(refreshTokens.userId, userId));

    return { message: 'Password changed successfully. Active sessions have been invalidated.' };
  }
}
