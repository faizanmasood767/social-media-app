const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabaseClient");

const PALETTE = ["#3D5A45", "#D9A441", "#8B5E3C", "#4B6584", "#7A4B69", "#3D6B6B"];
function colorFor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatar_color: user.avatar_color,
    created_at: user.created_at,
  };
}

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email and password are all required." });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: "Username must be between 3 and 30 characters." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .or(`username.eq.${username},email.eq.${email}`)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: "That username or email is already taken." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from("users")
      .insert({ username, email, password_hash, avatar_color: colorFor(username) })
      .select()
      .single();

    if (error) throw error;

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("register error:", err.message);
    res.status(500).json({ error: "Something went wrong while creating your account." });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .or(`username.eq.${username},email.eq.${username}`)
      .maybeSingle();

    if (!user) {
      return res.status(401).json({ error: "Incorrect username or password." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Incorrect username or password." });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("login error:", err.message);
    res.status(500).json({ error: "Something went wrong while logging you in." });
  }
}

module.exports = { register, login, publicUser };
