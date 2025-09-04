import { Router } from 'express';
import {
  createOpportunity,
  getAllOpportunities,
  getAllSavedOpportunities,
  getCategories,
  getFeaturedOpportunities,
  getOpportunityById,
  unlockOpportunity,
  saveOpportunity,
  unSaveOpportunity,
  addOpportunities,

  bulkUploadOpportunities,
} from '../controllers/opportunity.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { opportunityFilterSchema } from '../validations/opportunityFilter.validation.js';
import { upload } from '../middlewares/multer.middleware.js';
import { idSchema } from '../validations/params.validation.js';

const router = Router();

router
  .route('/get-all-opportunities')
  .post(
    verifyJWT,
    upload.none(),
    validate(opportunityFilterSchema, 'body'),
    getAllOpportunities
  );

router
  .route('/get-opportunity/:id')
  .get(
    verifyJWT,
    upload.none(),
    validate(idSchema, 'params'),
    getOpportunityById
  );
router
  .route('/get-saved-opportunities')
  .post(verifyJWT, upload.none(), getAllSavedOpportunities);
router
  .route('/get-opportunities-by-category')
  .post(verifyJWT, upload.none(), getAllSavedOpportunities);
router
  .route('/save-opportunity')
  .post(verifyJWT, upload.none(), validate(idSchema, 'body'), saveOpportunity);
router
  .route('/unsave-opportunity')
  .post(
    verifyJWT,
    upload.none(),
    validate(idSchema, 'body'),
    unSaveOpportunity
  );

router
  .route('/unlock-opportunity')
  .post(
    verifyJWT,
    upload.none(),
    validate(idSchema, 'body'),
    unlockOpportunity
  );

router.route('/get-featured-opportunities').post(
  verifyJWT,
  upload.none(),
  // validate(opportunityFilterSchema, "body"),
  getFeaturedOpportunities
);

router
  .route('/get-categories')
  .post(
    verifyJWT,
    upload.none(),
    validate(opportunityFilterSchema, 'body'),
    getCategories
  );

//create opportunity
router.route('/create-opportunity').post(
  verifyJWT,
  upload.none(),
  // validate(opportunityFilterSchema, "body"),
  createOpportunity
);
router.route('/add-opportunities').post(
  verifyJWT,
  upload.none(),
  // validate(opportunityFilterSchema, "body"),
  addOpportunities
);

router
  .route('/bulk_upload')
  .post(upload.single('opportunitiesFile'), bulkUploadOpportunities );

export default router;
