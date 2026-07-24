renderNavbar(document.getElementById("loginForm") ? "login" : "register");

// If already logged in, no reason to see these forms
if (Auth.isLoggedIn()) {
  window.location.href = "index.html";
}

function showFormError(message) {
  const el = document.getElementById("formError");
  el.textContent = message;
  el.classList.add("show");
}

function clearFormError() {
  const el = document.getElementById("formError");
  el.classList.remove("show");
  el.textContent = "";
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormError();
    const submitBtn = document.getElementById("submitBtn");
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";
    try {
      const { token, user } = await Api.login(username, password);
      Auth.setSession(token, user);
      window.location.href = "index.html";
    } catch (err) {
      showFormError(err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Log in";
    }
  });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormError();
    const submitBtn = document.getElementById("submitBtn");
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";
    try {
      const { token, user } = await Api.register(username, email, password);
      Auth.setSession(token, user);
      window.location.href = "index.html";
    } catch (err) {
      showFormError(err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign up";
    }
  });
}
