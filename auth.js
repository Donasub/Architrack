/* ============================================================
   ApproTrack — auth.js
   Session management with localStorage.
   ============================================================ */
(function (window) {
  'use strict';

  var STORAGE_KEY = 'approtrack_session';

  function saveSession(user) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (e) { /* storage full / disabled */ }
  }

  function getSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function clearSession() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  /**
   * Call at the top of every protected page.
   * Redirects to login.html if no session exists.
   */
  function requireAuth() {
    var s = getSession();
    if (!s) {
      window.location.replace('login.html');
      return null;
    }
    return s;
  }

  /**
   * Demo credentials — also accepts any valid email + password >= 8 chars.
   */
  var DEMO_EMAIL = 'demo@approtrack.ng';
  var DEMO_PASS  = 'demo1234';

  function attemptLogin(email, password) {
    if (!email || !password) {
      return { ok: false, reason: 'missing', message: 'Please enter your email and password' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, reason: 'invalid_email', message: 'Please enter a valid email address' };
    }
    if (password.length < 8 && !(email.toLowerCase() === DEMO_EMAIL && password === DEMO_PASS)) {
      return { ok: false, reason: 'weak_password', message: 'Password must be at least 8 characters' };
    }

    var isDemo = (email.toLowerCase() === DEMO_EMAIL && password === DEMO_PASS);

    var name, initials, plan;
    if (isDemo) {
      name = 'Tunde Adebayo';
      initials = 'TA';
      plan = 'free';
    } else {
      var namePart = email.split('@')[0].replace(/[._-]/g, ' ');
      name = namePart.split(' ').map(function (w) {
        return w ? w.charAt(0).toUpperCase() + w.slice(1) : '';
      }).filter(Boolean).join(' ') || 'Welcome';
      initials = (namePart.split(/\s+/).map(function (s) { return s[0]; }).filter(Boolean).slice(0, 2).join('') || 'YO').toUpperCase();
      plan = 'free';
    }

    var user = { name: name, email: email, initials: initials, plan: plan };
    saveSession(user);
    return { ok: true, user: user };
  }

  function attemptSignup(name, email, password, plan) {
    if (!name || !email || !password) {
      return { ok: false, message: 'Please complete all fields' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, message: 'Please enter a valid email address' };
    }
    if (password.length < 8) {
      return { ok: false, message: 'Use at least 8 characters' };
    }
    var initials = name.split(/\s+/).map(function (s) { return s[0]; }).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'NU';
    var user = { name: name, email: email, initials: initials, plan: plan || 'free' };
    saveSession(user);
    return { ok: true, user: user };
  }

  function logout() {
    clearSession();
    window.location.replace('index.html');
  }

  // Expose
  window.ApproAuth = {
    saveSession: saveSession,
    getSession:  getSession,
    clearSession: clearSession,
    requireAuth: requireAuth,
    attemptLogin: attemptLogin,
    attemptSignup: attemptSignup,
    logout: logout,
    DEMO_EMAIL: DEMO_EMAIL,
    DEMO_PASS: DEMO_PASS
  };
})(window);
