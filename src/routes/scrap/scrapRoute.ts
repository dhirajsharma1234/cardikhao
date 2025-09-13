/** @format */

import express from "express";
import { scrapController } from "../../controller/scrap";

const router = express.Router();

// Public routes
router.post("/request", scrapController.sendRequest);
router.get("/requests", scrapController.getScraps);

export default router;
