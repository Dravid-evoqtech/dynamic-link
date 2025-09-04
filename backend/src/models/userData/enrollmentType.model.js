import mongoose, { Schema } from "mongoose";


const enrollmentTypeSchema = new Schema(
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
export const EnrollmentType = mongoose.model("EnrollmentType", enrollmentTypeSchema);