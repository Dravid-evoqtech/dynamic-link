import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { APIError } from '../utils/APIError.js';
import { APIResponse } from '../utils/APIResponse.js';
import generateReferralCode from '../utils/generateReferralCode.js';
import { DEFAULT_AVATAR_URL, USER, USER_STATUS } from '../constants/index.js';
import { generateAccessAndRefreshToken } from '../utils/generateTokens.js';
import {
  changeUserPassword,
  updateUserProfileAvatar,
} from '../utils/user/userProfile.utils.js';
import updateLoginStats from '../utils/user/updateLoginStats.js';
import { LoginData } from '../models/LoginData.model.js';

import { OAuth2Client } from 'google-auth-library';
import { generateAppleClientSecret } from '../config/generateAppleClientSecret.js';
import { handleGoogleLogin } from '../utils/user/handleGoogleLogin.js';
import { handleAppleLogin } from '../utils/user/handleAppleLogin.js';
import { handleEmailLogin } from '../utils/user/handleEmailLogin.js';
import appleSignin from 'apple-signin-auth';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/sendEmail.js';
import axios from 'axios';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerUser = asyncHandler(async (req, res) => {
  // Getting the data from frontend
  let { password, confirmPassword, fullName, email, timezone } = req.body;

  const userAgent = req.headers['user-agent'] || 'Unknown';
  let user;
  // Validating and formating the data
  if (
    [password, confirmPassword, fullName, email, timezone].some(
      (field) => field?.trim() === ''
    )
  ) {
    throw new APIError(400, `all fields are required!!!`);

  }

  if (password !== confirmPassword) {
    throw new APIError(400, 'Password and Confirm Password do not match');

  }

  // checking if user exists or not
  const userExist = await User.findOne({
    email: email.toLowerCase(),
  });

  if (userExist) {
    throw new APIError(400, 'User Already Exists...');

  }
  // Create new user
  const createdUser = await User.create({
    password,
    email,
    fullName,
    points: 10,
    timezone,
    authProvider: 'local',
    avatar: {
      avatarUrl: DEFAULT_AVATAR_URL,
      avatarPublicId: null,
    }, // fallback to default avatar from schema
  });

  // checking if user is created successfully

  const userData = await User.findById(createdUser._id)
    .populate('programs')
    .populate('interests')
    .populate('goals')
    .populate('opportunityType')
    .populate('grade')
    .populate('availability')
    .populate('savedOpportunities')
    .select('-password -refreshTokens');

  if (!userData) {
    throw new APIError(500, 'Something went wrong while registering the user');
  }
  user = userData;

  // generate and store tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
    userAgent
  );

  //update status
  await updateLoginStats(user._id, {
    dayPercentageIncrement: 50,
  });

  // set tokens in cookie and send response
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
  };

  return res
    .cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 || process.env.ACCESS_TOKEN_EXPIRY,
    }) // 15 minutes
    .cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 || process.env.REFRESH_TOKEN_EXPIRY,
    }) // 7 days

    .status(200)
    .json(
      new APIResponse(
        200,
        {
          user: {
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            authProvider: user.authProvider,
          },
          isNewUser: userData?.isNewUser || false,
        },
        'Registered Successfully'
      )
    );
});

const registerUser2 = asyncHandler(async (req, res) => {
  // Getting the data from frontend
  let { password, confirmPassword, fullName, email, referralCode } = req.body;

  if (!referralCode || referralCode.trim() === '') {
    throw new APIError(400, 'Referral Code is Required');

  }

  let referredByUser = null;
  if (referralCode) {
    referredByUser = await User.findOne({ referralCode });
    if (!referredByUser) {
      throw new APIError(400, 'Invalid referral code');
    
    }
  }

  // Validating and formating the data
  if (
    [password, confirmPassword, fullName, email].some(
      (field) => field?.trim() === ''
    )
  ) {
    throw new APIError(400, `all fields are required!!!`);
 
  }

  if (password !== confirmPassword) {
    throw new APIError(400, 'Password and Confirm Password do not match');

  }

  // checking if user exists or not
  const userExist = await User.findOne({
    email: email.toLowerCase(),
  });

  if (userExist) {
    throw new APIError(400, 'User Already Exists...');

  }
  // Create new user
  const createdUser = await User.create({
    password,
    email,
    fullName,
    points: 10,
    referralCode: generateReferralCode(fullName),
    referredBy: referralCode || null,
    avatar: {
      avatarUrl: DEFAULT_AVATAR_URL,
      avatarPublicId: null,
    }, // fallback to default avatar from schema
  });

  //  Update referrer
  if (referredByUser) {
    referredByUser.referrals.push(createdUser._id);
    referredByUser.points += 10; // reward logic (optional)
    await referredByUser.save();
  }

  // checking if user is created successfully

  const userData = await User.findById(createdUser._id)
    .populate('programs')
    .populate('interests')
    .populate('goals')
    .populate('opportunityType')
    .populate('grade')
    .populate('availability')
    .populate('savedOpportunities')
    .select('-password -refreshToken');

  if (!userData) {
    throw new APIError(500, 'Something went wrong while registering the user');

  }

  // Send back data to frontend
  return res
    .status(201)
    .json(new APIResponse(200, userData, 'Account Created Successfully'));
});

