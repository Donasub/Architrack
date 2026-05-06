/* ============================================================
   ApproTrack — app.js (multi-page build)
   Shared logic for: dashboard, projects, documents, clients,
   reports, settings.
   Auth state is read from localStorage via auth.js (must load first).
   Each page sets <body data-page="..."> to identify itself.
   ============================================================ */

/* ============================================================
   APPROTRACK — Wired-up interactive logic
   ============================================================ */

/* ============================================================
   USER STATE & TIER
   ============================================================ */
const FREE_PROJECT_LIMIT = 2;
const PRO_PRICE = '₦18,000';

// Multi-page: read session from localStorage (set by login/signup pages)
var _session = (window.ApproAuth && window.ApproAuth.getSession && window.ApproAuth.getSession()) || null;
let currentUser = _session || {
  name: 'Tunde Adebayo',
  email: 'tunde@adebayoarchitects.ng',
  initials: 'TA',
  plan: 'free'
};
/* ============================================================
   Multi-page configuration
   ============================================================ */
var PAGE_FILES = {
  dashboard: 'dashboard.html',
  projects:  'projects.html',
  documents: 'documents.html',
  clients:   'clients.html',
  reports:   'reports.html',
  settings:  'settings.html'
};
// Determine current page from <body data-page="..."> set per-file
var currentPageId = (document.body.dataset.page) || 'dashboard';

let pendingPlan = null;

/* ============================================================
   TIER ENFORCEMENT
   ============================================================ */
function applyTier() {
  const tierBadge = document.getElementById('tierBadge');
  const tierLabel = document.getElementById('tierLabel');
  if (currentUser.plan === 'pro') {
    tierBadge.classList.remove('free');
    tierBadge.classList.add('pro');
    tierLabel.textContent = 'Professional';
  } else {
    tierBadge.classList.remove('pro');
    tierBadge.classList.add('free');
    const remaining = Math.max(0, FREE_PROJECT_LIMIT - currentVisibleProjectCount());
    tierLabel.textContent = `Free · ${remaining}/${FREE_PROJECT_LIMIT} left`;
  }

  // Update billing section UI
  const desc = document.getElementById('billingDesc');
  const planName = document.getElementById('billingPlanName');
  const planDetails = document.getElementById('billingPlanDetails');
  const next = document.getElementById('billingNext');
  const paymentBlock = document.getElementById('billingPaymentBlock');
  const actions = document.getElementById('billingActions');
  if (desc && planName) {
    if (currentUser.plan === 'pro') {
      desc.innerHTML = "You're on the <strong>Professional</strong> plan — ₦18,000/month.";
      planName.textContent = 'Professional';
      planDetails.textContent = 'Unlimited projects · all states · reports & audit trails';
      next.innerHTML = 'Next billing date: <strong>22 Mar 2026</strong>';
      paymentBlock.style.display = '';
      actions.innerHTML = `
        <button class="btn" data-action="change-plan">Change plan</button>
        <button class="btn" data-action="update-card">Update card</button>
        <button class="btn" style="color: var(--red); border-color: var(--red-dim);" data-action="cancel-plan">Cancel plan</button>
      `;
    } else {
      desc.innerHTML = "You're on the <strong>Free</strong> plan — ₦0/month.";
      planName.textContent = 'Free';
      planDetails.textContent = `Up to ${FREE_PROJECT_LIMIT} active projects · LASBCA only`;
      next.textContent = 'No payment due — free forever';
      paymentBlock.style.display = 'none';
      actions.innerHTML = `
        <button class="btn btn-primary" data-action="upgrade-from-billing">Upgrade to Professional · ₦18,000/mo</button>
      `;
    }
    // Re-bind buttons
    actions.querySelectorAll('[data-action="upgrade-from-billing"]').forEach(b => {
      b.addEventListener('click', () => showUpgradeModal());
    });
    actions.querySelectorAll('[data-action="change-plan"]').forEach(b => {
      b.addEventListener('click', () => toast('Plan options', 'info', 'Pricing page would open here'));
    });
    actions.querySelectorAll('[data-action="update-card"]').forEach(b => {
      b.addEventListener('click', () => toast('Update payment', 'info', 'Secure checkout would open here'));
    });
    actions.querySelectorAll('[data-action="cancel-plan"]').forEach(b => {
      b.addEventListener('click', () => {
        confirmAction('Cancel Professional plan?', 'You\'ll be downgraded to the Free plan at the end of your current billing cycle.', () => {
          currentUser.plan = 'free';
          applyTier();
          renderProjectsPage();
          renderProjectDropdown();
          toast('Plan cancelled', 'warn', 'You\'re back on Free — projects beyond 2 are now locked');
        }, 'Cancel plan');
      });
    });
  }
}

function currentVisibleProjectCount() {
  // For free tier, only first 2 projects are visible
  return currentUser.plan === 'pro' ? projectsData.length : Math.min(projectsData.length, FREE_PROJECT_LIMIT);
}

function visibleProjects() {
  return currentUser.plan === 'pro' ? projectsData : projectsData.slice(0, FREE_PROJECT_LIMIT);
}

function canCreateProject() {
  if (currentUser.plan === 'pro') return true;
  return projectsData.length < FREE_PROJECT_LIMIT;
}

function showUpgradeModal(reason) {
  const titleEl = document.getElementById('upgradeTitle');
  const msgEl = document.getElementById('upgradeMsg');
  if (reason === 'limit') {
    titleEl.textContent = 'Upgrade to Professional';
    msgEl.textContent = `You've reached the ${FREE_PROJECT_LIMIT}-project limit on the Free plan. Upgrade to Pro for unlimited projects.`;
  } else if (reason === 'reports') {
    titleEl.textContent = 'Reports are a Pro feature';
    msgEl.textContent = 'Generate full audit trails and approval reports with the Professional plan.';
  } else {
    titleEl.textContent = 'Upgrade to Professional';
    msgEl.textContent = 'Unlock unlimited projects, reports, and all states.';
  }
  openModal('upgradeModal');
}

