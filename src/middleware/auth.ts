/** @format */

import jwt from "jsonwebtoken";
import User from "../model/user";
import { NextFunction, Response } from "express";
import { ErrorHandle } from "../util/Error";

export const auth = async (req: any, res: Response, next: NextFunction) => {
    try {
        const token = req.headers?.authorization?.replace("Bearer ", "");

        if (!token) return next(new ErrorHandle("Token required", 401));

        //decode
        const decodedUser: any = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        );

        const user = await User.findById(decodedUser?.id);
        if (!user) return next(new ErrorHandle("Unauthenticated user", 401));

        req.user = user;
        req.token = token;

        return next();
    } catch (error: any) {
        return next(new ErrorHandle(error.message, 401));
    }
};

export const authorize = (...roles: string[]): any => {
    return (req: Request, res: any, next: NextFunction) => {
        const user = (req as any).user;

        if (!user || !roles.includes(user.role)) {
            return next(
                new ErrorHandle(
                    "You are not authorized to access this resource",
                    403
                )
            );
        }

        next();
    };
};
