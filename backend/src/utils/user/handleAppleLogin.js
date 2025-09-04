import axios from "axios";
import { User } from "../../models/user.model.js";
import { generateAppleClientSecret } from "../../config/generateAppleClientSecret.js";
import appleSignin from "apple-signin-auth";
import { APIError } from "../APIError.js";
import { USER_STATUS } from "../../constants/index.js";

export const handleAppleLogin = async ({code, timezone, fullName}, fullName2) => {
	let isNewUser = false;
	
		if (!code) {
		throw new APIError(400, "Code is required");
	}

	const clientSecret = generateAppleClientSecret();

	const tokenRes = await axios.post(
		"https://appleid.apple.com/auth/token",
		new URLSearchParams({
			grant_type: "authorization_code",
			code,
			client_id: process.env.APPLE_CLIENT_ID,
			client_secret: clientSecret,
		}).toString(),
		{
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		}
	);

	const { id_token } = tokenRes.data;

	if (!id_token) throw new Error("Invalid Apple ID token");

	// VERIFY token using Apple's public key
	const applePayload = await appleSignin.verifyIdToken(id_token, {
		audience: process.env.APPLE_CLIENT_ID,
		ignoreExpiration: false,
	});

	const { sub: appleId, email } = applePayload;

	let user = await User.findOne({ appleId });

	if (!user) {
		user = new User({
			email: email || null,
			fullName: fullName || fullName2 || "Apple User",
			appleId,
			authProvider: "apple",
			timezone,
		});
		await user.save();
		isNewUser = true;
	}

	if (user.status === USER_STATUS.INACTIVE) {
		throw new APIError(403, "User is Blocked");
	}
	return { user, isNewUser };
};
