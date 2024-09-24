import { NextFunction, Request, Response } from "express";
import path from 'node:path'
import cloudinary from "../config/cloudinary";
// import createHttpError from "http-errors";

const createBook= async(req:Request,res:Response,next:NextFunction)=>{
    const files=req.files as {[fieldname:string]:Express.Multer.File[]};
   
    console.log('files',req.files);

    //uploading cover image to cloudinary
   try {
    const converImageMimetype=files.coverImage[0].mimetype.split('/').at(-1);
    const fileName=files.coverImage[0].filename;
   
    const filePath=path.resolve(__dirname,"../../public/data/uploads",fileName);
    
     const uploadResult= await cloudinary.uploader.upload(filePath,{
         filename_override:fileName,
         folder:"book-covers",
         format:converImageMimetype
     })
 
     console.log(uploadResult);

 
   } catch (error) {
    console.log(error);
    
   }
    //uploading pdf file to cloudinary

  try {
    const bookFileName=files.file[0].filename;
     const bookFilePath=path.resolve(__dirname,"../../public/data/uploads",bookFileName);
      const bookFileUploadResult=await cloudinary.uploader.upload(bookFilePath,{
          resource_type:"raw",
          filename_override:bookFileName,
          folder:"book-pfds",
          format:"pdf"
      })
      console.log("bookFileUploadResult:",bookFileUploadResult);
  } catch (error) {
    console.log(error)
    // return next(createHttpError(500,`Error while uploading book file ${error}`))
    
  }
    
    
    
    
    
    res.json({message:"Book controller"})
    next();

}

export {createBook}