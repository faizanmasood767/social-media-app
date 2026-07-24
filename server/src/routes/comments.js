const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { deleteComment } = require("../controllers/commentsController");

router.delete("/:id", requireAuth, deleteComment);

module.exports = router;
