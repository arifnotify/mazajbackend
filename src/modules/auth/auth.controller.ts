import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';

import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // Request OTP
  @Post('request-otp')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  async requestOtp(
    @Body() dto: RequestOtpDto,
  ) {
    return this.authService.requestOtp(dto.phone);
  }

  // Verify OTP
  @Post('verify-otp')
  @Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
  ) {
    return this.authService.verifyOtp(
      dto.phone,
      dto.otp,
    );
  }

  // Refresh Token
  @Post('refresh')
  @Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.refreshTokens(
      dto.refreshToken,
    );
  }

  // Logout
  @Post('logout')
  @Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  })
  async logout(
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.logout(
      dto.refreshToken,
    );
  }
}