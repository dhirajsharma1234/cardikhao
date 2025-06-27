/** @format */

import fs from "fs/promises";
import path from "path";

export const deleteFile = async (
    filename: string,
    folder: string
): Promise<void> => {
    try {
        const filePath = path.join(
            __dirname,
            "..",
            "..",
            "uploads",
            folder,
            filename
        );

        console.log("File path");
        console.log(filePath);

        await fs.unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
    } catch (error: any) {
        if (error.code === "ENOENT") {
            console.warn(`File not found: ${filename}`);
        } else {
            console.error(`Failed to delete ${filename}:`, error.message);
        }
    }
};
