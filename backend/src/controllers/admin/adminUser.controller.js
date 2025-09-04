import mongoose from 'mongoose';
import { query, validationResult } from 'express-validator'; // Assuming you have express-validator installed
import { User } from '../../models/user.model.js';
import { Admin } from '../../models/admin.model.js';
import { APIResponse } from '../../utils/APIResponse.js';
import { APIError } from '../../utils/APIError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import bcrypt from 'bcryptjs';
import { DEFAULT_AVATAR_URL } from '../../constants/index.js';
import { deleteImageOnCloudinary } from '../../utils/cloudinary.js';
import { USER_ROLES } from '../../constants/index.js';

// Common function for setting user status
const setUserStatus = async (req, res, newStatus) => {
  // 1. Input Validation for ID
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new APIError(400, 'Invalid User ID format.');
    // return res.status(400).json({ message: 'Invalid User ID format.' });
  }

  // console.log("Setting user status to:", newStatus);

  // 2. Validate newStatus (optional but good for robustness if passed dynamically)
  const allowedStatuses = ['active', 'inactive'];
  if (!allowedStatuses.includes(newStatus)) {
    throw new APIError(
      400,
      "Invalid status value provided. Must be 'active' or 'inactive'."
    );
    // return res.status(400).json({ message: "Invalid status value provided. Must be 'active' or 'inactive'." });
  }

  try {
    // 3. Database Operation
    // Find the user by ID and update their status
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: newStatus }, // Update the 'status' field
      { new: true } // Returns the document after update
    ).select('-password -refreshToken'); // Exclude sensitive info

    // console.log(user);

    // 4. Handle User Not Found
    if (!user) {
      throw new APIError(404, 'User not found.');
      // return res.status(404).json({ message: "User not found." });
    }

    // 5. Send Successful Response
    // res.json({ message: `User status set to '${newStatus}' successfully.`, user });
    res
      .status(200)
      .json(
        new APIResponse(
          200,
          user,
          `User status set to '${newStatus}' successfully.`
        )
      );
  } catch (error) {
    // 6. Error Handling
    // console.error(`Error setting user status to '${newStatus}':`, error);
    // res.status(500).json({
    //   message: `An error occurred while trying to set the user's status.`,
    // });
    throw new APIError(
      500,
      "An error occurred while trying to set the user's status."
    );
  }
};

const getAllUsers = async (req, res) => {
  // 1. Input Validation and Sanitization (Basic Example)
  // For production, consider a dedicated validation library like Joi or Express-Validator
  await query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .run(req);
  await query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .run(req);
  await query('search').optional().trim().escape().run(req); // Trim whitespace and escape HTML entities
  await query('grade').optional().trim().escape().run(req);
  await query('interest').optional().trim().escape().run(req);
  await query('sort')
    .optional()
    .matches(/^(email|fullName|grade|createdAt):(asc|desc)$/)
    .withMessage(
      'Sort parameter invalid. Use format field:order (e.g., email:asc or fullName:desc)'
    )
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new APIError(400, 'Validation Failed', errors.array());
    // return res.status(400).json({ errors: errors.array() });
  }

  // Destructure and set default values for pagination and search
  const { search, grade, interest, page = 1, limit = 10, sort } = req.query;

  // Ensure page and limit are numbers
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

  const filter = {};
  let sortOptions = { createdAt: -1 }; // Default sort by newest first

  // 2. Build Filter Object
  if (search) {
    // Using $or for searching across multiple fields with case-insensitive RegExp
    filter.$or = [
      { email: new RegExp(search, 'i') },
      { fullName: new RegExp(search, 'i') },
    ];
  }
  if (grade) {
    filter.grade = grade; // Exact match for grade
  }
  if (interest) {
    // Assuming 'interests' is an array field in your User schema
    filter.interests = interest; // Matches if the interest is present in the array
  }

  // 3. Apply Sorting Options
  if (sort) {
    const [field, order] = sort.split(':');
    sortOptions = { [field]: order === 'asc' ? 1 : -1 };
  }

  try {
    // Calculate skip for pagination
    const skip = (parsedPage - 1) * parsedLimit;

    // Execute the database query
    const users = await User.find(filter)
      .sort(sortOptions) // Apply sorting
      .skip(skip) // Apply pagination skip
      .limit(parsedLimit) // Apply pagination limit
      .select('-password -refreshToken') // Exclude sensitive fields
      .lean(); // <-- forces plain JSON, no schema transform

    // Get total count for pagination metadata
    const totalUsers = await User.countDocuments(filter);

    // 4. Send Response with Pagination Metadata
    res.status(200).json(
      new APIResponse(
        200,
        {
          users,
          currentPage: parsedPage,
          totalPages: Math.ceil(totalUsers / parsedLimit),
          totalUsers,
          limit: parsedLimit,
        },
        'Users fetched successfully.'
      )
    );
    // res.json({
    //   users,
    //   currentPage: parsedPage,
    //   totalPages: Math.ceil(totalUsers / parsedLimit),
    //   totalUsers,
    //   limit: parsedLimit // Include the limit used
    // });
  } catch (error) {
    // 5. Error Handling
    throw new APIError(500, 'An error occurred while fetching users.');
    // console.error('Error fetching users:', error);
    // res.status(500).json({
    //   message: 'An error occurred while fetching users.',
    //   error: error.message, // In production, avoid sending full error.message to client
    // });
  }
};

