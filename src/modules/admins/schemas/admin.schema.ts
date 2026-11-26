import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import { HydratedDocument } from 'mongoose';

import { AdminRole } from '../../../shared/enums/admin-role.enum';
import { AdminStatus } from '../../../shared/enums/admin-status.enum';

export type AdminDocument = HydratedDocument<Admin>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Admin {
  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
    select: false,
  })
  password: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  })
  name: string;

  @Prop({
    type: String,
    enum: AdminRole,
    default: AdminRole.STAFF,
  })
  role: AdminRole;

  @Prop({
    type: String,
    enum: AdminStatus,
    default: AdminStatus.ACTIVE,
  })
  status: AdminStatus;

  @Prop({
    type: Date,
    default: null,
  })
  lastLoginAt: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

export const AdminSchema =
  SchemaFactory.createForClass(Admin);