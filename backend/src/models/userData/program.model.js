import mongoose, { Schema } from "mongoose";


const programTypeSchema = new Schema(
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
export const Program = mongoose.model("Program", programTypeSchema);