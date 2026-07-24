const supabase = require("../config/supabaseClient");
const { publicUser } = require("./authController");

// GET /api/users/:id  -> profile + counts, and whether the viewer follows them
async function getProfile(req, res) {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!user) return res.status(404).json({ error: "User not found." });

    const [{ count: postsCount }, { count: followersCount }, { count: followingCount }] = await Promise.all([
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", id),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", id),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", id),
    ]);

    let isFollowing = false;
    if (req.user && req.user.id !== id) {
      const { data: followRow } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", req.user.id)
        .eq("following_id", id)
        .maybeSingle();
      isFollowing = !!followRow;
    }

    res.json({
      user: publicUser(user),
      postsCount: postsCount || 0,
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      isFollowing,
      isOwnProfile: req.user ? req.user.id === id : false,
    });
  } catch (err) {
    console.error("getProfile error:", err.message);
    res.status(500).json({ error: "Could not load that profile." });
  }
}

// PUT /api/users/:id  -> update your own bio (protected, owner-only)
async function updateProfile(req, res) {
  try {
    const { id } = req.params;
    if (req.user.id !== id) {
      return res.status(403).json({ error: "You can only edit your own profile." });
    }

    const { bio } = req.body;
    const { data: user, error } = await supabase
      .from("users")
      .update({ bio: (bio || "").slice(0, 280) })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error("updateProfile error:", err.message);
    res.status(500).json({ error: "Could not update your profile." });
  }
}

// POST /api/users/:id/follow  -> follow a user (protected)
async function followUser(req, res) {
  try {
    const followingId = req.params.id;
    const followerId = req.user.id;

    if (followingId === followerId) {
      return res.status(400).json({ error: "You can't follow yourself." });
    }

    const { data: target } = await supabase.from("users").select("id").eq("id", followingId).maybeSingle();
    if (!target) return res.status(404).json({ error: "User not found." });

    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: followerId, following_id: followingId });

    if (error && error.code !== "23505") throw error; // ignore "already following"

    res.json({ following: true });
  } catch (err) {
    console.error("followUser error:", err.message);
    res.status(500).json({ error: "Could not follow that user." });
  }
}

// DELETE /api/users/:id/follow  -> unfollow a user (protected)
async function unfollowUser(req, res) {
  try {
    const followingId = req.params.id;
    const followerId = req.user.id;

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (error) throw error;
    res.json({ following: false });
  } catch (err) {
    console.error("unfollowUser error:", err.message);
    res.status(500).json({ error: "Could not unfollow that user." });
  }
}

// GET /api/users/:id/followers
async function getFollowers(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("follows")
      .select("follower:users!follows_follower_id_fkey(id, username, bio, avatar_color)")
      .eq("following_id", id);

    if (error) throw error;
    res.json({ followers: data.map((row) => row.follower) });
  } catch (err) {
    console.error("getFollowers error:", err.message);
    res.status(500).json({ error: "Could not load followers." });
  }
}

// GET /api/users/:id/following
async function getFollowing(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("follows")
      .select("following:users!follows_following_id_fkey(id, username, bio, avatar_color)")
      .eq("follower_id", id);

    if (error) throw error;
    res.json({ following: data.map((row) => row.following) });
  } catch (err) {
    console.error("getFollowing error:", err.message);
    res.status(500).json({ error: "Could not load following list." });
  }
}

module.exports = { getProfile, updateProfile, followUser, unfollowUser, getFollowers, getFollowing };
