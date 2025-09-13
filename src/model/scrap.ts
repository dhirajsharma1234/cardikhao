/** @format */

import mongoose from "mongoose";

// Quote schema
const quoteSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    emailId: { type: String, required: true },
    carBrand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    fuelType: { type: String, required: true },
    city: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const ScrapCar = mongoose.model("Scrap_car", quoteSchema);

export { ScrapCar };