const getUserById = async (req, res) => {
  // 1. Input Validation for ID
  // Check if the provided ID is a valid MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new APIError(400, 'Invalid User ID format.');
    // return res.status(400).json({ message: 'Invalid User ID format.' });
  }

  try {
    // 2. Database Query
    // Find user by ID and exclude sensitive fields
    const user = await User.findById(req.params.id).select(
      '-password -refreshToken'
    );

    // 3. Handle User Not Found
    if (!user) {
      throw new APIError(404, 'User not found.');
      // return res.status(404).json({ message: 'User not found.' });
    }

    // 4. Send Successful Response
    res.json(user);
  } catch (error) {
    // 5. Error Handling
    throw new APIError(500, 'An error occurred while fetching the user.');
    // console.error('Error fetching user by ID:', error); // Log the detailed error for debugging
    // res.status(500).json({
    //   message: 'An error occurred while fetching the user.',
    //   // In production, avoid sending 'error.message' directly to the client for security
    //   // For development, it can be helpful: error: error.message
    // });
  }
};

const activateUser = async (req, res) => {
  await setUserStatus(req, res, 'active');
};

const deactivateUser = async (req, res) => {
  await setUserStatus(req, res, 'inactive');
};

const createUser = asyncHandler(async (req, res) => {
  // 1. Input Validation is handled by the 'validate' middleware using adminCreateUserSchema.
  //    req.body is already validated and clean here.
  let {
    email,
    password, // Required for admin creation
    fullName,
  } = req.body;

  // 2. Check if User Already Exists (by email )
  try {
    const userExist = await User.findOne({ email });

    if (userExist) {
      if (userExist.email === email) {
        throw new APIError(409, 'User with this email already exists.');
      }
    }
  } catch (dbError) {
    // console.error("Database error checking for existing user:", dbError);

    throw new APIError(500, dbError);
  }

  // 3. Password Hashing
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 5. Create New User
  let createdUser;
  try {
    createdUser = await User.create({
      password: hashedPassword, // Store the hashed password
      email,
      fullName,
    });
  } catch (dbError) {
    throw new APIError(
      500,
      'Something went wrong while creating the user record.'
    );
  }

  // 6. Verify User Creation & Prepare Response
  const userData = await User.findById(createdUser._id).select(
    '-password -refreshToken -__v' // Exclude sensitive/unnecessary fields
  );

  if (!userData) {
    throw new APIError(
      500,
      'User created by admin but could not retrieve user data.'
    );
  }

  // 7. Send Back Data to Frontend
  res
    .status(201)
    .json(
      new APIResponse(201, userData, 'User created successfully by admin.')
    );
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, points, status } = req.body;

  console.log('fieldsToUpdate', req.body);

  // 1. Validate User ID Format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, 'Invalid User ID format.');
  }

  if (!fullName && !points && !status) {
    throw new APIError(400, 'No fields to update.');
  }

  // 5. Perform Database Update
  let updatedUser;
  try {
    // Mongoose will automatically handle updating only provided fields
    updatedUser = await User.findById(id).select(
      '-password -refreshToken -__v'
    ); // Exclude sensitive fields


    if (!updatedUser) {
      throw new APIError(404, 'User not found after update attempt.'); // Should be caught by earlier findById, but good fallback
    }

    if (fullName) updatedUser.fullName = fullName;

    if (points) updatedUser.points.total = points;

    if (status) updatedUser.status = status;

    const updatedUserData = await updatedUser.save();

    if (!updatedUserData) {
      throw new APIError(500, 'Error while Updating User Data');
    }

    delete updatedUserData.password;

    updatedUser = updatedUserData;

  } catch (dbError) {
    // Handle specific Mongoose validation errors or other database issues
    if (dbError.name === 'ValidationError') {
      const errors = Object.values(dbError.errors).map((err) => err.message);
      throw new APIError(400, 'Validation failed during update.', errors);
    }
    console.error('Database error updating user:', dbError);
    throw new APIError(500, 'An error occurred while updating the user.');
  }

  // 6. Send Success Response
  res
    .status(200)
    .json(new APIResponse(200, updatedUser, 'User updated successfully.'));
});
// const updateUser = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const updateFields = req.body; // Joi middleware ensures this is validated and clean
//   const fieldsToUpdate = { ...updateFields };
//   console.log('fieldsToUpdate', fieldsToUpdate);

