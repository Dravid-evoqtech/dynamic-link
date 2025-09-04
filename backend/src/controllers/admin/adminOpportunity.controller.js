//import fs from "fs/promises";
import fs from 'fs';
import pLimit from 'p-limit';
import { Opportunity } from '../../models/opportunity.model.js'; 
import { APIError } from '../../utils/APIError.js';
import { APIResponse } from '../../utils/APIResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import mongoose from 'mongoose';
import {
  OPPORTUNITY_STATUS, 
} from '../../constants/index.js'; // Adjust path to your constants file
import { deleteImageOnCloudinary, uploadPhotoOnCloudinary } from '../../utils/cloudinary.js';
import { OpportunityDomain } from '../../models/userData/opportunityDomain.model.js';
import { Program } from '../../models/userData/program.model.js';
import { Grade } from '../../models/userData/grade.model.js';
import { EnrollmentType } from '../../models/userData/enrollmentType.model.js';
import { bulkUploadOpportunitySchema } from '../../validations/adminOpportunityValidation.js'; 
import {
    resolveProgramTypeIds,
    resolveDomainIds,
    // resolveEnrollmentTypeId // Uncomment if you add and use this resolver
} from '../../utils/opportunityTypeResolvers.js'; 
import { Field } from '../../models/userData/field.model.js';
import JSONStream from 'JSONStream';
import { log } from "console";


const setOpportunityApplicationStatus = async (req, res, newStatus) => {
  const { id } = req.params;


  // 1. Validate Opportunity ID Format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid Opportunity ID format.");
  }

  // 2. Validate newStatus (safety check, though Joi schema should prevent invalid values)
  if (!Object.values(OPPORTUNITY_STATUS).includes(newStatus)) {
    throw new APIError(400, `Invalid status value provided. Must be one of: ${Object.values(OPPORTUNITY_STATUS).join(', ')}`);
  }

  // 3. Find and Update Opportunity
  let updatedOpportunity;
  try {
    updatedOpportunity = await Opportunity.findByIdAndUpdate(
      id,
      { opportunityStatus: newStatus }, // ⭐ Updated field name from applicationStatus to opportunityStatus
      { new: true, runValidators: true } // Return the updated doc, run schema validators
    ).select("-__v"); // Exclude Mongoose version key

    if (!updatedOpportunity) {
      throw new APIError(404, "Opportunity not found.");
    }

    // 4. Send Success Response
    res.status(200).json(
      new APIResponse(200, updatedOpportunity, `Opportunity application status set to '${newStatus}' successfully.`)
    );

  } catch (dbError) {
    if (dbError.name === 'ValidationError') {
      const errors = Object.values(dbError.errors).map(err => err.message);
      throw new APIError(400, "Validation failed during opportunity status update.", errors);
    }
    console.error(`Database error setting opportunity ${id} status to ${newStatus}:`, dbError);
    throw new APIError(500, "An error occurred while updating the opportunity's status.");
  }
};

const normalizeKey = (key) =>
    key.replace(/[\s_-]+/g, "").toLowerCase();

const keyMap = {
    title: "title",
    types: "types",
    description: "description",
    states: "states",
    fields: "fields",
    grades: "grades",
    seewebsitelink: "seeWebsiteLink",
    opportunityindex: "opportunityIndex",
    imagelink: "imageLink",
    duration: "duration",
    opportunitystartdate: "opportunityStartDate",
    organization: "organization",
    program: "program",
    isfeatured: "isFeatured",
    points: "points",
    enrollmenttype: "enrollmentType",
};

const normalizeOpportunityKeys = (opportunity) => {
    const normalized = {};
    for (const key in opportunity) {
        if (Object.prototype.hasOwnProperty.call(opportunity, key)) {
            const newKey = keyMap[normalizeKey(key)] || key;
            let value = opportunity[key];
            if (typeof value === "string") value = value.trim();
            normalized[newKey] = value;
        }
    }
    return normalized;
};


const resolveModelIdsFromStrings = async (model, input, errors = [], row = null) => {
    if (!input) {
        errors.push({
            row,
            message: `Invalid input for ${model.modelName}: input is required`,
        });
        return [];
    }


    let titles = [];
    if (Array.isArray(input)) {
        titles = input.map(t => String(t).trim());
    } else if (typeof input === "string") {
        titles = input.split(",").map(t => t.trim());
    } else {
        errors.push({
            row,
            message: `Invalid input type for ${model.modelName}: expected string or array, got ${typeof input}`,
        });
        return [];
    }

    // Ensure unique program titles
    titles = [...new Set(titles)];

    // Check existing programs with retry
    let existingPrograms = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const regexTitles = titles.map(title => new RegExp(`^${title}$`, "i"));
            existingPrograms = await model
                .find({ title: { $in: regexTitles } })
                .select("_id title")
                .maxTimeMS(5000)
                .lean();
            break;
        } catch (err) {
            if (attempt === 3) {
                errors.push({
                    row,
                    message: `Failed to query ${model.modelName} after retries: ${err.message}`,
                });
                return [];
            }
            console.warn(`Query attempt ${attempt} for ${model.modelName} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    const existingTitlesLower = existingPrograms.map(doc => doc.title.toLowerCase());
    const missingTitles = titles.filter(t => !existingTitlesLower.includes(t.toLowerCase()));

    // Create missing programs
    if (missingTitles.length > 0) {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const newPrograms = await model.insertMany(
                    missingTitles.map(title => ({ title: title.trim() })),
                    { maxTimeMS: 5000 }
                );
                existingPrograms.push(...newPrograms);
                break;
            } catch (err) {
                if (attempt === 3) {
                    errors.push({
                        row,
                        message: `Failed to create ${model.modelName}s: ${err.message}`,
                    });
                    return [];
                }
                console.warn(`Create attempt ${attempt} for ${model.modelName} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    // Map titles to ObjectIds
    const titleToIdMap = new Map(existingPrograms.map(doc => [doc.title.toLowerCase(), doc._id]));
    const programIds = titles
        .map(t => titleToIdMap.get(t.toLowerCase()))
        .filter(id => id);

    if (programIds.length === 0) {
        errors.push({
            row,
            message: `No valid ${model.modelName}s found for input: ${titles.join(", ")}`,
        });
        return [];
    }

    return programIds;
};


const getAllOpportunities = asyncHandler(async (req, res) => {
    // 1. Input Validation is handled by the 'validate' middleware using getOpportunitiesSchema.
    //    req.query is already validated and clean here.
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        // ⭐ REMOVED applicationDeadlineFrom and opportunityStartDateFrom
        //    from destructuring as they are no longer in the new schema or their type has changed.
        // ⭐ ADDED new filterable fields from the new schema
        types, // e.g., 'Paid Internship' or 'Unpaid Internship'
        states, // e.g., 'California'
        fields, // array of ObjectIds
        grades, // array of Strings
        ...otherFilters // Catch all other validated filters
    } = req.query;


    const query = {};

    // 2. Apply Filters from the new schema
    // Note: 'isFeatured' and 'organization' are still valid.
    if (types) {
        query.types = types;
    }
    if (states) {
        query.states = states;
    }
    // ⭐ The old 'domain' field is now 'fields'.
    if (fields) {
        const fieldIds = Array.isArray(fields) ? fields : [fields];
        query.fields = { $in: fieldIds.map(id => new mongoose.Types.ObjectId(id)) };
    }
    // ⭐ This is a new filter for the 'grades' field, which is an array of strings.
    if (grades) {
        const gradeValues = Array.isArray(grades) ? grades : [grades];
        query.grades = { $in: gradeValues };
    }

    // 3. The `program` filter is still valid.
    if (req.query.program) {
        const programIds = Array.isArray(req.query.program) ? req.query.program : [req.query.program];
        query.program = { $in: programIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // The `enrollmentType` field is now a string enum. The old field was an ObjectId.
    // We will handle it as a string filter.
    if (otherFilters.enrollmentType) {
        query.enrollmentType = otherFilters.enrollmentType;
    }
    // The `isFeatured` and `organization` filters are still the same.
    if (otherFilters.isFeatured) {
        query.isFeatured = otherFilters.isFeatured;
    }
    if (otherFilters.organization) {
        query.organization = { $regex: otherFilters.organization, $options: 'i' };
    }
    // ⭐ The old `paid`, `opportunityStatus`, `isSaved`, and `employmentType` filters are REMOVED.


    // ⭐ 4. Apply General Search (if provided)
    // The new model has a text index on 'title' and 'description'.
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            // We can also add other string fields if needed
        ];
    }

    // 5. Build Sort Options
    const sortOptions = {};
    // ⭐ Updated sortable fields to match the new schema.
    //    Removed 'applicationDeadline' and 'opportunityStartDate' from sortable fields
    //    as the latter is now a String and not a Date.
    const validSortByFields = ['createdAt', 'updatedAt', 'title', 'organization', 'opportunityIndex', 'points'];
    if (validSortByFields.includes(sortBy)) {
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
        // Fallback to default if invalid sortBy is provided
        sortOptions['createdAt'] = -1;
    }


    // 6. Execute Query with Pagination
    let opportunities;
    let totalOpportunities;
    try {
        opportunities = await Opportunity.find(query)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select("-__v") // Exclude Mongoose version key
            // ⭐ Updated populate calls to match the new schema
            .populate('program') 
            .populate('fields'); 
            // Removed populate for 'enrollmentType' and 'domain'

        totalOpportunities = await Opportunity.countDocuments(query);
    } catch (dbError) {
        console.error("Database error fetching opportunities:", dbError);
        throw new APIError(500, "An error occurred while fetching opportunities.");
    }

    // 7. Calculate Pagination Metadata
    const totalPages = Math.ceil(totalOpportunities / limit);
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    // 8. Send Response
    res.status(200).json(
        new APIResponse(200, {
            opportunities,
            pagination: {
                totalOpportunities,
                totalPages,
                currentPage: parseInt(page),
                perPage: parseInt(limit),
                hasNextPage,
                hasPrevPage,
          },
        }, "Opportunities fetched successfully.")
    );
});

