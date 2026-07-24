if (requireLoginOrRedirect()) {
  renderNavbar("feed");
  initFeedPage();
}

function initFeedPage() {
  const feedList = document.getElementById("feedList");
  const postInput = document.getElementById("postInput");
  const charCount = document.getElementById("charCount");
  const postBtn = document.getElementById("postBtn");
  const tabAll = document.getElementById("tabAll");
  const tabFollowing = document.getElementById("tabFollowing");

  let currentScope = "all";

  postInput.addEventListener("input", () => {
    const len = postInput.value.length;
    charCount.textContent = `${len} / 500`;
    charCount.classList.toggle("limit", len >= 480);
  });

  postBtn.addEventListener("click", async () => {
    const content = postInput.value.trim();
    if (!content) return;
    postBtn.disabled = true;
    try {
      const { post } = await Api.createPost(content);
      postInput.value = "";
      charCount.textContent = "0 / 500";
      if (feedList.querySelector(".empty-state")) feedList.innerHTML = "";
      feedList.prepend(buildPostCard(post));
      showToast("Posted!");
    } catch (err) {
      showToast(err.message, true);
    } finally {
      postBtn.disabled = false;
    }
  });

  tabAll.addEventListener("click", () => switchTab("all"));
  tabFollowing.addEventListener("click", () => switchTab("following"));

  function switchTab(scope) {
    currentScope = scope;
    tabAll.classList.toggle("active", scope === "all");
    tabFollowing.classList.toggle("active", scope === "following");
    loadFeed();
  }

  async function loadFeed() {
    feedList.innerHTML = `<div class="loading">Loading posts…</div>`;
    try {
      const { posts } = await Api.getFeed(currentScope);
      renderFeed(posts);
    } catch (err) {
      feedList.innerHTML = `<div class="empty-state"><div class="big">!</div>${escapeHtml(err.message)}</div>`;
    }
  }

  function renderFeed(posts) {
    if (posts.length === 0) {
      feedList.innerHTML = `
        <div class="empty-state">
          <div class="big">✎</div>
          ${
            currentScope === "following"
              ? "Nobody you follow has posted yet. Try the All posts tab to find people."
              : "No posts yet. Be the first to write something."
          }
        </div>`;
      return;
    }
    feedList.innerHTML = "";
    posts.forEach((post) => feedList.appendChild(buildPostCard(post)));
  }

  loadFeed();
}
