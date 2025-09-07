// app/api/upload/route.js
import { v2 as cloudinary } from 'cloudinary';
import { withAuth } from '@/middleware/auth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = withAuth(async (req) => {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files');
    const type = formData.get('type'); // 'image' or 'video'

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No files provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const uploadResults = [];

    for (const file of files) {
      // Validate file type
      if (type === 'image' && !file.type.startsWith('image/')) {
        return new Response(
          JSON.stringify({ error: `Invalid file type: ${file.name}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (type === 'video' && !file.type.startsWith('video/')) {
        return new Response(
          JSON.stringify({ error: `Invalid file type: ${file.name}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate file size
      const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB for images, 50MB for videos
      if (file.size > maxSize) {
        return new Response(
          JSON.stringify({
            error: `File ${file.name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadOptions = {
            resource_type: type,
            folder: `contributions/${type}s`, // contributions/images or contributions/videos
            transformation: type === 'image'
              ? [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }]
              : [{ width: 1280, height: 720, crop: 'limit', quality: 'auto' }]
          };

          cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        uploadResults.push({
          url: result.secure_url,
          public_id: result.public_id,
          original_filename: file.name
        });

      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return new Response(
          JSON.stringify({ error: `Failed to upload ${file.name}` }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Files uploaded successfully',
        files: uploadResults
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Upload API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