// --- GET Single Opportunity By ID Controller ---
// const getOpportunityById = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   console.log(`Admin attempting to fetch opportunity with ID: ${id}`);

//   // 1. Validate Opportunity ID Format (redundant with Joi middleware but good as a safety check)
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     throw new APIError(400, "Invalid Opportunity ID format.");
//   }

//   // 2. Fetch Opportunity from Database
//   let opportunity;
//   try {
//     opportunity = await Opportunity.findById(id)
//       .select("-__v") // Exclude Mongoose version key
//       // ⭐ Populate referenced fields
//       .populate('enrollmentType')
//       .populate('program')
//       .populate('domain');
//   } catch (dbError) {
//     console.error(`Database error fetching opportunity by ID ${id}:`, dbError);
//     throw new APIError(500, "An error occurred while fetching the opportunity.");
//   }

//   // 3. Handle Opportunity Not Found
//   if (!opportunity) {
//     throw new APIError(404, "Opportunity not found.");
//   }

//   // 4. Send Success Response
//   res.status(200).json(
//     new APIResponse(200, opportunity, "Opportunity fetched successfully.")
//   );
// });

const getOpportunityById = asyncHandler(async (req, res) => {
    const { id } = req.params;


    // 1. Validate Opportunity ID Format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid Opportunity ID format.");
    }

    // 2. Fetch Opportunity from Database
    let opportunity;
    try {
        opportunity = await Opportunity.findById(id)
            .select("-__v") // Exclude Mongoose version key
            // ⭐ UPDATED: 'enrollmentType' is now a simple string and no longer needs to be populated.
            // ⭐ UPDATED: 'domain' was removed and replaced with 'fields'.
            //    The 'fields' field refers to the "Field" model.
            .populate('program');
            // .populate('fields'); // ⭐ Commented out to prevent MissingSchemaError. Uncomment after you define the "Field" model.
    } catch (dbError) {
        console.error(`Database error fetching opportunity by ID ${id}:`, dbError);
        throw new APIError(500, "An error occurred while fetching the opportunity.");
    }

    // 3. Handle Opportunity Not Found
    if (!opportunity) {
        throw new APIError(404, "Opportunity not found.");
    }

    // 4. Send Success Response
    res.status(200).json(
        new APIResponse(200, opportunity, "Opportunity fetched successfully.")
    );
});


// --- Create Opportunity Controller ---
// const createOpportunity = asyncHandler(async (req, res) => {
//   console.log("Admin creating new opportunity...", req.body);

//   // 1. Input Validation is handled by the 'validate' middleware using createOpportunitySchema.
//   //    req.body is already validated and clean here.
//   const {
//     title,
//     description,
//     duration, // ⭐ Type is now string
//     opportunityStartDate, // ⭐ Renamed from startDate
//     applicationStartDate,
//     applicationDeadline,  // ⭐ Renamed from deadline
//     organization,
//     enrollmentType, // ⭐ Now an ObjectId
//     program,        // ⭐ Array of ObjectIds
//     paid,
//     opportunityStatus, // ⭐ Renamed from status
//     domain,         // ⭐ Array of ObjectIds
//     isFeatured,     // ⭐ New field
//     isSaved,        // ⭐ New field
//     employmentType, // ⭐ New field
//   } = req.body;

//   // 2. Handle Cover Image Upload (if provided)
//   let coverImageResult = { imageUrl: DEFAULT_COVER_URL, imagePublicId: null }; // Default fallback

//   const coverImageLocalPath = req.files && req.files.coverImage && req.files.coverImage.length > 0
//     ? req.files.coverImage[0].path
//     : null;

//   console.log("Cover image local path:", coverImageLocalPath);

//   if (coverImageLocalPath) {
//     try {
//       const uploadedImage = await uploadPhotoOnCloudinary(coverImageLocalPath); // ⭐ Ensure function name `uploadPhotoOnCloudinary` matches utility
//       if (!uploadedImage || !uploadedImage.url) {
//         throw new APIError(500, "Failed to upload cover image to cloud service.");
//       }
//       coverImageResult = {
//         imageUrl: uploadedImage.url,
//         imagePublicId: uploadedImage.public_id,
//       };
//     } catch (uploadError) {
//       console.error("Cloudinary cover image upload error:", uploadError);
//       console.warn("Proceeding with opportunity creation using default cover image due to upload failure.");
//       // If cover image is strictly required, you would throw here:
//       // throw new APIError(500, "Cover image upload failed. Opportunity not created.");
//     }
//   }

//   // 3. Create New Opportunity Instance
//   let newOpportunity;
//   try {
//     newOpportunity = new Opportunity({
//       title,
//       description,
//       coverImage: coverImageResult, // Use the uploaded image data or default
//       duration,
//       opportunityStartDate: opportunityStartDate ? new Date(opportunityStartDate) : null, // ⭐ Ensure dates are Date objects or null
//       applicationStartDate: applicationStartDate ? new Date(applicationStartDate) : null,
//       applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
//       organization,
//       enrollmentType: enrollmentType ? new mongoose.Types.ObjectId(enrollmentType) : null, // ⭐ Convert to ObjectId
//       program: program.map(id => new mongoose.Types.ObjectId(id)), // ⭐ Convert each ID to ObjectId
//       paid,
//       opportunityStatus: opportunityStatus || OPPORTUNITY_STATUS.OPEN, // ⭐ Use provided status or default from constants
//       domain: domain.map(id => new mongoose.Types.ObjectId(id)), // ⭐ Convert each ID to ObjectId
//       isFeatured,
//       isSaved,
//       employmentType: employmentType || null, // ⭐ New field
//     });

//     // 4. Save Opportunity to Database
//     const createdOpportunity = await newOpportunity.save();

//     // 5. Send Success Response
//     // Exclude __v from the response for cleaner output
//     const opportunityResponse = createdOpportunity.toObject();
//     delete opportunityResponse.__v;

