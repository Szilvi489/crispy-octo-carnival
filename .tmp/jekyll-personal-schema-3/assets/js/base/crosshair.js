(function () {
    var crosshairOverlay = null;
    var isCoarsePointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    var pointerRafId = null;
    var pendingPointer = null;

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

    function updateCrosshairHoverState(target) {
        var isNavTarget = false;
        var isSkillTileTarget = false;

        if (!target) {
            crosshairOverlay.classList.remove("is-nav-hover");
            crosshairOverlay.classList.remove("is-skills-hover");
            return;
        }

        isNavTarget = !!target.closest(
            ".cv-nav a, .cv-school-image, .navSquareColour, .navMenu a, .navHeartButton, .navHomeButton, #navClose, .contact-page-section .contact-input"
        );
        isSkillTileTarget = !!target.closest(".cv-skill-tile");
        crosshairOverlay.classList.toggle("is-nav-hover", isNavTarget);
        crosshairOverlay.classList.toggle("is-skills-hover", isSkillTileTarget);
    }

    function flushPointerFrame() {
        pointerRafId = null;

        if (!pendingPointer) {
            return;
        }

        setCrosshairPosition(pendingPointer.x, pendingPointer.y);
        updateCrosshairHoverState(pendingPointer.target);
        crosshairOverlay.classList.remove("is-hidden");
    }

    window.addEventListener("mousemove", function (event) {
        pendingPointer = {
            x: event.clientX,
            y: event.clientY,
            target: event.target
        };

        if (pointerRafId !== null) {
            return;
        }

        pointerRafId = window.requestAnimationFrame(flushPointerFrame);
    });

    window.addEventListener("mouseout", function (event) {
        if (!event.relatedTarget) {
            crosshairOverlay.classList.add("is-hidden");
        }
    });
})();
