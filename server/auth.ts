import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { LoginData } from "@shared/schema";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function authenticateUser(credentials: LoginData) {
  const user = await storage.getUserByUsername(credentials.username);
  
  if (!user) {
    return null;
  }

  const isValidPassword = await comparePassword(credentials.password, user.password);
  
  if (!isValidPassword) {
    return null;
  }

  // Update last active
  await storage.updateUserCredits(user.id, user.credits);
  
  // Log activity
  await storage.logActivity({
    userId: user.id,
    action: "login",
    details: `User ${user.username} logged in`,
  });

  // Return user without password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
