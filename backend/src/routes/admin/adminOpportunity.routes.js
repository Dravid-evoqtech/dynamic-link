import { Router } from "express";
import {
  bulkDeleteOpportunities,
  bulkUploadOpportunities,
  closeOpportunity,
  createEnrollmentType,
  createOpportunity,
  createOpportunityDomain,
  createOpportunityProgramType,
  deleteEnrollmentType,
  deleteOpportunity,
  deleteOpportunityDomain,
  deleteOpportunityProgramType,
  getAllEnrollmentTypes,
  getAllfields,
  getAllgrades,
  getAllOpportunities,
  getAllOpportunityDomains,
  getAllOpportunityProgramTypes,
  getEnrollmentTypeById,
  getOpportunityById,
  getOpportunityDomainById,
  getOpportunityProgramTypeById,
  openOpportunity,
  updateEnrollmentType,
  updateOpportunity,
  updateOpportunityDomain,
  updateOpportunityProgramType
} from "../../controllers/admin/adminOpportunity.controller.js";
import { verifyAdminJWT } from "../../middlewares/adminAuth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  idSchema,
  createOpportunityDomainSchema,
  createOpportunityProgramTypeSchema,
  createOpportunitySchema,
  getOpportunitiesSchema,
  getOpportunityByIdSchema, // Still there for reference, but idSchema is used
  getOpportunityDomainsSchema,
  getOpportunityProgramTypesSchema,
  updateOpportunityDomainSchema,
  updateOpportunityProgramTypeSchema,
  updateOpportunitySchema,
  updateEnrollmentTypeSchema,
  getEnrollmentTypesSchema,
  createEnrollmentTypeSchema
} from "../../validations/adminOpportunityValidation.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { lowerCaseBodyKeys } from "../../middlewares/lowerCaseKeys.middleware.js";


const router = Router();

router.get(
  '/',
  verifyAdminJWT,
  validate(getOpportunitiesSchema, "query"),
  getAllOpportunities
);

router.get(
  '/get-all-fields',
  verifyAdminJWT,
  getAllfields
)

router.get(
  '/get-all-grades',
  verifyAdminJWT,
  getAllgrades
)

// --- START: MORE SPECIFIC ROUTES FIRST ---

// --- OpportunityDomain Routes ---
router.route("/opportunity-domains")
  .post(
    verifyAdminJWT,
    validate(createOpportunityDomainSchema, "body"),
    createOpportunityDomain
  )
  .get(
    verifyAdminJWT,
    validate(getOpportunityDomainsSchema, "query"),
    getAllOpportunityDomains
  );

router.route("/opportunity-domains/:id")
  .get(
    verifyAdminJWT,
    validate(idSchema, "params"),
    getOpportunityDomainById
  )
  .patch(
    verifyAdminJWT,
    validate(idSchema, "params"),
    validate(updateOpportunityDomainSchema, "body"),
    updateOpportunityDomain
  )
  .delete(
    verifyAdminJWT,
    validate(idSchema, "params"),
    deleteOpportunityDomain
  );

// --- OpportunityProgramType Routes ---
router.route("/opportunity-program-types")
  .post(
    verifyAdminJWT,
    validate(createOpportunityProgramTypeSchema, "body"),
    createOpportunityProgramType
  )
  .get(
    verifyAdminJWT,
    validate(getOpportunityProgramTypesSchema, "query"),
    getAllOpportunityProgramTypes
  );

router.route("/opportunity-program-types/:id")
  .get(
    verifyAdminJWT,
    validate(idSchema, "params"),
    getOpportunityProgramTypeById
  )
  .patch(
    verifyAdminJWT,
    validate(idSchema, "params"),
    validate(updateOpportunityProgramTypeSchema, "body"),
    updateOpportunityProgramType
  )
  .delete(
    verifyAdminJWT,
    validate(idSchema, "params"),
    deleteOpportunityProgramType
  );

  // Routes for listing all and creating enrollment types
router.route("/enrollment-types")
    .post(
      verifyAdminJWT,
      validate(createEnrollmentTypeSchema, "body"), 
      createEnrollmentType
    )
    .get(
      verifyAdminJWT,
      validate(getEnrollmentTypesSchema, "query"),
      getAllEnrollmentTypes
    );

// Routes for getting, updating, and deleting a specific enrollment type by ID
router.route("/enrollment-types/:id")
    .get(
      verifyAdminJWT,
      validate(idSchema, "params"), 
      getEnrollmentTypeById
    )
    .patch(
      verifyAdminJWT,
      validate(idSchema, "params"), 
      validate(updateEnrollmentTypeSchema, "body"), 
      updateEnrollmentType
    )
    .delete(
      verifyAdminJWT,
      validate(idSchema, "params"), 
      deleteEnrollmentType
    );

// --- END: MORE SPECIFIC ROUTES ---
// ---------------------------------------------------------------------
// --- START: GENERAL OPPORTUNITY ROUTES (with :id param) ---



router.get(
  '/:id',
  verifyAdminJWT,
  validate(idSchema, "params"), 
  getOpportunityById
);

router.post(
  '/create-opportunity', 
  verifyAdminJWT,
  upload.fields([{ name: "coverImage", maxCount: 1 }]),
  lowerCaseBodyKeys,
  validate(createOpportunitySchema, "body"),
  createOpportunity
);

router.patch(
  '/:id/update-opportunity',
  verifyAdminJWT,
  validate(idSchema, "params"),
  upload.fields([{ name: "coverImage", maxCount: 1 }]),
//  validate(updateOpportunitySchema, "body"),
  updateOpportunity
);

router.delete(
  '/:id/delete-opportunity',
  verifyAdminJWT,
  validate(idSchema, "params"),
  deleteOpportunity
);

router.patch(
  '/:id/open',
  verifyAdminJWT,
  validate(idSchema, "params"),
  openOpportunity
);

router.patch(
  '/:id/close',
  verifyAdminJWT,
  validate(idSchema, "params"),
  closeOpportunity
);

// router.post(
//   '/bulk-upload',
//   verifyAdminJWT, 
//   upload.single('csvFile'), // Multer middleware to handle single CSV file named 'csvFile'
//   bulkUploadOpportunities
// );

router.post(
    "/bulk-upload",
    verifyAdminJWT,
    upload.single('jsonFile'), // ⭐ THIS IS THE KEY PART ⭐
    bulkUploadOpportunities
);

router.delete(
  "/bulk-delete-opportunities",
  verifyAdminJWT,
  bulkDeleteOpportunities
)


// router.get(
//   '/get-all-programs',
//   verifyAdminJWT,
//   getAllPrograms
// )

export default router;