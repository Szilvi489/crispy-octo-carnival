(function () {
    var titleLinks = document.querySelectorAll(".project-card-title-overlay");
    var counter = document.querySelector(".counter");
    var pageSection = document.querySelector(".project-page-section");
    var projectCards = document.querySelectorAll(".project-card-flexbox");
    var imageRows = document.querySelectorAll(".project-card-images-flexbox");
    var images = document.querySelectorAll(".project-card-images-flexbox img");
    var minLoadingMs = 500;
    var loadingStartMs = Date.now();
    var pageIsComplete = document.readyState === "complete";
    var imagesAreComplete = false;
    var loadingFinished = false;
    var counterTimerId = null;
    var resizeRafId = null;

    function setHoverBackground(imageUrl) {
        if (!pageSection) {
            return;
        }

        if (!imageUrl) {
            pageSection.classList.remove("has-hover-background");
            pageSection.style.removeProperty("--hover-bg-image");
            return;
        }

        pageSection.style.setProperty("--hover-bg-image", 'url("' + imageUrl + '")');
        pageSection.classList.add("has-hover-background");
    }

    function bindHoverBackground() {
        var i;

        for (i = 0; i < images.length; i++) {
            images[i].addEventListener("mouseenter", function (event) {
                var hoveredImage = event.currentTarget;
                var imageUrl = hoveredImage.currentSrc || hoveredImage.src;
                setHoverBackground(imageUrl);
            });
        }

        for (i = 0; i < projectCards.length; i++) {
            projectCards[i].addEventListener("mouseleave", function () {
                setHoverBackground(null);
            });
        }
    }

    function setLoadingClasses(isLoading) {
        var i;

        for (i = 0; i < titleLinks.length; i++) {
            if (isLoading) {
                titleLinks[i].classList.add("page-loading");
            } else {
                titleLinks[i].classList.remove("page-loading");
            }
        }

        if (!counter) {
            return;
        }

        if (isLoading) {
            counter.classList.add("page-loading");
        } else {
            counter.classList.remove("page-loading");
        }

        if (!pageSection) {
            return;
        }

        if (isLoading) {
            pageSection.classList.add("page-loading");
        } else {
            pageSection.classList.remove("page-loading");
        }
    }

    function setBlurProgress(normalizedProgress) {
        var clampedProgress;
        var blurPx;

        if (!pageSection) {
            return;
        }

        clampedProgress = Math.max(0, Math.min(normalizedProgress, 1));
        blurPx = 14 * (1 - clampedProgress);

        pageSection.style.setProperty("--loading-blur", blurPx.toFixed(2) + "px");
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function layoutImageRows() {
        var fixedGap;
        var minTile;
        var maxTile;
        var i;

        if (!pageSection) {
            return;
        }

        fixedGap = parseFloat(getComputedStyle(pageSection).getPropertyValue("--tile-gap")) || 16;
        minTile = parseFloat(getComputedStyle(pageSection).getPropertyValue("--tile-size-min")) || 48;
        maxTile = parseFloat(getComputedStyle(pageSection).getPropertyValue("--tile-size-max")) || 124;

        for (i = 0; i < imageRows.length; i++) {
            var row = imageRows[i];
            var links = row.querySelectorAll("a");
            var count = links.length;
            var rowWidth = row.clientWidth;
            var tileSize;
            var totalGapWidth;

            if (count < 1 || rowWidth <= 0) {
                continue;
            }

            if (count === 1) {
                tileSize = clamp(rowWidth, minTile, maxTile);
                row.style.setProperty("--tile-size", tileSize.toFixed(2) + "px");
                row.style.setProperty("--tile-gap", "0px");
                continue;
            }

            totalGapWidth = (count - 1) * fixedGap;
            tileSize = (rowWidth - totalGapWidth) / count;
            tileSize = clamp(tileSize, minTile, maxTile);

            row.style.setProperty("--tile-size", tileSize.toFixed(2) + "px");
            row.style.setProperty("--tile-gap", fixedGap.toFixed(2) + "px");
        }
    }

    function onResize() {
        if (resizeRafId !== null) {
            cancelAnimationFrame(resizeRafId);
        }

        resizeRafId = requestAnimationFrame(function () {
            layoutImageRows();
            resizeRafId = null;
        });
    }

    function renderCounter() {
        var elapsedMs;
        var normalizedProgress;
        var displayProgress;
        var roundedProgress;

        if (!counter || loadingFinished) {
            return;
        }

        elapsedMs = Date.now() - loadingStartMs;
        normalizedProgress = elapsedMs / minLoadingMs;
        setBlurProgress(normalizedProgress);

        if (normalizedProgress < 0.25) {
            displayProgress = (normalizedProgress / 0.25) * 60;
        } else if (normalizedProgress < 0.8) {
            displayProgress = 60 + ((normalizedProgress - 0.25) / 0.55) * 20;
        } else {
            displayProgress = 80 + ((normalizedProgress - 0.8) / 0.2) * 19;
        }

        roundedProgress = Math.floor(displayProgress);

        if (roundedProgress > 99) {
            roundedProgress = 99;
        }

        counter.textContent = roundedProgress + "%";
    }

    function tryFinishLoading() {
        var elapsedMs = Date.now() - loadingStartMs;

        if (!pageIsComplete || !imagesAreComplete || elapsedMs < minLoadingMs || loadingFinished) {
            return;
        }

        loadingFinished = true;

        if (counter) {
            counter.textContent = "100%";
        }

        setBlurProgress(1);

        setLoadingClasses(false);

        if (counterTimerId !== null) {
            clearInterval(counterTimerId);
        }
    }

    function watchImagesLoaded() {
        var pendingCount = images.length;
        var i;

        function markImageLoaded(img) {
            if (!img.classList.contains("is-loaded")) {
                img.classList.add("is-loaded");
            }
        }

        if (pendingCount === 0) {
            imagesAreComplete = true;
            tryFinishLoading();
            return;
        }

        function onImageDone() {
            pendingCount -= 1;

            if (pendingCount <= 0) {
                imagesAreComplete = true;
                tryFinishLoading();
            }
        }

        for (i = 0; i < images.length; i++) {
            var img = images[i];

            if (img.complete) {
                if (img.naturalWidth > 0) {
                    markImageLoaded(img);
                }
                onImageDone();
                continue;
            }

            img.addEventListener("load", function (event) {
                markImageLoaded(event.currentTarget);
                onImageDone();
            }, { once: true });
            img.addEventListener("error", onImageDone, { once: true });
        }
    }

    setLoadingClasses(true);
    watchImagesLoaded();
    bindHoverBackground();
    layoutImageRows();
    renderCounter();
    tryFinishLoading();

    counterTimerId = setInterval(function () {
        renderCounter();
        tryFinishLoading();
    }, 50);

    document.addEventListener("readystatechange", function () {
        if (document.readyState === "complete") {
            pageIsComplete = true;
            tryFinishLoading();
        }
    });

    window.addEventListener("resize", onResize);
})();
