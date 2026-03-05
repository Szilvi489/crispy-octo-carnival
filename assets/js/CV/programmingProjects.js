(function () {
    var section = document.getElementById("cv-programming-projects");
    if (!section) return;

    var heading = section.querySelector(".cv-programming-projects-heading");
    if (!heading) return;
    var personalSection = document.getElementById("cv-personal");
    var cloudTrigger = personalSection ? personalSection.querySelector(".cv-personal-prelude-cloud.cloud-layer-1") : null;
    var fallbackCloudTrigger = personalSection ? personalSection.querySelector(".cv-personal-prelude") : null;

    var rafId = null;
    var revealedClassName = "is-title-revealed";
    var revealOnSectionTopRatio = 1;
    var hideOnUpwardSectionTopRatio = 0.84;
    var lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    var dissolveStartPx = 140;
    var dissolveEndPx = 0;

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function getDissolveProgress() {
        var trigger = cloudTrigger || fallbackCloudTrigger;
        if (!trigger) {
            return 0;
        }

        var cloudTop = trigger.getBoundingClientRect().top;
        if (cloudTop >= dissolveStartPx) {
            return 0;
        }
        if (cloudTop <= dissolveEndPx) {
            return 1;
        }

        return clamp((dissolveStartPx - cloudTop) / (dissolveStartPx - dissolveEndPx), 0, 1);
    }

    function updateTitleReveal() {
        var currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        var scrollingUp = currentScrollY < lastScrollY;
        var vh = window.innerHeight || 1;
        var sectionTop = section.getBoundingClientRect().top;
        var shouldHideEarlyOnUp = scrollingUp && sectionTop > (vh * hideOnUpwardSectionTopRatio);
        var shouldReveal = sectionTop <= (vh * revealOnSectionTopRatio);
        var dissolveProgress = getDissolveProgress();
        var headingOpacity = 1 - dissolveProgress;
        var blurPx = dissolveProgress * 8;

        lastScrollY = currentScrollY;
        rafId = null;

        if (shouldReveal && !shouldHideEarlyOnUp) {
            section.classList.add(revealedClassName);
            heading.style.opacity = headingOpacity.toFixed(3);
            heading.style.filter = "blur(" + blurPx.toFixed(2) + "px)";
            return;
        }

        section.classList.remove(revealedClassName);
        heading.style.removeProperty("opacity");
        heading.style.removeProperty("filter");
    }

    function queueUpdate() {
        if (rafId !== null) {
            return;
        }

        rafId = requestAnimationFrame(updateTitleReveal);
    }

    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    queueUpdate();
})();
