(function () {
    const section = document.getElementById("cv-intro");
    const gsapApi = window.gsap;
    const shuffleAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    if (!section) {
        return;
    }

    const title = section.querySelector(".title");
    const orbitScene = section.querySelector(".cv-intro-orbit-scene");
    const orbitStage = section.querySelector(".cv-intro-orbit-stage");
    const orbitSceneBackground = section.querySelector(".cv-intro-orbit-scene-background");
    const scrollHint = section.querySelector(".cv-intro-scroll-hint");
    const introTextWrapper = section.querySelector(".cv-intro-title-wrapper");
    const introText = section.querySelector(".cv-intro-text");
    const introEntranceTargets = [
        orbitSceneBackground,
        orbitScene,
        scrollHint
    ].filter(Boolean);
    const canUseGsap = !!gsapApi && typeof gsapApi.fromTo === "function";
    const educationExitDelayMs = 320;
    const introEnterDurationMs = 1180;
    let delayedHideTimerId = null;
    let introEnterCleanupTimerId = null;
    let typingCursorTween = null;
    let orbitBackgroundFrameId = null;

    const syncOrbitBackgroundPosition = () => {
        let rect;
        let width;
        let height;
        let left;
        let top;

        orbitBackgroundFrameId = null;

        if (!orbitStage || !orbitSceneBackground || orbitSceneBackground.classList.contains("is-education-active")) {
            return;
        }

        rect = orbitStage.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return;
        }

        width = rect.width * 0.58;
        height = rect.height * 0.9;
        left = rect.left + rect.width * 0.7;
        top = rect.top + rect.height * 0.52;

        orbitSceneBackground.style.setProperty("--cv-intro-orbit-bg-left", left + "px");
        orbitSceneBackground.style.setProperty("--cv-intro-orbit-bg-top", top + "px");
        orbitSceneBackground.style.setProperty("--cv-intro-orbit-bg-width", width + "px");
        orbitSceneBackground.style.setProperty("--cv-intro-orbit-bg-height", height + "px");
    };

    const queueOrbitBackgroundSync = () => {
        if (orbitBackgroundFrameId !== null) {
            return;
        }

        orbitBackgroundFrameId = window.requestAnimationFrame(syncOrbitBackgroundPosition);
    };

    const setEducationHiddenState = (hidden) => {
        if (orbitScene) {
            orbitScene.classList.toggle("is-education-hidden", hidden);
        }
        if (scrollHint) {
            scrollHint.classList.toggle("is-education-hidden", hidden);
        }
        if (introTextWrapper) {
            introTextWrapper.classList.toggle("is-education-hidden", hidden);
        }
        if (orbitSceneBackground) {
            orbitSceneBackground.classList.toggle("is-education-active", hidden);
        }

        if (!hidden) {
            queueOrbitBackgroundSync();
        }
    };

    const playTitleArrival = () => {
        if (!title) {
            return;
        }

        if (!canUseGsap) {
            title.style.opacity = "1";
            title.style.transform = "translateY(0)";
            return;
        }

        gsapApi.killTweensOf(title);
        gsapApi.fromTo(
            title,
            { y: 170, autoAlpha: 0, filter: "blur(4px)" },
            {
                y: 0,
                autoAlpha: 1,
                filter: "blur(0px)",
                duration: 1.1,
                ease: "power3.out",
                clearProps: "filter"
            }
        );
    };

    const queueTitleArrival = () => {
        window.setTimeout(playTitleArrival, 800);
    };

    const resetIntroEntrance = () => {
        if (introEnterCleanupTimerId !== null) {
            window.clearTimeout(introEnterCleanupTimerId);
            introEnterCleanupTimerId = null;
        }
        section.classList.remove("intro-enter-active");
        introEntranceTargets.forEach((element) => {
            element.classList.remove("intro-enter");
            element.style.removeProperty("--intro-enter-delay");
        });
    };

    const startIntroEntrance = () => {
        if (introEnterCleanupTimerId !== null) {
            window.clearTimeout(introEnterCleanupTimerId);
            introEnterCleanupTimerId = null;
        }
        section.classList.add("intro-enter-active");
        introEntranceTargets.forEach((element) => {
            element.classList.add("intro-enter");
            element.style.setProperty("--intro-enter-delay", "0ms");
        });

        introEnterCleanupTimerId = window.setTimeout(() => {
            section.classList.remove("intro-enter-active");
            introEntranceTargets.forEach((element) => {
                element.classList.remove("intro-enter");
                element.style.removeProperty("--intro-enter-delay");
            });
            introEnterCleanupTimerId = null;
        }, introEnterDurationMs + 80);
    };

    const resetIntroTyping = () => {
        let originalText;

        if (!introText) {
            return;
        }

        originalText = introText.dataset.originalText || introText.textContent || "";
        introText.textContent = originalText;
        introText.classList.remove("is-typing");
        introText.style.removeProperty("border-right-color");

        if (typingCursorTween && typeof typingCursorTween.kill === "function") {
            typingCursorTween.kill();
            typingCursorTween = null;
        }

        if (canUseGsap && typeof gsapApi.killTweensOf === "function") {
            gsapApi.killTweensOf(introText);
        }
    };

    const startIntroTyping = () => {
        let originalText;
        let charCount;
        let typeDuration;
        let typingState;

        if (!introText) {
            return;
        }

        resetIntroTyping();

        if (!introText.dataset.originalText) {
            introText.dataset.originalText = introText.textContent || "";
        }
        originalText = introText.dataset.originalText;
        charCount = Math.max(1, originalText.length);
        introText.classList.add("is-typing");
        introText.textContent = "";

        if (canUseGsap && typeof gsapApi.to === "function") {
            typeDuration = Math.min(4.6, Math.max(1.5, charCount * 0.08));
            typingState = { count: 0 };

            gsapApi.to(typingState, {
                count: charCount,
                duration: typeDuration,
                ease: "steps(" + charCount + ")",
                onUpdate: () => {
                    introText.textContent = originalText.slice(0, Math.floor(typingState.count));
                },
                onComplete: () => {
                    introText.textContent = originalText;
                    typingCursorTween = gsapApi.to(introText, {
                        borderRightColor: "rgba(255,255,255,0)",
                        duration: 0.5,
                        repeat: -1,
                        yoyo: true,
                        ease: "none"
                    });
                }
            });
            return;
        }

        introText.textContent = originalText;
    };

    const shuffleTextOnce = (item) => {
        let originalText;
        let revealedCount = 0;
        let tickCount = 0;
        let intervalId;

        if (!item) {
            return;
        }

        if (!item.dataset.originalText) {
            item.dataset.originalText = item.textContent;
        }

        if (item.dataset.shuffleActive === "true") {
            return;
        }

        originalText = item.dataset.originalText;
        item.dataset.shuffleActive = "true";

        intervalId = window.setInterval(() => {
            const nextText = originalText
                .split("")
                .map((character, index) => {
                    if (character === " " || character === "-" || character === ".") {
                        return character;
                    }

                    if (index < revealedCount) {
                        return originalText.charAt(index);
                    }

                    return shuffleAlphabet.charAt(Math.floor(Math.random() * shuffleAlphabet.length));
                })
                .join("");

            item.textContent = nextText;
            tickCount += 1;
            revealedCount += 1;

            if (tickCount >= originalText.length + 2) {
                window.clearInterval(intervalId);
                item.textContent = originalText;
                item.dataset.shuffleActive = "false";
            }
        }, 38);
    };

    const setupScrollHintShuffle = () => {
        if (!scrollHint) {
            return;
        }

        if (!scrollHint.dataset.originalText) {
            scrollHint.dataset.originalText = scrollHint.textContent;
        }

        scrollHint.addEventListener("mouseenter", () => {
            shuffleTextOnce(scrollHint);
        });

        scrollHint.addEventListener("focus", () => {
            shuffleTextOnce(scrollHint);
        });

        window.setTimeout(() => {
            shuffleTextOnce(scrollHint);
        }, 420);
    };

    if (document.readyState === "complete") {
        queueTitleArrival();
        setupScrollHintShuffle();
        queueOrbitBackgroundSync();
    } else {
        window.addEventListener("load", queueTitleArrival, { once: true });
        window.addEventListener("load", setupScrollHintShuffle, { once: true });
        window.addEventListener("load", queueOrbitBackgroundSync, { once: true });
    }

    window.addEventListener("resize", queueOrbitBackgroundSync);
    window.addEventListener("scroll", queueOrbitBackgroundSync, { passive: true });

    resetIntroEntrance();
    resetIntroTyping();
    document.addEventListener("cv-loader-start", resetIntroEntrance);
    document.addEventListener("cv-loader-start", resetIntroTyping);
    document.addEventListener("cv-loader-exit-start", () => {
        startIntroEntrance();
        startIntroTyping();
    });

    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            queueTitleArrival();
            setupScrollHintShuffle();
            startIntroEntrance();
            startIntroTyping();
        }

        queueOrbitBackgroundSync();
    });

    document.addEventListener("cv-education-visibility", (event) => {
        const detail = event && event.detail ? event.detail : {};
        const isVisible = !!detail.isVisible;
        const isCurrentlyHidden = !!(orbitScene && orbitScene.classList.contains("is-education-hidden"));

        if (isVisible) {
            if (delayedHideTimerId !== null || isCurrentlyHidden) {
                return;
            }

            delayedHideTimerId = window.setTimeout(() => {
                setEducationHiddenState(true);
                delayedHideTimerId = null;
            }, educationExitDelayMs);
            return;
        }

        if (delayedHideTimerId !== null) {
            window.clearTimeout(delayedHideTimerId);
            delayedHideTimerId = null;
        }

        setEducationHiddenState(false);
    });
})();
