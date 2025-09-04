import { isValidObjectId } from 'mongoose';
import { Opportunity } from '../models/opportunity.model.js';
import { Field } from '../models/userData/field.model.js';
import { APIResponse } from '../utils/APIResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  buildOpportunityQuery,
  getSortOption,
} from '../utils/buildOpportunityQuery.js';
import { User } from '../models/user.model.js';
import { APIError } from '../utils/APIError.js';
import { Program } from '../models/userData/program.model.js';
import { Grade } from '../models/userData/grade.model.js';
import fs from 'fs';

const getAllOpportunities = asyncHandler(async (req, res) => {
  const { limit = 4, page = 1, sortBy = 'Newest', ...filters } = req.body;

  const parsedLimit = Math.max(1, parseInt(limit));
  const parsedPage = Math.max(1, parseInt(page));
  const skip = (parsedPage - 1) * parsedLimit;

  const query = await buildOpportunityQuery(filters);
  const sortOption = getSortOption(sortBy);

  const totalOpportunities = await Opportunity.countDocuments(query);
  const totalPages = Math.ceil(totalOpportunities / parsedLimit);

  const opportunities = await Opportunity.find(query)
    .populate('program')
    .populate('fields') 
    .sort(sortOption)
    .skip(skip)
    .limit(parsedLimit);

  if (opportunities.length === 0) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'No opportunities found'));
  }

  return res.status(200).json(
    new APIResponse(
      200,
      {
        opportunities,
        pagination: {
          totalItems: totalOpportunities,
          totalPages,
          currentPage: parsedPage,
          perPage: parsedLimit,
        },
      },
      'Opportunities retrieved successfully'
    )
  );
});

const getFeaturedOpportunities = asyncHandler(async (req, res) => {
  const { limit = 4, page = 1, states } = req.body;

  const parsedLimit = parseInt(limit, 10);
  const parsedPage = parseInt(page, 10);

  let statesFilter = {};
  if (states) {
    const statesArray = Array.isArray(states)
      ? states.map((s) => s.toLowerCase().trim())
      : states.split(',').map((s) => s.toLowerCase().trim());

    statesFilter = { states: { $in: statesArray } };
  }

  const matchStage = {
    $match: {
      isFeatured: true,
      ...statesFilter,
    },
  };

  const aggregationPipeline = [
    matchStage,
    {
      $lookup: {
        from: 'programs',
        localField: 'program',
        foreignField: '_id',
        as: 'program',
      },
    },
    {
      $lookup: {
        from: 'fields',
        localField: 'fields',
        foreignField: '_id',
        as: 'fields',
      },
    },
    { $skip: (parsedPage - 1) * parsedLimit },
    { $limit: parsedLimit },
  ];

 
  const countPipeline = [matchStage, { $count: 'total' }];

  const [opportunities, countResult] = await Promise.all([
    Opportunity.aggregate(aggregationPipeline),
    Opportunity.aggregate(countPipeline),
  ]);

  const total = countResult.length > 0 ? countResult[0].total : 0;

  if (opportunities.length === 0) {
    return res
      .status(404)
      .json(
        new APIResponse(
          404,
          [],
          `No featured opportunities found for ${states}`
        )
      );
  }

  return res.status(200).json(
    new APIResponse(
      200,
      {
        opportunities,
        total,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / parsedLimit),
          currentPage: parsedPage,
          perPage: parsedLimit,
        },
      },
      'Featured opportunities retrieved successfully'
    )
  );
});


