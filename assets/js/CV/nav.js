(function () {
    var cvSection = document.querySelector(".cv-section");
    var navSection = document.querySelector(".nav-section");
    var navItems = Array.prototype.slice.call(document.querySelectorAll(".cv-nav a"));
    var navScrollRafId = null;

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

    function scrollToTarget(hash) {
        if (!hash || hash.charAt(0) !== "#") return;
        var target = document.querySelector(hash);
        if (!target) return;

        var navHeight = navSection ? navSection.getBoundingClientRect().height : 0;
        var topPadding = 24;
        var targetY = window.pageYOffset + target.getBoundingClientRect().top - navHeight - topPadding;

        window.scrollTo({
            top: Math.max(0, targetY),
            behavior: "smooth"
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
