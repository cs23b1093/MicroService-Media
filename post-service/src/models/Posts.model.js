import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    // post title, post content, createdAt, ..., 
    postTitle: {
        type: String,
        required: true
    },
    postContent: {
        type: String,
        required: true
    },
    mediaIds: [{
        type: String
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true});

postSchema.index({ 'postTitle': 'text' });

export const Post = mongoose.model('Post', postSchema);