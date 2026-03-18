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

    function ensureClone() {
        var existingClone = track.querySelector("[data-marquee-clone]");
        var clone;

        if (existingClone) {
            return existingClone;
        }

        clone = baseSet.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.setAttribute("data-marquee-clone", "true");
        track.appendChild(clone);

        return clone;
    }

    function updateDuration() {
        var distancePx;
        var durationSeconds;

        ensureClone();

        if (reducedMotionQuery.matches) {
            track.style.removeProperty("--facts-marquee-duration");
            return;
        }

        distancePx = baseSet.scrollWidth;
        durationSeconds = Math.max(32, distancePx / 52);
        track.style.setProperty("--facts-marquee-duration", durationSeconds.toFixed(2) + "s");
    }

    updateDuration();
    window.addEventListener("resize", updateDuration);

    if (typeof reducedMotionQuery.addEventListener === "function") {
        reducedMotionQuery.addEventListener("change", updateDuration);
    } else if (typeof reducedMotionQuery.addListener === "function") {
        reducedMotionQuery.addListener(updateDuration);
    }
})();
