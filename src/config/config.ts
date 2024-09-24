import { config as conf} from "dotenv";

conf();

const _config={
port:process.env.PORT,
databaseURL:process.env.MONGO_CONNECTION_STRING,
env : process.env.NODE_ENV,
jwtSecret:process.env.JwT_SECRET,
};

export const config=Object.freeze(_config);//freeze helps us to make the object immutable/unchangeable