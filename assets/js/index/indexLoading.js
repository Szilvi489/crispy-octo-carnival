(() => {
    var gsapApi = window.gsap;
    var hasAnimatedLoaderIn = false;
    var STACKED_BREAKPOINT = 700;
    var counterProgress = 0;
    var counterTarget = 0;
    var counterRafId = null;
    var counterAmbientTimerId = null;
    var hasFinishedCounter = false;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function renderCounter(counterEl) {
        if (!counterEl) {
            return;
        }

        counterEl.textContent = Math.round(clamp(counterProgress, 0, 100)) + "%";
    }

    function stopCounterAnimation() {
        if (counterRafId !== null) {
            window.cancelAnimationFrame(counterRafId);
            counterRafId = null;
        }
    }

    function stopAmbientProgress() {
        if (counterAmbientTimerId !== null) {
            window.clearInterval(counterAmbientTimerId);
            counterAmbientTimerId = null;
        }
    }

    function tickCounter() {
        var refs = getLoaderRefs();
        var delta;

        if (!refs || !refs.counterEl) {
            stopCounterAnimation();
            return;
        }

        delta = counterTarget - counterProgress;

        if (Math.abs(delta) <= 0.2) {
            counterProgress = counterTarget;
            renderCounter(refs.counterEl);
            counterRafId = null;
            return;
        }

        counterProgress += delta * 0.18 + (delta > 0 ? 0.2 : -0.2);

        if (delta > 0 && counterProgress > counterTarget) {
            counterProgress = counterTarget;
        }

        if (delta < 0 && counterProgress < counterTarget) {
            counterProgress = counterTarget;
        }

        renderCounter(refs.counterEl);
        counterRafId = window.requestAnimationFrame(tickCounter);
    }

    function queueCounterRender() {
        if (counterRafId === null) {
            counterRafId = window.requestAnimationFrame(tickCounter);
        }
    }

    function setCounterTarget(progress) {
        counterTarget = clamp(Math.max(counterTarget, progress), 0, 100);
        queueCounterRender();
    }

    function startAmbientProgress() {
        stopAmbientProgress();
        counterAmbientTimerId = window.setInterval(() => {
            if (hasFinishedCounter || counterTarget >= 28) {
                stopAmbientProgress();
                return;
            }

            setCounterTarget(counterTarget + 2.5);
        }, 180);
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
        var counterEl = document.querySelector(".index-loading-counter");
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
            counterEl: counterEl,
            firstEl: loadingText.querySelector(".loading-text__part--first"),
            secondEl: loadingText.querySelector(".loading-text__part--second")
        };
    }

    window.startIndexLoaderProgress = function () {
        var refs = getLoaderRefs();

        stopCounterAnimation();
        stopAmbientProgress();

        hasFinishedCounter = false;
        counterProgress = 0;
        counterTarget = 0;

        if (refs && refs.counterEl) {
            renderCounter(refs.counterEl);
        }

        startAmbientProgress();
    };

    window.setIndexLoaderProgress = function (percent) {
        var normalized = clamp(percent, 0, 100);
        var mappedProgress = 30 + (normalized * 0.69);

        if (hasFinishedCounter) {
            return;
        }

        setCounterTarget(mappedProgress);
    };

    window.finishIndexLoaderProgress = function () {
        hasFinishedCounter = true;
        stopAmbientProgress();
        setCounterTarget(100);
    };

    window.playIndexLoaderIn = function () {
        var refs = getLoaderRefs();

        if (!refs) {
            return Promise.resolve();
        }

        var motion = getLoaderMotion();

        window.startIndexLoaderProgress?.();
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

        window.finishIndexLoaderProgress?.();

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
