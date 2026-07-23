const AUTH_STORAGE_KEY = 'miranda-clinic-auth';
const AUTH_TTL_MS = 12 * 60 * 60 * 1000;

function getAuthElements() {
  return {
    overlay: document.getElementById('loginOverlay') || document.getElementById('authOverlay'),
    form: document.getElementById('loginForm') || document.getElementById('authForm'),
    username: document.getElementById('usernameInput') || document.getElementById('authUsername'),
    password: document.getElementById('passwordInput') || document.getElementById('authPassword'),
    error: document.getElementById('loginError') || document.getElementById('authMessage'),
    appContent: document.getElementById('appContent')
  };
}

function readStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
  } catch (error) {
    console.error(error);
    return null;
  }
}

function clearExpiredAuth() {
  const auth = readStoredAuth();
  if (auth && Date.now() > auth.expiresAt) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function isSessionValid() {
  const auth = readStoredAuth();
  return Boolean(auth && auth.username === 'admin' && Date.now() < auth.expiresAt);
}

function saveAuth() {
  const expiresAt = Date.now() + AUTH_TTL_MS;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ username: 'admin', expiresAt }));
}

function showLogin(message = '') {
  const { overlay, error, username, appContent } = getAuthElements();
  if (!overlay) return;
  overlay.classList.remove('hidden');
  if (appContent) {
    appContent.classList.add('hidden');
  }
  if (error) {
    error.textContent = message;
  }
  if (username) {
    username.focus();
  }
}

function hideLogin() {
  const { overlay, error, appContent } = getAuthElements();
  if (!overlay) return;
  overlay.classList.add('hidden');
  if (appContent) {
    appContent.classList.remove('hidden');
  }
  if (error) {
    error.textContent = '';
  }
}

function updateAuthButtons() {
  document.querySelectorAll('[data-auth-button]').forEach((button) => {
    button.textContent = isSessionValid() ? 'Logout' : 'Login';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  clearExpiredAuth();
  updateAuthButtons();

  document.querySelectorAll('[data-auth-button]').forEach((button) => {
    button.addEventListener('click', () => {
      if (isSessionValid()) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        updateAuthButtons();
        if (window.location.pathname === '/control') {
          window.location.href = '/';
        }
        return;
      }
      showLogin();
    });
  });

  const { form, username, password, error, overlay } = getAuthElements();
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const usernameValue = username ? username.value.trim() : '';
      const passwordValue = password ? password.value : '';

      if (usernameValue === 'admin' && passwordValue === 'miranda_12345') {
        saveAuth();
        updateAuthButtons();
        hideLogin();
        document.dispatchEvent(new CustomEvent('auth:success'));
        if (window.location.pathname !== '/control') {
          window.location.href = '/control';
        }
      } else if (error) {
        error.textContent = 'Incorrect username or password.';
      }
    });
  }

  if (overlay) {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        hideLogin();
      }
    });
  }

  if (window.location.pathname === '/control') {
    if (isSessionValid()) {
      hideLogin();
      document.dispatchEvent(new CustomEvent('auth:success'));
    } else {
      showLogin('Please sign in to access the control panel.');
    }
  }
});
