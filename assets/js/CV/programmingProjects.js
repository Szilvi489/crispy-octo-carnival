(function () {
    var root = document.documentElement;
    var section = document.getElementById("cv-programming-projects");
    if (!section) return;

    var heading = section.querySelector(".cv-programming-projects-heading");
    if (!heading) return;
    var revealEl = document.querySelector(".cv-skills-reveal");

    var rafId = null;
    var revealedClassName = "is-title-revealed";
    var revealOpacityThreshold = 0.03;
    var hideOnUpwardSectionTopRatio = 0.84;
    var lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

    function hasRevealCompleted() {
        return root.classList.contains("cv-skills-reveal-complete");
    }

    function isRevealVisible() {
        if (!revealEl) {
            return false;
        }

        return (parseFloat(window.getComputedStyle(revealEl).opacity) || 0) > revealOpacityThreshold;
    }

    function updateTitleReveal() {
        var currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        var scrollingUp = currentScrollY < lastScrollY;
        var vh = window.innerHeight || 1;
        var sectionTop = section.getBoundingClientRect().top;
        var shouldHideEarlyOnUp = scrollingUp && sectionTop > (vh * hideOnUpwardSectionTopRatio);

        lastScrollY = currentScrollY;
        rafId = null;

        if (hasRevealCompleted() && isRevealVisible() && !shouldHideEarlyOnUp) {
            section.classList.add(revealedClassName);
            return;
        }

        section.classList.remove(revealedClassName);
    }

    function queueUpdate() {
        if (rafId !== null) {
            return;
        }

        rafId = requestAnimationFrame(updateTitleReveal);
    }

    document.addEventListener("cv-skills-reveal-complete", function () {
        queueUpdate();
    });

    document.addEventListener("cv-skills-reveal-reset", function () {
        queueUpdate();
    });

    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    queueUpdate();
})();
