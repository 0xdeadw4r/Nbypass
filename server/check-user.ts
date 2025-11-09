import { connectToMongoDB } from "./mongodb";
import { UserModel } from "./mongodb-models";
import { comparePassword } from "./auth";

async function checkUser() {
  try {
    await connectToMongoDB();
    
    const user = await UserModel.findOne({ username: "admin" });
    
    if (!user) {
      console.log("❌ Admin user not found");
      process.exit(1);
    }
    
    console.log("✅ Admin user found:");
    console.log("   Username:", user.username);
    console.log("   IsOwner:", user.isOwner);
    console.log("   Credits:", user.credits);
    console.log("   Password hash:", user.password.substring(0, 20) + "...");
    
    // Test password
    const isValid = await comparePassword("itsmeuidbypass", user.password);
    console.log("   Password 'itsmeuidbypass' valid:", isValid);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkUser();
