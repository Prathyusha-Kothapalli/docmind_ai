/* Notes & Annotations Management Module */

async function loadNotes() {
  try {
    const data = await apiRequest('/notes');
    if (data.success) {
      renderNotesList(data.notes);
    }
  } catch (err) {}
}

function renderNotesList(notes) {
  const container = document.getElementById('notes-list-container');
  if (!container) return;

  if (!notes || notes.length === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="text-align: center; padding: 3rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem;">No notes or highlights recorded yet.</p>
        <p style="font-size: 0.85rem; margin-top: 0.5rem;">Open any document in the repository and add notes or highlights in the document reader.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notes.map(note => {
    return `
      <div class="glass-panel" style="padding: 1.25rem; display: flex; align-items: flex-start; justify-content: space-between; border-left: 4px solid ${note.color || '#fef08a'};">
        <div>
          <div style="font-size: 0.8rem; color: var(--accent-primary); font-weight: 600; margin-bottom: 0.2rem;">
            📄 ${escapeHtml(note.document_title || 'Document')} (Page ${note.page_number || 1})
          </div>
          <p style="font-size: 0.95rem; color: var(--text-main); line-height: 1.5;">${escapeHtml(note.content)}</p>
          <div style="font-size: 0.78rem; color: var(--text-subtle); margin-top: 0.5rem;">
            By ${escapeHtml(note.author_name || 'User')} • ${new Date(note.created_at).toLocaleDateString()}
          </div>
        </div>
        <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.3rem 0.6rem; color: var(--accent-danger);" onclick="deleteNote(${note.id})">
          Delete
        </button>
      </div>
    `;
  }).join('');
}

async function deleteNote(noteId) {
  if (!confirm('Are you sure you want to delete this note?')) return;

  try {
    const data = await apiRequest(`/notes/${noteId}`, 'DELETE');
    if (data.success) {
      showToast('Note deleted', 'success');
      loadNotes();
      loadDashboard();
    }
  } catch (err) {}
}
