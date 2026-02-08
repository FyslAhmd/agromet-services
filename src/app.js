import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Sequelize } from "sequelize";
import sequelize from "./config/database.js";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import maximumTempRoutes from "./routes/maximumTempRoutes.js";
import minimumTempRoutes from "./routes/minimumTempRoutes.js";
import rainfallRoutes from "./routes/rainfallRoutes.js";
import relativeHumidityRoutes from "./routes/relativeHumidityRoutes.js";
import sunshineRoutes from "./routes/sunshineRoutes.js";
import windSpeedRoutes from "./routes/windSpeedRoutes.js";
import soilMoistureRoutes from "./routes/soilMoistureRoutes.js";
import soilTemperatureRoutes from "./routes/soilTemperatureRoutes.js";
import averageTemperatureRoutes from "./routes/averageTemperatureRoutes.js";
import solarRadiationRoutes from "./routes/solarRadiationRoutes.js";
import evapoTranspirationRoutes from "./routes/evapoTranspirationRoutes.js";
import dcrsProxyRoutes from "./routes/dcrsProxyRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import historicalDataRequestRoutes from "./routes/historicalDataRequestRoutes.js";

// Import models
import User from "./models/User.js";
import MaximumTemp from "./models/MaximumTemp.js";
import MinimumTemp from "./models/MinimumTemp.js";
import Rainfall from "./models/Rainfall.js";
import RelativeHumidity from "./models/RelativeHumidity.js";
import Sunshine from "./models/Sunshine.js";
import WindSpeed from "./models/WindSpeed.js";
import SoilMoisture from "./models/SoilMoisture.js";
import SoilTemperature from "./models/SoilTemperature.js";
import AverageTemperature from "./models/AverageTemperature.js";
import SolarRadiation from "./models/SolarRadiation.js";
import EvapoTranspiration from "./models/EvapoTranspiration.js";
import Feedback from "./models/Feedback.js";
import HistoricalDataRequest from "./models/HistoricalDataRequest.js";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://agromet.brri.gov.bd',
    'https://saads.brri.gov.bd',
    'https://ccms.brri.gov.bd',
    'https://dcrs.brri.gov.bd'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

const PORT = process.env.PORT || 5000;

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/maximum-temp", maximumTempRoutes);
app.use("/api/minimum-temp", minimumTempRoutes);
app.use("/api/rainfall", rainfallRoutes);
app.use("/api/relative-humidity", relativeHumidityRoutes);
app.use("/api/sunshine", sunshineRoutes);
app.use("/api/wind-speed", windSpeedRoutes);
app.use("/api/soil-moisture", soilMoistureRoutes);
app.use("/api/soil-temperature", soilTemperatureRoutes);
app.use("/api/average-temperature", averageTemperatureRoutes);
app.use("/api/solar-radiation", solarRadiationRoutes);
app.use("/api/evapo-transpiration", evapoTranspirationRoutes);
app.use("/api/dcrs-proxy", dcrsProxyRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/historical-data-requests", historicalDataRequestRoutes);

// Health check route
app.get("/api", (req, res) => {
  res.json({ ok: true, message: "Agromet Services API is running" });
});

// Create database if not exists
async function createDatabaseIfNotExists() {
  const dbName = process.env.DB_NAME || "agromet_services";
  const dbUser = process.env.DB_USER || "root";
  const dbPassword = process.env.DB_PASSWORD || "";
  const dbHost = process.env.DB_HOST || "localhost";

  // Connect without database to create it if needed
  const tempSequelize = new Sequelize("", dbUser, dbPassword, {
    host: dbHost,
    dialect: "mysql",
    logging: false,
  });

  try {
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`✅ Database '${dbName}' is ready`);
  } catch (error) {
    console.error("❌ Error creating database:", error.message);
    throw error;
  } finally {
    await tempSequelize.close();
  }
}

// Create default admin user if not exists
// async function createDefaultAdmin() {
//   try {
//     const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
//     if (!existingAdmin) {
//       const hashedPassword = await bcrypt.hash('admin123', 10);
      
//       await User.create({
//         username: 'admin',
//         name: 'System Administrator',
//         email: 'admin@brri.gov.bd',
//         mobileNumber: '01700000000',
//         designation: 'System Administrator',
//         organization: 'BRRI',
//         password: hashedPassword,
//         role: 'admin',
//         status: 'approved'
//       });
      
//       console.log('✅ Default admin user created (username: admin, password: admin123)');
//     }
//   } catch (error) {
//     console.error("⚠️  Could not create default admin:", error.message);
//   }
// }

// Initialize database and start server
async function initializeDatabase() {
  try {
    // First, create database if it doesn't exist
    await createDatabaseIfNotExists();
    
    // Then connect to the database
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync all models (create tables)
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synchronized successfully');

    // Create default admin user
    // await createDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error.message);
    process.exit(1);
  }
}

initializeDatabase();
