
import { storage } from "./storage";
import { connectToMongoDB } from "./mongodb";

async function fixSettings() {
  await connectToMongoDB();
  
  // Get the Replit domain from environment or use default
  const replitDomain = process.env.REPL_SLUG && process.env.REPL_OWNER 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : "http://localhost:5000";
  
  const baseUrl = `${replitDomain}/api/handler`;
  
  console.log(`Setting base URL to: ${baseUrl}`);
  
  const settings = await storage.getSettings();
  if (settings) {
    await storage.updateSettings({
      baseUrl: baseUrl,
      apiKey: settings.apiKey
    });
    console.log("✓ Settings updated successfully");
  } else {
    console.log("✗ No settings found in database");
  }
  
  process.exit(0);
}

fixSettings().catch(console.error);
