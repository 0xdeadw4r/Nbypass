import { connectToMongoDB } from "./mongodb";
import { UserModel, SettingsModel } from "./mongodb-models";
import { hashPassword } from "./auth";

async function seed() {
  try {
    console.log("🌱 Seeding database...");
    
    await connectToMongoDB();

    const existingOwner = await UserModel.findOne({ username: "admin" });

    if (!existingOwner) {
      const hashedPassword = await hashPassword("itsmeuidbypass");
      
      await UserModel.create({
        username: "admin",
        password: hashedPassword,
        isOwner: true,
        credits: 999999.99,
        isActive: true,
        createdAt: new Date(),
      });

      console.log("✅ Owner account created:");
      console.log("   Username: admin");
      console.log("   Password: itsmeuidbypass");
    } else {
      console.log("ℹ️  Owner account already exists");
    }

    const existingSettings = await SettingsModel.findOne();
    if (!existingSettings) {
      await SettingsModel.create({
        baseUrl: "https://uidbypass.com/public/api/bypassapi.php",
        apiKey: "uid_94fb2e07f08e2869a46d5bf2fc135af5",
        updatedAt: new Date(),
      });
      console.log("✅ Settings configured");
    }

    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
