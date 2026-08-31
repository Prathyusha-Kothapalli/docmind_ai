/* API Helper Utilities */
const API_BASE = '/api';

function getAuthToken() {
  return localStorage.getItem('docmind_token');
}

function setAuthToken(token) {
  if (token) {
    localStorage.setItem('docmind_token', token);
  } else {
    localStorage.removeItem('docmind_token');
  }
}

async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {
  const headers = {};
  const token = getAuthToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        setAuthToken(null);
        showAuthScreen();
      }
      throw new Error(data.error || 'An API error occurred');
    }

    return data;
  } catch (err) {
    showToast(err.message || 'Network request failed', 'error');
    throw err;
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  if (type === 'error') {
    toast.style.borderLeftColor = 'var(--accent-danger)';
  } else if (type === 'success') {
    toast.style.borderLeftColor = 'var(--accent-secondary)';
  }

  toast.innerHTML = `<span>${type === 'error' ? '⚠️' : 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
