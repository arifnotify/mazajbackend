import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { AdminAuthService } from './admin-auth.service';

import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';

import { Admin, AdminSchema } from './schemas/admin.schema';

import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    ConfigModule,

    MongooseModule.forFeature([
      {
        name: Admin.name,
        schema: AdminSchema,
      },
    ]),
  ],

  controllers: [AdminsController],

  providers: [
    AdminsService,
    AdminAuthService,
    AdminJwtStrategy,
    AdminJwtAuthGuard,
  ],

  exports: [
    AdminsService,
    AdminAuthService,
    AdminJwtAuthGuard,
    MongooseModule,
  ],
})
export class AdminsModule {}