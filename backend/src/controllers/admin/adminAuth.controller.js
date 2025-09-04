import { Admin } from '../../models/admin.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { APIError } from '../../utils/APIError.js';
import { APIResponse } from '../../utils/APIResponse.js';
import { DEFAULT_AVATAR_URL } from '../../constants/index.js';
import { generateAccessAndRefreshTokenAdmin } from '../../utils/generateTokens.js';
import sendEmail from '../../utils/sendEmail.js';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const registerAdmin = asyncHandler(async (req, res) => {

  // Getting the data from frontend
  let { password, fullName, email } = req.body;

  // Validating and formating the data
  if ([password, fullName, email].some((field) => field?.trim() === '')) {
    throw new APIError(400, `all fields are required!!!`);
  }

  // checking if user exists or not
  const userExist = await Admin.findOne({
    email: email.toLowerCase(),
  });

  if (userExist) {
    // throw new APIError(400, "User Already Exists...");
    return res
      .status(400)
      .json(new APIResponse(400, [], 'User Already Exists...'));
  }

  // Handling File
  let avatarLocalPath = '';
  if (req.files && req.files.avatar && req.files?.avatar.length > 0) {
    avatarLocalPath = req.files?.avatar[0]?.path;
  }
  // if (!avatarLocalPath) {
  //   throw new APIError(400, "avatar Image is Required");
  // }

  // uploading on cloudinary
  let avatarRes;
  if (avatarLocalPath) {
    avatarRes = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarRes)
      throw new APIError(
        500,
        'Internal Server Error!!! Files Unable to Upload'
      );
  }
  // Create new user
  const createdUser = await Admin.create({
    password,
    email,
    fullName,
    avatar: avatarRes
      ? {
          avatarUrl: avatarRes.url,
          avatarPublicId: avatarRes.public_id,
        }
      : {
          avatarUrl: DEFAULT_AVATAR_URL,
          avatarPublicId: null,
        }, // fallback to default avatar from schema
  });

  // checking if user is created successfully

  const userData = await Admin.findById(createdUser._id).select(
    '-password -refreshToken'
  );

  if (!userData) {
    throw new APIError(500, 'Something went wrong while registering the user');
  }

  // Send back data to frontend
  return res
    .status(201)
    .json(new APIResponse(200, userData, 'Account Created Successfully'));
});

const loginAdmin1 = asyncHandler(async (req, res) => {
  let { email, password } = req.body;

  // validate
  if (!email || !password) {
    throw new APIError(400, ' Email is required');
  }

  // find User

  const user = await Admin.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    // throw new APIError(404, "User not Found");
    return res.status(404).json(new APIResponse(404, [], 'User not Found'));
  }

  const isCredentialValid = await user.isPasswordCorrect(password);
  if (!isCredentialValid) {
    // throw new APIError(401, "Credential Invalid");
    return res.status(401).json(new APIResponse(401, [], 'Incorrect Password'));
  }

  // generate and store tokens
  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokenAdmin(user._id);

  const loggedInAdmin = await Admin.findById(user._id).select(
    '-password -refreshToken -watchHistory'
  );

  //const isProduction = process.env.NODE_ENV === "production";
  // set tokens in cookie and send response
  const cookieOptions = {
    httpOnly: true,
    //secure: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
  };

  res.cookie('accessToken', accessToken, cookieOptions);
  //res.cookie("refreshToken", refreshToken, cookieOptions);

  // res.setHeader(
  //   "Set-Cookie",
  //   `accessToken=${accessToken}; Max-Age=${1 * 24 * 60 * 60 * 1000}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
  // );

  // res.setHeader(
  //   "Set-Cookie",
  //   `__Host-refreshToken=${refreshToken}; Max-Age=${10 * 24 * 60 * 60 * 1000}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
  // );

  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        { user: loggedInAdmin, accessToken, refreshToken },
        'Logged In Successfully'
      )
    );
});

