/** @format */

import express from "express";
import userRoute from "./user/user";
import brandRoute from "./brand/brand";
import carRoute from "./car/carRoute";
import enquiryRoute from "./user/enquiry";
import sellingRoute from "./brand/sell";
import scrapRoute from "./scrap/scrapRoute";

const router = express.Router();

router.use("/user", userRoute);
router.use("/brand", brandRoute);
router.use("/car", carRoute);
router.use("/enquiry", enquiryRoute);
router.use("/sell/car", sellingRoute);
router.use("/scrap/car", scrapRoute);

export default router;
