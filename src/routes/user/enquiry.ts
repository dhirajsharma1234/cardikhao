/** @format */

import express from "express";
import { EnquiryController } from "../../controller/enquiry";
import { auth, authorize } from "../../middleware/auth";

const router = express.Router();
const enquiryController = new EnquiryController();

router.post("/", enquiryController.create);
router.get("/", auth, authorize("admin"), enquiryController.getAll);
router.patch(
    "/:id/status",
    auth,
    authorize("admin"),
    enquiryController.updateStatus
);

export default router;
