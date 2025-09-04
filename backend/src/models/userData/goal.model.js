import mongoose, { Schema } from "mongoose";


const userGoalSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);
export const Goal = mongoose.model("UserGoal", userGoalSchema);