import express from 'express';
import { createNewPost, getAllPosts, getPost, getPostsByUser, deletePost } from '../controller/post.controller.js';
import { getUserByHeader } from '../middleware/authMiddleware.js'

const router = express.Router();
router.use(getUserByHeader);

router.route('/create-post').post(createNewPost);
router.route('/get-all-posts').get(getAllPosts);
router.route('/get-post/:id').get(getPost);
router.route('/get-posts-by-user/:id').get(getPostsByUser);
router.route('/delete-post/:postId').delete(deletePost);

export default router;