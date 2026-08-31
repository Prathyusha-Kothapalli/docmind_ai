/* Authentication Management Module */
let currentUser = null;

function showAuthScreen() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function hideAuthScreen() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}

function setDemoAuth(email) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = 'Demo@123';
}

async function checkAuthStatus() {
  const token = getAuthToken();
  if (!token) {
    showAuthScreen();
    return false;
  }

  try {
    const data = await apiRequest('/auth/me');
    if (data.success && data.user) {
      currentUser = data.user;
      updateUserUI();
      hideAuthScreen();
      applyTheme(currentUser.theme_preference || 'dark');
      return true;
    }
  } catch (err) {
    showAuthScreen();
    return false;
  }
}

function updateUserUI() {
  if (!currentUser) return;

  const initials = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
  document.getElementById('user-avatar-initials').innerText = initials;
  document.getElementById('user-display-name').innerText = currentUser.name;

  document.getElementById('profile-name').value = currentUser.name || '';
  document.getElementById('profile-email').value = currentUser.email || '';
  document.getElementById('profile-role').value = (currentUser.role || 'user').toUpperCase();
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const data = await apiRequest('/auth/login', 'POST', { email, password });
    if (data.success) {
      setAuthToken(data.token);
      currentUser = data.user;
      updateUserUI();
      hideAuthScreen();
      showToast(`Welcome back, ${currentUser.name}!`, 'success');
      loadDashboard();
    }
  } catch (err) {
    // Handled in apiRequest
  }
});

document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('profile-name').value;

  try {
    const data = await apiRequest('/auth/profile', 'PUT', { name });
    if (data.success) {
      currentUser.name = name;
      updateUserUI();
      showToast('Profile updated successfully!', 'success');
    }
  } catch (err) {}
});

function logout() {
  setAuthToken(null);
  currentUser = null;
  showAuthScreen();
  showToast('Logged out successfully');
}
