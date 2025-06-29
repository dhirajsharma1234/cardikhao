/** @format */

import mongoose, { Document, Schema, Model } from "mongoose";

export interface ISellRequest extends Document {
    brand: mongoose.Types.ObjectId;
    modelName: string;
    year: number;
    expectedPrice: number;
    mileage?: number;
    fuelType?: "Petrol" | "Diesel" | "Electric" | "Hybrid" | "CNG";
    condition?: "used" | "new";
    transmission?: "Automatic" | "Manual";
    color?: string;
    images?: string[];
    additionalInfo?: string;
    user: mongoose.Types.ObjectId;
    sellerName: string;
    sellerEmail: string;
    sellerPhone: string;
    status: "pending" | "approved" | "rejected";
    createdAt: Date;
    bodyType?: string;
}

const sellRequestSchema: Schema<ISellRequest> = new Schema({
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    modelName: { type: String, required: true },
    year: { type: Number, required: true },
    expectedPrice: { type: Number, required: true },
    mileage: { type: Number },
    fuelType: {
        type: String,
        enum: ["Petrol", "Diesel", "Electric", "Hybrid", "CNG"],
    },
    transmission: {
        type: String,
        enum: ["Automatic", "Manual"],
    },
    color: { type: String },
    images: [{ type: String }],
    additionalInfo: { type: String },
    // user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerName: { type: String, required: true },
    sellerEmail: { type: String, required: true },
    sellerPhone: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
        lowercase: true,
    },
    bodyType: {
        type: String,
        enum: [
            "SEDAN",
            "SUV",
            "HATCHBACK",
            "CONVERTIBLE",
            "COUPE",
            "PICKUP",
            "VAN",
            "WAGON",
        ],
        required: true,
    },
    condition: {
        type: String,
        enum: ["new", "used"],
        required: true,
        lowercase: true,
    },
    createdAt: { type: Date, default: Date.now },
});

const SellRequest: Model<ISellRequest> = mongoose.model<ISellRequest>(
    "SellRequest",
    sellRequestSchema
);

export default SellRequest;