// Confirm upgrade
document.getElementById('confirmUpgrade').addEventListener('click', () => {
  closeModal('upgradeModal');
  // Mock payment flow
  toast('Redirecting to secure checkout…', 'info', 'Powered by Paystack');
  setTimeout(() => {
    currentUser.plan = 'pro';
    applyTier();
    renderProjectsPage();
    renderProjectDropdown();
    toast('Welcome to Professional!', 'success', 'You now have unlimited projects · ₦18,000/mo');
  }, 1300);
});

// Tier badge click → upgrade modal (or billing if already pro)
document.getElementById('tierBadge').addEventListener('click', () => {
  if (currentUser.plan === 'pro') {
    navigateTo('settings');
    selectSettingsSection('billing');
  } else {
    showUpgradeModal();
  }
});

/* ===== Helper: Toast notifications ===== */
const toastContainer = document.getElementById('toastContainer');
function toast(message, type = 'success', detail = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  let iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
  if (type === 'warn') iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  if (type === 'error') iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  if (type === 'info') iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

  t.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-text"><strong>${message}</strong>${detail ? '<small>' + detail + '</small>' : ''}</div>
    <button class="toast-close" aria-label="Close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  toastContainer.appendChild(t);
  const remove = () => {
    t.classList.add('fade');
    setTimeout(() => t.remove(), 250);
  };
  t.querySelector('.toast-close').addEventListener('click', remove);
  setTimeout(remove, 4200);
}

/* ===== Helper: Modal open/close ===== */
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}
function closeAllModals() {
  document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
}
// Close any modal by backdrop click + close-modal data attribute
document.querySelectorAll('.modal-backdrop').forEach(m => {
  m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('open'); });
});
document.querySelectorAll('[data-close-modal]').forEach(b => {
  b.addEventListener('click', () => closeModal(b.dataset.closeModal));
});

/* ===== Helper: Confirm dialog ===== */
function confirmAction(title, message, onYes, yesLabel = 'Confirm') {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = message;
  const btn = document.getElementById('confirmYes');
  btn.textContent = yesLabel;
  // Replace listener
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', () => {
    closeModal('confirmModal');
    onYes && onYes();
  });
  openModal('confirmModal');
}

/* ===== Page navigation ===== */
const navItems = document.querySelectorAll('.nav-item[data-page]');
const pages = document.querySelectorAll('.page');
const pageTitles = {
  dashboard: 'Project Dashboard',
  projects: 'Projects',
  documents: 'Documents',
  clients: 'Clients',
  reports: 'Reports',
  settings: 'Settings'
};

function navigateTo(pageId) {
  // Gate Reports behind Pro
  if (pageId === 'reports' && currentUser.plan !== 'pro') {
    showUpgradeModal('reports');
    return;
  }
  // Multi-page: real navigation
  if (pageId && PAGE_FILES[pageId]) {
    window.location.href = PAGE_FILES[pageId];
  }
}

navItems.forEach(function (item) {
  item.addEventListener('click', function (e) {
    if (e) e.preventDefault();
    navigateTo(item.dataset.page);
  });
});

// Logo and breadcrumb back to dashboard / projects
var _logoMark = document.getElementById('logoMark');
if (_logoMark) _logoMark.addEventListener('click', function (e) { if (e) e.preventDefault(); navigateTo('dashboard'); });
document.querySelectorAll('#breadcrumb span[data-page]').forEach(function (s) {
  s.addEventListener('click', function (e) { if (e) e.preventDefault(); navigateTo(s.dataset.page); });
});

/* ===== Mock data ===== */
const projectsData = [
  { id: 'LAG-2025-04', name: 'Lekki Phase II Residence', client: 'Mr. Chinedu Okafor', stage: 'Under Review', stageType: 'submitted', updated: '2 days ago', isCurrent: true },
  { id: 'LAG-2025-03', name: 'Victoria Island Office Tower', client: 'Mrs. Adaeze Eze', stage: 'Drafting', stageType: 'pending', updated: '1 day ago' },
  { id: 'ABJ-2025-02', name: 'Maitama Family Home', client: 'Dr. Ifeanyi Chukwu', stage: 'Approved', stageType: 'acknowledged', updated: '3 weeks ago' },
  { id: 'LAG-2024-09', name: 'Ikoyi Boutique Hotel', client: 'Sterling Hospitality Ltd', stage: 'Under Review', stageType: 'submitted', updated: '5 days ago' },
  { id: 'PHC-2024-11', name: 'GRA Phase III Townhouses', client: 'Coastal Estates Ltd', stage: 'Revision Requested', stageType: 'revision', updated: '1 week ago' },
  { id: 'LAG-2024-12', name: 'Banana Island Penthouse', client: 'Mr. Olumide Bakare', stage: 'Approved', stageType: 'acknowledged', updated: '2 months ago' }
];

const clientsData = [
  { name: 'Mr. Chinedu Okafor', email: 'chinedu.okafor@gmail.com', phone: '+234 805 444 1290', projects: 1, joined: 'Jan 2026', avatar: 'a1', initials: 'CO' },
  { name: 'Mrs. Adaeze Eze', email: 'a.eze@ezegroup.ng', phone: '+234 803 992 7711', projects: 1, joined: 'Dec 2025', avatar: 'a2', initials: 'AE' },
  { name: 'Dr. Ifeanyi Chukwu', email: 'ifeanyi@chukwu.md', phone: '+234 802 010 4554', projects: 1, joined: 'Sep 2025', avatar: 'a3', initials: 'IC' },
  { name: 'Sterling Hospitality Ltd', email: 'projects@sterlinghospitality.com', phone: '+234 1 270 9988', projects: 1, joined: 'Aug 2025', avatar: 'a4', initials: 'SH' },
  { name: 'Coastal Estates Ltd', email: 'dev@coastalestates.ng', phone: '+234 84 234 1100', projects: 1, joined: 'May 2025', avatar: 'a5', initials: 'CE' },
  { name: 'Mr. Olumide Bakare', email: 'olu.bakare@outlook.com', phone: '+234 706 122 8810', projects: 1, joined: 'Mar 2025', avatar: 'a2', initials: 'OB' }
];

