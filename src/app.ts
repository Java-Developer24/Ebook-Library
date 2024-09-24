import globalErrorHandler from './middlewares/globalErrorHandler';

import express  from "express"
import userRouter from './user/userRouter';
import bookRouter from './book/bookRouter';

const app =express();
app.use(express.json());

app.get("/",(req,res)=>{
   res.json({message:"Welcome to Elib API's"});
});
app.use("/api/users",userRouter);
app.use("/api/user/books",bookRouter)
//global error handler
app.use(globalErrorHandler);
    


export default app;