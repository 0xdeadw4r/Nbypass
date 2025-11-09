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
      throw new UIDBypassError(
        "API settings not configured. Please configure in Settings page.",
      );
    }

    return new UIDBypassClient(settings.baseUrl, settings.apiKey);
  }

  private async request(
    action: string,
    params: Record<string, any>,
    method: string = "POST",
  ): Promise<any> {
    const url = new URL(this.baseUrl);
    url.searchParams.append("action", action);

    console.log(`[UIDBypassClient] Request URL: ${url.toString()}`);
    console.log(
      `[UIDBypassClient] Method: ${method}, Action: ${action}, Body:`,
      params,
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const startTime = Date.now();
      const fetchOptions: RequestInit = {
        method,
        signal: controller.signal,
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
      };

      if (method === "POST" && Object.keys(params).length > 0) {
        fetchOptions.body = JSON.stringify(params);
      }

      const response = await fetch(url.toString(), fetchOptions);
      const duration = Date.now() - startTime;

      clearTimeout(timeout);

      console.log(
        `[UIDBypassClient] Response: ${response.status} ${response.statusText} (${duration}ms)`,
      );

      const data = await response.json();
      console.log(
        `[UIDBypassClient] Response data:`,
        JSON.stringify(data, null, 2),
      );

      if (!response.ok) {
        throw new UIDBypassError(
          data.error || `HTTP error: ${response.statusText}`,
          undefined,
          response.status,
        );
      }

      if (data && typeof data === "object" && data.error) {
        throw new UIDBypassError(
          data.error || "Unknown API error",
          data.code,
          response.status,
        );
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === "AbortError") {
        console.error(
          `[UIDBypassClient] Request timeout after ${this.timeoutMs}ms`,
        );
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
    console.log(
      `[UIDBypassClient] createUID() - UID: ${uid}, Duration: ${duration}`,
    );
    // Convert duration from hours to plan_id (days)
    const durationInDays = Math.ceil(parseInt(duration) / 24);
    return this.request(
      "add_uid_api",
      {
        uid,
        plan_id: durationInDays,
        region: "PK",
      },
      "POST",
    );
  }

  async deleteUID(uid: string): Promise<any> {
    console.log(`[UIDBypassClient] deleteUID() - UID: ${uid}`);
    return this.request("remove_uid_api", { uid }, "POST");
  }

  async listUIDs(): Promise<any> {
    console.log(
      `[UIDBypassClient] listUIDs() - Fetching all UIDs from external API`,
    );
    return this.request("list_uids_api", {}, "GET");
  }

  async renewUID(uid: string, days: number): Promise<any> {
    console.log(`[UIDBypassClient] renewUID() - UID: ${uid}, Days: ${days}`);
    return this.request("renew_uid_api", { uid, days }, "POST");
  }
}
