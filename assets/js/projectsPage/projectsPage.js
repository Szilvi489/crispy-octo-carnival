(function () {
    var titleLinks = document.querySelectorAll(".project-card-title-overlay");
    var counter = document.querySelector(".counter");
    var pageSection = document.querySelector(".project-page-section");
    var imageRows = document.querySelectorAll(".project-card-images-flexbox");
    var minLoadingMs = 5000;
    var loadingStartMs = Date.now();
    var pageIsComplete = document.readyState === "complete";
    var loadingFinished = false;
    var counterTimerId = null;
    var resizeRafId = null;

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
        var minGap;
        var maxGap;
        var minTile;
        var maxTile;
        var i;

        if (!pageSection) {
            return;
        }

        minGap = parseFloat(getComputedStyle(pageSection).getPropertyValue("--tile-gap-min")) || 10;
        maxGap = parseFloat(getComputedStyle(pageSection).getPropertyValue("--tile-gap-max")) || 120;
        minTile = parseFloat(getComputedStyle(pageSection).getPropertyValue("--tile-size-min")) || 48;
        maxTile = parseFloat(getComputedStyle(pageSection).getPropertyValue("--tile-size-max")) || 124;

        for (i = 0; i < imageRows.length; i++) {
            var row = imageRows[i];
            var links = row.querySelectorAll("a");
            var count = links.length;
            var rowWidth = row.clientWidth;
            var baseTile;
            var gap;
            var tileSize;

            if (count < 1 || rowWidth <= 0) {
                continue;
            }

            if (count === 1) {
                tileSize = clamp(rowWidth, minTile, maxTile);
                row.style.setProperty("--tile-size", tileSize.toFixed(2) + "px");
                row.style.setProperty("--tile-gap", "0px");
                continue;
            }

            baseTile = clamp(rowWidth / (count + 2), minTile, maxTile);
            gap = (rowWidth - (count * baseTile)) / (count - 1);
            gap = clamp(gap, minGap, maxGap);

            tileSize = (rowWidth - ((count - 1) * gap)) / count;
            tileSize = clamp(tileSize, minTile, maxTile);
            gap = (rowWidth - (count * tileSize)) / (count - 1);
            gap = Math.max(0, gap);

            row.style.setProperty("--tile-size", tileSize.toFixed(2) + "px");
            row.style.setProperty("--tile-gap", gap.toFixed(2) + "px");
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

        if (!pageIsComplete || elapsedMs < minLoadingMs || loadingFinished) {
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

    setLoadingClasses(true);
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
