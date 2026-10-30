const loginForm = document.getElementById("login");
const signupForm = document.getElementById("signup-form");

function showMessage(id, message, isError = false) {
  const element = document.getElementById(id);

  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#b00020" : "#228b22";
}

async function sendRequest(url, data) {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Unexpected server response (HTTP ${response.status}).`
    );
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Something went wrong.");
  }

  return result;
}

// LOGIN

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username =
      document.getElementById("login-username")?.value.trim();

    const password =
      document.getElementById("login-password")?.value;

    if (!username || !password) {
      showMessage(
        "login-message",
        "Enter your username and password.",
        true
      );
      return;
    }

    const button = loginForm.querySelector(".login-button");

    if (button) button.disabled = true;

    showMessage("login-message", "Logging in...");

    try {
      await sendRequest("/api/login", {
        username,
        password
      });

      showMessage("login-message", "Successfully logged in!");

      window.location.href = "/home.html";

    } catch (error) {
      showMessage("login-message", error.message, true);
    } finally {
      if (button) button.disabled = false;
    }
  });
}

// SIGNUP

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username =
      document.getElementById("signup-username")?.value.trim();

    const password =
      document.getElementById("signup-password")?.value;

    const confirm =
      document.getElementById("signup-confirm")?.value;

    if (!username || !password || !confirm) {
      showMessage(
        "signup-message",
        "Please complete all required fields.",
        true
      );
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      showMessage(
        "signup-message",
        "Username must be 3–20 characters and use only letters, numbers, and underscores.",
        true
      );
      return;
    }

    if (password.length < 8 || password.length > 128) {
      showMessage(
        "signup-message",
        "Password must be between 8 and 128 characters.",
        true
      );
      return;
    }

    if (password !== confirm) {
      showMessage(
        "signup-message",
        "Your passwords do not match.",
        true
      );
      return;
    }

    const month =
      signupForm.elements.namedItem("birthday_month")?.value;

    const day =
      signupForm.elements.namedItem("birthday_day")?.value;

    const year =
      signupForm.elements.namedItem("birthday_year")?.value;

    let birthday = null;

    if (month || day || year) {
      if (!month || !day || !year) {
        showMessage(
          "signup-message",
          "Please complete all birthday fields or leave them blank.",
          true
        );
        return;
      }

      birthday =
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const date = new Date(`${birthday}T00:00:00Z`);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== birthday ||
        date > new Date()
      ) {
        showMessage(
          "signup-message",
          "Please enter a valid birthday.",
          true
        );
        return;
      }
    }

    const gender =
      signupForm.elements.namedItem("gender")?.value || null;

    const button = signupForm.querySelector(".signup-button");

    if (button) button.disabled = true;

    showMessage("signup-message", "Creating your account...");

    try {
      await sendRequest("/api/signup", {
        username,
        password,
        birthday,
        gender
      });

      showMessage(
        "signup-message",
        "Your account has been created! Redirecting..."
      );

      window.location.href = "/home.html";

    } catch (error) {
      showMessage("signup-message", error.message, true);
    } finally {
      if (button) button.disabled = false;
    }
  });
}

// CHECK CURRENT LOGIN

async function checkLogin() {
  try {
    const response = await fetch("/api/me", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) return null;

    const result = await response.json();

    return result.user || null;

  } catch {
    return null;
  }
}

// LOGOUT

async function logout() {
  await sendRequest("/api/logout", {});
  window.location.href = "/index.html";
}

window.uraniumAuth = {
  checkLogin,
  logout
};
