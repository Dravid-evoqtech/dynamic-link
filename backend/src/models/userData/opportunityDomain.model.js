import mongoose, { Schema } from "mongoose";


const opportunityDomainSchema = new Schema(
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
export const OpportunityDomain = mongoose.model("OpportunityDomain", opportunityDomainSchema);