import mongoose from "mongoose";

const referralSchema = new mongoose.Schema({
    code:
    {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    ownerUserId:
    {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    createdAt:
    {
        type: Date,
        default: Date.now
    },
    expiresAt:
    {
        type: Date,
        default: null
    },
    maxUses:
    {
        type: Number,
        default: 1
    },
    uses:
    {
        type: Number,
        default: 0
    },
    metadata:
    {
        type: Object,
        default: {}
    }
},
    {
        timestamps: true
    }
);

referralSchema.methods.isUsable = function () {
    if (this.expiresAt && this.expiresAt < Date.now()) return false;
    if (this.maxUses && this.uses >= this.maxUses) return false;
    return true;
};

export default mongoose.model("Referral", referralSchema);
