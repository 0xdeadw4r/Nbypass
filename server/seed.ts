import { connectToMongoDB } from "./mongodb";
import { UserModel, SettingsModel, PlanModel } from "./mongodb-models";
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

    const existingPlans = await PlanModel.countDocuments();
    if (existingPlans === 0) {
      const defaultPlans = [
        { code: 1, name: "1 day", days: 1, creditsCost: 0, isActive: true },
        { code: 2, name: "7 days", days: 7, creditsCost: 10, isActive: true },
        { code: 3, name: "14 days", days: 14, creditsCost: 18, isActive: true },
        { code: 4, name: "30 days", days: 30, creditsCost: 35, isActive: true },
        { code: 5, name: "60 days", days: 60, creditsCost: 65, isActive: true },
        { code: 6, name: "90 days", days: 90, creditsCost: 90, isActive: true },
      ];

      await PlanModel.insertMany(defaultPlans);
      console.log("✅ Default plans created");
    } else {
      console.log("ℹ️  Plans already exist");
    }

    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