const reportsData = [
  { name: 'Q1 2026 Approval Cycle Summary', period: 'Jan – Mar 2026', generated: '15 Mar 2026' },
  { name: 'Lekki Phase II — Full Audit Trail', period: 'Project lifetime', generated: '03 Mar 2026' },
  { name: '2025 Annual Filing Performance', period: 'Jan – Dec 2025', generated: '12 Jan 2026' },
  { name: 'Revision Requests by Reviewer', period: 'Last 6 months', generated: '20 Feb 2026' }
];

let notifications = [
  { id: 1, type: 'info', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', msg: '<strong>Reviewer assigned</strong> to Lekki Phase II Residence by LASBCA.', time: '2 hours ago', unread: true },
  { id: 2, type: 'warn', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', msg: '<strong>Soil test revision requested</strong> by reviewer on Lekki Phase II.', time: 'Yesterday', unread: true },
  { id: 3, type: 'success', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>', msg: '<strong>Maitama Family Home permit issued</strong> — congratulations.', time: '3 days ago', unread: false },
  { id: 4, type: 'info', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', msg: 'Mr. Chinedu Okafor viewed your last update.', time: '4 days ago', unread: false }
];

/* ===== Project switcher dropdown ===== */
const projectSwitcher = document.getElementById('projectSwitcher');
const projectDropdown = document.getElementById('projectDropdown');
const projectDropdownList = document.getElementById('projectDropdownList');

function renderProjectDropdown() {
  const visible = visibleProjects();
  projectDropdownList.innerHTML = visible.map(p => `
    <div class="project-row ${p.isCurrent ? 'current' : ''}" data-project-id="${p.id}">
      <div>
        <div class="project-row-id">${p.id}</div>
        <div class="project-row-name">${p.name}</div>
      </div>
      <span class="status-badge sb-${p.stageType} project-row-status"><span class="sb-dot"></span> ${p.stage}</span>
    </div>
  `).join('');
  projectDropdownList.querySelectorAll('.project-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.projectId;
      const p = projectsData.find(x => x.id === id);
      if (!p) return;
      projectsData.forEach(x => x.isCurrent = (x.id === id));
      document.getElementById('projectSwitcherId').textContent = p.id;
      document.getElementById('projectSwitcherName').textContent = p.name;
      document.getElementById('breadcrumbCurrent').textContent = p.name;
      const heroTitle = document.querySelector('.hero-title');
      if (heroTitle) heroTitle.textContent = p.name;
      const heroId = document.querySelector('.hero-id');
      if (heroId) heroId.textContent = `PROJECT ID — ${p.id}`;
      projectDropdown.classList.remove('open');
      navigateTo('dashboard');
      toast('Switched project', 'info', p.name);
    });
  });
}
renderProjectDropdown();

projectSwitcher.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllDropdowns();
  projectDropdown.classList.toggle('open');
});

/* ===== Profile dropdown ===== */
const avatarBtn = document.getElementById('avatarBtn');
const profileDropdown = document.getElementById('profileDropdown');
avatarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllDropdowns();
  profileDropdown.classList.toggle('open');
});

document.querySelectorAll('#profileDropdown .dropdown-item').forEach(b => {
  b.addEventListener('click', () => {
    const action = b.dataset.action;
    profileDropdown.classList.remove('open');
    if (action === 'profile-settings') { navigateTo('settings'); selectSettingsSection('profile'); }
    if (action === 'open-settings') { navigateTo('settings'); selectSettingsSection('workspace'); }
    if (action === 'account-billing') { navigateTo('settings'); selectSettingsSection('billing'); }
    if (action === 'help') {
      toast('Help center', 'info', 'For demo purposes — would open support hub');
    }
    if (action === 'signout') {
      confirmAction('Sign out?', 'You will be returned to the landing page.', function () {
        if (window.ApproAuth) window.ApproAuth.clearSession();
        try { sessionStorage.removeItem('approtrack_welcomed'); } catch (e) {}
        window.location.href = 'index.html';
      }, 'Sign out');
    }
  });
});

document.querySelectorAll('#projectDropdown .dropdown-item').forEach(b => {
  b.addEventListener('click', () => {
    projectDropdown.classList.remove('open');
    if (b.dataset.action === 'new-project-from-switcher') openModal('newProjectModal');
    if (b.dataset.action === 'view-all-projects') navigateTo('projects');
  });
});

/* ===== Notifications panel ===== */
const notifBtn = document.getElementById('notifBtn');
const notifPanel = document.getElementById('notifPanel');
const notifList = document.getElementById('notifList');
const notifBadge = document.getElementById('notifBadge');

function renderNotifications() {
  if (notifications.length === 0) {
    notifList.innerHTML = '<div class="notif-empty">No notifications yet</div>';
  } else {
    notifList.innerHTML = notifications.map(n => `
      <div class="notif-item ${n.unread ? 'unread' : ''}" data-notif-id="${n.id}">
        <div class="notif-icon ${n.type}">${n.icon}</div>
        <div class="notif-content">
          <div class="notif-msg">${n.msg}</div>
          <div class="notif-time">${n.time}</div>
        </div>
      </div>
    `).join('');
    notifList.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.dataset.notifId);
        const n = notifications.find(x => x.id === id);
        if (n) n.unread = false;
        renderNotifications();
        notifPanel.classList.remove('open');
      });
    });
  }
  const unread = notifications.filter(n => n.unread).length;
  notifBadge.style.display = unread > 0 ? '' : 'none';
}
renderNotifications();

notifBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllDropdowns();
  notifPanel.classList.toggle('open');
});

document.getElementById('markAllRead').addEventListener('click', () => {
  notifications.forEach(n => n.unread = false);
  renderNotifications();
  toast('All caught up', 'success');
});

/* ===== Close all dropdowns on outside click ===== */
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown.open, .notif-panel.open, .search-results.open, .doc-menu.open')
    .forEach(d => d.classList.remove('open'));
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.has-dropdown') && !e.target.closest('.search-wrap') && !e.target.closest('.doc-card')) {
    closeAllDropdowns();
  }
});

/* ===== Search ===== */
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

const searchableItems = [
  ...projectsData.map(p => ({ name: p.name, type: 'Project · ' + p.id, page: 'projects', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>' })),
  ...clientsData.map(c => ({ name: c.name, type: 'Client', page: 'clients', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' })),
  { name: 'Site Plan – Rev 03', type: 'Document · DWG', page: 'documents', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>' },
  { name: 'Floor Plans (G+1)', type: 'Document · DWG', page: 'documents', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>' },
  { name: 'Structural Calc Report', type: 'Document · PDF', page: 'documents', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>' },
  { name: 'Title Deed (C of O)', type: 'Document · PDF', page: 'documents', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>' },
  { name: 'Q1 2026 Approval Cycle Summary', type: 'Report', page: 'reports', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' }
];

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (q.length === 0) { searchResults.classList.remove('open'); return; }
  // Build searchable list dynamically each time so it respects current tier
  const dynamicSearch = [
    ...visibleProjects().map(p => ({ name: p.name, type: 'Project · ' + p.id, page: 'projects', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>' })),
    ...clientsData.map(c => ({ name: c.name, type: 'Client', page: 'clients', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' })),
    { name: 'Site Plan – Rev 03', type: 'Document · DWG', page: 'documents', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>' },
    { name: 'Floor Plans (G+1)', type: 'Document · DWG', page: 'documents', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>' },
    { name: 'Structural Calc Report', type: 'Document · PDF', page: 'documents', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>' }
  ];
  if (currentUser.plan === 'pro') {
    dynamicSearch.push({ name: 'Q1 2026 Approval Cycle Summary', type: 'Report', page: 'reports', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' });
  }
  const matches = dynamicSearch.filter(item =>
    item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)
  ).slice(0, 8);
  if (matches.length === 0) {
    searchResults.innerHTML = '<div class="notif-empty">No results for "' + q + '"</div>';
  } else {
    searchResults.innerHTML = matches.map(m => `
      <div class="search-result" data-page="${m.page}" data-name="${m.name}">
        <div class="search-result-icon">${m.icon}</div>
        <div class="search-result-text">
          <div class="search-result-name">${m.name}</div>
          <div class="search-result-type">${m.type}</div>
        </div>
      </div>
    `).join('');
    searchResults.querySelectorAll('.search-result').forEach(r => {
      r.addEventListener('click', () => {
        navigateTo(r.dataset.page);
        searchResults.classList.remove('open');
        searchInput.value = '';
        toast('Found', 'info', r.dataset.name);
      });
    });
  }
  searchResults.classList.add('open');
});
searchInput.addEventListener('focus', () => {
  if (searchInput.value.trim().length > 0) searchResults.classList.add('open');
});

/* ============================================================
   DASHBOARD: Update Status modal, Checklist, Filter, Doc cards
   ============================================================ */

/* ===== Update Status Modal ===== */
const updateModal = document.getElementById('updateModal');
const openUpdateBtn = document.getElementById('openUpdateModal');
const cancelUpdateBtn = document.getElementById('cancelUpdate');
const confirmUpdateBtn = document.getElementById('confirmUpdate');
const stageOptions = document.querySelectorAll('.stage-option');
const steps = document.querySelectorAll('.step');
const stepperFill = document.getElementById('stepperFill');

let selectedStage = 2;
let currentStage = 2;

openUpdateBtn && openUpdateBtn.addEventListener('click', () => {
  // ensure selected matches current
  stageOptions.forEach(o => o.classList.toggle('selected', parseInt(o.dataset.stage) === currentStage));
  selectedStage = currentStage;
  openModal('updateModal');
});
cancelUpdateBtn && cancelUpdateBtn.addEventListener('click', () => closeModal('updateModal'));

stageOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    stageOptions.forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    selectedStage = parseInt(opt.dataset.stage);
  });
});

function setStepperStage(stage) {
  steps.forEach((s, i) => {
    s.classList.remove('complete', 'current');
    const circle = s.querySelector('.step-circle');
    if (i < stage) {
      s.classList.add('complete');
      circle.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (i === stage) {
      s.classList.add('current');
      circle.textContent = (i + 1).toString();
    } else {
      circle.textContent = (i + 1).toString();
    }
  });
  const fillPercent = (stage / 3) * 75;
  if (stepperFill) stepperFill.style.width = fillPercent + '%';
}

confirmUpdateBtn && confirmUpdateBtn.addEventListener('click', () => {
  setStepperStage(selectedStage);
  currentStage = selectedStage;
  closeModal('updateModal');
  const stageNames = ['Drafting / Upload', 'Submitted to Government', 'Under Review', 'Approved'];
  toast('Status updated', 'success', `Now: ${stageNames[selectedStage]} · synced to client`);
});

/* ===== Step click on stepper itself ===== */
steps.forEach((step, i) => {
  step.addEventListener('click', () => {
    stageOptions.forEach(o => o.classList.toggle('selected', parseInt(o.dataset.stage) === i));
    selectedStage = i;
    openModal('updateModal');
  });
});

/* ===== Checklist ===== */
const checkItems = document.querySelectorAll('#page-dashboard .check-item');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressSub = document.getElementById('progressSub');

function updateProgress() {
  const total = checkItems.length;
  if (!total || !progressFill) return;
  const done = document.querySelectorAll('#page-dashboard .check-item.checked').length;
  const pct = (done / total) * 100;
  progressFill.style.width = pct + '%';
  if (progressText) progressText.textContent = done + '/' + total;
  const remaining = total - done;
  if (progressSub) {
    if (remaining === 0) {
      progressSub.textContent = 'All requirements met — ready to submit';
    } else {
      progressSub.textContent = remaining + ' item' + (remaining > 1 ? 's' : '') + ' remaining before next submission window';
    }
  }
}

checkItems.forEach(item => {
  item.addEventListener('click', () => {
    item.classList.toggle('checked');
    updateProgress();
  });
});
updateProgress();

/* ===== Filter Pills ===== */
function getDocStatus(card) {
  const badge = card.querySelector('.status-badge');
  if (!badge) return null;
  if (badge.classList.contains('sb-acknowledged')) return 'acknowledged';
  if (badge.classList.contains('sb-submitted')) return 'submitted';
  if (badge.classList.contains('sb-pending')) return 'pending';
  if (badge.classList.contains('sb-revision')) return 'revision';
  return null;
}

function applyDocFilter(scope, filter) {
  scope.querySelectorAll('.doc-card').forEach(card => {
    const status = getDocStatus(card);
    const match = filter === 'all' || status === filter;
    card.classList.toggle('match', match);
    card.style.display = match ? '' : 'none';
  });
}

document.querySelectorAll('.filter-row').forEach(row => {
  row.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      row.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.dataset.filter;
      const scope = row.closest('section, .panel') || document;
      applyDocFilter(scope, filter);
    });
  });
});

/* ===== Document cards click → preview modal ===== */
function openDocPreview(card) {
  const name = card.querySelector('.doc-name').textContent;
  const meta = card.querySelector('.doc-meta').textContent;
  const iconEl = card.querySelector('.doc-icon');
  const iconType = ['pdf', 'dwg', 'img', 'doc'].find(t => iconEl.classList.contains(t)) || 'pdf';
  const iconText = iconEl.textContent.trim();
  const badge = card.querySelector('.status-badge');

  document.getElementById('dpTitle').textContent = name;
  document.getElementById('dpInfo').textContent = meta;
  const dpIcon = document.getElementById('dpIcon');
  dpIcon.className = 'doc-icon ' + iconType;
  dpIcon.textContent = iconText;

  const dpStatus = document.getElementById('dpStatus');
  dpStatus.className = 'status-badge ' + (badge ? badge.className.split(' ').filter(c => c.startsWith('sb-')).join(' ') : '');
  dpStatus.innerHTML = badge ? badge.innerHTML : '';

  openModal('docPreviewModal');
}

document.querySelectorAll('#page-dashboard .doc-card').forEach(card => {
  card.addEventListener('click', (e) => {
    if (e.target.closest('.doc-action')) return;
    openDocPreview(card);
  });
});

/* ===== Doc card 3-dot menu ===== */
function buildDocMenu(card, x, y) {
  // Remove any existing
  document.querySelectorAll('.doc-menu').forEach(m => m.remove());
  const menu = document.createElement('div');
  menu.className = 'dropdown doc-menu open';
  menu.innerHTML = `
    <button class="dropdown-item" data-act="view">
      <span class="ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></span>
      Preview
    </button>
    <button class="dropdown-item" data-act="download">
      <span class="ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
      Download
    </button>
    <button class="dropdown-item" data-act="share">
      <span class="ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/></svg></span>
      Share
    </button>
    <button class="dropdown-item" data-act="rename">
      <span class="ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span>
      Rename
    </button>
    <div class="dropdown-divider"></div>
    <button class="dropdown-item danger" data-act="delete">
      <span class="ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg></span>
      Delete
    </button>
  `;
  card.appendChild(menu);
  menu.style.position = 'absolute';
  menu.style.top = '36px';
  menu.style.right = '8px';

  const docName = card.querySelector('.doc-name').textContent;

  menu.querySelectorAll('[data-act]').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const act = b.dataset.act;
      menu.remove();
      if (act === 'view') openDocPreview(card);
      if (act === 'download') toast('Downloaded', 'success', docName);
      if (act === 'share') toast('Share link copied', 'info', 'Sent to reviewer');
      if (act === 'rename') {
        const newName = prompt('Rename document', docName);
        if (newName && newName.trim()) {
          card.querySelector('.doc-name').textContent = newName.trim();
          toast('Renamed', 'success');
        }
      }
      if (act === 'delete') {
        confirmAction('Delete this document?', `"${docName}" will be removed from this project. This cannot be undone.`, () => {
          card.style.transition = 'opacity 0.2s';
          card.style.opacity = '0';
          setTimeout(() => card.remove(), 200);
          toast('Deleted', 'info', docName);
        }, 'Delete');
      }
    });
  });
}

document.querySelectorAll('.doc-action').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    document.querySelectorAll('.doc-menu').forEach(m => m.remove());
    const card = btn.closest('.doc-card');
    buildDocMenu(card);
  });
});

/* ===== Doc preview action buttons ===== */
document.querySelectorAll('[data-action="download-doc"]').forEach(b => {
  b.addEventListener('click', () => {
    const name = document.getElementById('dpTitle').textContent;
    closeModal('docPreviewModal');
    toast('Downloaded', 'success', name);
  });
});
document.querySelectorAll('[data-action="share-doc"]').forEach(b => {
  b.addEventListener('click', () => {
    const name = document.getElementById('dpTitle').textContent;
    closeModal('docPreviewModal');
    toast('Shared with reviewer', 'success', name + ' — link sent');
  });
});

/* ===== Document upload ===== */
function handleFileUpload(files) {
  if (!files || files.length === 0) return;
  Array.from(files).forEach(file => {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const ext = file.name.split('.').pop().toLowerCase();
    const iconType = ['pdf'].includes(ext) ? 'pdf' : ['dwg', 'dxf'].includes(ext) ? 'dwg' : ['jpg', 'jpeg', 'png', 'gif'].includes(ext) ? 'img' : 'doc';
    const iconLabel = ext.toUpperCase().slice(0, 3);

    const card = document.createElement('div');
    card.className = 'doc-card';
    card.innerHTML = `
      <div class="doc-card-top">
        <div class="doc-icon ${iconType}">${iconLabel}</div>
        <div class="doc-info">
          <div class="doc-name">${file.name}</div>
          <div class="doc-meta">${sizeMb} MB · JUST UPLOADED</div>
        </div>
      </div>
      <div class="doc-card-bottom">
        <span class="status-badge sb-pending"><span class="sb-dot"></span> Awaiting Submission</span>
        <button class="doc-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
      </div>
    `;
    const grid = document.querySelector('#page-dashboard .doc-grid');
    if (grid) {
      const upload = grid.querySelector('.doc-upload');
      if (upload) grid.insertBefore(card, upload); else grid.appendChild(card);

      // Wire it up
      card.addEventListener('click', (e) => {
        if (e.target.closest('.doc-action')) return;
        openDocPreview(card);
      });
      card.querySelector('.doc-action').addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        document.querySelectorAll('.doc-menu').forEach(m => m.remove());
        buildDocMenu(card);
      });
    }
  });
  toast('Uploaded', 'success', `${files.length} file${files.length > 1 ? 's' : ''} added`);
  // refresh count pill
  const count = document.querySelectorAll('#page-dashboard .doc-card').length;
  const cp = document.querySelector('#page-dashboard .count-pill');
  if (cp) cp.textContent = count + ' files';
  if (window.renderDocsPage) renderDocsPage();
}

const docUploadInput = document.getElementById('docUploadInput');
if (docUploadInput) {
  docUploadInput.addEventListener('change', (e) => {
    handleFileUpload(e.target.files);
    e.target.value = '';
  });
}

const globalUploadInput = document.getElementById('docUploadInputGlobal');
if (globalUploadInput) {
  globalUploadInput.addEventListener('change', (e) => {
    handleFileUpload(e.target.files);
    e.target.value = '';
  });
}

/* ===== Page-level buttons: Export Report, New Project ===== */
const exportReportBtn = document.getElementById('exportReportBtn');
if (exportReportBtn) exportReportBtn.addEventListener('click', () => {
  if (currentUser.plan !== 'pro') {
    showUpgradeModal('reports');
    return;
  }
  toast('Generating report…', 'info', 'PDF will download in a moment');
  setTimeout(() => toast('Report ready', 'success', 'Lekki-Phase-II-Status.pdf'), 1100);
});
const newProjectBtn = document.getElementById('newProjectBtn');
if (newProjectBtn) newProjectBtn.addEventListener('click', () => {
  if (!canCreateProject()) { showUpgradeModal('limit'); return; }
  openModal('newProjectModal');
});
const newProj2 = document.getElementById('newProjectBtn2');
if (newProj2) newProj2.addEventListener('click', () => {
  if (!canCreateProject()) { showUpgradeModal('limit'); return; }
  openModal('newProjectModal');
});

/* ===== New Project confirm ===== */
document.getElementById('confirmNewProject').addEventListener('click', () => {
  const name = document.getElementById('npName').value.trim();
  const client = document.getElementById('npClient').value.trim();
  const location = document.getElementById('npLocation').value.trim();
  if (!name || !client) {
    toast('Missing details', 'error', 'Please add a project name and client');
    return;
  }
  if (!canCreateProject()) {
    closeModal('newProjectModal');
    showUpgradeModal('limit');
    return;
  }
  const id = 'LAG-' + new Date().getFullYear() + '-' + String(projectsData.length + 1).padStart(2, '0');
  projectsData.unshift({
    id, name, client, location,
    stage: 'Drafting', stageType: 'pending',
    updated: 'Just now'
  });
  closeModal('newProjectModal');
  document.getElementById('npName').value = '';
  document.getElementById('npClient').value = '';
  document.getElementById('npLocation').value = '';
  renderProjectDropdown();
  renderProjectsPage();
  applyTier();
  toast('Project created', 'success', name);
  navigateTo('projects');
});

/* ===== New Client confirm ===== */
const newClientBtn = document.getElementById('newClientBtn');
if (newClientBtn) newClientBtn.addEventListener('click', () => openModal('newClientModal'));
document.getElementById('confirmNewClient').addEventListener('click', () => {
  const name = document.getElementById('ncName').value.trim();
  const email = document.getElementById('ncEmail').value.trim();
  const phone = document.getElementById('ncPhone').value.trim();
  if (!name || !email) {
    toast('Missing details', 'error', 'Please add a name and email');
    return;
  }
  const initials = name.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  clientsData.unshift({ name, email, phone, projects: 0, joined: 'Just now', avatar: 'a' + (Math.floor(Math.random() * 5) + 1), initials });
  closeModal('newClientModal');
  document.getElementById('ncName').value = '';
  document.getElementById('ncEmail').value = '';
  document.getElementById('ncPhone').value = '';
  renderClientsPage();
  toast('Client added', 'success', name);
});

/* ===== Hero info icons → simple toasts ===== */
document.querySelectorAll('.hero-info-item').forEach(item => {
  item.style.cursor = 'pointer';
  item.addEventListener('click', () => {
    const txt = item.textContent.trim();
    toast('Info', 'info', txt);
  });
});

/* ===== Call architect button (in client view) ===== */
document.querySelectorAll('.arch-call-btn').forEach(b => {
  b.addEventListener('click', () => toast('Calling Tunde Adebayo…', 'info', '+234 803 123 4567'));
});

/* ============================================================
   PAGE: Projects
   ============================================================ */
function stageBadgeClass(stageType) {
  return 'sb-' + stageType;
}

function renderProjectsPage() {
  const body = document.getElementById('projectsListBody');
  if (!body) return; // not on this page
  const list = visibleProjects();
  body.innerHTML = list.map((p, idx) => `
    <div class="list-row projects-grid" data-project-id="${p.id}">
      <div class="list-cell-with-avatar">
        <div class="list-avatar a${(idx % 5) + 1}">${p.id.split('-')[0].slice(0, 2)}</div>
        <div>
          <div class="list-primary">${p.name}</div>
          <div class="list-secondary">${p.id}</div>
        </div>
      </div>
      <div>
        <div class="list-primary" style="font-size: 13px;">${p.client}</div>
      </div>
      <div>
        <span class="status-badge ${stageBadgeClass(p.stageType)}"><span class="sb-dot"></span> ${p.stage}</span>
      </div>
      <div class="list-secondary">${p.updated}</div>
      <div style="text-align: right;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>
  `).join('');

  // If on free, append a teaser row showing how many more they could have on Pro
  if (currentUser.plan !== 'pro' && projectsData.length >= FREE_PROJECT_LIMIT) {
    const hidden = projectsData.length - FREE_PROJECT_LIMIT;
    if (hidden > 0) {
      body.innerHTML += `
        <div class="list-row" style="grid-template-columns: 1fr; padding: 16px 20px; background: linear-gradient(135deg, var(--accent-dim), var(--emerald-dim)); cursor: pointer;" id="upgradeTeaser">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div>
              <div style="font-weight: 500; font-size: 13px; color: var(--emerald-deep);">${hidden} more project${hidden > 1 ? 's' : ''} ready to unlock</div>
              <div style="font-size: 12px; color: var(--text-2);">Upgrade to Professional for unlimited projects · ₦18,000/mo</div>
            </div>
            <div class="status-badge" style="background: var(--navy); color: #fff;"><span class="sb-dot" style="background: #fff;"></span> Upgrade →</div>
          </div>
        </div>
      `;
      const teaser = document.getElementById('upgradeTeaser');
      if (teaser) teaser.addEventListener('click', () => showUpgradeModal('limit'));
    }
  }

  body.querySelectorAll('.list-row[data-project-id]').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.projectId;
      const p = projectsData.find(x => x.id === id);
      if (!p) return;
      projectsData.forEach(x => x.isCurrent = (x.id === id));
      document.getElementById('projectSwitcherId').textContent = p.id;
      document.getElementById('projectSwitcherName').textContent = p.name;
      document.getElementById('breadcrumbCurrent').textContent = p.name;
      const heroTitle = document.querySelector('.hero-title');
      if (heroTitle) heroTitle.textContent = p.name;
      const heroId = document.querySelector('.hero-id');
      if (heroId) heroId.textContent = `PROJECT ID — ${p.id}`;
      navigateTo('dashboard');
    });
  });
  document.getElementById('statActive').textContent = list.filter(p => p.stageType !== 'acknowledged').length;
}
renderProjectsPage();

