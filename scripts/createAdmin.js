import bcrypt from "bcrypt";
import sequelize from "../src/config/database.js";
import User from "../src/models/User.js";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    await sequelize.sync();
    console.log('✅ Database synchronized');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('   Username: admin');
      console.log('   Email:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      username: 'admin',
      name: 'System Administrator',
      email: 'info.faysal.32@gmail.com',
      mobileNumber: '01615553632',
      designation: 'System Administrator',
      organization: 'BRRI',
      password: hashedPassword,
      role: 'admin',
      status: 'approved'
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📝 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@brri.gov.bd');
    console.log('');
    console.log('⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
