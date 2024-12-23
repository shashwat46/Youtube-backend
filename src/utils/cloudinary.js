import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

(async function() {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET, 
    });
})();

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded successfully
        //console.log("File has been uploaded successfully on Cloudinary", response);
        fs.unlinkSync(localFilePath) //unlinks the locally saved temporary file as the file has been succesfully uploaded to cloudinary
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // unlinks the locally saved temporary file as the upload operation failed
        return null;
    }
}

export {uploadOnCloudinary}