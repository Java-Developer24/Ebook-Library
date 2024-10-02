import { config as conf} from "dotenv";


conf();

const _config={
port:process.env.PORT,
databaseURL:process.env.MONGO_CONNECTION_STRING,
env : process.env.NODE_ENV,
jwtSecret:process.env.JwT_SECRET,
jwtRefreshSecret:process.env.JWT_REFRESHTOKEN_SECRET,
cloudinaryCloud:process.env.CLOUDINARY_CLOUD,   
cloudinaryApiKey:process.env.CLOUDINARY_API_KEY,
cloudinaryApiSecret:process.env.CLOUDINARY_API_SECRET,
frontendDomain:process.env.FRONTEND_DOMAIN
};

export const config=Object.freeze(_config);//freeze helps us to make the object immutable/unchangeable