/* ============================================================
   PAGE: Documents (aggregates dashboard docs)
   ============================================================ */
function renderDocsPage() {
  const grid = document.getElementById('docPageGrid');
  if (!grid) return;
  const dashCards = document.querySelectorAll('#page-dashboard .doc-card');
  grid.innerHTML = '';
  dashCards.forEach(card => {
    const clone = card.cloneNode(true);
    grid.appendChild(clone);
    clone.addEventListener('click', (e) => {
      if (e.target.closest('.doc-action')) return;
      openDocPreview(clone);
    });
    const action = clone.querySelector('.doc-action');
    if (action) {
      action.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        document.querySelectorAll('.doc-menu').forEach(m => m.remove());
        buildDocMenu(clone);
      });
    }
  });
  const count = grid.querySelectorAll('.doc-card').length;
  const cp = document.getElementById('docCount');
  if (cp) cp.textContent = count + ' files';
}
window.renderDocsPage = renderDocsPage;
renderDocsPage();

/* ============================================================
   PAGE: Clients
   ============================================================ */
function renderClientsPage() {
  const body = document.getElementById('clientsListBody');
  if (!body) return;
  body.innerHTML = clientsData.map(c => `
    <div class="list-row clients-grid" data-client="${c.name}">
      <div class="list-cell-with-avatar">
        <div class="list-avatar ${c.avatar}">${c.initials}</div>
        <div>
          <div class="list-primary">${c.name}</div>
          <div class="list-secondary">${c.phone}</div>
        </div>
      </div>
      <div class="list-secondary" style="text-transform: none; font-size: 12px;">${c.email}</div>
      <div class="list-primary" style="font-size: 13px;">${c.projects} active</div>
      <div class="list-secondary">${c.joined}</div>
      <div style="text-align: right;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>
  `).join('');
  body.querySelectorAll('.list-row').forEach(row => {
    row.addEventListener('click', () => {
      toast(row.dataset.client, 'info', 'Client profile would open here');
    });
  });
}
renderClientsPage();

