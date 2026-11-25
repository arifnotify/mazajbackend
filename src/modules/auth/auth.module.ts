import { Module } from '@nestjs/common';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { JwtStrategy } from './strategies/jwt.strategy';

import {
  Otp,
  OtpSchema,
} from './schemas/otp.schema';

import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refresh-token.schema';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,

    UsersModule,

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    MongooseModule.forFeature([
      {
        name: Otp.name,
        schema: OtpSchema,
      },
      {
        name: RefreshToken.name,
        schema: RefreshTokenSchema,
      },
    ]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>(
          'JWT_ACCESS_SECRET',
        ),

        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
  ],

  exports: [
    AuthService,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}