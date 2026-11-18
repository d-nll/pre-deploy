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

const timelines = [...document.querySelectorAll(".timeline")];
const routes = [...document.querySelectorAll(".route")];

const clamp01 = (n) => Math.min(1, Math.max(0, n));

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

  // Education line draws itself, and each dot lights up when the line reaches it
  const mid = window.innerHeight * 0.62;
  timelines.forEach(tl => {
    const box = tl.getBoundingClientRect();
    tl.style.setProperty("--draw", clamp01((mid - box.top) / box.height).toFixed(3));

    tl.querySelectorAll(".tl-item").forEach(item => {
      const dot = item.querySelector(".tl-dot").getBoundingClientRect();
      item.classList.toggle("reached", dot.top + dot.height / 2 <= mid);
    });
  });

  // Travel plane flies along the dotted route while you scroll past it
  routes.forEach(route => {
    const box = route.getBoundingClientRect();
    const p = clamp01((window.innerHeight - box.top) / (window.innerHeight * 0.9));
    route.style.setProperty("--route", p.toFixed(3));
  });
}

// One update per frame keeps scrolling smooth
let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    onScroll();
    ticking = false;
  });
}, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

// ================= SCROLL REVEAL =================
// Items inside a [data-stagger] group come in one after another
document.querySelectorAll("[data-stagger]").forEach(group => {
  group.querySelectorAll(":scope > .reveal").forEach((item, i) => {
    item.style.setProperty("--d", `${i * 0.09}s`);
  });
});

const revealTargets = document.querySelectorAll(".reveal");

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  revealTargets.forEach(el => revealObserver.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add("in"));
}

// ================= CERTIFICATION FILTER =================
const certTabs = document.querySelectorAll(".cert-tab");
const certCards = document.querySelectorAll(".cert-card");

function filterCerts(filter) {
  certTabs.forEach(tab => {
    const on = tab.dataset.filter === filter;
    tab.classList.toggle("active", on);
    tab.setAttribute("aria-pressed", String(on));
  });

  certCards.forEach(card => {
    const show = filter === "all" || card.dataset.cat === filter;

    if (show) {
      // Bring it back: unhide first, then fade in on the next frame
      card.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove("out")));
    } else {
      // Fade out first, then take it out of the layout
      card.classList.add("out");
      setTimeout(() => {
        if (card.classList.contains("out")) card.hidden = true;
      }, 320);
    }
  });
}

certTabs.forEach(tab => {
  tab.addEventListener("click", () => filterCerts(tab.dataset.filter));
});

// ================= LUMPIA WRAPPER =================
const lumpiaRadios = [...document.querySelectorAll('.lumpia input[name="slide"]')];
const lumpiaCount = document.querySelector(".lumpia-count");

function updateLumpia() {
  if (!lumpiaCount) return;
  const current = Math.max(0, lumpiaRadios.findIndex(r => r.checked)) + 1;
  const pad = (n) => String(n).padStart(2, "0");
  lumpiaCount.innerHTML = `<b>${pad(current)}</b> / ${pad(lumpiaRadios.length)}`;
}

lumpiaRadios.forEach(radio => radio.addEventListener("change", updateLumpia));

// Arrow buttons go to the previous / next place (and loop around)
document.querySelectorAll(".lumpia-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const total = lumpiaRadios.length;
    const from = Math.max(0, lumpiaRadios.findIndex(r => r.checked));
    lumpiaRadios[(from + Number(btn.dataset.dir) + total) % total].checked = true;
    updateLumpia();
  });
});

updateLumpia();

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