# Production Backend Authentication API

A modular, production-ready Express & TypeScript backend implementing secure **Email/Password Authentication**, **Google OAuth 2.0**, **GitHub OAuth 2.0**, **JWT Access & Refresh Token Rotation**, **Account Linking**, and **Rate Limiting**.

---

## 📋 Table of Contents

- [Features](#-features)
- [Interactive Swagger API Documentation](#-interactive-swagger-api-documentation)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Database Setup & Migrations](#-database-setup--migrations)
- [npm Scripts Reference](#-npm-scripts-reference)
- [Project Directory Structure](#-project-directory-structure)
- [API Endpoints Documentation](#-api-endpoints-documentation)
- [Security & Edge-Case Architecture](#-security--edge-case-architecture)
- [Code Style & Formatting](#-code-style--formatting)

---

## ✨ Features

- **Interactive Swagger UI**: Full OpenAPI 3.0 interactive documentation hosted directly at `/docs`.
- **Modular Architecture**: Feature-based separation (`modules/auth`, `modules/user`, `middlewares`, `shared`, `config`, `db`).
- **Dual OAuth Providers**: Google & GitHub OAuth via standard redirect flow or direct SPA token exchange.
- **Automatic Account Linking**: Links Google/GitHub accounts to existing user profiles matching the same email.
- **Refresh Token Rotation & Reuse Protection**: Refresh token lineage tracking with automatic session family revocation if token reuse/theft is detected.
- **Brute-Force & Lockout Protection**: Automatic 15-minute account lockout after 5 consecutive failed login attempts + endpoint rate limiting.
- **Security Protections**: HTTP-only SameSite cookies, password hashing with `bcryptjs` (12 rounds), CORS credentials support, and Helmet headers.
- **Strict Validation**: Request payload, query, and parameter validation powered by Zod schemas.

---

## 📖 Interactive Swagger API Documentation

Interactive OpenAPI 3.0 documentation is built right into the application:

- **Swagger UI Endpoint**: `http://localhost:5000/docs`
- **Raw OpenAPI JSON Spec**: `http://localhost:5000/docs/json`

Simply start the server with `npm run dev` and navigate to `http://localhost:5000/docs` in your browser to test every API endpoint interactively, inspect schemas, and view authentication requirements.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (ES Modules, TypeScript 5+)
- **Framework**: Express.js 5
- **Documentation**: Swagger UI (`swagger-ui-express`, OpenAPI 3.0)
- **Database ORM**: Drizzle ORM (PostgreSQL driver: `pg`)
- **Validation**: Zod
- **Security**: JWT (`jsonwebtoken`), `bcryptjs`, `helmet`, `express-rate-limit`, `cookie-parser`
- **Tooling**: `tsx`, `drizzle-kit`, `prettier`, `eslint`

---

## ⚙️ Prerequisites

Before running the application, ensure you have installed:

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: Running instance (Local or Cloud e.g., Supabase, Neon, Railway)

---

## 📥 Installation & Setup

1. **Clone the repository & navigate to backend**:

   ```bash
   cd backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

4. **Initialize Database Schema**:
   Start the Docker PostgreSQL database first:

   ```bash
   docker compose up -d
   ```

   The database is available at `localhost:5437`.
   Push Drizzle table definitions to PostgreSQL:

   ```bash
   npm run db:push
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The API server will run on `http://localhost:5000`. Access Swagger UI at `http://localhost:5000/docs`.

---

## 🔑 Environment Variables

All environment variables are validated at startup using Zod in `@/config/env.ts`.

| Variable                 | Description                                       | Default Value                                       | Required        |
| :----------------------- | :------------------------------------------------ | :-------------------------------------------------- | :-------------- |
| `PORT`                   | HTTP server port                                  | `5000`                                              | No              |
| `NODE_ENV`               | Environment (`development`, `production`, `test`) | `development`                                       | No              |
| `CLIENT_URL`             | Frontend URL for CORS & OAuth redirects           | `http://localhost:3000`                             | Yes             |
| `DATABASE_URL`           | PostgreSQL connection URI                         | `postgresql://...`                                  | Yes             |
| `JWT_ACCESS_SECRET`      | Secret key for signing Access Tokens              | -                                                   | Yes             |
| `JWT_ACCESS_EXPIRATION`  | Access token lifespan                             | `15m`                                               | No              |
| `JWT_REFRESH_SECRET`     | Secret key for Refresh Token validation           | -                                                   | Yes             |
| `JWT_REFRESH_EXPIRATION` | Refresh token lifespan                            | `7d`                                                | No              |
| `COOKIE_SECRET`          | Secret for signed cookies                         | -                                                   | Yes             |
| `GOOGLE_CLIENT_ID`       | Google OAuth 2.0 Client ID                        | -                                                   | For Google Auth |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth 2.0 Client Secret                    | -                                                   | For Google Auth |
| `GOOGLE_CALLBACK_URL`    | Google OAuth redirect URI                         | `http://localhost:5000/api/v1/auth/google/callback` | For Google Auth |
| `GITHUB_CLIENT_ID`       | GitHub OAuth Client ID                            | -                                                   | For GitHub Auth |
| `GITHUB_CLIENT_SECRET`   | GitHub OAuth Client Secret                        | -                                                   | For GitHub Auth |
| `GITHUB_CALLBACK_URL`    | GitHub OAuth redirect URI                         | `http://localhost:5000/api/v1/auth/github/callback` | For GitHub Auth |
| `ENABLE_OAUTH_AUTH`      | Master switch for OAuth authentication            | `false`                                             | Yes            |
| `ENABLE_GOOGLE_AUTH`     | Enable Google authentication independently         | `false`                                             | Yes            |
| `ENABLE_GITHUB_AUTH`     | Enable GitHub authentication independently         | `false`                                             | Yes            |

---

## 🗄️ Database Setup & Migrations

Drizzle ORM is configured in `drizzle.config.ts`.

- **Push Schema directly to DB** (Recommended for development):

  ```bash
  npm run db:push
  ```

- **Generate SQL Migrations**:

  ```bash
  npm run db:generate
  ```

- **Run Pending Migrations**:

  ```bash
  npm run db:migrate
  ```

- **Open Drizzle Studio (Database GUI)**:
  ```bash
  npm run db:studio
  ```

---

## 📜 npm Scripts Reference

Here is a quick reference of all available npm commands in `package.json` and what they do:

| Script Command         | Description                                                                 |
| :--------------------- | :-------------------------------------------------------------------------- |
| `npm run dev`          | Starts development server with live reload via `tsx watch`.                 |
| `npm run build`        | Compiles TypeScript files into production JavaScript in `dist/`.            |
| `npm run start`        | Runs the compiled production code from `dist/server.js`.                    |
| `npm run typecheck`    | Validates TypeScript types without producing output files (`tsc --noEmit`). |
| `npm run format`       | Automatically formats all codebase files using Prettier.                    |
| `npm run format:check` | Verifies code style compliance without changing files.                      |
| `npm run lint`         | Lints source files using ESLint.                                            |
| `npm run lint:fix`     | Runs ESLint and automatically fixes fixable lint issues.                    |
| `npm run check`        | Sequential check runner: typecheck -> lint -> format check.                 |
| `npm run db:push`      | Directly updates PostgreSQL tables to match Drizzle schema definitions.     |
| `npm run db:generate`  | Creates new SQL migration scripts inside `drizzle/`.                        |
| `npm run db:migrate`   | Applies pending migration files to the database.                            |
| `npm run db:studio`    | Launches Drizzle Studio Web UI on `localhost:4983` to view DB records.      |
| `npm run clean`        | Deletes the `dist/` build directory.                                        |
| `npm run rebuild`      | Cleans `dist/` and runs a fresh production build.                           |

---

## 📁 Project Directory Structure

```
backend/
├── drizzle.config.ts            # Drizzle Kit config
├── eslint.config.js             # ESLint config
├── tsconfig.json                # TypeScript NodeNext configuration
├── .env.example                 # Env variables template
├── .gitattributes               # Line endings enforcement (LF)
├── README.md                    # Project documentation
├── src/
│   ├── app.ts                   # Express app setup (Middlewares, routes, 404, error handler)
│   ├── server.ts                # Server entry point listener
│   ├── config/
│   │   ├── db.ts                # PostgreSQL Pool connection
│   │   ├── env.ts               # Zod validated configuration
│   │   └── swagger.ts           # OpenAPI 3.0 Specification & Swagger UI setup
│   ├── db/
│   │   ├── index.ts             # Drizzle client instance
│   │   └── schema/              # Database Table Definitions
│   │       ├── users.ts         # User profiles & lockout counters
│   │       ├── accounts.ts      # OAuth provider links
│   │       ├── refresh-tokens.ts# Refresh token rotation tracking
│   │       ├── password-resets.ts# Password reset tokens
│   │       └── index.ts
│   ├── middlewares/
│   │   ├── auth.ts              # JWT verify (`authenticate`) & Role check (`authorize`)
│   │   ├── validate.ts          # Zod schema validation
│   │   ├── rate-limiter.ts      # Auth endpoint rate limiting
│   │   └── error.ts             # Global error handler
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts # Route handlers & cookie setters
│   │   │   ├── auth.service.ts    # Authentication business logic
│   │   │   ├── auth.routes.ts     # Express router for `/api/v1/auth`
│   │   │   ├── auth.schema.ts     # Zod request validation schemas
│   │   │   └── oauth/
│   │   │       ├── google.service.ts # Google OAuth code/ID token handlers
│   │   │       └── github.service.ts # GitHub OAuth & private email fallback
│   │   └── user/
│   │       ├── user.controller.ts # User profile handlers
│   │       ├── user.service.ts    # User database service
│   │       ├── user.routes.ts     # Express router for `/api/v1/users`
│   │       └── user.schema.ts     # Zod user schemas
│   └── shared/
│       ├── errors/
│       │   └── api-error.ts     # Custom ApiError class
│       ├── types/
│       │   └── index.ts         # Global TypeScript interfaces
│       └── utils/
│           ├── api-response.ts  # Standardized response helper
│           └── async-handler.ts # Async controller wrapper
```

---

## 📡 API Endpoints Summary

Access interactive testing for all endpoints at `http://localhost:5000/docs`.

### 🔐 Authentication Routes (`/api/v1/auth`)

- `POST /api/v1/auth/register`: Register new user with email, password, name
- `POST /api/v1/auth/login`: Authenticate email and password
- `POST /api/v1/auth/refresh`: Rotate refresh token for new access token
- `POST /api/v1/auth/logout`: Revoke active refresh token session
- `POST /api/v1/auth/forgot-password`: Request password reset token
- `POST /api/v1/auth/reset-password`: Reset password using token
- `GET /api/v1/auth/google`: Get Google OAuth consent URL
- `GET /api/v1/auth/google/callback`: Handle Google OAuth callback
- `POST /api/v1/auth/google/token`: Direct SPA Google token/code exchange
- `GET /api/v1/auth/github`: Get GitHub OAuth authorization URL
- `GET /api/v1/auth/github/callback`: Handle GitHub OAuth callback
- `POST /api/v1/auth/github/token`: Direct SPA GitHub code exchange

### 👤 User Profile Routes (`/api/v1/users`)

- `GET /api/v1/users/me`: Fetch authenticated user profile & linked providers (Requires `Bearer <token>`)
- `PATCH /api/v1/users/me`: Update name or avatar URL (Requires `Bearer <token>`)
- `POST /api/v1/users/change-password`: Change user password (Requires `Bearer <token>`)

---

## 🔒 Security & Edge-Case Architecture

1. **Token Reuse Detection (Theft Prevention)**:
   - Refresh tokens are assigned a `familyId`.
   - When a token is refreshed, the old token is marked `isRevoked = true`.
   - If an attacker attempts to reuse an old revoked token, the system detects theft and **immediately revokes all active sessions** for that family.

2. **Account Lockout Protection**:
   - Accounts track `failedLoginAttempts`.
   - 5 consecutive invalid password attempts lock the account for 15 minutes (`lockoutUntil`).

3. **Automatic Account Linking**:
   - Logging in via Google or GitHub checks if the user's verified email matches an existing account.
   - If a match is found, the social account is automatically linked to the user account in the `accounts` table.

4. **GitHub Private Primary Email**:
   - Handles cases where a user's GitHub profile email is set to private by querying GitHub's `/user/emails` API for primary verified emails.

---

## 🎨 Code Style & Formatting

- Path alias `@/` is configured in `tsconfig.json` to map `./src/*`.
- Formatting is enforced via **Prettier** with **LF line endings** (`npm run format`).
- Strict TypeScript typechecking (`npm run typecheck`).
