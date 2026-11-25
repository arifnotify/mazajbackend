import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import {
  randomBytes,
  randomInt,
  randomUUID,
} from 'crypto';

import {
  Otp,
  OtpDocument,
} from './schemas/otp.schema';

import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';

import { UsersService } from '../users/users.service';

import { UserStatus } from '../../shared/enums/user-status.enum';

@Injectable()
export class AuthService {
  private readonly refreshTokenDays = 30;

  constructor(
    @InjectModel(Otp.name)
    private readonly otpModel: Model<OtpDocument>,

    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,

    private readonly usersService: UsersService,

    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,
  ) {}

  // Generate Access + Refresh Tokens
  private async generateTokens(user: any) {
    const payload = {
      sub: user._id.toString(),
      phone: user.phone,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(
      payload,
    );

    const tokenId = randomUUID();

    const tokenSecret = randomBytes(64).toString('hex');

    const refreshToken = `${tokenId}.${tokenSecret}`;

    const tokenHash = await bcrypt.hash(
      tokenSecret,
      10,
    );

    const expiresAt = new Date(
      Date.now() +
        this.refreshTokenDays * 24 * 60 * 60 * 1000,
    );

    await this.refreshTokenModel.create({
      userId: user._id,
      tokenId,
      tokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshExpiresIn:
        this.refreshTokenDays * 24 * 60 * 60,
    };
  }

  // Request OTP
  async requestOtp(phone: string) {
    const environment =
      this.configService.get<string>('NODE_ENV');

    if (environment === 'production') {
      throw new ServiceUnavailableException(
        'Production SMS provider is not configured yet',
      );
    }

    await this.otpModel.deleteMany({ phone }).exec();

    const otp = randomInt(100000, 1000000).toString();

    const otpHash = await bcrypt.hash(otp, 10);

    const ttlMinutes = Number(
      this.configService.get('OTP_TTL_MINUTES', 5),
    );

    const expiresAt = new Date(
      Date.now() + ttlMinutes * 60 * 1000,
    );

    await this.otpModel.create({
      phone,
      otpHash,
      expiresAt,
      attempts: 0,
    });

    return {
      success: true,
      message: 'Development OTP generated successfully',
      expiresIn: ttlMinutes * 60,
      developmentOtp: otp,
    };
  }

  // Verify OTP and Login
  async verifyOtp(phone: string, otp: string) {
    const otpRecord = await this.otpModel
      .findOne({ phone })
      .exec();

    if (!otpRecord) {
      throw new UnauthorizedException(
        'OTP not found or expired',
      );
    }

    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      await otpRecord.deleteOne();

      throw new UnauthorizedException('OTP expired');
    }

    if (otpRecord.attempts >= 5) {
      await otpRecord.deleteOne();

      throw new UnauthorizedException(
        'Maximum OTP attempts exceeded',
      );
    }

    const isValid = await bcrypt.compare(
      otp,
      otpRecord.otpHash,
    );

    if (!isValid) {
      otpRecord.attempts += 1;

      if (otpRecord.attempts >= 5) {
        await otpRecord.deleteOne();

        throw new UnauthorizedException(
          'Maximum OTP attempts exceeded',
        );
      }

      await otpRecord.save();

      throw new UnauthorizedException('Invalid OTP');
    }

    await otpRecord.deleteOne();

    let user = await this.usersService.findByPhone(phone);

    if (!user) {
      user = await this.usersService.createUser(phone);
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException(
        'Your account has been blocked',
      );
    }

    user.isPhoneVerified = true;
    user.lastLoginAt = new Date();

    await user.save();

    const tokens = await this.generateTokens(user);

    return {
      success: true,
      message: 'Login successful',
      data: {
        ...tokens,
        user: {
          id: user._id.toString(),
          phone: user.phone,
          name: user.name,
          role: user.role,
          isPhoneVerified: user.isPhoneVerified,
        },
      },
    };
  }

  // Refresh Access Token and Rotate Refresh Token
  async refreshTokens(refreshToken: string) {
    const parts = refreshToken.split('.');

    if (parts.length !== 2) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const [tokenId, tokenSecret] = parts;

    const tokenRecord = await this.refreshTokenModel
      .findOne({ tokenId })
      .exec();

    if (!tokenRecord) {
      throw new UnauthorizedException(
        'Refresh token expired or revoked',
      );
    }

    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      await tokenRecord.deleteOne();

      throw new UnauthorizedException(
        'Refresh token expired',
      );
    }

    const isValid = await bcrypt.compare(
      tokenSecret,
      tokenRecord.tokenHash,
    );

    if (!isValid) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const user = await this.usersService.findById(
      tokenRecord.userId.toString(),
    );

    if (!user || user.status === UserStatus.BLOCKED) {
      await tokenRecord.deleteOne();

      throw new UnauthorizedException(
        'User account is unavailable',
      );
    }

    // Atomically consume the old token.
    const consumed = await this.refreshTokenModel
      .findOneAndDelete({
        _id: tokenRecord._id,
      })
      .exec();

    if (!consumed) {
      throw new UnauthorizedException(
        'Refresh token has already been used',
      );
    }

    const tokens = await this.generateTokens(user);

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    };
  }

  // Logout Current Device
  async logout(refreshToken: string) {
    const parts = refreshToken.split('.');

    if (parts.length !== 2) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const [tokenId, tokenSecret] = parts;

    const tokenRecord = await this.refreshTokenModel
      .findOne({ tokenId })
      .exec();

    if (!tokenRecord) {
      throw new UnauthorizedException(
        'Refresh token already revoked or expired',
      );
    }

    const isValid = await bcrypt.compare(
      tokenSecret,
      tokenRecord.tokenHash,
    );

    if (!isValid) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    await this.refreshTokenModel
      .findOneAndDelete({
        _id: tokenRecord._id,
      })
      .exec();

    return {
      success: true,
      message: 'Logout successful',
    };
  }
}