const getCategories = asyncHandler(async (req, res) => {
  const {
    limit = 4,
    page = 1,
    search = '',
    sortBy = 'title',
    sortOrder = 'asc',
  } = req.body;

  const parsedLimit = Math.max(1, parseInt(limit));
  const parsedPage = Math.max(1, parseInt(page));
  const skip = (parsedPage - 1) * parsedLimit;

  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const initialMatchStage = {};
  if (search && typeof search === 'string' && search.trim() !== '') {
    initialMatchStage.fields = { $regex: search.trim(), $options: 'i' };
  }

  const aggregationPipeline = [
    { $match: initialMatchStage },

    { $unwind: '$fields' },

    {
      $group: {
        _id: '$fields',
        opportunityCount: { $sum: 1 },
      },
    },

    {
      $project: {
        _id: 0,
        title: '$_id',
        opportunityCount: 1,
      },
    },

    {
      $sort: {
        [sortBy === 'title' ? 'title' : 'opportunityCount']: sortDirection,
      },
    },

    { $skip: skip },
    { $limit: parsedLimit },
  ];

  const countPipeline = [
    { $match: initialMatchStage },

    { $unwind: '$fields' },

    {
      $group: {
        _id: '$fields',
      },
    },

    { $count: 'total' },
  ];

  const [categories, countResult] = await Promise.all([
    Opportunity.aggregate(aggregationPipeline),
    Opportunity.aggregate(countPipeline),
  ]);

  const totalCategories = countResult.length > 0 ? countResult[0].total : 0;
  const totalPages = Math.ceil(totalCategories / parsedLimit);

  if (categories.length === 0) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'No categories found'));
  }

  return res.status(200).json(
    new APIResponse(
      200,
      {
        categories,
        pagination: {
          totalItems: totalCategories,
          totalPages,
          currentPage: parsedPage,
          perPage: parsedLimit,
        },
      },
      'Categories retrieved successfully'
    )
  );
});
const getOpportunityById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json(new APIResponse(400, [], 'Invalid ID format'));
  }

  const opportunity = await Opportunity.findById(id)
    .populate('program')
    .populate('fields'); 

  if (!opportunity) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'Opportunity not found'));
  }

  return res
    .status(200)
    .json(
      new APIResponse(200, opportunity, 'Opportunity retrieved successfully')
    );
});

const getAllSavedOpportunities = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1, ...filters } = req.body;

  const parsedLimit = Math.max(1, parseInt(limit));
  const parsedPage = Math.max(1, parseInt(page));
  const skip = (parsedPage - 1) * parsedLimit;

  const savedByUser = await User.findById(req.user._id)
    .select('savedOpportunities')
    .populate('savedOpportunities');

  if (!savedByUser) {
    throw new APIError(404, 'No saved opportunities found');
  }

  const total = savedByUser.savedOpportunities.length;
  const totalPages = Math.ceil(total / parsedLimit);

  let opportunities;

  if (filters.states && filters.states !== 'All') {
    opportunities = savedByUser.savedOpportunities
      .filter((opportunity) => opportunity.states === filters.states)
      .slice(skip, skip + parsedLimit);
  } else {
    opportunities = savedByUser.savedOpportunities.slice(
      skip,
      skip + parsedLimit
    );
  }

  if (opportunities.length === 0) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'No saved opportunities found'));
  }

  return res.status(200).json(
    new APIResponse(
      200,
      {
        opportunities,
        pagination: {
          totalItems: total,
          totalPages,
          currentPage: parsedPage,
          perPage: parsedLimit,
        },
      },
      'Saved opportunities retrieved successfully'
    )
  );
});


