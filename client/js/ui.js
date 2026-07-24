// Shared helpers used across pages.

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function initials(username) {
  return username.slice(0, 2).toUpperCase();
}

function avatarHtml(user, size = 40) {
  return `<span class="avatar" style="--avatar-color:${user.avatar_color || "#3D5A45"};width:${size}px;height:${size}px;font-size:${size * 0.4}px">${initials(
    user.username
  )}</span>`;
}

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  const steps = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.345, "w"],
    [12, "mo"],
    [Infinity, "y"],
  ];
  let value = seconds;
  let unit = "s";
  for (const [factor, label] of steps) {
    if (value < factor) {
      unit = label;
      break;
    }
    value = Math.floor(value / factor);
    unit = label;
  }
  if (unit === "s" && value < 5) return "just now";
  return `${value}${unit} ago`;
}

function showToast(message, isError = false) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = isError ? "toast toast--error show" : "toast show";
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

// Renders the top navbar into <div id="navbar"></div>. Call on every page.
function renderNavbar(activePage) {
  const el = document.getElementById("navbar");
  if (!el) return;
  const user = Auth.getUser();

  el.innerHTML = `
    <div class="nav-inner">
      <a href="index.html" class="brand">field<span>notes</span></a>
      <nav class="nav-links">
        ${
          user
            ? `
          <a href="index.html" class="${activePage === "feed" ? "active" : ""}">Feed</a>
          <a href="profile.html?id=${user.id}" class="${activePage === "profile" ? "active" : ""}">My profile</a>
          <button id="logoutBtn" class="nav-logout">Log out</button>
          <span class="nav-user">${avatarHtml(user, 30)}</span>
        `
            : `
          <a href="login.html" class="${activePage === "login" ? "active" : ""}">Log in</a>
          <a href="register.html" class="btn btn--primary btn--small ${activePage === "register" ? "active" : ""}">Sign up</a>
        `
        }
      </nav>
    </div>
  `;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      Auth.clearSession();
      window.location.href = "login.html";
    });
  }
}

// Call at the top of pages that require login
function requireLoginOrRedirect() {
  if (!Auth.isLoggedIn()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}
