import admin from '../../services/firebase.js';
import { User } from '../../models/user.model.js';
import { APIError } from '../APIError.js';
import { deduplicateFcmTokens } from './getUniqueDeviceUsers.js';

const sendNotification = async (token, { title, body, data = {} }) => {
  if (!token) return;

  const message = {
    token,
    notification: { title, body },
    data,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`✅ Notification sent to token: ${token}`);
    return response;
  } catch (error) {
    console.error(
      `❌ Error sending notification to token: ${token}`,
      error.message
    );
  }
};

const sendNotificationToMultipleUsers = async (
  users,
  { title, body, data }
) => {
  const tokenToUserMap = deduplicateFcmTokens(users);
  const tokens = [...tokenToUserMap.keys()];
  if (tokens.length === 0) return;

  const BATCH_SIZE = 500;

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data || {}).map(([k, v]) => [k, String(v)])
        ),
      });
      for (let idx = 0; idx < response.responses.length; idx++) {
        const res = response.responses[idx];
        if (!res.success) {
          const errorCode = res.error.code;

          if (
            [
              'messaging/invalid-registration-token',
              'messaging/registration-token-not-registered',
            ].includes(errorCode)
          ) {
            const failedToken = batch[idx];
            const userId = tokenToUserMap.get(failedToken)?.userId;

            if (userId) {
              await User.updateOne(
                { _id: userId },
                { $pull: { fcmTokens: { token: failedToken } } }
              );
              console.log(`🧹 Removed stale token for user ${userId}`);
            }
          }
        }
      }

      console.log(
        `✅ Sent batch ${Math.floor(i / BATCH_SIZE) + 1} of notifications`
      );
    } catch (err) {
      throw new APIError(
        500,
        `❌ Error sending batch notification: ${err.message}`
      );
    }
  }
};

const sendNotificationToMultipleDevices = async (tokenToUserMap, { title, body, data }) => {
  const tokens = Array.from(tokenToUserMap.keys());
  if (tokens.length === 0) return { successTokens: [], failedTokens: [], responses: [] };

  const BATCH_SIZE = 500;
  let allSuccessTokens = [];
  let allFailedTokens = [];
  let allResponses = [];

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    console.log("batch", batch);

    console.log(`Sending batch ${Math.floor(i / BATCH_SIZE) + 1}`);

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data || {}).map(([k, v]) => [k, String(v)])
        ),
      });

      for (let idx = 0; idx < response.responses.length; idx++) {
        const res = response.responses[idx];
        const token = batch[idx];

        if (res.success) {
          allSuccessTokens.push(token);
        } else {
          const errorCode = res.error.code;
          allFailedTokens.push(token);

          if (
            [
              "messaging/invalid-registration-token",
              "messaging/registration-token-not-registered",
            ].includes(errorCode)
          ) {
            const failedToken = token;
            const userId = tokenToUserMap.get(failedToken).userId;

            if (userId) {
              const updated = await User.updateOne(
                { _id: userId },
                { $pull: { fcmTokens: { token: failedToken } } }
              );

              console.log(
                `🧹 Removed stale token for user ${userId}:-`,
                updated
              );
            }
          }
        }
      }

      console.log(
        `✅ Sent batch ${Math.floor(i / BATCH_SIZE) + 1} of notifications`
      );

      allResponses.push(...response.responses);
    } catch (err) {
      throw new APIError(
        500,
        `❌ Error sending batch notification: ${err.message}`
      );
    }
  }

  return { successTokens: allSuccessTokens, failedTokens: allFailedTokens, responses: allResponses };
};

const sendNotificationToAllUsers = async ({ title, body, data }) => {
  try {
    const users = await User.find({
      fcmTokens: { $exists: true, $not: { $size: 0 } },
    });

    if (users.length === 0) {
      console.warn('⚠️ No users found with valid FCM tokens.');
      throw new APIError(500, '⚠️ No users found with valid FCM tokens.');
    }

    await sendNotificationToMultipleUsers(users, { title, body, data });
  } catch (err) {
    throw new APIError(
      500,
      `❌ Error sending batch notification: ${err.message}`
    );
  }
};

