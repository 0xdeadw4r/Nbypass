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

export interface IUid extends Document {
  _id: string;
  userId: string;
  uidValue: string;
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

const UidSchema = new Schema<IUid>({
  userId: { type: String, required: true, index: true },
  uidValue: { type: String, required: true },
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
export const UidModel = mongoose.model<IUid>('Uid', UidSchema);
export const ActivityLogModel = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
