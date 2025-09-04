/** @format */

import express from "express";
import { CarController } from "../../controller/car";
import { createUploadMiddleware } from "../../services/multer";
import { scrapController } from "../../controller/scrap";

const router = express.Router();

// Public routes
router.post("/request", scrapController.sendRequest);
router.get("/requests", scrapController.getScraps);

export default router;
