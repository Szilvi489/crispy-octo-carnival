(function () {
    var wrapper = document.querySelector(".cv-horizontal-intro-education");
    var educationTrack = document.querySelector(".cv-horizontal-education-track");
    var educationSection = document.getElementById("cv-education");
    var educationContent = document.querySelector(".cv-education-content");
    var title = educationSection ? educationSection.querySelector(".cv-education-title") : null;
    var introPanel = educationSection ? educationSection.querySelector(".cv-education-panel-intro") : null;
    var contentPanel = educationSection ? educationSection.querySelector(".cv-education-panel-content") : null;
    var clickHint = educationSection ? educationSection.querySelector(".cv-education-click-hint") : null;
    var schoolItems = educationSection ? Array.prototype.slice.call(educationSection.querySelectorAll(".cv-school-item")) : [];
    var schoolImages = educationSection ? Array.prototype.slice.call(educationSection.querySelectorAll(".cv-school-image")) : [];
    var skyDecorItems = educationSection
        ? Array.prototype.slice.call(educationSection.querySelectorAll(".cv-education-sky-deco"))
        : [];
    var skyDecorImages = educationSection
        ? Array.prototype.slice.call(educationSection.querySelectorAll(".cv-education-sky-image"))
        : [];
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
        var contentPanelRect;
        var viewportWidth;
        var isVisible;
        var isInteractive;

        if (!title) {
            if (educationTrack) {
                educationTrack.classList.remove("is-interactive");
            }
            return;
        }

        titleRect = title.getBoundingClientRect();
        contentPanelRect = contentPanel ? contentPanel.getBoundingClientRect() : null;
        viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        isVisible = titleRect.right > 0 && titleRect.left < viewportWidth;
        isInteractive = contentPanelRect
            ? (contentPanelRect.right > 0 && contentPanelRect.left < viewportWidth)
            : false;
        announceEducationVisibility(isVisible);
        if (educationTrack) {
            educationTrack.classList.toggle("is-interactive", isInteractive);
        }
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
        var firstItemIsOpen;

        schoolItems.forEach(function (item) {
            var isOpen = item === nextOpenItem;

            item.classList.toggle("is-open", isOpen);
        });

        if (!clickHint || !schoolItems.length) {
            return;
        }

        firstItemIsOpen = schoolItems[0] === nextOpenItem;
        clickHint.textContent = firstItemIsOpen ? "Click to close" : "Click to reveal details";
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
        trailingEdge = 8;
        furthestRight = items.reduce(function (maxRight, item) {
            var itemRect = item.getBoundingClientRect();
            return Math.max(maxRight, itemRect.right);
        }, panelRect.left);
        contentWidth = Math.max(
            window.innerWidth,
            Math.ceil(furthestRight - panelRect.left + paddingRight + trailingEdge)
        );

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

    setOpenSchool(null);

    schoolImages.forEach(function (image) {
        if (!image) {
            return;
        }

        if (image.complete) {
            return;
        }

        image.addEventListener("load", function () {
            updateContentPanelWidth();
            updateSchoolLiftDistances();
            if (scrollTriggerApi && typeof scrollTriggerApi.refresh === "function") {
                scrollTriggerApi.refresh();
            }
        }, { once: true });
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

    if (skyDecorItems.length && typeof gsapApi.fromTo === "function") {
        gsapApi.fromTo(
            skyDecorItems,
            {
                autoAlpha: 0,
                yPercent: 16,
                xPercent: function (index) {
                    return index === 0 ? -8 : 8;
                },
                scale: 0.9
            },
            {
                autoAlpha: 1,
                yPercent: 0,
                xPercent: 0,
                scale: 1,
                ease: "power2.out",
                stagger: 0.08,
                scrollTrigger: {
                    trigger: ".cv-education-panel-content",
                    containerAnimation: horizontalTween,
                    start: "left right",
                    end: "left 72%",
                    scrub: true,
                    invalidateOnRefresh: true
                }
            }
        );
    }

    if (skyDecorImages.length) {
        skyDecorImages.forEach(function (image, index) {
            gsapApi.to(image, {
                y: index === 0 ? -18 : -14,
                scale: index === 0 ? 1.08 : 1.06,
                rotation: index === 0 ? -1.8 : 1.6,
                duration: index === 0 ? 7.4 : 8.2,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1
            });
        });
    }

    if (!educationContent || typeof gsapApi.fromTo !== "function") {
        return;
    }

    gsapApi.fromTo(
        educationContent,
        { xPercent: 0, autoAlpha: 1 },
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
