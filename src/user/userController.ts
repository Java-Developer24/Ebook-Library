import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

interface DecodedToken {
    sub: string; // Assuming `sub` is the user ID
}

// Function to create new user
const createUser = async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    // validation
    if (!name || !email || !password) {
        return next(createHttpError(400, "All fields are required"));
    }

    try {
        // Check if the user already exists
        const user = await userModel.findOne({ email });
        if (user) {
            return next(createHttpError(400, "User already exists with this email"));
        }

        // Hash the password
        const hashPassword = await bcrypt.hash(password, 10);
        const newUser: User = await userModel.create({
            name,
            email,
            password: hashPassword,
        });

        // Generate access and refresh tokens
        const accessToken = sign({ sub: newUser._id }, config.jwtSecret as string, { expiresIn: "15m" });
        const refreshToken = sign({ sub: newUser._id }, config.jwtRefreshSecret as string, { expiresIn: "7d" });

        // Store the refresh token in the user's document (or another strategy)
        newUser.refreshToken = refreshToken;
        await newUser.save();

        // Respond with the tokens
        res.json({
            id: newUser._id,
            accessToken,
            refreshToken,
        });
    } catch (error) {
        return next(createHttpError(500, `Error creating user: ${error}`));
    }
};

// Function to log in the user
const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(createHttpError(400, "All fields are required"));
    }

    try {
        // Find user by email
        const user: User | null = await userModel.findOne({ email });
        if (!user) {
            return next(createHttpError(404, "User not found"));
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return next(createHttpError(400, "Invalid credentials"));
        }

        // Generate access and refresh tokens
        const accessToken = sign({ sub: user._id }, config.jwtSecret as string, { expiresIn: "15m" });
        const refreshToken = sign({ sub: user._id }, config.jwtRefreshSecret as string, { expiresIn: "7d" });

        // Store the refresh token
        user.refreshToken = refreshToken;
        await user.save();

        // Respond with the tokens
        res.json({
            accessToken,
            refreshToken,
        });
    } catch (error) {
        return next(createHttpError(500, `Error logging in: ${error}`));
    }
};

// Function to refresh the access token using a valid refresh token
const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    // If no refresh token is provided, return a 403 error
    if (!refreshToken) {
        return next(createHttpError(403, "Refresh token is required"));
    }

    // Validate the refresh token and get the decoded information
    let decoded: DecodedToken;

    try {
        decoded = verify(refreshToken, config.jwtSecret as string) as DecodedToken;
    } catch (error) {
        console.log(error)
        return next(createHttpError(403, "Invalid refresh token"));
    }

    // Find the user by ID from the decoded token
    const user = await userModel.findById(decoded.sub);
    if (!user || user.refreshToken !== refreshToken) {
        return next(createHttpError(403, "Invalid refresh token"));
    }

    // Generate a new access token
    const newAccessToken = sign({ sub: user._id }, config.jwtSecret as string, { expiresIn: "10d" });

    // Respond with the new access token
    res.json({ accessToken: newAccessToken });
};

export { createUser, loginUser, refreshAccessToken };



// import { NextFunction, Request, Response } from "express"
// import createHttpError from "http-errors";
// import userModel from "./userModel";
// import bcrypt from "bcrypt";
// import { sign } from "jsonwebtoken";
// import { config } from "../config/config";
// import { User } from "./userTypes";

// const jwt = require("jsonwebtoken"); // Ensure you import jwt

// // Registration handler
// const createUser= async (req:Request, res:Response, next:NextFunction) => {
//     const{name,email,password}=req.body;
   
//     if (!name ||!email||!password) {
//         const error =createHttpError(400,"All fields are required");
//         return next(error);
//     }

//     try {
//         const user = await userModel.findOne({email:email})
//         if (user) {
//             const error=createHttpError(400,"User already exists with this email");
//             return next(error);
//         }
//     } catch (error) {
//         return next(createHttpError(500,`Error while getting user ${error}`));
//     }
    
//     const hashPassword = await bcrypt.hash(password,10);
//     let newUser:User;
//     try {
//         newUser = await userModel.create({
//             name,
//             email,
//             password: hashPassword,
//         });
//     } catch (error) {
//         return next(createHttpError(500, `Error while creating user ${error}`));
//     }

