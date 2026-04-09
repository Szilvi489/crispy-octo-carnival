(() => {
    var gsapApi = window.gsap;
    var hasAnimatedLoaderIn = false;
    var STACKED_BREAKPOINT = 700;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function getLoaderMotion() {
        var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1;
        var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
        var isStacked = viewportWidth <= STACKED_BREAKPOINT;
        var desktopFirstX = clamp(viewportWidth * 0.03, 20, 44);
        var desktopFirstY = -clamp(viewportHeight * 0.05, 20, 40);
        var desktopSecondX = -clamp(viewportWidth * 0.21, 76, 270);
        var desktopSecondY = clamp(viewportHeight * 0.05, 18, 42);

        return {
            isStacked: isStacked,
            firstInFrom: {
                autoAlpha: 0,
                scale: isStacked ? 0.86 : 0,
                x: isStacked ? -clamp(viewportWidth * 0.1, 16, 42) : desktopFirstX,
                y: clamp(viewportHeight * 0.12, 54, 96),
                filter: "blur(12px)"
            },
            firstInTo: {
                autoAlpha: 1,
                scale: 1,
                x: isStacked ? 0 : desktopFirstX,
                y: isStacked ? 0 : desktopFirstY,
                filter: "blur(0px)",
                duration: 0.9,
                ease: "power3.out"
            },
            secondInFrom: {
                autoAlpha: 0,
                scale: isStacked ? 0.86 : 0,
                x: isStacked ? clamp(viewportWidth * 0.1, 16, 42) : desktopSecondX * 0.55,
                y: clamp(viewportHeight * 0.14, 62, 112),
                filter: "blur(12px)"
            },
            secondInTo: {
                autoAlpha: 1,
                scale: 1,
                x: isStacked ? 0 : desktopSecondX,
                y: isStacked ? 0 : desktopSecondY,
                filter: "blur(0px)",
                duration: 0.9,
                ease: "power3.out"
            },
            out: {
                y: clamp(viewportHeight * 0.9, 420, 800),
                z: clamp(viewportWidth * 2.2, 900, 2900),
                scale: isStacked ? clamp(viewportWidth / 62, 4.6, 7.6) : 12
            }
        };
    }

    function getLoaderRefs() {
        var loaderSection = document.querySelector(".index-loading-section");
        var loadingText = document.querySelector(".loading-text");
        var parts;
        var firstPart;
        var secondPart;

        if (!loaderSection || !loadingText || !gsapApi) {
            return null;
        }

        if (!loadingText.querySelector(".loading-text__part")) {
            parts = loadingText.textContent.trim().split(/\s+/);
            firstPart = parts.shift() || "";
            secondPart = parts.join(" ");

            loadingText.innerHTML = `
                <span class="loading-text__part loading-text__part--first">${firstPart}</span>
                <span class="loading-text__part loading-text__part--second">${secondPart}</span>
            `;
        }

        return {
            loaderSection: loaderSection,
            loadingText: loadingText,
            firstEl: loadingText.querySelector(".loading-text__part--first"),
            secondEl: loadingText.querySelector(".loading-text__part--second")
        };
    }

    window.playIndexLoaderIn = function () {
        var refs = getLoaderRefs();

        if (!refs) {
            return Promise.resolve();
        }

        var motion = getLoaderMotion();

        gsapApi.set(refs.loaderSection, { autoAlpha: 1 });
        gsapApi.set(refs.loadingText, { autoAlpha: 1 });
        gsapApi.set([refs.firstEl, refs.secondEl], {
            clearProps: "x,y,z,scale,filter,opacity"
        });

        if (hasAnimatedLoaderIn) {
            return Promise.resolve();
        }

        hasAnimatedLoaderIn = true;

        return new Promise((resolve) => {
            gsapApi.timeline({
                onComplete: resolve
            })
                .fromTo(refs.firstEl,
                    motion.firstInFrom,
                    motion.firstInTo
                )
                .fromTo(refs.secondEl,
                    motion.secondInFrom,
                    motion.secondInTo,
                    0.18
                );
        });
    };

    window.playIndexLoaderOut = function () {
        var refs = getLoaderRefs();

        if (!refs) {
            return Promise.resolve();
        }

        var motion = getLoaderMotion();

        return new Promise((resolve) => {
            gsapApi.timeline({
                defaults: {
                    ease: "back.inOut(0.7)"
                },
                onComplete: () => {
                    refs.loaderSection.setAttribute("aria-hidden", "true");
                    resolve();
                }
            })
                .to([refs.firstEl, refs.secondEl], {
                    y: motion.out.y,
                    z: motion.out.z,
                    scale: motion.out.scale,
                    filter: "blur(10px)",
                    duration: 2.3,
                    stagger: 0.30
                })
                .to(refs.loaderSection, {
                    autoAlpha: 0,
                    duration: 0.38
                }, "-=0.12");
        });
    };
})();
