import mongoose, { Schema } from "mongoose";

const loginDataSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    loginHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        dayPercentage: {
          type: Number,
          default: 0,
        },
      },
    ],
    loginCount: { type: Number, default: 0 },
    currentLoginStreak: { type: Number, default: 0 },
    longestLoginStreak: { type: Number, default: 0 },
    firstLoginAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

loginDataSchema.index({ "loginHistory.date": 1 });

export const LoginData = mongoose.model("LoginData", loginDataSchema);
