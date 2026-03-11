(function () {
    var wrapper = document.querySelector(".cv-horizontal-intro-education");
    var educationSection = document.getElementById("cv-education");
    var educationContent = document.querySelector(".cv-education-content");
    var title = educationSection ? educationSection.querySelector(".cv-education-title") : null;
    var introPanel = educationSection ? educationSection.querySelector(".cv-education-panel-intro") : null;
    var contentPanel = educationSection ? educationSection.querySelector(".cv-education-panel-content") : null;
    var schoolItems = educationSection ? Array.prototype.slice.call(educationSection.querySelectorAll(".cv-school-item")) : [];
    var gsapApi = window.gsap;
    var scrollTriggerApi = window.ScrollTrigger;

    if (!wrapper || !educationSection || !gsapApi || !scrollTriggerApi || typeof gsapApi.to !== "function") {
        return;
    }

    if (typeof gsapApi.registerPlugin === "function") {
        gsapApi.registerPlugin(scrollTriggerApi);
    }

    function announceEducationVisibility(isVisible) {
        document.dispatchEvent(new CustomEvent("cv-education-visibility", {
            detail: { isVisible: !!isVisible }
        }));
    }

    function updateEducationVisibility() {
        var titleRect;
        var viewportWidth;
        var isVisible;

        if (!title) {
            return;
        }

        titleRect = title.getBoundingClientRect();
        viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        isVisible = titleRect.right > 0 && titleRect.left < viewportWidth;
        announceEducationVisibility(isVisible);
    }

    function updateContentPanelOffset() {
        var introRect;
        var titleRect;
        var titleEndX;
        var overlap;
        var gapAfterTitle;

        if (!introPanel || !title || !contentPanel) {
            return;
        }

        introRect = introPanel.getBoundingClientRect();
        titleRect = title.getBoundingClientRect();
        titleEndX = titleRect.right - introRect.left;
        gapAfterTitle = 80;
        overlap = Math.max(0, titleEndX - introRect.width + gapAfterTitle);
        educationSection.style.setProperty("--edu-content-shift", overlap.toFixed(2) + "px");
    }

    function updateSchoolLiftDistances() {
        schoolItems.forEach(function (item) {
            var info = item.querySelector(".cv-school-info");
            var liftDistance;

            if (!info) {
                return;
            }

            liftDistance = Math.ceil(info.offsetHeight + 12);
            item.style.setProperty("--school-lift-distance", liftDistance + "px");
        });
    }

    function setOpenSchool(nextOpenItem) {
        schoolItems.forEach(function (item) {
            var isOpen = item === nextOpenItem;

            item.classList.toggle("is-open", isOpen);
        });
    }

    function updateContentPanelWidth() {
        var items;
        var panelRect;
        var furthestRight;
        var panelStyle;
        var paddingRight;
        var trailingEdge;
        var contentWidth;

        if (!contentPanel || !educationContent) {
            return;
        }

        items = Array.prototype.slice.call(educationContent.querySelectorAll(".cv-school-item"));
        panelRect = contentPanel.getBoundingClientRect();
        panelStyle = window.getComputedStyle(contentPanel);
        paddingRight = parseFloat(panelStyle.paddingRight) || 0;
        trailingEdge = 24;
        furthestRight = items.reduce(function (maxRight, item) {
            var itemRect = item.getBoundingClientRect();
            return Math.max(maxRight, itemRect.right);
        }, panelRect.left);
        contentWidth = Math.max(window.innerWidth, Math.ceil(furthestRight - panelRect.left + paddingRight + trailingEdge));

        educationSection.style.setProperty("--edu-base-content-width", contentWidth.toFixed(2) + "px");
    }

    function getTrackTravelDistance() {
        return Math.max(0, educationSection.offsetWidth - window.innerWidth);
    }

    updateContentPanelOffset();
    updateSchoolLiftDistances();
    updateContentPanelWidth();
    updateEducationVisibility();
    if (document.fonts && typeof document.fonts.ready === "object") {
        document.fonts.ready.then(function () {
            updateContentPanelOffset();
            updateSchoolLiftDistances();
            updateContentPanelWidth();
            updateEducationVisibility();
        });
    }
    window.addEventListener("resize", function () {
        updateContentPanelOffset();
        updateSchoolLiftDistances();
        updateContentPanelWidth();
        updateEducationVisibility();
    });

    schoolItems.forEach(function (item) {
        var image = item.querySelector(".cv-school-image");
        var info = item.querySelector(".cv-school-info");

        function openOrToggle(event) {
            event.preventDefault();
            event.stopPropagation();
            setOpenSchool(item.classList.contains("is-open") ? null : item);
        }

        if (image) {
            image.addEventListener("click", openOrToggle);
        }

        if (info) {
            info.addEventListener("click", openOrToggle);
        }
    });

    gsapApi.set(educationSection, {
        x: function () {
            return window.innerWidth;
        }
    });

    var horizontalTween = gsapApi.to(educationSection, {
        x: function () {
            return -getTrackTravelDistance();
        },
        ease: "none",
        scrollTrigger: {
            trigger: wrapper,
            start: "top top",
            end: function () {
                return "+=" + getTrackTravelDistance();
            },
            scrub: true,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: function () {
                updateContentPanelOffset();
                updateSchoolLiftDistances();
                updateContentPanelWidth();
                updateEducationVisibility();
            },
            onUpdate: updateEducationVisibility
        }
    });

    if (!educationContent || typeof gsapApi.fromTo !== "function") {
        return;
    }

    gsapApi.fromTo(
        educationContent,
        { xPercent: 0, autoAlpha: 0.25 },
        {
            xPercent: 0,
            autoAlpha: 1,
            ease: "none",
            scrollTrigger: {
                trigger: ".cv-education-panel-content",
                containerAnimation: horizontalTween,
                start: "left right",
                end: "left center",
                scrub: true,
                invalidateOnRefresh: true
            }
        }
    );
})();
