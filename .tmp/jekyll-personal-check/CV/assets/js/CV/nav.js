(function () {
    var cvSection = document.querySelector(".cv-section");
    var navSection = document.querySelector(".nav-section");
    var navItems = Array.prototype.slice.call(document.querySelectorAll(".cv-nav a"));
    var navScrollRafId = null;
    var gsapApi = window.gsap;
    var activeScrollTween = null;
    var fallbackScrollRafId = null;
    var reducedMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    var respectReducedMotion = false;
    var scrollDurationSeconds = 1.35;
    var scrollEase = "none";
    var shuffleAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var educationWrapper = document.querySelector(".cv-horizontal-intro-education");
    var educationSection = document.getElementById("cv-education");
    var educationContentPanel = educationSection ? educationSection.querySelector(".cv-education-panel-content") : null;
    var firstSchoolItem = educationSection ? educationSection.querySelector(".cv-school-item") : null;

    function setEducationHidden(isHidden) {
        if (!navSection) {
            return;
        }

        navSection.classList.toggle("is-education-hidden", !!isHidden);
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function resetNavEntrance() {
        navItems.forEach(function (item) {
            item.classList.remove("nav-enter");
            item.style.removeProperty("--nav-enter-delay");
        });

        if (cvSection) {
            cvSection.classList.remove("nav-enter-active");
        }
    }

    function startNavEntrance() {
        if (cvSection) {
            cvSection.classList.add("nav-enter-active");
        }

        navItems.forEach(function (item, index) {
            item.classList.add("nav-enter");
            item.style.setProperty("--nav-enter-delay", (index * 110) + "ms");
        });
    }

    resetNavEntrance();
    document.addEventListener("cv-loader-start", resetNavEntrance);
    document.addEventListener("cv-loader-exit-start", startNavEntrance);

    function updateNavScrollShift() {
        var scrollY;
        var navHeight;
        var maxShift;
        var shift;

        navScrollRafId = null;

        if (!navSection) {
            return;
        }

        scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        navHeight = navSection.getBoundingClientRect().height || 0;
        maxShift = navHeight + 42;
        shift = clamp(scrollY * 0.65, 0, maxShift);

        navSection.style.setProperty("--cv-nav-scroll-shift", shift.toFixed(2) + "px");
    }

    function queueNavScrollShift() {
        if (navScrollRafId !== null) {
            return;
        }

        navScrollRafId = requestAnimationFrame(updateNavScrollShift);
    }

    function stopFallbackScrollTween() {
        if (fallbackScrollRafId === null) {
            return;
        }
        window.cancelAnimationFrame(fallbackScrollRafId);
        fallbackScrollRafId = null;
    }

    function animateScrollFallback(fromY, toY, durationMs) {
        var startTime = null;
        var distance = toY - fromY;

        stopFallbackScrollTween();

        function step(timestamp) {
            var elapsed;
            var progress;
            var y;

            if (startTime === null) {
                startTime = timestamp;
            }

            elapsed = timestamp - startTime;
            progress = Math.min(1, elapsed / Math.max(1, durationMs));
            y = fromY + (distance * progress);
            window.scrollTo(0, y);

            if (progress < 1) {
                fallbackScrollRafId = window.requestAnimationFrame(step);
                return;
            }

            fallbackScrollRafId = null;
        }

        fallbackScrollRafId = window.requestAnimationFrame(step);
    }

    function updateHash(hash) {
        if (!hash) return;
        if (window.history && typeof window.history.replaceState === "function") {
            window.history.replaceState(null, "", hash);
        }
    }

    function parseLengthValue(value, viewportSize) {
        var numericValue;

        if (!value) {
            return 0;
        }

        numericValue = parseFloat(value);
        if (!isFinite(numericValue)) {
            return 0;
        }

        if (value.indexOf("vw") > -1 || value.indexOf("vh") > -1) {
            return (numericValue / 100) * viewportSize;
        }

        return numericValue;
    }

    function getEducationBuildingsTargetY(navHeight, topPadding) {
        var wrapperTop;
        var sectionStyle;
        var contentStyle;
        var viewportWidth;
        var shift;
        var trackDistance;
        var leadIn;
        var itemOffsetX;
        var panelPaddingLeft;
        var targetOffsetWithinTrack;

        if (!educationWrapper || !educationSection || !educationContentPanel) {
            return null;
        }

        viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        wrapperTop = window.pageYOffset + educationWrapper.getBoundingClientRect().top;
        sectionStyle = window.getComputedStyle(educationSection);
        contentStyle = window.getComputedStyle(educationContentPanel);
        shift = parseLengthValue(sectionStyle.getPropertyValue("--edu-content-shift"), viewportWidth);
        trackDistance = Math.max(0, educationSection.offsetWidth - viewportWidth);
        panelPaddingLeft = parseFloat(contentStyle.paddingLeft) || 0;
        itemOffsetX = firstSchoolItem
            ? parseLengthValue(window.getComputedStyle(firstSchoolItem).getPropertyValue("--school-offset-x"), viewportWidth)
            : 0;
        leadIn = Math.max(0, -(panelPaddingLeft + itemOffsetX));
        targetOffsetWithinTrack = trackDistance > 0
            ? (trackDistance * ((2 * viewportWidth) + shift - leadIn)) / (trackDistance + viewportWidth)
            : 0;

        return Math.max(0, wrapperTop + targetOffsetWithinTrack - navHeight - topPadding);
    }

    function shuffleTextOnce(item) {
        var originalText;
        var revealedCount;
        var tickCount;
        var intervalId;

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
        revealedCount = 0;
        tickCount = 0;
        item.dataset.shuffleActive = "true";

        intervalId = window.setInterval(function () {
            var nextText = originalText
                .split("")
                .map(function (character, index) {
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
    }

    function scrollToTarget(hash) {
        if (!hash || hash.charAt(0) !== "#") return;
        var target = document.querySelector(hash);
        if (!target) return;

        var navHeight = navSection ? navSection.getBoundingClientRect().height : 0;
        var topPadding = 24;
        var targetY = hash === "#cv-education"
            ? getEducationBuildingsTargetY(navHeight, topPadding)
            : null;

        if (targetY === null) {
            targetY = window.pageYOffset + target.getBoundingClientRect().top - navHeight - topPadding;
        }

        var nextY = Math.max(0, targetY);
        var shouldReduceMotion = respectReducedMotion && reducedMotionQuery ? reducedMotionQuery.matches : false;

        if (shouldReduceMotion) {
            window.scrollTo(0, nextY);
            updateHash(hash);
            return;
        }

        if (activeScrollTween && typeof activeScrollTween.kill === "function") {
            activeScrollTween.kill();
            activeScrollTween = null;
        }
        stopFallbackScrollTween();

        if (!gsapApi || typeof gsapApi.to !== "function") {
            animateScrollFallback(
                window.pageYOffset || document.documentElement.scrollTop || 0,
                nextY,
                scrollDurationSeconds * 1000
            );
            window.setTimeout(function () {
                updateHash(hash);
            }, Math.max(0, Math.round(scrollDurationSeconds * 1000)));
            return;
        }

        var scrollState = {
            y: window.pageYOffset || document.documentElement.scrollTop || 0
        };

        activeScrollTween = gsapApi.to(scrollState, {
            y: nextY,
            duration: scrollDurationSeconds,
            ease: scrollEase,
            overwrite: true,
            onUpdate: function () {
                window.scrollTo(0, scrollState.y);
            },
            onComplete: function () {
                activeScrollTween = null;
                updateHash(hash);
            }
        });
    }

    navItems.forEach(function (item) {
        if (!item.dataset.originalText) {
            item.dataset.originalText = item.textContent;
        }

        item.addEventListener("click", function (event) {
            var hash = item.getAttribute("href");
            if (!hash || hash.charAt(0) !== "#") return;
            event.preventDefault();
            scrollToTarget(hash);
        });

        item.addEventListener("mouseenter", function () {
            shuffleTextOnce(item);
        });

        item.addEventListener("focus", function () {
            shuffleTextOnce(item);
        });
    });

    document.addEventListener("cv-education-visibility", function (event) {
        var detail = event && event.detail ? event.detail : {};
        setEducationHidden(!!detail.isVisible);
    });

    window.addEventListener("scroll", queueNavScrollShift, { passive: true });
    window.addEventListener("resize", queueNavScrollShift);
    updateNavScrollShift();
})();
