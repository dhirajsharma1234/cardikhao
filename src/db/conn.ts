/** @format */

import mongoose from "mongoose";
import { ErrorHandle } from "../util/Error";
import Car from "../model/car";
import Brand from "../model/brand";

export const connectDb = async () => {
    try {
        const DB_URI = process.env.DB_URI as string;
        const conn = await mongoose.connect(DB_URI);
        if (conn) {
            console.log("mongodb connected successfully.....");
        }
    } catch (error: any) {
        throw new ErrorHandle(error.message, 400);
    }
};

const seedCars = async () => {
    try {
        // Get brand ObjectIds
        const mercedesBrand = await Brand.findOne({ name: /mercedes/i });
        const bmwBrand = await Brand.findOne({ name: /bmw/i });

        if (!mercedesBrand || !bmwBrand) {
            console.error(
                "Brands not found. Please add Mercedes and BMW brands first."
            );
            return;
        }

        const dummyCars = [];

        for (let i = 1; i <= 5; i++) {
            dummyCars.push({
                brand: mercedesBrand._id,
                modelName: `Mercedes-Benz C-Class ${i}`,
                year: 2020 + (i % 3),
                price: 4000000 + i * 100000,
                mileage: 15000 + i * 1000,
                fuelType: "Petrol",
                transmission: i % 2 === 0 ? "Automatic" : "Manual",
                color: "Black",
                images: [`mercedes-${(i % 5) + 1}.jpg`],
                description: "Well-maintained Mercedes-Benz luxury sedan.",
                addedBy: new mongoose.Types.ObjectId(
                    "685795449ec8547427db4be0"
                ), // replace with real user ID
                isApproved: true,
                isFeatured: i % 2 === 0,
                isSold: false,
            });

            dummyCars.push({
                brand: bmwBrand._id,
                modelName: `BMW 3 Series ${i}`,
                year: 2021 + (i % 2),
                price: 3500000 + i * 120000,
                mileage: 18000 + i * 1100,
                fuelType: "Diesel",
                transmission: i % 2 === 1 ? "Automatic" : "Manual",
                color: "White",
                images: [`bmw-${(i % 5) + 1}.jpg`],
                description: "Sporty and powerful BMW with modern features.",
                addedBy: new mongoose.Types.ObjectId(
                    "685795449ec8547427db4be0"
                ), // replace with real user ID
                isApproved: true,
                isFeatured: i % 3 === 0,
                isSold: false,
            });
        }

        await Car.insertMany(dummyCars);
        console.log("Dummy cars inserted");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

// seedCars();
