import { supabase } from "./supabase.js";

// Existing login form
const loginForm = document.getElementById("login");

// Existing signup form
const signupForm = document.getElementById("signup-form");

// Message areas
const loginMessage = document.getElementById("login-message");
const signupMessage = document.getElementById("signup-message");

function showMessage(element, message, isError = false) {
  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#b00020" : "#228b22";
}

// -------------------------
// LOGIN
// -------------------------

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    showMessage(loginMessage, "Logging in...");

    const username =
      document.getElementById("login-username")?.value.trim();

    const password =
      document.getElementById("login-password")?.value;

    if (!username || !password) {
      showMessage(loginMessage, "Enter your username and password.", true);
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username.toLowerCase(),
          password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Login failed.");
      }

      if (!result.access_token || !result.refresh_token) {
        throw new Error("The login server returned an invalid response.");
      }

      const { error } = await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token
      });

      if (error) throw error;

      showMessage(loginMessage, "Successfully logged in!");

      // The user is now authenticated.
      // Add an account-page redirect here once account.html exists.

    } catch (error) {
      showMessage(
        loginMessage,
        error.message || "Something went wrong.",
        true
      );
    }
  });
}

// -------------------------
// SIGNUP
// -------------------------

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    showMessage(signupMessage, "Creating your account...");

    const username =
      document.getElementById("signup-username")?.value.trim();

    const email =
      document.getElementById("signup-email")?.value.trim();

    const password =
      document.getElementById("signup-password")?.value;

    const confirmPassword =
      document.getElementById("signup-confirm")?.value;

    if (!username || !email || !password || !confirmPassword) {
      showMessage(signupMessage, "Please complete all required fields.", true);
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      showMessage(
        signupMessage,
        "Username must be 3–20 characters and contain only letters, numbers, and underscores.",
        true
      );
      return;
    }

    if (password.length < 8) {
      showMessage(
        signupMessage,
        "Your password must be at least 8 characters long.",
        true
      );
      return;
    }

    if (password !== confirmPassword) {
      showMessage(signupMessage, "Your passwords do not match.", true);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase()
          },
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;

      if (data.session) {
        showMessage(signupMessage, "Your account was created successfully!");
      } else {
        showMessage(
          signupMessage,
          "Account created! Check your email to confirm your account."
        );
      }

      signupForm.reset();

    } catch (error) {
      showMessage(
        signupMessage,
        error.message || "Could not create your account.",
        true
      );
    }
  });
}
