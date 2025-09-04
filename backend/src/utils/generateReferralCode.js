import { REFERRAL_CODE_LENGTH, REFERRAL_CODE_BASE } from "../constants/index.js";

const generateReferralCode = (name = "") => {
  const basePart = (name.trim().split(" ")[0] || REFERRAL_CODE_BASE).toUpperCase();
  const baseLength = REFERRAL_CODE_LENGTH - 4; // assume 4-digit random suffix
  const base = basePart.slice(0, baseLength).padEnd(baseLength, "X"); // pad if too short
  const random = Math.floor(1000 + Math.random() * 9000).toString(); // always 4 digits
  return base + random;
};

export default generateReferralCode;
