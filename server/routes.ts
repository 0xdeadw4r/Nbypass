import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateUser, hashPassword } from "./auth";
import { requireAuth, requireOwner } from "./middleware";
import { UIDBypassClient, UIDBypassError } from "./api-client";
import { registerApiHandler } from "./api-handler";
import { 
  loginSchema, 
  insertUserSchema, 
  updateCreditSchema, 
  insertUidSchema,
  insertSettingsSchema,
  updateUidValueSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  registerApiHandler(app);
  // Authentication - public endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await authenticateUser(credentials);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set session data
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.isOwner = user.isOwner;

      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  // Get current user info
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // All routes below require authentication
  app.use("/api", requireAuth);

  // User operations - owner only
  app.get("/api/users", requireOwner, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      // Remove passwords from response
      const sanitizedUsers = allUsers.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireOwner, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Log activity
      await storage.logActivity({
        userId: req.session.userId!,
        action: "user_created",
        details: `User ${user.username} created by admin`,
      });

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("User creation error:", error);
      if (error.code === "23505") { // Unique constraint violation
        return res.status(409).json({ error: "Username already exists" });
      }
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(400).json({ error: "Failed to create user", details: error.message });
    }
  });

  app.patch("/api/users/:id/credits", requireOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const creditUpdate = updateCreditSchema.parse(req.body);

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentCredits = parseFloat(user.credits);
      let newCredits: number;

      if (creditUpdate.operation === "add") {
        newCredits = currentCredits + creditUpdate.amount;
      } else {
        newCredits = currentCredits - creditUpdate.amount;
        if (newCredits < 0) {
          return res.status(400).json({ error: "Insufficient credits" });
        }
      }

      await storage.updateUserCredits(id, newCredits.toFixed(2));

      // Log activity
      await storage.logActivity({
        userId: req.session.userId!,
        action: `credit_${creditUpdate.operation}`,
        details: `${creditUpdate.operation === "add" ? "Added" : "Deducted"} $${creditUpdate.amount.toFixed(2)} ${creditUpdate.operation === "add" ? "to" : "from"} ${user.username}`,
      });

      res.json({ success: true, newCredits: newCredits.toFixed(2) });
    } catch (error) {
      res.status(400).json({ error: "Failed to update credits" });
    }
  });

  app.delete("/api/users/:id", requireOwner, async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.isOwner) {
        return res.status(403).json({ error: "Cannot delete owner account" });
      }

      await storage.deleteUser(id);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // UID operations - authenticated users can create/manage their own UIDs
  app.post("/api/uids", async (req, res) => {
    try {
      const uidData = insertUidSchema.parse(req.body);

      // Validate user is creating UID for themselves (unless owner)
      if (!req.session.isOwner && uidData.userId !== req.session.userId) {
        return res.status(403).json({ error: "Can only create UIDs for your own account" });
      }

      // SERVER-SIDE PRICING - Never trust client-provided cost
      const pricingTiers: Record<number, number> = {
        24: 0.50,
        72: 1.30,
        168: 2.33,
        336: 3.50,
        720: 5.20,
      };

      const cost = pricingTiers[uidData.duration];
      if (!cost) {
        return res.status(400).json({ error: "Invalid duration selected" });
      }

      // Check if user has enough credits
      const user = await storage.getUser(uidData.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentCredits = parseFloat(user.credits);

      if (currentCredits < cost) {
        return res.status(400).json({ error: "Insufficient credits" });
      }

      // Call external UID bypass API
      try {
        const apiClient = await UIDBypassClient.create();
        const apiResult = await apiClient.createUID(uidData.uidValue, uidData.duration.toString());
        
        // Calculate expiration date (duration in hours)
        const expiresAt = new Date(Date.now() + uidData.duration * 3600000);
        
        // Map plan_id from API response to planId for database
        const planId = apiResult.data?.plan?.id || Math.ceil(uidData.duration / 24).toString();
        
        // Create UID record in database with server-calculated cost and expiresAt
        const uid = await storage.createUid({
          ...uidData,
          planId: planId,
          cost: cost.toFixed(2),
          expiresAt,
        });

        // Deduct credits
        const newCredits = currentCredits - cost;
        await storage.updateUserCredits(uidData.userId, newCredits.toFixed(2));

        // Log activity
        await storage.logActivity({
          userId: uidData.userId,
          action: "create_uid",
          details: `Created UID ${uidData.uidValue} with ${uidData.duration}h duration - Cost: $${cost.toFixed(2)}`,
        });

        res.json({ uid, newCredits: newCredits.toFixed(2), apiResult });
      } catch (apiError: any) {
        if (apiError instanceof UIDBypassError) {
          return res.status(400).json({ error: `API Error: ${apiError.message}` });
        }
        throw apiError;
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create UID" });
    }
  });

  app.get("/api/uids/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      // Validate user can only view their own UIDs (unless owner)
      if (!req.session.isOwner && userId !== req.session.userId) {
        return res.status(403).json({ error: "Can only view your own UIDs" });
      }

      const userUids = await storage.getUserUids(userId);
      res.json(userUids);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch UIDs" });
    }
  });

  app.get("/api/uids/all", requireOwner, async (req, res) => {
    try {
      const localUids = await storage.getAllUids();
      const allUsers = await storage.getAllUsers();
      const ownerUser = await storage.getUser(req.session.userId!);
      
      const usersMap = new Map(allUsers.map(u => [u.id, u]));
      if (ownerUser) {
        usersMap.set(ownerUser.id, ownerUser);
      }
      
      const localUidsWithUsernames = localUids.map(uid => ({
        ...uid,
        username: usersMap.get(uid.userId)?.username || "Unknown User",
        source: "local"
      }));

      try {
        const apiClient = await UIDBypassClient.create();
        const externalData = await apiClient.listUIDs();
        
        const externalUids = externalData.data?.map((extUid: any) => ({
          id: `ext-${extUid.uid}`,
          userId: "external",
          uidValue: extUid.uid,
          duration: Math.round(extUid.remaining_hours || 0),
          cost: "0.00",
          status: extUid.status === "active" ? "active" : "expired",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + (extUid.remaining_hours || 0) * 3600000).toISOString(),
          username: extUid.nickname || "External API",
          source: "external"
        })) || [];

        const localUidValues = new Set(localUids.map(u => u.uidValue));
        const uniqueExternalUids = externalUids.filter((extUid: any) => !localUidValues.has(extUid.uidValue));
        
        const allUidsWithUsernames = [...localUidsWithUsernames, ...uniqueExternalUids];
        res.json(allUidsWithUsernames);
      } catch (apiError) {
        console.warn("Failed to fetch external UIDs, returning local UIDs only:", apiError);
        res.json(localUidsWithUsernames);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all UIDs" });
    }
  });

  app.delete("/api/uids/:id", async (req, res) => {
    console.log(`[API] DELETE /api/uids/${req.params.id} - User: ${req.session.userId}`);
    try {
      const { id } = req.params;
      
      // Get UID by ID (works for both owner and regular users)
      const uid = await storage.getUid(id);
      console.log(`[Database] Found UID:`, uid ? `${uid.uidValue} (ID: ${uid.id})` : 'Not found');
      
      if (!uid) {
        console.log(`[API] UID not found in database`);
        return res.status(404).json({ error: "UID not found" });
      }

      // Validate ownership: user can only delete their own UIDs, owner can delete any
      if (!req.session.isOwner && uid.userId !== req.session.userId) {
        console.log(`[API] Permission denied - User ${req.session.userId} cannot delete UID owned by ${uid.userId}`);
        return res.status(403).json({ error: "Can only delete your own UIDs" });
      }

      // Call external API to delete UID - ALWAYS before local deletion
      console.log(`[External API] Calling deleteUID for: ${uid.uidValue}`);
      try {
        const apiClient = await UIDBypassClient.create();
        const result = await apiClient.deleteUID(uid.uidValue);
        console.log(`[External API] Delete response:`, JSON.stringify(result, null, 2));
      } catch (apiError: any) {
        console.error("[External API] Delete error:", apiError);
        console.error("[External API] Error details:", {
          message: apiError.message,
          code: apiError.code,
          statusCode: apiError.statusCode
        });
        // Return error to client instead of silently continuing
        return res.status(500).json({ 
          error: "Failed to delete UID from external service",
          details: apiError instanceof UIDBypassError ? apiError.message : "Unknown error"
        });
      }

      // Only delete from local database after successful external deletion
      console.log(`[Database] Deleting UID ${uid.uidValue} from local database`);
      await storage.deleteUid(id);

      // Log activity
      await storage.logActivity({
        userId: req.session.userId!,
        action: "delete_uid",
        details: `Deleted UID ${uid.uidValue} (User: ${uid.userId})`,
      });
      console.log(`[API] Successfully deleted UID ${uid.uidValue}`);

      res.json({ success: true });
    } catch (error: any) {
      console.error("[API] Delete UID error:", error);
      res.status(500).json({ error: error.message || "Failed to delete UID" });
    }
  });

  app.patch("/api/uids/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Get UID to validate ownership
      const allUids = await storage.getUserUids(req.session.userId!);
      const uid = allUids.find(u => u.id === id);

      if (!uid && !req.session.isOwner) {
        return res.status(403).json({ error: "Can only update your own UIDs" });
      }

      await storage.updateUid(id, status);

      if (uid) {
        // Log activity (free operation - no credit change)
        await storage.logActivity({
          userId: uid.userId,
          action: "update_uid",
          details: `Updated UID ${uid.uidValue} status to ${status}`,
        });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update UID" });
    }
  });

  app.patch("/api/uids/:id/value", async (req, res) => {
    console.log(`[API] PATCH /api/uids/${req.params.id}/value - User: ${req.session.userId}`);
    try {
      const { id } = req.params;
      const updateData = updateUidValueSchema.parse(req.body);
      
      // Get UID by ID
      const uid = await storage.getUid(id);
      console.log(`[Database] Found UID:`, uid ? `${uid.uidValue} (ID: ${uid.id})` : 'Not found');
      
      if (!uid) {
        console.log(`[API] UID not found in database`);
        return res.status(404).json({ error: "UID not found" });
      }

      // Validate ownership: user can only update their own UIDs, owner can update any
      if (!req.session.isOwner && uid.userId !== req.session.userId) {
        console.log(`[API] Permission denied - User ${req.session.userId} cannot update UID owned by ${uid.userId}`);
        return res.status(403).json({ error: "Can only update your own UIDs" });
      }

      const oldUidValue = uid.uidValue;
      const newUidValue = updateData.newUidValue;

      // Call external API to update UID
      console.log(`[External API] Calling updateUID - Old: ${oldUidValue}, New: ${newUidValue}`);
      try {
        const apiClient = await UIDBypassClient.create();
        const result = await apiClient.updateUID(oldUidValue, newUidValue);
        console.log(`[External API] Update response:`, JSON.stringify(result, null, 2));
      } catch (apiError: any) {
        console.error("[External API] Update error:", apiError);
        console.error("[External API] Error details:", {
          message: apiError.message,
          code: apiError.code,
          statusCode: apiError.statusCode
        });
        return res.status(400).json({ 
          error: "Failed to update UID on external service",
          details: apiError instanceof UIDBypassError ? apiError.message : "Unknown error"
        });
      }

      // Update UID value in local database after successful external update
      console.log(`[Database] Updating UID value from ${oldUidValue} to ${newUidValue}`);
      await storage.updateUidValue(id, newUidValue);

      // Log activity
      await storage.logActivity({
        userId: req.session.userId!,
        action: "update_uid_value",
        details: `Updated UID from ${oldUidValue} to ${newUidValue}`,
      });
      console.log(`[API] Successfully updated UID value`);

      res.json({ success: true, oldValue: oldUidValue, newValue: newUidValue });
    } catch (error: any) {
      console.error("[API] Update UID value error:", error);
      res.status(400).json({ error: error.message || "Failed to update UID value" });
    }
  });

  app.get("/api/uids/external/list", requireAuth, async (req, res) => {
    console.log(`[API] Fetching external UID list for user: ${req.session.userId}`);
    try {
      // Fetch UIDs from external API
      const apiClient = await UIDBypassClient.create();
      console.log(`[External API] Calling listUIDs()...`);
      const externalUids = await apiClient.listUIDs();
      console.log(`[External API] Received response:`, JSON.stringify(externalUids, null, 2));
      
      // Also get local UIDs for current user
      const localUids = await storage.getUserUids(req.session.userId!);
      console.log(`[Database] Found ${localUids.length} local UIDs for user`);
      
      // Combine and return
      res.json({
        external: externalUids,
        local: localUids,
      });
    } catch (error: any) {
      console.error("[External API] List error:", error);
      console.error("[External API] Error details:", {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack
      });
      res.status(500).json({ 
        error: "Failed to fetch UIDs from external API",
        details: error instanceof UIDBypassError ? error.message : "Unknown error"
      });
    }
  });

  // Settings operations - owner only
  app.get("/api/settings", requireOwner, async (req, res) => {
    try {
      const appSettings = await storage.getSettings();
      res.json(appSettings || { baseUrl: "", apiKey: "" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", requireOwner, async (req, res) => {
    try {
      const settingsData = insertSettingsSchema.parse(req.body);
      const updated = await storage.updateSettings(settingsData);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update settings" });
    }
  });

  // Activity logs - owner sees all, users see their own
  app.get("/api/activity", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      let activities;
      if (req.session.isOwner) {
        activities = await storage.getAllActivity(limit);
      } else {
        activities = await storage.getUserActivity(req.session.userId!, limit);
      }

      const uniqueUserIds = new Set(activities.map(a => a.userId));
      const allUserIds = Array.from(uniqueUserIds);
      const usersMap = new Map();
      
      for (const userId of allUserIds) {
        const user = await storage.getUser(userId);
        if (user) {
          usersMap.set(userId, user.username);
        }
      }

      const activitiesWithUsernames = activities.map(activity => ({
        ...activity,
        username: usersMap.get(activity.userId) || "Unknown User"
      }));

      res.json(activitiesWithUsernames);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  app.get("/api/activity/user/:userId", requireOwner, async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getUserActivity(userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user activity" });
    }
  });

  app.post("/api/activity/cleanup", requireOwner, async (req, res) => {
    try {
      const daysOld = req.body.daysOld || 2;
      const deletedCount = await storage.cleanupOldActivityLogs(daysOld);
      
      await storage.logActivity({
        userId: req.session.userId!,
        action: "activity_cleanup",
        details: `Cleaned up ${deletedCount} activity logs older than ${daysOld} days`,
      });

      res.json({ success: true, deletedCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to cleanup activity logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
