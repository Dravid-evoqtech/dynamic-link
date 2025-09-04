import { notificationJobs } from "../../config/notificationJobs.js";
import { testNotificationJobs } from "../../config/notificationJobs.test.js";
import { scheduleNotificationJob } from "../cron/notifications/scheduleNotificationJob.js";

export const initializeNotificationJobs = () => {
  console.log("🚀 Initializing Notification Jobs...");

  // Use test jobs if in development/testing mode
  const jobsToUse = process.env.NODE_ENV === 'test' || process.env.USE_TEST_NOTIFICATIONS === 'true' 
    ? testNotificationJobs 
    : notificationJobs;

  jobsToUse.forEach((job) => {
    scheduleNotificationJob(job);
    console.log(`✅ Registered job: ${job.jobName} (${job.type}-level, cron: ${job.cronExpr})`);
  });

  console.log(`📅 All notification jobs scheduled! (${jobsToUse === testNotificationJobs ? 'TEST MODE' : 'PRODUCTION MODE'})`);
};
