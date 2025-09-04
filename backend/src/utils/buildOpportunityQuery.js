import e from "express";
import getEnrollmentTypeId from "./getId/enrollmentType.js";

//for multi-select filters
/**
 * @typedef {Object} OpportunityFilters
 * @property {string} [search]
 * @property {string|string[]} [fields]
 * @property {string|string[]} [program]
 * @property {string|string[]} [states] 
 * @property {string|Date} [deadlineBefore]
 * @property {string|Date} [deadlineAfter]
 */

/**
 * @param {OpportunityFilters} filters
 */
export const buildOpportunityQuery = async (filters = {}) => {
    const {
        search,
        fields,
        program,           // Can be a string or an array
        states,           // Can be "All", or an array like ["Remote", "Hybrid"]
    } = filters;
console.log(filters);

    const query = {};

    if (search && typeof search === "string" && search.trim() !== "") {
        query.$or = [
            { title: { $regex: search.trim(), $options: "i" } },
            { description: { $regex: search.trim(), $options: "i" } },
        ];
    }

    if (fields && Array.isArray(fields) && fields.length > 0){     
        query.fields = {$in: fields};
    } else if (typeof fields === "string" && fields !== "All") {
        query.fields = {$in: [fields]}; 
    } 
   
    if (states && states !== "All") query.states = states;

    // ✅ Multi-select for `program` (stored as ObjectIds in array)
    if (program && Array.isArray(program) && program.length > 0) {
        query.program = { $in: program };
    } else if (typeof program === "string" && program !== "All") {
        query.program = { $in: [program] };
    }


    return query;
};

export const getSortOption = (sortKey) => {
    switch (sortKey) {
        case "Newest":
            return { createdAt: -1 };
        case "Featured":
            return { isFeatured: -1 };
        default:
            return;
    }
};
