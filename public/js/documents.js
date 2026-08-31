/* Documents Management Module */

async function loadDocuments() {
  const workspaceId = document.getElementById('filter-workspace').value;
  const fileType = document.getElementById('filter-file-type').value;
  const search = document.getElementById('filter-search').value;

  let query = '/documents?';
  if (workspaceId) query += `workspace_id=${workspaceId}&`;
  if (fileType) query += `file_type=${fileType}&`;
  if (search) query += `search=${encodeURIComponent(search)}&`;

  try {
    const data = await apiRequest(query);
    if (data.success) {
      renderDocumentsGrid('documents-grid', data.documents);
    }
  } catch (err) {}
}

async function loadBookmarks() {
  try {
    const data = await apiRequest('/documents?favorite=true');
    if (data.success) {
      renderDocumentsGrid('bookmarks-grid', data.documents);
    }
  } catch (err) {}
}

function renderDocumentsGrid(containerId, docs) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!docs || docs.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem;">No documents found.</p>
        <button class="btn-primary" style="margin-top: 1rem;" onclick="openUploadModal()">Upload First Document</button>
      </div>
    `;
    return;
  }

  container.innerHTML = docs.map(doc => {
    const badgeClass = `badge-${doc.file_type || 'txt'}`;
    const formattedSize = (doc.file_size / 1024).toFixed(1) + ' KB';
    const isBookmarked = doc.is_bookmarked > 0 || doc.is_favorite === 1;

    return `
      <div class="doc-card glass-panel" onclick="openReaderModal(${doc.id})">
        <div class="doc-card-header">
          <span class="file-type-badge ${badgeClass}">${(doc.file_type || 'TXT').toUpperCase()}</span>
          <button style="background: none; border: none; font-size: 1.1rem; cursor: pointer;" onclick="event.stopPropagation(); toggleBookmarkDoc(${doc.id})">
            ${isBookmarked ? '⭐' : '☆'}
          </button>
        </div>
        <div>
          <h4 class="doc-title">${escapeHtml(doc.title)}</h4>
          <p class="doc-summary-preview">${escapeHtml(doc.summary || 'No summary available.')}</p>
        </div>
        <div class="doc-card-footer">
          <span>📁 ${escapeHtml(doc.workspace_name || 'General')}</span>
          <span>⏱️ ${doc.reading_time_minutes || 1} min • ${formattedSize}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleBookmarkDoc(docId) {
  try {
    const data = await apiRequest(`/documents/${docId}/bookmark`, 'POST');
    if (data.success) {
      showToast(data.bookmarked ? 'Added to bookmarks' : 'Removed from bookmarks', 'success');
      loadDocuments();
      loadBookmarks();
    }
  } catch (err) {}
}

document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const workspaceId = document.getElementById('upload-workspace-id').value;
  const title = document.getElementById('upload-title').value;
  const fileInput = document.getElementById('upload-file');
  const tags = document.getElementById('upload-tags').value;

  if (!fileInput.files[0]) {
    showToast('Please select a file to upload.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('workspace_id', workspaceId);
  if (title) formData.append('title', title);
  if (tags) formData.append('tags', tags);

  try {
    showToast('Processing file with local AI engine...', 'info');
    const data = await apiRequest('/documents/upload', 'POST', formData, true);
    if (data.success) {
      showToast('Document uploaded & analyzed successfully!', 'success');
      closeModal('upload-modal');
      document.getElementById('upload-form').reset();
      loadDocuments();
      loadDashboard();
    }
  } catch (err) {}
});

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}
