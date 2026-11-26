import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AdminsService } from './admins.service';
import { AdminStatus } from '../../shared/enums/admin-status.enum';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    // Find admin by email
    const admin = await this.adminsService.findByEmail(email);

    if (!admin) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    // Check admin status
    if (admin.status !== AdminStatus.ACTIVE) {
      throw new ForbiddenException(
        'Your admin account is blocked',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      admin.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    // Update last login
    admin.lastLoginAt = new Date();
    await admin.save();

    // Generate access token
    const accessToken = await this.jwtService.signAsync({
      sub: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      type: 'admin',
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
    };
  }
}