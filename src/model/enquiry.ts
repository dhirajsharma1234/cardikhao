/** @format */

import mongoose, { Document, Schema, Model } from "mongoose";

// Define interface
export interface IEnquiry extends Document {
    car: mongoose.Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    message?: string;
    status: "pending" | "contacted" | "rejected";
    createdAt: Date;
}

// Define schema
const enquirySchema: Schema<IEnquiry> = new Schema({
    car: { type: Schema.Types.ObjectId, ref: "Car", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String },
    status: {
        type: String,
        enum: ["pending", "contacted", "rejected"],
        default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
});

// Export model
const Enquiry: Model<IEnquiry> = mongoose.model<IEnquiry>(
    "Enquiry",
    enquirySchema
);
export default Enquiry;
