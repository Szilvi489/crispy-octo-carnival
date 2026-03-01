(function () {
    var section = document.getElementById("cv-intro");
    var title = section ? section.querySelector(".cv-intro-title") : null;
    if (!section || !title) return;

    var rafId = null;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function updateTitleFade() {
        rafId = null;
        var vh = window.innerHeight || 1;
        var rect = section.getBoundingClientRect();

        // Keep title visible initially; fade as intro scrolls upward.
        var scrolledWithinSection = Math.max(0, -rect.top);
        var fadeDistance = vh * 0.3;
        var progress = clamp(scrolledWithinSection / Math.max(1, fadeDistance), 0, 1);
        var opacity = 1 - progress;

        title.style.opacity = opacity.toFixed(3);
    }

    function queueUpdate() {
        if (rafId) return;
        rafId = window.requestAnimationFrame(updateTitleFade);
    }

    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    queueUpdate();
})();
