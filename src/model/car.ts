/** @format */

import mongoose, { Document, Schema, Model } from "mongoose";

export interface ICar extends Document {
    brand: mongoose.Types.ObjectId;
    modelName: mongoose.Types.ObjectId; // changed here
    year: number;
    price: number;
    mileage?: number;
    fuelType?: "Petrol" | "Diesel" | "Electric" | "Hybrid" | "CNG";
    transmission?: "Automatic" | "Manual";
    color?: string;
    images?: string[];
    description?: string;
    addedBy: mongoose.Types.ObjectId;
    isApproved: boolean;
    isFeatured: boolean;
    condition: "new" | "used";
    createdAt: Date;
    isSold: boolean;
    isEnable?: boolean;
    bodyType: string;
    kmRun?: number;
    city?: string;
}

const carSchema: Schema<ICar> = new Schema(
    {
        brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
        modelName: {
            type: Schema.Types.ObjectId,
            ref: "BrandModel",
            required: true,
        }, // changed here
        condition: {
            type: String,
            enum: ["new", "used"],
            required: true,
            lowercase: true,
        },
        year: { type: Number, required: true },
        price: { type: Number, required: true },
        mileage: { type: Number },
        fuelType: {
            type: String,
            enum: ["petrol", "diesel", "electric", "hybrid", "cng"],
            lowercase: true,
        },
        transmission: {
            type: String,
            enum: ["Automatic", "Manual"],
        },
        color: { type: String },
        images: [{ type: String }],
        description: { type: String },
        addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        isApproved: { type: Boolean, default: false },
        isFeatured: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        isSold: { type: Boolean, default: false },
        city: { type: String, trim: true, lowercase: true },
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
        kmRun: { type: Number },
        isEnable: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Car: Model<ICar> = mongoose.model<ICar>("Car", carSchema);
export default Car;
