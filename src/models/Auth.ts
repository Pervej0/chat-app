import mongoose, { Document, Schema } from "mongoose";

export interface IAuth extends Document {
  user: mongoose.Types.ObjectId;
  refreshToken: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const authSchema = new Schema<IAuth>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Auth = mongoose.model<IAuth>("Auth", authSchema);