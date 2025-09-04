import jwt from 'jsonwebtoken';
import { APIError } from '../utils/APIError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import bcrypt from 'bcryptjs';

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');
   

    if (!accessToken) {
      throw new APIError(401, 'Unauthorized request');
    }

    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    if (!decodedToken) {
      throw new APIError(401, 'Invalid Access Token');
    }

    const user = await User.findById(decodedToken._id)
      .populate('programs')
      .populate('interests')
      .populate('goals')
      .populate('grade')
      .populate('availability')
      .populate('savedOpportunities')
      .populate('loginData')
      .select('-password -refreshToken ');

    if (!user) {
      throw new APIError(401, 'Invalid Access Token');
    }

    req.user = user;
    next();
  } catch (error) {
    throw new APIError(401, error?.message || 'Invalid access token');
  }
});
const verifyRefreshToken = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new APIError(401, 'Refresh token missing');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded._id);

    if (!user) {
      throw new APIError(403, 'User not found');
    }

    const { jti } = decoded;
    const tokenExists = user.refreshTokens.find(
      (entry) =>
        entry.jti === jti && bcrypt.compareSync(refreshToken, entry.token)
    );

    // OPTIONAL: Check if refreshToken exists in DB or user.refreshTokens array
    if (!tokenExists) {
      // Potential token reuse detected
      user.refreshTokens = []; // Invalidate all refresh tokens
      await user.save();

      throw new APIError(403, 'Token reuse detected. All sessions cleared.');
    }

    req.user = user;
    req.token = refreshToken;
    next();
  } catch (error) {
    throw new APIError(
      403,
      error?.message || 'Invalid or expired refresh token'
    );
  }
};

export { verifyJWT, verifyRefreshToken };
