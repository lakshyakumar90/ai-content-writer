import mongoose, { Schema, Types } from "mongoose";

export interface ImageGenerationDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  prompt: string;
  imageUrl: string; // Cloudinary URL
  sourceUrl?: string; // Provider returned URL (if any)
  model: string;
  size?: number;
  status: "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const ImageGenerationSchema = new Schema<ImageGenerationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    prompt: { type: String, required: true },
    imageUrl: { type: String, required: true },
    sourceUrl: { type: String },
    model: { type: String, required: true },
    size: { type: Number },
    status: { type: String, enum: ["completed", "failed"], required: true, default: "completed", index: true }
  },
  { timestamps: true }
);

export const ImageGenerationModel =
  mongoose.models.ImageGeneration ||
  mongoose.model<ImageGenerationDoc>("ImageGeneration", ImageGenerationSchema);


