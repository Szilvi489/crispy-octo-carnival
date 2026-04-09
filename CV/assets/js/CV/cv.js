(function () {
    var cvSection = document.querySelector(".cv-section");
    var cvRoot = document.documentElement;
    var mobileLayoutQuery = window.matchMedia ? window.matchMedia("(max-width: 900px)") : null;
    var pageLoaderText = document.querySelector(".page-loader-text");
    var pageLoaderAnim = document.querySelector(".page-loader-anim");
    var cvContent = document.querySelectorAll(".cv-content");
    var cvSections = Array.prototype.slice.call(document.querySelectorAll(".cv-content section"));
    var sectionStates = new Map();

    var minLoadingMs = 700;
    var maxWaitMs = 3000;
    var loaderFontFamilies = [
        "\"Playfair Display\", serif",
        "\"Rubik Mono One\", sans-serif",
        "\"Aldrich\", sans-serif",
        "\"Bungee\", sans-serif",
        "\"Plaster\", sans-serif",
        "\"Protest Guerrilla\", sans-serif",
        "\"Stalinist One\", sans-serif",
        "\"Tulpen One\", sans-serif"
    ];
    var loadingStartMs = Date.now();
    var pageIsComplete = document.readyState === "complete";
    var sectionsAreComplete = false;
    var loadingFinished = false;
    var minLoadingTimerId = null;
    var loaderExitAnimationHandler = null;
    var loaderFontTimerId = null;
    var loaderLetterSpans = [];

    function setupLoaderTextLetters() {
        var originalText;
        var fragment;

        if (!pageLoaderText || pageLoaderText.dataset.lettersReady === "true") {
            return;
        }

        originalText = pageLoaderText.textContent || "";
        fragment = document.createDocumentFragment();
        loaderLetterSpans = [];

        pageLoaderText.setAttribute("aria-label", originalText);
        pageLoaderText.textContent = "";

        Array.prototype.forEach.call(originalText.split(""), function (char) {
            var span = document.createElement("span");

            span.className = "loader-letter";
            span.setAttribute("aria-hidden", "true");
            span.textContent = char === " " ? "\u00A0" : char;

            if (char !== " ") {
                loaderLetterSpans.push(span);
            }

            fragment.appendChild(span);
        });

        pageLoaderText.appendChild(fragment);
        pageLoaderText.dataset.lettersReady = "true";
    }

    function startLoaderFontCycle() {
        if (!pageLoaderText) {
            return;
        }

        setupLoaderTextLetters();

        if (loaderFontTimerId !== null) {
            return;
        }

        loaderFontTimerId = setInterval(function () {
            loaderLetterSpans.forEach(function (span) {
                var randomIndex = Math.floor(Math.random() * loaderFontFamilies.length);
                span.style.fontFamily = loaderFontFamilies[randomIndex];
            });
        }, 120);
    }

    function stopLoaderFontCycle() {
        if (loaderFontTimerId !== null) {
            clearInterval(loaderFontTimerId);
            loaderFontTimerId = null;
        }

        loaderLetterSpans.forEach(function (span) {
            span.style.fontFamily = "";
        });
    }

    function setLoadingClasses(isLoading) {
        if (pageLoaderAnim && isLoading) {
            if (pageLoaderText) {
                pageLoaderText.classList.add("page-loading");
            }

            startLoaderFontCycle();
            document.dispatchEvent(new CustomEvent("cv-loader-start"));

            if (loaderExitAnimationHandler !== null) {
                pageLoaderAnim.removeEventListener("animationend", loaderExitAnimationHandler);
                loaderExitAnimationHandler = null;
            }

            pageLoaderAnim.classList.remove("page-hidden");
            pageLoaderAnim.classList.remove("page-exit");
            pageLoaderAnim.classList.add("page-loading");
            cvContent.forEach(function (el) {
                el.classList.add("page-loading");
            });

            cvSections.forEach(function (section) {
                section.classList.add("page-loading");
            });
            return;
        }

        if (pageLoaderAnim) {
            if (pageLoaderText) {
                pageLoaderText.classList.remove("page-loading");
            }

            stopLoaderFontCycle();

            cvContent.forEach(function (el) {
                el.classList.remove("page-loading");
            });

            cvSections.forEach(function (section) {
                section.classList.remove("page-loading");
            });

            pageLoaderAnim.classList.remove("page-loading");
            pageLoaderAnim.classList.remove("page-hidden");
            pageLoaderAnim.classList.add("page-exit");
            requestAnimationFrame(function () {
                document.dispatchEvent(new CustomEvent("cv-loader-exit-start"));
            });
            loaderExitAnimationHandler = function (event) {
                if (event.animationName !== "cvLoaderExit") {
                    return;
                }

                pageLoaderAnim.classList.remove("page-exit");
                pageLoaderAnim.classList.add("page-hidden");
                pageLoaderAnim.removeEventListener("animationend", loaderExitAnimationHandler);
                loaderExitAnimationHandler = null;
            };
            pageLoaderAnim.addEventListener("animationend", loaderExitAnimationHandler);
            return;
        }

        if (pageLoaderText) {
            pageLoaderText.classList.remove("page-loading");
        }

        stopLoaderFontCycle();

        cvContent.forEach(function (el) {
            el.classList.remove("page-loading");
        });

        cvSections.forEach(function (section) {
            section.classList.remove("page-loading");
        });
    }

    function syncResponsiveLayoutState() {
        var isMobileLayout = !!(mobileLayoutQuery && mobileLayoutQuery.matches);

        if (cvSection) {
            cvSection.classList.toggle("is-mobile-layout", isMobileLayout);
        }

        if (cvRoot) {
            cvRoot.classList.toggle("cv-mobile-layout", isMobileLayout);
        }
    }

    function onResize() {
        syncResponsiveLayoutState();
    }

    function markPageComplete() {
        pageIsComplete = true;
        tryFinishLoading();
    }

    function scheduleMinLoadingRecheck() {
        var remainingMs;

        if (minLoadingTimerId !== null) {
            return;
        }

        remainingMs = Math.max(0, minLoadingMs - (Date.now() - loadingStartMs));

        minLoadingTimerId = setTimeout(function () {
            minLoadingTimerId = null;
            tryFinishLoading();
        }, remainingMs);
    }

    function tryFinishLoading() {
        var elapsedMs = Date.now() - loadingStartMs;

        if (loadingFinished) {
            return;
        }

        if (elapsedMs < minLoadingMs) {
            scheduleMinLoadingRecheck();
            return;
        }

        if (!pageIsComplete || !sectionsAreComplete) {
            return;
        }

        loadingFinished = true;
        setLoadingClasses(false);
    }

    function forceFinishLoading() {
        if (loadingFinished) {
            return;
        }

        sectionsAreComplete = true;
        pageIsComplete = true;
        loadingFinished = true;

        if (minLoadingTimerId !== null) {
            clearTimeout(minLoadingTimerId);
            minLoadingTimerId = null;
        }

        setLoadingClasses(false);
    }

    function updateCvContentLoadingState() {
        cvContent.forEach(function (contentEl) {
            var stillLoadingSection = contentEl.querySelector("section.page-loading");

            if (stillLoadingSection) {
                contentEl.classList.add("page-loading");
            } else {
                contentEl.classList.remove("page-loading");
            }
        });
    }

    function watchSectionsLoaded() {
        var pendingCount = cvSections.length;

        if (pendingCount === 0) {
            sectionsAreComplete = true;
            updateCvContentLoadingState();
            tryFinishLoading();
            return;
        }

        function getSectionMode(section) {
            var mode = section.getAttribute("data-loader-mode");

            if (!mode) {
                return "media";
            }

            mode = mode.toLowerCase();

            if (mode !== "media" && mode !== "event" && mode !== "both") {
                return "media";
            }

            return mode;
        }

        function completeSection(section) {
            if (!section.classList.contains("page-loading")) {
                return;
            }

            section.classList.remove("page-loading");
            pendingCount -= 1;
            updateCvContentLoadingState();

            if (pendingCount <= 0) {
                sectionsAreComplete = true;
                tryFinishLoading();
            }
        }

        function maybeCompleteSection(section) {
            var state = sectionStates.get(section);

            if (!state || state.isComplete) {
                return;
            }

            if (state.mediaDone && state.eventDone) {
                state.isComplete = true;
                completeSection(section);
            }
        }

        function trackSectionMedia(section) {
            var media = section.querySelectorAll("img, video");
            var mediaPending = media.length;
            var state = sectionStates.get(section);

            if (!state) {
                return;
            }

            if (mediaPending === 0) {
                state.mediaDone = true;
                maybeCompleteSection(section);
                return;
            }

            function onMediaDone() {
                mediaPending -= 1;

                if (mediaPending <= 0) {
                    state.mediaDone = true;
                    maybeCompleteSection(section);
                }
            }

            media.forEach(function (node) {
                if (node.tagName === "IMG") {
                    if (node.complete) {
                        onMediaDone();
                    } else {
                        node.addEventListener("load", onMediaDone, { once: true });
                        node.addEventListener("error", onMediaDone, { once: true });
                    }
                    return;
                }

                if (node.tagName === "VIDEO") {
                    if (node.readyState >= 2) {
                        onMediaDone();
                    } else {
                        node.addEventListener("loadeddata", onMediaDone, { once: true });
                        node.addEventListener("error", onMediaDone, { once: true });
                    }
                }
            });
        }

        cvSections.forEach(function (section) {
            var mode = getSectionMode(section);

            sectionStates.set(section, {
                mode: mode,
                mediaDone: mode === "event",
                eventDone: mode === "media",
                isComplete: false
            });

            if (mode === "media" || mode === "both") {
                trackSectionMedia(section);
            } else {
                maybeCompleteSection(section);
            }
        });

        document.addEventListener("cv-section-ready", function (event) {
            var section = null;
            var state = null;
            var selector = event.detail && event.detail.selector;

            if (event.target && event.target.closest) {
                section = event.target.closest(".cv-content section");
            }

            if (!section && selector) {
                section = document.querySelector(selector);
            }

            if (!section) {
                return;
            }

            state = sectionStates.get(section);

            if (!state || state.mode === "media") {
                return;
            }

            state.eventDone = true;
            maybeCompleteSection(section);
        });

        // Optional helper: call window.cvSectionReady(sectionElementOrSelector)
        window.cvSectionReady = function (sectionOrSelector) {
            var section = sectionOrSelector;

            if (typeof sectionOrSelector === "string") {
                section = document.querySelector(sectionOrSelector);
            }

            if (!section) {
                return;
            }

            section.dispatchEvent(new CustomEvent("cv-section-ready", {
                bubbles: true
            }));
        };
    }

    syncResponsiveLayoutState();
    setLoadingClasses(true);
    watchSectionsLoaded();

    document.addEventListener("readystatechange", function () {
        if (document.readyState === "complete") {
            markPageComplete();
        }
    });

    window.addEventListener("load", markPageComplete, { once: true });

    if (document.readyState === "complete") {
        markPageComplete();
    }

    setTimeout(function () {
        forceFinishLoading();
    }, maxWaitMs);

    if (mobileLayoutQuery) {
        if (typeof mobileLayoutQuery.addEventListener === "function") {
            mobileLayoutQuery.addEventListener("change", syncResponsiveLayoutState);
        } else if (typeof mobileLayoutQuery.addListener === "function") {
            mobileLayoutQuery.addListener(syncResponsiveLayoutState);
        }
    }

    window.addEventListener("resize", onResize);
})();
