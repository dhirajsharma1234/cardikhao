/** @format */
import "dotenv/config";
import app from "./app";
import { connectDb } from "./db/conn";
import https from "https";
import fs from "fs";

const PORT = process.env.PORT || 8000;

const sslOptions = {
    key: fs.readFileSync(
        "/etc/letsencrypt/live/api.gadidikhao.com/privkey.pem"
    ),
    cert: fs.readFileSync(
        "/etc/letsencrypt/live/api.gadidikhao.com/fullchain.pem"
    ),
};

https.createServer(sslOptions, app).listen(PORT, async () => {
    console.log(`🚀 Secure server running on port ${PORT}`);
    await connectDb();
});
