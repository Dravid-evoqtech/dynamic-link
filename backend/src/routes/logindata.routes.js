import express from "express";
import { addOneDay, getLogindata, updateLoginDataforUser } from "../controllers/logindata.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/")
    .get(verifyJWT,getLogindata)
    .patch(
        verifyJWT,
        upload.none(),
        updateLoginDataforUser
    )

    router.route("/add-days")
    .post(
        verifyJWT,
        upload.none(),
        addOneDay
    )

export default router;