const unifiedLogin = async (req, res) => {
  const { provider } = req.body;

  const userAgent = req.headers['user-agent'] || 'Unknown';
  const fullName = 'Apple User';
  try {
    let user, userData;

    if (provider === 'google') {
      userData = await handleGoogleLogin(req.body);
    } else if (provider === 'apple') {
      userData = await handleAppleLogin(req.body, fullName);
    } else if (provider === 'local') {
      userData = await handleEmailLogin(req.body.email, req.body.password);
    } else {
      throw new APIError(400, 'Invalid provider');
    }
    user = userData.user;

    // generate and store tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id,
      userAgent
    );

    //update status
    await updateLoginStats(user._id, {
      dayPercentageIncrement: 50,
    });

    // set tokens in cookie and send response
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    };

    return res
      .cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000 || process.env.ACCESS_TOKEN_EXPIRY,
      }) // 15 minutes
      .cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 || process.env.REFRESH_TOKEN_EXPIRY,
      }) // 7 days

      .status(200)
      .json(
        new APIResponse(
          200,
          {
            user: {
              _id: user._id,
              email: user.email,
              fullName: user.fullName,
              authProvider: user.authProvider,
            },
            isNewUser: userData?.isNewUser || false,
          },
          'Logged In Successfully'
        )
      );
  } catch (error) {
    throw new APIError(401, error.message);
  }
};

const logoutCurrentDevice = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.sendStatus(204);

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded._id);

    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        (entry) => entry.jti !== decoded.jti
      );

      await user.save();
    }
  } catch (err) {
    throw new APIError(401, 'Invalid refresh token');
  }

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'None', // or "Strict", based on frontend setup
  };
  res
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .status(200)
    .json(new APIResponse(200, {}, 'Logged out successfully'));
});
const logoutAllDevices = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshTokens: [] });

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  };

  res
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .status(200)
    .json(new APIResponse(200, {}, 'Logged out from all devices'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const oldToken = req.token;
  const { jti: oldJti } = jwt.decode(oldToken);

  // Remove old refresh token from DB
  const updatedTokens = [];
  for (const entry of req.user.refreshTokens) {
    if (entry.jti === oldJti) {
      const isMatch = await bcrypt.compare(oldToken, entry.token);
      if (!isMatch) updatedTokens.push(entry);
    } else {
      updatedTokens.push(entry);
    }
  }

  req.user.refreshTokens = updatedTokens;
  await req.user.save();

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    req.user._id,
    req.headers['user-agent'] || 'Unknown'
  );

  // Set new cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
  };

  res
    .cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 || process.env.ACCESS_TOKEN_EXPIRY,
    })
    .cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 || process.env.REFRESH_TOKEN_EXPIRY,
    })
    .status(200)
    .json(new APIResponse(200, { accessToken }, 'Access token refreshed'));
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new APIError(400, 'All Fields Required');
  }

  await changeUserPassword(req.user?._id, oldPassword, newPassword);

  return res
    .status(200)
    .json(new APIResponse(200, {}, 'Password Changed Successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new APIResponse(201, req.user, 'User fetched Successfully'));
});

