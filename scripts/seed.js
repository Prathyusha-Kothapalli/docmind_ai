const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { initDatabase, run, get, all, exec } = require('../src/config/database');
const { generateSummary, extractKeywords, calculateReadingTime } = require('../src/services/aiService');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const sampleDocumentsData = [
  {
    title: 'Machine Learning Notes',
    fileName: 'Machine Learning Notes.pdf',
    fileType: 'pdf',
    workspaceName: 'AI Research',
    content: `Machine Learning Notes and Architectural Guidelines 2026.
Machine learning is a subset of artificial intelligence that empowers computer systems to learn and improve automatically from experience without being explicitly programmed.
Core learning paradigms include Supervised Learning, Unsupervised Learning, Semi-Supervised Learning, and Reinforcement Learning.
Supervised learning algorithms build a mathematical model of a set of data that contains both the inputs and the desired outputs. Common classification and regression algorithms include Linear Regression, Decision Trees, Support Vector Machines (SVM), and Neural Networks.
Unsupervised learning algorithms take a set of data that contains only inputs, and find structure in the data, like grouping or clustering of data points. K-Means clustering and Principal Component Analysis (PCA) are primary examples.
Deep Learning utilizes artificial neural networks with multiple layers to extract higher-level features from raw input data. Convolutional Neural Networks (CNNs) excel in visual imagery, while Transformer architectures (e.g., BERT, GPT, Attention mechanisms) dominate natural language processing.
Model evaluation metrics include Accuracy, Precision, Recall, F1-Score, ROC-AUC, and Mean Squared Error (MSE). Cross-validation ensures models generalize well to unseen test data.`
  },
  {
    title: 'Project Proposal',
    fileName: 'Project Proposal.docx',
    fileType: 'docx',
    workspaceName: 'AI Research',
    content: `Project Proposal: Next-Generation Enterprise Document Management System (DocMind AI).
Executive Summary:
DocMind AI aims to revolutionize enterprise knowledge discovery by uniting local document parsing, intelligent full-text search, and privacy-first extractive AI summarization into a single unified platform.
Objectives & Scope:
1. Implement local, sub-second search indexing across multi-format documents (PDF, DOCX, XLSX, TXT).
2. Guarantee 100% data privacy by executing AI summarization, keyword extraction, and document vector similarity locally without third-party cloud API dependencies.
3. Deliver a high-performance responsive web dashboard featuring workspace isolation, collaborative notes, highlights, and activity metrics.
Project Timeline & Milestones:
- Phase 1: Core Architecture, Database Schema, and JWT Authentication (Weeks 1-2).
- Phase 2: Document Processing Pipeline & Workspace Management (Weeks 3-4).
- Phase 3: Local NLP AI Engine & Full-Text Search Indexing (Weeks 5-6).
- Phase 4: Interactive Document Reader, Annotation Suite & Analytics Dashboard (Weeks 7-8).
- Phase 5: Production Docker Packaging & Quality Assurance (Weeks 9-10).`
  },
  {
    title: 'Financial Budget 2026',
    fileName: 'Financial Budget 2026.xlsx',
    fileType: 'xlsx',
    workspaceName: 'Finance',
    content: `DocMind AI Enterprise Financial Budget & Allocation Plan FY 2026.
Revenue Projections:
- Q1 Subscription Revenue: $150,000
- Q2 Enterprise Contracts: $280,000
- Q3 Annual Licensing: $410,000
- Q4 Maintenance & Upgrades: $560,000
Total Gross Annual Revenue Target: $1,400,000

Operating Expenses (OPEX):
1. Infrastructure & Edge Compute Server Upgrades: $120,000
2. Engineering & AI R&D Salaries: $650,000
3. Security Compliance & Penetration Testing: $85,000
4. Operational Tooling & DevOps Maintenance: $45,000
5. Marketing & Enterprise Business Development: $180,000
Total OPEX: $1,080,000
Net Projected Operating Profit: $320,000 (22.8% Margin).`
  },
  {
    title: 'Employee Handbook',
    fileName: 'Employee Handbook.pdf',
    fileType: 'pdf',
    workspaceName: 'Operations',
    content: `DocMind Technologies Employee Handbook and Operational Guidelines.
Welcome to DocMind Technologies! We are committed to fostering an innovative, inclusive, and secure work environment.
Code of Conduct & Data Ethics:
All employees are expected to uphold the highest standard of professional ethics. Confidential information, client data, and proprietary AI algorithms must be protected at all times.
Work Hours & Remote Policy:
We support a flexible hybrid work model. Core collaboration hours are 10:00 AM to 4:00 PM local time. Remote employees are expected to maintain active communication via primary team channels.
Information Security & Device Usage:
- Password policies require minimum 12 characters with multi-factor authentication.
- Proprietary documents must only be processed through approved local DocMind platforms.
- Unapproved external SaaS tools for document processing are strictly prohibited.
Benefits & Paid Time Off (PTO):
Employees receive 20 business days of paid vacation annually, plus 10 paid company holidays and comprehensive health, vision, and dental coverage.`
  },
  {
    title: 'Cybersecurity Guide',
    fileName: 'Cybersecurity Guide.pdf',
    fileType: 'pdf',
    workspaceName: 'Operations',
    content: `Enterprise Cybersecurity and Threat Mitigation Best Practices 2026.
Overview:
Information security is paramount in protecting organizational knowledge assets. Threats such as ransomware, phishing campaigns, zero-day vulnerabilities, and data leaks require a defense-in-depth security posture.
Key Security Domains:
1. Access Control & Identity Management: Implement Role-Based Access Control (RBAC), Least Privilege principles, and enforced session timeouts.
2. Data Encryption: Require AES-256 encryption for data at rest and TLS 1.3 for data in transit. Ensure database files and file upload repositories are restricted to authorized server processes.
3. Vulnerability Auditing: Conduct automated static code analysis, dependency vulnerability scans, and quarterly third-party penetration tests.
4. Incident Response Plan: In the event of a security breach, isolate affected nodes immediately, rotate all API keys and JWT secrets, notify stakeholders within 24 hours, and execute forensic log analysis.`
  },
  {
    title: 'Meeting Minutes',
    fileName: 'Meeting Minutes.txt',
    fileType: 'txt',
    workspaceName: 'AI Research',
    content: `DocMind AI - Weekly Engineering Alignment Meeting Minutes (Aug 28, 2026).
Attendees: Alex Rivera (Lead Architect), Sarah Chen (Data Engineer), Marcus Vance (UI/UX), Elena Rostova (Product Manager).
Agenda Items Discussed:
1. Local AI Performance: Reviewed TF-IDF summarizer benchmarks. Text extraction and extractive summary generation for 50-page documents now completes under 120ms locally.
2. SQLite FTS5 Search Integration: Confirmed full-text search index triggers keep document titles, summaries, and raw text synchronized seamlessly upon upload or edit.
3. UI/UX Polish: Marcus demonstrated the new glassmorphic dark/light mode toggle with full keyboard navigation accessibility (Ctrl+K search modal).
4. Action Items:
- Alex: Finalize Docker multi-stage build and Makefile targets.
- Sarah: Complete automated unit test suites for document parser and search controllers.
- Marcus: Refine reader highlight popup and mobile drawer layout.`
  }
];

