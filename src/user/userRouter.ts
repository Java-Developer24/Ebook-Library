import express from "express"
import {createUser, loginUser, refreshAccessToken} from "./userController"

const userRouter=express.Router();

userRouter.post("/register",createUser);
userRouter.post("/login",loginUser);
userRouter.post("/refresh-token", refreshAccessToken);  // Refresh token endpoint


export default userRouter;