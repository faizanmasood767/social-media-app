// Builds a single post <div class="card post"> element, wired up with
// like/comment/delete behavior. Used by both the feed page and profile page.
function buildPostCard(post, onDeleted) {
  const me = Auth.getUser();
  const mine = me && me.id === post.user_id;
  const el = document.createElement("div");
  el.className = "card post";
  el.dataset.postId = post.id;
  el.innerHTML = `
    <div class="post-head">
      ${avatarHtml(post.author, 40)}
      <div class="post-meta">
        <a href="profile.html?id=${post.user_id}" class="post-author">${escapeHtml(post.author.username)}</a>
        <span class="post-time">${timeAgo(post.created_at)}</span>
        <div class="post-content">${escapeHtml(post.content)}</div>
        <div class="post-actions">
          <button class="action-btn like-btn ${post.likedByMe ? "liked" : ""}">
            ${post.likedByMe ? "♥" : "♡"} <span class="like-count">${post.likesCount}</span>
          </button>
          <button class="action-btn comment-toggle">💬 <span class="comment-count">${post.commentsCount}</span></button>
          ${mine ? `<button class="post-delete">Delete</button>` : ""}
        </div>
        <div class="comments"></div>
      </div>
    </div>
  `;

  el.querySelector(".like-btn").addEventListener("click", () => togglePostLike(el, post));
  el.querySelector(".comment-toggle").addEventListener("click", () => togglePostComments(el, post.id));
  const delBtn = el.querySelector(".post-delete");
  if (delBtn) {
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this post? This can't be undone.")) return;
      try {
        await Api.deletePost(post.id);
        el.remove();
        showToast("Post deleted.");
        if (onDeleted) onDeleted();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  return el;
}

async function togglePostLike(el, post) {
  const btn = el.querySelector(".like-btn");
  const countEl = btn.querySelector(".like-count");
  const currentlyLiked = btn.classList.contains("liked");
  try {
    if (currentlyLiked) {
      await Api.unlike(post.id);
      btn.classList.remove("liked");
      btn.firstChild.textContent = "♡ ";
      countEl.textContent = Math.max(0, parseInt(countEl.textContent, 10) - 1);
    } else {
      await Api.like(post.id);
      btn.classList.add("liked");
      btn.firstChild.textContent = "♥ ";
      countEl.textContent = parseInt(countEl.textContent, 10) + 1;
    }
  } catch (err) {
    showToast(err.message, true);
  }
}

async function togglePostComments(el, postId) {
  const box = el.querySelector(".comments");
  if (box.classList.contains("open")) {
    box.classList.remove("open");
    return;
  }
  box.classList.add("open");
  box.innerHTML = `<div class="loading">Loading comments…</div>`;
  try {
    const { comments } = await Api.getComments(postId);
    renderCommentsBox(box, postId, comments, el);
  } catch (err) {
    box.innerHTML = `<div class="loading">${escapeHtml(err.message)}</div>`;
  }
}

function renderCommentsBox(box, postId, comments, postEl) {
  box.innerHTML = "";
  if (comments.length === 0) {
    const empty = document.createElement("div");
    empty.className = "loading";
    empty.textContent = "No comments yet — say something!";
    box.appendChild(empty);
  } else {
    comments.forEach((c) => box.appendChild(buildCommentRow(c)));
  }

  const form = document.createElement("form");
  form.className = "comment-form";
  form.innerHTML = `<input type="text" placeholder="Write a comment…" maxlength="300" required />
    <button type="submit" class="btn btn--primary btn--small">Send</button>`;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = form.querySelector("input");
    const content = input.value.trim();
    if (!content) return;
    try {
      const { comment } = await Api.addComment(postId, content);
      if (box.querySelector(".loading")) box.innerHTML = "";
      box.insertBefore(buildCommentRow(comment), form);
      input.value = "";
      const countEl = postEl.querySelector(".comment-count");
      countEl.textContent = parseInt(countEl.textContent, 10) + 1;
    } catch (err) {
      showToast(err.message, true);
    }
  });
  box.appendChild(form);
}

function buildCommentRow(comment) {
  const row = document.createElement("div");
  row.className = "comment";
  row.innerHTML = `
    ${avatarHtml(comment.author, 30)}
    <div class="comment-body">
      <a href="profile.html?id=${comment.user_id}" class="comment-author">${escapeHtml(comment.author.username)}</a>
      <span class="comment-time">${timeAgo(comment.created_at)}</span>
      <div>${escapeHtml(comment.content)}</div>
    </div>
  `;
  return row;
}
