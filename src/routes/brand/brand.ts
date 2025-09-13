/** @format */

import express from "express";
import { createUploadMiddleware } from "../../services/multer";
import { auth, authorize } from "../../middleware/auth";
import { BrandController } from "../../controller/brand";
import { brandModel } from "../../controller/model";

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

//car models
router.route("/model/:brandId").get(brandModel.getByBrandId);
router.route("/model").post(auth, authorize("admin"), brandModel.create);
router.route("/model/:id").patch(auth, authorize("admin"), brandModel.update);
router.route("/model/:id").delete(auth, authorize("admin"), brandModel.delete);

export default router;
