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

// ================= SCROLL EFFECT =================
const navbarContainer = document.getElementById("navbar-container");
const scrollProgress = document.getElementById("scroll-progress");
const scrollPlane = document.getElementById("scroll-plane");

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

// ================= SMOOTH SCROLL =================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    e.preventDefault();

    // Placeholder links ("#") have nothing to scroll to
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Close the dropdown after picking an item
document.querySelectorAll(".dropdown-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item.dropdown").forEach(d => d.classList.remove("show"));
  });
});

// ================= SCROLL REVEAL =================
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Stagger the tech stack tags
document.querySelectorAll(".tags").forEach(list => {
  list.querySelectorAll(".tag").forEach((tag, i) => {
    tag.style.setProperty("--i", i);
  });
});

const revealTargets = document.querySelectorAll(
  "#about .col-md-6, .tech-stacks header, .category, .tag, #project .container > h1, #project .container > p, .project-links, .project-group-head, .image-container, .project-card, .card-container"
);

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add("in");
        observer.unobserve(el);

        // Projects only: hand the element back to its hover styles once it has faded in
        if (el.closest("#project")) {
          const release = (e) => {
            if (e && (e.target !== el || e.propertyName !== "opacity")) return;
            el.removeEventListener("transitionend", release);
            el.classList.remove("reveal", "in");
          };
          el.addEventListener("transitionend", release);
          setTimeout(release, 2500);
        }
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  revealTargets.forEach(el => {
    el.classList.add("reveal");
    revealObserver.observe(el);
  });
}

// ================= ACTIVE LINK ON SCROLL (Home / About / Projects / Contact) =================
// Works by scroll position, so it also works for tall sections like Projects
const spyItems = [...document.querySelectorAll(
  ".navbar-nav .nav-link[data-section], .mobile-menu-item[data-section]"
)];
const spySections = ["home", "about", "project", "contact"]
  .map(id => document.getElementById(id))
  .filter(Boolean);

function updateActiveLink() {
  if (!spySections.length) return;

  const line = window.innerHeight * 0.4;
  let current = spySections[0].id;

  spySections.forEach(section => {
    if (section.getBoundingClientRect().top <= line) current = section.id;
  });

  // Bottom of the page is always the Contact section
  const atBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  if (atBottom) current = spySections[spySections.length - 1].id;

  spyItems.forEach(el => el.classList.toggle("active", el.dataset.section === current));
}

window.addEventListener("scroll", updateActiveLink, { passive: true });
window.addEventListener("resize", updateActiveLink);
updateActiveLink();

// ================= CONNECT SECTION: AIRPLANE FROM THE "CADs AND PLATES" CARD =================
const contactSection = document.getElementById("contact");

if (contactSection && !prefersReducedMotion) {
  contactSection.classList.add("anim");

  // The airplane + white wipe (animated in CSS) are created here so the HTML stays clean
  const drop = document.createElement("div");
  drop.className = "plane-drop";
  drop.setAttribute("aria-hidden", "true");
  drop.innerHTML =
    '<span class="pd-plane"><svg viewBox="0 0 24 24" focusable="false">' +
    '<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>' +
    '</svg></span><span class="pd-wipe"></span>';
  document.body.appendChild(drop);

  // The card the plane flies out from: the last project card (CADs and Plates)
  const dropSource =
    document.querySelector("#project .project-card.flip") ||
    [...document.querySelectorAll("#project .project-card")].pop();

  let playing = false;

  // Bottom edge of the card on screen: the plane hides behind the card and comes out from this line
  const startY = () => {
    const bottom = dropSource
      ? dropSource.getBoundingClientRect().bottom
      : contactSection.getBoundingClientRect().top - 96;
    return Math.max(90, Math.min(bottom, window.innerHeight - 140));
  };

  const playDrop = () => {
    if (playing || contactSection.classList.contains("covered")) return;
    playing = true;

    // The plane dives from the card's edge down to this point, and the white grows from there
    const y0 = startY();
    const dive = Math.min(y0 + window.innerHeight * 0.28, window.innerHeight - 90);

    drop.style.setProperty("--y0", `${y0}px`);
    drop.style.setProperty("--cy", `${dive}px`);
    drop.classList.add("run");

    // While the plane slides out from behind the card (first 0.5s) keep it glued to the card's edge
    const t0 = performance.now();
    const follow = (now) => {
      if (!playing || now - t0 > 500) return;
      drop.style.setProperty("--y0", `${startY()}px`);
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
  };

  // The white has covered the screen: line the section up (hidden behind the white),
  // turn the card white, then remove the overlay. No visible flash.
  drop.addEventListener("animationend", (e) => {
    if (!e.target.classList.contains("pd-wipe")) return; // plane and wipe end together, react once
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, contactSection.getBoundingClientRect().top + window.scrollY);
    root.style.scrollBehavior = previous;

    contactSection.classList.add("covered");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      drop.classList.remove("run");
      playing = false;
    }));
  });

  // Start as soon as the CADs card reaches the top of the screen (just under the navbar)
  const checkDrop = () => {
    const section = contactSection.getBoundingClientRect();

    // Section completely below the screen: reset so the drop plays again next time
    if (section.top >= window.innerHeight) {
      contactSection.classList.remove("covered");
      drop.classList.remove("run");
      playing = false;
      return;
    }

    if (playing || contactSection.classList.contains("covered")) return;

    const cardTop = dropSource ? dropSource.getBoundingClientRect().top : section.top - window.innerHeight * 0.5;
    if (cardTop <= window.innerHeight * 0.05) playDrop();
  };

  window.addEventListener("scroll", checkDrop, { passive: true });
  window.addEventListener("resize", checkDrop);
  checkDrop();
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