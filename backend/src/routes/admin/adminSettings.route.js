import { Router } from "express";
import { verifyAdminJWT } from "../../middlewares/adminAuth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { getCurrentAdmin, updateAdminProfile } from "../../controllers/admin/adminSettings.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = Router();

router.get(
    "/get-current-admin",
    verifyAdminJWT,
    getCurrentAdmin
);

router.patch(
    "/update-profile",
    verifyAdminJWT,
    upload.single("avatarFile"),
   // validate(updateSettingsSchema, "body"),
    updateAdminProfile
);

export default router;