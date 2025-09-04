import { Admin } from "../../models/admin.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { APIResponse } from "../../utils/APIResponse.js";
import { APIError } from "../../utils/APIError.js";
import bcrypt from "bcryptjs"; // Make sure to use bcryptjs or bcrypt consistently
import {
  uploadPhotoOnCloudinary,
  deleteImageOnCloudinary,
} from "../../utils/cloudinary.js";


const updateAdminProfile = asyncHandler(async (req, res) => {
  // Get the admin ID from the authenticated user.
  const adminId = req.admin?._id;

  if (!adminId) {
    throw new APIError(401, "Unauthorized access. Admin ID not found in request.");
  }

  const { fullName, email, currentPassword, newPassword } = req.body;
  
  // Handle both disk storage (local) and memory storage (production)
  const avatarFile = req.file?.path || req.file?.buffer;
  console.log("avatarFile-------", avatarFile ? (req.file?.path ? "File path" : "Buffer data") : "No file");
    
  // Validate that at least one field is being updated
  if (
    !fullName &&
    !email &&
    !currentPassword &&
    !newPassword &&
    !avatarFile
  ) {
    throw new APIError(400, "At least one field is required for update.");
  }

  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new APIError(404, "Admin not found");
  }

  // 1. Update fullName if provided
  if (fullName) {
    admin.fullName = fullName.trim();
  }

  // 2. Update email if provided
  if (email && email.trim() !== admin.email) {
    const existingAdmin = await Admin.findOne({ email: email.trim() });
    if (existingAdmin) {
      throw new APIError(409, "Email already exists. Please use a different one.");
    }
    admin.email = email.trim();
  }

  // 3. Handle password change securely
  if (newPassword) {
    if (!currentPassword) {
      throw new APIError(400, "Please provide your current password to set a new one.");
    }
    const isPasswordCorrect = await admin.isPasswordCorrect(currentPassword);
    if (!isPasswordCorrect) {
      throw new APIError(400, "The current password you provided is incorrect.");
    }
    // Assign the new password. The pre-save hook in your model handles the hashing.
    admin.password = newPassword;
  }
  
  // ⭐ 4. Handle avatar upload to Cloudinary ⭐
  if (avatarFile) {
    // Delete the old avatar from Cloudinary if it exists
    if (admin.avatar.avatarPublicId) {
      try {
        await deleteImageOnCloudinary(admin.avatar.avatarPublicId);
      } catch (error) {
        console.error("Failed to delete old avatar from Cloudinary:", error);
        // We will continue the process even if the old image delete fails
      }
    }

    // Upload the new avatar (handles both file path and buffer)
    const cloudinaryResponse = await uploadPhotoOnCloudinary(avatarFile);

    if (!cloudinaryResponse) {
      throw new APIError(500, "Failed to upload avatar to Cloudinary.");
    }
    
    // Update the admin document with the new avatar details
    admin.avatar.avatarUrl = cloudinaryResponse.url;
    admin.avatar.avatarPublicId = cloudinaryResponse.public_id;
  }

  // Save the updated document. This will trigger the pre-save hook for password hashing
  await admin.save({ validateBeforeSave: true });

  // Respond with the updated admin details (excluding sensitive data)
  const updatedAdmin = await Admin.findById(adminId).select("-password -refreshToken -passwordResetToken -passwordResetExpires");

  return res
    .status(200)
    .json(
      new APIResponse(200, updatedAdmin, "Admin profile updated successfully")
    );
});

const getCurrentAdmin = asyncHandler(async (req, res) => {
  return res.status(200).json(new APIResponse(200, req.admin, "Admin found"));
});

export { updateAdminProfile, getCurrentAdmin };
