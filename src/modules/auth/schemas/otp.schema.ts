import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Otp {
  @Prop({
    type: String,
    required: true,
    index: true,
  })
  phone: string;

  @Prop({
    type: String,
    required: true,
  })
  otpHash: string;

  @Prop({
    type: Date,
    required: true,
    expires: 0,
  })
  expiresAt: Date;

  @Prop({
    type: Number,
    default: 0,
  })
  attempts: number;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);