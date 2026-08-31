/* Analytics & Activity Visualizer Module */

async function loadDashboard() {
  try {
    const data = await apiRequest('/analytics/dashboard');
    if (data.success) {
      const m = data.metrics;
      document.getElementById('metric-docs-count').innerText = m.total_documents;
      document.getElementById('metric-storage').innerText = (m.total_storage_bytes / 1024).toFixed(1) + ' KB';
      document.getElementById('metric-workspaces-count').innerText = m.total_workspaces;
      document.getElementById('metric-notes-count').innerText = m.total_notes;

      renderWorkspaceStorageChart(data.workspace_stats);
      renderTopKeywordsCloud(data.top_keywords);
      renderRecentActivityTimeline(data.recent_activities);
    }
  } catch (err) {}
}

function renderWorkspaceStorageChart(stats) {
  const container = document.getElementById('workspace-chart-container');
  if (!container) return;

  if (!stats || stats.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); padding: 1rem;">No workspace data available</div>`;
    return;
  }

  const maxStorage = Math.max(...stats.map(s => s.total_size), 1024);

  container.innerHTML = stats.map(ws => {
    const heightPct = Math.max(15, Math.min(100, (ws.total_size / maxStorage) * 100));
    const kb = (ws.total_size / 1024).toFixed(1) + ' KB';

    return `
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end;">
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.4rem;">${kb}</div>
        <div style="width: 100%; max-width: 48px; height: ${heightPct}%; background: ${ws.color || '#4f46e5'}; border-radius: 8px 8px 0 0; transition: height 0.5s ease;"></div>
        <div style="font-size: 0.8rem; font-weight: 600; margin-top: 0.5rem; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px;">${escapeHtml(ws.name)}</div>
      </div>
    `;
  }).join('');
}

function renderTopKeywordsCloud(keywords) {
  const container = document.getElementById('top-keywords-cloud');
  if (!container) return;

  if (!keywords || keywords.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted);">No keywords extracted yet.</div>`;
    return;
  }

  container.innerHTML = keywords.map(kw => `
    <span class="keyword-pill" style="font-size: ${0.75 + (kw.frequency * 0.1)}rem; padding: 0.3rem 0.7rem;">
      ${escapeHtml(kw.keyword)} (${kw.frequency})
    </span>
  `).join('');
}

function renderRecentActivityTimeline(activities) {
  const container = document.getElementById('activity-timeline');
  if (!container) return;

  if (!activities || activities.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted);">No recent activities logged.</div>`;
    return;
  }

  container.innerHTML = activities.map(act => `
    <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
      <div style="width: 10px; height: 10px; background: var(--accent-primary); border-radius: 50%;"></div>
      <div style="flex: 1;">
        <div style="font-size: 0.9rem; font-weight: 600;">${escapeHtml(act.details)}</div>
        <div style="font-size: 0.78rem; color: var(--text-subtle);">
          By ${escapeHtml(act.user_name || 'System')} • ${new Date(act.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  `).join('');
}
