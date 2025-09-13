/** @format */

import { Request, NextFunction } from "express";
import { ErrorHandle } from "../util/Error";

export function globalErrorHandler(
    err: Error | ErrorHandle,
    req: Request,
    res: any,
    next: NextFunction
) {
    const statusCode = err instanceof ErrorHandle ? err.statusCode : 400;
    const message = err.message || "Internal Server Error";

    if (process.env.NODE_ENV !== "production") {
        console.error(`[ERROR]`, err); // Log stacktrace only in dev
    }

    return res.status(statusCode).json({
        status: false,
        message,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
}
