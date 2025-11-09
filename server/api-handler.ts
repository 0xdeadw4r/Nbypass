import type { Express, Request, Response, NextFunction } from "express";
import { ApiKeyModel, UidModel, PlanModel, UserModel, ActivityLogModel } from "./mongodb-models";
import crypto from "crypto";

interface AuthenticatedRequest extends Request {
  apiKeyDoc?: any;
  apiUserId?: string;
}

async function verifyApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(401).json({ error: "Unauthorized - Invalid or missing API key" });
    }

    const apiKeyDoc = await ApiKeyModel.findOne({ apiKey });
    
    if (!apiKeyDoc) {
      return res.status(401).json({ error: "Unauthorized - Invalid API key" });
    }

    if (!apiKeyDoc.isEnabled) {
      return res.status(403).json({ error: "Forbidden - API key is disabled" });
    }

    if (apiKeyDoc.isPaused) {
      return res.status(403).json({ error: "Forbidden - API key is paused" });
    }

    apiKeyDoc.lastUsed = new Date();
    await apiKeyDoc.save();

    req.apiKeyDoc = apiKeyDoc;
    req.apiUserId = apiKeyDoc.userId;
    next();
  } catch (error) {
    console.error("API key verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function fetchPlayerName(uid: string, region: string, baseUrl?: string, apiKey?: string): Promise<string | undefined> {
  if (!baseUrl || !apiKey) {
    return undefined;
  }

  try {
    const response = await fetch(`${baseUrl}/api/player/${uid}?region=${region}`, {
      headers: {
        'X-API-Key': apiKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.playerName || data.name;
    }
  } catch (error) {
    console.error("Error fetching player name:", error);
  }

  return undefined;
}

export function registerApiHandler(app: Express) {
  app.post("/api/handler", verifyApiKey, async (req: AuthenticatedRequest, res: Response) => {
    const action = req.query.action || req.body.action;

    try {
      switch (action) {
        case "add_uid_free_api":
          return await handleAddUidFree(req, res);
        case "add_uid_api":
          return await handleAddUid(req, res);
        case "remove_uid_api":
          return await handleRemoveUid(req, res);
        case "renew_uid_api":
          return await handleRenewUid(req, res);
        default:
          return res.status(400).json({ error: "Invalid action" });
      }
    } catch (error: any) {
      console.error("API handler error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/handler", verifyApiKey, async (req: AuthenticatedRequest, res: Response) => {
    const action = req.query.action;

    try {
      switch (action) {
        case "list_uids_api":
          return await handleListUids(req, res);
        default:
          return res.status(400).json({ error: "Invalid action" });
      }
    } catch (error: any) {
      console.error("API handler error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
}

async function handleAddUidFree(req: AuthenticatedRequest, res: Response) {
  const { uid, region = 'PK' } = req.body;

  if (!uid) {
    return res.status(400).json({ error: "UID is required" });
  }

  const apiKeyDoc = req.apiKeyDoc;
  const userId = req.apiUserId!;

  if (apiKeyDoc.uidLimit) {
    const currentUidCount = await UidModel.countDocuments({ 
      apiKeyId: apiKeyDoc._id.toString(),
      status: 'active'
    });
    
    if (currentUidCount >= apiKeyDoc.uidLimit) {
      return res.status(403).json({ error: "UID limit reached for this API key" });
    }
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const settings = await require('./storage').storage.getSettings();
  const playerName = await fetchPlayerName(uid, region, settings?.baseUrl, settings?.apiKey);

  const duration = 24;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + duration);

  const newUid = new UidModel({
    userId,
    apiKeyId: apiKeyDoc._id.toString(),
    uidValue: uid,
    playerName,
    region,
    planId: 1,
    duration,
    cost: 0,
    status: 'active',
    expiresAt,
  });

  await newUid.save();

  await ActivityLogModel.create({
    userId,
    action: 'create_uid_api_free',
    details: `UID ${uid} created via API (FREE - 1 day)`,
  });

  res.json({
    success: true,
    message: "UID added successfully (FREE - 1 day)",
    data: {
      uid_id: newUid._id.toString(),
      uid: newUid.uidValue,
      player_name: newUid.playerName,
      region: newUid.region,
      plan: {
        id: 1,
        name: "1 day",
        days: 1
      },
      start_date: newUid.createdAt.toISOString().split('T')[0],
      expire_date: newUid.expiresAt.toISOString().split('T')[0],
      credits_used: 0,
      credits_remaining: user.credits
    }
  });
}

async function handleAddUid(req: AuthenticatedRequest, res: Response) {
  const { uid, plan_id, region = 'PK' } = req.body;

  if (!uid || !plan_id) {
    return res.status(400).json({ error: "UID and plan_id are required" });
  }

  const apiKeyDoc = req.apiKeyDoc;
  const userId = req.apiUserId!;

  if (apiKeyDoc.allowedPlans && apiKeyDoc.allowedPlans.length > 0) {
    if (!apiKeyDoc.allowedPlans.includes(plan_id)) {
      return res.status(403).json({ error: "This plan is not allowed for this API key" });
    }
  }

  if (apiKeyDoc.uidLimit) {
    const currentUidCount = await UidModel.countDocuments({ 
      apiKeyId: apiKeyDoc._id.toString(),
      status: 'active'
    });
    
    if (currentUidCount >= apiKeyDoc.uidLimit) {
      return res.status(403).json({ error: "UID limit reached for this API key" });
    }
  }

  const plan = await PlanModel.findOne({ code: plan_id, isActive: true });
  if (!plan) {
    return res.status(404).json({ error: "Plan not found or inactive" });
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.credits < plan.creditsCost) {
    return res.status(400).json({ error: "Insufficient credits" });
  }

  const settings = await require('./storage').storage.getSettings();
  const playerName = await fetchPlayerName(uid, region, settings?.baseUrl, settings?.apiKey);

  const duration = plan.days * 24;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + duration);

  user.credits -= plan.creditsCost;
  await user.save();

  const newUid = new UidModel({
    userId,
    apiKeyId: apiKeyDoc._id.toString(),
    uidValue: uid,
    playerName,
    region,
    planId: plan_id,
    duration,
    cost: plan.creditsCost,
    status: 'active',
    expiresAt,
  });

  await newUid.save();

  await ActivityLogModel.create({
    userId,
    action: 'create_uid_api',
    details: `UID ${uid} created via API with plan ${plan.name}`,
  });

  res.json({
    success: true,
    message: "UID added successfully",
    data: {
      uid_id: newUid._id.toString(),
      uid: newUid.uidValue,
      player_name: newUid.playerName,
      region: newUid.region,
      plan: {
        id: plan_id,
        name: plan.name,
        days: plan.days
      },
      start_date: newUid.createdAt.toISOString().split('T')[0],
      expire_date: newUid.expiresAt.toISOString().split('T')[0],
      credits_remaining: user.credits
    }
  });
}

async function handleRemoveUid(req: AuthenticatedRequest, res: Response) {
  const { uid_id, uid } = req.body;

  if (!uid_id && !uid) {
    return res.status(400).json({ error: "Either uid_id or uid is required" });
  }

  const apiKeyDoc = req.apiKeyDoc;

  let uidDoc;
  if (uid_id) {
    uidDoc = await UidModel.findOne({ 
      _id: uid_id, 
      apiKeyId: apiKeyDoc._id.toString()
    });
  } else {
    uidDoc = await UidModel.findOne({ 
      uidValue: uid, 
      apiKeyId: apiKeyDoc._id.toString()
    });
  }

  if (!uidDoc) {
    return res.status(404).json({ error: "UID not found or not created by this API key" });
  }

  uidDoc.status = 'deleted';
  await uidDoc.save();

  await ActivityLogModel.create({
    userId: req.apiUserId!,
    action: 'delete_uid_api',
    details: `UID ${uidDoc.uidValue} deleted via API`,
  });

  res.json({
    success: true,
    message: "UID removed successfully",
    data: {
      uid_id: uidDoc._id.toString(),
      uid: uidDoc.uidValue,
      player_name: uidDoc.playerName
    }
  });
}

async function handleListUids(req: AuthenticatedRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const per_page = Math.min(parseInt(req.query.per_page as string) || 20, 100);
  const status = req.query.status as string;

  const apiKeyDoc = req.apiKeyDoc;

  const query: any = {
    apiKeyId: apiKeyDoc._id.toString(),
  };

  if (status) {
    if (status === 'online') {
      query.status = 'active';
      query.expiresAt = { $gt: new Date() };
    } else if (status === 'offline') {
      query.status = 'active';
    } else if (status === 'expired') {
      query.status = 'expired';
    }
  }

  const total = await UidModel.countDocuments(query);
  const uids = await UidModel.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * per_page)
    .limit(per_page);

  const plans = await PlanModel.find({});
  const planMap = new Map(plans.map(p => [p.code, p]));

  const data = uids.map(u => {
    const plan = planMap.get(u.planId);
    return {
      id: u._id.toString(),
      uid: u.uidValue,
      player_name: u.playerName,
      region: u.region,
      plan_name: plan?.name || 'Unknown',
      start_date: u.createdAt.toISOString().split('T')[0],
      expire_date: u.expiresAt.toISOString().split('T')[0],
      status: u.status === 'active' && u.expiresAt > new Date() ? 'online' : u.status,
      created_at: u.createdAt.toISOString()
    };
  });

  res.json({
    success: true,
    data,
    pagination: {
      page,
      per_page,
      total,
      total_pages: Math.ceil(total / per_page)
    }
  });
}

async function handleRenewUid(req: AuthenticatedRequest, res: Response) {
  const { uid_id, uid, days } = req.body;

  if (!uid_id && !uid) {
    return res.status(400).json({ error: "Either uid_id or uid is required" });
  }

  if (!days || days <= 0) {
    return res.status(400).json({ error: "Days must be a positive number" });
  }

  const apiKeyDoc = req.apiKeyDoc;

  let uidDoc;
  if (uid_id) {
    uidDoc = await UidModel.findOne({ 
      _id: uid_id, 
      apiKeyId: apiKeyDoc._id.toString()
    });
  } else {
    uidDoc = await UidModel.findOne({ 
      uidValue: uid, 
      apiKeyId: apiKeyDoc._id.toString()
    });
  }

  if (!uidDoc) {
    return res.status(404).json({ error: "UID not found or not created by this API key" });
  }

  const oldExpireDate = new Date(uidDoc.expiresAt);
  const newExpireDate = new Date(uidDoc.expiresAt);
  newExpireDate.setDate(newExpireDate.getDate() + days);

  uidDoc.expiresAt = newExpireDate;
  uidDoc.duration += days * 24;
  if (uidDoc.status === 'expired') {
    uidDoc.status = 'active';
  }
  await uidDoc.save();

  await ActivityLogModel.create({
    userId: req.apiUserId!,
    action: 'renew_uid_api',
    details: `UID ${uidDoc.uidValue} renewed for ${days} days via API`,
  });

  res.json({
    success: true,
    message: "UID renewed successfully",
    data: {
      uid_id: uidDoc._id.toString(),
      uid: uidDoc.uidValue,
      player_name: uidDoc.playerName,
      old_expire_date: oldExpireDate.toISOString().split('T')[0],
      new_expire_date: newExpireDate.toISOString().split('T')[0],
      days_added: days
    }
  });
}
