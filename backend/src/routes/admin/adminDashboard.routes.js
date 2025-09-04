
import { Router } from 'express';
import { getDashboardSummary } from '../../controllers/admin/adminDashboard.controller.js';
import { verifyAdminJWT } from "../../middlewares/adminAuth.middleware.js";
import { validate } from "../../middlewares/validate.js";

const router = Router();

// Route for getting the dashboard summary
router.route('/summary').get(
    verifyAdminJWT,
    getDashboardSummary
);

export default router;