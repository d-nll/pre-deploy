// ================= BURGER MENU TOGGLE =================
const burgerToggle = document.getElementById("burger-toggle");
const mobileMenu = document.getElementById("mobile-menu");
// Links that should close the menu (the Project button only opens its sub-menu)
const mobileMenuItems = document.querySelectorAll(".mobile-menu-item:not(.mobile-menu-toggle), .mobile-submenu a");
const mobileSubmenuToggle = document.querySelector(".mobile-menu-toggle");
const mobileSubmenu = document.getElementById("mobile-submenu");

function setMobileSubmenu(open) {
  if (!mobileSubmenuToggle || !mobileSubmenu) return;
  mobileSubmenu.classList.toggle("open", open);
  mobileSubmenuToggle.setAttribute("aria-expanded", String(open));
}

if (mobileSubmenuToggle && mobileSubmenu) {
  mobileSubmenuToggle.addEventListener("click", () => {
    setMobileSubmenu(!mobileSubmenu.classList.contains("open"));
  });
}

function setMobileMenu(open) {
  if (!burgerToggle || !mobileMenu) return;
  mobileMenu.classList.toggle("active", open);
  burgerToggle.classList.toggle("active", open);
  burgerToggle.setAttribute("aria-expanded", String(open));
  if (!open) setMobileSubmenu(false);
}

if (burgerToggle && mobileMenu) {
  burgerToggle.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent document click
    setMobileMenu(!mobileMenu.classList.contains("active"));
  });
}

// Close mobile menu when clicking a menu item
mobileMenuItems.forEach(item => {
  item.addEventListener("click", () => setMobileMenu(false));
});

// Close mobile menu when clicking outside
document.addEventListener("click", (e) => {
  if (!mobileMenu || !burgerToggle) return;
  if (!mobileMenu.contains(e.target) && !burgerToggle.contains(e.target)) {
    setMobileMenu(false);
  }
});

// Close mobile menu when the screen grows past phone size
window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) setMobileMenu(false);
});

// ================= DROPDOWN HANDLING =================
const dropdownToggles = document.querySelectorAll(".nav-item.dropdown .nav-link");

dropdownToggles.forEach(toggle => {
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    const parent = toggle.parentElement;
    parent.classList.toggle("show");

    // Close other dropdowns
    document.querySelectorAll(".nav-item.dropdown").forEach(item => {
      if (item !== parent) {
        item.classList.remove("show");
      }
    });
  });
});

// Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".nav-item.dropdown")) {
    document.querySelectorAll(".nav-item.dropdown").forEach(item => {
      item.classList.remove("show");
    });
  }
});

// Close menus with the Escape key
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  setMobileMenu(false);
  document.querySelectorAll(".nav-item.dropdown").forEach(item => {
    item.classList.remove("show");
  });
});

// Close the dropdown after picking an item
document.querySelectorAll(".dropdown-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item.dropdown").forEach(d => d.classList.remove("show"));
  });
});

// Placeholder links ("#") have nothing to scroll to
document.querySelectorAll('a[href="#"]').forEach(anchor => {
  anchor.addEventListener("click", (e) => e.preventDefault());
});

