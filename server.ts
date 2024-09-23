import { config } from './src/config/config';
import app from './src/app';


const server=()=>{
    console.log(config.port);
    
    const port=config.port ;

    app.listen(port,()=>{
        console.log(`server is listening on ${port}`);
        
    })

};

server();