//     try {
//         const accessToken = jwt.sign({ sub: newUser._id }, config.jwtSecret as string, { expiresIn: "15m" });
//         const refreshToken = jwt.sign({ sub: newUser._id }, config.jwtRefreshSecret as string, { expiresIn: "30d" });

//         // Store refreshToken in DB (this is optional, but recommended for security)
//         newUser.refreshToken = refreshToken;
//         await newUser.save();

//         res.json({
//             id: newUser._id,
//             accessToken,
//             refreshToken,
//         });
//     } catch (error) {
//         return next(createHttpError(500, `Error while signing the JWT token ${error}`));
//     }
//     next();
// };

// // Login handler
// const loginUser=async(req:Request,res:Response,next:NextFunction)=>{
//     const {email,password}=req.body;
//     if (!email||!password) {
//         return next(createHttpError(400,"All fields are required"));
//     }

//     let user:User|null;
//     try {
//         user = await userModel.findOne({email});
//         if (!user) {
//             return next(createHttpError(404,"User not found"));
//         }
//     } catch (error) {
//         return next(createHttpError(400,`Error while finding user ${error}`));
//     }

//     try {
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return next(createHttpError(400,"Username or password is incorrect"));
//         }
//     } catch (error) {
//         return next(createHttpError(500,`Error while comparing password ${error}`));
//     }

//     // Generate new access and refresh tokens
//     try {
//         const accessToken = jwt.sign({ sub: user._id }, config.jwtSecret as string, { expiresIn: "15m" });
//         const refreshToken = jwt.sign({ sub: user._id }, config.jwtRefreshSecret as string, { expiresIn: "30d" });

//         user.refreshToken = refreshToken;
//         await user.save();

//         res.json({
//             accessToken,
//             refreshToken
//         });
//     } catch (error) {
//         return next(createHttpError(500,`Error while signing the JWT token ${error}`));
//     }
//     next();
// }










// const jwt = require("jsonwebtoken");

// const createUser= async (
//     req:Request,
//     res:Response,
//     next:NextFunction
// )=>{

//     const{name,email,password}=req.body;
   
//     //validation
//     if (!name ||!email||!password) {
//         const error =createHttpError(400,"All fields are required");
//         return next(error);
        
//     }
//     //database call
//     try {
//         const user=await userModel.findOne({email:email})
//     if (user) {
//         const error=createHttpError(400,"User already exist with this email");
//         return next(error);
//     }
//     } catch (error) {
//         return next(createHttpError(500,`Error while getting user ${error}`))
        
//     }
    
//     // password->hash
//     const hashPassword= await bcrypt.hash(password,10);
// let newUser:User;
//     try {
//          newUser= await userModel.create({
//             name,
//             email,
//             password:hashPassword,
//         })
        
//     } catch (error) {
//         return next(createHttpError(500,`error while creating user ${error}`))
        
//     }

    
//     //token generation JWT
//     try {
//         const token=sign({sub:newUser._id},config.jwtSecret as string,{expiresIn:"10d"});


//     //process
//     //response
//     res.json({
//         id:newUser._id,
//         accessToken:token,
//     })
//     } catch (error) {
//         return next(createHttpError(500,`error while signing the jwt toeken ${error}`))
        
//     }
    
//     next();

// }
// const loginUser=async(req:Request,res:Response,next:NextFunction)=>{
//     const {email,password}=req.body;

//     if (!email||!password) {
//         return next(createHttpError(400,"All fields are required"))
        
//     }
//     let user:User|null;

//     try {
//         user =await userModel.findOne({email})
    
//         if (!user) {
//             return next(createHttpError(404,"User not found"))
            
//         }
//     } catch (error) {
//         return next(createHttpError(400,`Error while finding user ${error}`))//(400,Error while finding user (user not found))
        
//     }
    
//     try {
//         const isMatch=await bcrypt.compare(password,user.password)
//         if (!isMatch) {
//             return next(createHttpError(400,"Username or password is incorrect"))
            
//         }
//     } catch (error) {
//         return next(createHttpError(500,`Error while comparing password ${error}`))
        
//     }

//     //create accesstoken
//     try {
//         const token =sign({sub:user._id},config.jwtSecret as string,{expiresIn:"10d"});
    
    
//         res.json({
//             accessToken:token
//         })
//     } catch (error) {
//         return next(createHttpError(500,`Error while signing the jwt token ${error}`))
//     }
//     next();
// }
// export {createUser,loginUser};