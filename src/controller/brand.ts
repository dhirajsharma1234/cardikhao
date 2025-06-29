/** @format */

import { Request, Response, NextFunction } from "express";
import Brand from "../model/brand";
import { ErrorHandle } from "../util/Error";
import path from "path";
import fs from "fs/promises";
import { deleteFile } from "../util/deleteFile";
import Car from "../model/car";

export class BrandController {
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1; // Default to page 1
            const limit = parseInt(req.query.limit as string) || 10; // Default to 10 items per page
            const skip = (page - 1) * limit;

            const total = await Brand.countDocuments();
            const brands = await Brand.find({})
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit);

            res.status(200).json({
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                data: brands,
            });
        } catch (error) {
            next(error);
        }
    };

    getBrandById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const getBrand = await Brand.findById(id);

            if (!getBrand) return next(new ErrorHandle("Brand not found", 400));

            return res.status(200).json({
                status: true,
                data: getBrand,
            });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, description } = req.body;
            const logo = (req as any).file?.filename;

            if (!name) {
                if (req?.file) deleteFile(req?.file?.filename, "brands");
                return next(new ErrorHandle("Name is required", 400));
            }

            const brand = new Brand({ name, description, logo });
            await brand.save();

            res.status(201).json({ success: true, brand });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const logo = (req as any).file?.filename;
            const updateData = { ...req.body };

            const brand = await Brand.findById(req.params.id);
            if (!brand) return next(new ErrorHandle("Brand not found", 404));

            // If new logo uploaded, delete old logo file
            if (logo) {
                updateData.logo = logo;

                if (brand.logo) {
                    const oldLogoPath = path.join(
                        __dirname,
                        "../../uploads/brands",
                        brand.logo
                    );
                    try {
                        await fs.unlink(oldLogoPath);
                        console.log(`Deleted old logo: ${brand.logo}`);
                    } catch (err: any) {
                        console.warn(`Old logo delete failed: ${err.message}`);
                    }
                }
            }

            const updatedBrand = await Brand.findByIdAndUpdate(
                req.params.id,
                updateData,
                {
                    new: true,
                }
            );

            res.status(200).json({ success: true, brand: updatedBrand });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const brand = await Brand.findById(req.params.id);
            if (!brand) {
                return next(new ErrorHandle("Brand not found", 404));
            }

            const logo = brand.logo;

            // Delete from DB
            await brand.deleteOne();

            // Delete logo file if exists
            if (logo) {
                const filePath = path.join(
                    __dirname,
                    "../../uploads/brands",
                    logo
                );
                try {
                    await fs.unlink(filePath);
                    console.log(`Deleted brand logo: ${logo}`);
                } catch (fileErr: any) {
                    console.warn(
                        `Logo file deletion failed: ${fileErr.message}`
                    );
                }
            }

            res.status(200).json({
                status: true,
                message: "Brand deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    };

    enableDisableBrand = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { brandId } = req.params;
            const { isEnable } = req.body;

            // Step 1: Update brand's isEnable status
            const updateBrand = await Brand.findByIdAndUpdate(
                brandId,
                { $set: { isEnable } },
                { new: true }
            );

            if (!updateBrand) {
                return next(
                    new ErrorHandle("Brand not found or update failed", 400)
                );
            }

            // Step 2: Update all cars under this brand
            await Car.updateMany(
                { brand: updateBrand._id },
                { $set: { isEnable } }
            );

            // Step 3: Send success response
            res.status(200).json({
                status: true,
                message: `Brand and all its cars have been ${
                    isEnable ? "enabled" : "disabled"
                } successfully.`,
                brand: updateBrand,
            });
        } catch (error) {
            next(error);
        }
    };
}
