import cron from 'node-cron';
import moment from 'moment-timezone';
import {
  sendNotificationToMultipleDevices,
  sendNotificationToMultipleUsers,
} from '../../notification/sendNotification.js';
import { User } from '../../../models/user.model.js';
import { deduplicateFcmTokens } from '../../notification/getUniqueDeviceUsers.js';

// --------------------------------------------------------
// Notification Manager
// --------------------------------------------------------

export const scheduleNotificationJob = ({
  jobName,
  type, // "user" | "device"
  hour,
  window, // { start: 8, end: 9 }
  cronExpr,
  message,
  checkCondition = () => true,
}) => {
  // Map job names to actual database field names
  const fieldMapping = {
    'StartOfDay': 'lastStartOfDayNotificationSentAt',
    'EndOfDay': 'lastEndOfDayNotificationSentAt'
  };
  const lastSentField = fieldMapping[jobName] || `last${jobName}NotificationSentAt`;

  // ---------------- Decide cron expression ----------------
  let cronExpression = '* * * * *'; // default = every minute
  if (cronExpr) {
    cronExpression = cronExpr;
  } else if (hour !== undefined) {
    cronExpression = `0 ${hour} * * *`; // once at hour:00
  } else if (window) {
    cronExpression = `* ${window.start}-${window.end - 1} * * *`; // runs every minute in window
  }

  cron.schedule(cronExpression, async () => {
    console.log(`⏰ Running ${jobName} (${type}-level) notification check...`);
    console.log(`🌍 Server timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    const nowUTC = moment.utc();
    const todayDate = nowUTC.format('YYYY-MM-DD');

    // ⚡ For global users, we run every hour but filter by local time in checkCondition
    // No need to skip based on UTC time since users are worldwide

    try {
      // 🚀 Get all users with FCM tokens - we'll filter at token level
      const users = await User.find({
        fcmTokens: { $exists: true, $not: { $size: 0 } },
      });

      if (!users.length) {
        console.log(`📭 No eligible users found for ${jobName}`);
        return;
      }

      if (type === 'user') {
        // ---------------- USER-LEVEL ----------------
        const eligibleUsers = [];
        
        for (const user of users) {
          const tzToken = user.fcmTokens.find((t) => t.timezone);
          if (!tzToken) continue;

          const localNow = nowUTC.clone().tz(tzToken.timezone);
          const localHHmm = localNow.format('HH:mm');

          let isNotificationTime = false;
          if (hour !== undefined) {
            isNotificationTime =
              localHHmm === `${hour.toString().padStart(2, '0')}:00`;
          } else if (window) {
            isNotificationTime =
              localNow.hour() >= window.start && localNow.hour() < window.end;
          } else {
            isNotificationTime = true; 
          }

          const lastSent = user[lastSentField]
            ? moment(user[lastSentField])
                .tz(tzToken.timezone)
                .format('YYYY-MM-DD')
            : null;

          if (
            isNotificationTime &&
            lastSent !== todayDate &&
            checkCondition(user, localNow)
          ) {
            eligibleUsers.push(user);
          }
        }

        // 🚀 Batch send notifications
        if (eligibleUsers.length > 0) {
          await sendNotificationToMultipleUsers(eligibleUsers, message);
          
          // 🚀 Bulk update lastSentField
          const bulkOps = eligibleUsers.map(user => ({
            updateOne: {
              filter: { _id: user._id },
              update: { $set: { [lastSentField]: new Date() } }
            }
          }));
          
          await User.bulkWrite(bulkOps);
          console.log(`✅ Sent ${jobName} (user-level) to ${eligibleUsers.length} users`);
        }
      } else if (type === 'device') {
        console.log('🚀 Running device-level notification check...');

        // ---------------- DEVICE-LEVEL ----------------
        const tokenToUserMap = new Map();
        const usersToNotify = [];

        // 🚀 Pre-filter users with valid tokens and timezones
        const validUsers = users.filter(user => 
          user.fcmTokens.some(token => token.timezone)
        );

        if (!validUsers.length) {
          console.log(`📭 No users with valid timezone tokens for ${jobName}`);
          return;
        }

        for (const user of validUsers) {
          for (const token of user.fcmTokens) {
            if (!token.timezone) continue;

            const localNow = nowUTC.clone().tz(token.timezone);
            
            // 🚀 Skip if already processed today (moved up for early exit)
            const lastSent = token[lastSentField]
              ? moment(token[lastSentField])
                  .tz(token.timezone)
                  .format('YYYY-MM-DD')
              : null;


            if (lastSent === todayDate) {
              continue; // Skip already notified tokens
            }

            const localHHmm = localNow.format('HH:mm');
            let isNotificationTime = false;
            
            if (hour !== undefined) {
              isNotificationTime =
                localHHmm === `${hour.toString().padStart(2, '0')}:00`;
            } else if (window) {
              isNotificationTime =
                localNow.hour() >= window.start && localNow.hour() < window.end;
            } else {
              isNotificationTime = true; 
            }

            if (isNotificationTime && checkCondition(token, localNow)) {
              usersToNotify.push(user);
              tokenToUserMap.set(token.token, user._id.toString());
            }
          }
        }
        
        // 🚀 Build comprehensive token tracking for cross-user synchronization
        const allEligibleTokens = new Set();
        const tokenToAllUsersMap = new Map(); // Track ALL users per token
        
        usersToNotify.forEach(user => {
          user.fcmTokens.forEach(token => {
            if (token.token) {
              allEligibleTokens.add(token.token);
              if (!tokenToAllUsersMap.has(token.token)) {
                tokenToAllUsersMap.set(token.token, []);
              }
              tokenToAllUsersMap.get(token.token).push({
                userId: user._id,
                lastOpenedAppAt: token.lastOpenedAppAt
              });
            }
          });
        });

        const tokenToUserMap2 = deduplicateFcmTokens(usersToNotify);
        if (tokenToUserMap2.size > 0) {
      
          const { successTokens, failedTokens } =
            await sendNotificationToMultipleDevices(tokenToUserMap2, message);
          

          // ✅ Update lastSentField for ALL users sharing successful tokens
          if (successTokens.length > 0) {
              const bulkOps = successTokens.map((token) => ({
              updateMany: {
                filter: { 'fcmTokens.token': token },
                update: {
                  $set: { [`fcmTokens.$[elem].${lastSentField}`]: new Date() },
                },
                arrayFilters: [{ 'elem.token': token }],
              },
            }));

            await User.bulkWrite(bulkOps);
          }

          // 🧹 Bulk remove stale tokens
          if (failedTokens?.length > 0) {
            const bulkOps = failedTokens.map((token) => ({
              updateMany: {
                filter: { 'fcmTokens.token': token },
                update: { $pull: { fcmTokens: { token } } },
              },
            }));

            await User.bulkWrite(bulkOps);
          }
          console.log(
            `✅ Sent ${jobName} (device-level) to ${tokenToUserMap.size} devices`
          );
        }
      }
    } catch (err) {
      console.error(`❌ Error in ${jobName} notification:`, err);
    }
  });
};
