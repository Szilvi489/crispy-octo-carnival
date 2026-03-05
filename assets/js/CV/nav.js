(function () {
    var cvSection = document.querySelector(".cv-section");
    var navSection = document.querySelector(".nav-section");
    var navItems = Array.prototype.slice.call(document.querySelectorAll(".cv-nav a"));
    var navScrollRafId = null;
    var gsapApi = window.gsap;
    var activeScrollTween = null;
    var fallbackScrollRafId = null;
    var reducedMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    var respectReducedMotion = false;
    var scrollDurationSeconds = 1.35;
    var scrollEase = "none";

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function resetNavEntrance() {
        navItems.forEach(function (item) {
            item.classList.remove("nav-enter");
            item.style.removeProperty("--nav-enter-delay");
        });

        if (cvSection) {
            cvSection.classList.remove("nav-enter-active");
        }
    }

    function startNavEntrance() {
        if (cvSection) {
            cvSection.classList.add("nav-enter-active");
        }

        navItems.forEach(function (item, index) {
            item.classList.add("nav-enter");
            item.style.setProperty("--nav-enter-delay", (index * 110) + "ms");
        });
    }

    resetNavEntrance();
    document.addEventListener("cv-loader-start", resetNavEntrance);
    document.addEventListener("cv-loader-exit-start", startNavEntrance);

    function updateNavScrollShift() {
        var scrollY;
        var navHeight;
        var maxShift;
        var shift;

        navScrollRafId = null;

        if (!navSection) {
            return;
        }

        scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        navHeight = navSection.getBoundingClientRect().height || 0;
        maxShift = navHeight + 42;
        shift = clamp(scrollY * 0.65, 0, maxShift);

        navSection.style.setProperty("--cv-nav-scroll-shift", shift.toFixed(2) + "px");
    }

    function queueNavScrollShift() {
        if (navScrollRafId !== null) {
            return;
        }

        navScrollRafId = requestAnimationFrame(updateNavScrollShift);
    }

    function stopFallbackScrollTween() {
        if (fallbackScrollRafId === null) {
            return;
        }
        window.cancelAnimationFrame(fallbackScrollRafId);
        fallbackScrollRafId = null;
    }

    function animateScrollFallback(fromY, toY, durationMs) {
        var startTime = null;
        var distance = toY - fromY;

        stopFallbackScrollTween();

        function step(timestamp) {
            var elapsed;
            var progress;
            var y;

            if (startTime === null) {
                startTime = timestamp;
            }

            elapsed = timestamp - startTime;
            progress = Math.min(1, elapsed / Math.max(1, durationMs));
            y = fromY + (distance * progress);
            window.scrollTo(0, y);

            if (progress < 1) {
                fallbackScrollRafId = window.requestAnimationFrame(step);
                return;
            }

            fallbackScrollRafId = null;
        }

        fallbackScrollRafId = window.requestAnimationFrame(step);
    }

    function updateHash(hash) {
        if (!hash) return;
        if (window.history && typeof window.history.replaceState === "function") {
            window.history.replaceState(null, "", hash);
        }
    }

    function scrollToTarget(hash) {
        if (!hash || hash.charAt(0) !== "#") return;
        var target = document.querySelector(hash);
        if (!target) return;

        var navHeight = navSection ? navSection.getBoundingClientRect().height : 0;
        var topPadding = 24;
        var targetY = window.pageYOffset + target.getBoundingClientRect().top - navHeight - topPadding;
        var nextY = Math.max(0, targetY);
        var shouldReduceMotion = respectReducedMotion && reducedMotionQuery ? reducedMotionQuery.matches : false;

        if (shouldReduceMotion) {
            window.scrollTo(0, nextY);
            updateHash(hash);
            return;
        }

        if (activeScrollTween && typeof activeScrollTween.kill === "function") {
            activeScrollTween.kill();
            activeScrollTween = null;
        }
        stopFallbackScrollTween();

        if (!gsapApi || typeof gsapApi.to !== "function") {
            animateScrollFallback(
                window.pageYOffset || document.documentElement.scrollTop || 0,
                nextY,
                scrollDurationSeconds * 1000
            );
            window.setTimeout(function () {
                updateHash(hash);
            }, Math.max(0, Math.round(scrollDurationSeconds * 1000)));
            return;
        }

        var scrollState = {
            y: window.pageYOffset || document.documentElement.scrollTop || 0
        };

        activeScrollTween = gsapApi.to(scrollState, {
            y: nextY,
            duration: scrollDurationSeconds,
            ease: scrollEase,
            overwrite: true,
            onUpdate: function () {
                window.scrollTo(0, scrollState.y);
            },
            onComplete: function () {
                activeScrollTween = null;
                updateHash(hash);
            }
        });
    }

    navItems.forEach(function (item) {
        item.addEventListener("click", function (event) {
            var hash = item.getAttribute("href");
            if (!hash || hash.charAt(0) !== "#") return;
            event.preventDefault();
            scrollToTarget(hash);
        });
    });

    window.addEventListener("scroll", queueNavScrollShift, { passive: true });
    window.addEventListener("resize", queueNavScrollShift);
    updateNavScrollShift();
})();
