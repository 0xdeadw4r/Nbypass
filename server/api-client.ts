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
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  static async create(): Promise<UIDBypassClient> {
    const settings = await storage.getSettings();

    if (!settings || !settings.baseUrl || !settings.apiKey) {
      throw new UIDBypassError(
        "API configuration not found. Please configure Base URL and API Key in Settings.",
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
    console.log(`[UIDBypassClient] Method: ${method}, Action: ${action}`);
    console.log(`[UIDBypassClient] Body:`, JSON.stringify(params, null, 2));

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

      console.log(`[UIDBypassClient] Response: ${response.status} ${response.statusText} (${duration}ms)`);

      let data;
      const responseText = await response.text();
      console.log(`[UIDBypassClient] Raw response:`, responseText.substring(0, 500));
      
      try {
        data = JSON.parse(responseText);
        console.log(`[UIDBypassClient] Parsed data:`, JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error(`[UIDBypassClient] JSON parse error:`, parseError);
        throw new UIDBypassError(
          `Invalid JSON response from API: ${responseText.substring(0, 200)}`,
          undefined,
          response.status,
        );
      }

      clearTimeout(timeout);

      if (!response.ok) {
        throw new UIDBypassError(
          data.error || `HTTP ${response.status}: ${response.statusText}`,
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
        console.error(`[UIDBypassClient] Request timeout after ${this.timeoutMs}ms`);
        throw new UIDBypassError(`Request timeout (${this.timeoutMs}ms)`);
      }

      if (error instanceof UIDBypassError) {
        throw error;
      }

      console.error(`[UIDBypassClient] Request failed:`, error);
      throw new UIDBypassError(`Request failed: ${error.message}`);
    }
  }

  async createUID(uid: string, planId: number, region: string = "PK"): Promise<any> {
    console.log(`[UIDBypassClient] createUID() - UID: ${uid}, Plan: ${planId}, Region: ${region}`);
    return this.request(
      "add_uid_api",
      {
        uid,
        plan_id: planId,
        region,
      },
      "POST",
    );
  }

  async createUIDFree(uid: string, region: string = "PK"): Promise<any> {
    console.log(`[UIDBypassClient] createUIDFree() - UID: ${uid}, Region: ${region}`);
    return this.request(
      "add_uid_free_api",
      {
        uid,
        region,
      },
      "POST",
    );
  }

  async deleteUID(uid: string): Promise<any> {
    console.log(`[UIDBypassClient] deleteUID() - UID: ${uid}`);
    return this.request(
      "remove_uid_api",
      {
        uid
      },
      "POST",
    );
  }

  async listUIDs(page: number = 1, perPage: number = 20, status?: string): Promise<any> {
    console.log(`[UIDBypassClient] listUIDs() - Page: ${page}, PerPage: ${perPage}, Status: ${status || 'all'}`);
    const params: Record<string, any> = {};
    if (status) params.status = status;
    
    const url = new URL(this.baseUrl);
    url.searchParams.append("action", "list_uids_api");
    url.searchParams.append("page", page.toString());
    url.searchParams.append("per_page", perPage.toString());
    if (status) url.searchParams.append("status", status);

    console.log(`[UIDBypassClient] List URL: ${url.toString()}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        signal: controller.signal,
        headers: {
          "X-API-Key": this.apiKey,
        },
      });

      clearTimeout(timeout);

      const responseText = await response.text();
      console.log(`[UIDBypassClient] List response:`, responseText.substring(0, 500));
      
      const data = JSON.parse(responseText);
      
      if (!response.ok || (data && data.error)) {
        throw new UIDBypassError(
          data.error || `HTTP ${response.status}`,
          undefined,
          response.status,
        );
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeout);
      if (error instanceof UIDBypassError) throw error;
      throw new UIDBypassError(`List UIDs failed: ${error.message}`);
    }
  }

  async renewUID(uid: string, days: number): Promise<any> {
    console.log(`[UIDBypassClient] renewUID() - UID: ${uid}, Days: ${days}`);
    return this.request(
      "renew_uid_api",
      {
        uid,
        days,
      },
      "POST",
    );
  }

  async updateUID(oldUid: string, newUid: string): Promise<any> {
    console.log(`[UIDBypassClient] updateUID() - Old: ${oldUid}, New: ${newUid}`);
    console.log(`[UIDBypassClient] Step 1: Deleting old UID`);
    await this.deleteUID(oldUid);
    console.log(`[UIDBypassClient] Step 2: Creating new UID (free)`);
    return await this.createUIDFree(newUid);
  }
}
