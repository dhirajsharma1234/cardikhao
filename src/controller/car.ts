/** @format */

import { Request, Response, NextFunction } from "express";
import Car from "../model/car";
import { ErrorHandle } from "../util/Error";
import { deleteFile } from "../util/deleteFile";
import Brand from "../model/brand";
import { brandModel } from "./model";
import { CarModel } from "../model/brandModel";

export class CarController {
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                modelName,
                fuelType,
                color,
                bodyType,
                condition,
                city,
                transmission,
                sortBy = "createdAt",
                sortOrder = "desc",
                search,
                maxPrice,
                brand, // ✅ brand as string (e.g. "bmw")
                page = 1,
                limit = 10,
            } = req.query;

            const isAdmin = (req as any).user?.role === "admin";

            const matchStage: any = {
                isEnable: true,
            };

            if (!isAdmin) matchStage.isApproved = true;

            // Optional filters
            if (fuelType)
                matchStage.fuelType = new RegExp(fuelType as string, "i");
            if (color) matchStage.color = new RegExp(color as string, "i");
            if (bodyType)
                matchStage.bodyType = new RegExp(bodyType as string, "i");
            if (condition)
                matchStage.condition = new RegExp(condition as string, "i");
            if (city) matchStage.city = new RegExp(city as string, "i");
            if (transmission)
                matchStage.transmission = new RegExp(
                    transmission as string,
                    "i"
                );
            // Price filter based on maxPrice
            if (maxPrice) {
                const maxPriceValue = parseInt(maxPrice as string, 10) * 100000;
                matchStage.price = {
                    $lte: maxPriceValue,
                };
            }

            const pageNumber = parseInt(page as string, 10);
            const limitNumber = parseInt(limit as string, 10);
            const skip = (pageNumber - 1) * limitNumber;

            console.log("match stage");
            console.log(matchStage);
            console.log(req.query);

            const pipeline: any[] = [
                {
                    $match: matchStage,
                },
                {
                    $lookup: {
                        from: "brands",
                        localField: "brand",
                        foreignField: "_id",
                        as: "brand",
                    },
                },
                {
                    $unwind: {
                        path: "$brand",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "brandmodels",
                        localField: "modelName",
                        foreignField: "_id",
                        as: "modelName",
                    },
                },
                {
                    $unwind: {
                        path: "$modelName",
                        preserveNullAndEmptyArrays: true,
                    },
                },
            ];

            // ✅ Brand string filter after unwind
            if (brand) {
                pipeline.push({
                    $match: {
                        "brand.name": new RegExp(brand as string, "i"),
                    },
                });
            }

            // Search by modelName (string)
            if (modelName) {
                pipeline.push({
                    $match: {
                        "modelName.name": {
                            $regex: modelName as string,
                            $options: "i",
                        },
                    },
                });
            }

            // General search (multiple fields)
            if (search) {
                const regex = new RegExp(search as string, "i");
                pipeline.push({
                    $match: {
                        $or: [
                            { "brand.name": regex }, // ✅ Brand name
                            { "modelName.name": regex },
                            { fuelType: regex },
                            { bodyType: regex },
                            { color: regex },
                            { condition: regex },
                            { city: regex },
                        ],
                    },
                });
            }

            // Count total
            const countPipeline = [...pipeline, { $count: "total" }];

            // Apply sorting, skip, and limit
            pipeline.push(
                {
                    $sort: {
                        [sortBy as string]: sortOrder === "asc" ? 1 : -1,
                    },
                },
                {
                    $skip: skip,
                },
                {
                    $limit: limitNumber,
                }
            );

            // Execute queries
            const [cars, countResult] = await Promise.all([
                Car.aggregate(pipeline),
                Car.aggregate(countPipeline),
            ]);

            // console.log(cars);

            const total = countResult[0]?.total || 0;

            res.status(200).json({
                status: true,
                cars,
                pagination: {
                    total,
                    page: pageNumber,
                    pages: Math.ceil(total / limitNumber),
                    limit: limitNumber,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    getByBrand = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { fuelType, color, bodyType, condition, city, transmission } =
                req.query;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const matchStage: any = {
                brand: req.params.brandId,
                isEnable: true,
                isApproved: true,
            };

            // Optional filters
            if (fuelType)
                matchStage.fuelType = new RegExp(fuelType as string, "i");
            if (color) matchStage.color = new RegExp(color as string, "i");
            if (bodyType)
                matchStage.bodyType = new RegExp(bodyType as string, "i");
            if (condition)
                matchStage.condition = new RegExp(condition as string, "i");
            if (city) matchStage.city = new RegExp(city as string, "i");
            if (transmission)
                matchStage.transmission = new RegExp(
                    transmission as string,
                    "i"
                );

            const [cars, total] = await Promise.all([
                Car.find(matchStage)
                    .skip(skip)
                    .limit(limit)
                    .populate("brand", "name logo"),
                Car.countDocuments({
                    brand: req.params.brandId,
                    isApproved: true,
                }),
            ]);

            res.status(200).json({
                status: true,
                cars,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            });
        } catch (error) {
            next(error);
        }
    };

    getSingle = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const car = await Car.findOne({
                _id: req.params.id,
                isEnable: true,
            })
                .populate("brand", "name logo")
                .populate("modelName", "name")
                .populate("addedBy", "name email");

            if (!car) return next(new ErrorHandle("Car not found", 400));

            if (!car.isApproved && (req as any).user?.role !== "admin") {
                return next(new ErrorHandle("Access denied", 403));
            }

            res.status(200).json({ status: true, data: car });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        const files = (req.files as Express.Multer.File[]) || [];
        try {
            const {
                brand,
                modelName,
                year,
                price,
                mileage,
                fuelType,
                transmission,
                color,
                description,
                isFeatured,
                isSold,
                bodyType,
                kmRun,
                condition,
                city,
            } = req.body;

            // 🛡 Validate required fields
            if (!brand || !modelName || !year || !price) {
                return next(new ErrorHandle("Missing required fields", 400));
            }

            console.log(brand);

            // 🔎 Check if brand exists
            const brandExists = await Brand.findById(brand);
            console.log(brandExists);

            if (!brandExists) {
                if (files) files.forEach((f) => deleteFile(f.filename, "cars"));
                console.log("file deleted!");
                return next(new ErrorHandle("Invalid brand ID", 400));
            }

            //model name validation modelName is id
            const modelExists = await CarModel.findOne({
                brand: brand,
                _id: modelName,
            });
            if (!modelExists) {
                files.forEach((f) => deleteFile(f.filename, "cars"));
                return next(
                    new ErrorHandle("Model not found for this brand", 400)
                );
            }

            // 🧠 Prepare car data
            const carData: any = {
                brand,
                modelName,
                year: parseInt(year),
                price: parseInt(price),
                mileage: mileage ? parseInt(mileage) : undefined,
                fuelType,
                transmission,
                color,
                description,
                addedBy: (req as any).user.id,
                isApproved: true,
                isFeatured: isFeatured === "true",
                isSold: isSold === "true",
                condition,
                bodyType,
                kmRun,
                city,
            };

            // 📦 Handle images
            const images = (req.files as Express.Multer.File[])?.map(
                (f) => f.filename
            );
            if (images?.length) carData.images = images;

            const car = new Car(carData);
            await car.save();

            res.status(201).json({ status: true, data: car });
        } catch (error) {
            files.forEach((f) => deleteFile(f.filename, "cars"));
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const existing = await Car.findOne({
                _id: req.params.id,
                isEnable: true,
            });
            if (!existing) return next(new ErrorHandle("Car not found", 404));

            const newImages = (req.files as Express.Multer.File[])?.map(
                (f) => f.filename
            );
            if (newImages?.length) {
                // Delete old images
                existing.images?.forEach((img) => deleteFile(img, "cars"));
                req.body.images = newImages;
            } else {
                // If no new images uploaded, keep existing ones
                req.body.images = existing.images;
            }

            const car = await Car.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
            });

            res.status(200).json({ status: true, data: car });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const car = await Car.findByIdAndDelete(req.params.id);

            if (!car) return next(new ErrorHandle("Car not found", 400));

            car.images?.forEach((img) => deleteFile(img, "cars"));

            res.status(200).json({ status: true, message: "Car deleted" });
        } catch (error) {
            next(error);
        }
    };
}
