import { NextFunction, Request, Response } from "express"; // Importing necessary types from express
import createHttpError from "http-errors"; // Importing the http-errors package for error handling
import { verify } from "jsonwebtoken"; // Importing the verify function from jsonwebtoken for token verification
import { config } from "../config/config"; // Importing configuration settings, including JWT secret

// Extending the Request interface to include userId
export interface AuthRequest extends Request {
    userId: string; // Adding userId property to the request interface
}

// Middleware function for authenticating requests
const authenticate = (req: Request, res: Response, next: NextFunction) => {
    // Getting the token from the Authorization header
    const token = req.header("Authorization");
    
    // If no token is provided, return a 401 Unauthorized error
    if (!token) {
        return next(createHttpError(401, "Authorization  token is required"));
    }

    // Splitting the token to get the actual token value (the second part after "Bearer")
    const parsedToken = token.split(" ")[1];

    // Decoding the token sent through the header to verify it and extract payload
    const decoded = verify(parsedToken, config.jwtSecret as string);
    console.log(decoded); // Logging the decoded token payload for debugging purposes

    // Typecasting req to AuthRequest to attach userId to the request
    const _req = req as AuthRequest;
    
    // Assigning the userId from the decoded token to the request object
    _req.userId = decoded.sub as string; // Assuming the token payload has a 'sub' field representing user ID

    // Calling the next middleware in the chain
    next();
}

// Exporting the authenticate middleware for use in other parts of the application
export default authenticate;











 