/** @format */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import "dotenv/config";
import { globalErrorHandler } from "./middleware/errorMiddleware";
import router from "./routes/route";
import path from "path";

const app = express();

// http://localhost:5000/uploads/brands/brand-bmw-logo-1750574364750-272571.jpg
app.use(
    "/uploads/brands",
    express.static(path.join(__dirname, "../uploads/brands"))
);
app.use(
    "/uploads/cars",
    express.static(path.join(__dirname, "../uploads/cars"))
);
app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to the API!",
    });
});
app.use("/api", router);

// Example 404 handler
// app.all("*", (req, res) => {
//     res.status(404).json({
//         success: false,
//         message: `Route ${req.originalUrl} not found`,
//     });
// });

app.use(globalErrorHandler); // custom error handler

export default app;
