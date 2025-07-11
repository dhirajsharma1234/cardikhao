/** @format */

import { Request, Response, NextFunction } from "express";
import Enquiry from "../model/enquiry";
import Car from "../model/car";
import { ErrorHandle } from "../util/Error";
import { sendEmail } from "../util/sendMail";

export class EnquiryController {
    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { typeData, price, carId, name, email, phone, message } =
                req.body;

            if (!name || !email || !phone || !typeData)
                return next(new ErrorHandle("All field required", 400));

            if (typeData === "bidding" && !price)
                return next(
                    new ErrorHandle("Price required for type bidding", 404)
                );

            const car: any = await Car.findById(carId).populate(
                "brand",
                "name"
            );
            if (!car) return next(new ErrorHandle("Car not found", 404));

            const obj: any = {
                typeData,
                car: carId,
                name,
                email,
                phone,
            };

            if (typeData === "enquiry") {
                obj.message = message;
            } else {
                obj.price = price;
            }

            const enquiry = await Enquiry.create(obj);

            const carImage = car.images?.length
                ? `https://cardikhao-production.up.railway.app/uploads/cars/${car.images[0]}`
                : null;

            console.log(carImage);

            const emailSubject =
                typeData === "enquiry"
                    ? `🚗 New Enquiry for ${car.modelName}`
                    : `🚗 Car bidding for ${car.modelName}`;

            const emailHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #1e88e5; color: white; padding: 20px;">
      <h2 style="margin: 0;">🔔 New Car Enquiry</h2>
    </div>

    ${
        carImage
            ? `
    <img src="${carImage}" alt="Car Image" style="width: 100%; max-height: 300px; object-fit: cover; border-bottom: 1px solid #ddd;" />
    `
            : ""
    }

    <div style="padding: 20px;">
      <h3 style="margin-top: 0;">🚗 Car Details</h3>
      <p><strong>Brand:</strong> ${car.brand.name}</p>
      <p><strong>Model:</strong> ${car.modelName}</p>
      <p><strong>Year:</strong> ${car.year}</p>
      <p><strong>Price:</strong> ₹${car.price.toLocaleString()}</p>

      <hr style="margin: 20px 0;" />

      <h3>📨 Enquiry Details</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Message:</strong> ${
          typeData === "enquiry" ? message || "No message provided" : price
      }</p>

      <p style="margin-top: 30px;">Please follow up with this enquiry as soon as possible.</p>
    </div>

    <div style="background-color: #f5f5f5; padding: 10px 20px; font-size: 12px; text-align: center; color: #666;">
      AutoMarket Notification • ${new Date().toLocaleDateString()}
    </div>
  </div>
`;

            await sendEmail(
                process.env.ADMIN_EMAIL!,
                emailSubject,
                "",
                emailHtml
            );

            res.status(201).json({ status: true, data: enquiry });
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const skip = (page - 1) * limit;
            const { type } = req.query as any;

            const obj: any = {};
            if (type) {
                obj.typeData = type;
            }

            console.log(type);

            const [enquiries, total] = await Promise.all([
                Enquiry.find(obj)
                    .populate({
                        path: "car",
                        select: "brand modelName year price",
                        populate: [
                            { path: "brand", select: "name" },
                            { path: "modelName", select: "name" },
                        ],
                    })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Enquiry.countDocuments(obj),
            ]);

            res.status(200).json({
                status: true,
                data: enquiries,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit),
                    limit,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { status } = req.body;

            const enquiry = await Enquiry.findByIdAndUpdate(
                req.params.id,
                { status: status.trim().toLowerCase() },
                { new: true }
            ).populate("car", "brand model year price");

            if (!enquiry)
                return next(new ErrorHandle("Enquiry not found", 404));

            res.status(200).json({ status: true, enquiry });
        } catch (error) {
            next(error);
        }
    };

    //contact us
    contactUs = async (req: Request, res: any, next: NextFunction) => {
        try {
            const { name, email, phone, message } = req.body;

            // Validate required fields
            if (!name || !email || !phone) {
                return next(
                    new ErrorHandle(
                        "Name, email and phone are required fields",
                        400
                    )
                );
            }

            const emailSubject = `New Contact Form Submission - ${name}`;
            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Form Submission</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
        }
        .header {
            background-color: #1e88e5;
            color: white;
            padding: 25px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            padding: 25px;
            background-color: #f9f9f9;
        }
        .details {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .footer {
            text-align: center;
            padding: 15px;
            font-size: 12px;
            color: #666;
            background-color: #f5f5f5;
            border-radius: 0 0 8px 8px;
        }
        h2 {
            margin-top: 0;
            color: #1e88e5;
        }
        p {
            margin: 10px 0;
        }
        strong {
            color: #1e88e5;
        }
        hr {
            border: 0;
            height: 1px;
            background-color: #e0e0e0;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 24px;">📩 New Contact Message</h1>
    </div>
    
    <div class="content">
        <div class="details">
            <h2>Contact Details</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            
            <hr>
            
            <h2>Message</h2>
            <p>${message || "No message provided"}</p>
        </div>
        
        <p style="text-align: center;">
            <a href="mailto:${email}" 
               style="background-color: #1e88e5; 
                      color: white; 
                      padding: 10px 20px; 
                      text-decoration: none; 
                      border-radius: 4px;
                      display: inline-block;">
                Reply to ${name.split(" ")[0]}
            </a>
        </p>
    </div>
    
    <div class="footer">
        This message was sent from the contact form on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
    </div>
</body>
</html>
`;

            await sendEmail(
                process.env.ADMIN_EMAIL!,
                emailSubject,
                "",
                emailHtml
            );

            res.status(201).json({
                status: true,
                message:
                    "Thank you for contacting us! We will get back to you soon.",
            });
        } catch (error) {
            console.error("Error in contactUs controller:", error);
            next(error);
        }
    };
}
