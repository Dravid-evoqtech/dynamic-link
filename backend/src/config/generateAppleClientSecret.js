import appleSignin from "apple-signin-auth";

export const generateAppleClientSecret = () => {
	return appleSignin.getClientSecret({
		clientID: process.env.APPLE_CLIENT_ID,
		teamID: process.env.APPLE_TEAM_ID,
		keyIdentifier: process.env.APPLE_KEY_ID,
		privateKey: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
		expAfter: 15777000, // 6 months
	});
};
