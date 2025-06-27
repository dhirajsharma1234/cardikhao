/** @format */

import mongoose, { Schema, Document, Model } from "mongoose";

// Define interface
export interface IBrand extends Document {
    name: string;
    logo?: string;
    description?: string;
    createdAt: Date;
}

// Define schema
const brandSchema: Schema<IBrand> = new Schema(
    {
        name: { type: String, required: true, unique: true },
        logo: { type: String },
        description: { type: String },
    },
    { timestamps: true }
);

// Create model
const Brand: Model<IBrand> = mongoose.model<IBrand>("Brand", brandSchema);

export default Brand;
