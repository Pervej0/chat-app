import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "user" | "admin" | "superadmin";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  id: string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("id").get(function () {
  return this._id.toString();
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

export const User = mongoose.model<IUser>("User", userSchema);