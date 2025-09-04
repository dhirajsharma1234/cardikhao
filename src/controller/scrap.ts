/** @format */

import { NextFunction, Request, Response } from "express";
import { ErrorHandle } from "../util/Error";
import { ScrapCar } from "../model/scrap"; // Assuming you have a Scrap model

export class ScrapC {
    // Create a new scrap entry
    sendRequest = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const {
                name,
                phoneNumber,
                emailId,
                carBrand,
                model,
                year,
                fuelType,
                city,
            } = req.body;

            // Basic validation
            if (
                !name ||
                !phoneNumber ||
                !emailId ||
                !carBrand ||
                !model ||
                !year ||
                !fuelType ||
                !city
            ) {
                return next(new ErrorHandle("All fields are required", 400));
            }

            const newScrap = new ScrapCar({
                name,
                phoneNumber,
                emailId,
                carBrand,
                model,
                year,
                fuelType,
                city,
            });

            await newScrap.save();
            res.status(201).json({
                message: "Scrap request saved successfully",
                data: newScrap,
            });
        } catch (error) {
            if (error instanceof ErrorHandle) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                console.error("Error saving scrap:", error);
                res.status(500).json({ error: "Internal server error" });
            }
        }
    };

    // Get all scrap entries
    getScraps = async (req: Request, res: Response): Promise<void> => {
        try {
            // Extract page and limit from query parameters, with defaults
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            // Calculate the number of documents to skip
            const skip = (page - 1) * limit;

            // Get total count of documents for pagination metadata
            const total = await ScrapCar.countDocuments();

            // Fetch paginated data
            const scraps = await ScrapCar.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            // Calculate total pages
            const totalPages = Math.ceil(total / limit);

            // Return response with pagination metadata
            res.status(200).json({
                status: true,
                data: scraps,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },
            });
        } catch (error) {
            console.error("Error fetching scraps:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    };
}

export const scrapController = new ScrapC();
