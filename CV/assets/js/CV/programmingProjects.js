(function () {
    var section = document.getElementById("cv-programming-projects");
    var heading = section ? section.querySelector(".cv-programming-projects-heading") : null;
    var gsapApi = window.gsap;
    var scrollTriggerApi = window.ScrollTrigger;
    var headingTimeline = null;
    var headingLetters = [];

    if (!section || !heading || !gsapApi || !scrollTriggerApi || typeof gsapApi.timeline !== "function") {
        return;
    }

    if (typeof gsapApi.registerPlugin === "function") {
        gsapApi.registerPlugin(scrollTriggerApi);
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function splitHeadingIntoLetters() {
        var text;

        if (heading.dataset.lettersReady === "true") {
            return Array.prototype.slice.call(heading.querySelectorAll(".cv-programming-projects-letter"));
        }

        text = (heading.textContent || "Programming Projects").trim();
        heading.textContent = "";

        text.split("").forEach(function (character) {
            var span = document.createElement("span");
            span.className = "cv-programming-projects-letter";
            if (character === " ") {
                span.classList.add("is-space");
                span.innerHTML = "&nbsp;";
            } else {
                span.textContent = character;
            }
            heading.appendChild(span);
        });

        heading.dataset.lettersReady = "true";
        return Array.prototype.slice.call(heading.querySelectorAll(".cv-programming-projects-letter"));
    }

    function getHeadingStickScale() {
        var baseSize = Math.min(window.innerWidth * 0.6, window.innerHeight * 0.52);
        var targetSize = window.innerWidth * 0.026;
        return clamp(targetSize / Math.max(1, baseSize), 0.03, 0.09);
    }

    function getHeadingStickY() {
        return -(window.innerHeight * 0.42);
    }

    function setupHeadingScrollAnimation() {
        headingLetters = splitHeadingIntoLetters();
        if (!headingLetters.length) {
            return;
        }

        if (headingTimeline) {
            if (headingTimeline.scrollTrigger && typeof headingTimeline.scrollTrigger.kill === "function") {
                headingTimeline.scrollTrigger.kill();
            }
            if (typeof headingTimeline.kill === "function") {
                headingTimeline.kill();
            }
        }

        gsapApi.set(heading, {
            xPercent: -50,
            yPercent: -50,
            y: 0,
            scale: 2.9,
            autoAlpha: 0.12,
            rotationX: 17,
            z: 460,
            filter: "blur(10px)",
            transformPerspective: 1200,
            transformOrigin: "50% 50%"
        });

        gsapApi.set(headingLetters, {
            yPercent: 0,
            z: 0,
            transformOrigin: "50% 50%"
        });

        gsapApi.set(section, {
            "--cv-programming-projects-origami-opacity": 0.14
        });

        headingTimeline = gsapApi.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top 50%",
                end: "bottom top",
                scrub: true,
                invalidateOnRefresh: true
            }
        });

        headingTimeline.to(section, {
                "--cv-programming-projects-origami-opacity": 1,
                duration: 2.17,
                ease: "none"
            }, 0);

        headingTimeline
            .to(heading, {
                autoAlpha: 1,
                scale: 1,
                rotationX: 0,
                z: 0,
                filter: "blur(0px)",
                duration: 1.05,
                ease: "none"
            })
            .to(headingLetters, {
                yPercent: -92,
                stagger: {
                    each: 0.028,
                    from: "start"
                },
                duration: 1.12,
                ease: "none"
            }, ">")
            .to(heading, {
                y: function () {
                    return getHeadingStickY();
                },
                scale: function () {
                    return getHeadingStickScale();
                },
                duration: 1.12,
                ease: "none"
            }, "<")
            .to({}, { duration: 4.4 })
            .to(heading, {
                y: function () {
                    return getHeadingStickY() - (window.innerHeight * 0.12);
                },
                autoAlpha: 0,
                duration: 0.16,
                ease: "none"
            });
    }

    setupHeadingScrollAnimation();

    window.addEventListener("resize", function () {
        if (scrollTriggerApi && typeof scrollTriggerApi.refresh === "function") {
            scrollTriggerApi.refresh();
        }
    });
})();
