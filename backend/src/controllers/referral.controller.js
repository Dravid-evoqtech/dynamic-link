import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import Referral from '../models/referral.model.js';
import { TempReferral } from '../models/tempReferral.model.js';
import config from '../config/config.js';
import Joi from 'joi';
import { User } from '../models/user.model.js';

export async function handleReferralClick1(req, res) {
  try {
    const { code } = req.params;
    const ua = req.get('user-agent') || '';
    const ip = req.ip;

    const ref = await Referral.findOne({ code }).exec();
    if (!ref || !ref.isUsable()) {
      return res.status(404).send('Referral invalid or expired.');
    }

    const tempId = uuidv4();
    await TempReferral.create({ tempId, referralCode: code });

    const token = jwt.sign({ tempId }, config.jwtSecret, {
      expiresIn: `${config.tokenTTL}s`,
    });

    const uaLower = ua.toLowerCase();
    if (uaLower.includes('android')) {
      const playUrl = `${config.playStoreUrl}&referrer=${encodeURIComponent(`tempId=${tempId}`)}`;
      return res.redirect(playUrl);
    } else {
      return res.redirect(`/install?token=${encodeURIComponent(token)}`);
    }
  } catch (err) {
    return res.status(500).send('Server error');
  }
}

export async function handleReferralClick(req, res) {
  try {
    const { code } = req.params;

    // Validate referral code format
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).send('Invalid referral code format.');
    }

    const ref = await Referral.findOne({ code: code.trim() }).exec();
    if (!ref || !ref.isUsable()) {
      return res.status(404).send('Referral invalid or expired.');
    }

    // Generate a temporary referral ID
    const tempId = uuidv4();
    await TempReferral.create({ tempId, referralCode: code.trim() });

    // Issue JWT token with expiry
    const token = jwt.sign({ tempId }, config.jwtSecret, {
      expiresIn: `${config.tokenTTL}s`,
    });
    console.log('Referral click token:', token);

    // Log referral click for analytics
    console.log(`Referral click: ${code} -> ${tempId} (IP: ${req.ip}, UA: ${req.get('user-agent')})`);
    
    // Always redirect to install page with token
    return res.redirect(`/install?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('Referral click error:', err);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).send('Invalid referral data.');
    }
    
    return res.status(500).send('Server error');
  }
}

/**
 * Endpoint: GET /api/referral-check/:tokenOrTempId
 * Accepts either:
 *  - a raw tempId (from Android Install Referrer)
 *  - or a signed JWT (from landing page token)
 *
 * Returns: { referralCode: string|null }
 */
export async function checkTempReferral(req, res) {
  try {
    const { tokenOrTempId } = req.params;
    let tempId = null;

    // Try decode JWT first
    try {
      const decoded = jwt.verify(tokenOrTempId, config.jwtSecret);
      tempId = decoded.tempId;
    } catch (e) {
      // Not a valid JWT — assume it's a raw tempId
      tempId = tokenOrTempId;
    }

    if (!tempId) return res.json({ referralCode: null });

    const temp = await TempReferral.findOne({ tempId }).exec();
    if (!temp) return res.json({ referralCode: null });

    // Optionally: delete temp doc to make it one-time
    await TempReferral.deleteOne({ tempId });

    return res.json({ referralCode: temp.referralCode });
  } catch (err) {
    return res.status(500).json({ referralCode: null });
  }
}

/**
 * Admin endpoint (example) to create a referral
 * Minimal validation shown — use auth & Joi in production
 */
export async function createReferral(req, res) {
  const schema = Joi.object({
    ownerUserId: Joi.string().required(),
    maxUses: Joi.number().integer().min(1).default(1),
    expiresInDays: Joi.number().integer().min(1).optional(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const { ownerUserId, maxUses, expiresInDays } = value;
  const code = `R-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const ref = new Referral({
    code,
    ownerUserId,
    maxUses,
  });
  if (expiresInDays)
    ref.expiresAt = new Date(Date.now() + expiresInDays * 24 * 3600 * 1000);
  await ref.save();

  const user = await User.findByIdAndUpdate(
    ownerUserId,
    {
      $push: { referralCodes: ref },
    },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'user not found' });

  return res.json({
    link: `${config.domain}/referral/${code}`,
    message: 'Referral link created',
  });
}

/**
 * Endpoint to mark referral as used (should be called when signup completes)
 * - Accepts JWT token from deep link
 * - increments `uses` on Referral
 */
export async function consumeReferral(req, res) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token required' });

    // Decode JWT token to get tempId
    let tempId;
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      tempId = decoded.tempId;
    } catch (e) {
      return res.status(400).json({ error: 'invalid or expired token' });
    }

    // Find temp referral record
    const tempRef = await TempReferral.findOne({ tempId }).exec();
    if (!tempRef) {
      return res.status(404).json({ error: 'referral session not found or expired' });
    }

    // Find the actual referral
    const ref = await Referral.findOne({ code: tempRef.referralCode }).exec();
    if (!ref) return res.status(404).json({ error: 'referral not found' });

    if (!ref.isUsable()) {
      return res.status(400).json({ error: 'referral not usable' });
    }

    // Increment uses and save
    ref.uses = (ref.uses || 0) + 1;
    await ref.save();

    // Clean up temp referral (one-time use)
    await TempReferral.deleteOne({ tempId });

    // Get referrer user info for response
    const referrerUser = await User.findById(ref.ownerUserId).select('fullName email').exec();

    return res.json({ 
      success: true,
      message: 'Referral consumed successfully',
      data: {
        referralCode: ref.code,
        referrerId: ref.ownerUserId,
        referrerName: referrerUser?.fullName || 'Unknown',
        pointsAwarded: 100, // You can make this configurable
        uses: ref.uses,
        maxUses: ref.maxUses
      }
    });
  } catch (err) {
    console.error('Consume referral error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
