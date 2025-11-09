import { storage } from "./storage";

export class UIDBypassError extends Error {
  code?: number;
  statusCode?: number;

  constructor(message: string, code?: number, statusCode?: number) {
    super(message);
    this.name = "UIDBypassError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class UIDBypassClient {
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(baseUrl: string, apiKey: string, timeoutMs: number = 20000) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  static async create(): Promise<UIDBypassClient> {
    const settings = await storage.getSettings();
    
    if (!settings || !settings.baseUrl || !settings.apiKey) {
      throw new UIDBypassError("API settings not configured. Please configure in Settings page.");
    }

    return new UIDBypassClient(settings.baseUrl, settings.apiKey);
  }

  private async request(action: string, params: Record<string, string>): Promise<any> {
    const url = new URL(this.baseUrl);
    url.searchParams.append("action", action);
    url.searchParams.append("api", this.apiKey);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    console.log(`[UIDBypassClient] Request URL: ${url.toString()}`);
    console.log(`[UIDBypassClient] Action: ${action}, Params:`, params);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const startTime = Date.now();
      const response = await fetch(url.toString(), {
        method: "GET",
        signal: controller.signal,
      });
      const duration = Date.now() - startTime;

      clearTimeout(timeout);

      console.log(`[UIDBypassClient] Response: ${response.status} ${response.statusText} (${duration}ms)`);

      if (!response.ok) {
        throw new UIDBypassError(
          `HTTP error: ${response.statusText}`,
          undefined,
          response.status
        );
      }

      const data = await response.json();
      console.log(`[UIDBypassClient] Response data:`, JSON.stringify(data, null, 2));

      if (data && typeof data === "object" && data.error) {
        throw new UIDBypassError(
          data.message || "Unknown API error",
          data.code,
          response.status
        );
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === "AbortError") {
        console.error(`[UIDBypassClient] Request timeout after ${this.timeoutMs}ms`);
        throw new UIDBypassError("Request timeout");
      }

      if (error instanceof UIDBypassError) {
        console.error(`[UIDBypassClient] API Error:`, error.message);
        throw error;
      }

      console.error(`[UIDBypassClient] Request failed:`, error);
      throw new UIDBypassError(`Request failed: ${error.message}`);
    }
  }

  async createUID(uid: string, duration: string): Promise<any> {
    console.log(`[UIDBypassClient] createUID() - UID: ${uid}, Duration: ${duration}`);
    return this.request("create", { uid, duration });
  }

  async deleteUID(uid: string): Promise<any> {
    console.log(`[UIDBypassClient] deleteUID() - UID: ${uid}`);
    return this.request("delete", { uid });
  }

  async checkUID(uid: string): Promise<any> {
    console.log(`[UIDBypassClient] checkUID() - UID: ${uid}`);
    return this.request("check", { uid });
  }

  async listUIDs(): Promise<any> {
    console.log(`[UIDBypassClient] listUIDs() - Fetching all UIDs from external API`);
    return this.request("list", {});
  }

  async updateUID(oldUid: string, newUid: string): Promise<any> {
    console.log(`[UIDBypassClient] updateUID() - Old UID: ${oldUid}, New UID: ${newUid}`);
    return this.request("update", { uid: oldUid, new_uid: newUid });
  }
}