//     res.status(201).json(
//       new APIResponse(201, opportunityResponse, "Opportunity created successfully.")
//     );

//   } catch (dbError) {
//     // Handle specific Mongoose validation errors or other database issues
//     if (dbError.name === 'ValidationError') {
//       const errors = Object.values(dbError.errors).map(err => err.message);
//       throw new APIError(400, "Validation failed during opportunity creation.", errors);
//     }
//     console.error("Database error creating opportunity:", dbError);
//     throw new APIError(500, "An error occurred while creating the opportunity.");
//   }
// });

const createOpportunity = asyncHandler(async (req, res) => {

    // ⭐ The request body is already sanitized by the 'lowerCaseBodyKeys' middleware,
    // so we can directly destructure using lowercase variable names.
    const {
        title,
        types,
        description,
        states,
        fields,
        grades,
        see_website_link,
        opportunity_index,
        image_link,
        duration,
        opportunitystartdate,
        organization,
        program,
        isfeatured,
        points,
        enrollmenttype,
    } = req.body;

    try {

const existingOpportunity = await Opportunity.findOne({
    title,
    opportunityIndex: opportunity_index,
  }); 
  if (existingOpportunity) {
    throw new APIError(
      400,
      'Opportunity with the same title and index already exists'
    );
  }

        // Use the reusable utility to get ObjectIds for fields and programs
        const fieldIds = await resolveModelIdsFromStrings(Field, fields);
        const programIds = await resolveModelIdsFromStrings(Program, program);
        
        // Process Grades string into an array of strings
        const gradesArray = grades.split(',').map(grade => grade.trim().toUpperCase());
        
        // Create New Opportunity Instance with the resolved IDs and arrays
        const newOpportunity = new Opportunity({
            title,
            types,
            description,
            states,
            fields: fieldIds,
            grades: gradesArray,
            seeWebsiteLink: see_website_link,
            opportunityIndex: opportunity_index,
            imageLink: image_link,
            duration,
            opportunityStartDate: opportunitystartdate,
            organization,
            program: programIds,
            isFeatured: isfeatured,
            points,
            enrollmentType: enrollmenttype,
        });

        const createdOpportunity = await newOpportunity.save();

        const opportunityResponse = createdOpportunity.toObject();
        delete opportunityResponse.__v;

        res.status(201).json(
            new APIResponse(201, opportunityResponse, "Opportunity created successfully.")
        );

    } catch (dbError) {
        if (dbError instanceof APIError) {
            throw dbError;
        }
        if (dbError.name === 'ValidationError') {
            const errors = Object.values(dbError.errors).map(err => err.message);
            throw new APIError(400, "Validation failed during opportunity creation.", errors);
        }
        console.error("Database error creating opportunity:", dbError);
        throw new APIError(500, "An error occurred while creating the opportunity.");
    }
});


// --- Update Opportunity Controller ---
// const updateOpportunity = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const updateFields = { ...req.body }; // Joi middleware ensures this is validated and clean

//   console.log(`Admin updating opportunity with ID: ${id}`, updateFields);

//   // 1. Validate Opportunity ID Format
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     throw new APIError(400, "Invalid Opportunity ID format.");
//   }

//   // 2. Find the existing opportunity
//   let opportunity;
//   try {
//     opportunity = await Opportunity.findById(id).select("coverImage.imagePublicId"); // Select public ID for potential deletion
//     if (!opportunity) {
//       throw new APIError(404, "Opportunity not found.");
//     }
//   } catch (dbError) {
//     console.error(`Database error finding opportunity ${id} for update:`, dbError);
//     throw new APIError(500, "An error occurred while finding the opportunity for update.");
//   }

//   // 3. Handle Cover Image Upload/Update/Clear
//   const coverImageLocalPath = req.files && req.files.coverImage && req.files.coverImage.length > 0
//     ? req.files.coverImage[0].path
//     : null;
//   const clearCoverImage = updateFields.clearCoverImage; // From Joi validated body

//   let newCoverImageData = {}; // To store new image URL/publicId if updated

//   try {
//     if (coverImageLocalPath) {
//       // Upload new cover image
//       const uploadedImage = await uploadPhotoOnCloudinary(coverImageLocalPath); // ⭐ Ensure function name `uploadPhotoOnCloudinary` matches utility
//       if (!uploadedImage || !uploadedImage.url) {
//         throw new APIError(500, "Failed to upload new cover image.");
//       }
//       newCoverImageData = {
//         imageUrl: uploadedImage.url,
//         imagePublicId: uploadedImage.public_id,
//       };

//       // Delete old cover image from Cloudinary if it exists and is not the default
//       const oldImagePublicId = opportunity.coverImage?.imagePublicId;
//       if (oldImagePublicId && oldImagePublicId !== null && oldImagePublicId !== DEFAULT_COVER_URL) { // ⭐ Use DEFAULT_COVER_URL
//         const deleteResult = await deleteImageOnCloudinary(oldImagePublicId);
//         if (deleteResult === false) {
//             console.warn(`CLOUDINARY :: Old cover image deletion failed for publicId: ${oldImagePublicId}`);
//         } else {
//             console.log(`Deleted old cover image: ${oldImagePublicId}`);
//         }
//       }
//     } else if (clearCoverImage) { // Admin explicitly requested to clear the image
//       const oldImagePublicId = opportunity.coverImage?.imagePublicId;
//       if (oldImagePublicId && oldImagePublicId !== null && oldImagePublicId !== DEFAULT_COVER_URL) { // ⭐ Use DEFAULT_COVER_URL
//         const deleteResult = await deleteImageOnCloudinary(oldImagePublicId);
//         if (deleteResult === false) {
//             console.warn(`CLOUDINARY :: Clearing cover image failed for publicId: ${oldImagePublicId}`);
//         } else {
//             console.log(`Cleared and deleted opportunity's cover image: ${oldImagePublicId}`);
//         }
//       }
//       newCoverImageData = { imageUrl: DEFAULT_COVER_URL, imagePublicId: null }; // ⭐ Use DEFAULT_COVER_URL
//     }
//   } catch (fileError) {
//     console.error("Cover image update/clear error:", fileError);
//     console.warn("Proceeding with opportunity update despite cover image error.");
//   }

//   // Remove clearCoverImage from updateFields as it's a control flag, not a schema field
//   delete updateFields.clearCoverImage;

//   // Add newCoverImageData to updateFields if it was updated
//   if (Object.keys(newCoverImageData).length > 0) {
//     updateFields.coverImage = newCoverImageData;
//   }

//   // ⭐ Ensure dates are converted to Date objects if they are being updated (updated names)
//   if (updateFields.opportunityStartDate) updateFields.opportunityStartDate = new Date(updateFields.opportunityStartDate);
//   if (updateFields.applicationStartDate) updateFields.applicationStartDate = new Date(updateFields.applicationStartDate);
//   if (updateFields.applicationDeadline) updateFields.applicationDeadline = new Date(updateFields.applicationDeadline);

//   // ⭐ Convert ObjectId fields to actual ObjectIds if they are being updated
//   if (updateFields.enrollmentType && typeof updateFields.enrollmentType === 'string' && mongoose.Types.ObjectId.isValid(updateFields.enrollmentType)) {
//       updateFields.enrollmentType = new mongoose.Types.ObjectId(updateFields.enrollmentType);
//   } else if (updateFields.enrollmentType === null) {
//       updateFields.enrollmentType = null; // Allow setting to null
//   }

//   if (updateFields.program && Array.isArray(updateFields.program)) {
//       updateFields.program = updateFields.program.map(id => {
//           if (!mongoose.Types.ObjectId.isValid(id)) {
//               throw new APIError(400, `Invalid program ID provided: ${id}`);
//           }
//           return new mongoose.Types.ObjectId(id);
//       });
//   } else if (updateFields.program === null || (Array.isArray(updateFields.program) && updateFields.program.length === 0)) {
//       // Allow clearing the array if null or empty array is sent (based on Joi schema allowing optional array)
//       updateFields.program = [];
//   }

