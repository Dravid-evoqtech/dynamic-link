
import { Opportunity } from '../../models/opportunity.model.js'; 
import { User } from '../../models/user.model.js';            
import {
  Program
} from '../../models/userData/program.model.js'; 
import {
  OpportunityDomain
} from '../../models/userData/opportunityDomain.model.js';     
import {
  EnrollmentType
} from '../../models/userData/enrollmentType.model.js';         
import { OPPORTUNITY_STATUS } from '../../constants/index.js'; 

import { APIError } from '../../utils/APIError.js';
import { APIResponse } from '../../utils/APIResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { USER_STATUS } from "../../constants/index.js";
import { Field } from "../../models/userData/field.model.js";


// const getDashboardSummary = asyncHandler(async (req, res) => {
//     // Calculate the date 7 days ago to filter the data
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//     sevenDaysAgo.setHours(0, 0, 0, 0);

//     // --- Aggregation pipeline for new users in the last 7 days ---
//     const usersLast7Days = await User.aggregate([
//         {
//             $match: {
//                 createdAt: { $gte: sevenDaysAgo }
//             }
//         },
//         {
//             $group: {
//                 _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//                 count: { $sum: 1 }
//             }
//         },
//         {
//             $sort: { "_id": 1 }
//         }
//     ]);
//     // The result is an array like [{ _id: '2024-01-01', count: 5 }, ... ]

//     // --- Aggregation pipeline for new opportunities in the last 7 days ---
//     const opportunitiesLast7Days = await Opportunity.aggregate([
//         {
//             $match: {
//                 createdAt: { $gte: sevenDaysAgo }
//             }
//         },
//         {
//             $group: {
//                 _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//                 count: { $sum: 1 }
//             }
//         },
//         {
//             $sort: { "_id": 1 }
//         }
//     ]);
//     // The result is an array like [{ _id: '2024-01-01', count: 2 }, ... ]

//     // Use Promise.all to concurrently fetch all other counts for efficiency
//     const [
//         totalUsers,
//         totalActiveUsers,
//         totalInactiveUsers,
//         totalOpportunities,
//         totalOpenOpportunities,
//         totalClosedOpportunities,
//         totalOpportunityProgramTypes,
//         totalInterests,
//         totalEnrollmentTypes,
//         totalPoints,
//     ] = await Promise.all([
//         User.countDocuments(),
//         User.countDocuments({ status: USER_STATUS.ACTIVE }),
//         User.countDocuments({ status: USER_STATUS.INACTIVE }),
//         Opportunity.countDocuments(),
//         Opportunity.countDocuments({ opportunityStatus: OPPORTUNITY_STATUS.OPEN }),
//         Opportunity.countDocuments({ opportunityStatus: OPPORTUNITY_STATUS.CLOSED }),
//         Program.countDocuments(),
//         Field.countDocuments(),
//         EnrollmentType.countDocuments(),
//         User.aggregate([
//             {
//                 $group: {
//                     _id: null,
//                     total: { $sum: '$points.total' }
//                 }
//             }
//         ])
//     ]);

//     const totalPointsSum = totalPoints[0]?.total || 0;

//     const dashboardData = {
//         totalUsers,
//         totalActiveUsers,
//         totalInactiveUsers,
//         totalOpportunities,
//         totalOpenOpportunities,
//         totalClosedOpportunities,
//         totalOpportunityProgramTypes,
//         totalInterests,
//         totalEnrollmentTypes,
//         totalPointsSum,
//         usersLast7Days,         // ⭐ NEW: Add the time-series data for users ⭐
//         opportunitiesLast7Days, // ⭐ NEW: Add the time-series data for opportunities ⭐
//     };

//     return res
//         .status(200)
//         .json(
//             new APIResponse(200, dashboardData, "Dashboard summary retrieved successfully")
//         );
// });

const getDashboardSummary = asyncHandler(async (req, res) => {
    // Calculate the date 12 months ago to filter monthly data
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);

    // Use Promise.all to concurrently fetch all counts and time-series data
    const [
        totalUsers,
        totalActiveUsers,
        totalInactiveUsers,
        totalOpportunities,
        totalOpenOpportunities,
        totalClosedOpportunities,
        totalOpportunityProgramTypes,
        totalInterests,
        totalEnrollmentTypes,
        totalPoints,
        usersByMonthAgg,
        opportunitiesByMonthAgg,
        opportunityCategoriesAgg, // Raw aggregation for opportunity categories
    ] = await Promise.all([
        // --- Single Counts ---
        User.countDocuments(),
        User.countDocuments({ status: USER_STATUS.ACTIVE }),
        User.countDocuments({ status: USER_STATUS.INACTIVE }),
        Opportunity.countDocuments(),
        Opportunity.countDocuments({ opportunityStatus: OPPORTUNITY_STATUS.OPEN }),
        Opportunity.countDocuments({ opportunityStatus: OPPORTUNITY_STATUS.CLOSED }),
        Program.countDocuments(),
        Field.countDocuments(), // Assumed Field is the total number of interests/fields
        EnrollmentType.countDocuments(),

        // --- Aggregation for Total Points ---
        User.aggregate([
            { $group: { _id: null, total: { $sum: '$points.total' } } }
        ]),

        // --- Aggregation for Monthly User Growth ---
        User.aggregate([
            { $match: { createdAt: { $gte: twelveMonthsAgo } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]),

        // --- Aggregation for Monthly Opportunity Growth ---
        Opportunity.aggregate([
            { $match: { createdAt: { $gte: twelveMonthsAgo } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]),

        // ⭐ NEW AGGREGATION PIPELINE: For Opportunity Categories (Fields) ⭐
        Opportunity.aggregate([
            {
                $unwind: '$fields' // Deconstructs the 'fields' array into a separate document for each element
            },
            {
                $group: {
                    _id: '$fields', // Groups documents by the individual field name
                    count: { $sum: 1 } // Counts the number of opportunities for each field
                }
            },
            {
                $sort: { count: -1 } // Sorts by count to show most popular first
            }
        ])
    ]);

    const totalPointsSum = totalPoints[0]?.total || 0;

    // Convert the opportunity categories array into a key-value object
    const opportunityCategories = opportunityCategoriesAgg.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {});

    const dashboardData = {
        totalUsers,
        totalActiveUsers,
        totalInactiveUsers,
        totalOpportunities,
        totalOpenOpportunities,
        totalClosedOpportunities,
        totalOpportunityProgramTypes,
        totalInterests,
        totalEnrollmentTypes,
        totalPointsSum,
        usersByMonth: usersByMonthAgg, // Renamed for clarity
        opportunitiesByMonth: opportunitiesByMonthAgg,
        opportunityCategories,
    };

    return res
        .status(200)
        .json(
            new APIResponse(200, dashboardData, "Dashboard summary retrieved successfully")
        );
});

export { getDashboardSummary };