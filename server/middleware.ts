import { Request, Response, NextFunction } from "express";
import { Session } from "express-session";

// Extend Express Session type to include custom fields
declare module "express-session" {
  interface SessionData {
    userId?: string;
    username?: string;
    isOwner?: boolean;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId || !req.session.isOwner) {
    return res.status(403).json({ error: "Owner access required" });
  }
  next();
}
