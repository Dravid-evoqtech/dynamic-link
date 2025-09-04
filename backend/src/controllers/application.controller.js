import { isValidObjectId } from "mongoose";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Application } from "../models/application.model.js";
import { User } from "../models/user.model.js";

const createApplication = asyncHandler(async (req, res) => {
    try {
        const { opportunityId, applicant } = req.body;

        if (!opportunityId || !applicant) {
            throw new APIError(400, "All Fields Required");
        }

        if (!isValidObjectId(opportunityId) && !isValidObjectId(applicant)) {
            throw new APIError(400, "Invalid opportunity or applicant ID");
        }


        const existingApplication = await Application.findOne({ opportunity: opportunityId, applicant });
      
        
        if (existingApplication) {
            res.status(400).json(new APIResponse(400, [], "Application already exists"));
        }

        const application = await Application.create({ opportunity: opportunityId, applicant });
      
        
        if (!application) {
            throw new APIError(500, "Error creating application");
        }

       const user = await User.findByIdAndUpdate(applicant, { $push: { applications: application._id } });

        return res.status(201).json(new APIResponse(201, application, "Application created successfully"));

    } catch (error) {
        throw new APIError(500, "Error creating application");
    }
});

const getAllApplicationsfilter = asyncHandler(async (req, res) => {
    try {

        const {
            limit,
            page,
            sortBy = "Newest",
            status = "All",
        } = req?.body;

        if (!limit || !page) {
            throw new APIError(400, "Limit and page are required");
        }

        let parsedLimit = Math.max(1, parseInt(limit));

        const parsedPage = Math.max(1, parseInt(page));
        const skip = (parsedPage - 1) * parsedLimit;

        const query = {};
        query.applicant = req.user._id;
        if (status !== "All") {
            query.status = status;

        }

        const sortOption = {};
        if (sortBy === "Newest") {
            sortOption.createdAt = -1;
        } else if (sortBy === "Oldest") {
            sortOption.createdAt = 1;
        }

        const total = await Application.countDocuments(query);
        const totalPages = Math.ceil(total / parsedLimit);

        const applications = await Application.find({
            ...query,
        }).sort(sortOption).skip(skip).limit(parsedLimit).populate("opportunity");

        if (!applications || applications.length === 0) {
            res.status(404).json(new APIResponse(404, [], "No applications found"));
        }
        return res.status(200)
            .json(new APIResponse(200, {
                applications,
                pagination: {
                    totalItems: total,
                    totalPages,
                    currentPage: parsedPage,
                    perPage: parsedLimit,
                },
            }, "Applications fetched successfully"));
    } catch (error) {
        throw new APIError(500, "Error while getting all applications");
    }
});
const getActivities = asyncHandler(async (req, res) => {

    const {
        limit,
        page,
        sort
    } = req?.body;

    if (!limit || !page) {
        throw new APIError(400, "Limit and page are required");
    }

    let sortBy = sort || "Newest";

    const filter = req.params.filter;

    let parsedLimit = Math.max(1, parseInt(limit));

    const parsedPage = Math.max(1, parseInt(page));
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {};
    if (filter === "saved") {
        query.isSaved = true;
        query.applicant = req.user._id;
    } else if (filter === "applied") {
        query.status = "Applied";
        query.applicant = req.user._id;
    } else if (filter === "recent") {
        sortBy = "Newest";
        query.applicant = req.user._id;
    }

    const sortOption = {};
    if (sortBy === "Newest") {
        sortOption.createdAt = -1;
    } else if (sortBy === "Oldest") {
        sortOption.createdAt = 1;
    }

    const total = await Application.countDocuments(query);
    const totalPages = Math.ceil(total / parsedLimit);

    const applications = await Application.find({
        ...query,
    }).sort(sortOption).skip(skip).limit(parsedLimit).populate("opportunity");

    if (!applications || applications.length === 0) {
        res.status(404).json(new APIResponse(404, [], "No applications found"));
    }
    return res.status(200)
        .json(new APIResponse(200, {
            applications,
            pagination: {
                totalItems: total,
                totalPages,
                currentPage: parsedPage,
                perPage: parsedLimit,
            },
        }, "Applications fetched successfully"));

});
const getAllApplications = asyncHandler(async (req, res) => {
    try {

        const { id } = req.user;

        const applications = await Application.find({
            applicant: id
        }).populate("opportunity");

        if (!applications || applications.length === 0) {
            res.status(404).json(new APIResponse(404, [], "No applications found"));
        }
        return res.status(200)
            .json(new APIResponse(200, {
                applications,
            }, "Applications fetched successfully"));
    } catch (error) {
        throw new APIError(500, "Error while getting all applications");
    }
});