// ================= SCROLL EFFECT =================
const navbarContainer = document.getElementById("navbar-container");
const scrollProgress = document.getElementById("scroll-progress");
const scrollPlane = document.getElementById("scroll-plane");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function onScroll() {
  // Navbar turns glassy after a little scroll
  if (navbarContainer) {
    navbarContainer.classList.toggle("scrolled", window.scrollY > 50);
  }

  // Thin progress bar at the top of the page
  if (scrollProgress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    scrollProgress.style.transform = `scaleX(${ratio})`;

    // Airplane rides the tip of the bar
    if (scrollPlane) scrollPlane.style.setProperty("--p", ratio);
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ================= INTRO: PLANE FROM BEHIND THE NAVBAR, SOFT VAPOR TRAIL, STARRY SKY =================
// One canvas, one loop. Stars twinkle on both sides of the sky and stream upward as the plane dives.
// Two bright contrails peel off the wingtips, widen and drift gently, and a soft haze blooms into white.
const root = document.documentElement;

if (root.classList.contains("anim")) {
  const PLANE_PATH = new Path2D("M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z");
  const pill = document.getElementById("navbar-container");

  const canvas = document.createElement("canvas");
  canvas.className = "wave-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // ---------- tuning ----------
  const DURATION = 2300;   // ms total
  const FLY = 0.7;         // the plane has left the screen at this point of the timeline (0..1)
  const PLANE = 56;        // px at the start; grows a little as it dives toward you

  // ---------- helpers ----------
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const ease = (t) => t * t * (2.2 - 1.2 * t);              // slow emerge from the navbar, then speeds up
  const speedOf = (t) => (4.4 * t - 3.6 * t * t) / 1.34;    // derivative of ease, 0..1
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // One soft glow sprite: a true gaussian falloff (many stops, large size) so there is no banding or hard rim
  const glow = (() => {
    const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    for (let i = 0; i <= 16; i++) {
      const x = i / 16;
      const a = Math.exp(-3.4 * x * x) * (1 - x * x * x * x);   // gaussian, forced to exactly 0 at the rim
      const tint = Math.round(255 - 38 * x);                     // white core, faintly cool at the rim
      gr.addColorStop(x, `rgba(${tint},${Math.round(255 - 24 * x)},255,${a.toFixed(4)})`);
    }
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    return c;
  })();

  let W = 0, H = 0, SC = 1;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth;
    H = window.innerHeight;
    SC = clamp(W / 900, 0.72, 1.25);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }

  // ---------- run ----------
  function run() {
    resize();

    const pr = pill.getBoundingClientRect();
    const pillTop = pr.top;
    const pillBottom = pr.bottom;

    // The plane starts completely hidden behind the navbar pill and ends below the screen
    const y0 = pillBottom - 30;
    const y1 = H + 130;
    const px = W / 2;                                  // straight line, no sway

    const rnd = mulberry(11);

    // ----- stars: mostly on both sides of the flight path, each with its own depth and twinkle -----
    const stars = [];
    const starCount = clamp(Math.round(W * H / 8000), 70, 190);
    for (let i = 0; i < starCount; i++) {
      const sideStar = rnd() < 0.82;
      const x = sideStar ? (rnd() < 0.5 ? rnd() * W * 0.38 : W - rnd() * W * 0.38) : rnd() * W;
      const z = rnd();                                 // 0 far .. 1 near
      stars.push({
        x, y: rnd() * H, z,
        r: (0.5 + z * 1.2) * Math.min(SC, 1.1),
        a: 0.35 + z * 0.55,
        tw: 1.2 + rnd() * 2.4, ph: rnd() * 6.28
      });
    }
    let starSpeed = 0;                                 // smoothed, so the stars ease into and out of motion

    // ----- trail particles, oldest first -----
    const parts = [];
    let lastY = y0, lastHazeY = y0;
    let clock = 0, lastClock = 0;

    // Contrail particle: thin and bright when young, widening and fading as it ages, drifting a little
    const addTrail = (x, y, wing) => {
      if (parts.length > 2600) return;
      parts.push({
        kind: "trail", born: clock, x, y,
        r0: (wing ? 2.8 : 4.8) * SC,
        r1: (wing ? 34 : 46) * SC * (0.85 + rnd() * 0.3),
        life: wing ? 1.05 : 1.2,
        a: wing ? 0.85 : 0.55,
        amp: (6 + rnd() * 12) * SC, ph: rnd() * 6.28
      });
    };

    // Haze particle: very large and very soft, blooms outward and stays, so the trail melts into white
    const addHaze = (x, y) => {
      parts.push({
        kind: "haze", born: clock, x: x + (rnd() - .5) * 40 * SC, y,
        r0: 40 * SC,
        r1: Math.max(W * (0.34 + rnd() * 0.16), 260),
        a: 0.2
      });
    };

    let t0 = 0;

    function frame(now) {
      if (!t0) t0 = now;
      const t = clamp((now - t0) / DURATION, 0, 1);
      clock = t * DURATION / 1000;
      const dt = Math.min(clock - lastClock, 0.05);
      lastClock = clock;

      const tp = clamp(t / FLY, 0, 1);
      const e = ease(tp);
      const v = tp >= 1 ? 0 : clamp(speedOf(tp), 0, 1);
      const py = y0 + (y1 - y0) * e;
      const s = 1 + 0.7 * e;
      const k = PLANE * s / 24;

      // Emit along the path by distance (not by time), so the trail is continuous at any speed or frame rate
      while (tp < 1 && lastY + 3 <= py) {
        lastY += 3;
        const wy = lastY - 2.5 * k;                    // wingtips sit a little behind the plane's centre
        if (wy > pillTop + 8) {
          addTrail(px - 9.5 * k, wy, true);
          addTrail(px + 9.5 * k, wy, true);
          addTrail(px, lastY - 10 * k, false);
        }
      }
      while (tp < 1 && lastHazeY + 34 <= py) {
        lastHazeY += 34;
        if (lastHazeY > pillTop + 8) addHaze(px, lastHazeY - 10 * k);
      }

      ctx.clearRect(0, 0, W, H);

      // ----- stars (drawn first, so the haze washes over them) -----
      starSpeed += ((14 + 900 * v) - starSpeed) * (1 - Math.exp(-dt * 7));
      const starFade = smooth(0, 0.12, t) * (1 - smooth(0.55, 0.9, t));
      if (starFade > 0.004) {
        ctx.lineCap = "round";
        for (const st of stars) {
          const sp = starSpeed * (0.25 + st.z * 0.75);
          st.y -= sp * dt;
          if (st.y < -12) st.y += H + 24;
          const tw = 0.65 + 0.35 * Math.sin(clock * st.tw + st.ph);
          const al = st.a * tw * starFade;
          const len = sp * 0.026;
          if (len > 2) {                               // a faint streak when moving fast
            ctx.strokeStyle = `rgba(255,255,255,${(al * 0.55).toFixed(3)})`;
            ctx.lineWidth = st.r * 1.3;
            ctx.beginPath(); ctx.moveTo(st.x, st.y); ctx.lineTo(st.x, st.y + len); ctx.stroke();
          }
          ctx.globalAlpha = al * 0.3;                  // soft halo
          ctx.drawImage(glow, st.x - st.r * 4, st.y - st.r * 4, st.r * 8, st.r * 8);
          ctx.globalAlpha = al;                        // bright core
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // ----- trail + haze -----
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (p.kind === "trail" && clock - p.born >= p.life) parts.splice(i, 1);
      }

      for (const p of parts) {
        const age = clock - p.born;
        if (p.kind === "trail") {
          const u = clamp(age / p.life, 0, 1);
          const grow = 1 - Math.pow(1 - u, 2.2);
          const r = p.r0 + (p.r1 - p.r0) * grow;
          const x = p.x + Math.sin(age * 2.4 + p.ph) * p.amp * smooth(0, 1, u);   // slow, soft waft
          ctx.globalAlpha = smooth(0, 0.06, age) * Math.pow(1 - smooth(0, 1, u), 1.15) * p.a;
          ctx.drawImage(glow, x - r, p.y - r, r * 2, r * 2);
        } else {
          const g = clamp(age / 0.75, 0, 1);
          const r = p.r0 + (p.r1 - p.r0) * (1 - Math.pow(1 - g, 3));
          ctx.globalAlpha = p.a * smooth(0, 0.25, age);
          ctx.drawImage(glow, p.x - r, p.y - r, r * 2, r * 2);
        }
      }

      // Make sure the screen ends perfectly white, so the handoff to the white card has no seam
      const full = smooth(0.84, 0.99, t);
      if (full > 0) { ctx.globalAlpha = full; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); }
      ctx.globalAlpha = 1;

      // ----- the aircraft: white, nose down, perfectly straight; clipped at the navbar so it comes out from behind the pill -----
      if (tp < 1) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, pillTop + 2, W, H);
        ctx.clip();

        // soft halo behind the tail
        ctx.globalAlpha = 0.5;
        ctx.drawImage(glow, px - 38 * k, py - 30 * k, 76 * k, 76 * k);
        ctx.globalAlpha = 1;

        ctx.translate(px, py);
        ctx.rotate(Math.PI);
        ctx.scale(k, k);
        ctx.translate(-12, -12);
        ctx.lineJoin = "round";
        ctx.miterLimit = 2;

        // soft shadow + thin outline
        ctx.lineWidth = 2.6 / k;
        ctx.strokeStyle = "rgba(26,26,26,.92)";
        ctx.shadowColor = "rgba(0,0,0,.3)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 6;
        ctx.stroke(PLANE_PATH);
        ctx.shadowColor = "transparent";

        // body: bright at the nose, a touch cooler toward the tail
        const body = ctx.createLinearGradient(0, 2, 0, 22);
        body.addColorStop(0, "#ffffff");
        body.addColorStop(1, "#e7ecf6");
        ctx.fillStyle = body;
        ctx.fill(PLANE_PATH);
        ctx.restore();
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        // Solid white now: turn the card white and rise the content, then drop the canvas
        window.scrollTo(0, 0);
        root.classList.add("ready");
        requestAnimationFrame(() => canvas.remove());
      }
    }

    requestAnimationFrame(frame);
  }

  // Wait for fonts so the first frames are smooth, then a short beat before the plane leaves the navbar
  const go = () => setTimeout(run, 200);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go);
}

// ================= PAGE TRANSITION =================
document.querySelectorAll("a[href]").forEach(link => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href)) return;
    if (link.target === "_blank" || link.hasAttribute("download")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (prefersReducedMotion) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.hash) return;

    // Fade the page out, then go
    e.preventDefault();
    document.body.classList.add("page-leaving");
    setTimeout(() => { window.location.href = url.href; }, 300);
  });
});

// Coming back with the back button should never stay faded out
window.addEventListener("pageshow", (e) => {
  if (e.persisted) document.body.classList.remove("page-leaving");
});