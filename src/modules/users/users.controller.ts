import {
  Controller,
  Get,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() currentUser: any) {
    const user = await this.usersService.findById(
      currentUser.userId,
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        id: user._id.toString(),
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.status,
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt,
      },
    };
  }
}