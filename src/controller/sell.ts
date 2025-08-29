/** @format */

import { Request, Response, NextFunction } from "express";
import Car from "../model/car";
import { ErrorHandle } from "../util/Error";
import SellRequest from "../model/SellRequest";
import { sendEmail } from "../util/sendMail";
import { deleteFile } from "../util/deleteFile";
import Brand from "../model/brand";
import { CarModel } from "../model/brandModel";
import mongoose from "mongoose";

export class SellRequestController {
    create = async (req: Request, res: any, next: NextFunction) => {
        const uploadedFiles = (req.files as Express.Multer.File[]) || [];

        try {
            const {
                brand,
                sellerName,
                sellerPhone,
                sellerEmail,
                modelId,
                year,
                // expectedPrice,
                // mileage,
                fuelType,
                // transmission,
                color,
                condition,
                // bodyType,
                additionalInfo,
            } = req.body;

            console.log(req.body);

            // 🚫 Basic Field Validation
            if (
                !brand ||
                !modelId ||
                !year ||
                !sellerName ||
                !sellerPhone ||
                !sellerEmail ||
                uploadedFiles.length === 0
            ) {
                uploadedFiles.forEach((file) =>
                    deleteFile(file.filename, "cars")
                );
                return next(
                    new ErrorHandle(
                        "Missing required fields: brand, modelId, year, expectedPrice, image, and seller details",
                        400
                    )
                );
            }

            const brandExists = await Brand.findById(brand);
            if (!brandExists) {
                uploadedFiles.forEach((file) =>
                    deleteFile(file.filename, "cars")
                );
                return next(new ErrorHandle("Invalid brand", 400));
            }

            //check model
            const brandModel = await CarModel.findById(modelId);
            if (!brandModel) {
                uploadedFiles.forEach((file) =>
                    deleteFile(file.filename, "cars")
                );
                return next(new ErrorHandle("Invalid model", 400));
            }

            // const requestExist = await SellRequest.findOne({
            //     brand,
            //     modelId,
            // });

            // if (requestExist) {
            //     uploadedFiles.forEach((file) =>
            //         deleteFile(file.filename, "cars")
            //     );
            //     return next(new ErrorHandle("Request already sent", 400));
            // }

            const sellRequestData = {
                sellerName,
                sellerPhone,
                sellerEmail,
                brand,
                modelId,
                year,
                // expectedPrice,
                // bodyType,
                // mileage,
                fuelType,
                // transmission,
                color,
                condition,
                additionalInfo,
                images: uploadedFiles.map((f) => f.filename),
            };

            const sellRequest: any = await SellRequest.create(sellRequestData);

            // 📧 Send Email to Admin
            const imageUrl = `${
                process.env.BASE_URL || "https://api.gadidikhao.com/"
            }/uploads/cars/${sellRequest.images[0]}`;

            const emailSubject = `New Sell Request for ${brandExists.name} ${brandModel.name}`;
            const emailHtml = `
            <h2>New Car Sell Request Received</h2>
            <p><strong>Car:</strong> ${brandExists.name} ${
                brandModel.name
            } (${year})</p>
            <p><strong>Fuel Type:</strong> ${fuelType || "Not specified"}</p>
            <p><strong>Color:</strong> ${color || "Not specified"}</p>
            <img src="${imageUrl}" alt="Car Image" style="width:400px; margin-top:10px;" />
            <hr/>
            <h3>Seller Details:</h3>
            <p><strong>Name:</strong> ${sellerName}</p>
            <p><strong>Email:</strong> ${sellerEmail}</p>
            <p><strong>Phone:</strong> ${sellerPhone}</p>
            <p><strong>Additional Info:</strong> ${additionalInfo || "N/A"}</p>
        `;

            await sendEmail(
                process.env.ADMIN_EMAIL!,
                emailSubject,
                emailHtml,
                emailHtml
            );

            return res.status(201).json({ status: true, data: sellRequest });
        } catch (error) {
            // ❌ Cleanup files on error
            uploadedFiles.forEach((file) => deleteFile(file.filename, "cars"));
            return next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const [sellRequests, total] = await Promise.all([
                SellRequest.find()
                    .populate("brand", "name")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                SellRequest.countDocuments(),
            ]);

            res.status(200).json({
                status: true,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                data: sellRequests,
            });
        } catch (error) {
            next(error);
        }
    };

    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                const { status } = req.body;
                const user = (req as any).user;

                // 1. Fetch request first
                const sellRequest: any = await SellRequest.findById(
                    req.params.id
                )
                    .populate("brand", "name")
                    .session(session);

                if (!sellRequest) {
                    throw new ErrorHandle("Sell request not found", 404);
                }

                // 2. Prevent update if already approved/rejected
                if (["approved", "rejected"].includes(sellRequest.status)) {
                    throw new ErrorHandle("Request already updated.", 400);
                }

                // 3. Update status
                sellRequest.status = status;
                await sellRequest.save({ session });

                // 4. Get model
                const modelName = await CarModel.findById(
                    sellRequest.modelId
                ).session(session);
                if (!modelName) {
                    throw new ErrorHandle("Model not found", 404);
                }

                // 5. If approved, create Car entry
                if (status === "approved") {
                    const carData = {
                        brand: (sellRequest.brand as any)._id,
                        modelName: sellRequest.modelId,
                        year: sellRequest.year,
                        price: sellRequest.expectedPrice,
                        mileage: sellRequest.mileage,
                        fuelType: sellRequest.fuelType,
                        color: sellRequest.color,
                        images: sellRequest.images,
                        addedBy: user.id,
                        condition: sellRequest.condition,
                        description: sellRequest.additionalInfo,
                        isApproved: true,
                    };

                    const car = new Car(carData);
                    await car.save({ session });

                    // Defer email sending until AFTER transaction is committed
                    process.nextTick(() => {
                        sendEmail(
                            sellRequest.sellerEmail,
                            `Your Sell Request for ${modelName.name} has been approved`,
                            `
Congratulations! Your sell request has been approved.

Car Details:
${(sellRequest.brand as any).name} ${modelName.name} (${sellRequest.year})
Price: ₹${sellRequest.expectedPrice}

Your car is now listed on our platform. You can view it on our website.
            `
                        );
                    });
                }

                // ✅ Transaction will be committed automatically here
            });

            session.endSession();
            res.status(200).json({
                status: true,
                message: "Status updated successfully",
            });
        } catch (error) {
            session.endSession();
            next(error);
        }
    };
}