//   // 1. Validate User ID Format
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     throw new APIError(400, 'Invalid User ID format.');
//   }

//   // 2. Prevent Update of Restricted Fields (handled by Joi schema, but good to double-check server-side)
//   // Joi schema `forbidden()` should prevent these. This is an extra layer of safety.
//   const restrictedFields = ['password', 'refreshToken'];
//   for (const field of restrictedFields) {
//     if (updateFields[field] !== undefined) {
//       throw new APIError(400, `Cannot update '${field}' via this endpoint.`);
//     }
//   }

//   // 4. Check for Duplicate Emai if they are being updated
//   if (fieldsToUpdate.email) {
//     const existingUserWithEmail = await User.findOne(
//       { email: fieldsToUpdate.email, _id: { $ne: id } } // Not the current user
//     );

//     if (existingUserWithEmail) {
//       if (existingUserWithEmail.email === fieldsToUpdate.email) {
//         throw new APIError(409, 'Another user with this email already exists.');
//       }
//     }
//   }

//   // 5. Perform Database Update
//   let updatedUser;
//   try {
//     // Mongoose will automatically handle updating only provided fields
//     updatedUser = await User.findByIdAndUpdate(
//       id,
//       { $set: fieldsToUpdate }, // Use $set to update only specified fields
//       { new: true, runValidators: true } // Return the updated doc, run schema validators on update
//     ).select('-password -refreshToken -__v'); // Exclude sensitive fields

//     if (!updatedUser) {
//       throw new APIError(404, 'User not found after update attempt.'); // Should be caught by earlier findById, but good fallback
//     }
//   } catch (dbError) {
//     // Handle specific Mongoose validation errors or other database issues
//     if (dbError.name === 'ValidationError') {
//       const errors = Object.values(dbError.errors).map((err) => err.message);
//       throw new APIError(400, 'Validation failed during update.', errors);
//     }
//     console.error('Database error updating user:', dbError);
//     throw new APIError(500, 'An error occurred while updating the user.');
//   }

//   // 6. Send Success Response
//   res
//     .status(200)
//     .json(new APIResponse(200, updatedUser, 'User updated successfully.'));
// });

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Validate User ID Format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, 'Invalid User ID format.');
  }

  // 2. Prevent Self-Deletion (Optional but recommended)
  // If you store the admin's user ID in req.user after verifyJWT, you can prevent them from deleting themselves.
  // Example: if (req.user && req.user._id.toString() === id) {
  //   throw new APIError(403, "Admins cannot delete their own account via this endpoint.");
  // }

  // 3. Find User and Delete Associated Data (e.g., Cloudinary avatar)
  let user;
  try {
    // Find the user first to get avatar public_id for deletion
    user = await User.findById(id).select('avatar.avatarPublicId');

    if (!user) {
      throw new APIError(404, 'User not found.');
    }

    // Delete user's avatar from Cloudinary if it exists and is not the default
    const avatarPublicId = user.avatar?.avatarPublicId;
    if (
      avatarPublicId &&
      avatarPublicId !== null &&
      avatarPublicId !== DEFAULT_AVATAR_URL
    ) {
      try {
        // *** USING YOUR PROVIDED FUNCTION HERE ***
        const cloudinaryDeleteResult =
          await deleteImageOnCloudinary(avatarPublicId);
        if (cloudinaryDeleteResult === false) {
          // Log a warning if your function indicated failure
          console.warn(
            `CLOUDINARY :: User avatar deletion failed for publicId: ${avatarPublicId}`
          );
        }
      } catch (cloudinaryError) {
        // This catch block handles unexpected errors *from* deleteImageOnCloudinary if it throws,
        // although your provided function already has a try-catch and returns false.
        console.error(
          `CLOUDINARY :: Unexpected error during avatar deletion for publicId ${avatarPublicId}:`,
          cloudinaryError
        );
        console.warn(
          'Proceeding with user deletion despite avatar cleanup failure.'
        );
      }
    }

    // 4. Delete the User Document from Database
    const deleteResult = await User.deleteOne({ _id: id }); // More efficient than findByIdAndDelete if you've already found the user

    if (deleteResult.deletedCount === 0) {
      // This case might occur if user was found but then deleted by another process
      throw new APIError(404, 'User not found or already deleted.');
    }
  } catch (dbError) {
    if (dbError instanceof APIError) {
      // Re-throw custom APIError
      throw dbError;
    }
    console.error('Database error deleting user:', dbError);
    throw new APIError(500, 'An error occurred while deleting the user.');
  }

  // 5. Send Success Response
  res
    .status(200)
    .json(
      new APIResponse(200, null, `User with ID: ${id} deleted successfully.`)
    );
});

