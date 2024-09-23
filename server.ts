import app from './src/app';

const server=()=>{
    const port=process.env.PORT ||3000;

    app.listen(port,()=>{
        console.log(`server is listening on ${port}`);
        
    })

};

server();