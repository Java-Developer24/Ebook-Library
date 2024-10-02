import  { Document } from "mongoose";

// Define your User type extending mongoose.Document
export interface User extends Document {
    name: string;
    email: string;
    password: string;
    refreshToken?: string | null; // Optional, as it can be null
}
