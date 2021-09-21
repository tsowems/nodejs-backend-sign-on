import * as mongoose from "mongoose";
import User from "./user.interface";

const profileSchema = new mongoose.Schema({
  imageUrl: String,
  company: String,
  referral: String,
});

const userSchema = new mongoose.Schema(
  {
    profile: profileSchema,
    email: String,
    firstName: String,
    lastName: String,
    userRole: {type: String, enum: ["Member", "Staff", "Admin"], default: "Member" },
    userCode: String,
    resetPasswordLink: String,
    password: {
      type: String,
      get: (): undefined => undefined,
    },
    status: {
      type: String,
      enum: ["Pending", "Active"],
      default: "Pending",
    },
    confirmationCode: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    created: {type:Date, default:Date.now},
  },
  {
    toJSON: {
      virtuals: true,
      getters: true,
    },
  }
);

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const userModel = mongoose.model<User & mongoose.Document>("User", userSchema);

export default userModel;
