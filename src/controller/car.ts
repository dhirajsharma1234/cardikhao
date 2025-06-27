/** @format */

import { Request, Response, NextFunction } from "express";
import Car from "../model/car";
import { ErrorHandle } from "../util/Error";
import { deleteFile } from "../util/deleteFile";
import Brand from "../model/brand";

export class CarController {
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                modelName,
                fuelType,
                color,
                condition,
                sortBy = "createdAt",
                sortOrder = "desc",
                search,
                page = 1,
                limit = 10,
            } = req.query;

            const query: any =
                (req as any).user?.role === "admin" ? {} : { isApproved: true };

            if (modelName)
                query.modelName = {
                    $regex: modelName as string,
                    $options: "i",
                };

            if (fuelType)
                query.fuelType = { $regex: fuelType as string, $options: "i" };

            if (color) query.color = { $regex: color as string, $options: "i" };
            if (condition)
                query.condition = {
                    $regex: condition as string,
                    $options: "i",
                };

            if (search) {
                query.$or = [
                    { modelName: { $regex: search as string, $options: "i" } },
                    { fuelType: { $regex: search as string, $options: "i" } },
                    { color: { $regex: search as string, $options: "i" } },
                    { condition: { $regex: search as string, $options: "i" } },
                ];
            }

            const sortOptions: any = {};
            sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;

            const pageNumber = parseInt(page as string, 10);
            const limitNumber = parseInt(limit as string, 10);
            const skip = (pageNumber - 1) * limitNumber;

            const [cars, total] = await Promise.all([
                Car.find(query)
                    .populate("brand", "name logo")
                    .populate("addedBy", "name email")
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limitNumber),
                Car.countDocuments(query),
            ]);

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
            const cars = await Car.find({
                brand: req.params.brandId,
                isApproved: true,
            }).populate("brand", "name logo");

            res.status(200).json(cars);
        } catch (error) {
            next(error);
        }
    };

    getSingle = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const car = await Car.findById(req.params.id)
                .populate("brand", "name logo")
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
                condition,
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
            const existing = await Car.findById(req.params.id);
            if (!existing) return next(new ErrorHandle("Car not found", 404));

            const newImages = (req.files as Express.Multer.File[])?.map(
                (f) => f.filename
            );
            if (newImages?.length) {
                // Delete old images
                existing.images?.forEach((img) => deleteFile(img, "cars"));
                req.body.images = newImages;
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
