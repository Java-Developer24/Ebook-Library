import createHttpError from 'http-errors';
import globalErrorHandler from './middlewares/globalErrorHandler';

import express  from "express"

const app =express();

app.get("/",(req,res)=>{
    const error=createHttpError(400,"something went wrong");
    throw error;

    res.json({message:"Welcome to Elib API's"});
});
//global error handler
app.use(globalErrorHandler);
    


export default app;