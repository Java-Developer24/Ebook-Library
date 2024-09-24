import { NextFunction, Request, Response } from "express";
import path from 'node:path'
import cloudinary from "../config/cloudinary";
import bookModel from "./bookModel";
import fs from "node:fs"
// import createHttpError from "http-errors";

const createBook= async(req:Request,res:Response,next:NextFunction)=>{
  const{title,genre}=req.body;
    const files=req.files as {[fieldname:string]:Express.Multer.File[]};
   
    console.log('files',req.files);

    
   try {
    //uploading cover image to cloudinary
    const converImageMimetype=files.coverImage[0].mimetype.split('/').at(-1);
    const fileName=files.coverImage[0].filename;
   
    const filePath=path.resolve(__dirname,"../../public/data/uploads",fileName);
    
     const uploadResult= await cloudinary.uploader.upload(filePath,{
         filename_override:fileName,
         folder:"book-covers",
         format:converImageMimetype
     })
 
     console.log(uploadResult);

 
 
    //uploading pdf file to cloudinary

  
    const bookFileName=files.file[0].filename;
     const bookFilePath=path.resolve(__dirname,"../../public/data/uploads",bookFileName);
      const bookFileUploadResult=await cloudinary.uploader.upload(bookFilePath,{
          resource_type:"raw",
          filename_override:bookFileName,
          folder:"book-pfds",
          format:"pdf"
      })
      console.log("bookFileUploadResult:",bookFileUploadResult);
      //pushing data to database
      const newBook= await bookModel.create({
        title,
        genre,
        author:"66f2ea9438fee39da0ae5958",
        coverImage:uploadResult.secure_url,
        file:bookFileUploadResult.secure_url,
      });

      //delete temp files
      await fs.promises.unlink(filePath);
      await fs.promises.unlink(bookFilePath);

      
 
      res.status(201)
      .json({
        message:"Book created successfully",
      id:newBook._id})
     
    }catch (error) {
    console.log(error)
    // return next(createHttpError(500,`Error while uploading book file ${error}`))
    
  }
    
    
   
    
    
    next();

}

export {createBook}