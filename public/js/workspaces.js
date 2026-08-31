/* Workspaces Management Module */
let workspacesList = [];

async function loadWorkspaces() {
  try {
    const data = await apiRequest('/workspaces');
    if (data.success) {
      workspacesList = data.workspaces;
      renderWorkspacesGrid();
      populateWorkspaceDropdowns();
    }
  } catch (err) {}
}

function renderWorkspacesGrid() {
  const container = document.getElementById('workspaces-grid');
  if (!container) return;

  container.innerHTML = workspacesList.map(ws => {
    const formattedStorage = (ws.total_storage_bytes / 1024).toFixed(1) + ' KB';

    return `
      <div class="metric-card glass-panel" style="flex-direction: column; align-items: flex-start; gap: 1rem; cursor: pointer;" onclick="filterByWorkspace(${ws.id}, '${escapeHtml(ws.name)}')">
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 16px; height: 16px; background: ${ws.color || '#4f46e5'}; border-radius: 4px;"></div>
            <h3 style="font-size: 1.15rem;">${escapeHtml(ws.name)}</h3>
          </div>
          <span style="font-size: 0.8rem; background: var(--bg-tertiary); padding: 0.2rem 0.6rem; border-radius: 10px;">${ws.doc_count} docs</span>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.4;">${escapeHtml(ws.description || 'No description.')}</p>
        <div style="font-size: 0.8rem; color: var(--text-subtle); margin-top: auto; display: flex; justify-content: space-between; width: 100%;">
          <span>Storage: ${formattedStorage}</span>
          <span>Created by ${escapeHtml(ws.creator_name || 'Admin')}</span>
        </div>
      </div>
    `;
  }).join('');
}

function populateWorkspaceDropdowns() {
  const filterSelect = document.getElementById('filter-workspace');
  const uploadSelect = document.getElementById('upload-workspace-id');

  if (filterSelect) {
    const currentVal = filterSelect.value;
    filterSelect.innerHTML = `<option value="">All Workspaces</option>` + workspacesList.map(ws => 
      `<option value="${ws.id}">${escapeHtml(ws.name)}</option>`
    ).join('');
    filterSelect.value = currentVal;
  }

  if (uploadSelect) {
    uploadSelect.innerHTML = workspacesList.map(ws => 
      `<option value="${ws.id}">${escapeHtml(ws.name)}</option>`
    ).join('');
  }
}

function filterByWorkspace(wsId, wsName) {
  document.getElementById('current-workspace-name').innerText = wsName;
  document.getElementById('filter-workspace').value = wsId;
  switchView('documents');
  loadDocuments();
}

document.getElementById('workspace-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('ws-name').value;
  const description = document.getElementById('ws-desc').value;

  try {
    const data = await apiRequest('/workspaces', 'POST', { name, description });
    if (data.success) {
      showToast('Workspace created!', 'success');
      closeModal('workspace-modal');
      document.getElementById('workspace-form').reset();
      loadWorkspaces();
      loadDashboard();
    }
  } catch (err) {}
});
