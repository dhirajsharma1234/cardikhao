/** @format */

import express from "express";
import { createUploadMiddleware } from "../../services/multer";
import { auth, authorize } from "../../middleware/auth";
import { BrandController } from "../../controller/brand";

const router = express.Router();
const controller = new BrandController();
const uploadBrandLogo = createUploadMiddleware("brands").single("logo");

router.get("/all", controller.getAll);
router.post(
    "/create",
    auth,
    authorize("admin"),
    uploadBrandLogo,
    controller.create
);
router.get("/:id", controller.update);
router.patch(
    "/:id",
    auth,
    authorize("admin"),
    uploadBrandLogo,
    controller.update
);
router.patch(
    "/enableDisableBrand/:brandId",
    auth,
    authorize("admin"),
    controller.enableDisableBrand
);
router.delete("/:id", auth, authorize("admin"), controller.delete);

export default router;
