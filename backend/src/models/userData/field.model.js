import mongoose, { Schema } from "mongoose";

const fieldSchema = new Schema(
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
export const Field = mongoose.model("Field", fieldSchema);
