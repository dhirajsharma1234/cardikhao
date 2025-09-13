/** @format */

import mongoose from "mongoose";

const modelSchema = new mongoose.Schema({
    name: { type: String, lowercase: true, trim: true, required: true },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required: true,
    },
});

export const CarModel = mongoose.model("BrandModel", modelSchema);
