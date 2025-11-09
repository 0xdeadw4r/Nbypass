import { 
  type User, 
  type InsertUser,
  type Settings,
  type InsertSettings,
  type Uid,
  type CreateUid,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { UserModel, SettingsModel, UidModel, ActivityLogModel } from "./mongodb-models";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserCredits(userId: string, newCredits: string): Promise<void>;
  updateUserStatus(userId: string, isActive: boolean): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
  
  createUid(uid: CreateUid): Promise<Uid>;
  getUid(uidId: string): Promise<Uid | undefined>;
  getUserUids(userId: string): Promise<Uid[]>;
  getAllUids(): Promise<Uid[]>;
  deleteUid(uidId: string): Promise<void>;
  updateUid(uidId: string, status: string): Promise<void>;
  updateUidValue(uidId: string, newUidValue: string): Promise<void>;
  
  logActivity(log: InsertActivityLog): Promise<void>;
  getUserActivity(userId: string, limit?: number): Promise<ActivityLog[]>;
  getAllActivity(limit?: number): Promise<ActivityLog[]>;
  cleanupOldActivityLogs(daysOld?: number): Promise<number>;
}

function convertMongoDoc(doc: any): any {
  if (!doc) return undefined;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    id: obj._id.toString(),
    _id: undefined,
  };
}

