/* Full-Text Search Module (Ctrl+K Overlay) */
let searchDebounce = null;

function openSearchModal() {
  openModal('search-modal');
  const input = document.getElementById('search-input');
  if (input) {
    input.focus();
    executeGlobalSearch();
  }
}

function executeGlobalSearch() {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(async () => {
    const query = document.getElementById('search-input').value.trim();
    const container = document.getElementById('search-results-list');

    if (!query) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Type keywords to execute fast SQLite FTS5 search.
        </div>
      `;
      return;
    }

    try {
      const data = await apiRequest(`/search?q=${encodeURIComponent(query)}`);
      if (data.success) {
        if (!data.results || data.results.length === 0) {
          container.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No documents match "${escapeHtml(query)}"</div>`;
          return;
        }

        container.innerHTML = data.results.map(res => `
          <div class="glass-panel" style="padding: 1rem; cursor: pointer;" onclick="closeModal('search-modal'); openReaderModal(${res.id})">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600; color: var(--accent-primary);">${escapeHtml(res.title)}</span>
              <span class="file-type-badge badge-${res.file_type}">${res.file_type.toUpperCase()}</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.4rem;">${res.matched_snippet}</p>
          </div>
        `).join('');
      }
    } catch (err) {}
  }, 250);
}
