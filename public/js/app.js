/* Application Main Controller & Navigation Module */

document.addEventListener('DOMContentLoaded', async () => {
  const isAuth = await checkAuthStatus();
  if (isAuth) {
    initApp();
  }
});

async function initApp() {
  await loadWorkspaces();
  await loadDashboard();
  loadDocuments();
}

function switchView(viewName) {
  const pages = document.querySelectorAll('.view-page');
  pages.forEach(p => p.classList.remove('active'));

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(n => n.classList.remove('active'));

  const targetPage = document.getElementById(`view-${viewName}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  const activeNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (activeNav) {
    activeNav.classList.add('active');
  }

  // Load view data
  if (viewName === 'dashboard') loadDashboard();
  if (viewName === 'documents') loadDocuments();
  if (viewName === 'workspaces') loadWorkspaces();
  if (viewName === 'bookmarks') loadBookmarks();
  if (viewName === 'notes') loadNotes();
  if (viewName === 'activity') loadDashboard();
}

/* Modal Controller Helpers */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function openUploadModal() {
  openModal('upload-modal');
}

function openWorkspaceModal() {
  openModal('workspace-modal');
}

/* Keyboard Shortcut: Ctrl + K for Search Modal */
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openSearchModal();
  }
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }
});

/* Dark / Light Theme Toggle */
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);

  if (currentUser) {
    currentUser.theme_preference = newTheme;
    apiRequest('/auth/profile', 'PUT', { theme_preference: newTheme }).catch(() => {});
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.innerText = theme === 'dark' ? '🌙' : '☀️';
  }
}
