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

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setNavOpen(false);
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

  /* Active nav link */
  var sectionIds = ["home", "about", "stack", "projects", "services", "process"];
  var sections = sectionIds
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

  var ticking = false;
  function updateActiveNav() {
    ticking = false;
    var scrollY = window.scrollY;
    var offset = (header && header.offsetHeight) || 72;
    var activeId = "home";
    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      if (!sec) continue;
      var top = sec.getBoundingClientRect().top + scrollY - offset - 24;
      if (scrollY >= top) {
        activeId = sec.id;
      }
    }
    Object.keys(linkById).forEach(function (id) {
      var link = linkById[id];
      if (link) {
        link.classList.toggle("nav-active", id === activeId);
      }
    });
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateActiveNav);
    }
  }

  if (sections.length) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateActiveNav();
  }
})();
