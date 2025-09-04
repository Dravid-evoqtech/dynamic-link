import { LoginData } from "../../models/LoginData.model.js";
import { User } from "../../models/user.model.js";

const updateLoginStats = async (userId, options = {}) => {
  const now = new Date();
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const { dayPercentageIncrement = 0 } = options;
  const increment = Number(dayPercentageIncrement) || 0;

  let loginData = await LoginData.findOne({ user: userId });

  let justReached100 = false;

  // First-time login data creation
  if (!loginData) {
    loginData = await LoginData.create({
      user: userId,
      firstLoginAt: now,
      loginCount: 0,
      currentLoginStreak: 0,
      longestLoginStreak: 0,
      loginHistory: [
        {
          date: now,
          dayPercentage: increment,
        },
      ],
    });

    if (increment >= 100) {
      loginData.loginCount = 1;
      loginData.currentLoginStreak = 1;
      loginData.longestLoginStreak = 1;
      loginData.lastLoginAt = now;
      justReached100 = true;
    }

    await User.findByIdAndUpdate(userId, { loginData: loginData._id });

    await loginData.save();
    return { loginData, justReached100 };
  }

  const lastLogin = loginData.lastLoginAt;
  const diffDays = lastLogin
    ? Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24))
    : null;

  // Find or create today's history entry
  let todayEntry = loginData.loginHistory.find(entry =>
    entry.date.toISOString().startsWith(today)
  );

  if (todayEntry && todayEntry.dayPercentage < 100) {
    todayEntry.dayPercentage += increment;
  } else if (todayEntry && todayEntry.dayPercentage >= 100) {
    todayEntry.dayPercentage = 100;
  } else {
    todayEntry = {
      date: now,
      dayPercentage: increment,
    };
    loginData.loginHistory.push(todayEntry);
  }

  // Cap login history to 30 entries
  const MAX_HISTORY = 30;
  if (loginData.loginHistory.length > MAX_HISTORY) {
    loginData.loginHistory = loginData.loginHistory.slice(-MAX_HISTORY);
  }

  // Check if today's entry has just reached 100%
  const alreadyLoggedToday =
    lastLogin && lastLogin.toISOString().split("T")[0] === today;

  if (todayEntry.dayPercentage >= 100 && !alreadyLoggedToday) {
    loginData.lastLoginAt = now;
    loginData.loginCount += 1;

    if (diffDays === 1) {
      loginData.currentLoginStreak += 1;
    } else {
      loginData.currentLoginStreak = 1;
    }

    loginData.longestLoginStreak = Math.max(
      loginData.longestLoginStreak,
      loginData.currentLoginStreak
    );

    const user = await User.findById(userId).select("points");

    if (!user.points) {
      user.points = { total: 0, dailyActivity: 0 };
    }
    let earnedPoints = 0;
    if (loginData.currentLoginStreak === 2) {
      earnedPoints = 10;
    } else if (loginData.currentLoginStreak > 2) {
      earnedPoints = 5;
    }

    user.points.total += earnedPoints;
    user.points.dailyActivity += earnedPoints;

    await User.findByIdAndUpdate(userId, { points: user.points });
    justReached100 = true;
  }

  await loginData.save();
  return { loginData, justReached100 };
};


export default updateLoginStats;