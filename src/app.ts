import globalErrorHandler from './middlewares/globalErrorHandler';

import express  from "express"
import userRouter from './user/userRouter';

const app =express();

app.get("/",(req,res)=>{
   res.json({message:"Welcome to Elib API's"});
});
app.use("/api/users",userRouter);
//global error handler
app.use(globalErrorHandler);
    


export default app;