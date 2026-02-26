(function () {
    var skillsSection = document.getElementById("cv-skills");
    var programmingSection = document.getElementById("cv-programming-projects");
    if (!skillsSection || !programmingSection) return;

    var revealEl = skillsSection.querySelector(".cv-skills-reveal");
    if (!revealEl) return;

    var rafId = null;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function updateReveal() {
        rafId = null;
        var vh = window.innerHeight || 1;
        var vw = window.innerWidth || 1;
        var skillsRect = skillsSection.getBoundingClientRect();
        var programmingRect = programmingSection.getBoundingClientRect();
        var yStart = 56;
        var startRadius = 13;

        var isSkillsVisible = skillsRect.bottom > 0 && skillsRect.top < vh;
        if (!isSkillsVisible) {
            var isBeforeSkills = skillsRect.top >= vh;
            if (isBeforeSkills) {
                revealEl.style.setProperty("--skills-reveal-y", yStart + "px");
                revealEl.style.setProperty("--skills-reveal-radius", startRadius + "px");
                revealEl.style.setProperty("--skills-reveal-opacity", "1");
                return;
            }
            revealEl.style.setProperty("--skills-reveal-opacity", "0");
            return;
        }

        // 1) Move the ball downward as user scrolls toward Programming Projects.
        var travelStart = vh * 1.12;
        var travelEnd = vh * 0.98;
        var travelProgress = clamp(
            (travelStart - programmingRect.top) / Math.max(1, travelStart - travelEnd),
            0,
            1
        );
        var yEnd = vh * 1.01;
        var y = yStart + (yEnd - yStart) * travelProgress;

        // 2) Expand only when Programming Projects is about to enter viewport.
        var expandStart = vh * 1.02;
        var expandEnd = vh * 0.995;
        var expansionProgress = clamp(
            (expandStart - programmingRect.top) / Math.max(1, expandStart - expandEnd),
            0,
            1
        );
        var eased = 1 - Math.pow(1 - expansionProgress, 3);

        var maxDy = Math.max(y, vh - y);
        var maxRadius = Math.sqrt(Math.pow(vw / 2, 2) + Math.pow(maxDy, 2));
        var radius = startRadius + (maxRadius - startRadius) * eased;

        var fadeOutProgress = clamp((0 - programmingRect.top) / (vh * 0.2), 0, 1);
        var opacity = 1 - fadeOutProgress;
        revealEl.style.setProperty("--skills-reveal-y", y.toFixed(2) + "px");
        revealEl.style.setProperty("--skills-reveal-radius", radius.toFixed(2) + "px");
        revealEl.style.setProperty("--skills-reveal-opacity", opacity.toFixed(4));
    }

    function queueUpdate() {
        if (rafId) return;
        rafId = window.requestAnimationFrame(updateReveal);
    }

    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    queueUpdate();
})();
