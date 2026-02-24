(function () {
    var pageLoaderText = document.querySelector(".page-loader-text");
    var cvContent = document.querySelectorAll(".cv-content");
    var cvSections = Array.prototype.slice.call(document.querySelectorAll(".cv-content section"));
    var sectionStates = new Map();

    var minLoadingMs = 5000;
    var loadingStartMs = Date.now();
    var pageIsComplete = document.readyState === "complete";
    var sectionsAreComplete = false;
    var loadingFinished = false;

    function setLoadingClasses(isLoading) {
        if (pageLoaderText && isLoading) {
            pageLoaderText.classList.add("page-loading");
        } else if (pageLoaderText) {
            pageLoaderText.classList.remove("page-loading");
        }

        if (isLoading) {
            cvContent.forEach(function (el) {
                el.classList.add("page-loading");
            });

            cvSections.forEach(function (section) {
                section.classList.add("page-loading");
            });
        } else {
            cvContent.forEach(function (el) {
                el.classList.remove("page-loading");
            });

            cvSections.forEach(function (section) {
                section.classList.remove("page-loading");
            });
        }
    }

    function onResize() {

    }

    function tryFinishLoading() {
        var elapsedMs = Date.now() - loadingStartMs;

        if (!pageIsComplete || !sectionsAreComplete || elapsedMs < minLoadingMs || loadingFinished) {
            return;
        }

        loadingFinished = true;
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

    setLoadingClasses(true);
    watchSectionsLoaded();

    document.addEventListener("readystatechange", function () {
        if (document.readyState === "complete") {
            pageIsComplete = true;
            tryFinishLoading();
        }
    });

    window.addEventListener("resize", onResize);
})();