async function seed() {
  console.log('[Seed] Initializing database schema...');
  await initDatabase();

  // Clear existing data for clean seed
  await exec(`
    DELETE FROM activity_logs;
    DELETE FROM highlights;
    DELETE FROM notes;
    DELETE FROM bookmarks;
    DELETE FROM document_tags;
    DELETE FROM tags;
    DELETE FROM document_keywords;
    DELETE FROM documents;
    DELETE FROM workspaces;
    DELETE FROM users;
  `);

  console.log('[Seed] Creating demo users...');
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Demo@123', salt);
  const userPasswordHash = await bcrypt.hash('Demo@123', salt);

  const adminResult = await run(
    'INSERT INTO users (email, password_hash, name, role, theme_preference) VALUES (?, ?, ?, ?, ?)',
    ['admin@docmind.ai', adminPasswordHash, 'DocMind Admin', 'admin', 'dark']
  );
  const adminId = adminResult.lastID;

  const userResult = await run(
    'INSERT INTO users (email, password_hash, name, role, theme_preference) VALUES (?, ?, ?, ?, ?)',
    ['demo@docmind.ai', userPasswordHash, 'Demo User', 'user', 'dark']
  );
  const userId = userResult.lastID;

  console.log('[Seed] Creating 3 workspaces...');
  const ws1 = await run('INSERT INTO workspaces (name, description, color, created_by) VALUES (?, ?, ?, ?)',
    ['AI Research', 'Machine learning research papers, algorithm specs, and AI project proposals.', '#6366f1', adminId]);
  const ws2 = await run('INSERT INTO workspaces (name, description, color, created_by) VALUES (?, ?, ?, ?)',
    ['Finance', 'Financial projections, annual budgets, Q1-Q4 reports, and revenue analytics.', '#10b981', adminId]);
  const ws3 = await run('INSERT INTO workspaces (name, description, color, created_by) VALUES (?, ?, ?, ?)',
    ['Operations', 'Company handbooks, cybersecurity policies, HR guidelines, and operational SOPs.', '#f59e0b', userId]);

  const workspaceMap = {
    'AI Research': ws1.lastID,
    'Finance': ws2.lastID,
    'Operations': ws3.lastID
  };

  console.log('[Seed] Creating tags...');
  const tagNames = ['Machine Learning', 'Proposal', 'Budget', 'HR Policy', 'Security', 'Minutes'];
  const tagMap = {};
  for (const tName of tagNames) {
    const res = await run('INSERT INTO tags (name, color) VALUES (?, ?)', [tName, '#4f46e5']);
    tagMap[tName] = res.lastID;
  }

  console.log('[Seed] Processing and seeding 6 sample documents...');
  const createdDocs = [];

  for (let i = 0; i < sampleDocumentsData.length; i++) {
    const item = sampleDocumentsData[i];
    const filePath = path.join(uploadsDir, item.fileName);
    fs.writeFileSync(filePath, item.content, 'utf8');

    const fileSize = fs.statSync(filePath).size;
    const summary = generateSummary(item.content, 3);
    const keywords = extractKeywords(item.content, 8);
    const readingTime = calculateReadingTime(item.content);
    const uploader = i % 2 === 0 ? adminId : userId;
    const workspaceId = workspaceMap[item.workspaceName];

    const docRes = await run(
      `INSERT INTO documents (title, original_name, file_path, file_size, file_type, workspace_id, uploaded_by, reading_time_minutes, content_text, summary, is_favorite)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.title, item.fileName, filePath, fileSize, item.fileType, workspaceId, uploader, readingTime, item.content, summary, i < 2 ? 1 : 0]
    );

    const docId = docRes.lastID;
    createdDocs.push({ id: docId, title: item.title });

    // Store keywords
    for (const kw of keywords) {
      await run('INSERT INTO document_keywords (document_id, keyword, score) VALUES (?, ?, ?)', [docId, kw.keyword, kw.score]);
    }

    // Attach tags
    const tagToAssign = tagMap[tagNames[i % tagNames.length]];
    if (tagToAssign) {
      await run('INSERT INTO document_tags (document_id, tag_id) VALUES (?, ?)', [docId, tagToAssign]);
    }

    // Add activity log
    await run(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [uploader, 'UPLOAD_DOCUMENT', 'document', docId, `Seeded document: ${item.title}`]
    );
  }

  console.log('[Seed] Seeding 8-10 notes & highlights...');
  const sampleNotes = [
    { docIdx: 0, text: 'Review deep learning transformer architecture section for Q3 paper.', page: 1, color: '#fef08a' },
    { docIdx: 0, text: 'Check K-Means clustering convergence criteria.', page: 2, color: '#bbf7d0' },
    { docIdx: 1, text: 'Phase 3 timeline aligns with our sprint budget.', page: 1, color: '#bfdbfe' },
    { docIdx: 1, text: 'Ensure local NLP extraction achieves sub-150ms latency.', page: 2, color: '#fef08a' },
    { docIdx: 2, text: 'Q4 revenue projections exceed targets by 18%.', page: 1, color: '#bbf7d0' },
    { docIdx: 3, text: 'Hybrid work hours requirement needs team lead signoff.', page: 3, color: '#fed7aa' },
    { docIdx: 4, text: 'AES-256 encryption for data at rest mandatory for compliance.', page: 1, color: '#fef08a' },
    { docIdx: 4, text: 'Schedule quarterly external penetration test in October.', page: 2, color: '#fecdd3' },
    { docIdx: 5, text: 'Alex to deliver Docker container setup by Friday.', page: 1, color: '#bbf7d0' }
  ];

  for (const n of sampleNotes) {
    const docId = createdDocs[n.docIdx].id;
    await run(
      'INSERT INTO notes (document_id, user_id, content, page_number, color) VALUES (?, ?, ?, ?, ?)',
      [docId, userId, n.text, n.page, n.color]
    );
  }

  const sampleHighlights = [
    { docIdx: 0, sel: 'Supervised learning algorithms build a mathematical model', note: 'Core definition', color: '#fef08a' },
    { docIdx: 1, sel: 'Guarantee 100% data privacy by executing AI summarization locally', note: 'Critical requirement', color: '#bbf7d0' },
    { docIdx: 2, sel: 'Net Projected Operating Profit: $320,000 (22.8% Margin)', note: 'Financial KPI', color: '#bfdbfe' },
    { docIdx: 4, sel: 'Implement Role-Based Access Control (RBAC), Least Privilege principles', note: 'Security standard', color: '#fecdd3' }
  ];

  for (const h of sampleHighlights) {
    const docId = createdDocs[h.docIdx].id;
    await run(
      'INSERT INTO highlights (document_id, user_id, selected_text, note_text, color) VALUES (?, ?, ?, ?, ?)',
      [docId, adminId, h.sel, h.note, h.color]
    );
  }

  console.log('[Seed] Seeding bookmarks & extra activity logs...');
  await run('INSERT INTO bookmarks (user_id, document_id) VALUES (?, ?)', [userId, createdDocs[0].id]);
  await run('INSERT INTO bookmarks (user_id, document_id) VALUES (?, ?)', [userId, createdDocs[1].id]);

  await run('INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
    [adminId, 'INITIALIZE_SYSTEM', 'system', 1, 'System auto-seeded with 6 documents, 3 workspaces, 9 notes, and AI summaries.']);

  console.log('✅ [Seed Complete] Database successfully seeded!');
  console.log('----------------------------------------------------');
  console.log('Admin Email : admin@docmind.ai | Password: Demo@123');
  console.log('User Email  : demo@docmind.ai  | Password: Demo@123');
  console.log('----------------------------------------------------');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seed Error:', err);
    process.exit(1);
  });
}

module.exports = seed;
