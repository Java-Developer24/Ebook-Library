import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';



    // Configuration
    cloudinary.config({ 
        cloud_name: config.cloudinaryCloud, 
        api_key: config.cloudinaryApiKey, 
        api_secret: config.cloudinaryApiSecret, // Click 'View API Keys' above to copy your API secret
    });
    
   

    export default cloudinary;
    
   