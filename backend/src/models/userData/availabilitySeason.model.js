import mongoose, { Schema } from "mongoose";


const availabilitySeasonSchema = new Schema(
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
export const AvailabilitySeason = mongoose.model("AvailabilitySeason", availabilitySeasonSchema);