const addAdmin = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  //const createdBy = req.user._id; // Assuming req.user is populated by verifyJWT middleware

  // console.log(`Admin ${createdBy} attempting to add new admin: ${email}`);

  // 1. Check if user with this email already exists
  const existingUser = await Admin.findOne({ email });
  if (existingUser) {
    throw new APIError(409, 'User with this email already exists.');
    // return res
    //      .status(409)
    //      .json(new APIResponse(409, [], "User with this email already exists."));
  }

  // 2. Create the new user with 'admin' role
  const newAdmin = await Admin.create({
    fullName,
    email,
    password, // Mongoose pre-save hook should handle hashing
    role: USER_ROLES.ADMIN, // ⭐ CRITICAL: Explicitly set role to ADMIN
    // You might want to add other default fields like avatar, etc.
  });

  if (!newAdmin) {
    throw new APIError(500, 'Failed to create new admin user.');
  }

  // Remove sensitive data before sending response
  const adminResponse = newAdmin.toObject();
  delete adminResponse.password;
  delete adminResponse.refreshToken;
  delete adminResponse.__v;

  // 3. Log the activity (optional but highly recommended for auditing)
  // await Activity.create({
  //   action: 'admin_created',
  //   entityType: 'User',
  //   entityId: newAdmin._id,
  //   performedBy: createdBy,
  //   description: `New admin user "${newAdmin.email}" added by admin "${req.user.email}".`,
  //   metadata: {
  //       newAdminEmail: newAdmin.email,
  //       adminCreatorId: createdBy
  //   }
  // });

  return res
    .status(201)
    .json(
      new APIResponse(201, adminResponse, 'New admin user added successfully.')
    );
});

const bulkDeleteUsers = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const adminId = req.admin._id;

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new APIError(400, 'Invalid or empty array of IDs provided.');
  }

  // Optional: Prevent an admin from deleting their own account
  if (ids.includes(adminId.toString())) {
    throw new APIError(
      403,
      'Admins cannot delete their own account via bulk deletion.'
    );
  }

  try {
    // 1. Find the users to get their Cloudinary public IDs
    const usersToDelete = await User.find({ _id: { $in: ids } }).select(
      'avatar.avatarPublicId'
    );

    if (usersToDelete.length === 0) {
      throw new APIError(404, 'No users found with the provided IDs.');
    }

    // 2. Delete all non-default avatars from Cloudinary concurrently
    const deletionPromises = usersToDelete.map((user) => {
      const avatarPublicId = user.avatar?.avatarPublicId;
      if (
        avatarPublicId &&
        avatarPublicId !== null &&
        avatarPublicId !== DEFAULT_AVATAR_URL
      ) {
        return deleteImageOnCloudinary(avatarPublicId).catch((cloudinaryError) => {
          console.error(
            `CLOUDINARY :: Failed to delete avatar for user ${user._id}:`,
            cloudinaryError
          );
          // Don't re-throw, allow other deletions and user deletion to proceed
        });
      }
      return Promise.resolve(); // Return a resolved promise for users without an avatar to delete
    });

    await Promise.all(deletionPromises);

    // 3. Delete the user documents from the database
    const deleteResult = await User.deleteMany({ _id: { $in: ids } });

    // 4. Log the activity for auditing purposes
    // await Activity.create({
    //   action: 'user_bulk_deleted',
    //   entityType: 'User',
    //   performedBy: adminId,
    //   description: `Bulk deletion of ${deleteResult.deletedCount} users.`,
    //   metadata: {
    //     deletedIds: ids,
    //     deletedCount: deleteResult.deletedCount,
    //   },
    // });

    // 5. Send a success response with the number of deleted items
    res.status(200).json(
      new APIResponse(
        200,
        { deletedCount: deleteResult.deletedCount },
        `${deleteResult.deletedCount} users deleted successfully.`
      )
    );
  } catch (dbError) {
    if (dbError instanceof APIError) {
      throw dbError;
    }
    console.error('Database error during bulk user delete:', dbError);
    throw new APIError(
      500,
      'An error occurred while performing the bulk user delete.'
    );
  }
});

export {
  getAllUsers,
  getUserById,
  activateUser,
  deactivateUser,
  createUser,
  updateUser,
  deleteUser,
  addAdmin,
  bulkDeleteUsers,
};
