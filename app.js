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
    // Load layout settings in background (non-blocking)
    loadSiteConfig();

    // Load and render app tiles instantly
    await loadApps();
    renderCategoryFilters();
    renderCards(apps);
    bindSearch();
    bindAboutModal();
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
        footerEl.innerHTML = config.footerText;
      }

      // Fill modal configs dynamically
      const modalTagline = document.getElementById('modal-tagline');
      const modalBlogLink = document.getElementById('modal-blog-link');

      if (modalBlogLink && config.blogUrl) {
        modalBlogLink.href = config.blogUrl;
      }
      if (modalTagline && typeof config.tagline === 'string') {
        if (config.tagline) {
          modalTagline.textContent = config.tagline;
          modalTagline.style.display = 'block';
        } else {
          modalTagline.style.display = 'none';
        }
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

      // Inject custom fonts
      const fontStyles = new Set();
      apps.forEach(app => {
        if (app.fontFamily && app.fontUrl) {
          const rule = `@font-face { font-family: '${app.fontFamily}'; src: url('${app.fontUrl}'); font-display: swap; }`;
          fontStyles.add(rule);
        }
      });

      if (fontStyles.size > 0) {
        const styleEl = document.createElement('style');
        styleEl.textContent = Array.from(fontStyles).join('\n');
        document.head.appendChild(styleEl);
      }
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
          <span class="app-card__title" ${app.fontFamily ? `style="font-family: '${escapeHtml(app.fontFamily)}';"` : ''}>${escapeHtml(app.title)}</span>
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

  // ── About Modal ──
  function bindAboutModal() {
    const aboutLink = document.getElementById('about-link');
    const aboutModal = document.getElementById('about-modal');
    const modalClose = document.getElementById('modal-close');

    if (aboutLink && aboutModal) {
      aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        aboutModal.showModal();
      });
    }

    if (modalClose && aboutModal) {
      modalClose.addEventListener('click', () => {
        aboutModal.close();
      });
    }

    // Close when clicking outside of modal card (on backdrop)
    if (aboutModal) {
      aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
          aboutModal.close();
        }
      });
    }
  }

  // ── Utils ──
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Idle Greet Bubble ──
  function initGreetBubble() {
    const logo = document.getElementById('site-logo');
    const bubble = document.getElementById('greet-bubble');
    if (!logo || !bubble) return;

    let idleTime = 0;
    let idleInterval = null;
    let bubbleTimer;

    const messages = [
      "👋 Hola, Amigo!",
      "Welcome to PlayAmigos! 🚀",
      "Ready to learn something new today?",
      "Boost your productivity! ⚡",
      "Fact: Our apps use ZERO tracking. 🛡️",
      "100% Ad-Free experiences. Always. 🚫📺",
      "Most of our apps are completely free! 💸",
      "Enjoy our generous lifelong free plans! 🎁",
      "Your privacy is our priority. 🔒",
      "Explore curated tools just for you! 🔍",
      "We build with ❤️ for learners.",
      "Stay focused, stay productive. 🎯",
      "No hidden fees, no surprises. ✨",
      "Building habits made simple. 🧱",
      "Hello there! Have a great day! ☀️",
      "Fact: We don't sell your data. Ever. 🛑",
      "Level up your daily workflow! 📈",
      "Tools designed for elegance and simplicity. 🎨",
      "Greetings from the PlayAmigos team! 👋",
      "Discover your next favorite app today! 💡"
    ];

    const showBubble = (specificMsg = null) => {
      const msg = specificMsg || messages[Math.floor(Math.random() * messages.length)];
      bubble.textContent = msg;
      bubble.classList.add('show');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => {
        bubble.classList.remove('show');
      }, 4000);
    };

    const triggerGlitch = () => {
      document.body.classList.add('glitch-active');
      setTimeout(() => {
        document.body.classList.remove('glitch-active');
        showBubble("The glitch is just to alert you, never mind! 😅");
      }, 450); // Match new animation duration
    };

    const startIdleTracking = () => {
      if (idleInterval) clearInterval(idleInterval);
      idleTime = 0;
      idleInterval = setInterval(() => {
        idleTime++;
        if (idleTime % 20 === 0) {
          triggerGlitch();
        } else if (idleTime % 5 === 0) {
          showBubble();
        }
      }, 1000);
    };

    const resetIdle = () => {
      startIdleTracking();
    };

    logo.addEventListener('click', () => {
      showBubble();
    });

    const events = ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'];
    events.forEach(evt => document.addEventListener(evt, resetIdle, true));

    // Start initial timer
    startIdleTracking();
  }

  // ── Interactive Honeybee ──
  function initBeeSimulator() {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Synthesize death sounds
    let audioCtx;
    const playDeathSound = () => {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        // High pitch scream
        const screamOsc = audioCtx.createOscillator();
        const screamGain = audioCtx.createGain();
        screamOsc.connect(screamGain);
        screamGain.connect(audioCtx.destination);
        
        screamOsc.type = 'sawtooth';
        screamOsc.frequency.setValueAtTime(800, audioCtx.currentTime);
        screamOsc.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.2);
        
        screamGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        screamGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        
        screamOsc.start();
        screamOsc.stop(audioCtx.currentTime + 0.2);

        // Falling whistle
        const fallOsc = audioCtx.createOscillator();
        const fallGain = audioCtx.createGain();
        fallOsc.connect(fallGain);
        fallGain.connect(audioCtx.destination);
        
        fallOsc.type = 'sine';
        fallOsc.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.2);
        fallOsc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1.5);
        
        fallGain.gain.setValueAtTime(0, audioCtx.currentTime);
        fallGain.gain.setValueAtTime(0.2, audioCtx.currentTime + 0.2);
        fallGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
        
        fallOsc.start(audioCtx.currentTime + 0.2);
        fallOsc.stop(audioCtx.currentTime + 1.5);
      } catch (e) { console.error('Audio failed', e); }
    };

    const playSlipperSound = () => {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        // Low thump
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);

        // Noise burst
        const noiseOsc = audioCtx.createOscillator();
        const noiseGain = audioCtx.createGain();
        noiseOsc.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noiseOsc.type = 'square';
        noiseOsc.frequency.setValueAtTime(500, audioCtx.currentTime);
        noiseOsc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
        noiseGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        noiseOsc.start();
        noiseOsc.stop(audioCtx.currentTime + 0.05);
      } catch (e) {}
    };

    const chatPhrases = [
      "Catch me if you can!",
      "Too slow!",
      "Slowmo today?",
      "Missed me!",
      "Bzzzz!",
      "I am speed! ⚡",
      "Nope! 😜",
      "You almost had it!",
      "Keep trying!"
    ];

    let difficultyLevel = 1;

    function spawnBee() {
      const beeWrapper = document.createElement('div');
      beeWrapper.className = 'bee-wrapper';
      
      const beeContainer = document.createElement('div');
      beeContainer.className = 'bee-container';
      
      const beeChat = document.createElement('div');
      beeChat.className = 'bee-chat-bubble';
      
      // Minimal SVG Bee (PlayAmigos themed colors: soft blue, pink, and classic yellow/black)
      beeContainer.innerHTML = `
        <svg viewBox="0 0 100 100" class="bee-svg">
          <!-- Wings (Tear-drop shape) -->
          <path d="M 40 40 C 20 10, -10 30, 25 50 Z" fill="rgba(255,255,255,0.7)" stroke="#93c5fd" stroke-width="1.5" class="bee-wing bee-wing-left" />
          <path d="M 60 40 C 80 10, 110 30, 75 50 Z" fill="rgba(255,255,255,0.7)" stroke="#93c5fd" stroke-width="1.5" class="bee-wing bee-wing-right" />
          <!-- Body -->
          <ellipse cx="50" cy="55" rx="22" ry="32" fill="#facc15" />
          <!-- Stripes -->
          <path d="M 30 50 Q 50 62 70 50 L 69 60 Q 50 72 31 60 Z" fill="#1f2937" />
          <path d="M 34 68 Q 50 80 66 68 L 63 76 Q 50 86 37 76 Z" fill="#1f2937" />
          <!-- Eyes -->
          <circle cx="42" cy="40" r="4" fill="#1f2937" />
          <circle cx="58" cy="40" r="4" fill="#1f2937" />
          <circle cx="41" cy="39" r="1.5" fill="#fff" />
          <circle cx="57" cy="39" r="1.5" fill="#fff" />
          <!-- Stinger -->
          <polygon points="46,86 54,86 50,98" fill="#1f2937" />
        </svg>
      `;
      
      beeWrapper.appendChild(beeContainer);
      beeWrapper.appendChild(beeChat);
      document.body.appendChild(beeWrapper);
      
      // Physics state
      let x = Math.random() * window.innerWidth;
      let y = -50;
      let vx = 0;
      let vy = 0;
      
      let baseNormalSpeed = 1.5 + (difficultyLevel * 1.5);
      let baseFleeSpeed = 6 + (difficultyLevel * 4);
      let evadeRadius = 120 + (difficultyLevel * 25);
      
      let maxSpeed = baseNormalSpeed;
      let isSpeaking = false;
      let isDead = false;
      let speakTimer;
      
      // Continuous Buzzing Sound
      let buzzOsc, buzzGain, panner;
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        buzzOsc = audioCtx.createOscillator();
        buzzGain = audioCtx.createGain();
        panner = audioCtx.createStereoPanner();
        
        buzzOsc.connect(buzzGain);
        buzzGain.connect(panner);
        panner.connect(audioCtx.destination);
        
        buzzOsc.type = 'sawtooth';
        buzzOsc.frequency.value = 150;
        
        buzzGain.gain.value = 0.02; // Very quiet background buzz
        buzzOsc.start();
      } catch(e) {}
      
      const showChat = () => {
        if (isDead) return;
        const msg = chatPhrases[Math.floor(Math.random() * chatPhrases.length)];
        beeChat.textContent = msg;
        beeChat.classList.add('show');
        isSpeaking = true;
        maxSpeed = baseNormalSpeed * 0.4; // Slow down while speaking
        
        speakTimer = setTimeout(() => {
          beeChat.classList.remove('show');
          isSpeaking = false;
          maxSpeed = baseNormalSpeed;
        }, 3000);
      };

      const speakInterval = setInterval(() => {
        if (!isDead && !isSpeaking && Math.random() > 0.4) showChat();
      }, 4000);

      // Handle catch (global click with hit radius)
      const handleHit = (e) => {
        if (isDead) return;
        
        // Show hit effect indicator on EVERY click
        const indicator = document.createElement('div');
        indicator.className = 'hit-indicator';
        indicator.style.left = e.clientX + 'px';
        indicator.style.top = e.clientY + 'px';
        document.body.appendChild(indicator);
        setTimeout(() => indicator.remove(), 400);

        // Play slipper swat sound on EVERY click
        playSlipperSound();
        
        // Check distance to bee center
        const dx = e.clientX - x;
        const dy = e.clientY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const hitRadius = 60; // Forgiving hit box!
        
        if (dist < hitRadius) {
          isDead = true;
          
          clearInterval(speakInterval);
          clearTimeout(speakTimer);
          beeChat.classList.remove('show');
          
          if (buzzOsc) {
            buzzOsc.stop();
            buzzOsc.disconnect();
          }

          playDeathSound();
          beeContainer.classList.add('dead-bee');
          
          // Force vertical velocity for the fall
          vy = 20;
          vx = 0;
          
          setTimeout(() => {
            beeWrapper.remove();
            document.removeEventListener('mousedown', handleHit);
            difficultyLevel++;
            setTimeout(spawnBee, 2000); // Respawn harder bee!
          }, 1500);
        }
      };
      
      // Delay attaching listener so it doesn't instantly die on spawn if mouse is down
      setTimeout(() => {
        document.addEventListener('mousedown', handleHit);
      }, 100);

      let lastTime = performance.now();
      let currentAngle = 0;
      
      function updatePhysics(time) {
        requestAnimationFrame(updatePhysics);
        
        const dt = Math.min((time - lastTime) / 16.66, 2); // Normalized to 60fps, cap at 2 to prevent huge jumps
        lastTime = time;

        if (isDead) {
          // Dead fall physics (straight down)
          vy += 1 * dt; // Gravity
          y += vy * dt;
          currentAngle += 15 * dt; // Spin rapidly while falling
          
          beeWrapper.style.transform = `translate(${x - 20}px, ${y - 20}px)`;
          beeContainer.style.transform = `rotate(${currentAngle}deg)`;
          return; // Skip living physics
        }
        
        // Distance to cursor
        const dx = mouseX - x;
        const dy = mouseY - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        let ax = 0;
        let ay = 0;
        
        if (dist < evadeRadius) {
          // Flee!
          if (isSpeaking) {
            beeChat.classList.remove('show');
            isSpeaking = false;
            clearTimeout(speakTimer);
          }
          maxSpeed = baseFleeSpeed;
          
          // Repulsion force inversely proportional to distance
          const force = Math.pow((evadeRadius - dist) / evadeRadius, 2) * 5;
          ax = -(dx / dist) * force;
          ay = -(dy / dist) * force;
        } else {
          // Normal wander / drift to center
          if (!isSpeaking) maxSpeed = baseNormalSpeed;
          
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          
          // Gentle pull to center if far away
          ax = (cx - x) * 0.0002;
          ay = (cy - y) * 0.0002;
          
          // Random jitter for natural flying
          ax += (Math.random() - 0.5) * 0.8;
          ay += (Math.random() - 0.5) * 0.8;
        }
        
        // Wall Repulsion (Evade corners)
        const wallMargin = 80;
        const wallForce = 1.5;
        if (x < wallMargin) ax += ((wallMargin - x) / wallMargin) * wallForce;
        if (x > window.innerWidth - wallMargin) ax -= ((x - (window.innerWidth - wallMargin)) / wallMargin) * wallForce;
        if (y < wallMargin) ay += ((wallMargin - y) / wallMargin) * wallForce;
        if (y > window.innerHeight - wallMargin) ay -= ((y - (window.innerHeight - wallMargin)) / wallMargin) * wallForce;
        
        vx += ax * dt;
        vy += ay * dt;
        
        // Friction
        vx *= 0.94;
        vy *= 0.94;
        
        // Clamp speed
        const speed = Math.sqrt(vx * vx + vy * vy) || 1;
        if (speed > maxSpeed) {
          vx = (vx / speed) * maxSpeed;
          vy = (vy / speed) * maxSpeed;
        }
        
        x += vx * dt;
        y += vy * dt;
        
        // Screen bounds bouncing
        const margin = 20;
        if (x < margin) { x = margin; vx *= -1; }
        if (x > window.innerWidth - margin) { x = window.innerWidth - margin; vx *= -1; }
        if (y < margin) { y = margin; vy *= -1; }
        if (y > window.innerHeight - margin) { y = window.innerHeight - margin; vy *= -1; }
        
        // Rhythmic hovering
        const hoverOffset = Math.sin(time / 200) * 8;
        
        // Smooth rotation
        const targetAngle = Math.atan2(vy, vx) * (180 / Math.PI) + 90;
        let diff = targetAngle - currentAngle;
        
        // Wrap around logic for smooth shortest-path rotation
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        
        currentAngle += diff * 0.15; // lerp factor
        
        // Panning Audio
        if (panner && buzzOsc) {
          let panValue = (x / window.innerWidth) * 2 - 1;
          panner.pan.value = Math.max(-1, Math.min(1, panValue));
          buzzOsc.frequency.value = 150 + Math.sin(time / 40) * 15; // flutter modulation
        }

        beeWrapper.style.transform = `translate(${x - 20}px, ${y - 20 + hoverOffset}px)`;
        beeContainer.style.transform = `rotate(${currentAngle}deg)`;
      }
      
      requestAnimationFrame(updatePhysics);
    }

    // Delay first spawn
    setTimeout(spawnBee, 2000);
  }

  // ── Go ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      initGreetBubble();
      initBeeSimulator();
    });
  } else {
    init();
    initGreetBubble();
    initBeeSimulator();
  }
})();
