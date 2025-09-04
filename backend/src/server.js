import dotenv from "dotenv";
import { app } from "./app.js";
import connectToDatabase from "./config/db.js";
import cron from "node-cron";
import { cleanRefreshTokenEntries, cleanRefreshTokenEntriesAdmin } from "./utils/cron/cleanRefreshTokenEntries.js";
import { initializeNotificationJobs } from "./utils/notification/notificationManager.js";


dotenv.config();
connectToDatabase()
.then(() => {
  app.listen(process.env.PORT || 8000, () => {
    console.log("⚙️  Server is running on Port :", process.env.PORT);
  });
})
.catch((err) => {
  console.log("MONGODB CONNECTION FAILED!!! ", err);
});

cron.schedule("0 2 * * *", async () => {
  console.log("🧹 Starting token cleanup job at:", new Date().toISOString());
  try {
    await cleanRefreshTokenEntries();
    await cleanRefreshTokenEntriesAdmin();
    console.log("✅ Token cleanup completed successfully");
  } catch (error) {
    console.error("❌ Token cleanup failed:", error);
  }
});

if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON_JOBS === 'true') {
  initializeNotificationJobs();
  console.log("🚀 Notification jobs enabled for environment:", process.env.NODE_ENV);
} else {
  console.log("⚠️ Notification jobs disabled for environment:", process.env.NODE_ENV);
}