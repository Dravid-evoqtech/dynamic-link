import jwt from "jsonwebtoken";
import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../models/admin.model.js";
import bcrypt from "bcryptjs";

const verifyAdminJWT = asyncHandler(async (req, _, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      throw new APIError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    if (!decodedToken) {
      throw new APIError(401, "Invalid Access Token");
    }

    const admin = await Admin.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!admin) {
      throw new APIError(401, "Invalid Access Token");
    }
    
    // ⭐ CHANGE THIS LINE ⭐
    req.admin = admin; // Attach the authenticated admin to req.admin
    next();
  } catch (error) {
    throw new APIError(401, error?.message || "Invalid access token");
  }
});

const verifyAdminRefreshToken = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new APIError(401, 'Refresh token missing');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const admin = await Admin.findById(decoded._id);

    if (!admin) {
      throw new APIError(403, 'Admin not found');
    }

    const { jti } = decoded;
    const tokenExists = admin.refreshTokens.find(
      (entry) =>
        entry.jti === jti && bcrypt.compareSync(refreshToken, entry.token)
    );

    // OPTIONAL: Check if refreshToken exists in DB or user.refreshTokens array
    if (!tokenExists) {
      // Potential token reuse detected
      admin.refreshTokens = []; // Invalidate all refresh tokens
      await admin.save();

      throw new APIError(403, 'Token reuse detected. All sessions cleared.');
    }

    req.admin = admin;
    req.token = refreshToken;
    next();
  } catch (error) {
    throw new APIError(
      403,
      error?.message || 'Invalid or expired refresh token'
    );
  }
};


export { verifyAdminJWT, verifyAdminRefreshToken };
