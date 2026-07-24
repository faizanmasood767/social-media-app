// Small wrapper around fetch() that adds the auth token and parses JSON.

const Auth = {
  getToken() {
    return localStorage.getItem("token");
  },
  getUser() {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  isLoggedIn() {
    return !!this.getToken();
  },
};

async function apiRequest(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = Auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error("Can't reach the server. Is the backend running?");
  }

  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    // no body, that's fine for some responses
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

const Api = {
  register: (username, email, password) =>
    apiRequest("/auth/register", { method: "POST", body: { username, email, password } }),
  login: (username, password) =>
    apiRequest("/auth/login", { method: "POST", body: { username, password } }),

  getProfile: (id) => apiRequest(`/users/${id}`),
  updateProfile: (id, bio) => apiRequest(`/users/${id}`, { method: "PUT", body: { bio } }),
  follow: (id) => apiRequest(`/users/${id}/follow`, { method: "POST" }),
  unfollow: (id) => apiRequest(`/users/${id}/follow`, { method: "DELETE" }),
  getFollowers: (id) => apiRequest(`/users/${id}/followers`),
  getFollowing: (id) => apiRequest(`/users/${id}/following`),
  getPostsByUser: (id) => apiRequest(`/users/${id}/posts`),

  getFeed: (scope) => apiRequest(`/posts?scope=${scope}`),
  getPost: (id) => apiRequest(`/posts/${id}`),
  createPost: (content) => apiRequest("/posts", { method: "POST", body: { content } }),
  deletePost: (id) => apiRequest(`/posts/${id}`, { method: "DELETE" }),
  like: (id) => apiRequest(`/posts/${id}/like`, { method: "POST" }),
  unlike: (id) => apiRequest(`/posts/${id}/like`, { method: "DELETE" }),

  getComments: (postId) => apiRequest(`/posts/${postId}/comments`),
  addComment: (postId, content) =>
    apiRequest(`/posts/${postId}/comments`, { method: "POST", body: { content } }),
  deleteComment: (id) => apiRequest(`/comments/${id}`, { method: "DELETE" }),
};
