/** @format */

import express from "express";
import { CarController } from "../../controller/car";
import { auth, authorize } from "../../middleware/auth";
import { createUploadMiddleware } from "../../services/multer";

const router = express.Router();
const carController = new CarController();
const uploadCarImages = createUploadMiddleware("cars").array("images", 5);

router.get("/", carController.getAll);
router.get("/brand/:brandId", carController.getByBrand);
router.get("/:id", auth, carController.getSingle);

// Use upload middleware for creating and updating cars
router.post(
    "/",
    auth,
    authorize("admin"),
    uploadCarImages,
    carController.create
);
router.put(
    "/:id",
    auth,
    authorize("admin"),
    uploadCarImages,
    carController.update
);

router.delete("/:id", auth, authorize("admin"), carController.delete);

export default router;
