/** @format */
import "dotenv/config";
import app from "./app";
import { connectDb } from "./db/conn";

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    await connectDb();
});
