import { NextFunction, Request, Response } from "express"; // Importing necessary types from express
import path from 'node:path'; // Importing path module for handling file paths
import cloudinary from "../config/cloudinary"; // Importing the cloudinary configuration for image uploads
import bookModel from "./bookModel"; // Importing the book model to interact with the database
import fs from "node:fs"; // Importing the fs module for file system operations
import createHttpError from "http-errors";
// import createHttpError from "http-errors"; // Uncomment to use for error handling

// Function to create a new book
const createBook = async (req: Request, res: Response, next: NextFunction) => {
  // Destructuring title and genre from the request body
  const { title, genre } = req.body;

  // Typecasting req.files to access uploaded files with proper typings
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  // Logging the uploaded files for debugging purposes
  console.log('files', req.files);

  try {
    // Uploading the cover image to Cloudinary
    // Get the file type of the cover image (e.g., png, jpg)
    const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1);
    const fileName = files.coverImage[0].filename; // Get the uploaded cover image filename

    // Construct the file path to the uploaded cover image
    const filePath = path.resolve(__dirname, "../../public/data/uploads", fileName);

    // Uploading the cover image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName, // Use the original file name in Cloudinary
      folder: "book-covers", // Specify the Cloudinary folder for storage
      format: coverImageMimeType // Set the file format based on the uploaded image
    });

    // Logging the result of the upload for debugging
    console.log(uploadResult);

// @ts-expect-error The error is expected here, so we add a description to explain why it's necessary
console.log("userId",req.userId);
    

    // Uploading the PDF file to Cloudinary
    const bookFileName = files.file[0].filename; // Get the uploaded PDF filename
    const bookFilePath = path.resolve(__dirname, "../../public/data/uploads", bookFileName); // Construct the file path to the uploaded PDF

    // Uploading the PDF file to Cloudinary
    const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath, {
      resource_type: "raw", // Specify that the file being uploaded is not an image
      filename_override: bookFileName, // Use the original file name in Cloudinary
      folder: "book-pdfs", // Specify the Cloudinary folder for storage
      format: "pdf" // Set the format as PDF
    });

    // Logging the result of the PDF upload for debugging
    console.log("bookFileUploadResult:", bookFileUploadResult);

    // Pushing the book data to the database
    const newBook = await bookModel.create({
      title, // Book title from the request
      genre, // Book genre from the request
      // @ts-expect-error The error is expected here, so we add a description to explain why it's necessary
      author:req.userId,
      // author: "66f2ea9438fee39da0ae5958", // Hardcoded author ID (replace with actual dynamic data)
      coverImage: uploadResult.secure_url, // Store the secure URL of the uploaded cover image
      file: bookFileUploadResult.secure_url, // Store the secure URL of the uploaded PDF file
    });

    // Deleting temporary files from the server after upload
    await fs.promises.unlink(filePath); // Remove the cover image file from the server
    await fs.promises.unlink(bookFilePath); // Remove the PDF file from the server

    // Sending a success response back to the client
    res.status(201).json({
      message: "Book created successfully", // Success message
      id: newBook._id // ID of the newly created book
    });
  } catch (error) {
    console.log(error); // Log any errors that occur during the process
    // Uncomment the following line to handle errors properly
    return next(createHttpError(500, `Error while uploading book file ${error}`));
  }

  next(); // Call the next middleware in the chain (optional in this context)
};

export { createBook }; // Export the createBook function for use in other parts of the application




















//......................>,,,,,,,,,,,,>old code with my comments ....................>,,,,,,,,>
// import { NextFunction, Request, Response } from "express";
// import path from 'node:path'
// import cloudinary from "../config/cloudinary";
// import bookModel from "./bookModel";
// import fs from "node:fs"
// // import createHttpError from "http-errors";

// const createBook= async(req:Request,res:Response,next:NextFunction)=>{
//   const{title,genre}=req.body;
//   // we are typecasting the multer to get data  in filess
//     const files=req.files as {[fieldname:string]:Express.Multer.File[]};
   
//     console.log('files',req.files);

    
//    try {
//     //uploading cover image to cloudinary
//     //mimetype is type of file we are uploading ,it will be image/png/pdf
//     const converImageMimeType=files.coverImage[0].mimetype.split('/').at(-1);
//     const fileName=files.coverImage[0].filename;
   
//     const filePath=path.resolve(__dirname,"../../public/data/uploads",fileName);
//     //uploading image to cloudinary
//      const uploadResult= await cloudinary.uploader.upload(filePath,{
//          filename_override:fileName,
//          folder:"book-covers",
//          format:converImageMimeType
//      })
 
//      console.log(uploadResult);

 
 
//     //uploading pdf file to cloudinary

  
//     const bookFileName=files.file[0].filename;
//      const bookFilePath=path.resolve(__dirname,"../../public/data/uploads",bookFileName);
//       const bookFileUploadResult=await cloudinary.uploader.upload(bookFilePath,{
//           resource_type:"raw",
//           filename_override:bookFileName,
//           folder:"book-pfds",
//           format:"pdf"
//       })
//       console.log("bookFileUploadResult:",bookFileUploadResult);
    
      
//       //pushing data to database
//       const newBook= await bookModel.create({
//         title,
//         genre,
//         author:"66f2ea9438fee39da0ae5958",
//         coverImage:uploadResult.secure_url,
//         file:bookFileUploadResult.secure_url,
//       });

//       //delete temp files
//       await fs.promises.unlink(filePath);
//       await fs.promises.unlink(bookFilePath);

      
 
//       res.status(201)
//       .json({
//         message:"Book created successfully",
//       id:newBook._id})
     
//     }catch (error) {
//     console.log(error)
//     // return next(createHttpError(500,`Error while uploading book file ${error}`))
    
//   }
    
    
   
    
    
//     next();

// }

// export {createBook}