const saveUserProfileData = asyncHandler(async (req, res) => {
  const {
    _id,
    opportunityType,
    dateOfBirth,
    programs,
    grade,
    location,
    availability,
    interests,
    goals,
  } = req.body;
  // Validate input
  if (
    !_id &&
    !dateOfBirth &&
    !location &&
    !grade &&
    !opportunityType &&
    !programs &&
    !availability &&
    !interests &&
    !goals
  ) {
    throw new APIError(400, 'At least one field required');
  }
  const user = await User.findById(_id)
    .populate('programs')
    .populate('interests')
    .populate('goals')
    .populate('opportunityType')
    .populate('grade')
    .populate('availability')
    .populate('savedOpportunities')
    .select('-password -refreshToken ');

  if (dateOfBirth) user.dateOfBirth = dateOfBirth;

  if (location) user.location = location;

  if (grade) user.grade = grade;

  if (opportunityType) user.opportunityType = opportunityType;

  if (programs) user.programs = programs;

  if (availability) user.availability = availability;

  if (interests) user.interests = interests;

  if (goals) user.goals = goals;

  // Save the updated user data
  const updatedUserData = await user.save();

  if (!updatedUserData) {
  
    return res
      .status(500)
      .json(new APIResponse(500, [], 'Error while Updating User Data'));
  }

  delete updatedUserData.password;

  return res
    .status(200)
    .json(new APIResponse(200, updatedUserData, 'Profile saved Successfully'));
});
const updateUserProfile = asyncHandler(async (req, res) => {
  const {
    fullName,
    bio,
    dateOfBirth,
    location,
    highSchool,
    highSchoolGraduationYear,
    currentPassword,
    newPassword,
    confirmPassword,
  } = req.body;
 
  

  // Handle both disk storage (local) and memory storage (production)
  const avatarFile = req.file?.path || req.file?.buffer;
  // Validate input

  if (
    !fullName &&
    !dateOfBirth &&
    !location &&
    !highSchool &&
    !highSchoolGraduationYear &&
    !currentPassword &&
    !newPassword &&
    !confirmPassword &&
    !bio &&
    !avatarFile
  ) {
    throw new APIError(400, 'At least one field required');
  }
  const user = await User.findById(req.user?._id)
    .populate('programs')
    .populate('interests')
    .populate('goals')
    .populate('opportunityType')
    .populate('grade')
    .populate('availability')
    .select(
      '-password -refreshTokens -savedOpportunities -unlockedOpportunities -applications -availability -programs -interests -goals -opportunityType -grade'
    );

  if (fullName) user.fullName = fullName;

  if (dateOfBirth) user.dateOfBirth = dateOfBirth;

  if (location) user.location = location;

  if (bio) user.bio = bio;

  if (highSchool) user.highSchool = highSchool;

  if (highSchoolGraduationYear)
    user.highSchoolGraduationYear = highSchoolGraduationYear;

  if (newPassword !== confirmPassword) {
    throw new APIError(400, 'New password and confirm password do not match');
  }
  // handle password change
  if (newPassword)
    await changeUserPassword(req.user?._id, currentPassword, newPassword);

  // Handle avatar upload
  if (avatarFile) {
    console.log('Uploading avatar...');

    const updatedUser = await updateUserProfileAvatar(
      req.user?._id,
      avatarFile
    );
  }
  // Save the updated user data
  const updatedUserData = await user.save();

  if (!updatedUserData) {
    return res
      .status(500)
      .json(new APIResponse(500, [], 'Error while Updating User Data'));
  }

  delete updatedUserData.password;

  return res
    .status(200)
    .json(
      new APIResponse(200, updatedUserData, 'Profile updated Successfully')
    );
});

const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      throw new APIError(400, 'User ID is required');
    }
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new APIError(404, 'User not found');
    }
    return res
      .status(204)
      .json(new APIResponse(204, [], 'User deleted successfully'));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new APIError(500, 'Failed to delete user');
  }
});

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new APIError(404, 'User not found');

    // Generate OTP
  
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    const hashedOTP = await bcrypt.hash(otp, 10);

    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 min expiry
    await user.save();

    const message = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 0;
      margin: 0;
    }
    .container {
      max-width: 500px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0px 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: #4CAF50;
      padding: 20px;
      text-align: center;
      color: #ffffff;
      font-size: 20px;
    }
    .content {
      padding: 20px;
      color: #333333;
      line-height: 1.5;
    }
    .otp {
      display: inline-block;
      background: #f0f0f0;
      font-size: 22px;
      letter-spacing: 4px;
      padding: 10px 20px;
      border-radius: 6px;
      margin-top: 10px;
      font-weight: bold;
    }
    .footer {
      background: #f9f9f9;
      padding: 15px;
      text-align: center;
      font-size: 12px;
      color: #888888;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Password Reset Request</div>
    <div class="content">
      <p>Hello,</p>
      <p>We received a request to reset your password. Use the OTP below to proceed. This OTP is valid for <strong>10 minutes</strong>.</p>
      <div class="otp">${otp}</div>
      <p>If you did not request a password reset, please ignore this email or contact our support team immediately.</p>
      <p>Thanks,<br>The Support Team</p>
    </div>
    <div class="footer">
      © 2025 FutureFind. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

    await sendEmail({
      email: email,
      subject: 'Password Reset Request',
      message: message,
    });

    res.status(200).json(new APIResponse(200, {}, 'OTP sent to your email'));
  } catch (err) {
    throw new APIError(500, `Failed to send OTP: ${err.message}`);
  }
};
const verifyOTP = async (req, res) => {
  const { otp, email } = req.body;

  if (!otp) throw new APIError(400, 'OTP is required');

  const user = await User.findOne({ email });

  if (!user) throw new APIError(404, 'User not found');

  if (!user.resetPasswordOTP || !user.resetPasswordExpires) {
    throw new APIError(400, 'OTP not requested');
  }

  const isMatch = await bcrypt.compare(otp, user.resetPasswordOTP);

  if (!isMatch) throw new APIError(400, 'Invalid OTP');

  await user.save();

  res.status(200).json(new APIResponse(200, {}, 'OTP verified successfully'));
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throw new APIError(400, 'Passwords do not match');
    }

    const user = await User.findOne({ email });
    if (!user) throw new APIError(404, 'User not found');

    if (!user.resetPasswordOTP || !user.resetPasswordExpires) {
      throw new APIError(400, 'OTP not requested');
    }

    if (Date.now() > user.resetPasswordExpires) {
      throw new APIError(400, 'OTP expired');
    }

    const isMatch = await bcrypt.compare(otp, user.resetPasswordOTP);
    if (!isMatch) throw new APIError(400, 'Invalid OTP');

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json(new APIResponse(200, {}, 'Password reset successful'));
  } catch (err) {
    throw new APIError(500, `Failed to reset password: ${err.message}`);
  }
};