const createOpportunity = asyncHandler(async (req, res) => {
  const opportunity = req.body;

  if (
    !opportunity.Title ||
    !opportunity.Types ||
    !opportunity.Description ||
    !opportunity.States ||
    !opportunity.Fields ||
    !opportunity.Grades ||
    !opportunity.See_Website_Link ||
    !opportunity.Opportunity_Index ||
    !opportunity.Image_Link ||
    !opportunity.duration ||
    !opportunity.opportunityStartDate ||
    !opportunity.isFeatured ||
    !opportunity.program ||
    !opportunity.organization ||
    !opportunity.enrollmentType
  ) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'All fields are required')); 
  }

  const existingOpportunity = await Opportunity.findOne({
    title: opportunity.Title,
    opportunityIndex: opportunity.Opportunity_Index,
  }); 
  if (existingOpportunity) {
    throw new APIError(
      400,
      'Opportunity with the same title and index already exists'
    );
  }

  const myString = opportunity.Grades;
  const gradesArray = myString.split(', ');

  let programArray = [];

  const programs = opportunity.program.split(', ');
  for (const program of programs) {
    const programId = await getId(program, Program);
    if (!programId) {
      return res
        .status(400)
        .json(new APIResponse(400, [], 'Program not found'));
    }
    programArray.push(programId);
  }
  let gradesId = gradesArray;
  let fieldsId = [];

  for (const field of opportunity.Fields.split(', ')) {
    fieldsId.push(field);
  }

  const oppo = await Opportunity.create({
    title: opportunity.Title,
    types: opportunity.Types,
    description: opportunity.Description,
    states: opportunity.States,
    fields: fieldsId, 
    grades: gradesId, 
    seeWebsiteLink: opportunity.See_Website_Link,
    opportunityIndex: opportunity.Opportunity_Index,
    imageLink: opportunity.Image_Link,
    duration: opportunity.duration,
    opportunityStartDate: opportunity.opportunityStartDate,
    organization: opportunity.organization,
    program: programArray, 
    isFeatured: opportunity.isFeatured,
    points: opportunity.points || isFeatured ? 10 : 0,
    enrollmentType: opportunity.enrollmentType, 
  });

  if (!oppo) {
    throw new APIError(500, 'Failed to create opportunity');
  }
  return res
    .status(201)
    .json(new APIResponse(201, oppo, 'Opportunity created successfully'));
});

const addOpportunities = asyncHandler(async (req, res) => {
  const { opportunities } = req.body;
  let createdOpportunities = [];
  if (!opportunities || opportunities.length === 0) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'No opportunities provided'));
  }

  for (const opportunity of opportunities) {
    if (
      !opportunity.Title ||
      !opportunity.Types ||
      !opportunity.Description ||
      !opportunity.States ||
      !opportunity.Fields ||
      !opportunity.Grades ||
      !opportunity.See_Website_Link ||
      !opportunity.Opportunity_Index ||
      !opportunity.Image_Link ||
      !opportunity.duration ||
      !opportunity.opportunityStartDate ||
      !opportunity.isFeatured ||
      !opportunity.program ||
      !opportunity.organization ||
      !opportunity.enrollmentType
    ) {
      
      return res
        .status(400)
        .json(new APIResponse(400, [], 'All fields are required')); 
    }

    const existingOpportunity = await Opportunity.findOne({
      title: opportunity.Title,
      opportunityIndex: opportunity.Opportunity_Index,
    }); 
    if (existingOpportunity) {
      throw new APIError(
        400,
        'Opportunity with the same title and index already exists'
      );
    }

    const myString = opportunity.Grades;
    const gradesArray = myString.split(', ');
    let programArray = [];

    const programs = opportunity.program.split(', ');
    for (const program of programs) {
      const programId = await getId(program, Program);
      if (!programId) {
        return res
          .status(400)
          .json(new APIResponse(400, [], 'Program not found'));
      }
      programArray.push(programId);
    }
    let gradesId = gradesArray;
    let fieldsId = opportunity.Fields.split(', ');

    const oppo = await Opportunity.create({
      title: opportunity.Title,
      types: opportunity.Types,
      description: opportunity.Description,
      states: opportunity.States,
      fields: fieldsId, 
      grades: gradesId, 
      seeWebsiteLink: opportunity.See_Website_Link,
      opportunityIndex: opportunity.Opportunity_Index,
      imageLink: opportunity.Image_Link,
      duration: opportunity.duration,
      opportunityStartDate: opportunity.opportunityStartDate,
      organization: opportunity.organization,
      program: programArray, 
      isFeatured: opportunity.isFeatured,
      points: opportunity.points || isFeatured ? 10 : 0,
      enrollmentType: opportunity.enrollmentType, 
    });

    if (!oppo) {
      throw new APIError(500, 'Failed to create opportunity');
    }

    createdOpportunities.push(oppo);
  }

  return res
    .status(201)
    .json(
      new APIResponse(
        201,
        createdOpportunities,
        'Opportunities created successfully'
      )
    );
});

