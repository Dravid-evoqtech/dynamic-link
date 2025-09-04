import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    createApplication,
    getAllApplications,
    getAllApplicationsfilter,
    getApplicationById,
    removeFromSaved,
    saveApplication,
    updateApplicationStatus,
    getActivities,
    getApplicationStats
} from "../controllers/application.controller.js";

const router = Router();

router.route("/")
    .post(
        verifyJWT,
        upload.none(),
        createApplication
    )

router.route("/get-all-applications-with-filter").post(
    verifyJWT,
    upload.none(),
    getAllApplicationsfilter
)
router.route("/get-all-applications").get(
    verifyJWT,
    getAllApplications
)
router.route("/get-stats").get(verifyJWT, getApplicationStats);

router.route("/:id").get(
    verifyJWT,
    getApplicationById
)
router.route("/update/:id").patch(
    verifyJWT,
    upload.none(),
    updateApplicationStatus
)

router.route("/get-activities/:filter")
    .post(verifyJWT, upload.none(), getActivities);

router.route("/:id/save").patch(verifyJWT, upload.none(), saveApplication);

router.route("/:id/remove-from-saved").patch(verifyJWT, upload.none(), removeFromSaved);

export default router;