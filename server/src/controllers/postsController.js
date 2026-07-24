const supabase = require("../config/supabaseClient");

const AUTHOR_FIELDS = "author:users(id, username, avatar_color)";

// Attach likesCount, commentsCount, and likedByMe to a list of raw post rows
async function enrichPosts(posts, viewerId) {
  if (posts.length === 0) return [];
  const postIds = posts.map((p) => p.id);

  const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
    supabase.from("likes").select("post_id, user_id").in("post_id", postIds),
    supabase.from("comments").select("post_id").in("post_id", postIds),
  ]);

  const likeCounts = {};
  const likedByMe = new Set();
  (likeRows || []).forEach((row) => {
    likeCounts[row.post_id] = (likeCounts[row.post_id] || 0) + 1;
    if (viewerId && row.user_id === viewerId) likedByMe.add(row.post_id);
  });

  const commentCounts = {};
  (commentRows || []).forEach((row) => {
    commentCounts[row.post_id] = (commentCounts[row.post_id] || 0) + 1;
  });

  return posts.map((p) => ({
    ...p,
    likesCount: likeCounts[p.id] || 0,
    commentsCount: commentCounts[p.id] || 0,
    likedByMe: likedByMe.has(p.id),
  }));
}

// GET /api/posts?scope=all|following
async function getFeed(req, res) {
  try {
    const scope = req.query.scope === "following" ? "following" : "all";

    let userIds = null;
    if (scope === "following") {
      if (!req.user) return res.status(401).json({ error: "Log in to see your following feed." });
      const { data: followRows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", req.user.id);
      userIds = (followRows || []).map((r) => r.following_id);
      userIds.push(req.user.id); // include your own posts too
    }

    let query = supabase
      .from("posts")
      .select(`id, content, created_at, user_id, ${AUTHOR_FIELDS}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (userIds) query = query.in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    const { data: posts, error } = await query;
    if (error) throw error;

    const enriched = await enrichPosts(posts, req.user && req.user.id);
    res.json({ posts: enriched });
  } catch (err) {
    console.error("getFeed error:", err.message);
    res.status(500).json({ error: "Could not load the feed." });
  }
}

// GET /api/posts/:id
async function getPost(req, res) {
  try {
    const { id } = req.params;
    const { data: post, error } = await supabase
      .from("posts")
      .select(`id, content, created_at, user_id, ${AUTHOR_FIELDS}`)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!post) return res.status(404).json({ error: "Post not found." });

    const [enriched] = await enrichPosts([post], req.user && req.user.id);
    res.json({ post: enriched });
  } catch (err) {
    console.error("getPost error:", err.message);
    res.status(500).json({ error: "Could not load that post." });
  }
}

// GET /api/users/:id/posts  -> posts for one profile
async function getPostsByUser(req, res) {
  try {
    const { id } = req.params;
    const { data: posts, error } = await supabase
      .from("posts")
      .select(`id, content, created_at, user_id, ${AUTHOR_FIELDS}`)
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const enriched = await enrichPosts(posts, req.user && req.user.id);
    res.json({ posts: enriched });
  } catch (err) {
    console.error("getPostsByUser error:", err.message);
    res.status(500).json({ error: "Could not load posts for that user." });
  }
}

// POST /api/posts  (protected)
async function createPost(req, res) {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "A post needs some content." });
    }
    if (content.length > 500) {
      return res.status(400).json({ error: "Posts can be at most 500 characters." });
    }

    const { data: post, error } = await supabase
      .from("posts")
      .insert({ user_id: req.user.id, content: content.trim() })
      .select(`id, content, created_at, user_id, ${AUTHOR_FIELDS}`)
      .single();

    if (error) throw error;
    res.status(201).json({ post: { ...post, likesCount: 0, commentsCount: 0, likedByMe: false } });
  } catch (err) {
    console.error("createPost error:", err.message);
    res.status(500).json({ error: "Could not create your post." });
  }
}

// DELETE /api/posts/:id  (protected, owner-only)
async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const { data: post } = await supabase.from("posts").select("user_id").eq("id", id).maybeSingle();

    if (!post) return res.status(404).json({ error: "Post not found." });
    if (post.user_id !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own posts." });
    }

    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw error;
    res.json({ deleted: true });
  } catch (err) {
    console.error("deletePost error:", err.message);
    res.status(500).json({ error: "Could not delete that post." });
  }
}

// POST /api/posts/:id/like  (protected)
async function likePost(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("likes").insert({ post_id: id, user_id: req.user.id });
    if (error && error.code !== "23505") throw error; // ignore "already liked"
    res.json({ liked: true });
  } catch (err) {
    console.error("likePost error:", err.message);
    res.status(500).json({ error: "Could not like that post." });
  }
}

// DELETE /api/posts/:id/like  (protected)
async function unlikePost(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("likes").delete().eq("post_id", id).eq("user_id", req.user.id);
    if (error) throw error;
    res.json({ liked: false });
  } catch (err) {
    console.error("unlikePost error:", err.message);
    res.status(500).json({ error: "Could not unlike that post." });
  }
}

module.exports = { getFeed, getPost, getPostsByUser, createPost, deletePost, likePost, unlikePost };
