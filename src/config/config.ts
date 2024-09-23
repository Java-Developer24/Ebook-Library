import { config as conf} from "dotenv";

conf();

const _config={
port:process.env.PORT,
};

export const config=Object.freeze(_config);//freeze helps us to make the object immutable/unchangeable