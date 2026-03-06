(function () {
    var circle = document.querySelector(".contact-gradient-circle");
    var stage = document.querySelector(".contact-circle-stage");
    var section = document.querySelector(".contact-page-section");
    var titleContact = section ? section.querySelector(".titleP1") : null;
    var titleMe = section ? section.querySelector(".titleP2") : null;
    var formLines = section ? section.querySelectorAll(".contact-form > div") : [];
    var gsapApi = window.gsap;

    if (!circle || !stage || !section || !gsapApi || typeof gsapApi.timeline !== "function") {
        return;
    }

    var sunSpeed = 12;
    var sinkRangePercent = 8;
    var colorTarget = circle;
    var timeline = gsapApi.timeline({
        repeat: -1,
        repeatDelay: 1.25,
        delay: 0.35
    });

    timeline.to(colorTarget, {
        "--sun-c1": "#f12808",
        "--sun-c2": "#d65708",
        "--sun-c3": "#1bee07",
        duration: sunSpeed,
        ease: "sine.inOut"
    });
    timeline.to(colorTarget, {
        "--sun-c1": "#d83b07",
        "--sun-c2": "#1dbb14",
        "--sun-c3": "#0f7b0b",
        duration: sunSpeed,
        ease: "sine.inOut"
    });
    timeline.to(colorTarget, {
        "--sun-c1": "#c84f07",
        "--sun-c2": "#1bee07",
        "--sun-c3": "#18a006",
        duration: sunSpeed,
        ease: "sine.inOut"
    });
    timeline.to(colorTarget, {
        "--sun-c1": "#f12808",
        "--sun-c2": "#cf5d09",
        "--sun-c3": "#1bee07",
        duration: sunSpeed,
        ease: "sine.inOut"
    });

    var backgroundTimeline = gsapApi.timeline({
        repeat: -1,
        yoyo: true,
        defaults: { duration: 18, ease: "sine.inOut" }
    });

    backgroundTimeline
        .to(section, {
            "--bg-c1": "#f12808",
            "--bg-c2": "#1f4cbc",
            "--bg-c3": "#043494",
            "--bg-x": "18%",
            "--bg-y": "30%"
        })
        .to(section, {
            "--bg-c1": "#cc330a",
            "--bg-c2": "#043494",
            "--bg-c3": "#1bee07",
            "--bg-x": "84%",
            "--bg-y": "68%"
        })
        .to(section, {
            "--bg-c1": "#f12808",
            "--bg-c2": "#c63a0a",
            "--bg-c3": "#043494",
            "--bg-x": "50%",
            "--bg-y": "50%"
        });

    gsapApi.to(stage, {
        yPercent: sinkRangePercent,
        duration: 90,
        ease: "none",
        yoyo: true,
        repeat: -1
    });

    if (titleContact) {
        gsapApi.from(titleContact, {
            duration: 1.05,
            y: function () { return -(window.innerHeight * 0.55); },
            opacity: 0,
            ease: "expo.out",
            delay: 0.18,
            clearProps: "transform,opacity"
        });
    }

    if (titleMe) {
        gsapApi.from(titleMe, {
            duration: 1.05,
            y: function () { return window.innerHeight * 0.55; },
            opacity: 0,
            ease: "expo.out",
            delay: 0.24,
            clearProps: "transform,opacity"
        });
    }

    if (formLines.length) {
        var typingTimeline = gsapApi.timeline({ delay: 0.55 });
        var secondsPerChar = 0.018;

        formLines.forEach(function (line) {
            var lineTexts = line.querySelectorAll(".contact-text");
            var lineControls = line.querySelectorAll(".contact-input");

            if (lineControls.length) {
                gsapApi.set(lineControls, { autoAlpha: 0, y: 10 });
            }

            lineTexts.forEach(function (block) {
                var fullText = (block.textContent || "").trim();
                if (!fullText) {
                    return;
                }

                block.textContent = "";

                var progress = { count: 0 };
                typingTimeline.to(progress, {
                    count: fullText.length,
                    duration: Math.max(0.2, fullText.length * secondsPerChar),
                    ease: "none",
                    onUpdate: function () {
                        block.textContent = fullText.slice(0, Math.floor(progress.count));
                    }
                });
            });

            if (lineControls.length) {
                typingTimeline.to(lineControls, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.22,
                    stagger: 0.06,
                    ease: "power2.out",
                    clearProps: "transform,opacity,visibility"
                });
            }
        });
    }

    if (!formLines.length) {
        var formTextBlocks = section ? section.querySelectorAll(".contact-form .contact-text") : [];
        if (!formTextBlocks.length) {
            return;
        }

        var fallbackTypingTimeline = gsapApi.timeline({ delay: 0.55 });
        var fallbackSecondsPerChar = 0.018;

        formTextBlocks.forEach(function (block) {
            var fullText = (block.textContent || "").trim();
            if (!fullText) {
                return;
            }

            block.textContent = "";

            var progress = { count: 0 };
            fallbackTypingTimeline.to(progress, {
                count: fullText.length,
                duration: Math.max(0.2, fullText.length * fallbackSecondsPerChar),
                ease: "none",
                onUpdate: function () {
                    block.textContent = fullText.slice(0, Math.floor(progress.count));
                }
            });
        });
    }
})();
