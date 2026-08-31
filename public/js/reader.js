/* Interactive Document Reader Module */
let activeReaderDocId = null;

async function openReaderModal(docId) {
  activeReaderDocId = docId;
  openModal('reader-modal');

  document.getElementById('reader-title').innerText = 'Loading Document...';
  document.getElementById('reader-meta').innerText = 'Reading file content & computing AI summary...';
  document.getElementById('reader-content-text').innerText = 'Loading document text...';
  document.getElementById('reader-ai-summary').innerText = 'Extracting local AI summary...';
  document.getElementById('reader-keywords').innerHTML = '';
  document.getElementById('reader-similar-docs').innerHTML = 'Finding similar documents...';

  try {
    const data = await apiRequest(`/documents/${docId}`);
    if (data.success && data.document) {
      const doc = data.document;
      document.getElementById('reader-title').innerText = doc.title;
      document.getElementById('reader-meta').innerText = `${doc.file_type.toUpperCase()} • ${doc.workspace_name} • ⏱️ ${doc.reading_time_minutes} min read`;
      document.getElementById('reader-content-text').innerText = doc.content_text || 'No text content available.';

      document.getElementById('reader-ai-summary').innerText = doc.summary || 'Summary unavailable.';

      // Download trigger button setup
      document.getElementById('reader-download-btn').onclick = () => {
        window.location.href = `/api/documents/${doc.id}/download`;
      };

      document.getElementById('reader-bookmark-btn').onclick = () => {
        toggleBookmarkDoc(doc.id);
      };

      // Keywords render
      if (doc.keywords && doc.keywords.length > 0) {
        document.getElementById('reader-keywords').innerHTML = doc.keywords.map(kw => 
          `<span class="keyword-pill">${escapeHtml(kw.keyword)} (${(kw.score * 100).toFixed(0)}%)</span>`
        ).join('');
      } else {
        document.getElementById('reader-keywords').innerText = 'No keywords extracted.';
      }

      // Similar documents render
      if (doc.similarDocuments && doc.similarDocuments.length > 0) {
        document.getElementById('reader-similar-docs').innerHTML = doc.similarDocuments.map(sim => `
          <div style="padding: 0.4rem 0; border-bottom: 1px dashed var(--border-color); cursor: pointer;" onclick="openReaderModal(${sim.id})">
            <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(sim.title)}</div>
            <div style="font-size: 0.78rem; color: var(--accent-secondary);">${sim.similarityScore}% Cosine Match</div>
          </div>
        `).join('');
      } else {
        document.getElementById('reader-similar-docs').innerText = 'No similar documents found in repository.';
      }
    }
  } catch (err) {}
}

async function submitReaderNote() {
  const content = document.getElementById('reader-note-input').value;
  if (!content || !content.trim()) {
    showToast('Please enter note text.', 'error');
    return;
  }

  try {
    const data = await apiRequest('/notes', 'POST', {
      document_id: activeReaderDocId,
      content: content.trim()
    });

    if (data.success) {
      showToast('Note added successfully!', 'success');
      document.getElementById('reader-note-input').value = '';
      loadNotes();
      loadDashboard();
    }
  } catch (err) {}
}