//   if (updateFields.domain && Array.isArray(updateFields.domain)) {
//       updateFields.domain = updateFields.domain.map(id => {
//           if (!mongoose.Types.ObjectId.isValid(id)) {
//               throw new APIError(400, `Invalid domain ID provided: ${id}`);
//           }
//           return new mongoose.Types.ObjectId(id);
//       });
//   } else if (updateFields.domain === null || (Array.isArray(updateFields.domain) && updateFields.domain.length === 0)) {
//       // Allow clearing the array if null or empty array is sent
//       updateFields.domain = [];
//   }


//   // 4. Perform Database Update
//   let updatedOpportunity;
//   try {
//     updatedOpportunity = await Opportunity.findByIdAndUpdate(
//       id,
//       { $set: updateFields }, // Use $set to update only specified fields
//       { new: true, runValidators: true } // Return the updated doc, run schema validators on update
//     ).select("-__v"); // Exclude Mongoose version key

//     if (!updatedOpportunity) {
//       throw new APIError(404, "Opportunity not found after update attempt.");
//     }
//   } catch (dbError) {
//     if (dbError.name === 'ValidationError') {
//       const errors = Object.values(dbError.errors).map(err => err.message);
//       throw new APIError(400, "Validation failed during opportunity update.", errors);
//     }
//     console.error("Database error updating opportunity:", dbError);
//     throw new APIError(500, "An error occurred while updating the opportunity.");
//   }

//   // 5. Send Success Response
//   res.status(200).json(new APIResponse(200, updatedOpportunity, "Opportunity updated successfully."));
// });

const updateOpportunity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateFields = { ...req.body };


    // 1. Validate Opportunity ID Format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid Opportunity ID format.");
    }
    
    // 2. Prepare the Final Update Object
    // The image is now just a URL string, so no special handling is needed.
    // 'image_link' from the body maps directly to the 'imageLink' field.
    if (updateFields.image_link) {
        updateFields.imageLink = updateFields.image_link;
        delete updateFields.image_link;
    }
    
    // Fields, program, and grades are strings that need to be converted to arrays
    if (updateFields.fields) {
        updateFields.fields = await resolveModelIdsFromStrings(Field, updateFields.fields);
    }
    if (updateFields.program) {
        updateFields.program = await resolveModelIdsFromStrings(Program, updateFields.program);
    }
    if (updateFields.grades) {
        updateFields.grades = updateFields.grades.split(',').map(grade => grade.trim().toUpperCase());
    }
    // Handle date conversion
    if (updateFields.opportunitystartdate) {
        updateFields.opportunityStartDate = new Date(updateFields.opportunitystartdate);
        delete updateFields.opportunitystartdate;
    }
    
    // 3. Perform Database Update
    let updatedOpportunity;
    try {
        updatedOpportunity = await Opportunity.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select("-__v");

        if (!updatedOpportunity) {
            throw new APIError(404, "Opportunity not found after update attempt.");
        }
    } catch (dbError) {
        if (dbError.name === 'ValidationError') {
            const errors = Object.values(dbError.errors).map(err => err.message);
            throw new APIError(400, "Validation failed during opportunity update.", errors);
        }
        console.error("Database error updating opportunity:", dbError);
        throw new APIError(500, "An error occurred while updating the opportunity.");
    }

    // 4. Send Success Response
    res.status(200).json(new APIResponse(200, updatedOpportunity, "Opportunity updated successfully."));
});

// --- Delete Opportunity Controller ---
// const deleteOpportunity = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   console.log(`Admin attempting to delete opportunity with ID: ${id}`);

//   // 1. Validate Opportunity ID Format
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     throw new APIError(400, "Invalid Opportunity ID format.");
//   }

//   // 2. Find Opportunity and Delete Associated Data (e.g., Cloudinary cover image)
//   let opportunity;
//   try {
//     opportunity = await Opportunity.findById(id).select("coverImage.imagePublicId");

//     if (!opportunity) {
//       throw new APIError(404, "Opportunity not found.");
//     }

//     // Delete opportunity's cover image from Cloudinary if it exists and is not the default
//     const coverImagePublicId = opportunity.coverImage?.imagePublicId;
//     if (coverImagePublicId && coverImagePublicId !== null && coverImagePublicId !== DEFAULT_COVER_URL) { // ⭐ Use DEFAULT_COVER_URL
//       try {
//         const deleteResult = await deleteImageOnCloudinary(coverImagePublicId);
//         if (deleteResult === false) {
//           console.warn(`CLOUDINARY :: Opportunity cover image deletion failed for publicId: ${coverImagePublicId}`);
//         } else {
//           console.log(`Deleted opportunity's cover image from Cloudinary: ${coverImagePublicId}`);
//         }
//       } catch (cloudinaryError) {
//         console.error(`CLOUDINARY :: Unexpected error during cover image deletion for publicId ${coverImagePublicId}:`, cloudinaryError);
//         console.warn("Proceeding with opportunity deletion despite cover image cleanup failure.");
//       }
//     }

//     // 3. Delete the Opportunity Document from Database
//     const deleteResult = await Opportunity.deleteOne({ _id: id });

//     if (deleteResult.deletedCount === 0) {
//       throw new APIError(404, "Opportunity not found or already deleted.");
//     }

//   } catch (dbError) {
//     if (dbError instanceof APIError) {
//       throw dbError;
//     }
//     console.error("Database error deleting opportunity:", dbError);
//     throw new APIError(500, "An error occurred while deleting the opportunity.");
//   }

//   // 4. Send Success Response
//   res.status(200).json(new APIResponse(200, null, `Opportunity with ID: ${id} deleted successfully.`));
// });

const deleteOpportunity = asyncHandler(async (req, res) => {
    const { id } = req.params;


    // 1. Validate Opportunity ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid Opportunity ID format.");
    }

    try {
        // 2. Delete the Opportunity Document from the database
        // The new model does not have a coverImage object, so there's no need to handle Cloudinary deletion.
        const deleteResult = await Opportunity.deleteOne({ _id: id });

        if (deleteResult.deletedCount === 0) {
            throw new APIError(404, "Opportunity not found or already deleted.");
        }

    } catch (dbError) {
        if (dbError instanceof APIError) {
            throw dbError;
        }
        console.error("Database error deleting opportunity:", dbError);
        throw new APIError(500, "An error occurred while deleting the opportunity.");
    }

    // 3. Send a success response
    res.status(200).json(new APIResponse(200, null, `Opportunity with ID: ${id} deleted successfully.`));
});


const bulkDeleteOpportunities = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const adminId = req.admin._id; // Assuming req.user is populated by auth middleware
  console.log(`Admin ${adminId} attempting to bulk delete opportunities with IDs: ${ids}`);

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new APIError(400, "Invalid or empty array of IDs provided.");
  }

  // Optional: Convert string IDs to Mongoose ObjectIds for cleaner logging/queries if needed, though Mongoose handles string IDs in deleteMany fine.
  // const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));

  try {
    // 1. Delete all opportunities whose _id is in the provided array
    const deleteResult = await Opportunity.deleteMany({ _id: { $in: ids } });

    // 2. Log the activity for auditing purposes
    // await Activity.create({
    //   action: 'opportunity_bulk_deleted',
    //   entityType: 'Opportunity',
    //   // entityId: undefined, // No single entityId, as multiple are affected
    //   performedBy: adminId,
    //   description: `Bulk deletion of ${deleteResult.deletedCount} opportunities.`,
    //   metadata: {
    //     deletedIds: ids,
    //     deletedCount: deleteResult.deletedCount,
    //   },
    // });

    // 3. Send a success response with the number of deleted items
    res.status(200).json(
      new APIResponse(200, { deletedCount: deleteResult.deletedCount }, `${deleteResult.deletedCount} opportunities deleted successfully.`)
    );
  } catch (dbError) {
    console.error("Database error during bulk delete:", dbError);
    throw new APIError(500, "An error occurred while performing the bulk delete.");
  }
});


