"use server";

import cloudinary from "@/lib/cloudinary";

export async function uploadImage(file: File) {
  if (!file) return { success: false };

  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "posts", resource_type: "image" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return { success: true, url: uploadResult.secure_url };
  } catch (err) {
    console.error("Cloudinary Upload Failed:", err);
    return { success: false };
  }
}