const updateUserAvatar = asyncHandler(async (req, res) => {
  // Handle both disk storage (local) and memory storage (production)
  const avatarFile = req.file?.path || req.file?.buffer;

  if (!avatarFile) {
    throw new APIError(400, 'File is required');
  }
  const updatedUser = await updateUserProfileAvatar(req.user?._id, avatarFile);

  return res
    .status(200)
    .json(new APIResponse(200, updatedUser, 'Avatar updated successfully'));
});

const updatePrograms = asyncHandler(async (req, res) => {
  const { programs } = req.body;
  const user = await User.findById(req.user?._id);
  user.programs = programs;
  const updatedUser = await user.save();
  return res
    .status(200)
    .json(new APIResponse(200, updatedUser, 'Programs updated successfully'));
});

const updateAvailability = asyncHandler(async (req, res) => {
  const { availability } = req.body;
  const user = await User.findById(req.user?._id);
  user.availability = availability;
  const updatedUser = await user.save();
  return res
    .status(200)
    .json(
      new APIResponse(200, updatedUser, 'Availability updated successfully')
    );
});

const updateLocation = asyncHandler(async (req, res) => {
  const { location } = req.body;

  const user = await User.findById(req.user?._id).select(
    '-password -refreshToken '
  );
  user.location = location;

  const updatedUser = await user.save();

  return res
    .status(200)
    .json(new APIResponse(200, updatedUser, 'Location updated successfully'));
});

const updateInterests = asyncHandler(async (req, res) => {
  const { interests } = req.body;
  const user = await User.findById(req.user?._id);
  user.interests = interests;
  const updatedUser = await user.save();
  return res
    .status(200)
    .json(new APIResponse(200, updatedUser, 'Interests updated successfully'));
});

const getStatistics = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).populate('applications');

  if (!user) {
    return res.status(404).json(new APIResponse(404, [], 'User not found'));
  }

  let totalPoints = user.points;
  let applicationsCount = user.applications.length;
  let level = user.level;
  let savedApplicationsCount = user.applications.filter(
    (application) => application.isSaved
  ).length;
  let appliedApplicationsCount = user.applications.filter(
    (application) => application.status === 'Applied'
  ).length;
  let loginStreak = user.loginData.currentLoginStreak;

  const statistics = {
    totalPoints,
    applicationsCount,
    level,
    savedApplicationsCount,
    appliedApplicationsCount,
    loginStreak,
  };

  return res
    .status(200)
    .json(new APIResponse(200, statistics, 'Statistics fetched successfully'));
});

const updateLoginData = asyncHandler(async (req, res) => {
  const { dayPercentageIncrement } = req.body;

  const userId = req.user._id;

  const loginStat = await LoginData.findOne({ user: userId });
  if (!loginStat) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'Login data not found'));
  }
  const updatedLoginData = await updateLoginStats(userId, {
    dayPercentageIncrement,
  });

  return res
    .status(200)
    .json(
      new APIResponse(200, updatedLoginData, 'Login data updated successfully')
    );
});
const updateAllUsers = asyncHandler(async (req, res) => {
  const updatedUsers = await User.updateMany(
    {},
    { $set: { timezone: 'Etc/UTC' } }
  );
  return res
    .status(200)
    .json(new APIResponse(200, updatedUsers, 'All users updated successfully'));
});

export {
  registerUser,
  registerUser2,
  refreshAccessToken,
  changePassword,
  saveUserProfileData,
  updateUserProfile,
  getCurrentUser,
  updateUserAvatar,
  updatePrograms,
  updateAvailability,
  updateLocation,
  updateInterests,
  getStatistics,
  updateLoginData,
  unifiedLogin,
  logoutCurrentDevice,
  logoutAllDevices,
  requestPasswordReset,
  resetPassword,
  deleteUser,
  verifyOTP,
  updateAllUsers,
};