// --- Open Opportunity Controller ---
const openOpportunity = asyncHandler(async (req, res) => {
  await setOpportunityApplicationStatus(req, res, OPPORTUNITY_STATUS.OPEN);
});

// --- Close Opportunity Controller ---
const closeOpportunity = asyncHandler(async (req, res) => {
  await setOpportunityApplicationStatus(req, res, OPPORTUNITY_STATUS.CLOSED);
});

// --- OpportunityDomain Controllers ---

const createOpportunityDomain = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    try {
        const newDomain = new OpportunityDomain({ title, description });
        const createdDomain = await newDomain.save();

        res.status(201).json(
            new APIResponse(201, createdDomain.toObject(), "Opportunity domain created successfully.")
        );
    } catch (dbError) {
        if (dbError.code === 11000) { // Duplicate key error (for unique title)
            throw new APIError(409, "A domain with this title already exists.");
        }
        if (dbError.name === 'ValidationError') {
            const errors = Object.values(dbError.errors).map(err => err.message);
            throw new APIError(400, "Validation failed during domain creation.", errors);
        }
        console.error("Database error creating opportunity domain:", dbError);
        throw new APIError(500, "An error occurred while creating the opportunity domain.");
    }
});

const getAllOpportunityDomains = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

   

    const query = {};
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    try {
        const domains = await OpportunityDomain.find(query)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select("-__v");

        const totalDomains = await OpportunityDomain.countDocuments(query);

        res.status(200).json(
            new APIResponse(200, {
                domains,
                pagination: {
                    totalDomains,
                    totalPages: Math.ceil(totalDomains / limit),
                    currentPage: parseInt(page),
                    perPage: parseInt(limit),
                    hasNextPage: page * limit < totalDomains,
                    hasPrevPage: page > 1,
                },
            }, "Opportunity domains fetched successfully.")
        );
    } catch (dbError) {
        console.error("Database error fetching opportunity domains:", dbError);
        throw new APIError(500, "An error occurred while fetching opportunity domains.");
    }
});

const getOpportunityDomainById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const domain = await OpportunityDomain.findById(id).select("-__v");
        if (!domain) {
            throw new APIError(404, "Opportunity domain not found.");
        }
        res.status(200).json(new APIResponse(200, domain, "Opportunity domain fetched successfully."));
    } catch (dbError) {
        if (dbError instanceof APIError) throw dbError; // Re-throw custom APIError
        console.error(`Database error fetching opportunity domain ${id}:`, dbError);
        throw new APIError(500, "An error occurred while fetching the opportunity domain.");
    }
});

const updateOpportunityDomain = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateFields = req.body; // Joi validation ensures cleanliness


    try {
        const updatedDomain = await OpportunityDomain.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true } // Return updated doc, run schema validators
        ).select("-__v");

        if (!updatedDomain) {
            throw new APIError(404, "Opportunity domain not found.");
        }
        res.status(200).json(new APIResponse(200, updatedDomain, "Opportunity domain updated successfully."));
    } catch (dbError) {
        if (dbError.code === 11000) {
            throw new APIError(409, "A domain with this title already exists.");
        }
        if (dbError.name === 'ValidationError') {
            const errors = Object.values(dbError.errors).map(err => err.message);
            throw new APIError(400, "Validation failed during domain update.", errors);
        }
        console.error(`Database error updating opportunity domain ${id}:`, dbError);
        throw new APIError(500, "An error occurred while updating the opportunity domain.");
    }
});

const deleteOpportunityDomain = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        // Optional: Check if any opportunities are linked to this domain before deleting
        // const linkedOpportunities = await Opportunity.countDocuments({ domain: id });
        // if (linkedOpportunities > 0) {
        //     throw new APIError(400, `Cannot delete domain. It is linked to ${linkedOpportunities} opportunities.`);
        // }

        const deleteResult = await OpportunityDomain.deleteOne({ _id: id });

        if (deleteResult.deletedCount === 0) {
            throw new APIError(404, "Opportunity domain not found or already deleted.");
        }
        res.status(200).json(new APIResponse(200, null, "Opportunity domain deleted successfully."));
    } catch (dbError) {
        if (dbError instanceof APIError) throw dbError;
        console.error(`Database error deleting opportunity domain ${id}:`, dbError);
        throw new APIError(500, "An error occurred while deleting the opportunity domain.");
    }
});

// --- OpportunityProgramType Controllers ---

const createOpportunityProgramType = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    try {
        const newProgramType = new Program({ title, description });
        const createdProgramType = await newProgramType.save();

        res.status(201).json(
            new APIResponse(201, createdProgramType.toObject(), "Opportunity program type created successfully.")
        );
    } catch (dbError) {
        if (dbError.code === 11000) {
            throw new APIError(409, "A program type with this title already exists.");
        }
        if (dbError.name === 'ValidationError') {
            const errors = Object.values(dbError.errors).map(err => err.message);
            throw new APIError(400, "Validation failed during program type creation.", errors);
        }
        console.error("Database error creating opportunity program type:", dbError);
        throw new APIError(500, "An error occurred while creating the opportunity program type.");
    }
});

const getAllOpportunityProgramTypes = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

    const query = {};
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    try {
        const programTypes = await Program.find(query)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select("-__v");

        const totalProgramTypes = await Program.countDocuments(query);

        res.status(200).json(
            new APIResponse(200, {
                programTypes,
                pagination: {
                    totalProgramTypes,
                    totalPages: Math.ceil(totalProgramTypes / limit),
                    currentPage: parseInt(page),
                    perPage: parseInt(limit),
                    hasNextPage: page * limit < totalProgramTypes,
                    hasPrevPage: page > 1,
                },
            }, "Opportunity program types fetched successfully.")
        );
    } catch (dbError) {
        console.error("Database error fetching opportunity program types:", dbError);
        throw new APIError(500, "An error occurred while fetching opportunity program types.");
    }
});

const getOpportunityProgramTypeById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const programType = await Program.findById(id).select("-__v");
        if (!programType) {
            throw new APIError(404, "Opportunity program type not found.");
        }
        res.status(200).json(new APIResponse(200, programType, "Opportunity program type fetched successfully."));
    } catch (dbError) {
        if (dbError instanceof APIError) throw dbError;
        console.error(`Database error fetching opportunity program type ${id}:`, dbError);
        throw new APIError(500, "An error occurred while fetching the opportunity program type.");
    }
});

const updateOpportunityProgramType = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateFields = req.body;


    try {
        const updatedProgramType = await Program.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select("-__v");

        if (!updatedProgramType) {
            throw new APIError(404, "Opportunity program type not found.");
        }
        res.status(200).json(new APIResponse(200, updatedProgramType, "Opportunity program type updated successfully."));
    } catch (dbError) {
        if (dbError.code === 11000) {
            throw new APIError(409, "A program type with this title already exists.");
        }
        if (dbError.name === 'ValidationError') {
            const errors = Object.values(dbError.errors).map(err => err.message);
            throw new APIError(400, "Validation failed during program type update.", errors);
        }
        console.error(`Database error updating opportunity program type ${id}:`, dbError);
        throw new APIError(500, "An error occurred while updating the opportunity program type.");
    }
});

const deleteOpportunityProgramType = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        // Optional: Check if any opportunities are linked to this program type before deleting
        // import { Opportunity } from '../models/opportunity.model.js';
        // const linkedOpportunities = await Opportunity.countDocuments({ program: id });
        // if (linkedOpportunities > 0) {
        //     throw new APIError(400, `Cannot delete program type. It is linked to ${linkedOpportunities} opportunities.`);
        // }

        const deleteResult = await Program.deleteOne({ _id: id });

        if (deleteResult.deletedCount === 0) {
            throw new APIError(404, "Opportunity program type not found or already deleted.");
        }
        res.status(200).json(new APIResponse(200, null, "Opportunity program type deleted successfully."));
    } catch (dbError) {
        if (dbError instanceof APIError) throw dbError;
        console.error(`Database error deleting opportunity program type ${id}:`, dbError);
        throw new APIError(500, "An error occurred while deleting the opportunity program type.");
    }
});

