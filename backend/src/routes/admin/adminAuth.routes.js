import { Router } from "express";
import {
  forgotPassword,
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  registerAdmin,
  resetPassword,
} from "../../controllers/admin/adminAuth.controller.js";

import { verifyAdminJWT, verifyAdminRefreshToken } from "../../middlewares/adminAuth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { forgotPasswordRequestSchema, resetPasswordSchema, tokenSchema } from "../../validations/adminAuthValidation.js";
import { validate } from "../../middlewares/validate.js";
import { refreshTokenRateLimiter } from "../../middlewares/rateLimitor.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  registerAdmin
);
router.route("/login").post(loginAdmin);
//secured routes
router.route("/logout").post(verifyAdminJWT, logoutAdmin);

router.post(
  '/forgot-password',
  //validate(forgotPasswordRequestSchema, "body"), // Validate email in body
  forgotPassword
);

router.patch(
  '/reset-password/:token',
  validate(resetPasswordSchema, "body"), // Validate new password in body
  validate(tokenSchema, "params"), // Validate token from params (though it's a hex string, not ObjectId, so maybe rename idSchema to tokenSchema if needed)
                                // OR create a specific token validation schema if token isn't always 24-char hex
  resetPassword
);

router.route("/refresh-token")
  .post(
    // refreshTokenRateLimiter,
    verifyAdminRefreshToken,
    refreshAccessToken
  );

export default router;
