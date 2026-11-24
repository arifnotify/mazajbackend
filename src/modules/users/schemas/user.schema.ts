import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { UserRole } from '../../../shared/enums/user-role.enum';
import { UserStatus } from '../../../shared/enums/user-status.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true,
  })
  phone: string;

  @Prop({
    trim: true,
    maxlength: 100,
    default: null,
  })
  name: string | null;

  @Prop({
    default: false,
  })
  isPhoneVerified: boolean;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Prop({
    type: String,
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Prop({
    default: null,
  })
  lastLoginAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);