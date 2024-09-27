import globalErrorHandler from './middlewares/globalErrorHandler';
import cors from "cors";

import express  from "express"
import userRouter from './user/userRouter';
import bookRouter from './book/bookRouter';
import { config } from './config/config';

const app =express();
app.use(cors({
   origin:config.frontendDomain,

}));
app.use(express.json());

app.get("/",(req,res)=>{
   res.json({message:"Welcome to Elib API's"});
});
app.use("/api/users",userRouter);
app.use("/api/users/books",bookRouter)
//global error handler
app.use(globalErrorHandler);
    


export default app;