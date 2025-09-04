import express from 'express';
import {
  handleReferralClick,
  checkTempReferral,
  createReferral,
  consumeReferral,
} from '../controllers/referral.controller.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});
const referralClickLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500,
});

router.get('/:code', handleReferralClick);
router.get('/referral-check/:tokenOrTempId', checkTempReferral);
router.get("/install", (req, res) => {
  const { token } = req.query;
  res.render("install", {
    appStoreUrl: process.env.APP_STORE_URL,
    playStoreUrl: process.env.PLAY_STORE_URL,
    token,
  });
});

// Admin (protect in production)
router.post('/admin/create-referral', createReferral);
router.post('/consume', consumeReferral);

// Play Store redirect (Android)
router.get('/play-redirect', (req, res) => {
  const token = req.query.token || '';

  // Pass token as referrer param (so Android app can read it later)
  const playUrl = `${process.env.PLAY_STORE_URL}&referrer=${encodeURIComponent(`token=${token}`)}`;

  return res.redirect(playUrl);
});

// iOS redirect
router.get('/ios-redirect', (req, res) => {
  const token = req.query.token || '';

  // iOS App Store does not support referrer query params
  // Just redirect to the store URL
  return res.redirect(process.env.APP_STORE_URL);
});


// // Play Store redirect
// router.get('/play-redirect', (req, res) => {
//   const token = req.query.token || '';
//   res.redirect(`${process.env.PLAY_STORE_URL}`);
// });

// // iOS redirect
// router.get('/ios-redirect', (req, res) => {
//   const token = req.query.token || '';

//   res.redirect(`${process.env.APP_STORE_URL}`);
// });

export default router;
