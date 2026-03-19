(function () {
    var section = document.getElementById("cv-programming-projects");
    var rafId = null;

    if (!section) {
        return;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function updateRevealProgress() {
        var rect = section.getBoundingClientRect();
        var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
        var revealStart = viewportHeight * 0.75; /* section covers ~25vh */
        var revealEnd = -(viewportHeight * 0.45); /* finish later, after more scroll */
        var rawProgress = (revealStart - rect.top) / Math.max(1, revealStart - revealEnd);
        var linearProgress = clamp(rawProgress, 0, 1);
        var progress = Math.pow(linearProgress, 1.55); /* slower early growth */

        section.style.setProperty("--cv-programming-projects-reveal-progress", progress.toFixed(4));
        rafId = null;
    }

    function queueRevealUpdate() {
        if (rafId !== null) {
            return;
        }

        rafId = window.requestAnimationFrame(updateRevealProgress);
    }

    window.addEventListener("scroll", queueRevealUpdate, { passive: true });
    window.addEventListener("resize", queueRevealUpdate);
    window.addEventListener("load", queueRevealUpdate);
    updateRevealProgress();
})();
