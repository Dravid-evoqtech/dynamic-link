
import mongoose from 'mongoose';
import { OpportunityDomain } from '../models/userData/opportunityDomain.model.js'; 
import { Program } from '../models/userData/program.model.js'; 

/**
 * Resolves a comma-separated string of Opportunity Program Type titles to their MongoDB ObjectIDs.
 * Throws an error if any title is not found.
 * @param {string} programTitlesCsv A comma-separated string of program type titles.
 * @returns {Promise<mongoose.Types.ObjectId[]>} An array of MongoDB ObjectIDs.
 */
export const resolveProgramTypeIds = async (programTitlesCsv) => {
    if (!programTitlesCsv || programTitlesCsv.trim() === '') {
        return [];
    }

    const titles = programTitlesCsv.split(',').map(title => title.trim()).filter(title => title !== '');
    if (titles.length === 0) return [];

    const foundPrograms = await Program.find({ title: { $in: titles } }).select('_id title');

    if (foundPrograms.length !== titles.length) {
        const foundTitles = new Set(foundPrograms.map(p => p.title.toLowerCase()));
        const notFoundTitles = titles.filter(title => !foundTitles.has(title.toLowerCase()));
        throw new Error(`One or more Program Types not found: ${notFoundTitles.join(', ')}. Please ensure they exist.`);
    }

    return foundPrograms.map(p => p._id);
};

/**
 * Resolves a comma-separated string of Opportunity Domain titles to their MongoDB ObjectIDs.
 * Throws an error if any title is not found.
 * @param {string} domainTitlesCsv A comma-separated string of domain titles.
 * @returns {Promise<mongoose.Types.ObjectId[]>} An array of MongoDB ObjectIDs.
 */
export const resolveDomainIds = async (domainTitlesCsv) => {
    if (!domainTitlesCsv || domainTitlesCsv.trim() === '') {
        return []; 
    }

    const titles = domainTitlesCsv.split(',').map(title => title.trim()).filter(title => title !== '');
    if (titles.length === 0) return [];

    const foundDomains = await OpportunityDomain.find({ title: { $in: titles } }).select('_id title');

    if (foundDomains.length !== titles.length) {
        const foundTitles = new Set(foundDomains.map(d => d.title.toLowerCase()));
        const notFoundTitles = titles.filter(title => !foundTitles.has(title.toLowerCase()));
        throw new Error(`One or more Domains not found: ${notFoundTitles.join(', ')}. Please ensure they exist.`);
    }

    return foundDomains.map(d => d._id);
};