import mongoose, { Schema } from "mongoose";
import { APPLICATION, APPLICATION_STATUS, OPPORTUNITY, USER } from "../constants/index.js";

const applicationSchema = new Schema(
    {
        opportunity: {
            type: mongoose.Schema.Types.ObjectId,
            ref: OPPORTUNITY,
            required: true,
        },
        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: USER, 
            required: true,
        },
        status: {
            type: String,
            enum: [...Object.values(APPLICATION_STATUS)],
            default: APPLICATION_STATUS.PENDING,
        },
        appliedOn: {
            type: Date,
            default: Date.now,
        },
        isSaved: {
            type: Boolean,
            default: false,
        },

    },
    { timestamps: true }
);

export const Application = mongoose.model(APPLICATION, applicationSchema);
