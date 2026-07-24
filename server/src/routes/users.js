const express = require("express");
const router = express.Router();
const { requireAuth, optionalAuth } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} = require("../controllers/usersController");
const { getPostsByUser } = require("../controllers/postsController");

router.get("/:id", optionalAuth, getProfile);
router.put("/:id", requireAuth, updateProfile);

router.post("/:id/follow", requireAuth, followUser);
router.delete("/:id/follow", requireAuth, unfollowUser);

router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);

router.get("/:id/posts", optionalAuth, getPostsByUser);

module.exports = router;
