import { User } from "../../models/user.model.js";
import { APIError } from "../APIError.js";
import { deleteImageOnCloudinary, uploadPhotoOnCloudinary } from "../cloudinary.js";

const updateUserProfileAvatar = async (userId, avatarFile) => {

    if (!avatarFile) {
        throw new APIError(400, "File is required");
        
    }

    // Upload new avatar to Cloudinary
    const avatarImg = await uploadPhotoOnCloudinary(avatarFile);
    if (!avatarImg) {
        throw new APIError(500, "Error occurred while uploading file");

    }

    // Delete previous avatar from Cloudinary (if it's not the default)
    const user = await User.findById(userId)
    
    if (user?.avatar?.avatarPublicId) {
        await deleteImageOnCloudinary(user.avatar.avatarPublicId);
    }
    // Update user with new avatar info
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                avatar: {
                    avatarUrl: avatarImg.url,
                    avatarPublicId: avatarImg.public_id,
                },
            },
        },
        { new: true }
    ).select("-password  -refreshTokens");

    if (!updatedUser) {
        throw new APIError(500, "Error while updating the database");
      
    }

    return updatedUser;
};
const changeUserPassword = async (userId, oldPassword, newPassword) => {

    if (!oldPassword || !newPassword) {
        throw new APIError(400, "All Fields Required");
    }

    const user = await User.findById(userId);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new APIError(401, "Old Password is not Correct");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return true;
};

export { updateUserProfileAvatar, changeUserPassword };