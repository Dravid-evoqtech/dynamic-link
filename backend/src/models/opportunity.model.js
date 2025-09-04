import mongoose, { Schema } from 'mongoose';
import validator from 'validator';
import { OPPORTUNITY, OPPORTUNITY_STATUS } from '../constants/index.js';
import { sendOpportunityNotificationToAllUsers } from '../utils/notification/sendNotification.js';
import { APIError } from '../utils/APIError.js';

const opportunitySchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      index: true,
    },
    types: {
      type: String,
      required: [true, 'Type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [50, 'Description should be at least 50 characters long'],
    },
    states: {
      type: String,
      required: [true, 'states is required'],
      set: (v) => v.toLowerCase().trim(), 
    },
    fields: {
      type: [String],
      required: [true, 'At least one field is required'],
      validate: [(arr) => arr.length > 0, 'Fields cannot be empty'],
    },
    grades: {
      type: [String],
      required: [true, 'At least one grade is required'],
      validate: [(arr) => arr.length > 0, 'Grades cannot be empty'],
      
    },
    seeWebsiteLink: {
      type: String,
      required: [true, 'Link is required'],
    },
    opportunityIndex: {
      type: Number,
      required: [true, 'Opportunity index is required'],
      min: 0,
    },
    imageLink: {
      type: String,
      required: [true, 'Image link is required'],
      validate: [validator.isURL, 'Must be a valid URL'],
    },
    duration: {
      type: String,
      default: null,
    },
    opportunityStartDate: {
      type: String,
    },
    organization: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    program: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Program',
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Number,
      required: function () {
        return this.isFeatured === true;
      },
      default: 0,
    },
    enrollmentType: {
      type: String,
      enum: ['Part Time', 'Full Time'],
      default: 'Part Time',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

opportunitySchema.post("save", async function (doc) {
    try {
        await sendOpportunityNotificationToAllUsers({
            title: "🚀 New Opportunity Available!",
            body: doc.title,
            data: {
                opportunityId: doc._id.toString()
            }
        });
    } catch (err) {
        throw new APIError(500, `Failed to send opportunity notification: ${err}`);
    }
});

// Indexes for performance
opportunitySchema.index({ title: "text", description: "text" });
opportunitySchema.index({ fields: 1 });
opportunitySchema.index({ program: 1 });
opportunitySchema.index({ states: 1 });
opportunitySchema.index({ isFeatured: 1, states: 1 });



export const Opportunity = mongoose.model(OPPORTUNITY, opportunitySchema);
