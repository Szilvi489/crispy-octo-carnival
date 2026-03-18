(function () {
    var frameSources = [
        "/assets/images/aboutPage/ChattyGirl1.png",
        "/assets/images/aboutPage/ChattyGIrl2.png",
        "/assets/images/aboutPage/ChattyGirl3.png",
        "/assets/images/aboutPage/ChattyGirl4.png",
        "/assets/images/aboutPage/ChattyGirl5.png",
        "/assets/images/aboutPage/ChattyGirl6.png",
        "/assets/images/aboutPage/ChattyGirl7.png"
    ];
    var stopMotion = document.querySelector(".about-stop-motion-overlay");
    var viennaTime = document.querySelector(".vienna-time");
    var frames;
    var activeIndex = 0;
    var timerId = null;
    var timeTimerId = null;

    if (!stopMotion) {
        return;
    }

    function buildFrames() {
        var i;
        var frame;
        var builtFrames = [];

        stopMotion.innerHTML = "";

        for (i = 0; i < frameSources.length; i++) {
            frame = document.createElement("img");
            frame.className = "about-stop-motion-frame";
            frame.src = frameSources[i];
            frame.alt = "";
            frame.loading = "eager";
            frame.decoding = "async";

            if (i === 0) {
                frame.classList.add("is-active");
            }

            stopMotion.appendChild(frame);
            builtFrames.push(frame);
        }

        return builtFrames;
    }

    frames = buildFrames();

    if (!frames.length) {
        return;
    }

    function showFrame(index) {
        var i;

        activeIndex = index;

        for (i = 0; i < frames.length; i++) {
            frames[i].classList.toggle("is-active", i === activeIndex);
        }
    }

    function advanceFrame() {
        var nextIndex = activeIndex + 1;

        if (nextIndex >= frames.length) {
            nextIndex = 0;
        }

        showFrame(nextIndex);
    }

    function startSequence() {
        if (timerId !== null) {
            return;
        }

        stopMotion.classList.add("is-playing");
        showFrame(0);
        timerId = window.setInterval(advanceFrame, 400);
    }

    function stopSequence() {
        if (timerId !== null) {
            window.clearInterval(timerId);
            timerId = null;
        }

        stopMotion.classList.remove("is-playing");
        showFrame(0);
    }

    stopMotion.addEventListener("mouseenter", startSequence);
    stopMotion.addEventListener("mouseleave", stopSequence);
    stopMotion.addEventListener("focus", startSequence);
    stopMotion.addEventListener("blur", stopSequence);

    function updateViennaTime() {
        if (!viennaTime) {
            return;
        }

        viennaTime.textContent = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Europe/Vienna",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }).format(new Date());
    }

    if (viennaTime) {
        updateViennaTime();
        timeTimerId = window.setInterval(updateViennaTime, 1000);

        window.addEventListener("pagehide", function () {
            if (timeTimerId !== null) {
                window.clearInterval(timeTimerId);
                timeTimerId = null;
            }
        }, { once: true });
    }
})();
