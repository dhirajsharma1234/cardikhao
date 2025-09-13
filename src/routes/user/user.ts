/** @format */

import express from "express";
const router = express.Router();
import { AuthController } from "../../controller/user";
import { auth } from "../../middleware/auth";
const authController = new AuthController();

router.route("/register").post(authController.register);
router.route("/login").post(authController.login);
router.route("/me").get(auth, authController.getMe);

router.route("/dashboard").get(auth, authController.getDashboardCount);
router.route("/update").patch(auth, authController.updateProfile);

export default router;
