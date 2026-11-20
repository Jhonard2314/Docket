import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import prisma from './db';

/**
 * Better Auth instance.
 *
 * Public sign-up is DISABLED — only administrators may create accounts via the
 * admin plugin's server API or the seeding procedure.
 *
 * The admin plugin exposes protected account-management endpoints that our
 * own /api/admin/users route delegates to.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret:  process.env.BETTER_AUTH_SECRET ?? 'dev_secret_change_in_prod',

  emailAndPassword: {
    enabled:                    true,
    requireEmailVerification:   false,
    // Disable public registration — accounts are created by administrators only.
    disableSignUp:              process.env.NODE_ENV === 'production',
  },

  session: {
    expiresIn:   60 * 60 * 8,   // 8 hours
    updateAge:   60 * 60,        // extend every hour of activity
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  user: {
    additionalFields: {
      role: {
        type:         'string',
        defaultValue: 'EMPLOYEE',
        input:        false,     // clients cannot choose their role on sign-up
      },
      isActive: {
        type:         'boolean',
        defaultValue: true,
        input:        false,
      },
      departmentId: {
        type:    'string',
        input:   false,
        required: false,
      },
    },
  },

  plugins: [
    // Admin plugin: exposes /api/auth/admin/* for server-side account management.
    admin(),
  ],
});
