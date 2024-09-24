import { NextFunction, Request, Response } from "express"
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";


const createUser= async (
    req:Request,
    res:Response,
    next:NextFunction
)=>{

    const{name,email,password}=req.body;
   
    //validation
    if (!name ||!email||!password) {
        const error =createHttpError(400,"All fields are required");
        return next(error);
        
    }
    //database call
    try {
        const user=await userModel.findOne({email:email})
    if (user) {
        const error=createHttpError(400,"User already exist with this email");
        return next(error);
    }
    } catch (error) {
        return next(createHttpError(500,`Error while getting user ${error}`))
        
    }
    
    // password->hash
    const hashPassword= await bcrypt.hash(password,10);
let newUser:User;
    try {
         newUser= await userModel.create({
            name,
            email,
            password:hashPassword,
        })
        
    } catch (error) {
        return next(createHttpError(500,`error while creating user ${error}`))
        
    }

    
    //token generation JWT
    try {
        const token=sign({sub:newUser._id},config.jwtSecret as string,{expiresIn:"7d"});


    //process
    //response
    res.json({
        id:newUser._id,
        accessToken:token,
    })
    } catch (error) {
        return next(createHttpError(500,`error while signing the jwt toeken ${error}`))
        
    }
    
    next();

}
export {createUser};