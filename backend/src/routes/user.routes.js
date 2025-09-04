import { Router } from "express";
import {
  registerUser,
  refreshAccessToken,
  changePassword,
  updateUserProfile,
  getCurrentUser,
  updateUserAvatar,
  saveUserProfileData,
  updatePrograms,
  updateAvailability,
  updateLocation,
  updateInterests,
  getStatistics,
  unifiedLogin,
  logoutCurrentDevice,
  logoutAllDevices,
  deleteUser,
  requestPasswordReset,
  resetPassword,
  verifyOTP,
  updateAllUsers
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, verifyRefreshToken } from "../middlewares/auth.middleware.js";
import {
  changePasswordSchema,
  loginSchema,
  registerUserSchema,
  saveProfileSchema,
  updateProfileSchema,
} from "../validations/auth.validation.js";
import { validate } from "../middlewares/validate.js";
import {
  availabilityValidationSchema,
  interestsValidationSchema,
  locationValidationSchema,
  programValidationSchema
} from "../validations/userData.validation.js";
import {  loginRateLimiter, refreshTokenRateLimiter, registerRateLimiter } from "../middlewares/rateLimitor.middleware.js";

const router = Router();

router.route("/register").post(
  registerRateLimiter,
  upload.none(),
  // validate(registerUserSchema, "body"),
  registerUser
);

router.route("/login")
  .post(
    // loginRateLimiter,
    upload.none(),
    // validate(loginSchema, "body"),
    unifiedLogin
  );
router.route("/delete-user")
  .delete(
    verifyJWT,
    deleteUser
  );

router.route("/request-password-reset")
  .post(
    upload.none(),
    requestPasswordReset
  );
router.route("/verify-otp")
  .post(
    upload.none(),
    verifyOTP
  )

router.route("/reset-password")
  .post(
    upload.none(),
    // validate(resetPasswordSchema, "body"),
    resetPassword
  );

//secured routes
router.route("/logout").post(verifyJWT, logoutCurrentDevice);

router.route("/logout-from-all").post(verifyJWT, logoutAllDevices);

router.route("/refresh-token")
  .post(
    // refreshTokenRateLimiter,
    verifyRefreshToken,
    refreshAccessToken
  );

router.route("/save-profile-data")
  .post(
    upload.none(),
    validate(saveProfileSchema, "body"),
    saveUserProfileData
  );

//get 
router.route("/get-current-user").get(verifyJWT, getCurrentUser);

router.route("/get-statistics").get(verifyJWT, getStatistics);


router.route("/change-password")
  .patch(
    verifyJWT,
    validate(changePasswordSchema, "body"),
    changePassword
  );

router.route("/update-all")
  .patch(
    updateAllUsers
  );
router.route("/update-profile")
  .patch(
    verifyJWT,
    upload.single("avatarFile"),
    validate(updateProfileSchema, "body"),
    updateUserProfile
  );

router.route("/profile-picture")
  .patch(
    verifyJWT,
    upload.single("avatarFile"),
    updateUserAvatar
  );

router.route("/update-programs")
  .patch(
    verifyJWT,
    upload.none(),
    validate(programValidationSchema, "body"),
    updatePrograms)

router.route("/update-availability").patch(
  verifyJWT,
  upload.none(),
  validate(availabilityValidationSchema, "body"),
  updateAvailability
)

router.route("/update-location").patch(
  verifyJWT,
  upload.none(),
  validate(locationValidationSchema, "body"),
  updateLocation
)

router.route("/update-interests").patch(
  verifyJWT,
  upload.none(),
  validate(interestsValidationSchema, "body"),
  updateInterests
)

export default router;
