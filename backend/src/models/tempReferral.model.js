import mongoose from "mongoose";

const tempReferralSchema = new mongoose.Schema({
    tempId:
    {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    referralCode:
    {
        type: String,
        required: true,
        index: true
    },
    createdAt:
    {
        type: Date,
        default: Date.now,
        index: true
    }
},
    {
        timestamps: true
    }
);

// TTL index — documents expire after `createdAt + ttlSeconds`
// We'll set the TTL value when creating the index (in server startup) using config.tempTTL
export const TempReferral = mongoose.model("TempReferral", tempReferralSchema);
