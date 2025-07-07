/** @format */

import { Request, Response, NextFunction } from "express";
import Car from "../model/car";
import { ErrorHandle } from "../util/Error";
import SellRequest from "../model/SellRequest";
import { sendEmail } from "../util/sendMail";
import { deleteFile } from "../util/deleteFile";
import Brand from "../model/brand";

export class SellRequestController {
    create = async (req: Request, res: any, next: NextFunction) => {
        const uploadedFiles = (req.files as Express.Multer.File[]) || [];

        try {
            const {
                brand,
                sellerName,
                sellerPhone,
                sellerEmail,
                modelName,
                year,
                expectedPrice,
                mileage,
                fuelType,
                transmission,
                color,
                condition,
                bodyType,
                additionalInfo,
            } = req.body;

            console.log(req.body);

            // 🚫 Basic Field Validation
            if (
                !brand ||
                !modelName ||
                !year ||
                !expectedPrice ||
                !sellerName ||
                !sellerPhone ||
                !sellerEmail ||
                !bodyType ||
                uploadedFiles.length === 0
            ) {
                uploadedFiles.forEach((file) =>
                    deleteFile(file.filename, "cars")
                );
                return next(
                    new ErrorHandle(
                        "Missing required fields: brand, modelName, year, expectedPrice, image, and seller details",
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

            const requestExist = await SellRequest.findOne({
                brand,
                modelName,
            });

            if (requestExist) {
                uploadedFiles.forEach((file) =>
                    deleteFile(file.filename, "cars")
                );
                return next(new ErrorHandle("Request already sent", 400));
            }

            const sellRequestData = {
                sellerName,
                sellerPhone,
                sellerEmail,
                brand,
                modelName,
                year,
                expectedPrice,
                bodyType,
                mileage,
                fuelType,
                transmission,
                color,
                condition,
                additionalInfo,
                images: uploadedFiles.map((f) => f.filename),
            };

            const sellRequest: any = await SellRequest.create(sellRequestData);

            // 📧 Send Email to Admin
            const imageUrl = `${
                process.env.BASE_URL ||
                "https://cardikhao-production.up.railway.app/"
            }/uploads/cars/${sellRequest.images[0]}`;

            const emailSubject = `New Sell Request for ${brandExists.name} ${modelName}`;
            const emailHtml = `
            <h2>New Car Sell Request Received</h2>
            <p><strong>Car:</strong> ${
                brandExists.name
            } ${modelName} (${year})</p>
            <p><strong>Expected Price:</strong> ₹${expectedPrice}</p>
            <p><strong>Mileage:</strong> ${mileage || "Not provided"}</p>
            <p><strong>Fuel Type:</strong> ${fuelType || "Not specified"}</p>
            <p><strong>Transmission:</strong> ${
                transmission || "Not specified"
            }</p>
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
        try {
            const { status } = req.body;
            const user = (req as any).user;

            const sellRequest = await SellRequest.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            ).populate("brand", "name");

            if (!sellRequest) {
                return next(new ErrorHandle("Sell request not found", 404));
            }

            // If approved, auto-create car listing
            if (status === "approved") {
                const carData = {
                    brand: (sellRequest.brand as any)._id,
                    modelName: sellRequest.modelName,
                    year: sellRequest.year,
                    price: sellRequest.expectedPrice,
                    mileage: sellRequest.mileage,
                    fuelType: sellRequest.fuelType,
                    transmission: sellRequest.transmission,
                    color: sellRequest.color,
                    images: sellRequest.images,
                    addedBy: user.id,
                    condition: sellRequest.condition,
                    description: sellRequest.additionalInfo,
                    isApproved: true,
                    bodyType: sellRequest.bodyType,
                };

                const car = new Car(carData);
                await car.save();

                const emailSubject = `Your Sell Request for ${sellRequest.modelName} has been approved`;
                const emailText = `
Congratulations! Your sell request has been approved.

Car Details:
${(sellRequest.brand as any).name} ${sellRequest.modelName} (${
                    sellRequest.year
                })
Price: ₹${sellRequest.expectedPrice}

Your car is now listed on our platform. You can view it on our website.
                `;

                await sendEmail(
                    sellRequest.sellerEmail,
                    emailSubject,
                    emailText
                );
            }

            res.status(200).json({ status: true, data: sellRequest });
        } catch (error) {
            next(error);
        }
    };
}
