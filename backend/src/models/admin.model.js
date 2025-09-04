import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto"; // Node.js built-in for cryptographic functions
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { DEFAULT_AVATAR_URL, USER_ROLES } from "../constants/index.js";

const adminSchema = new Schema(
  {

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
      required: true,
    },
     role: {
            type: String,
            enum: Object.values(USER_ROLES), // Use the constants
            default: USER_ROLES.USER,
            required: true
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
        exp: Number
      },
    ],
  
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

adminSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

adminSchema.methods.generateAccessToken = function (jti) {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      jti
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

adminSchema.methods.generateRefreshToken = function (jti) {
  return jwt.sign(
    {
      _id: this._id,
      jti
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// ⭐ NEW METHOD: Generate Password Reset Token ⭐
adminSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex'); // Generate a random hex string

    // Hash the resetToken and save it to the database
    // The token sent to the user is the plain resetToken, the one stored is hashed
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set token expiry (e.g., 10 minutes from now)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken; // Return the unhashed token to send to the user
};

// Apply pagination plugin
adminSchema.plugin(mongooseAggregatePaginate);


export const Admin = mongoose.model("Admin", adminSchema);
