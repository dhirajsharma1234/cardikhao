/** @format */

import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

/**
 * Creates a dynamic multer upload middleware
 * @param type 'brands' | 'cars'
 */
export const createUploadMiddleware = (type: "brands" | "cars") => {
    const uploadPath = path.join(__dirname, `../../uploads/${type}`);

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Storage configuration
    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, uploadPath);
        },
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const baseName = path
                .basename(file.originalname, ext)
                .replace(/\s+/g, "_");
            const uniqueSuffix = `${Date.now()}-${Math.round(
                Math.random() * 1e6
            )}`;
            cb(null, `${type.slice(0, -1)}-${baseName}-${uniqueSuffix}${ext}`);
        },
    });

    // Image-only file filter
    const fileFilter = (
        _req: Request,
        file: Express.Multer.File,
        cb: FileFilterCallback
    ): void => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = file.mimetype.toLowerCase();

        if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only image files are allowed (.jpg, .jpeg, .png, .webp, .gif)"
                )
            );
        }
    };

    // 2MB limit
    const limits = {
        fileSize: 2 * 1024 * 1024,
    };

    return multer({ storage, fileFilter, limits });
};
