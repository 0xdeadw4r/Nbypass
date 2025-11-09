import { connectToMongoDB } from "./mongodb";
import { UserModel } from "./mongodb-models";
import { hashPassword } from "./auth";

async function fixAdminPassword() {
  try {
    await connectToMongoDB();
    
    const user = await UserModel.findOne({ username: "admin" });
    
    if (!user) {
      console.log("❌ Admin user not found");
      process.exit(1);
    }
    
    console.log("🔧 Fixing admin password...");
    
    const hashedPassword = await hashPassword("itsmeuidbypass");
    user.password = hashedPassword;
    user.isOwner = true;
    user.credits = 999999.99;
    await user.save();
    
    console.log("✅ Admin password updated successfully");
    console.log("   Username: admin");
    console.log("   Password: itsmeuidbypass");
    console.log("   IsOwner: true");
    console.log("   Credits: 999999.99");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixAdminPassword();
