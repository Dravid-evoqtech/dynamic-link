import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
import { APIError } from "./APIError.js";
import cleanRefreshTokenEntries from "./user/cleanRefreshTokenEntries.js";
import { v4 as uuidv4 } from 'uuid';
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (_id, userAgent = "") => {
    const user = await User.findById(_id).select("-password");
    if (!user) throw new APIError(404, "User not found");
    const jti = uuidv4();
    const accessToken = user.generateAccessToken(jti);
    const refreshToken = user.generateRefreshToken(jti);


    const decoded = jwt.decode(refreshToken);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10); // 🔒 encrypt it

    // Push with metadata
    user.refreshTokens.push({
        token: hashedRefreshToken,
        jti,
        userAgent,
        createdAt: new Date(),
        iat: decoded.iat,
        exp: decoded.exp,
    });

    // Clean: remove expired or duplicates
    user.refreshTokens = cleanRefreshTokenEntries(user.refreshTokens, process.env.REFRESH_TOKEN_SECRET, 5);

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

const generateAccessAndRefreshTokenAdmin = async (_id, userAgent = "") => {
    const admin = await Admin.findById(_id).select("-password");
    if (!admin) throw new APIError(404, "Admin not found");
    const jti = uuidv4();
    const accessToken = admin.generateAccessToken(jti);
    const refreshToken = admin.generateRefreshToken(jti);


    const decoded = jwt.decode(refreshToken);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10); // 🔒 encrypt it

    // Push with metadata
    admin.refreshTokens.push({
        token: hashedRefreshToken,
        jti,
        userAgent,
        createdAt: new Date(),
        iat: decoded.iat,
        exp: decoded.exp,
    });

    // Clean: remove expired or duplicates
    admin.refreshTokens = cleanRefreshTokenEntries(admin.refreshTokens, process.env.REFRESH_TOKEN_SECRET, 5);

    await admin.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};



export { generateAccessAndRefreshToken, generateAccessAndRefreshTokenAdmin };