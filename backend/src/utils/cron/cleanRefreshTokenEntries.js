import cron from "node-cron";
import {User} from "../../models/user.model.js";
import mongoose from "mongoose";
import { APIError } from "../APIError.js";
import { Admin } from "../../models/admin.model.js";

 const cleanRefreshTokenEntries = async () => {
  const maxAgeDays = parseInt(process.env.REFRESH_TOKEN_MAX_AGE_DAYS) || 30;
  const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

  try {
    const users = await User.find({ "refreshTokens.createdAt": { $lte: cutoffDate } });

    for (const user of users) {
      user.refreshTokens = user.refreshTokens.filter(entry => entry.createdAt > cutoffDate);
      await user.save();
    }

    console.log(`[Token Cleanup] Old refresh tokens removed. Time: ${new Date().toISOString()}`);
  } catch (err) {
    throw new APIError(500, `[Token Cleanup] Error cleaning refresh tokens: ${err.message}`);
  }
};

 const cleanRefreshTokenEntriesAdmin = async () => {
  const maxAgeDays = parseInt(process.env.REFRESH_TOKEN_MAX_AGE_DAYS) || 30;
  const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

  try {
    const admins = await Admin.find({ "refreshTokens.createdAt": { $lte: cutoffDate } });

    for (const admin of admins) {
      admin.refreshTokens = admin.refreshTokens.filter(entry => entry.createdAt > cutoffDate);
      await admin.save();
    }

    console.log(`[Token Cleanup] Old refresh tokens removed. Time: ${new Date().toISOString()}`);
  } catch (err) {
    throw new APIError(500, `[Token Cleanup] Error cleaning refresh tokens: ${err.message}`);
  }
};

export { cleanRefreshTokenEntries, cleanRefreshTokenEntriesAdmin };