/* ============================================================
   PAGE: Reports
   ============================================================ */
function renderReportsPage() {
  const body = document.getElementById('reportsListBody');
  if (!body) return;
  body.innerHTML = reportsData.map(r => `
    <div class="list-row reports-grid" data-report="${r.name}">
      <div class="list-cell-with-avatar">
        <div class="list-avatar a4"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
        <div>
          <div class="list-primary">${r.name}</div>
        </div>
      </div>
      <div class="list-secondary" style="text-transform: none;">${r.period}</div>
      <div class="list-secondary">${r.generated}</div>
      <div style="text-align: right;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </div>
    </div>
  `).join('');
  body.querySelectorAll('.list-row').forEach(row => {
    row.addEventListener('click', () => toast('Downloaded', 'success', row.dataset.report + '.pdf'));
  });
}
renderReportsPage();

document.querySelectorAll('[data-action="generate-report"]').forEach(b => {
  b.addEventListener('click', () => {
    if (currentUser.plan !== 'pro') { showUpgradeModal('reports'); return; }
    toast('Generating report…', 'info', 'This will take a moment');
    setTimeout(() => {
      const r = { name: 'Custom Report — ' + new Date().toLocaleDateString(), period: 'Custom range', generated: 'Just now' };
      reportsData.unshift(r);
      renderReportsPage();
      toast('Report ready', 'success', r.name);
    }, 1100);
  });
});

