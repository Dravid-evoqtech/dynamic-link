import { isValidObjectId } from 'mongoose';
import { Field } from '../models/userData/field.model.js';
import { APIResponse } from '../utils/APIResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { EnrollmentType } from '../models/userData/enrollmentType.model.js';
import { Grade } from '../models/userData/grade.model.js';
import { Goal } from '../models/userData/goal.model.js';
import { AvailabilitySeason } from '../models/userData/availabilitySeason.model.js';
import { Program } from '../models/userData/program.model.js';
import { State } from '../models/userData/state.model.js';

// all get controllers for user data retrieval
const getOpportunityProgramTypes = asyncHandler(async (req, res) => {
  const programTypes = await Program.find();
  if (!programTypes || programTypes.length === 0) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'No program types found'));
  }
  return res
    .status(200)
    .json(
      new APIResponse(200, programTypes, 'Program types retrieved successfully')
    );
});
const getGoals = asyncHandler(async (req, res) => {
  const userGoals = await Goal.find();
  if (!userGoals || userGoals.length === 0) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'No user goals found'));
  }
  return res
    .status(200)
    .json(new APIResponse(200, userGoals, 'User goals retrieved successfully'));
});
const getAvailabilitySeasons = asyncHandler(async (req, res) => {
  const availabilitySeasons = await AvailabilitySeason.find();
  if (!availabilitySeasons || availabilitySeasons.length === 0) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'No availability seasons found'));
  }
  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        availabilitySeasons,
        'Availability seasons retrieved successfully'
      )
    );
});
const getEnrollmentTypes = asyncHandler(async (req, res) => {
  const enrollmentTypes = await EnrollmentType.find();
  if (!enrollmentTypes || enrollmentTypes.length === 0) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'No enrollment types found'));
  }
  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        enrollmentTypes,
        'Enrollment types retrieved successfully'
      )
    );
});

const getGrades = asyncHandler(async (req, res) => {
  const grades = await Grade.find();
  if (!grades || grades.length === 0) {
    return res.status(404).json(new APIResponse(404, [], 'No grade found'));
  }
  return res
    .status(200)
    .json(new APIResponse(200, grades, 'Grades retrieved successfully'));
});

const getFields = asyncHandler(async (req, res) => {
  const fields = await Field.find(); 
  if (!fields || fields.length === 0) {
    return res.status(404).json(new APIResponse(404, [], 'No fields found')); 
  }

  return res
    .status(200)
    .json(new APIResponse(200, fields, 'Fields retrieved successfully'));
});


const createOpportunityProgramType = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'Title and description are required'));
  }
  const programType = await Program.create({ title, description });
  return res
    .status(201)
    .json(
      new APIResponse(201, programType, 'Program type created successfully')
    );
});
const createGoal = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'Title and description are required'));
  }
  const userGoal = await Goal.create({ title, description });
  return res
    .status(201)
    .json(new APIResponse(201, userGoal, 'User goal created successfully'));
});
const createAvailabilitySeason = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'Title and description are required'));
  }
  const availabilitySeason = await AvailabilitySeason.create({
    title,
    description,
  });
  return res
    .status(201)
    .json(
      new APIResponse(
        201,
        availabilitySeason,
        'Availability season created successfully'
      )
    );
});
const createState = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'Title and description are required'));
  }
  const state = await State.create({ title, description });
  return res
    .status(201)
    .json(
      new APIResponse(
        201,
        state,
        'Enrollment type created successfully'
      )
    );
});
const createGrade = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'Title and description are required'));
  }
  const grades = await Grade.create({ title, description });
  return res
    .status(201)
    .json(new APIResponse(201, grades, 'Enrollment type created successfully'));
});
const createField = asyncHandler(async (req, res) => {
  const { fields } = req.body;
  let addedFields = [];
  for (const field of fields) {
    if (!field.title || !field.description) {
      return res
        .status(400)
        .json(new APIResponse(400, [], 'Title and description are required'));
    }

    const field2 = await Field.create({
      title: field.title,
      description: field.description,
    }); 

    addedFields.push(field2);
  }
  return res
    .status(201)
    .json(new APIResponse(201, addedFields, 'Field created successfully'));
});

// All update controllers for user data updates

const updateOpportunityProgramType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  if (!id) {
    return res.status(400).json(new APIResponse(400, [], 'ID is required'));
  }
  if (!isValidObjectId(id)) {
    return res.status(400).json(new APIResponse(400, [], 'Invalid ID format'));
  }
  if (!title || !description) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'Title and description are required'));
  }
  const programType = await Program.findByIdAndUpdate(
    id,
    { title, description },
    { new: true }
  );
  if (!programType) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'Program type not found'));
  }
  return res
    .status(200)
    .json(
      new APIResponse(200, programType, 'Program type updated successfully')
    );
});

const updateGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { title, description } = req.body;
  if (!id) {
    return res.status(400).json(new APIResponse(400, [], 'ID is required'));
  }
  if (!isValidObjectId(id)) {
    return res.status(400).json(new APIResponse(400, [], 'Invalid ID format'));
  }
  if (!title || !description) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'Title and description are required'));
  }
  const userGoal = await Goal.findByIdAndUpdate(
    id,
    { title, description },
    { new: true }
  );
  if (!userGoal) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'User goal not found'));
  }
  return res
    .status(200)
    .json(new APIResponse(200, userGoal, 'User goal updated successfully'));
});