//  --- OpportunityEnrollmentType Controllers ---

// Helper function for common API responses
const createEnrollmentType = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // Check if enrollment type with the same title already exists (case-insensitive)
    const existingEnrollmentType = await EnrollmentType.findOne({ title: { $regex: new RegExp(`^${title}$`, 'i') } });

    if (existingEnrollmentType) {
        throw new APIError(409, "Enrollment type with this title already exists.");
    }

    const enrollmentType = await EnrollmentType.create({ title, description });

    if (!enrollmentType) {
        throw new APIError(500, "Failed to create enrollment type.");
    }

    res.status(201).json(
            new APIResponse(201, enrollmentType.toObject(), "Enrollment type created successfully.")
        );
});

const getAllEnrollmentTypes = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

    const query = {};
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    const sortStage = {};
    sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortStage,
    };

    const enrollmentTypes = await EnrollmentType.aggregatePaginate(EnrollmentType.aggregate([
        { $match: query }
    ]), options);

    if (!enrollmentTypes) {
        throw new APIError(500, "Failed to fetch enrollment types.");
    }

    res.status(200).json(new APIResponse(200, enrollmentTypes, "Enrollment types fetched successfully."));
});

const getEnrollmentTypeById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const enrollmentType = await EnrollmentType.findById(id);

    if (!enrollmentType) {
        throw new APIError(404, "Enrollment type not found.");
    }

    res.status(200).json(new APIResponse(200, enrollmentType, "Enrollment type fetched successfully."));
});

const updateEnrollmentType = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    // Check if enrollment type with the same title already exists and is not the current one
    if (title) {
        const existingEnrollmentType = await EnrollmentType.findOne({ title: { $regex: new RegExp(`^${title}$`, 'i') } });
        if (existingEnrollmentType && existingEnrollmentType._id.toString() !== id) {
            throw new APIError(409, "Enrollment type with this title already exists.");
        }
    }

    const updatedEnrollmentType = await EnrollmentType.findByIdAndUpdate(
        id,
        { $set: { title, description } }, // Only update provided fields
        { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedEnrollmentType) {
        throw new APIError(404, "Enrollment type not found for update.");
    }

    res.status(200).json(new APIResponse(200, updatedEnrollmentType, "Enrollment type updated successfully."));
});

const deleteEnrollmentType = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedEnrollmentType = await EnrollmentType.findByIdAndDelete(id);

    if (!deletedEnrollmentType) {
        throw new APIError(404, "Enrollment type not found for deletion.");
    }

    // Optional: Implement logic to handle opportunities associated with this enrollment type.
    // E.g., set `enrollmentType` field to null in affected Opportunities.
    // await Opportunity.updateMany({ enrollmentType: id }, { $set: { enrollmentType: null } });

    res.status(200).json(new APIResponse(200, null, "Enrollment type deleted successfully."));
});

// ⭐ NEW CONTROLLER FOR BULK UPLOAD ⭐
// const bulkUploadOpportunities = asyncHandler(async (req, res) => {
//   console.log("Admin attempting bulk upload of opportunities via CSV...");

//   if (!req.file || req.file.fieldname !== 'csvFile') {
//     throw new APIError(400, "CSV file is required for bulk upload. Please upload a file named 'csvFile'.");
//   }

//   const csvFilePath = req.file.path;
//   const errors = [];
//   const opportunitiesToInsert = [];
//   const rowProcessingPromises = [];

//   try {
//     await new Promise((resolve, reject) => {
//       fs.createReadStream(csvFilePath)
//         .pipe(csv())
//         .on('data', (data) => {
//           rowProcessingPromises.push(
//             (async () => {
//               console.log("\n--- Processing New Row ---");
//               console.log("Raw CSV row data received by parser:", data);

//               const { error, value } = bulkUploadOpportunitySchema.validate(data, {
//                 abortEarly: false,
//                 stripUnknown: false
//               });

//               if (error) {
//                 console.error("Joi validation errors for row:", data, "DETAILS:", error.details);
//                 errors.push({
//                   row: data,
//                   message: `Validation error: ${error.details.map(d => d.message).join(', ')}`
//                 });
//               } else {
//                 console.log("Joi validated value for row:", value);
//                 try {
//                   const programIds = await resolveProgramTypeIds(value.program);
//                   const domainIds = await resolveDomainIds(value.domain);
//                   const enrollmentTypeId = value.enrollmentType ? new mongoose.Types.ObjectId(value.enrollmentType) : null;

//                   const transformedOpportunity = {
//                     title: value.title,
//                     description: value.description,
//                     organization: value.organization,
//                     paid: value.paid,
//                     opportunityStatus: value.opportunityStatus,
//                     isFeatured: value.isFeatured,
//                     isSaved: value.isSaved,
//                     employmentType: value.employmentType || null,
//                     coverImage: { imageUrl: DEFAULT_COVER_URL, imagePublicId: null },
//                     duration: value.duration || null,
//                     opportunityStartDate: value.opportunityStartDate,
//                     applicationStartDate: value.applicationStartDate,
//                     applicationDeadline: value.applicationDeadline,
//                     enrollmentType: enrollmentTypeId,
//                     program: programIds,
//                     domain: domainIds,
//                   };

//                   opportunitiesToInsert.push(transformedOpportunity);
//                   console.log("SUCCESS: Transformed opportunity added to queue. Current count:", opportunitiesToInsert.length);
//                 } catch (transformError) {
//                   console.error("ERROR: Data transformation (ID resolution) failed for row:", data, "Error:", transformError.message);
//                   errors.push({
//                     row: data,
//                     message: `Data transformation/ID resolution error: ${transformError.message}`
//                   });
//                 }
//               }
//             })()
//           );
//         })
//         .on('end', async () => {
//           console.log("\n--- CSV Parsing Complete ---");
//           await Promise.allSettled(rowProcessingPromises); // 🔥 Wait for all async row handlers
//           console.log("Final opportunitiesToInsert count before database insert:", opportunitiesToInsert.length);
//           console.log("Final errors count (from Joi or transformation):", errors.length);
//           resolve();
//         })
//         .on('error', (err) => {
//           console.error("CRITICAL: CSV parsing stream error:", err);
//           reject(new APIError(500, `Error parsing CSV file: ${err.message}`));
//         });
//     });

//     // --- Database Insertion Block ---
//     let successfulInserts = 0;
//     let failedInserts = 0;

//     if (opportunitiesToInsert.length > 0) {
//       console.log(`Attempting to insert ${opportunitiesToInsert.length} opportunities into the database...`);
//       try {
//         const insertResult = await Opportunity.insertMany(opportunitiesToInsert, { ordered: false });
//         successfulInserts = insertResult.length;
//         console.log(`Database insert successful. Inserted: ${successfulInserts} opportunities.`);
//       } catch (insertError) {
//         console.error("Database insert error:", insertError);

//         if (insertError.name === 'MongoBulkWriteError') {
//           successfulInserts = insertError.result.nInserted;
//           failedInserts = insertError.result.writeErrors.length;
//           insertError.result.writeErrors.forEach(err => {
//             const originalRowIndex = err.index;
//             errors.push({
//               row: originalRowIndex !== undefined ? opportunitiesToInsert[originalRowIndex] : "Unknown",
//               message: `Database insert error: ${err.errmsg || err.message}`
//             });
//           });
//           console.error(`Bulk insert partially failed. Inserted: ${successfulInserts}, Failed: ${failedInserts}`);
//         } else if (insertError.name === 'ValidationError') {
//           const mongooseErrors = Object.values(insertError.errors).map(err => err.message);
//           errors.push({ row: "N/A", message: `Mongoose validation error: ${mongooseErrors.join(', ')}` });
//           console.error("Mongoose validation error during bulk insert:", insertError);
//         } else {
//           throw new APIError(500, `An unexpected error occurred during bulk insertion: ${insertError.message}`);
//         }
//       }
//     } else {
//       console.log("No valid opportunities to insert after processing CSV.");
//     }

