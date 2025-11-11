import mongoose, { Schema, Types } from "mongoose";

export interface ResumeAnalysisDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  analysis: unknown; // structured JSON
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeAnalysisSchema = new Schema<ResumeAnalysisDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    analysis: { type: Schema.Types.Mixed, required: true },
    model: { type: String, required: true },
  },
  { timestamps: true }
);

export const ResumeAnalysisModel =
  mongoose.models.ResumeAnalysis ||
  mongoose.model<ResumeAnalysisDoc>("ResumeAnalysis", ResumeAnalysisSchema);


