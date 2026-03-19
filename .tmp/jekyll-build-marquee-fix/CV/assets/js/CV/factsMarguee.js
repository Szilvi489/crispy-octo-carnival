(function () {
    var section = document.querySelector("#cv-facts-marquee");
    var track;
    var baseSet;
    var reducedMotionQuery;

    if (!section) {
        return;
    }

    track = section.querySelector("[data-marquee-track]");
    baseSet = section.querySelector("[data-marquee-set]");
    reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!track || !baseSet) {
        return;
    }

    function updateDuration() {
        var distancePx;
        var durationSeconds;

        if (reducedMotionQuery.matches) {
            track.style.removeProperty("--facts-marquee-duration");
            track.style.removeProperty("--facts-marquee-distance");
            return;
        }

        distancePx = baseSet.scrollWidth;
        durationSeconds = Math.max(32, distancePx / 52);
        track.style.setProperty("--facts-marquee-duration", durationSeconds.toFixed(2) + "s");
        track.style.setProperty("--facts-marquee-distance", distancePx + "px");
    }

    updateDuration();
    window.addEventListener("resize", updateDuration);

    if (typeof reducedMotionQuery.addEventListener === "function") {
        reducedMotionQuery.addEventListener("change", updateDuration);
    } else if (typeof reducedMotionQuery.addListener === "function") {
        reducedMotionQuery.addListener(updateDuration);
    }
})();