const logoutAdmin = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  };

  // res.setHeader(
  //   "Set-Cookie",
  //   `accessToken=; Max-Age=-1; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
  // );

  // .clearCookie("accessToken", {
  //   ...cookieOptions,
  //   maxAge: 1 * 24 * 60 * 60 * 1000,
  // })
  // .clearCookie("refreshToken", {
  //   ...cookieOptions,
  //   maxAge: 10 * 24 * 60 * 60 * 1000,
  // })

  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .json(new APIResponse(200, {}, 'Logged out Successfully'));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // 1. Find admin user by email
  const user = await Admin.findOne({ email, role: 'admin' }); // ⭐ IMPORTANT: Only allow admin password resets
  //const user = await Admin.findOne({ email });

  // Always send a generic success message to prevent email enumeration attacks
  // (don't tell if email exists or not)
  if (!user) {
    console.warn(
      `Forgot password attempt for non-existent or non-admin email: ${email}`
    );
    //throw new APIError(400, "Invalid email");
    return res.status(400).json(new APIResponse(400, [], 'Invalid email'));
    // return res.status(200).json(new APIResponse(200, null, "If an admin account with that email exists, a password reset link has been sent."));
  }

  // 2. Generate a password reset token
  const resetToken = user.createPasswordResetToken(); // This method is on the User model

  // 3. Save the hashed token and expiry to the database
  await user.save({ validateBeforeSave: false }); // Bypass validation for pre-save hook on password

  // 4. Create the reset URL
  // This URL will be accessed by the admin from their email
  // The frontend should have a route like /admin/reset-password/:token
  //const resetURL = `${req.protocol}://${req.get('host')}/api/v1/admin/auth/reset-password/${resetToken}`; // ⭐ IMPORTANT: Use your actual frontend reset password URL here
  const resetURL = `http://localhost:3000/reset-password/${resetToken}`;

  const message = `
    <p>You are receiving this email because you (or someone else) have requested the reset of the password for your admin account.</p>
    <p>Please click on the following link, or paste this into your browser to complete the process:</p>
    <p><a href="${resetURL}">${resetURL}</a></p>
    <p>This link is valid for 10 minutes.</p>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    <p>Thank you,</p>
    <p>FutureFind Admin Team</p>
  `;

  try {
    // 5. Send the email
    await sendEmail({
      email: user.email,
      subject: 'FutureFind Admin Password Reset Request',
      message: message,
    });

    // 6. Log activity
    // await Activity.create({
    //     action: 'admin_forgot_password_requested',
    //     entityType: 'User',
    //     entityId: user._id,
    //     performedBy: user._id, // User is performing action on self
    //     description: `Admin "${user.email}" requested password reset.`
    // });

    res
      .status(200)
      .json(
        new APIResponse(200, null, 'Password reset link sent to your email.')
      );
  } catch (err) {
    // If email sending fails, clear the token from the user to prevent stale tokens
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('Error sending password reset email:', err);
    throw new APIError(
      500,
      'There was an error sending the email. Please try again later.'
    );
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  // 1. Get token from URL and hash it
  const { token } = req.params; // Token from URL
  const { newPassword, confirmPassword } = req.body; // New password from body

  // Hash the token received from the user to compare with the stored hashed token
 
  const hashedToken = createHash('sha256').update(token).digest('hex');

  if (newPassword !== confirmPassword) {
    throw new APIError(400, 'New password and confirm password do not match.');
  }

  // 2. Find user by hashed token and check expiry
  const user = await Admin.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // Token must not be expired
  });

  if (!user) {
    throw new APIError(400, 'Token is invalid or has expired.');
  }

  // 3. Set the new password (pre-save hook will hash it)
  user.password = newPassword;
  user.passwordResetToken = undefined; // Invalidate token
  user.passwordResetExpires = undefined; // Clear expiry

  // 4. Save the user (this will trigger the password hashing pre-save hook)
  await user.save();

  // 5. Log activity
  // await Activity.create({
  //   action: 'admin_password_reset',
  //   entityType: 'User',
  //   entityId: user._id,
  //   performedBy: user._id, // User is performing action on self
  //   description: `Admin "${user.email}" successfully reset password.`
  // });

  // 6. Respond with success
  res
    .status(200)
    .json(
      new APIResponse(
        200,
        null,
        'Password reset successfully. You can now log in with your new password.'
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const oldToken = req.token;

  const { jti: oldJti } = jwt.decode(oldToken);

  // Remove old refresh token from DB
  const updatedTokens = [];
  for (const entry of req.admin.refreshTokens) {
    if (entry.jti === oldJti) {
      const isMatch = await bcrypt.compare(oldToken, entry.token);
      if (!isMatch) updatedTokens.push(entry);
    } else {
      updatedTokens.push(entry);
    }
  }

  req.admin.refreshTokens = updatedTokens;
  await req.admin.save();

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokenAdmin(
      req.admin._id,
      req.headers['user-agent'] || 'Unknown'
    );

  // Set new cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    //secure: true,
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

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  const userAgent = req.headers['user-agent'] || 'Unknown';

  try {
    if (!email || !password) {
      throw new APIError(400, 'Email and Password are required');
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      throw new APIError(404, 'Invalid credentials');
    }

    const isCredentialValid = await admin.isPasswordCorrect(password);
    if (!isCredentialValid) {
      throw new APIError(401, 'Credential Invalid');
    }

    // generate and store tokens
    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokenAdmin(admin._id, userAgent);

    // set tokens in cookie and send response
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined, // Let browser handle domain
      path: '/',
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
            admin: {
              _id: admin._id,
              email: admin.email,
              fullName: admin.fullName,
            },
          },
          'Logged In Successfully'
        )
      );
  } catch (error) {
    throw new APIError(401, error.message);
  }
};

export {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
};
