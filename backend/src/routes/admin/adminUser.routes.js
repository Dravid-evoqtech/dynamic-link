import express from "express";
import {
  activateUser,
  addAdmin,
  bulkDeleteUsers,
  createUser,
  deactivateUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "../../controllers/admin/adminUser.controller.js";
import { verifyAdminJWT } from "../../middlewares/adminAuth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { addAdminSchema, adminCreateUserSchema, adminUpdateUserSchema } from "../../validations/adminValidation.js";

const router = express.Router();

router.use(verifyAdminJWT); // apply middleware to all routes

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.patch('/:id/active', activateUser);
router.patch('/:id/inactive', deactivateUser);

router.post(
  '/create-user', 
  verifyAdminJWT, 
  validate(adminCreateUserSchema, "body"), // Validate request body with admin schema
  createUser
);

router.patch(
  '/update-user/:id', 
  verifyAdminJWT, 
  validate(adminUpdateUserSchema, "body"), // Validate request body with admin schema
  updateUser
);

router.delete(
  '/delete-user/:id',
  verifyAdminJWT, // Ensure admin is authenticated
  deleteUser
);

router.post(
  '/add-admin',
  verifyAdminJWT,
  validate(addAdminSchema, "body"), // Validate the request body
  addAdmin
);

router.delete(
  '/bulk-delete-users',
  verifyAdminJWT,
  bulkDeleteUsers
)


export default router;
