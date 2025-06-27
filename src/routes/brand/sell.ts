/** @format */

import express from "express";
import { SellRequestController } from "../../controller/sell";
import { auth, authorize } from "../../middleware/auth";
import { createUploadMiddleware } from "../../services/multer";

const router = express.Router();
const sellRequestController = new SellRequestController();

const uploadCarImages = createUploadMiddleware("cars").array("images", 5);

router.post("/", uploadCarImages, sellRequestController.create);
router.get("/", auth, authorize("admin"), sellRequestController.getAll);
router.patch(
    "/:id/status",
    auth,
    authorize("admin"),
    sellRequestController.updateStatus
);

export default router;
