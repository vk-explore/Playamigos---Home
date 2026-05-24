/**
 * PlayAmigos — Interactive Particle System
 *
 * Particles form concentric rings (circles) around the center of the page.
 * They slowly orbit, scatter on mouse/touch interaction, and smoothly
 * reform when the cursor moves away. Subtle connecting lines create a
 * mesh network effect.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ── State ──
  let W, H, centerX, centerY;
  let particles = [];
  let mouse = { x: -9999, y: -9999 };
  let animId;
  let time = 0; // Incremented every frame for wave movement

  // ── Config ──
  const REPEL_RADIUS = 150;
  const REPEL_FORCE = 6;
  const RETURN_SPEED = 0.035;
  const DAMPING = 0.88;
  const CONNECT_DIST = 60;
  const CONNECT_ALPHA = 0.08;

  // Single premium color for all particles (off-white with subtle lavender tint)
  const PARTICLE_COLOR = { r: 240, g: 240, b: 255 };

  // ── Resize ──
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    centerX = W / 2;
    centerY = H * 0.36; // Slightly above center, aligned with logo
    initParticles();
  }

  // ── Create Particles ──
  function initParticles() {
    particles = [];

    const baseR = Math.min(W, H) * 0.055;
    const rings = [
      { r: baseR * 1.4,  n: 10,  speed: 0.0007 },
      { r: baseR * 2.4,  n: 16,  speed: 0.0005 },
      { r: baseR * 3.5,  n: 24,  speed: 0.00035 },
      { r: baseR * 4.8,  n: 32,  speed: 0.00025 },
      { r: baseR * 6.2,  n: 40,  speed: 0.00018 },
    ];

    rings.forEach(function (ring, ri) {
      for (var i = 0; i < ring.n; i++) {
        var angle = (Math.PI * 2 / ring.n) * i + (Math.random() - 0.5) * 0.2;
        var orbit = ring.r + (Math.random() - 0.5) * 8;
        var spd = ring.speed * (0.85 + Math.random() * 0.3);

        particles.push({
          // current position
          x: centerX + Math.cos(angle) * orbit,
          y: centerY + Math.sin(angle) * orbit,
          // velocity
          vx: 0,
          vy: 0,
          // orbit params
          angle: angle,
          orbit: orbit,
          speed: spd,
          // appearance
          size: 1 + Math.random() * 1.8,
          color: PARTICLE_COLOR,
          baseAlpha: 0.15 + Math.random() * 0.35,
          // metadata
          ring: ri,
          type: 'ring'
        });
      }
    });

    // Ambient floating particles for depth
    var ambientCount = Math.floor(Math.min(W, H) / 25);
    for (var a = 0; a < ambientCount; a++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: 0.4 + Math.random() * 1.2,
        color: PARTICLE_COLOR,
        baseAlpha: 0.06 + Math.random() * 0.12,
        type: 'ambient'
      });
    }
  }

  // ── Update ──
  function update() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      if (p.type === 'ring') {
        // Rotate orbit slowly
        p.angle += p.speed;

        // Continuous, fluid organic waving drift even when idle
        // Combines multiple frequencies to simulate fluid turbulence/morphing
        var driftX = Math.sin(p.angle * 2 + time) * 8 + Math.cos(p.ring * 2 - time * 0.8) * 4;
        var driftY = Math.cos(p.angle * 2.5 - time * 1.1) * 8 + Math.sin(p.ring * 1.5 + time) * 4;

        var tx = centerX + Math.cos(p.angle) * p.orbit + driftX;
        var ty = centerY + Math.sin(p.angle) * p.orbit + driftY;

        // Mouse repulsion
        var dx = p.x - mouse.x;
        var dy = p.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS && dist > 0) {
          var force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          // Smooth easing on force
          force = Math.pow(force, 1.5);
          var ang = Math.atan2(dy, dx);
          p.vx += Math.cos(ang) * force * REPEL_FORCE;
          p.vy += Math.sin(ang) * force * REPEL_FORCE;
        }

        // Spring back to orbit target
        p.vx += (tx - p.x) * RETURN_SPEED;
        p.vy += (ty - p.y) * RETURN_SPEED;

        // Damping for fluid viscosity
        p.vx *= DAMPING;
        p.vy *= DAMPING;

        p.x += p.vx;
        p.y += p.vy;

      } else {
        // Ambient: gentle flow drift with screen-wrap
        // Adds subtle organic sway to simulate floating
        var swayX = Math.sin(p.y * 0.005 + time) * 0.06;
        var swayY = Math.cos(p.x * 0.005 - time) * 0.06;

        p.x += p.vx + swayX;
        p.y += p.vy + swayY;

        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      }
    }
  }

  // ── Draw ──
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw connecting lines (ring particles only, same/adjacent rings)
    for (var i = 0; i < particles.length; i++) {
      var a = particles[i];
      if (a.type !== 'ring') continue;

      for (var j = i + 1; j < particles.length; j++) {
        var b = particles[j];
        if (b.type !== 'ring') continue;
        if (Math.abs(a.ring - b.ring) > 1) continue;

        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var d = Math.sqrt(dx * dx + dy * dy);

        if (d < CONNECT_DIST) {
          var alpha = CONNECT_ALPHA * (1 - d / CONNECT_DIST);
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(240, 240, 255,' + alpha + ')';
          ctx.lineWidth = 0.55;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (var k = 0; k < particles.length; k++) {
      var p = particles[k];

      // Glow boost near mouse
      var dxm = p.x - mouse.x;
      var dym = p.y - mouse.y;
      var dm = Math.sqrt(dxm * dxm + dym * dym);
      var glowBoost = dm < 200 ? (200 - dm) / 200 * 0.45 : 0;
      var alpha = Math.min(1, p.baseAlpha + glowBoost);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.color.r + ',' + p.color.g + ',' + p.color.b + ',' + alpha + ')';
      ctx.fill();
    }
  }

  // ── Animation Loop ──
  function animate() {
    time += 0.008; // Increment time for waves
    update();
    draw();
    animId = requestAnimationFrame(animate);
  }

  // ── Events ──
  window.addEventListener('resize', function () {
    resize();
  });

  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  document.addEventListener('mouseleave', function () {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // Touch support
  document.addEventListener('touchmove', function (e) {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });

  document.addEventListener('touchend', function () {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // ── Init ──
  resize();
  animate();
})();
