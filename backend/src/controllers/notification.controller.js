import { asyncHandler } from '../utils/asyncHandler.js';
import {
  sendApplicationNotificationToUser,
  sendNotification,
  sendNotificationToAllUsers,
  sendNotificationToMultipleDevices,
  sendNotificationToSingleDevice,
  sendNotificationToSingleUser,
  sendOpportunityNotificationToAllUsers,
} from '../utils/notification/sendNotification.js';
import { APIError } from '../utils/APIError.js';
import { APIResponse } from '../utils/APIResponse.js';
import { User } from '../models/user.model.js';
import moment from 'moment-timezone';

const sendNotificationToUser = asyncHandler(async (req, res) => {
  const { userId, title, body, data } = req.body;

  try {
    const response = await sendNotificationToSingleUser(userId, {
      title,
      body,
      data,
    });
    res
      .status(200)
      .json(new APIResponse(200, response, 'Notification sent successfully'));
  } catch (err) {
    throw new APIError(500, err.message || 'Error sending notification');
  }
});
const sendNotificationToUserDevice = asyncHandler(async (req, res) => {
  const { userId, title, body, data, token } = req.body;

  try {
    const response = await sendNotificationToSingleDevice(userId, token, {
      title,
      body,
      data,
    });
    res
      .status(200)
      .json(new APIResponse(200, response, 'Notification sent successfully'));
  } catch (err) {
    throw new APIError(500, err.message || 'Error sending notification');
  }
});
const saveFcmToken = async (req, res) => {
  const userId = req.user._id;
  const userAgent = req.headers['user-agent'] || 'Unknown';

  const { fcmToken, timezone } = req.body;
  const lastOpenedAppAt = new Date();
  const today = new Date();

  const yesterday = new Date(today);

  yesterday.setDate(today.getDate() - 1);

  const lastStartOfDayNotificationSentAt = yesterday;

  const lastEndOfDayNotificationSentAt = yesterday;

  if (!fcmToken || !timezone) {
    throw new APIError(
      400,
      'FCM token, timezone, and lastOpenedAppAt are required.'
    );
  }

  try {
    const user = await User.findOne({
      _id: userId,
      'fcmTokens.token': fcmToken,
    });

    if (user) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'fcmTokens.$[elem].timezone': timezone,
            'fcmTokens.$[elem].lastOpenedAppAt': new Date(lastOpenedAppAt),
            'fcmTokens.$[elem].userAgent': userAgent,
          },
        },
        {
          arrayFilters: [{ 'elem.token': fcmToken }],
          new: true,
          select: 'fcmTokens',
          lean: true,
        }
      );
      if (!updatedUser) {
        throw new APIError(404, 'User not found during update.');
      }
      return res
        .status(200)
        .json(
          new APIResponse(
            200,
            { fcmTokens: updatedUser.fcmTokens },
            'FCM token updated successfully.'
          )
        );
    } else {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $addToSet: {
            fcmTokens: {
              token: fcmToken,
              timezone: timezone,
              lastOpenedAppAt: new Date(lastOpenedAppAt),
              userAgent: userAgent,
              lastStartOfDayNotificationSentAt: new Date(
                lastStartOfDayNotificationSentAt
              ),
              lastEndOfDayNotificationSentAt: new Date(
                lastEndOfDayNotificationSentAt
              ),
            },
          },
        },
        {
          new: true,
          select: 'fcmTokens',
          lean: true,
        }
      );
      if (!updatedUser) {
        throw new APIError(404, 'User not found during add.');
      }
      return res
        .status(200)
        .json(
          new APIResponse(
            200,
            { fcmTokens: updatedUser.fcmTokens },
            'FCM token added successfully.'
          )
        );
    }
  } catch (err) {
    console.error('Error saving FCM token:', err);
    throw new APIError(
      500,
      `An internal server error occurred: ${err.message}`
    );
  }
};

const removeFcmToken = async (req, res) => {
  const userId = req.user._id;
  const { fcmToken } = req.body;

  if (!fcmToken) {
    throw new APIError(400, 'FCM token is required.');
  }

  try {
    const result = await User.updateOne(
      { _id: userId },
      { $pull: { fcmTokens: { token: fcmToken } } }
    );

    if (result.nModified === 0 && result.ok === 1) {
      return res
        .status(200)
        .json(new APIResponse(200, {}, 'FCM token removed successfully.'));
    }

    if (result.nModified === 0) {
      throw new APIError(404, 'User or token not found.');
    }

    res
      .status(200)
      .json(new APIResponse(200, {}, 'FCM token removed successfully.'));
  } catch (err) {
    console.error('Error removing FCM token:', err);
    throw new APIError(500, 'An internal server error occurred.');
  }
};

const getNotificationSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    return res.status(404).json(new APIResponse(404, [], 'User not found'));
  }
  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        user.notificationSettings,
        'Notification settings fetched successfully'
      )
    );
});

const updateNotificationSettings = asyncHandler(async (req, res) => {
  const allowedKeys = [
    'newOpportunities',
    'applicationUpdates',
    'dailyStreakReminders',
  ];
  const updates = {};

  allowedKeys.forEach((key) => {
    if (req.body.hasOwnProperty(key)) {
      updates[`notificationSettings.${key}`] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true }
  );

  res
    .status(200)
    .json(
      new APIResponse(
        200,
        user.notificationSettings,
        'Notification settings updated successfully'
      )
    );
});

const sendApplicationNotification = asyncHandler(async (req, res) => {
  const { userId, title, body, data } = req.body;

  if (!userId || !title || !body) {
    throw new APIError(400, 'User ID, title, and body are required.');
  }

  try {
    sendApplicationNotificationToUser(userId, { title, body, data });
    res
      .status(200)
      .json(new APIResponse(200, {}, 'Notification sent successfully.'));
  } catch (err) {
    throw new APIError(500, `Error sending notification: ${err.message}`);
  }
});

const sendToAll = asyncHandler(async (req, res) => {
  const { title, body, data } = req.body;

  if (!title || !body) {
    throw new APIError(400, 'Title and body are required.');
  }

  try {
    await sendNotificationToAllUsers({
      title,
      body,
      data,
    });

    res
      .status(200)
      .json(
        new APIResponse(
          200,
          {},
          'Notifications sent successfully to all users.'
        )
      );
  } catch (err) {
    throw new APIError(500, `Error sending notifications: ${err.message}`);
  }
});

const dailyNotification = asyncHandler(async (req, res) => {
  const { jobName, hour, message } = req.body;
  let checkCondition = (token, localNow) => {
    if (!token.lastOpenedAppAt) return true; // never opened before
    const startOfDay = localNow.clone().startOf('day');
    return moment(token.lastOpenedAppAt).isBefore(startOfDay); // hasn't opened today
  };
  const lastSentField = `last${jobName}NotificationSentAt`;
  console.log(`⏰ Running ${jobName} notification check...`);

  try {
    checkCondition = () => true;
    const nowUTC = moment.utc();
    const users = await User.find({
      'notificationSettings.dailyStreakReminders': true,
      fcmTokens: { $exists: true, $not: { $size: 0 } },
    });

    if (!users.length) {
      console.log(`⚠️ No users found for ${jobName}.`);
      return;
    }

    const todayDate = nowUTC.format('YYYY-MM-DD');

    const tokenToUserMap = new Map();

    for (const user of users) {
      for (const token of user.fcmTokens) {
        const timezone = token.timezone;

        if (!timezone) continue;

        const localNow = nowUTC.clone().tz(timezone);
        const localHHmm = localNow.format('HH:mm');

        const isNotificationTime =
          localHHmm >= `${hour.toString().padStart(2, '0')}:00` &&
          localHHmm < `${hour.toString().padStart(2, '0')}:59`;

        const lastSent = token[lastSentField]
          ? moment(token[lastSentField]).tz(timezone).format('YYYY-MM-DD')
          : null;
        const alreadySentToday = lastSent === todayDate;

        if (
          isNotificationTime &&
          !alreadySentToday &&
          checkCondition(token, localNow)
        ) {
          tokenToUserMap.set(token, user._id.toString());
        }
      }
    }

    if (!(tokenToUserMap.size > 0)) {
      console.log(`⚠️ No devices due for ${jobName} notification this run.`);
      return;
    }

  

    await sendNotificationToMultipleDevices(tokenToUserMap, message);

    console.log(`✅ Processed ${tokenToUserMap.size} devices for ${jobName}.`);
    res
      .status(200)
      .json(new APIResponse(200, {}, 'Notifications sent successfully.'));
  } catch (error) {
    console.error(`❌ Error in ${jobName} notification process:`, error);
    throw new APIError(
      500,
      `Error in ${jobName} notification process: ${error.message}`
    );
  }
});

export {
  sendNotificationToUser,
  sendNotificationToUserDevice,
  saveFcmToken,
  removeFcmToken,
  getNotificationSettings,
  updateNotificationSettings,
  sendApplicationNotification,
  sendToAll,
  dailyNotification,
};
