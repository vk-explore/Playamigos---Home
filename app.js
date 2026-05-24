/**
 * Playamigos — App Hub
 * Loads site config & apps from JSON, renders cards, handles search.
 */

(function () {
  'use strict';

  // ── DOM refs ──
  const appGrid = document.getElementById('app-grid');
  const searchInput = document.getElementById('search-input');
  const blogLink = document.getElementById('blog-link');
  const taglineEl = document.getElementById('tagline');
  const footerEl = document.getElementById('site-footer');

  // ── State ──
  let apps = [];
  let activeCategory = 'All';
  let searchQuery = '';

  // ── Init ──
  async function init() {
    await Promise.all([loadSiteConfig(), loadApps()]);
    renderCategoryFilters();
    renderCards(apps);
    bindSearch();
  }

  // ── Load site.json ──
  async function loadSiteConfig() {
    try {
      const res = await fetch('site.json');
      const config = await res.json();

      if (blogLink && config.blogUrl) {
        blogLink.href = config.blogUrl;
      }
      if (taglineEl && typeof config.tagline === 'string') {
        if (config.tagline) {
          taglineEl.textContent = config.tagline;
          taglineEl.style.display = 'block';
        } else {
          taglineEl.style.display = 'none';
        }
      }
      if (footerEl && config.footerText) {
        footerEl.textContent = config.footerText;
      }
    } catch (err) {
      console.warn('Could not load site.json:', err);
    }
  }

  // ── Load apps.json ──
  async function loadApps() {
    try {
      const res = await fetch('apps.json');
      apps = await res.json();
    } catch (err) {
      console.warn('Could not load apps.json:', err);
      apps = [];
    }
  }

  // ── Render Category Filters ──
  function renderCategoryFilters() {
    const filterContainer = document.getElementById('filter-section');
    if (!filterContainer) return;

    // Extract all unique categories dynamically
    const categories = ['All'];
    apps.forEach(app => {
      if (app.category && !categories.includes(app.category)) {
        categories.push(app.category);
      }
    });

    filterContainer.innerHTML = '';
    categories.forEach(cat => {
      const pill = document.createElement('button');
      pill.className = `filter-pill ${activeCategory === cat ? 'filter-pill--active' : ''}`;
      pill.textContent = cat;
      pill.addEventListener('click', () => {
        activeCategory = cat;
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('filter-pill--active'));
        pill.classList.add('filter-pill--active');
        filterApps();
      });
      filterContainer.appendChild(pill);
    });
  }

  // ── Combined Filtering ──
  function filterApps() {
    let filtered = apps;

    if (activeCategory !== 'All') {
      filtered = filtered.filter(app => app.category === activeCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(app => {
        const haystack = [
          app.title,
          app.description,
          app.category || ''
        ].join(' ').toLowerCase();
        return searchQuery.split(/\s+/).every(word => haystack.includes(word));
      });
    }

    renderCards(filtered);
  }

  // ── Render app cards ──
  function renderCards(list) {
    appGrid.innerHTML = '';

    if (list.length === 0) {
      appGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🔍</div>
          <p class="empty-state__text">No apps found</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    list.forEach((app, i) => {
      const card = document.createElement('a');
      card.className = 'app-card';
      card.href = app.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.style.animationDelay = `${i * 0.06}s`;
      card.setAttribute('aria-label', `Open ${app.title}`);

      card.innerHTML = `
        <img
          class="app-card__logo"
          src="${escapeHtml(app.logo)}"
          alt="${escapeHtml(app.title)} logo"
          width="36"
          height="36"
          loading="lazy"
          onerror="this.style.display='none'"
        >
        <div class="app-card__info">
          <span class="app-card__title">${escapeHtml(app.title)}</span>
          <span class="app-card__desc">${escapeHtml(app.description)}</span>
          ${app.category ? `<span class="app-card__category">${escapeHtml(app.category)}</span>` : ''}
        </div>
      `;

      fragment.appendChild(card);
    });

    appGrid.appendChild(fragment);
  }

  // ── Search ──
  function bindSearch() {
    let debounceTimer;

    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = searchInput.value.trim().toLowerCase();
        filterApps();
      }, 150);
    });

    // Clear search on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchQuery = '';
        filterApps();
        searchInput.blur();
      }
    });
  }

  // ── Utils ──
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Go ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