document.querySelectorAll('[data-action="export-projects"]').forEach(b => {
  b.addEventListener('click', () => {
    toast('Exporting projects', 'info', 'CSV download starting');
    setTimeout(() => toast('Exported', 'success', 'projects.csv'), 800);
  });
});

/* ============================================================
   PAGE: Settings
   ============================================================ */
const settingsNavItems = document.querySelectorAll('#settingsNav .settings-nav-item');
const settingsPanes = document.querySelectorAll('.settings-section-pane');

function selectSettingsSection(section) {
  settingsNavItems.forEach(n => n.classList.toggle('active', n.dataset.section === section));
  settingsPanes.forEach(p => p.style.display = (p.dataset.section === section) ? '' : 'none');
}
settingsNavItems.forEach(n => n.addEventListener('click', () => selectSettingsSection(n.dataset.section)));

document.querySelectorAll('[data-toggle]').forEach(t => {
  t.addEventListener('click', () => t.classList.toggle('on'));
});

document.querySelectorAll('[data-action="save-settings"]').forEach(b => {
  b.addEventListener('click', () => toast('Settings saved', 'success'));
});

document.querySelectorAll('[data-action="change-plan"]').forEach(b => {
  b.addEventListener('click', () => toast('Plan options', 'info', 'Pricing page would open here'));
});
document.querySelectorAll('[data-action="update-card"]').forEach(b => {
  b.addEventListener('click', () => toast('Update payment', 'info', 'Secure checkout would open here'));
});

