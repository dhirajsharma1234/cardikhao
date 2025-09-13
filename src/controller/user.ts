/** @format */

import { Request, NextFunction } from "express";
import bcrypt from "bcryptjs";
import User from "../model/user";
import { ErrorHandle } from "../util/Error";
import Brand from "../model/brand";
import SellRequest from "../model/SellRequest";
import Enquiry from "../model/enquiry";
import Car from "../model/car";

export class AuthController {
    register = async (req: Request, res: any, next: NextFunction) => {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return next(
                    new ErrorHandle(
                        "Name, email, and password are required",
                        400
                    )
                );
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return next(new ErrorHandle("User already exists", 409));
            }

            const user = new User({ name, email, password });
            await user.save();

            const token = user.generateToken();

            return res.status(201).json({
                status: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (err) {
            console.error(err);
            return next(err);
        }
    };

    login = async (req: Request, res: any, next: NextFunction) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return next(
                    new ErrorHandle("Email and password are required", 400)
                );
            }

            const user = await User.findOne({ email });
            if (!user) {
                return next(new ErrorHandle("Invalid credentials", 401));
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return next(new ErrorHandle("Invalid credentials", 401));
            }

            const token = user.generateToken();

            return res.status(200).json({
                status: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (err) {
            console.error(err);
            return next(err);
        }
    };

    getMe = async (req: Request, res: any, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            if (!userId)
                return next(
                    new ErrorHandle("Unauthorized: No user ID found", 401)
                );

            const user = await User.findById(userId).select("-password");
            if (!user)
                return next(
                    new ErrorHandle("Unauthorized: No user ID found", 401)
                );

            return res.status(200).json({
                status: true,
                data: user,
            });
        } catch (err) {
            console.error(err);
            return next(err);
        }
    };

    getDashboardCount = async (req: Request, res: any, next: NextFunction) => {
        try {
            const now = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);

            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(now.getDate() - 60);

            const getPercentageChange = (
                current: number,
                previous: number
            ): number => {
                if (previous === 0) return current === 0 ? 0 : 100;
                return ((current - previous) / previous) * 100;
            };

            // 1. Cars
            const [totalCars, carsCurrent, carsPrevious] = await Promise.all([
                Car.countDocuments({ isEnable: true }),
                Car.countDocuments({
                    createdAt: { $gte: thirtyDaysAgo },
                    isEnable: true,
                }),
                Car.countDocuments({
                    createdAt: {
                        $gte: sixtyDaysAgo,
                        $lt: thirtyDaysAgo,
                    },
                    isEnable: true,
                }),
            ]);
            const carGrowth = getPercentageChange(carsCurrent, carsPrevious);

            // 2. Enquiries
            const [
                totalEnquiries,
                enquiriesCurrent,
                enquiriesPrevious,
                contactedEnquiries,
            ] = await Promise.all([
                Enquiry.countDocuments(),
                Enquiry.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
                Enquiry.countDocuments({
                    createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
                }),
                Enquiry.countDocuments({ status: "contacted" }),
            ]);
            const enquiryGrowth = getPercentageChange(
                enquiriesCurrent,
                enquiriesPrevious
            );

            // 3. Sell Requests
            const [
                totalSellRequests,
                sellCurrent,
                sellPrevious,
                approvedSellRequests,
            ] = await Promise.all([
                SellRequest.countDocuments(),
                SellRequest.countDocuments({
                    createdAt: { $gte: thirtyDaysAgo },
                }),
                SellRequest.countDocuments({
                    createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
                }),
                SellRequest.countDocuments({ status: "approved" }),
            ]);
            const sellRequestGrowth = getPercentageChange(
                sellCurrent,
                sellPrevious
            );

            // 4. Brands
            const [totalBrands, brandsCurrent, brandsPrevious] =
                await Promise.all([
                    Brand.countDocuments({ isEnable: true }),
                    Brand.countDocuments({
                        createdAt: { $gte: thirtyDaysAgo },
                        isEnable: true,
                    }),
                    Brand.countDocuments({
                        createdAt: {
                            $gte: sixtyDaysAgo,
                            $lt: thirtyDaysAgo,
                        },
                        isEnable: true,
                    }),
                ]);
            const brandGrowth = getPercentageChange(
                brandsCurrent,
                brandsPrevious
            );

            return res.status(200).json({
                status: true,
                data: {
                    totalCars,
                    carGrowth: +carGrowth.toFixed(2),

                    totalEnquiries,
                    enquiryGrowth: +enquiryGrowth.toFixed(2),
                    contactedEnquiries,

                    totalSellRequests,
                    sellRequestGrowth: +sellRequestGrowth.toFixed(2),
                    approvedSellRequests,

                    totalBrands,
                    brandGrowth: +brandGrowth.toFixed(2),
                },
            });
        } catch (error) {
            console.error("Dashboard count fetch error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };

    updateProfile = async (req: Request, res: any, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                return next(
                    new ErrorHandle("Unauthorized: No user ID found", 401)
                );
            }

            const user = await User.findById(userId);
            if (!user) {
                return next(new ErrorHandle("User not found", 404));
            }

            const { name, email, password } = req.body;
            const updateData: any = {};

            if (name) updateData.name = name;
            if (email) updateData.email = email;
            if (password) {
                const hashed = await bcrypt.hash(password, 10);
                updateData.password = hashed;
            }

            const updatedUser = await User.findOneAndUpdate(
                { _id: userId },
                { $set: updateData },
                { new: true, runValidators: true }
            ).select("-password"); // exclude password in response

            if (!updatedUser) {
                return next(new ErrorHandle("User not found", 404));
            }

            return res.status(200).json({
                status: true,
                message: "Profile updated successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt,
                },
            });
        } catch (error) {
            return next(error);
        }
    };
}
