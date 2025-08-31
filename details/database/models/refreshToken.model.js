import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  expiredAt: {
    type: Date,
    required: true,
  }
}, { timestamps: true });

refreshTokenSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);