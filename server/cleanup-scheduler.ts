import { storage } from "./storage";

const TWO_DAYS_IN_MS = 2 * 24 * 60 * 60 * 1000;

export class CleanupScheduler {
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    console.log("[Cleanup Scheduler] Starting activity log cleanup scheduler...");
    
    this.runCleanup();
    
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, TWO_DAYS_IN_MS);

    console.log("[Cleanup Scheduler] Scheduler started. Will run every 2 days.");
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[Cleanup Scheduler] Scheduler stopped.");
    }
  }

  private async runCleanup() {
    try {
      console.log("[Cleanup Scheduler] Running activity log cleanup...");
      const deletedCount = await storage.cleanupOldActivityLogs(2);
      console.log(`[Cleanup Scheduler] Cleaned up ${deletedCount} activity logs older than 2 days.`);
    } catch (error) {
      console.error("[Cleanup Scheduler] Error during cleanup:", error);
    }
  }
}

export const cleanupScheduler = new CleanupScheduler();
