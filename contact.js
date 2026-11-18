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

// ================= INTRO: PLANE FROM BEHIND THE NAVBAR (GPU / COMPOSITOR VERSION) =================
// Why this version is smooth:
//  - NOTHING is painted per frame. Stars and trails are drawn ONCE into static canvases.
//  - Everything that moves (plane, stars, trails, haze, white fade) is animated with transform + opacity
//    through the Web Animations API, so the browser's compositor (GPU) runs it off the main thread.
//    Even if the page is still decoding images / CSS on GitHub Pages, the animation does not stutter.
//  - Layers are created and rasterized BEFORE the animation starts (paused for two frames), so there is
//    no first-frame hitch.
//  - The start waits for fonts, the window load event and image decoding.
const root = document.documentElement;

if (root.classList.contains("anim")) {
  const pill = document.getElementById("navbar-container");

  // ---------- tuning ----------
  const DURATION = 2300;   // ms total
  const FLY = 0.7;         // the plane has left the screen at this point of the timeline (0..1)
  const PLANE = 56;        // px at the start; grows a little as it dives toward you
  const N = 60;            // keyframes per animation (linear between them)
  const PS = 135;          // plane element size in px (drawn at max size, only ever scaled DOWN = always crisp)

  // ---------- helpers ----------
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const ease = (t) => t * t * (2.2 - 1.2 * t);              // slow emerge from the navbar, then speeds up
  const speedOf = (t) => (4.4 * t - 3.6 * t * t) / 1.34;    // derivative of ease, 0..1
  const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const f2 = (n) => n.toFixed(2);

  // Styles for the intro layers (injected here so only this file needs to change)
  const style = document.createElement("style");
  style.textContent = `
    .intro-fx{position:fixed;inset:0;z-index:900;overflow:hidden;pointer-events:none;contain:strict}
    .intro-fx>*{position:absolute;left:0;top:0;will-change:transform,opacity;backface-visibility:hidden}
    html.anim:not(.ready) .scroll-plane svg{animation-play-state:paused}
  `;
  document.head.appendChild(style);

  // One soft gaussian glow sprite, used only to draw the static star / trail canvases
  const glow = (() => {
    const S = 128, c = document.createElement("canvas"); c.width = c.height = S;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    for (let i = 0; i <= 16; i++) {
      const x = i / 16;
      const a = Math.exp(-3.4 * x * x) * (1 - x * x * x * x);
      const tint = Math.round(255 - 38 * x);
      gr.addColorStop(x, `rgba(${tint},${Math.round(255 - 24 * x)},255,${a.toFixed(4)})`);
    }
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    return c;
  })();

  let overlay = null;

  function finish() {
    window.scrollTo(0, 0);
    root.classList.add("ready");
    requestAnimationFrame(() => { if (overlay) overlay.remove(); style.remove(); });
  }

  function run() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const SC = clamp(W / 900, 0.72, 1.25);

    const pr = pill.getBoundingClientRect();
    const y0 = pr.bottom - 30;           // plane starts hidden behind the navbar pill
    const y1 = H + 130;                  // and ends below the screen
    const D = y1 - y0;
    const px = W / 2;

    // ---------- pre-compute the whole timeline once ----------
    const S = [];
    let sSpeed = 0, dFar = 0, dNear = 0;
    const dtS = DURATION / 1000 / N;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const tp = clamp(t / FLY, 0, 1);
      const e = ease(tp);
      const v = tp >= 1 ? 0 : clamp(speedOf(tp), 0, 1);
      sSpeed += ((14 + 900 * v) - sSpeed) * (1 - Math.exp(-dtS * 7));
      if (i > 0) { dFar += sSpeed * 0.44 * dtS; dNear += sSpeed * 0.81 * dtS; }
      const s = 1 + 0.7 * e;
      S.push({
        t, e, s,
        py: y0 + D * e,
        k: PLANE * s / 24,
        far: dFar, near: dNear,
        starFade: smooth(0, 0.12, t) * (1 - smooth(0.55, 0.9, t))
      });
    }
    // how far the star layers travel while still visible
    let farMax = 0, nearMax = 0;
    for (const p of S) if (p.t <= 0.92) { farMax = p.far; nearMax = p.near; }

    // ---------- DOM ----------
    overlay = document.createElement("div");
    overlay.className = "intro-fx";
    overlay.setAttribute("aria-hidden", "true");

    const anims = [];
    const animate = (el, frames) => {
      const a = el.animate(frames, { duration: DURATION, easing: "linear", fill: "both" });
      a.pause();                                   // hold the first frame until everything is rasterized
      anims.push(a);
      return a;
    };
    const mkCanvas = (w, h) => {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.ceil(w));
      c.height = Math.max(1, Math.ceil(h));
      c.style.width = c.width + "px";
      c.style.height = c.height + "px";
      return c;
    };
    const tr = (x, y) => `translate3d(${f2(x)}px,${f2(y)}px,0)`;
    const op = (v) => Math.max(0.01, v);          // never 0, so the layer is rasterized up front

    // ----- stars: two static canvases (far / near) that slide up at different speeds -----
    const baseStars = clamp(Math.round(W * H / 11000), 50, 130);
    const rnd = mulberry(11);
    function starLayer(h, zLo, zHi, seed) {
      const c = mkCanvas(W, h);
      const g = c.getContext("2d");
      const r2 = mulberry(seed);
      const count = Math.round(baseStars * (h / H) * 0.5);
      for (let i = 0; i < count; i++) {
        const sideStar = r2() < 0.82;
        const x = sideStar ? (r2() < 0.5 ? r2() * W * 0.38 : W - r2() * W * 0.38) : r2() * W;
        const y = r2() * h;
        const z = zLo + r2() * (zHi - zLo);
        const r = (0.5 + z * 1.2) * Math.min(SC, 1.1);
        const a = (0.35 + z * 0.55) * (0.65 + 0.35 * r2());
        if (z > 0.45) {
          g.globalAlpha = a * 0.3;
          g.drawImage(glow, x - r * 4, y - r * 4, r * 8, r * 8);
        }
        g.globalAlpha = a;
        g.fillStyle = "#fff";
        g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
      }
      return c;
    }
    const starFar = starLayer(H + Math.ceil(farMax) + 30, 0, 0.5, 101);
    const starNear = starLayer(H + Math.ceil(nearMax) + 30, 0.5, 1, 202);
    overlay.appendChild(starFar);
    overlay.appendChild(starNear);
    animate(starFar, S.map(p => ({ offset: p.t, transform: tr(0, -p.far), opacity: op(p.starFade) })));
    animate(starNear, S.map(p => ({ offset: p.t, transform: tr(0, -p.near), opacity: op(p.starFade) })));

    // ----- big soft bloom that melts the screen into white (drawn tiny, scaled up by the GPU) -----
    const bw = Math.ceil(W * 1.8 / 4), bh = Math.ceil(H * 1.8 / 4);
    const bloom = document.createElement("div");
    bloom.style.cssText = `width:${bw}px;height:${bh}px;background:radial-gradient(closest-side,rgba(255,255,255,.9),rgba(255,255,255,.6) 45%,rgba(255,255,255,0))`;
    overlay.appendChild(bloom);
    animate(bloom, S.map(p => ({
      offset: p.t,
      transform: `${tr(px - bw / 2, H * 0.5 - bh / 2)} scale(${f2(4 * (0.3 + 0.7 * smooth(0.2, 0.9, p.t)))})`,
      opacity: op(smooth(0.22, 0.9, p.t))
    })));

    // ----- haze that rides along with the plane -----
    const hz = Math.ceil(Math.max(W * 0.9, 300) / 4);
    const haze = document.createElement("div");
    haze.style.cssText = `width:${hz}px;height:${hz}px;background:radial-gradient(closest-side,rgba(255,255,255,.7),rgba(255,255,255,.3) 50%,rgba(255,255,255,0))`;
    overlay.appendChild(haze);
    animate(haze, S.map(p => ({
      offset: p.t,
      transform: `${tr(px - hz / 2, p.py - 10 * p.k - hz / 2)} scale(${f2(4 * (0.4 + 0.6 * p.e))})`,
      opacity: op(0.8 * smooth(0, 0.25, p.e))
    })));

    // ----- contrails: pre-drawn ONCE at full length, then revealed with a cheap scaleY from the top -----
    function drawTrail(c, wing, seed) {
      const g = c.getContext("2d");
      const r2 = mulberry(seed);
      const cx = c.width / 2;
      const r0 = (wing ? 2.8 : 4.8) * SC;
      const r1 = (wing ? 34 : 46) * SC;
      const life = wing ? 1.05 : 1.2;
      const amax = wing ? 0.85 : 0.55;
      for (let y = 0; y <= D; y += 3) {
        const u = 1 - y / D;                                   // 0 at the plane end, 1 at the old end
        const age = u * life;
        const grow = 1 - Math.pow(1 - u, 2.2);
        const r = r0 + (r1 * (0.85 + r2() * 0.3) - r0) * grow;
        const x = cx + Math.sin(age * 2.4 + r2() * 6.28) * (6 + r2() * 12) * SC * smooth(0, 1, u);
        const a = smooth(0, 0.05, u) * Math.pow(1 - smooth(0, 1, u), 1.15) * amax;
        if (a < 0.004) continue;
        g.globalAlpha = a;
        g.drawImage(glow, x - r, y - r, r * 2, r * 2);
      }
    }
    const wingW = Math.ceil(130 * SC), midW = Math.ceil(160 * SC);
    const trailMid = mkCanvas(midW, D);
    const trailL = mkCanvas(wingW, D);
    const trailR = mkCanvas(wingW, D);
    drawTrail(trailMid, false, 7);
    drawTrail(trailL, true, 8);
    drawTrail(trailR, true, 9);
    [trailMid, trailL, trailR].forEach(c => { c.style.transformOrigin = "0 0"; overlay.appendChild(c); });
    const grow = (p) => `scale(1,${f2(Math.max(p.e, 0.001))})`;
    animate(trailMid, S.map(p => ({ offset: p.t, transform: `${tr(px - midW / 2, y0)} ${grow(p)}`, opacity: 1 })));
    animate(trailL, S.map(p => ({ offset: p.t, transform: `${tr(px - 9.5 * p.k - wingW / 2, y0)} ${grow(p)}`, opacity: 1 })));
    animate(trailR, S.map(p => ({ offset: p.t, transform: `${tr(px + 9.5 * p.k - wingW / 2, y0)} ${grow(p)}`, opacity: 1 })));

    // ----- the aircraft: nose down, white with a dark outline; sits behind the navbar pill (z-index) so it emerges from it -----
    const plane = document.createElement("div");
    plane.style.cssText = `width:${PS}px;height:${PS}px`;
    plane.innerHTML =
      `<div style="position:absolute;left:50%;top:50%;width:302px;height:302px;margin:-151px 0 0 -151px;transform:translateY(32px);opacity:.5;background:radial-gradient(closest-side,rgba(255,255,255,1),rgba(255,255,255,.55) 25%,rgba(255,255,255,.2) 50%,rgba(255,255,255,.05) 75%,rgba(255,255,255,0))"></div>` +
      `<svg viewBox="-5 -5 34 34" width="${PS}" height="${PS}" style="position:absolute;left:0;top:0;overflow:visible;transform:rotate(180deg)">` +
      `<defs><linearGradient id="introPlaneGrad" gradientUnits="userSpaceOnUse" x1="0" y1="2" x2="0" y2="22"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e7ecf6"/></linearGradient></defs>` +
      `<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="url(#introPlaneGrad)" stroke="rgba(26,26,26,.92)" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke fill"/>` +
      `</svg>`;
    overlay.appendChild(plane);
    animate(plane, S.map(p => ({
      offset: p.t,
      transform: `${tr(px - PS / 2, p.py - PS / 2)} scale(${f2(p.s / 1.7)})`,
      opacity: 1
    })));

    // ----- final solid white, so the handoff to the white card has no seam -----
    const white = document.createElement("div");
    white.style.cssText = `width:${W}px;height:${H}px;background:#fff`;
    overlay.appendChild(white);
    animate(white, S.map(p => ({ offset: p.t, transform: "translate3d(0,0,0)", opacity: op(smooth(0.84, 0.99, p.t)) })));

    document.documentElement.appendChild(overlay);   // child of <html>: unaffected by the body fade-in

    // Two frames so every layer is rasterized and uploaded to the GPU, then all animations start together
    requestAnimationFrame(() => requestAnimationFrame(() => {
      anims.forEach(a => a.play());
      Promise.all(anims.map(a => a.finished)).then(finish, finish);
    }));
  }

  // Safety net: never leave the page hidden if something goes wrong
  const failSafe = setTimeout(() => { if (overlay) overlay.remove(); root.classList.add("ready"); }, 9000);

  function start() {
    clearTimeout(failSafe);
    try {
      if (!Element.prototype.animate) throw new Error("Web Animations not supported");
      run();
    } catch (err) {
      console.error(err);
      if (overlay) overlay.remove();
      root.classList.add("ready");
    }
  }

  // Wait until the page has really finished loading (CDN CSS, fonts, images decoded)
  // so the browser isn't busy while the plane is flying.
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const pageLoaded = document.readyState === "complete"
    ? Promise.resolve()
    : new Promise(res => window.addEventListener("load", res, { once: true }));
  const decoded = pageLoaded.then(() => Promise.all(
    Array.from(document.images).map(img => (img.decode ? img.decode().catch(() => {}) : null))
  ));
  const timeout = new Promise(res => setTimeout(res, 3000));   // don't wait forever on slow networks

  Promise.race([Promise.all([fontsReady, decoded]), timeout]).then(() => setTimeout(start, 120));
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
