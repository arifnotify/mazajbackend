
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';

import {
  Admin,
  AdminDocument,
} from './schemas/admin.schema';

import { AdminRole } from '../../shared/enums/admin-role.enum';

@Injectable()
export class AdminsService {
  constructor(
    @InjectModel(Admin.name)
    private readonly adminModel: Model<AdminDocument>,
  ) {}

  async findByEmail(email: string) {
    return this.adminModel
      .findOne({
        email: email.toLowerCase().trim(),
      })
      .select('+password')
      .exec();
  }

  async findById(adminId: string) {
    return this.adminModel
      .findById(adminId)
      .exec();
  }

  async createAdmin(data: {
    email: string;
    password: string;
    name: string;
    role: AdminRole;
  }) {
    const email = data.email.toLowerCase().trim();

    const existingAdmin = await this.adminModel
      .findOne({ email })
      .exec();

    if (existingAdmin) {
      throw new ConflictException(
        'Admin email already exists',
      );
    }

    const passwordHash = await bcrypt.hash(
      data.password,
      12,
    );

    const admin = await this.adminModel.create({
      email,
      password: passwordHash,
      name: data.name,
      role: data.role,
    });

    return admin;
  }

  async createFirstSuperAdmin(data: {
    email: string;
    password: string;
    name: string;
  }) {
    const adminCount = await this.adminModel
      .countDocuments()
      .exec();

    if (adminCount > 0) {
      throw new ConflictException(
        'Admin setup is already completed',
      );
    }

    const admin = await this.createAdmin({
      email: data.email,
      password: data.password,
      name: data.name,
      role: AdminRole.SUPER_ADMIN,
    });

    return {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      createdAt: admin.createdAt,
    };
  }

  async getAdminProfile(adminId: string) {
    const admin = await this.adminModel
      .findById(adminId)
      .select('-password')
      .exec();

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
    };
  }
}
