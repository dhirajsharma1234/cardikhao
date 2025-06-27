/** @format */

import express from "express";
import { CarController } from "../../controller/car";
import { auth, authorize } from "../../middleware/auth";
import { createUploadMiddleware } from "../../services/multer";

const router = express.Router();
const carController = new CarController();

// Upload config: up to 5 images under /uploads/cars
const uploadCarImages = createUploadMiddleware("cars").array("images", 5);

// Public routes
router.get("/all", carController.getAll); // filters: ?page=1&limit=10&fuelType=Petrol&modelName=Swift
router.get("/brand/:brandId", carController.getByBrand);
router.get("/:id", carController.getSingle);

// Admin-only routes
router.post(
    "/create",
    auth,
    authorize("admin"),
    uploadCarImages,
    carController.create
);
router.patch(
    "/:id",
    auth,
    authorize("admin"),
    uploadCarImages,
    carController.update
);
router.delete("/:id", auth, authorize("admin"), carController.delete);

export default router;