export class MongoDBStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id);
    if (!user) return undefined;
    const userObj = convertMongoDoc(user);
    return {
      id: userObj.id,
      username: userObj.username,
      password: userObj.password,
      isOwner: userObj.isOwner,
      credits: userObj.credits.toString(),
      isActive: userObj.isActive,
      createdAt: userObj.createdAt,
      lastActive: userObj.lastActive || null,
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username });
    if (!user) return undefined;
    const userObj = convertMongoDoc(user);
    return {
      id: userObj.id,
      username: userObj.username,
      password: userObj.password,
      isOwner: userObj.isOwner,
      credits: userObj.credits.toString(),
      isActive: userObj.isActive,
      createdAt: userObj.createdAt,
      lastActive: userObj.lastActive || null,
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = await UserModel.create({
      username: insertUser.username,
      password: insertUser.password,
      isOwner: insertUser.isOwner || false,
      credits: parseFloat(insertUser.credits || "0"),
      isActive: true,
      createdAt: new Date(),
    });
    const userObj = convertMongoDoc(user);
    return {
      id: userObj.id,
      username: userObj.username,
      password: userObj.password,
      isOwner: userObj.isOwner,
      credits: userObj.credits.toString(),
      isActive: userObj.isActive,
      createdAt: userObj.createdAt,
      lastActive: userObj.lastActive || null,
    };
  }

  async getAllUsers(): Promise<User[]> {
    const users = await UserModel.find({ isOwner: false }).sort({ createdAt: -1 });
    return users.map(user => {
      const userObj = convertMongoDoc(user);
      return {
        id: userObj.id,
        username: userObj.username,
        password: userObj.password,
        isOwner: userObj.isOwner,
        credits: userObj.credits.toString(),
        isActive: userObj.isActive,
        createdAt: userObj.createdAt,
        lastActive: userObj.lastActive || null,
      };
    });
  }

  async updateUserCredits(userId: string, newCredits: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { credits: parseFloat(newCredits) });
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { isActive });
  }

  async deleteUser(userId: string): Promise<void> {
    await UserModel.findByIdAndDelete(userId);
    await UidModel.deleteMany({ userId });
    await ActivityLogModel.deleteMany({ userId });
  }

  async getSettings(): Promise<Settings | undefined> {
    const settings = await SettingsModel.findOne();
    if (!settings) return undefined;
    const settingsObj = convertMongoDoc(settings);
    return {
      id: settingsObj.id,
      baseUrl: settingsObj.baseUrl || null,
      apiKey: settingsObj.apiKey || null,
      updatedAt: settingsObj.updatedAt,
    };
  }

  async updateSettings(insertSettings: InsertSettings): Promise<Settings> {
    const existing = await SettingsModel.findOne();
    
    let settings;
    if (existing) {
      settings = await SettingsModel.findByIdAndUpdate(
        existing._id,
        { ...insertSettings, updatedAt: new Date() },
        { new: true }
      );
    } else {
      settings = await SettingsModel.create({
        ...insertSettings,
        updatedAt: new Date(),
      });
    }
    
    const settingsObj = convertMongoDoc(settings);
    return {
      id: settingsObj.id,
      baseUrl: settingsObj.baseUrl || null,
      apiKey: settingsObj.apiKey || null,
      updatedAt: settingsObj.updatedAt,
    };
  }

  async createUid(createUid: CreateUid): Promise<Uid> {
    const uid = await UidModel.create({
      userId: createUid.userId,
      uidValue: createUid.uidValue,
      duration: createUid.duration,
      cost: parseFloat(createUid.cost as any),
      status: 'active',
      createdAt: new Date(),
      expiresAt: createUid.expiresAt,
    });
    const uidObj = convertMongoDoc(uid);
    return {
      id: uidObj.id,
      userId: uidObj.userId,
      uidValue: uidObj.uidValue,
      duration: uidObj.duration,
      cost: uidObj.cost.toString(),
      status: uidObj.status,
      createdAt: uidObj.createdAt,
      expiresAt: uidObj.expiresAt,
    };
  }

  async getUid(uidId: string): Promise<Uid | undefined> {
    const uid = await UidModel.findById(uidId);
    if (!uid) return undefined;
    const uidObj = convertMongoDoc(uid);
    return {
      id: uidObj.id,
      userId: uidObj.userId,
      uidValue: uidObj.uidValue,
      duration: uidObj.duration,
      cost: uidObj.cost.toString(),
      status: uidObj.status,
      createdAt: uidObj.createdAt,
      expiresAt: uidObj.expiresAt,
    };
  }

  async getUserUids(userId: string): Promise<Uid[]> {
    const uids = await UidModel.find({ userId }).sort({ createdAt: -1 });
    return uids.map(uid => {
      const uidObj = convertMongoDoc(uid);
      return {
        id: uidObj.id,
        userId: uidObj.userId,
        uidValue: uidObj.uidValue,
        duration: uidObj.duration,
        cost: uidObj.cost.toString(),
        status: uidObj.status,
        createdAt: uidObj.createdAt,
        expiresAt: uidObj.expiresAt,
      };
    });
  }

  async getAllUids(): Promise<Uid[]> {
    const uids = await UidModel.find().sort({ createdAt: -1 });
    return uids.map(uid => {
      const uidObj = convertMongoDoc(uid);
      return {
        id: uidObj.id,
        userId: uidObj.userId,
        uidValue: uidObj.uidValue,
        duration: uidObj.duration,
        cost: uidObj.cost.toString(),
        status: uidObj.status,
        createdAt: uidObj.createdAt,
        expiresAt: uidObj.expiresAt,
      };
    });
  }

  async deleteUid(uidId: string): Promise<void> {
    await UidModel.findByIdAndDelete(uidId);
  }

  async updateUid(uidId: string, status: string): Promise<void> {
    await UidModel.findByIdAndUpdate(uidId, { status });
  }

  async updateUidValue(uidId: string, newUidValue: string): Promise<void> {
    await UidModel.findByIdAndUpdate(uidId, { uidValue: newUidValue });
  }

  async logActivity(insertLog: InsertActivityLog): Promise<void> {
    await ActivityLogModel.create({
      userId: insertLog.userId,
      action: insertLog.action,
      details: insertLog.details,
      createdAt: new Date(),
    });
  }

  async getUserActivity(userId: string, limit: number = 10): Promise<ActivityLog[]> {
    const logs = await ActivityLogModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return logs.map(log => {
      const logObj = convertMongoDoc(log);
      return {
        id: logObj.id,
        userId: logObj.userId,
        action: logObj.action,
        details: logObj.details || null,
        createdAt: logObj.createdAt,
      };
    });
  }

  async getAllActivity(limit: number = 50): Promise<ActivityLog[]> {
    const logs = await ActivityLogModel.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return logs.map(log => {
      const logObj = convertMongoDoc(log);
      return {
        id: logObj.id,
        userId: logObj.userId,
        action: logObj.action,
        details: logObj.details || null,
        createdAt: logObj.createdAt,
      };
    });
  }

  async cleanupOldActivityLogs(daysOld: number = 2): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await ActivityLogModel.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    return result.deletedCount || 0;
  }
}

export const storage = new MongoDBStorage();
