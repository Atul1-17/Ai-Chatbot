import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET
});

const uploadOnCloudinary = async (fileBuffer) => {
    try {
        if (!fileBuffer) return null;

        return await new Promise((resolve, reject) => {

            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) {
                        console.log("Cloudinary Upload Error:", error);
                        return reject(error);
                    }

                    resolve(result);
                }
            );

            streamifier.createReadStream(fileBuffer).pipe(stream);
        });

    } catch (error) {
        console.log("Error uploading to Cloudinary:", error);
        return null;
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;

        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
        });

        return response;

    } catch (error) {
        console.log("Error deleting image:", error);
        return null;
    }
};

export {
    uploadOnCloudinary,
    deleteFromCloudinary
};