(function () {
    var crosshairOverlay = null;
    var isCoarsePointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

    if (isCoarsePointer) {
        return;
    }

    crosshairOverlay = document.createElement("div");
    crosshairOverlay.className = "cv-crosshair-overlay is-hidden";
    crosshairOverlay.innerHTML =
        "<div class=\"cv-crosshair-line cv-crosshair-line-v\"></div>" +
        "<div class=\"cv-crosshair-line cv-crosshair-line-h\"></div>" +
        "<div class=\"cv-crosshair-center\"></div>";

    document.body.appendChild(crosshairOverlay);
    document.body.classList.add("cv-crosshair-active");

    function setCrosshairPosition(clientX, clientY) {
        crosshairOverlay.style.setProperty("--crosshair-x", clientX + "px");
        crosshairOverlay.style.setProperty("--crosshair-y", clientY + "px");
    }

    function updateCrosshairHoverState(clientX, clientY) {
        var target = document.elementFromPoint(clientX, clientY);
        var isNavTarget = false;
        var isSkillTileTarget = false;

        if (!target) {
            crosshairOverlay.classList.remove("is-nav-hover");
            crosshairOverlay.classList.remove("is-skills-hover");
            return;
        }

        isNavTarget = !!target.closest(
            ".cv-nav a, .cv-facts-toggle, .cv-school-image, .navSquareColour, .navMenu a, .navHeartButton, .navHomeButton, #navClose, .contact-page-section .contact-input"
        );
        isSkillTileTarget = !!target.closest(".cv-skill-tile");
        crosshairOverlay.classList.toggle("is-nav-hover", isNavTarget);
        crosshairOverlay.classList.toggle("is-skills-hover", isSkillTileTarget);
    }

    window.addEventListener("mousemove", function (event) {
        setCrosshairPosition(event.clientX, event.clientY);
        updateCrosshairHoverState(event.clientX, event.clientY);
        crosshairOverlay.classList.remove("is-hidden");
    });

    window.addEventListener("mouseout", function (event) {
        if (!event.relatedTarget) {
            crosshairOverlay.classList.add("is-hidden");
        }
    });
})();
