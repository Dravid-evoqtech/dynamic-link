import { User } from "../../models/user.model.js";

/**
 * Returns unique devices with their last active user.
 * - Deduplicates by fcmToken
 * - Picks the user who last opened the app for each token
 */
export const getUniqueDeviceUsers = async () => {
  const usersWithTokens = await User.find({ 'fcmTokens.0': { $exists: true } });

  const deviceMap = new Map();

  usersWithTokens.forEach((user) => {
    user.fcmTokens.forEach((tokenObj) => {
      const { token, lastOpenedAppAt } = tokenObj;
      if (!token) return;

      if (
        !deviceMap.has(token) ||
        (lastOpenedAppAt &&
          deviceMap.get(token).lastOpenedAppAt < lastOpenedAppAt)
      ) {
        deviceMap.set(token, {
          token,
          user,
          lastOpenedAppAt,
        });
      }
    });
  });

  return Array.from(deviceMap.values()); 
};

export function deduplicateFcmTokens(users) {
  const tokenMap = new Map();

  for (const user of users) {
    for (const tokenObj of user.fcmTokens || []) {
      if (!tokenObj?.token) continue;

      const existing = tokenMap.get(tokenObj.token);
      if (
        !existing ||
        (tokenObj.lastOpenedAppAt &&
          (!existing.lastOpenedAppAt ||
            existing.lastOpenedAppAt < tokenObj.lastOpenedAppAt))
      ) {
        tokenMap.set(tokenObj.token, {
          userId: user._id.toString(),
          lastOpenedAppAt: tokenObj.lastOpenedAppAt,
        });
      }
    }
  }

  return tokenMap;
}
