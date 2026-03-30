(function () {
  "use strict";

  var body = document.body;
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  var navLinks = nav ? nav.querySelectorAll('a[href^="#"]') : [];

  function setNavOpen(open) {
    if (!toggle || !nav) return;
    body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var willOpen = !body.classList.contains("nav-open");
      setNavOpen(willOpen);
      if (willOpen && navLinks.length) {
        window.requestAnimationFrame(function () {
          navLinks[0].focus();
        });
      }
    });

    document.addEventListener("click", function (e) {
      if (!body.classList.contains("nav-open")) return;
      var t = e.target;
      if (header && !header.contains(t)) {
        setNavOpen(false);
      }
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      setNavOpen(false);
    });
  });

  /* Stagger reveal for project cards */
  var projectCards = document.querySelectorAll("[data-project-card]");
  projectCards.forEach(function (el, i) {
    el.style.setProperty("--reveal-delay", i * 0.075 + "s");
  });

  /* Hero parallax on pointer */
  var hero = document.querySelector(".hero");
  var heroOrbit = document.getElementById("hero-orbit");
  var reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (hero && heroOrbit && !reduceMotionMq.matches) {
    var parallaxPending = false;
    var px = 0;
    var py = 0;
    hero.addEventListener(
      "pointermove",
      function (e) {
        var rect = hero.getBoundingClientRect();
        px = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
        py = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
        if (!parallaxPending) {
          parallaxPending = true;
          window.requestAnimationFrame(function () {
            heroOrbit.style.transform = "translate(" + px + "px, " + py + "px)";
            parallaxPending = false;
          });
        }
      },
      { passive: true }
    );
    hero.addEventListener("pointerleave", function () {
      heroOrbit.style.transform = "";
    });
  }

  /* Scroll reveal */
  var revealNodes = document.querySelectorAll("[data-reveal]");
  if (revealNodes.length && "IntersectionObserver" in window) {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      revealNodes.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealNodes.forEach(function (el) {
        io.observe(el);
      });
    }
  } else {
    revealNodes.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* Scroll progress bar */
  var progressFill = document.querySelector(".scroll-progress__fill");
  function updateScrollProgress() {
    if (!progressFill) return;
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    var p = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressFill.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)) + ")";
  }

  /* Active nav: IntersectionObserver + низкий ratio — fallback по scroll */
  var navSectionIds = ["home", "about", "stack", "projects", "services", "experience", "process", "play"];
  var sectionsForNav = navSectionIds
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  var linkById = {};
  navLinks.forEach(function (a) {
    var href = a.getAttribute("href");
    if (href && href.charAt(0) === "#") {
      linkById[href.slice(1)] = a;
    }
  });

  var ratios = {};
  navSectionIds.forEach(function (id) {
    ratios[id] = 0;
  });

  function setActiveLink(activeId) {
    Object.keys(linkById).forEach(function (id) {
      var link = linkById[id];
      if (link) {
        link.classList.toggle("nav-active", id === activeId);
      }
    });
  }

  function scrollFallbackActive() {
    var scrollY = window.scrollY;
    var offset = (header && header.offsetHeight) || 72;
    var activeId = "home";
    for (var i = 0; i < sectionsForNav.length; i++) {
      var sec = sectionsForNav[i];
      if (!sec) continue;
      var top = sec.getBoundingClientRect().top + scrollY - offset - 24;
      if (scrollY >= top) {
        activeId = sec.id;
      }
    }
    setActiveLink(activeId);
  }

  function applyActiveNav() {
    var bestId = "home";
    var bestR = 0;
    navSectionIds.forEach(function (id) {
      var r = ratios[id] || 0;
      if (r > bestR) {
        bestR = r;
        bestId = id;
      }
    });
    if (bestR < 0.06) {
      scrollFallbackActive();
    } else {
      setActiveLink(bestId);
    }
  }

  var navScrollTicking = false;
  function onScrollNavAndProgress() {
    updateScrollProgress();
    if (!navScrollTicking) {
      navScrollTicking = true;
      window.requestAnimationFrame(function () {
        navScrollTicking = false;
        applyActiveNav();
      });
    }
  }

  if (sectionsForNav.length && "IntersectionObserver" in window) {
    var ioNav = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          var id = en.target.id;
          if (navSectionIds.indexOf(id) >= 0) {
            ratios[id] = en.isIntersecting ? en.intersectionRatio : 0;
          }
        });
        applyActiveNav();
      },
      {
        root: null,
        rootMargin: "-8% 0px -40% 0px",
        threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.75, 1],
      }
    );
    sectionsForNav.forEach(function (sec) {
      ioNav.observe(sec);
    });
    window.addEventListener("scroll", onScrollNavAndProgress, { passive: true });
    window.addEventListener("resize", function () {
      updateScrollProgress();
      applyActiveNav();
    }, { passive: true });
    updateScrollProgress();
    applyActiveNav();
  } else if (sectionsForNav.length) {
    window.addEventListener("scroll", onScrollNavAndProgress, { passive: true });
    window.addEventListener("resize", onScrollNavAndProgress, { passive: true });
    updateScrollProgress();
    scrollFallbackActive();
  } else {
    updateScrollProgress();
  }

  /* Lightbox for project gallery images */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = lightbox ? lightbox.querySelector(".lightbox__img") : null;
  var lightboxClose = lightbox ? lightbox.querySelector(".lightbox__close") : null;

  function lightboxOpen() {
    return lightbox && !lightbox.hasAttribute("hidden");
  }

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg || !src) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.removeAttribute("hidden");
    body.style.overflow = "hidden";
    if (lightboxClose) {
      lightboxClose.focus();
    }
  }

  function closeLightbox() {
    if (!lightbox || !lightboxImg) return;
    lightbox.setAttribute("hidden", "");
    lightboxImg.removeAttribute("src");
    lightboxImg.alt = "";
    body.style.overflow = "";
  }

  var mainEl = document.getElementById("main");
  if (mainEl) {
    mainEl.addEventListener(
      "click",
      function (e) {
        var t = e.target;
        if (!t || t.tagName !== "IMG") return;
        var media = t.closest(".project-media--gallery");
        if (!media) return;
        var src = t.currentSrc || t.src;
        if (!src) return;
        e.preventDefault();
        openLightbox(src, t.getAttribute("alt") || "");
      },
      true
    );
  }

  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  if (lightboxClose) {
    lightboxClose.addEventListener("click", function (e) {
      e.stopPropagation();
      closeLightbox();
    });
  }

  if (lightboxImg) {
    lightboxImg.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (lightboxOpen()) {
      closeLightbox();
      e.preventDefault();
      return;
    }
    setNavOpen(false);
  });
})();