//     // --- Cleanup and Response ---
//     fs.unlink(csvFilePath, (err) => {
//       if (err) console.error(`Failed to delete temp CSV file ${csvFilePath}:`, err);
//     });

//     const totalProcessed = opportunitiesToInsert.length + errors.length;
//     const finalMessage = `Bulk upload complete. Total rows attempted: ${totalProcessed}, Successfully inserted: ${successfulInserts}, Failed: ${errors.length}.`;

//     res.status(200).json(new APIResponse(200, {
//       summary: {
//         totalRowsAttempted: totalProcessed,
//         successfullyInserted: successfulInserts,
//         failedRows: errors.length,
//       },
//       errors: errors
//     }, finalMessage));
//   } catch (apiError) {
//     fs.unlink(csvFilePath, (err) => {
//       if (err) console.error(`Failed to delete temp CSV file ${csvFilePath} on early error:`, err);
//     });
//     throw apiError;
//   }
// });

// const bulkUploadOpportunities1 = asyncHandler(async (req, res) => {
//     console.log("Admin attempting bulk upload of opportunities via file...");

//     const filePath = req.file?.path;
//     let rawOpportunities = [];

//     if (!filePath) {
//         throw new APIError(400, "File not provided or not uploaded correctly.");
//     }

//     try {
//         const fileContent = await fs.readFile(filePath, "utf-8");
//         const parsed = JSON.parse(fileContent);
//         if (Array.isArray(parsed)) {
//             rawOpportunities = parsed;
//         } else if (parsed.opportunities && Array.isArray(parsed.opportunities)) {
//             rawOpportunities = parsed.opportunities;
//         } else {
//             throw new APIError(
//                 400,
//                 "Invalid file format. Expected a JSON array or an object with an 'opportunities' array."
//             );
//         }
//     } catch (parseError) {
//         throw new APIError(400, `Could not parse JSON file: ${parseError.message}`);
//     } finally {
//         try {
//             await fs.unlink(filePath);
//             console.log(`Successfully deleted temp file: ${filePath}`);
//         } catch (unlinkError) {
//             console.error(`Failed to delete temp file: ${filePath}`, unlinkError);
//         }
//     }

//     const normalizedOpportunities = rawOpportunities.map(normalizeOpportunityKeys);
//     const errors = [];
//     let opportunitiesToInsert = [];

//     // --- NEW: PRE-FETCH ALL PROGRAMS IN ONE GO ---
//     // 1. Collect all unique program titles from the entire dataset
//     const allProgramTitles = new Set();
//     normalizedOpportunities.forEach(opp => {
//         if (opp.program) {
//             const programInput = Array.isArray(opp.program) ? opp.program : [opp.program];
//             programInput.forEach(p => allProgramTitles.add(String(p).trim()));
//         }
//     });

//     // 2. Perform a single database query for all unique titles
//     const regexTitles = [...allProgramTitles].map(title => new RegExp(`^${title}$`, "i"));
//     const existingPrograms = await Program.find({ title: { $in: regexTitles } }).lean();

//     // 3. Create a map for fast in-memory lookup
//     const titleToIdMap = new Map(existingPrograms.map(doc => [doc.title.toLowerCase(), doc._id]));
//     const missingTitles = [...allProgramTitles].filter(t => !titleToIdMap.has(t.toLowerCase()));

//     // 4. Create any missing programs in a single bulk insert
//     if (missingTitles.length > 0) {
//         const newPrograms = await Program.insertMany(missingTitles.map(title => ({ title: title.trim() })));
//         newPrograms.forEach(p => titleToIdMap.set(p.title.toLowerCase(), p._id));
//     }

//     // --- CONCURRENCY CONTROL: LIMIT PROMISE EXECUTION ---
//     // This is the critical change. Instead of running all promises at once,
//     // we limit the number of concurrent operations to prevent database overload.
//     // We are limiting it to 5 concurrent operations, which can be adjusted.
//     const limit = pLimit(5);

//     const validationAndTransformationPromises = normalizedOpportunities.map((data, index) =>
//         limit(async () => {
//             console.log(`--- Processing Opportunity ${index + 1} ---`);
//             console.log("Normalized JSON data:", data);

//             const { error, value } = bulkUploadOpportunitySchema.validate(data, {
//                 abortEarly: false,
//                 stripUnknown: false,
//             });

//             if (error) {
//                 console.error(`Joi validation errors for opportunity ${index + 1}:`, error.details);
//                 errors.push({
//                     row: index + 1,
//                     data,
//                     message: `Validation error: ${error.details.map(d => d.message).join(', ')}`,
//                 });
//                 return null;
//             }

//             try {
//                 // --- REFACTORED: USE IN-MEMORY MAP FOR ID LOOKUP ---
//                 const programInput = Array.isArray(value.program)
//                     ? value.program
//                     : [value.program].filter(Boolean);

//                 const programIds = programInput
//                     .map(t => titleToIdMap.get(String(t).trim().toLowerCase()))
//                     .filter(id => id);

//                 let fieldsArray = [];
//                 if (Array.isArray(value.fields)) {
//                     fieldsArray = value.fields.map(f => f.trim().toUpperCase());
//                 } else if (typeof value.fields === "string") {
//                     fieldsArray = value.fields.split(",").map(f => f.trim().toUpperCase());
//                 }

//                 let gradesArray = [];
//                 if (Array.isArray(value.grades)) {
//                     gradesArray = value.grades.map(g => g.trim().toUpperCase());
//                 } else if (typeof value.grades === "string") {
//                     gradesArray = value.grades.split(",").map(g => g.trim().toUpperCase());
//                 }

//                 const transformedOpportunity = {
//                     ...value,
//                     program: programIds,
//                     fields: fieldsArray,
//                     grades: gradesArray,
//                     states: value.states.trim().toUpperCase(),
//                     points: value.isFeatured ? value.points : null,
//                 };

//                 console.log("SUCCESS: Transformed opportunity added to queue:", transformedOpportunity);
//                 return transformedOpportunity;
//             } catch (transformError) {
//                 console.error(`ERROR: Data transformation failed for opportunity ${index + 1}:`, transformError.message);
//                 errors.push({
//                     row: index + 1,
//                     data,
//                     message: `Data transformation error: ${transformError.message}`,
//                 });
//                 return null;
//             }
//         })
//     );

//     const results = await Promise.allSettled(validationAndTransformationPromises);
//     opportunitiesToInsert = results
//         .filter(r => r.status === 'fulfilled' && r.value !== null)
//         .map(r => r.value);

//     console.log("Final opportunitiesToInsert count before database insert:", opportunitiesToInsert.length);
//     console.log("Final errors count:", errors.length);

//     let successfulInserts = 0;

   
//     if (opportunitiesToInsert.length > 0) {
//         console.log(`Attempting to insert ${opportunitiesToInsert.length} opportunities into the database...`);
//         try {
//             const insertResult = await Opportunity.insertMany(opportunitiesToInsert, { ordered: false });
//             successfulInserts = insertResult.length;
//             console.log(`Database insert successful. Inserted: ${successfulInserts} opportunities.`);
//         } catch (insertError) {
//             console.error("Database insert error:", insertError);

//             // Check if the error is a Mongoose bulk write error
//             if (insertError.name === 'MongoBulkWriteError') {
//                 successfulInserts = insertError.result?.nInserted || 0;
                
//                 // Log specific errors for each document that failed
//                 insertError.writeErrors?.forEach(err => {
//                     errors.push({
//                         row: err.index + 1, // Add 1 to index to match row number
//                         message: `Database insert error: ${err.errmsg || err.message}`,
//                         data: opportunitiesToInsert[err.index]
//                     });
//                 });
//                 console.error(`Bulk insert partially failed. Inserted: ${successfulInserts}, Failed: ${opportunitiesToInsert.length - successfulInserts}`);

