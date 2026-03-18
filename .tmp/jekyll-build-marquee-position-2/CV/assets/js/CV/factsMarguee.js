(function () {
    var section = document.querySelector("#cv-facts-marquee");
    var track;
    var baseSet;
    var resizeTimerId = null;
    var animationFrameId = null;
    var lastTimestamp = null;
    var baseWidth = 0;
    var offset = 0;
    var speedPxPerSecond = 42;

    if (!section) {
        return;
    }

    track = section.querySelector("[data-marquee-track]");
    baseSet = section.querySelector("[data-marquee-set]");

    if (!track || !baseSet) {
        return;
    }

    function applyOffset() {
        track.style.transform = "translate3d(" + offset.toFixed(2) + "px, 0, 0)";
    }

    function measure() {
        baseWidth = baseSet.getBoundingClientRect().width;

        if (baseWidth <= 0) {
            return;
        }

        if (Math.abs(offset) >= baseWidth) {
            offset = offset % baseWidth;
        }

        applyOffset();
    }

    function tick(timestamp) {
        var deltaSeconds;

        if (lastTimestamp === null) {
            lastTimestamp = timestamp;
        }

        deltaSeconds = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;

        if (baseWidth > 0) {
            offset -= speedPxPerSecond * deltaSeconds;

            while (Math.abs(offset) >= baseWidth) {
                offset += baseWidth;
            }

            applyOffset();
        }

        animationFrameId = window.requestAnimationFrame(tick);
    }

    function start() {
        if (animationFrameId !== null) {
            window.cancelAnimationFrame(animationFrameId);
        }

        lastTimestamp = null;
        animationFrameId = window.requestAnimationFrame(tick);
    }

    function onResize() {
        if (resizeTimerId !== null) {
            window.clearTimeout(resizeTimerId);
        }

        resizeTimerId = window.setTimeout(function () {
            measure();
        }, 120);
    }

    function onVisibilityChange() {
        if (document.hidden) {
            if (animationFrameId !== null) {
                window.cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            return;
        }

        start();
    }

    measure();
    start();

    window.addEventListener("load", measure, { once: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (document.fonts && typeof document.fonts.ready === "object" && typeof document.fonts.ready.then === "function") {
        document.fonts.ready.then(function () {
            measure();
        });
    }
})();