const getApplicationById = asyncHandler(async (req, res) => {
    try {

        const { id } = req.params;
        if (!isValidObjectId(id)) {
            throw new APIError(400, "Invalid ID format");
        }

        const application = await Application.findById(id).populate("opportunity");
        if (!application) {
            throw new APIError(404, "Application not found");
        }
        return res.status(200)
            .json(new APIResponse(200, application, "Application fetched successfully"));
    } catch (error) {
        throw new APIError(500, "Error while getting application by ID");
    }
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!isValidObjectId(id)) {
            throw new APIError(400, "Invalid ID format");
        }

        const application = await Application.findById(id);
        if (!application) {
            throw new APIError(404, "Application not found");
        }

        const updatedApplication = await Application.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedApplication) {
            throw new APIError(500, "Error updating application");
        }
        return res.status(200)
            .json(new APIResponse(200, updatedApplication, "Application updated successfully"));
    } catch (error) {
        throw new APIError(500, "Error while updating application");
    }

});

const saveApplication = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            throw new APIError(400, "Invalid ID format");
        }

        const application = await Application.findById(id);
        if (!application) {
            throw new APIError(404, "Application not found");
        }
        if (application.isSaved) {
            res.status(400)
                .json(new APIResponse(400, [], "Application already saved"));
        }

        const updatedApplication = await Application.findByIdAndUpdate(id, { isSaved: true }, { new: true });
        if (!updatedApplication) {
            throw new APIError(500, "Error updating application");
        }
        return res.status(200)
            .json(new APIResponse(200, updatedApplication, "Application updated successfully"));
    } catch (error) {
        throw new APIError(500, "Error while updating application");
    }

});

const removeFromSaved = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            throw new APIError(400, "Invalid ID format");
        }

        const application = await Application.findById(id);
        if (!application) {
            throw new APIError(404, "Application not found");
        }
        if (!application.isSaved) {
            res.status(400)
                .json(new APIResponse(400, [], "Application is already not saved"));
        }

        const updatedApplication = await Application.findByIdAndUpdate(id, { isSaved: false }, { new: true });
        if (!updatedApplication) {
            throw new APIError(500, "Error updating application");
        }
        return res.status(200)
            .json(new APIResponse(200, updatedApplication, "Application updated successfully"));
    } catch (error) {
        throw new APIError(500, "Error while updating application");
    }

});

const getApplicationStats = asyncHandler(async (req, res) => {

    let totalApplicationCount, totalSavedApplicationCount, totalAppliedApplicationCount;
    totalApplicationCount = await Application.countDocuments({ applicant: req.user.id });
    totalSavedApplicationCount = await Application.countDocuments({ isSaved: true, applicant: req.user.id });
    totalAppliedApplicationCount = await Application.countDocuments({ status: "Applied", applicant: req.user.id });
    return res
        .status(200)
        .json(new APIResponse(200, {
            totalApplicationCount,
            totalSavedApplicationCount,
            totalAppliedApplicationCount
        }, "Application Stats fetched successfully"));
})

export {
    createApplication,
    getAllApplicationsfilter,
    getAllApplications,
    getActivities,
    getApplicationById,
    updateApplicationStatus,
    saveApplication,
    removeFromSaved,
    getApplicationStats
}