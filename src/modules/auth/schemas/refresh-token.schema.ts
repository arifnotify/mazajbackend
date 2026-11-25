import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Schema as MongooseSchema,
  Types,
} from 'mongoose';

export type RefreshTokenDocument =
  HydratedDocument<RefreshToken>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class RefreshToken {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  tokenId: string;

  @Prop({
    type: String,
    required: true,
  })
  tokenHash: string;

  @Prop({
    type: Date,
    required: true,
    expires: 0,
  })
  expiresAt: Date;
}

export const RefreshTokenSchema =
  SchemaFactory.createForClass(RefreshToken);