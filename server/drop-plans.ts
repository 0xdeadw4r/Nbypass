import { connectToMongoDB } from "./mongodb";
import { PlanModel } from "./mongodb-models";

async function dropPlans() {
  try {
    console.log("🗑️  Dropping plans collection...");
    
    await connectToMongoDB();
    
    await PlanModel.collection.drop();
    console.log("✅ Plans collection dropped successfully");
    
    process.exit(0);
  } catch (error: any) {
    if (error.message.includes('ns not found')) {
      console.log("ℹ️  Plans collection does not exist");
    } else {
      console.error("❌ Error dropping plans:", error);
    }
    process.exit(1);
  }
}

dropPlans();
