import { OAuth2Client } from "google-auth-library";
import { User } from "../../models/user.model.js";
import { APIError } from "../APIError.js";


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const handleGoogleLogin = async ({ idToken, timezone }) => {
    let isNewUser = false;
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email || !googleId) {
        throw new APIError(400, "Invalid token payload");
    }

    let user = await User.findOne({ googleId });

    if (!user) {
        user = await User.create({
            googleId,
            email,
            fullName: name,
            avatar: { avatarUrl: picture },
            authProvider: "google",
            timezone,
        });
        isNewUser = true;
    }
    if (user.status === "inactive") {
        throw new APIError(403, "User is Blocked");
    }

    return { user, isNewUser };
};
