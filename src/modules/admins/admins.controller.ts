
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Headers,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';

import { AdminAuthService } from './admin-auth.service';
import { AdminsService } from './admins.service';

import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminSetupDto } from './dto/admin-setup.dto';

import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';

@Controller('admins')
export class AdminsController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly adminsService: AdminsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('setup')
  async setup(
    @Body() setupDto: AdminSetupDto,
    @Headers('x-admin-setup-key') setupKey: string,
  ) {
    const expectedKey = this.configService.get<string>(
      'ADMIN_SETUP_KEY',
    );

    if (!expectedKey) {
      throw new ServiceUnavailableException(
        'Admin setup is not configured',
      );
    }

    if (
      !setupKey ||
      Buffer.byteLength(setupKey) !== Buffer.byteLength(expectedKey) ||
      !timingSafeEqual(
        Buffer.from(setupKey),
        Buffer.from(expectedKey),
      )
    ) {
      throw new UnauthorizedException(
        'Invalid admin setup key',
      );
    }

    const admin = await this.adminsService.createFirstSuperAdmin({
      email: setupDto.email,
      password: setupDto.password,
      name: setupDto.name,
    });

    return {
      success: true,
      message: 'Super Admin created successfully',
      data: admin,
    };
  }

  @Post('login')
  async login(@Body() loginDto: AdminLoginDto) {
    const result = await this.adminAuthService.login(
      loginDto.email,
      loginDto.password,
    );

    return {
      success: true,
      message: 'Admin login successful',
      data: result,
    };
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    const profile = await this.adminsService.getAdminProfile(
      req.user.adminId,
    );

    return {
      success: true,
      message: 'Admin profile retrieved successfully',
      data: profile,
    };
  }
}
