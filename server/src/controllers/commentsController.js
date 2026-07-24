const supabase = require("../config/supabaseClient");

// GET /api/posts/:postId/comments
async function getComments(req, res) {
  try {
    const { postId } = req.params;
    const { data: comments, error } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id, author:users(id, username, avatar_color)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json({ comments });
  } catch (err) {
    console.error("getComments error:", err.message);
    res.status(500).json({ error: "Could not load comments." });
  }
}

// POST /api/posts/:postId/comments  (protected)
async function addComment(req, res) {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "A comment can't be empty." });
    }
    if (content.length > 300) {
      return res.status(400).json({ error: "Comments can be at most 300 characters." });
    }

    const { data: post } = await supabase.from("posts").select("id").eq("id", postId).maybeSingle();
    if (!post) return res.status(404).json({ error: "Post not found." });

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: req.user.id, content: content.trim() })
      .select("id, content, created_at, user_id, author:users(id, username, avatar_color)")
      .single();

    if (error) throw error;
    res.status(201).json({ comment });
  } catch (err) {
    console.error("addComment error:", err.message);
    res.status(500).json({ error: "Could not add your comment." });
  }
}

// DELETE /api/comments/:id  (protected, owner-only)
async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const { data: comment } = await supabase.from("comments").select("user_id").eq("id", id).maybeSingle();

    if (!comment) return res.status(404).json({ error: "Comment not found." });
    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own comments." });
    }

    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) throw error;
    res.json({ deleted: true });
  } catch (err) {
    console.error("deleteComment error:", err.message);
    res.status(500).json({ error: "Could not delete that comment." });
  }
}

module.exports = { getComments, addComment, deleteComment };
