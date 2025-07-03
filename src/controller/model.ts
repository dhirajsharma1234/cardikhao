/** @format */

import { Request, Response, NextFunction } from "express";
import Brand from "../model/brand";
import { ErrorHandle } from "../util/Error";
import { CarModel } from "../model/brandModel";

export class BrandModelController {
    // ✅ Get all models for a brand
    getByBrandId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { brandId } = req.params;

            const models = await CarModel.find({ brand: brandId }).sort({
                name: 1,
            });

            res.status(200).json({
                status: true,
                data: models,
            });
        } catch (error) {
            next(error);
        }
    };

    // ✅ Create new model
    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, brand } = req.body;

            if (!name || !brand)
                return next(
                    new ErrorHandle("Name and brand are required", 400)
                );

            // Check brand exists
            const brandExists = await Brand.findById(brand);
            if (!brandExists)
                return next(new ErrorHandle("Brand not found", 404));

            // Check for duplicate
            const existing = await CarModel.findOne({
                name,
                brand: brand.trim(),
            });
            if (existing)
                return next(new ErrorHandle("Model already exists", 400));

            const model = await CarModel.create({ name, brand });

            res.status(201).json({ status: true, data: model });
        } catch (error) {
            next(error);
        }
    };

    // ✅ Edit existing model
    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { name } = req.body;

            const model = await CarModel.findById(id);
            if (!model) return next(new ErrorHandle("Model not found", 404));

            model.name = name || model.name;
            await model.save();

            res.status(200).json({
                status: true,
                message: "Model updated successfully",
                data: model,
            });
        } catch (error) {
            next(error);
        }
    };

    // ✅ Delete model
    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const model = await CarModel.findById(id);
            if (!model) return next(new ErrorHandle("Model not found", 404));

            await model.deleteOne();

            res.status(200).json({
                status: true,
                message: "Model deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    };
}

export const brandModel = new BrandModelController();
