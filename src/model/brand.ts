/** @format */

import mongoose, { Schema, Document, Model } from "mongoose";

// Define interface
export interface IBrand extends Document {
    name: string;
    logo?: string;
    isEnable?: boolean;
    description?: string;
    createdAt: Date;
}

// Define schema
const brandSchema: Schema<IBrand> = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        logo: { type: String },
        description: { type: String },
        isEnable: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Create model
const Brand: Model<IBrand> = mongoose.model<IBrand>("Brand", brandSchema);

export default Brand;
