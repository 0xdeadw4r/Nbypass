import { UserModel, PlanModel } from './mongodb-models';
import { hashPassword } from './auth';

const DEFAULT_OWNER_USERNAME = 'admin';
const DEFAULT_OWNER_PASSWORD = 'admin123';

const DEFAULT_PLANS = [
  { code: 1, name: '1 day', days: 1, creditsCost: 10 },
  { code: 2, name: '3 days', days: 3, creditsCost: 25 },
  { code: 3, name: '7 days', days: 7, creditsCost: 50 },
  { code: 4, name: '15 days', days: 15, creditsCost: 90 },
  { code: 5, name: '30 days', days: 30, creditsCost: 150 },
];

export async function initializeDatabase() {
  console.log('🔧 Initializing database...');
  
  try {
    const ownerExists = await UserModel.findOne({ username: DEFAULT_OWNER_USERNAME });
    
    if (!ownerExists) {
      console.log('📝 Creating default owner user...');
      const hashedPassword = await hashPassword(DEFAULT_OWNER_PASSWORD);
      
      await UserModel.create({
        username: DEFAULT_OWNER_USERNAME,
        password: hashedPassword,
        isOwner: true,
        credits: 10000,
        isActive: true,
      });
      
      console.log(`✅ Default owner created`);
      console.log(`   Username: ${DEFAULT_OWNER_USERNAME}`);
      console.log(`   Password: ${DEFAULT_OWNER_PASSWORD}`);
      console.log(`   ⚠️  IMPORTANT: Change this password after first login!`);
    } else {
      console.log('ℹ️  Owner user already exists');
    }
    
    const existingPlansCount = await PlanModel.countDocuments();
    
    if (existingPlansCount === 0) {
      console.log('📝 Creating default plans...');
      await PlanModel.insertMany(DEFAULT_PLANS);
      console.log(`✅ Created ${DEFAULT_PLANS.length} default plans`);
      DEFAULT_PLANS.forEach(plan => {
        console.log(`   - ${plan.name}: ${plan.creditsCost} credits`);
      });
    } else {
      console.log(`ℹ️  Found ${existingPlansCount} existing plans`);
    }
    
    console.log('✅ Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}
