import mongoose from "mongoose";

const codeSnippetSchema = new mongoose.Schema(
  {
    uniqueCode: { type: String, required: true, unique: true, index: true },
    code: { type: String, default: "" },
    language: { type: String, default: "text" },
  },
  { timestamps: true },
);

export const CodeSnippet = mongoose.model("CodeSnippet", codeSnippetSchema);

export type CodeSnippetDoc = {
  _id: mongoose.Types.ObjectId;
  uniqueCode: string;
  code: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
};
