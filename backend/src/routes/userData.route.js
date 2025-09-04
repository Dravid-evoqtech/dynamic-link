import { Router } from "express";
import {
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
} from "../controllers/userData.controller.js";
import { validate } from "../middlewares/validate.js";
import { userDataParamsValidationSchema, userDataValidationSchema } from "../validations/userData.validation.js";
import { upload } from "../middlewares/multer.middleware.js";

const userDataRouter = Router();

userDataRouter.route("/opportunity-program-types")
    .get(getOpportunityProgramTypes)
    .post(
        upload.none(),
        validate(userDataValidationSchema, "body"),
        createOpportunityProgramType)
    .patch(
        upload.none(),
        validate(userDataValidationSchema, "body"),
        validate(userDataParamsValidationSchema, "params"),
        updateOpportunityProgramType)
    .delete(
        validate(userDataParamsValidationSchema, "params"),
        deleteOpportunityProgramType
    );

userDataRouter.route("/user-goals")
    .get(getGoals)
    .post(
        upload.none(),
        validate(userDataValidationSchema, "body"),
        createGoal)
    .patch(
        upload.none(),
        validate(userDataValidationSchema, "body"),
        validate(userDataParamsValidationSchema, "params"),
        updateGoal)
    .delete(
        validate(userDataParamsValidationSchema, "params"),
        deleteGoal
    );

userDataRouter.route("/availability-seasons")
    .get(getAvailabilitySeasons)
    .post(
        upload.none(),
        validate(userDataValidationSchema, "body"),
        createAvailabilitySeason)
    .patch(
        upload.none(),
        validate(userDataValidationSchema, "body"),
        validate(userDataParamsValidationSchema, "params"),
        updateAvailabilitySeason)
    .delete(

        validate(userDataParamsValidationSchema, "params"),
        deleteAvailabilitySeason
    );

userDataRouter.route("/states")
    .get(getEnrollmentTypes)
    .post(
        upload.none(),
        // validate(userDataValidationSchema, "body"),
        createState)
    .patch(
        upload.none(),
        validate(userDataValidationSchema, "body"),
        validate(userDataParamsValidationSchema, "params"),
        updateEnrollmentType)
    .delete(
        validate(userDataParamsValidationSchema, "params"),
        deleteEnrollmentType
    );

userDataRouter.route("/fields")
    .get(getFields)
    .post(
        upload.none(),
        // validate(userDataValidationSchema, "body"),
        createField)
    .patch(
        upload.none(),
        validate(userDataValidationSchema, "body"),
        validate(userDataParamsValidationSchema, "params"),
        updateField)
    .delete(
        validate(userDataParamsValidationSchema, "params"),
        deleteField
    );

userDataRouter.route("/grades")
    .get(getGrades)
    .post(
        upload.none(),
        validate(userDataValidationSchema, "body"),
        createGrade)
    .patch(
        upload.none(),
        validate(userDataValidationSchema, "body"),
        validate(userDataParamsValidationSchema, "params"),
        updateGrade)
    .delete(
        validate(userDataParamsValidationSchema, "params"),
        deleteGrade
    );

export default userDataRouter;
