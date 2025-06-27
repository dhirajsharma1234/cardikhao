/** @format */

import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: "user" | "admin";
    createdAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateToken(): string;
}

const userSchema: Schema<IUser> = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function (): string {
    const payload = {
        id: this._id,
        email: this.email,
        role: this.role,
    };

    return jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "1d",
    });
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
