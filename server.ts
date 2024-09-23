import { config } from './src/config/config';
import app from './src/app';
import connectDB from './src/config/db';


const server=async()=>{
    await connectDB();
    
    
    const port=config.port ;

    app.listen(port,()=>{
        console.log(`server is listening on ${port}`);
        
    })

};

server();