// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with error handling
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('Cloudinary environment variables not found. Using fallback storage.');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Force HTTPS
});

export async function uploadToCloudinary(
  buffer: Buffer, 
  fileName: string, 
  mimeType: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'image' as const,
      public_id: fileName,
      folder: 'expense-tracker/avatars', // Better organization
      transformation: [
        { 
          width: 400, 
          height: 400, 
          crop: 'fill',
          gravity: 'face', // Focus on face if detected
          quality: 'auto:good', // Automatic quality optimization
          format: 'auto' // Automatic format selection (WebP, AVIF, etc.)
        }
      ],
      eager: [ // Generate thumbnails immediately
        { width: 150, height: 150, crop: 'thumb', gravity: 'face' }
      ],
      overwrite: true, // Allow overwriting existing images
      invalidate: true, // Invalidate CDN cache
      use_filename: false,
      unique_filename: true
    };

    console.log('Uploading to Cloudinary:', { fileName, mimeType });

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (!result) {
          console.error('Cloudinary upload returned no result');
          reject(new Error('Cloudinary upload returned no result'));
        } else {
          console.log('Cloudinary upload successful:', result.secure_url);
          resolve(result.secure_url);
        }
      }
    ).end(buffer);
  });
}

export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  try {
    // Extract public_id from Cloudinary URL
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567/expense-tracker/avatars/avatar_123.jpg
    const matches = imageUrl.match(/\/v\d+\/(.+)\./);
    if (matches && matches[1]) {
      const publicId = matches[1];
      console.log('Deleting from Cloudinary:', publicId);
      
      const result = await cloudinary.uploader.destroy(publicId);
      console.log('Cloudinary delete result:', result);
    } else {
      console.warn('Could not extract public_id from Cloudinary URL:', imageUrl);
    }
  } catch (error) {
    console.warn('Failed to delete from Cloudinary:', error);
    // Don't throw error - deletion failure shouldn't block the operation
  }
}

// Test Cloudinary connection
export async function testCloudinaryConnection(): Promise<boolean> {
  try {
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection test:', result);
    return result.status === 'ok';
  } catch (error) {
    console.error('Cloudinary connection failed:', error);
    return false;
  }
}
