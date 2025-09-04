import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DEFAULT_AVATAR_URL, USER, USER_STATUS } from '../constants/index.js';

const userSchema = new Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    appleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === 'local';
      },
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'apple'],
      default: 'local',
    },
    avatar: {
      avatarUrl: {
        type: String,
        default: DEFAULT_AVATAR_URL,
      },
      avatarPublicId: {
        type: String,
        default: null,
      },
    },
    referralCodes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Referral',
      },
    ],
    referredBy: {
      type: String,
      default: null,
    },
    referrals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: USER,
      },
    ],
    points: {
      total: {
        type: Number,
        default: 30,
      },
      profile: {
        type: Number,
        default: 0,
      },
      dailyActivity: {
        type: Number,
        default: 0,
      },
      applications: {
        type: Number,
        default: 0,
      },
      referral: {
        type: Number,
        default: 0,
      },
      usage: {
        type: Number,
        default: 0,
      },
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },
    location: {
      title: {
        type: String,
        default: null,
      },
      lat: {
        type: String,
        default: null,
      },
      lng: {
        type: String,
        default: null,
      },
    },
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      default: null,
    },
    opportunityType: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EnrollmentType',
        default: null,
      },
    ],
    programs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        default: [],
      },
    ],
    availability: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AvailabilitySeason',
        default: null,
      },
    ],
    interests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field',
        default: [],
      },
    ],
    goals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserGoal',
        default: null,
      },
    ],
    bio: {
      type: String,
      default: null,
      trim: true,
    },
    highSchool: {
      type: String,
      default: null,
    },
    highSchoolGraduationYear: {
      type: Number,
      default: null,
    },
    savedOpportunities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Opportunity',
      },
    ],
    unlockedOpportunities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Opportunity',
      },
    ],
    applications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
      },
    ],
    level: {
      type: Number,
      default: 0,
    },
    loginData: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LoginData',
    },
    status: {
      type: String,
      enum: [USER_STATUS.ACTIVE, USER_STATUS.INACTIVE],
      default: USER_STATUS.ACTIVE,
    },

    fcmTokens: [
      {
        token: String,
        userAgent: String,
        lastOpenedAppAt: Date,
        lastStartOfDayNotificationSentAt: Date,
        lastEndOfDayNotificationSentAt: Date,
        timezone: String,
      },
    ],
  
    notificationSettings: {
      newOpportunities: { type: Boolean, default: true },
      applicationUpdates: { type: Boolean, default: true },
      dailyStreakReminders: { type: Boolean, default: true },
    },
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date },
    refreshTokens: [
      {
        token: String,
        userAgent: String,
        jti: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        iat: Number,
        exp: Number,
      },
    ],
  
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (jti) {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      jti,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function (jti) {
  return jwt.sign(
    {
      _id: this._id,
      jti,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model(USER, userSchema);
