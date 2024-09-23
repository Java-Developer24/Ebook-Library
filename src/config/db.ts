import { config } from "./config";
import mongoose from "mongoose";

const connectDB= async()=>{
    try {
        mongoose.connection.on("connected",()=>{
            console.log("connected to database");
            
        });
        mongoose.connection.on("error",(err)=>{
            console.log("Error connnecting the databse",err);
            
        });
        await mongoose.connect(config.databaseURL as string);
        
        
    } catch (error) {

        console.log("failed to connect",error);
        process.exit(1);
    }

 
};

export default connectDB;

