/** @format */

import express from "express";
import { brandModel } from "../../controller/model";

const router = express.Router();

router.get("/brand/model/:brandId", brandModel.getByBrandId);
router.post("/model", brandModel.create);
router.patch("/model/:id", brandModel.update);
router.delete("/model/:id", brandModel.delete);

export default router;
