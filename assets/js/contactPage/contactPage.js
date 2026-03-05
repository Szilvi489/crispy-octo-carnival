(function () {
    var circle = document.querySelector(".contact-gradient-circle");
    var stage = document.querySelector(".contact-circle-stage");
    var section = document.querySelector(".contact-page-section");
    var titleBlocks = section ? section.querySelectorAll(".text1, .text2") : [];
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
        "--sun-c1": "#f16510",
        "--sun-c2": "#fea51d",
        "--sun-c3": "#ffc59c",
        duration: sunSpeed,
        ease: "sine.inOut"
    });
    timeline.to(colorTarget, {
        "--sun-c1": "#fcb785",
        "--sun-c2": "#ffd4b3",
        "--sun-c3": "#ffe8d2",
        duration: sunSpeed,
        ease: "sine.inOut"
    });
    timeline.to(colorTarget, {
        "--sun-c1": "#ffd58a",
        "--sun-c2": "#ffc46d",
        "--sun-c3": "#ffae5a",
        duration: sunSpeed,
        ease: "sine.inOut"
    });
    timeline.to(colorTarget, {
        "--sun-c1": "#f3e2bf",
        "--sun-c2": "#f3e2bf",
        "--sun-c3": "#f3e2bf",
        duration: sunSpeed,
        ease: "sine.inOut"
    });

    gsapApi.to(stage, {
        yPercent: sinkRangePercent,
        duration: 90,
        ease: "none",
        yoyo: true,
        repeat: -1
    });

    if (titleBlocks.length) {
        gsapApi.from(titleBlocks, {
            duration: 1.05,
            y: function () { return window.innerHeight * 0.95; },
            opacity: 0,
            stagger: 0.12,
            ease: "expo.out",
            delay: 0.18,
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
