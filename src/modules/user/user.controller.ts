// src/modules/user/user.controller.ts

import type { Response } from 'express';
import { UserService } from '@/modules/user/user.service.js';
import { ApiResponse } from '@/shared/utils/api-response.js';
import type { AuthenticatedRequest } from '@/shared/types/index.js';

export class UserController {
  public static getMe = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const profile = await UserService.getProfile(userId);
    res.status(200).json(ApiResponse.success('User profile retrieved', profile));
  };

  public static updateMe = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const updated = await UserService.updateProfile(userId, req.body);
    res.status(200).json(ApiResponse.success('Profile updated successfully', updated));
  };

  public static changePassword = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const result = await UserService.changePassword(userId, req.body);
    res.status(200).json(ApiResponse.success(result.message));
  };
}
