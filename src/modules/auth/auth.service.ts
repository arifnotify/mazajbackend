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
import { randomInt } from 'crypto';

import { Otp, OtpDocument } from './schemas/otp.schema';

import { UsersService } from '../users/users.service';

import { UserStatus } from '../../shared/enums/user-status.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Otp.name)
    private readonly otpModel: Model<OtpDocument>,

    private readonly usersService: UsersService,

    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,
  ) {}

  async requestOtp(phone: string) {
    const environment =
      this.configService.get<string>('NODE_ENV');

    // Development OTP must never run in production.
    if (environment === 'production') {
      throw new ServiceUnavailableException(
        'Production SMS provider is not configured yet',
      );
    }

    // Remove previous OTP.
    await this.otpModel.deleteMany({ phone }).exec();

    // Generate 6 digit OTP.
    const otp = randomInt(100000, 1000000).toString();

    // Hash OTP before database storage.
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

    // OTP successfully verified.
    await otpRecord.deleteOne();

    let user = await this.usersService.findByPhone(phone);

    // Create new customer if not found.
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

    const payload = {
      sub: user._id.toString(),
      phone: user.phone,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(
      payload,
    );

    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 900,
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
}