const updateAvailabilitySeason = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  if (!id) {
    return res.status(400).json(new APIResponse(400, [], 'ID is required'));
  }
  if (!isValidObjectId(id)) {
    return res.status(400).json(new APIResponse(400, [], 'Invalid ID format'));
  }
  if (!title || !description) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'Title and description are required'));
  }
  const availabilitySeason = await AvailabilitySeason.findByIdAndUpdate(
    id,
    { title, description },
    { new: true }
  );
  if (!availabilitySeason) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'Availability season not found'));
  }
  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        availabilitySeason,
        'Availability season updated successfully'
      )
    );
});

const updateEnrollmentType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  if (!id) {
    return res.status(400).json(new APIResponse(400, [], 'ID is required'));
  }
  if (!isValidObjectId(id)) {
    return res.status(400).json(new APIResponse(400, [], 'Invalid ID format'));
  }
  if (!title || !description) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'Title and description are required'));
  }
  const enrollmentType = await EnrollmentType.findByIdAndUpdate(
    id,
    { title, description },
    { new: true }
  );
  if (!enrollmentType) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'Enrollment type not found'));
  }
  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        enrollmentType,
        'Enrollment type updated successfully'
      )
    );
});
const updateGrade = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  if (!id) {
    return res.status(400).json(new APIResponse(400, [], 'ID is required'));
  }
  if (!isValidObjectId(id)) {
    return res.status(400).json(new APIResponse(400, [], 'Invalid ID format'));
  }
  if (!title || !description) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'Title and description are required'));
  }
  const grade = await Grade.findByIdAndUpdate(
    id,
    { title, description },
    { new: true }
  );
  if (!grade) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'Enrollment type not found'));
  }
  return res
    .status(200)
    .json(new APIResponse(200, grade, 'Enrollment type updated successfully'));
});
const updateField = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json(new APIResponse(400, [], 'Invalid ID format'));
  }

  if (!title || !description) {
    return res
      .status(400)
      .json(new APIResponse(400, [], 'Title and description are required'));
  }

  const field = await Field.findByIdAndUpdate(
    id,
    { title, description },
    { new: true }
  ); 
  if (!field) {
    return res.status(404).json(new APIResponse(404, [], 'Field not found'));
  }

  return res
    .status(200)
    .json(new APIResponse(200, field, 'Field updated successfully')); 
});

//all delete controllers for user data deletion

const deleteOpportunityProgramType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json(new APIResponse(400, [], 'ID is required'));
  }
  if (!isValidObjectId(id)) {
    return res.status(400).json(new APIResponse(400, [], 'Invalid ID format'));
  }
  const programType = await Program.findByIdAndDelete(id);
  if (!programType) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'Program type not found'));
  }
  return res
    .status(200)
    .json(new APIResponse(200, [], 'Program type deleted successfully'));
});
const deleteGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json(new APIResponse(400, [], 'ID is required'));
  }
  if (!isValidObjectId(id)) {
    return res.status(400).json(new APIResponse(400, [], 'Invalid ID format'));
  }
  const userGoal = await Goal.findByIdAndDelete(id);
  if (!userGoal) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'User goal not found'));
  }
  return res
    .status(200)
    .json(new APIResponse(200, [], 'User goal deleted successfully'));
});
const deleteAvailabilitySeason = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json(new APIResponse(400, [], 'ID is required'));
  }
  if (!isValidObjectId(id)) {
    return res.status(400).json(new APIResponse(400, [], 'Invalid ID format'));
  }
  const availabilitySeason = await AvailabilitySeason.findByIdAndDelete(id);
  if (!availabilitySeason) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'Availability season not found'));
  }
  return res
    .status(200)
    .json(new APIResponse(200, [], 'Availability season deleted successfully'));
});
const deleteEnrollmentType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json(new APIResponse(400, [], 'ID is required'));
  }
  if (!isValidObjectId(id)) {
    return res.status(400).json(new APIResponse(400, [], 'Invalid ID format'));
  }
  const enrollmentType = await EnrollmentType.findByIdAndDelete(id);
  if (!enrollmentType) {
    return res
      .status(404)
      .json(new APIResponse(404, [], 'Enrollment type not found'));
  }
  return res
    .status(200)
    .json(new APIResponse(200, [], 'Enrollment type deleted successfully'));
});
const deleteGrade = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json(new APIResponse(400, [], 'ID is required'));
  }
  if (!isValidObjectId(id)) {
    return res.status(400).json(new APIResponse(400, [], 'Invalid ID format'));
  }
  const grade = await Grade.findByIdAndDelete(id);
  if (!grade) {
    return res.status(404).json(new APIResponse(404, [], 'Grade not found'));
  }
  return res
    .status(200)
    .json(new APIResponse(200, [], 'Grade deleted successfully'));
});
const deleteField = asyncHandler(async (req, res) => {
 
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json(new APIResponse(400, [], 'Invalid ID format'));
  }

  const field = await Field.findByIdAndDelete(id); 
  if (!field) {
    return res.status(404).json(new APIResponse(404, [], 'Field not found')); 
  }

  return res
    .status(200)
    .json(new APIResponse(200, [], 'Field deleted successfully'));
});

export {
  getEnrollmentTypes,
  getGrades,
  getGoals,
  getAvailabilitySeasons,
  getOpportunityProgramTypes,
  getFields, 
  createState,
  createGrade,
  createGoal,
  createAvailabilitySeason,
  createOpportunityProgramType,
  createField, 
  updateEnrollmentType,
  updateGrade,
  updateGoal,
  updateAvailabilitySeason,
  updateOpportunityProgramType,
  updateField,
  deleteEnrollmentType,
  deleteGrade,
  deleteGoal,
  deleteAvailabilitySeason,
  deleteOpportunityProgramType,
  deleteField, 
};
