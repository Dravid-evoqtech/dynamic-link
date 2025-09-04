import bcrypt from "bcryptjs";
import { User } from "../../models/user.model.js";
import { USER_STATUS } from "../../constants/index.js";
import { APIError } from "../APIError.js";

export const handleEmailLogin = async (email, password) => {

    if ((!email) || !password) {
        throw new APIError(400, "Email and Password are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new APIError(404,"Invalid credentials");
    }
    if (user.status === USER_STATUS.INACTIVE) {
        throw new APIError(403, "User is Blocked");
    }

    const isCredentialValid = await user.isPasswordCorrect(password);
    if (!isCredentialValid) {
        throw new APIError(401, "Credential Invalid");
    }


    return {user};
};