/* ============================================================
   Client View Toggle
   ============================================================ */
const clientBtn = document.getElementById('clientViewBtn');
const archBtn = document.getElementById('archViewBtn');
const clientMode = document.getElementById('clientMode');
const exitBtn = document.getElementById('exitClientMode');

clientBtn.addEventListener('click', () => {
  clientMode.classList.add('active');
  clientBtn.classList.add('active');
  archBtn.classList.remove('active');
  document.body.style.overflow = 'hidden';
});
function exitClient() {
  clientMode.classList.remove('active');
  archBtn.classList.add('active');
  clientBtn.classList.remove('active');
  document.body.style.overflow = '';
}
exitBtn.addEventListener('click', exitClient);
archBtn.addEventListener('click', exitClient);

/* ============================================================
   Keyboard
   ============================================================ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllModals();
    closeAllDropdowns();
    document.querySelectorAll('.doc-menu').forEach(m => m.remove());
    if (clientMode.classList.contains('active')) exitClient();
  }
  // Cmd/Ctrl+K opens search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

/* ============================================================
   Initial state — show landing
   ============================================================ */
/* showView removed in multi-page */


/* ============================================================
   Multi-page init — runs on every app page
   ============================================================ */
(function () {
  applyTier();
  // Mark active sidebar item
  document.querySelectorAll('.nav-item[data-page]').forEach(function (n) {
    n.classList.toggle('active', n.dataset.page === currentPageId);
  });
  // Update avatars with current user initials
  document.querySelectorAll('.avatar-sm').forEach(function (a) {
    if (currentUser && currentUser.initials) a.textContent = currentUser.initials;
  });
  // Update profile dropdown name
  var profName = document.querySelector('#profileDropdown .dropdown-section-title');
  if (profName && currentUser && currentUser.name) {
    profName.textContent = currentUser.name + (currentUser.plan === 'pro' ? ' · Pro' : ' · Free');
  }
  // Update breadcrumb based on current page
  var crumb = document.getElementById('breadcrumbCurrent');
  var crumbFirst = document.querySelector('#breadcrumb span[data-page]');
  if (crumbFirst) {
    if (currentPageId === 'dashboard') {
      crumbFirst.textContent = 'Projects';
      if (crumb) { crumb.textContent = 'Lekki Phase II Residence'; crumb.style.display = ''; }
      var sep = document.querySelector('#breadcrumb .breadcrumb-sep');
      if (sep) sep.style.display = '';
    } else {
      crumbFirst.textContent = pageTitles[currentPageId] || 'ApproTrack';
      if (crumb) crumb.style.display = 'none';
      var sep2 = document.querySelector('#breadcrumb .breadcrumb-sep');
      if (sep2) sep2.style.display = 'none';
    }
  }
  // Welcome toast on first dashboard load after login
  if (currentPageId === 'dashboard' && sessionStorage.getItem('approtrack_welcomed') !== '1') {
    sessionStorage.setItem('approtrack_welcomed', '1');
    setTimeout(function () {
      if (currentUser.plan === 'pro') {
        toast('Welcome, ' + currentUser.name.split(' ')[0], 'success', 'You\'re on the Professional plan — unlimited projects');
      } else {
        toast('Welcome, ' + currentUser.name.split(' ')[0], 'info', 'Free plan · ' + FREE_PROJECT_LIMIT + ' projects available');
      }
    }, 350);
  }
})();
