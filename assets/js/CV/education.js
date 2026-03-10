(function () {
    var wrapper = document.querySelector(".cv-horizontal-intro-education");
    var educationSection = document.getElementById("cv-education");
    var educationContent = document.querySelector(".cv-education-content");
    var title = educationSection ? educationSection.querySelector(".cv-education-title") : null;
    var introPanel = educationSection ? educationSection.querySelector(".cv-education-panel-intro") : null;
    var contentPanel = educationSection ? educationSection.querySelector(".cv-education-panel-content") : null;
    var gsapApi = window.gsap;
    var scrollTriggerApi = window.ScrollTrigger;

    if (!wrapper || !educationSection || !gsapApi || !scrollTriggerApi || typeof gsapApi.to !== "function") {
        return;
    }

    if (typeof gsapApi.registerPlugin === "function") {
        gsapApi.registerPlugin(scrollTriggerApi);
    }

    function updateContentPanelOffset() {
        var introRect;
        var titleRect;
        var titleEndX;
        var remainingSpace;

        if (!introPanel || !title || !contentPanel) {
            return;
        }

        introRect = introPanel.getBoundingClientRect();
        titleRect = title.getBoundingClientRect();
        titleEndX = titleRect.right - introRect.left;
        remainingSpace = Math.max(0, introRect.width - titleEndX);
        educationSection.style.setProperty("--edu-content-shift", remainingSpace.toFixed(2) + "px");
    }

    updateContentPanelOffset();
    if (document.fonts && typeof document.fonts.ready === "object") {
        document.fonts.ready.then(updateContentPanelOffset);
    }
    window.addEventListener("resize", updateContentPanelOffset);

    gsapApi.set(educationSection, {
        x: function () {
            return window.innerWidth;
        }
    });

    var horizontalTween = gsapApi.to(educationSection, {
        x: function () {
            return -window.innerWidth;
        },
        ease: "none",
        scrollTrigger: {
            trigger: wrapper,
            start: "top top",
            end: function () {
                return "+=" + (window.innerWidth * 2);
            },
            scrub: true,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: updateContentPanelOffset
        }
    });

    if (!educationContent || typeof gsapApi.fromTo !== "function") {
        return;
    }

    gsapApi.fromTo(
        educationContent,
        { xPercent: -38, autoAlpha: 0.25 },
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