const sendOpportunityNotificationToAllUsers = async ({ title, body, data }) => {
  try {
    const users = await User.find({
      'notificationSettings.newOpportunities': true,
      fcmTokens: { $exists: true, $not: { $size: 0 } },
    });
    if (users.length === 0) {
      console.warn('⚠️ No users found with valid FCM tokens.');
      throw new APIError(500, '⚠️ No users found with valid FCM tokens.');
    }
    await sendNotificationToMultipleUsers(users, { title, body, data });
  } catch (err) {
    throw new APIError(
      500,
      `❌ Error sending batch notification: ${err.message}`
    );
  }
};
const sendApplicationNotificationToUser = async (
  userId,
  { title, body, data }
) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.warn(`⚠️ No FCM tokens found for user: ${userId}`);
      throw new APIError(500, `⚠️ No FCM tokens found for user: ${userId}.`);
    }

    if (user.notificationSettings.newApplications === false) {
      console.warn(`⚠️ No FCM tokens found for user: ${userId}`);
      throw new APIError(500, `⚠️ No FCM tokens found for user: ${userId}.`);
    }

  
    await sendNotificationToSingleUser(user, { title, body, data });
  } catch (err) {
    throw new APIError(
      500,
      `❌ Error sending batch notification: ${err.message}`
    );
  }
};

const sendNotificationToSingleUser = async (userid, { title, body, data }) => {
  const user = await User.findById(userid);

  if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
    console.warn(`⚠️ No FCM tokens found for user: ${user.userId}`);
    throw new APIError(500, `⚠️ No FCM tokens found for user: ${user.userId}.`);
    return;
  }

  const validTokens = [];

  for (const token of user.fcmTokens) {
    const message = {
      token: token.token,
      notification: { title, body },
      data: data || {},
    };

    try {
      const response = await admin.messaging().send(message);

      console.log(
        `✅ Sent notification to token for user ${user.fullName}:`,
        token
      );
      validTokens.push(token);
    } catch (err) {
      console.error(
        `❌ Error sending to token ${token} for user ${user.userId}:`,
        err.message
      );

      // Remove invalid or stale tokens
      if (
        [
          'messaging/invalid-registration-token',
          'messaging/registration-token-not-registered',
        ].includes(err.code)
      ) {
        await User.updateOne(
          { _id: user.userId },
          { $pull: { fcmTokens: token } }
        );
        console.log(
          `🧹 Removed invalid FCM token for user ${user.userId}:`,
          token
        );
      }
    }
  }

  return validTokens.length > 0;
};
const sendNotificationToSingleDevice = async (
  userid,
  fcmtoken,
  { title, body, data }
) => {
  const user = await User.findById(userid);

  if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
    console.warn(`⚠️ No FCM tokens found for user: ${user.userId}`);
    throw new APIError(500, `⚠️ No FCM tokens found for user: ${user.userId}.`);
    return;
  }

  const token = user.fcmTokens.filter((t) => t.token === fcmtoken);
  if (!token || token.length === 0) {
    console.warn(`⚠️ FCM token not found for user: ${user.userId}`);
    throw new APIError(500, `⚠️ FCM token not found for user: ${user.userId}.`);
  }

  const validTokens = [];
  const message = {
    token: token[0].token,
    notification: { title, body },
    data: data || {},
  };

  try {
    const response = await admin.messaging().send(message);

    console.log(
      `✅ Sent notification to token for user ${user.fullName}:`,
      token
    );
    validTokens.push(token);
  } catch (err) {
    console.error(
      `❌ Error sending to token ${token} for user ${user.userId}:`,
      err
    );

    // Remove invalid or stale tokens
    if (
      [
        'messaging/invalid-registration-token',
        'messaging/registration-token-not-registered',
      ].includes(err.code)
    ) {
      await User.updateOne(
        { _id: user.userId },
        { $pull: { fcmTokens: { token: token } } }
      );
      console.log(
        `🧹 Removed invalid FCM token for user ${user.userId}:`,
        token
      );
    }
  }

  return validTokens.length > 0;
};

export {
  sendNotificationToMultipleUsers,
  sendNotificationToAllUsers,
  sendOpportunityNotificationToAllUsers,
  sendApplicationNotificationToUser,
  sendNotificationToSingleUser,
  sendNotificationToSingleDevice,
  sendNotification,
  sendNotificationToMultipleDevices,
};
