import { v2 as cloudinary } from "cloudinary";

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

export function initCloudinary() {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary env vars are not set");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadImageToCloudinary(
  input: string | Buffer,
  folder = "ai-content-writer/images"
) {
  const options: Record<string, unknown> = { folder };
  if (typeof input !== "string") {
    // buffer upload (assumes image/png)
    const base64 = `data:image/png;base64,${Buffer.from(input).toString("base64")}`;
    const result = await cloudinary.uploader.upload(base64, options);
    return result.secure_url;
  }
  // remote url or data URL
  const result = await cloudinary.uploader.upload(input, options);
  return result.secure_url;
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folder = "ai-content-writer/resumes"
) {
  const base64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(base64, {
    folder,
    public_id: fileName ? fileName.replace(/\.[^/.]+$/, "") : undefined,
    resource_type: "auto",
  } as any);
  return result.secure_url;
}


