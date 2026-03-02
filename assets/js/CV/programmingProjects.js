(function () {
    var section = document.getElementById("cv-programming-projects");
    if (!section) return;

    var heading = section.querySelector(".cv-programming-projects-heading");
    if (!heading) return;

    var rafId = null;
    var revealedClassName = "is-title-revealed";
    var revealOnSectionTopRatio = 1;
    var hideOnUpwardSectionTopRatio = 0.84;
    var lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

    function updateTitleReveal() {
        var currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        var scrollingUp = currentScrollY < lastScrollY;
        var vh = window.innerHeight || 1;
        var sectionTop = section.getBoundingClientRect().top;
        var shouldHideEarlyOnUp = scrollingUp && sectionTop > (vh * hideOnUpwardSectionTopRatio);
        var shouldReveal = sectionTop <= (vh * revealOnSectionTopRatio);

        lastScrollY = currentScrollY;
        rafId = null;

        if (shouldReveal && !shouldHideEarlyOnUp) {
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

    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    queueUpdate();
})();
