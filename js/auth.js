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

    const username = document.getElementById("login-username")?.value.trim();
    const password = document.getElementById("login-password")?.value;

    showMessage("login-message", "Logging in...");

    try {
      await sendRequest("/api/login", { username, password });

      showMessage("login-message", "Successfully logged in!");

      // Redirect when you have created an account page:
      // window.location.href = "/account.html";
    } catch (error) {
      showMessage("login-message", error.message, true);
    }
  });
}

// SIGNUP
if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("signup-username")?.value.trim();
    const password = document.getElementById("signup-password")?.value;
    const confirm = document.getElementById("signup-confirm")?.value;

    if (!username || !password || !confirm) {
      showMessage("signup-message", "Please fill in all required fields.", true);
      return;
    }

    if (password !== confirm) {
      showMessage("signup-message", "Your passwords do not match.", true);
      return;
    }

    const birthdayMonth = signupForm.elements.namedItem("birthday_month")?.value;
    const birthdayDay = signupForm.elements.namedItem("birthday_day")?.value;
    const birthdayYear = signupForm.elements.namedItem("birthday_year")?.value;

    let birthday = null;

    if (birthdayMonth && birthdayDay && birthdayYear) {
      const month = String(birthdayMonth).padStart(2, "0");
      const day = String(birthdayDay).padStart(2, "0");
      birthday = `${birthdayYear}-${month}-${day}`;
    }

    const gender = signupForm.elements.namedItem("gender")?.value || null;

    showMessage("signup-message", "Creating your account...");

    try {
      await sendRequest("/api/signup", {
        username,
        password,
        birthday,
        gender
      });

      showMessage("signup-message", "Your account has been created!");

      signupForm.reset();

      // Redirect when you have created an account page:
      // window.location.href = "/account.html";
    } catch (error) {
      showMessage("signup-message", error.message, true);
    }
  });
}

// Check whether a visitor already has a session
async function checkLogin() {
  try {
    const response = await fetch("/api/me", {
      credentials: "same-origin"
    });

    if (!response.ok) return null;

    const result = await response.json();
    return result.user;
  } catch {
    return null;
  }
}

window.uraniumAuth = {
  checkLogin,

  async logout() {
    await sendRequest("/api/logout", {});
    window.location.href = "/";
  }
};
