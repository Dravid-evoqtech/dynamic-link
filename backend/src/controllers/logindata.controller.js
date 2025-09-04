import { LoginData } from "../models/LoginData.model.js";
import { User } from "../models/user.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import updateLoginStats from "../utils/user/updateLoginStats.js";

export const getLogindata = asyncHandler(async (req, res) => {

    const logindata = await LoginData.find({ user: req.user._id });
    const points = await User.findById(req.user._id).select("points");

    if (!logindata) {
        return res
            .status(404)
            .json(new APIResponse(404, [], "Login data not found"));
    }

    return res.status(200).json(new APIResponse(200, {logindata, points}, "Logindata retrieved successfully"));
});

export const updateLoginDataforUser = asyncHandler(async (req, res) => {

    const logindata1 = await LoginData.find({ user: req.user._id });

    if (!logindata1) {
        return res
            .status(404)
            .json(new APIResponse(404, [], "Login data not found"));
    }

    const { loginData, justReached100 } = await updateLoginStats(req.user._id, { dayPercentageIncrement: req.body.dayPercentageIncrement });

    const points = await User.findById(req.user._id).select("points");

    return res
        .status(200)
        .json(new APIResponse(200, { loginData, justReached100, points }, "Login data updated successfully"));

})

export const addOneDay = asyncHandler(async (req, res) => {
    const dayCount = req.body.dayCount ?? 1;

    const loginData = await LoginData.findOne({ user: req.user._id });

    if (!loginData) {
        return res
            .status(404)
            .json(new APIResponse(404, [], "Login data not found"));
    }

    // Correct date calculation: Today + dayCount in UTC
    const simulatedDate = new Date(Date.now() + dayCount * 24 * 60 * 60 * 1000);
    simulatedDate.setUTCHours(0, 0, 0, 0);

    const { loginData: updatedLoginData, justReached100 } = await updateLoginStats2(req.user._id, {
        dayPercentageIncrement: 100,
        testDate: simulatedDate
    });

    const user = await User.findById(req.user._id).select("points");

    return res
        .status(200)
        .json(new APIResponse(
            200,
            { loginData: updatedLoginData, justReached100, points: user.points },
            `Login data updated for dayCount=${dayCount}`
        ));
});

const updateLoginStats2 = async (userId, options = {}) => {
    const now = options.testDate ? new Date(options.testDate) : new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const { dayPercentageIncrement = 0 } = options;
    const increment = Number(dayPercentageIncrement) || 0;

    let loginData = await LoginData.findOne({ user: userId });
    let justReached100 = false;

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

    // Check if today already logged
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

    // Cap login history to last 30 entries
    const MAX_HISTORY = 30;
    if (loginData.loginHistory.length > MAX_HISTORY) {
        loginData.loginHistory = loginData.loginHistory.slice(-MAX_HISTORY);
    }

    const alreadyLoggedToday =
        lastLogin && lastLogin.toISOString().split("T")[0] === today;

    if (todayEntry.dayPercentage >= 100 && !alreadyLoggedToday) {
        loginData.lastLoginAt = now;
        loginData.loginCount += 1;

        if (diffDays === 1) {
            loginData.currentLoginStreak += 1;
        } else {
            loginData.currentLoginStreak = 1; // Reset streak
        }

        loginData.longestLoginStreak = Math.max(
            loginData.longestLoginStreak,
            loginData.currentLoginStreak
        );

        // Fetch points
        const user = await User.findById(userId).select("points");
        if (!user.points) {
            user.points = { total: 0, dailyActivity: 0 };
        }

        // Custom point logic
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

