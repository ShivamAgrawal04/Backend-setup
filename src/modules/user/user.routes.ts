// src/modules/user/user.routes.ts

import { Router } from 'express';
import { UserController } from '@/modules/user/user.controller.js';
import { authenticate } from '@/middlewares/auth.js';
import { validate } from '@/middlewares/validate.js';
import { asyncHandler } from '@/shared/utils/async-handler.js';
import { updateProfileSchema, changePasswordSchema } from '@/modules/user/user.schema.js';

const router = Router();

router.get('/me', authenticate, asyncHandler(UserController.getMe));

router.patch(
  '/me',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(UserController.updateMe),
);

router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(UserController.changePassword),
);

export default router;
