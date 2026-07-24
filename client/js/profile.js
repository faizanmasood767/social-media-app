if (requireLoginOrRedirect()) {
  renderNavbar("profile");
  initProfilePage();
}

function initProfilePage() {
  const params = new URLSearchParams(window.location.search);
  const profileId = params.get("id");
  const headerEl = document.getElementById("profileHeader");
  const postsEl = document.getElementById("postsList");

  if (!profileId) {
    headerEl.innerHTML = `<div class="empty-state">No profile specified.</div>`;
    return;
  }

  loadProfile();

  async function loadProfile() {
    headerEl.innerHTML = `<div class="loading">Loading profile…</div>`;
    postsEl.innerHTML = "";
    try {
      const data = await Api.getProfile(profileId);
      renderHeader(data);
      loadPosts();
    } catch (err) {
      headerEl.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
    }
  }

  function renderHeader(data) {
    const { user, postsCount, followersCount, followingCount, isFollowing, isOwnProfile } = data;

    headerEl.innerHTML = `
      <div class="card profile-header">
        ${avatarHtml(user, 66)}
        <div style="flex:1;min-width:0">
          <h2 class="profile-name">${escapeHtml(user.username)}</h2>
          <p class="profile-bio" id="bioText">${user.bio ? escapeHtml(user.bio) : "<em>No bio yet.</em>"}</p>
          <div class="profile-stats">
            <span><b>${postsCount}</b> posts</span>
            <span><b>${followersCount}</b> followers</span>
            <span><b>${followingCount}</b> following</span>
          </div>
        </div>
        <div class="profile-actions">
          ${
            isOwnProfile
              ? `<button class="btn btn--ghost btn--small" id="editBioBtn">Edit bio</button>`
              : `<button class="btn ${isFollowing ? "btn--ghost" : "btn--primary"} btn--small" id="followBtn">
                   ${isFollowing ? "Following" : "Follow"}
                 </button>`
          }
        </div>
      </div>
    `;

    if (isOwnProfile) {
      document.getElementById("editBioBtn").addEventListener("click", () => openBioEditor(user));
    } else {
      const followBtn = document.getElementById("followBtn");
      let following = isFollowing;
      followBtn.addEventListener("click", async () => {
        followBtn.disabled = true;
        try {
          if (following) {
            await Api.unfollow(profileId);
            following = false;
          } else {
            await Api.follow(profileId);
            following = true;
          }
          followBtn.textContent = following ? "Following" : "Follow";
          followBtn.classList.toggle("btn--primary", !following);
          followBtn.classList.toggle("btn--ghost", following);
          const followersEl = headerEl.querySelectorAll(".profile-stats b")[1];
          followersEl.textContent = Math.max(0, parseInt(followersEl.textContent, 10) + (following ? 1 : -1));
        } catch (err) {
          showToast(err.message, true);
        } finally {
          followBtn.disabled = false;
        }
      });
    }
  }

  function openBioEditor(user) {
    const bioText = document.getElementById("bioText");
    const current = user.bio || "";
    bioText.outerHTML = `
      <div id="bioText">
        <textarea id="bioInput" class="mono" maxlength="280" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:8px;font-family:Inter,sans-serif;">${escapeHtml(
          current
        )}</textarea>
        <div style="margin-top:8px;display:flex;gap:8px">
          <button class="btn btn--primary btn--small" id="saveBioBtn">Save</button>
          <button class="btn btn--ghost btn--small" id="cancelBioBtn">Cancel</button>
        </div>
      </div>
    `;
    document.getElementById("cancelBioBtn").addEventListener("click", () => loadProfile());
    document.getElementById("saveBioBtn").addEventListener("click", async () => {
      const newBio = document.getElementById("bioInput").value.trim();
      try {
        await Api.updateProfile(profileId, newBio);
        showToast("Bio updated.");
        loadProfile();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  async function loadPosts() {
    postsEl.innerHTML = `<div class="loading">Loading posts…</div>`;
    try {
      const { posts } = await Api.getPostsByUser(profileId);
      if (posts.length === 0) {
        postsEl.innerHTML = `<div class="empty-state">No posts yet.</div>`;
        return;
      }
      postsEl.innerHTML = "";
      posts.forEach((post) => postsEl.appendChild(buildPostCard(post, loadProfile)));
    } catch (err) {
      postsEl.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
    }
  }
}