//             // Check if the error is a Mongoose validation error
//             } else if (insertError.name === 'ValidationError') {
//                 const mongooseErrors = Object.values(insertError.errors).map(err => err.message);
//                 errors.push({ row: "N/A", message: `Mongoose validation error: ${mongooseErrors.join(', ')}` });
//                 console.error("Mongoose validation error during bulk insert:", insertError);
            
//             // Handle any other unexpected errors
//             } else {
//                 console.error(`An unexpected error occurred during bulk insertion: ${insertError.message}`);
//                 throw new APIError(500, `An unexpected error occurred during bulk insertion: ${insertError.message}`);
//             }
//         }
//     }


//     const totalProcessed = normalizedOpportunities.length;
//     const finalMessage = `Bulk upload complete. Total opportunities attempted: ${totalProcessed}, Successfully inserted: ${successfulInserts}, Failed: ${totalProcessed - successfulInserts}.`;

//     res.status(200).json(new APIResponse(200, {
//         summary: {
//             totalRowsAttempted: totalProcessed,
//             successfullyInserted: successfulInserts,
//             failedRows: totalProcessed - successfulInserts,
//         },
//         errors,
//     }, finalMessage));
// });

const getAllfields = asyncHandler(async (req, res) => {
     try {
    const fields = await Field.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json(
      new APIResponse(200, {
        fields,
      }, "Opportunity fields fetched successfully.")
    );
  } catch (dbError) {
    console.error("Database error fetching opportunity fields:", dbError);
    throw new APIError(500, "An error occurred while fetching opportunity fields.");
  }
});

const getAllgrades = asyncHandler(async (req, res) => {
 try {
    const grades = await Grade.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json(
      new APIResponse(200, {
        grades,
      }, "Opportunity grades fetched successfully.")
    );
  } catch (dbError) {
    console.error("Database error fetching opportunity grades:", dbError);
    throw new APIError(500, "An error occurred while fetching opportunity grades.");
  }
});

// Function to get IDs for related documents (e.g., Program)
// This should be done once for all unique program names
const getIdsForPrograms = async (programNames) => {
  // You'd implement this to find IDs for all program names
  // This is a placeholder for your actual function\
  const uniqueNames = [...new Set(programNames)];

  const programs = await Program.find({ title: { $in: uniqueNames } });
  const programMap = new Map(programs.map((p) => [p.title, p._id]));

  return programMap;
};

// Function to handle bulk upload
const bulkUploadOpportunities = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Handle both file path (development) and buffer (production) scenarios
    let fileContent;
    if (req.file.path) {
      // Development environment - file saved to disk
      fileContent = fs.readFileSync(req.file.path, 'utf-8');
    } else if (req.file.buffer) {
      // Production environment - file in memory
      fileContent = req.file.buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'File data not available.' });
    }

    const opportunitiesData = JSON.parse(fileContent);
    const opportunitiesToInsert = [];
    const errors = [];
    const titlesAndIndices = [];
    // const programNames = opportunitiesData.map((o) => o.program);
    const programNames = opportunitiesData.flatMap(o => o.program.split(',').map(s => s.trim()));


    // Fetch program IDs for all unique program names in a single query
    const programMap = await getIdsForPrograms(programNames);

    // First, validate and transform all data in a single, fast loop
    for (const opportunity of opportunitiesData) {
      try {
        // Prepare data for Mongoose validation
        const fieldsArray = opportunity.Fields.split(', ').map((f) => f.trim());
        const gradesArray = opportunity.Grades.split(', ').map((g) => g.trim());
         const programArray = opportunity.program.split(',').map(p => p.trim());
            
            // Map the program names to their corresponding IDs
            const programIds = programArray.map(name => {
                const programId = programMap.get(name);
                if (!programId) {
                    throw new Error(`Program '${name}' not found.`);
                }
                return programId;
            });

        // Check if program exists
        if (programIds.length === 0) {
          throw new Error(`Program '${opportunity.program}' not found.`);
        }

        const opportunityPayload = {
          title: opportunity.Title,
          types: opportunity.Types,
          description: opportunity.Description,
          states: opportunity.States,
          fields: fieldsArray,
          grades: gradesArray,
          seeWebsiteLink: opportunity.See_Website_Link,
          opportunityIndex: opportunity.Opportunity_Index,
          imageLink: opportunity.Image_Link,
          duration: opportunity.duration,
          opportunityStartDate: opportunity.opportunityStartDate,
          organization: opportunity.organization,
          isFeatured: opportunity.isFeatured,
          enrollmentType: opportunity.enrollmentType,
          program: programIds,
          points: opportunity.isFeatured ? 10 : 0,
        };

        const newOpportunity = new Opportunity(opportunityPayload);
        const validationError = newOpportunity.validateSync();
        if (validationError) {
          throw new Error(validationError.message);
        }

        opportunitiesToInsert.push(opportunityPayload);
        titlesAndIndices.push({
          title: opportunityPayload.title,
          opportunityIndex: opportunityPayload.opportunityIndex,
        });
      } catch (validationError) {
        errors.push({
          data: opportunity,
          error: validationError.message,
        });
      }
    }

    // Check for duplicates in a single query after all data is prepared
    if (titlesAndIndices.length > 0) {
      const existingOpportunities = await Opportunity.find(
        {
          $or: titlesAndIndices,
        },
        { _id: 1, title: 1, opportunityIndex: 1 }
      );

      if (existingOpportunities.length > 0) {
        const existingMap = new Map(
          existingOpportunities.map((o) => [
            `${o.title}-${o.opportunityIndex}`,
            o,
          ])
        );

        const opportunitiesToAdd = opportunitiesToInsert.filter((o) => {
          const key = `${o.title}-${o.opportunityIndex}`;
          if (existingMap.has(key)) {
            errors.push({
              data: o,
              error:` Duplicate opportunity with title '${o.title}' and index '${o.opportunityIndex}' already exists.`,
            });
            return false;
          }
          return true;
        });
        opportunitiesToInsert.splice(
          0,
          opportunitiesToInsert.length,
          ...opportunitiesToAdd
        );
      }
    }

    // Bulk Insertion
    if (opportunitiesToInsert.length > 0) {
      await insertInBatches(opportunitiesToInsert, 100);
    }

    if (req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    const successCount = opportunitiesToInsert.length;
    const totalDocuments = opportunitiesData.length;

    if (errors.length > 0) {
      return res.status(207).json({
        // 207 Multi-Status
        message: `${successCount} out of ${totalDocuments} opportunities were added successfully.`,
        errors: errors,
      });
    }

    res.status(201).json({
      message: `${successCount} opportunities were successfully added.`,
      addedCount: successCount,
    });
  } catch (error) {
    console.error('Bulk upload failed:', error);
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      message: 'An internal server error occurred during the bulk upload.',
      error: error.message,
    });
  }
};

const insertInBatches = async (opportunities, batchSize = 100) => {
  const batches = [];
  for (let i = 0; i < opportunities.length; i += batchSize) {
    const batch = opportunities.slice(i, i + batchSize);
    batches.push(Opportunity.insertMany(batch, { ordered: false }));
  }
  return Promise.all(batches);
};


export {
  getAllOpportunities,
  createOpportunity,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
  openOpportunity,
  closeOpportunity,
  createOpportunityDomain,
  getAllOpportunityDomains,
  getOpportunityDomainById,
  updateOpportunityDomain,
  deleteOpportunityDomain,
  createOpportunityProgramType,
  getAllOpportunityProgramTypes,
  getOpportunityProgramTypeById,
  updateOpportunityProgramType,
  deleteOpportunityProgramType,
  createEnrollmentType,
  getAllEnrollmentTypes,
  getEnrollmentTypeById,
  updateEnrollmentType,
  deleteEnrollmentType,
  bulkUploadOpportunities,
  getAllfields,
  getAllgrades,
  bulkDeleteOpportunities,
};