const express = require("express");
const router = express.Router();
const { requireAuth, optionalAuth } = require("../middleware/auth");
const {
  getFeed,
  getPost,
  createPost,
  deletePost,
  likePost,
  unlikePost,
} = require("../controllers/postsController");
const { getComments, addComment } = require("../controllers/commentsController");

router.get("/", optionalAuth, getFeed);
router.post("/", requireAuth, createPost);
router.get("/:id", optionalAuth, getPost);
router.delete("/:id", requireAuth, deletePost);

router.post("/:id/like", requireAuth, likePost);
router.delete("/:id/like", requireAuth, unlikePost);

router.get("/:postId/comments", getComments);
router.post("/:postId/comments", requireAuth, addComment);

module.exports = router;