const getId = async (title, model) => {
  let id;
  if (model === Grade) {
    id = await model.findOne({ description: title }).select('_id');
    return id._id;
  }
  id = await model.findOne({ title: title }).select('_id');
  if (id) {
    return id._id;
  }
  return null;
};

const saveOpportunity = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const userId = req.user._id;
  const opportunity = await Opportunity.findById(id);

  if (!opportunity) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'Opportunity not found'));
  }
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json(new APIResponse(404, [], 'User not found'));
  }
  if (user.savedOpportunities.includes(id)) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'Opportunity already saved'));
  }
  user.savedOpportunities.push(id);
  await user.save();
  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        { opportunity, user },
        'Opportunity saved successfully'
      )
    );
});
const unSaveOpportunity = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const userId = req.user._id;
  const opportunity = await Opportunity.findById(id);

  if (!opportunity) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'Opportunity not found'));
  }
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json(new APIResponse(404, [], 'User not found'));
  }
  if (!user.savedOpportunities.includes(id)) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'Opportunity already not saved'));
  }
  user.savedOpportunities.pull(id);
  await user.save();
  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        { opportunity, user },
        'Opportunity unsaved successfully'
      )
    );
});

const unlockOpportunity = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!isValidObjectId(id)) {
    throw new APIError(400, 'Invalid ID format');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new APIError(404, 'User not found');
  }

  if (user.unlockedOpportunities.includes(id)) {
    throw new APIError(400, 'Opportunity already unlocked');
  }

  const opportunity = await Opportunity.findById(id);

  if (!opportunity) {
    throw new APIError(404, 'Opportunity not found');
  }

  if (!opportunity.isFeatured) {
    user.unlockedOpportunities.push(id);
    await user.save();
    return res
      .status(200)
      .json(
        new APIResponse(200, opportunity, 'Opportunity unlocked successfully')
      );
  }

  if (user.points.total < 10) {
    throw new APIError(400, 'Not enough points to unlock opportunity');
  }
  user.points.total -= 10;
  user.points.usage += 10;
  user.unlockedOpportunities.push(id);
  await user.save();

  return res
    .status(200)
    .json(
      new APIResponse(200, opportunity, 'Opportunity unlocked successfully')
    );
});


const getIdsForPrograms = async (programNames) => {
 
  const uniqueNames = [...new Set(programNames)];

  const programs = await Program.find({ title: { $in: uniqueNames } });
  const programMap = new Map(programs.map((p) => [p.title, p._id]));

  return programMap;
};

const bulkUploadOpportunities = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const opportunitiesData = JSON.parse(fileContent);

    const opportunitiesToInsert = [];
    const errors = [];
    const titlesAndIndices = [];
    const programNames = opportunitiesData.flatMap((o) =>
      o.program.split(',').map((s) => s.trim())
    );

    const programMap = await getIdsForPrograms(programNames);

    for (const opportunity of opportunitiesData) {
      try {
        
        const fieldsArray = opportunity.Fields.split(', ').map((f) => f.trim());
        const gradesArray = opportunity.Grades.split(', ').map((g) => g.trim());
        const programArray = opportunity.program
          .split(',')
          .map((p) => p.trim());

        
        const programIds = programArray.map((name) => {
          const programId = programMap.get(name);
          if (!programId) {
            throw new Error(`Program '${name}' not found.`);
          }
          return programId;
        });

       
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
              error: `Duplicate opportunity with title '${o.title}' and index '${o.opportunityIndex}' already exists.`,
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

   
    if (opportunitiesToInsert.length > 0) {
      await insertInBatches(opportunitiesToInsert, 100);
    }

    fs.unlinkSync(req.file.path);

    const successCount = opportunitiesToInsert.length;
    const totalDocuments = opportunitiesData.length;

    if (errors.length > 0) {
      return res.status(207).json({
    
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
    if (req.file) {
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
  getOpportunityById,
  getFeaturedOpportunities,
  getCategories,
  getAllSavedOpportunities,
  createOpportunity,
  addOpportunities,
  saveOpportunity,
  unSaveOpportunity,
  unlockOpportunity,
  bulkUploadOpportunities,
};
