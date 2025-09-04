import express from "express";
import { dailyNotification, getNotificationSettings, removeFcmToken, saveFcmToken, sendApplicationNotification, sendNotificationToUser, sendNotificationToUserDevice, sendToAll, updateNotificationSettings } from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/settings")
    .get(verifyJWT, getNotificationSettings)
    .patch(verifyJWT, updateNotificationSettings);


router.route("/save-token").post(verifyJWT,saveFcmToken);
router.route("/remove-token").delete(verifyJWT,removeFcmToken);

//----------------------for testing purposes-----------------------
router.route("/send").post( sendNotificationToUser);
router.route("/send-to-device").post( sendNotificationToUserDevice);
router.route("/send-daily-notification").post( dailyNotification);

router.route("/send-application-notification").post(verifyJWT, sendApplicationNotification);
router.route("/send-notification-to-all-users").post( sendToAll);

export default router;
