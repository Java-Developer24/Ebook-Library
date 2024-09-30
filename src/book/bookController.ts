import { NextFunction, Request, Response } from "express"; // Importing necessary types from express
import path from 'node:path'; // Importing path module for handling file paths
import cloudinary from "../config/cloudinary"; // Importing the cloudinary configuration for image uploads
import bookModel from "./bookModel"; // Importing the book model to interact with the database
import fs from "node:fs"; // Importing the fs module for file system operations
import createHttpError from "http-errors";
import { AuthRequest } from "../middlewares/authenticate";
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

    const _req=req as AuthRequest;
    // Pushing the book data to the database
    const newBook = await bookModel.create({
      title, // Book title from the request
      genre, // Book genre from the request
      author:_req.userId,
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

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  // Destructuring title and genre from the request body
  const { title, genre } = req.body;
  // Getting the book ID from the request parameters
  const bookId = req.params.bookId;

  try {
      // Finding the book by its ID in the database
      const book = await bookModel.findOne({ _id: bookId });
      
      // If the book is not found, return a 404 Not Found error
      if (!book) {
          return next(createHttpError(404, "Book not found"));
      }

      // Check if the authenticated user is the author of the book
      const _req = req as AuthRequest; // Typecasting req to AuthRequest
      if (book.author.toString() !== _req.userId) {
          return next(createHttpError(403, "Access denied")); // If not, return a 403 Forbidden error
      }

      // Typecasting req.files to access uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      let completeCoverImage = ""; // Variable to hold the URL of the uploaded cover image
      if (files.coverImage) {
          // If a new cover image is provided, get its filename and MIME type
          const filename = files.coverImage[0].filename; // Note: fixed typo from coverImge to coverImage
          const coverMimeType = files.coverImage[0].mimetype.split("/").at(-1);

          // Construct the file path to the uploaded cover image
          const filePath = path.resolve(__dirname, "../../public/data/uploads", filename);
          completeCoverImage = filename; // Store the filename for further use

          // Upload the cover image to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(filePath, {
              filename_override: completeCoverImage, // Use the original filename
              folder: "book-covers", // Specify the folder in Cloudinary
              format: coverMimeType, // Set the file format based on the uploaded image
          });

          // Store the secure URL of the uploaded cover image
          completeCoverImage = uploadResult.secure_url;

          // Delete the temporary file from the server
          await fs.promises.unlink(filePath);
      }

      let completeFileName = ""; // Variable to hold the URL of the uploaded PDF file
      if (files.file) {
          // If a new book file (PDF) is provided, get its filename
          const bookFilePath = path.resolve(__dirname, "../../public/data/uploads", files.file[0].filename);
          const bookFileName = files.file[0].filename; // Get the filename of the book PDF
          completeFileName = bookFileName; // Store the filename for further use
          
          // Upload the PDF file to Cloudinary
          const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
              resource_type: "raw", // Specify that the file being uploaded is a raw file (PDF)
              filename_override: completeFileName, // Use the original filename
              folder: "book-pdfs", // Specify the folder in Cloudinary
              format:'pdf',
          });

          // Store the secure URL of the uploaded PDF file
          completeFileName = uploadResultPdf.secure_url;

          // Delete the temporary file from the server
          await fs.promises.unlink(bookFilePath);
      }

      // Update the book record in the database
      const updatedBook = await bookModel.findOneAndUpdate(
          {
              _id: bookId // Find the book by its ID
          },
          {
              title: title, // Update the title
              genre: genre, // Update the genre
              coverImage: completeCoverImage ? completeCoverImage : book.coverImage, // Use the new cover image URL if provided, otherwise keep the old one
              file: completeFileName ? completeFileName : book.file, // Use the new PDF file URL if provided, otherwise keep the old one
          },
          { new: true } // Return the updated book
      );

      // Sending the updated book details back to the client
      res.json(updatedBook);
  } catch (error) {
      console.log(error); // Log any errors that occur during the process
      return next(createHttpError(500, `Error while updating the book ${error}`)); // Return a 500 Internal Server Error if something goes wrong
  }

  next(); // Call the next middleware in the chain (optional in this context)
};
const listbooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
      // Fetch all books from the database
      // TODO: Add pagination to limit the number of books returned in one request
      const books = await bookModel.find().populate("author","name"); // Using bookModel to find all books
      console.log('books',books)
      res.json(books); // Send the list of books back to the client as JSON
  } catch (error) {
      // If there's an error during the database query
      return next(createHttpError(500, `Error while getting books, ${error}`)); // Return a 500 Internal Server Error with error message
  }
};

const getSingleBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId; // Extract the bookId from the request parameters
  try {
      // Find a single book by its ID
      const book = await bookModel.findById({ _id: bookId })
      .populate("author","name")
      
      ; // Using bookModel to find the book by its ID
      if (!book) { // Check if the book was found
          return next(createHttpError(404, `Book not found`)); // If not found, return a 404 Not Found error
      }
      res.json(book); // Send the found book back to the client as JSON
  } catch (error) {
      // If there's an error during the database query
      return next(createHttpError(500, `Error while getting the book, ${error}`)); // Return a 500 Internal Server Error with error message
  }
};
const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId; // Extract the book ID from the request parameters

  try {
      // Find the book in the database using the provided book ID
      const book = await bookModel.findById({ _id: bookId });
      
      // If the book is not found, return a 404 error
      if (!book) {
          return next(createHttpError(404, "Book not found"));
      }
    
      // Check if the current user is authorized to delete the book
      const _req = req as AuthRequest; // Typecast req to AuthRequest to access userId
      if (book.author.toString() !== _req.userId) {
          // If the user is not the author of the book, return a 403 error
          return next(createHttpError(403, "Access denied"));
      }

      // Extract the public ID of the cover image from the Cloudinary URL
      const coverFileSplits = book.coverImage.split("/");
      const coverImagePublicId = coverFileSplits.at(-2) + "/" + coverFileSplits.at(-1)?.split(".").at(-2);
    
      // Extract the public ID of the book file from the Cloudinary URL
      const bookFileSplits = book.file.split("/");
      const bookFilePublicId = bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);
    
      // Delete the cover image and book file from Cloudinary
      await cloudinary.uploader.destroy(coverImagePublicId); // Delete the cover image
      await cloudinary.uploader.destroy(bookFilePublicId, { resource_type: "raw" }); // Delete the book file (PDF)

      // Delete the book from the database
      await bookModel.findByIdAndDelete({ _id: bookId });
    
      // Send a 204 No Content response indicating successful deletion
      return res.sendStatus(204).json({ message: "Book deleted" });
    
  } catch (error) {
      console.log(error); // Log any error that occurs
      return next(createHttpError(500, "Error while deleting book")); // Return a 500 Internal Server Error
  }
};




export { createBook,updateBook,listbooks,getSingleBook,deleteBook }; // Export the createBook function for use in other parts of the application




















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

// const updateBook= async(req:Request,res:Response,next:NextFunction)=>{
//   const {title,genre}=req.body;
//   const bookId=req.params.bookId;
//   try {
//     const book=await bookModel.findOne({_id:bookId});
//     if(!book){
//     return next(createHttpError(404,"Book not found"));
//     }
//     //check access
//     const _req=req as AuthRequest;
//     if(book.author.toString()!==_req.userId){
//       return next(createHttpError(403,"Access denied"));
//     }
//     const files = req.files as { [fieldname: string]: Express.Multer.File[] };
//     let completeCoverImage="";
//     if (files.coverImage) {
//       const filename=files.coverImge[0].filename;
//       const coverMimeType=files.coverImage[0].mimetype.split("/").at(-1);
  
//       const filePath=path.resolve(__dirname
//         ,"../../public/data/uploads",filename);
//         completeCoverImage=filename;
//         const uploadResult= await cloudinary.uploader.upload(filePath,{
//           filename_override:completeCoverImage,
//           folder:"book-covers",
//           format: coverMimeType,
  
//         });
  
//         completeCoverImage=uploadResult.secure_url;
  
//         await fs.promises.unlink(filePath);
//    }
//    let completeFileName="";
//     if (files.file) {
//       const bookFilePath=path.resolve(__dirname,"../../public/data/uploads",files.file[0].filename);
      
//       const bookFileName=files.file[0].filename;
//       completeFileName=bookFileName;
//       const uploadResultPdf=await cloudinary.uploader.upload(bookFilePath,{
//         source_type:"raw",
//         filename_override:completeFileName,
//         folder:"book-pdfs",
//       });
//       completeFileName=uploadResultPdf.secure_url;
//       await fs.promises.unlink(bookFilePath);
//     }
  
//     const updatedBook= await bookModel.findOneAndUpdate(
//       {
//         _id:bookId
//       },
//       {title:title,
//         genre:genre,
//         coverImage:completeCoverImage?completeCoverImage:book.coverImage,
//         file:completeFileName?completeFileName:book.file,
      
//     },
//   {new:true}) 
  
//     res.json(updatedBook);
//   } catch (error) {
//     console.log(error); 
//     return next(createHttpError(500, `Error while updating the  book  ${error}`));
//   }

//   next();
    
//   }
// const listbooks=async(req:Request,res:Response,next:NextFunction)=>{
//   try {
//     //todo add pagination.
//     const book=await bookModel.find();
//     res.json(book);

    
//   } catch (error) {
//     return next(createHttpError(500,`Error while getting a books,${error}`));
  
//   }
// }

// const getSingleBook=async(req:Request,res:Response,next:NextFunction)=>{
//   const bookid=req.params.bookId
//   try {

//     const book= await bookModel.findById({_id:bookid});
//     if(!book){ 
      
//       return next(createHttpError(404,`Book not found`))};
//     res.json(book);
    
//   } catch (error) {
//     return next(createHttpError(500, `Error while getting a book,${error}`));
    
//   }

// }
// const deleteBook=async(req: Request, res: Response, next: NextFunction)=>{
//   const bookid=req.params.bookId;

//   try {
//     const book=await bookModel.findById({_id:bookid});
//     if(!book){
//       return  next(createHttpError(404,"book not found"));
//     }
  
//     //check access
//     const _req=req as AuthRequest;
//     if(book.author.toString()!==_req.userId){
//       return next(createHttpError(403,"Access denied"));
//     }
//     const coverFileSplits=book.coverImage.split("/");
//     const coverImagePublicId=coverFileSplits.at(-2)+"/"+coverFileSplits.at(-1)?.split(".").at(-2);
  
//     const bookFileSplits=book.file.split("/");
//     const bookFilePublicId=bookFileSplits.at(-2)+"/"+bookFileSplits.at(-1);
//     await cloudinary.uploader.destroy(coverImagePublicId);
//     await cloudinary.uploader.destroy(bookFilePublicId,{resource_type:"raw"});
//     await bookModel.findByIdAndDelete({_id:bookid});
  
//     return res.sendStatus(204).json({message:"book deleted"});
  
//   } catch (error) {
//     console.log(error);
//     return next(createHttpError(500,"error while deleting book"));
    
//   }

// };

// export {createBook}