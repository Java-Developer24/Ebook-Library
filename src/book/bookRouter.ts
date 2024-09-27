import express from "express"
import { createBook, Listbooks, updateBook } from "./bookController";
import multer from "multer";
import path from "node:path";
import authenticate from "../middlewares/authenticate";


const bookRouter=express.Router();
const upload=multer({
    dest:path.resolve(__dirname,"../../public/data/uploads"),
    limits:{fileSize:10 * 1024 * 1024}
})

bookRouter.post("/",authenticate,upload.fields([
    {name:"coverImage",maxCount:1},
    {name:"file",maxCount:3e7}
]),createBook);

bookRouter.patch("/:bookId",authenticate,upload.fields([
    {name:"coverImage",maxCount:1},
    {name:"file",maxCount:3e7}
]),updateBook);

bookRouter.get("/",Listbooks)

export default bookRouter;