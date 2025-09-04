import mongoose, { Schema } from "mongoose";

const stateSchema = new Schema(
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
export const State = mongoose.model("State", stateSchema);
