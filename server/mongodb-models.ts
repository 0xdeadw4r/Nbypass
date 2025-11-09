import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  username: string;
  password: string;
  isOwner: boolean;
  credits: number;
  isActive: boolean;
  createdAt: Date;
  lastActive?: Date;
}

export interface ISettings extends Document {
  _id: string;
  baseUrl?: string;
  apiKey?: string;
  updatedAt: Date;
}

export interface IPlan extends Document {
  _id: string;
  code: number;
  name: string;
  days: number;
  creditsCost: number;
  isActive: boolean;
  createdAt: Date;
}

export interface IApiKey extends Document {
  _id: string;
  userId: string;
  apiKey: string;
  name: string;
  isEnabled: boolean;
  isPaused: boolean;
  uidLimit?: number;
  allowedPlans?: number[];
  createdAt: Date;
  lastUsed?: Date;
}

export interface IUid extends Document {
  _id: string;
  userId: string;
  apiKeyId?: string;
  uidValue: string;
  playerName?: string;
  region: string;
  planId: number;
  duration: number;
  cost: number;
  status: 'active' | 'expired' | 'deleted';
  createdAt: Date;
  expiresAt: Date;
}

export interface IActivityLog extends Document {
  _id: string;
  userId: string;
  action: string;
  details?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isOwner: { type: Boolean, default: false },
  credits: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date },
});

const SettingsSchema = new Schema<ISettings>({
  baseUrl: { type: String },
  apiKey: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

const PlanSchema = new Schema<IPlan>({
  code: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  days: { type: Number, required: true },
  creditsCost: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const ApiKeySchema = new Schema<IApiKey>({
  userId: { type: String, required: true, index: true },
  apiKey: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  isEnabled: { type: Boolean, default: true },
  isPaused: { type: Boolean, default: false },
  uidLimit: { type: Number },
  allowedPlans: [{ type: Number }],
  createdAt: { type: Date, default: Date.now },
  lastUsed: { type: Date },
});

const UidSchema = new Schema<IUid>({
  userId: { type: String, required: true, index: true },
  apiKeyId: { type: String, index: true },
  uidValue: { type: String, required: true },
  playerName: { type: String },
  region: { type: String, required: true, default: 'PK' },
  planId: { type: Number, required: true },
  duration: { type: Number, required: true },
  cost: { type: Number, required: true },
  status: { type: String, enum: ['active', 'expired', 'deleted'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  details: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);
export const SettingsModel = mongoose.model<ISettings>('Settings', SettingsSchema);
export const PlanModel = mongoose.model<IPlan>('Plan', PlanSchema);
export const ApiKeyModel = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
export const UidModel = mongoose.model<IUid>('Uid', UidSchema);
export const ActivityLogModel = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
