(function () {
    var cloudSources = [
        "/CV/assets/images/CV/removedBackgroundImages/white-cloud-small.png",
        "/CV/assets/images/CV/removedBackgroundImages/white-cloud2-small.png",
        "/CV/assets/images/CV/removedBackgroundImages/white-cloud3-small.png",
        "/CV/assets/images/CV/removedBackgroundImages/white-cloud4-small.png"
    ];
    var beanSource = "/CV/assets/images/CV/removedBackgroundImages/magicbeanPink.png";
    var personalSection = document.getElementById("cv-personal");
    var beanField = document.querySelector(".cv-personal-bean-field");
    var cloudWrap = document.querySelector(".cv-personal-transition-clouds");
    var personalClouds = personalSection
        ? Array.prototype.slice.call(personalSection.querySelectorAll(".cv-personal-prelude-cloud"))
        : [];
    var personalItems = personalSection
        ? Array.prototype.slice.call(personalSection.querySelectorAll(".cv-personal-item"))
        : [];
    var gsapApi = window.gsap;
    var scrollTriggerApi = window.ScrollTrigger;
    var mobileLayoutQuery = window.matchMedia ? window.matchMedia("(max-width: 900px)") : null;
    var head = document.head || document.getElementsByTagName("head")[0];
    var visibilityRafId = null;
    var mouseReactiveRafId = null;
    var beanTweens = [];
    var beanAnimationsActive = false;
    var personalCloudConfigs = [];
    var personalItemConfigs = [];
    var personalScrollDriver = null;
    var pointerClientX = 0;
    var pointerClientY = 0;
    var pointerIsActive = false;
    var currentLayoutMode = "";
    var canUsePointerReactiveMotion = !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    var mobileStaticProgress = 0.82;
    var personalScrollTriggerStart = "top top";
    var personalScrollTravelViewportHeights = 3.4;
    var personalScrollScrubSeconds = 0.9;
    var personalBackgroundTransitionStart = 0.02;
    var personalBackgroundTransitionEnd = 0.88;
    var personalBackgroundFrom = {
        angle: 181,
        start: [28, 4, 4],
        end: [135, 108, 108]
    };
    var personalBackgroundTo = {
        angle: 172,
        start: [250, 235, 215],
        end: [255, 255, 255]
    };
    var beanLayerConfigs = [
        { className: "cv-personal-bean--layer-1", sizes: [11, 9, 8], count: 3, driftMin: 4.8, driftMax: 7.2, pulseMin: 3.4, pulseMax: 5.5 },
        { className: "cv-personal-bean--layer-2", sizes: [8.5, 7, 6], count: 3, driftMin: 5.2, driftMax: 7.8, pulseMin: 3.8, pulseMax: 6.2 },
        { className: "cv-personal-bean--layer-3", sizes: [6.2, 5.3, 4.4], count: 4, driftMin: 5.8, driftMax: 8.2, pulseMin: 4.1, pulseMax: 6.8 },
        { className: "cv-personal-bean--layer-4", sizes: [4.5, 3.8, 3.2], count: 4, driftMin: 6.4, driftMax: 8.8, pulseMin: 4.4, pulseMax: 7.1 },
        { className: "cv-personal-bean--layer-5", sizes: [3.3, 2.8, 2.4], count: 5, driftMin: 6.9, driftMax: 9.4, pulseMin: 4.7, pulseMax: 7.5 }
    ];
    var beanRotations = [-52, -26, -8, 18, 38];

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function lerp(start, end, progress) {
        return start + ((end - start) * progress);
    }

    function parseNumber(value, fallback) {
        var parsedValue = Number(value);

        if (!Number.isFinite(parsedValue)) {
            return fallback;
        }

        return parsedValue;
    }

    function interpolateColor(fromColor, toColor, progress) {
        return [
            Math.round(lerp(fromColor[0], toColor[0], progress)),
            Math.round(lerp(fromColor[1], toColor[1], progress)),
            Math.round(lerp(fromColor[2], toColor[2], progress))
        ];
    }

    function getItemCenter(element) {
        var rect;

        if (!element) {
            return { x: 0, y: 0 };
        }

        rect = element.getBoundingClientRect();

        return {
            x: rect.left + (rect.width / 2),
            y: rect.top + (rect.height / 2)
        };
    }

    function randomBetween(min, max) {
        return min + (Math.random() * (max - min));
    }

    function pickRandom(values) {
        return values[Math.floor(Math.random() * values.length)];
    }

    function preloadImageSource(src, keyName, priority) {
        var link;
        var preloadImage = new Image();
        var key = keyName + ":" + src;

        if (head && !head.querySelector('link[data-cv-preload="' + key + '"]')) {
            link = document.createElement("link");
            link.rel = "preload";
            link.as = "image";
            link.href = src;
            link.fetchPriority = priority || "auto";
            link.setAttribute("data-cv-preload", key);
            head.appendChild(link);
        }

        preloadImage.decoding = "sync";
        preloadImage.fetchPriority = priority || "auto";
        preloadImage.src = src;
        if (typeof preloadImage.decode === "function") {
            preloadImage.decode().catch(function () {});
        }
    }

    function getVisibilityRatio(element) {
        var rect;
        var viewportHeight;
        var visibleHeight;

        if (!element) {
            return 0;
        }

        rect = element.getBoundingClientRect();
        viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

        if (!viewportHeight || !rect.height) {
            return 0;
        }

        visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
        return clamp(visibleHeight / rect.height, 0, 1);
    }

    function resolveEase(easeName) {
        if (gsapApi && typeof gsapApi.parseEase === "function") {
            try {
                return gsapApi.parseEase(easeName || "none");
            } catch (error) {
                return gsapApi.parseEase("none");
            }
        }

        return function (value) {
            return value;
        };
    }

    function buildPersonalItemConfigs() {
        personalItemConfigs = personalItems.map(function (item) {
            var start = clamp(parseNumber(item.dataset.motionStart, 0), 0, 1);
            var end = clamp(parseNumber(item.dataset.motionEnd, 1), 0, 1);

            if (end <= start) {
                end = Math.min(1, start + 0.001);
            }

            return {
                element: item,
                itemOpacity: clamp(parseNumber(item.dataset.itemOpacity, 1), 0, 1),
                start: start,
                end: end,
                ease: resolveEase(item.dataset.motionEase),
                fromX: parseNumber(item.dataset.motionFromX, 0),
                fromY: parseNumber(item.dataset.motionFromY, 0),
                toX: parseNumber(item.dataset.motionToX, 0),
                toY: parseNumber(item.dataset.motionToY, 0),
                fromRotation: parseNumber(item.dataset.motionFromRotation, 0),
                toRotation: parseNumber(item.dataset.motionToRotation, 0),
                fromScale: parseNumber(item.dataset.motionFromScale, 1),
                toScale: parseNumber(item.dataset.motionToScale, 1),
                fromOpacity: clamp(parseNumber(item.dataset.motionFromOpacity, 1), 0, 1),
                toOpacity: clamp(parseNumber(item.dataset.motionToOpacity, 1), 0, 1),
                pointerRadius: 260,
                pointerMaxOffset: 14,
                scrollX: 0,
                scrollY: 0,
                rotation: 0,
                scale: 1,
                opacity: 0,
                currentPointerX: 0,
                currentPointerY: 0,
                targetPointerX: 0,
                targetPointerY: 0
            };
        });
    }

    function buildPersonalCloudConfigs() {
        personalCloudConfigs = personalClouds.map(function (cloud, index) {
            var fromShiftX;
            var fromScale;
            var start;
            var end;

            if (index === 0) {
                fromShiftX = -220;
            } else if (index === 1) {
                fromShiftX = -280;
            } else if (index === 2) {
                fromShiftX = 280;
            } else {
                fromShiftX = 220;
            }

            fromScale = 0.72 + (index * 0.05);
            start = 0;
            end = 0.42 + (index * 0.04);

            return {
                element: cloud,
                start: start,
                end: Math.min(1, end),
                ease: resolveEase("power2.out"),
                fromShiftX: fromShiftX,
                toShiftX: 0,
                fromScale: fromScale,
                toScale: 1
            };
        });
    }

    function applyPersonalItemState(config) {
        if (!config || !config.element || !gsapApi || typeof gsapApi.set !== "function") {
            return;
        }

        gsapApi.set(config.element, {
            xPercent: -50,
            yPercent: -50,
            x: config.scrollX + config.currentPointerX,
            y: config.scrollY + config.currentPointerY,
            rotation: config.rotation,
            scale: config.scale,
            autoAlpha: config.opacity,
            transformOrigin: "50% 50%"
        });
    }

    function updatePointerReactiveTargets() {
        personalItemConfigs.forEach(function (config) {
            var itemCenter;
            var dx;
            var dy;
            var distance;
            var influence;

            if (!pointerIsActive || !canUsePointerReactiveMotion || config.opacity <= 0.001) {
                config.targetPointerX = 0;
                config.targetPointerY = 0;
                return;
            }

            itemCenter = getItemCenter(config.element);
            dx = pointerClientX - itemCenter.x;
            dy = pointerClientY - itemCenter.y;
            distance = Math.sqrt((dx * dx) + (dy * dy));

            if (distance >= config.pointerRadius) {
                config.targetPointerX = 0;
                config.targetPointerY = 0;
                return;
            }

            influence = 1 - (distance / config.pointerRadius);
            influence = influence * influence;
            config.targetPointerX = clamp(dx / config.pointerRadius, -1, 1) * config.pointerMaxOffset * influence;
            config.targetPointerY = clamp(dy / config.pointerRadius, -1, 1) * config.pointerMaxOffset * influence;
        });
    }

    function stepPointerReactiveMotion() {
        var shouldContinue = false;

        mouseReactiveRafId = null;

        personalItemConfigs.forEach(function (config) {
            config.currentPointerX = lerp(config.currentPointerX, config.targetPointerX, 0.14);
            config.currentPointerY = lerp(config.currentPointerY, config.targetPointerY, 0.14);

            if (
                Math.abs(config.targetPointerX - config.currentPointerX) > 0.08 ||
                Math.abs(config.targetPointerY - config.currentPointerY) > 0.08
            ) {
                shouldContinue = true;
            }

            if (
                Math.abs(config.currentPointerX) > 0.04 ||
                Math.abs(config.currentPointerY) > 0.04 ||
                config.opacity > 0.001
            ) {
                applyPersonalItemState(config);
            }
        });

        if (shouldContinue) {
            mouseReactiveRafId = window.requestAnimationFrame(stepPointerReactiveMotion);
        }
    }

    function queuePointerReactiveMotion() {
        if (mouseReactiveRafId !== null) {
            return;
        }

        mouseReactiveRafId = window.requestAnimationFrame(stepPointerReactiveMotion);
    }

    function renderPersonalItems(sectionProgress) {
        var sectionWidth;
        var sectionHeight;
        var visibilityRatio;
        var sectionAlpha;

        if (!personalSection || !personalItemConfigs.length || !gsapApi || typeof gsapApi.set !== "function") {
            return;
        }

        sectionWidth = personalSection.clientWidth || personalSection.offsetWidth || 1;
        sectionHeight = personalSection.offsetHeight || personalSection.clientHeight || 1;
        visibilityRatio = getVisibilityRatio(personalSection);
        sectionAlpha = clamp((visibilityRatio - 0.08) / 0.42, 0, 1);

        personalItemConfigs.forEach(function (config) {
            var localProgress = clamp((sectionProgress - config.start) / Math.max(0.001, config.end - config.start), 0, 1);
            var easedProgress = config.ease(localProgress);
            var x = lerp(config.fromX, config.toX, easedProgress) * (sectionWidth / 100);
            var y = lerp(config.fromY, config.toY, easedProgress) * (sectionHeight / 100);
            var rotation = lerp(config.fromRotation, config.toRotation, easedProgress);
            var scale = lerp(config.fromScale, config.toScale, easedProgress);
            var opacity = clamp(
                lerp(config.fromOpacity, config.toOpacity, easedProgress) * config.itemOpacity * sectionAlpha,
                0,
                1
            );

            config.scrollX = x;
            config.scrollY = y;
            config.rotation = rotation;
            config.scale = scale;
            config.opacity = opacity;
            applyPersonalItemState(config);
        });

        personalSection.style.setProperty("--cv-personal-section-progress", sectionProgress.toFixed(3));
        personalSection.style.setProperty("--cv-personal-section-visibility", visibilityRatio.toFixed(3));

        if (pointerIsActive && canUsePointerReactiveMotion) {
            updatePointerReactiveTargets();
            queuePointerReactiveMotion();
        }
    }

    function renderPersonalClouds(sectionProgress) {
        personalCloudConfigs.forEach(function (config) {
            var localProgress = clamp((sectionProgress - config.start) / Math.max(0.001, config.end - config.start), 0, 1);
            var easedProgress = config.ease(localProgress);
            var shiftX = lerp(config.fromShiftX, config.toShiftX, easedProgress);
            var scale = lerp(config.fromScale, config.toScale, easedProgress);

            config.element.style.setProperty("--cv-personal-cloud-shift-x", shiftX.toFixed(2) + "px");
            config.element.style.setProperty("--cv-personal-cloud-scale", scale.toFixed(3));
        });
    }

    function renderPersonalBackground(sectionProgress) {
        var backgroundProgress;
        var angle;
        var startColor;
        var endColor;

        if (!personalSection) {
            return;
        }

        backgroundProgress = clamp(
            (sectionProgress - personalBackgroundTransitionStart) /
                Math.max(0.001, personalBackgroundTransitionEnd - personalBackgroundTransitionStart),
            0,
            1
        );
        angle = lerp(personalBackgroundFrom.angle, personalBackgroundTo.angle, backgroundProgress);
        startColor = interpolateColor(personalBackgroundFrom.start, personalBackgroundTo.start, backgroundProgress);
        endColor = interpolateColor(personalBackgroundFrom.end, personalBackgroundTo.end, backgroundProgress);

        personalSection.style.setProperty(
            "--cv-personal-background",
            "linear-gradient(" +
                angle.toFixed(2) +
                "deg, rgba(" +
                startColor.join(", ") +
                ", 1) 0%, rgba(" +
                endColor.join(", ") +
                ", 1) 100%)"
        );
    }

    function setupPersonalScrollMotion() {
        if (
            !personalSection ||
            !personalItems.length ||
            !gsapApi ||
            !scrollTriggerApi ||
            typeof gsapApi.set !== "function" ||
            typeof scrollTriggerApi.create !== "function"
        ) {
            return;
        }

        if (typeof gsapApi.registerPlugin === "function") {
            gsapApi.registerPlugin(scrollTriggerApi);
        }

        buildPersonalCloudConfigs();
        buildPersonalItemConfigs();

        if (personalScrollDriver && typeof personalScrollDriver.kill === "function") {
            personalScrollDriver.kill();
            personalScrollDriver = null;
        }

        personalScrollDriver = scrollTriggerApi.create({
            trigger: personalSection,
            start: personalScrollTriggerStart,
            end: function () {
                var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
                return "+=" + Math.round(viewportHeight * personalScrollTravelViewportHeights);
            },
            pin: true,
            anticipatePin: 1,
            scrub: personalScrollScrubSeconds,
            invalidateOnRefresh: true,
            onUpdate: function (self) {
                renderPersonalBackground(self.progress);
                renderPersonalClouds(self.progress);
                renderPersonalItems(self.progress);
            },
            onRefresh: function (self) {
                buildPersonalCloudConfigs();
                buildPersonalItemConfigs();
                renderPersonalBackground(self.progress);
                renderPersonalClouds(self.progress);
                renderPersonalItems(self.progress);
            }
        });

        renderPersonalBackground(personalScrollDriver.progress || 0);
        renderPersonalClouds(personalScrollDriver.progress || 0);
        renderPersonalItems(personalScrollDriver.progress || 0);
    }

    function teardownPersonalScrollMotion() {
        if (personalScrollDriver && typeof personalScrollDriver.kill === "function") {
            personalScrollDriver.kill();
        }

        personalScrollDriver = null;
    }

    function setupPersonalPointerMotion() {
        if (!personalSection || !personalItemConfigs.length || !canUsePointerReactiveMotion) {
            return;
        }

        personalSection.addEventListener("pointermove", function (event) {
            pointerClientX = event.clientX;
            pointerClientY = event.clientY;
            pointerIsActive = true;
            updatePointerReactiveTargets();
            queuePointerReactiveMotion();
        });

        personalSection.addEventListener("pointerleave", function () {
            pointerIsActive = false;
            updatePointerReactiveTargets();
            queuePointerReactiveMotion();
        });
    }

    function createBeanElements() {
        var fragment;

        if (!beanField || beanField.dataset.beansReady === "true") {
            return;
        }

        fragment = document.createDocumentFragment();

        beanLayerConfigs.forEach(function (layerConfig, layerIndex) {
            var layerBaseScale = 1 - (layerIndex * 0.08);
            var i;

            for (i = 0; i < layerConfig.count; i += 1) {
                var bean = document.createElement("img");
                var size = pickRandom(layerConfig.sizes);
                var baseRotation = pickRandom(beanRotations) + randomBetween(-8, 8);
                var driftX = randomBetween(-4.2, 4.2);
                var driftY = randomBetween(-3.7, 3.7);
                var rotationDrift = randomBetween(-14, 14);
                var pulseStrength = randomBetween(0.05, 0.13);

                bean.className = "cv-personal-bean " + layerConfig.className;
                bean.src = beanSource;
                bean.alt = "";
                bean.loading = "lazy";
                bean.decoding = "async";
                bean.style.setProperty("--bean-size", size + "vw");
                bean.style.left = randomBetween(6, 94).toFixed(2) + "%";
                bean.style.top = randomBetween(6, 94).toFixed(2) + "%";
                bean.style.transform = "translate(-50%, -50%) rotate(" + baseRotation.toFixed(2) + "deg)";
                bean.dataset.rotation = String(baseRotation);
                bean.dataset.rotationDrift = String(rotationDrift);
                bean.dataset.driftX = String(driftX);
                bean.dataset.driftY = String(driftY);
                bean.dataset.driftDuration = String(randomBetween(layerConfig.driftMin, layerConfig.driftMax));
                bean.dataset.pulseDuration = String(randomBetween(layerConfig.pulseMin, layerConfig.pulseMax));
                bean.dataset.scaleMin = String((layerBaseScale - pulseStrength).toFixed(3));
                bean.dataset.scaleMax = String((layerBaseScale + pulseStrength).toFixed(3));
                bean.dataset.delay = String(randomBetween(-8.4, 0));
                bean.dataset.pulseDelay = String(randomBetween(-6.2, 0));
                fragment.appendChild(bean);
            }
        });

        beanField.appendChild(fragment);
        beanField.dataset.beansReady = "true";
    }

    function animateBeans() {
        var beans;

        if (!beanField || !gsapApi || typeof gsapApi.to !== "function") {
            return;
        }

        beans = Array.prototype.slice.call(beanField.querySelectorAll(".cv-personal-bean"));
        beanTweens = [];

        beans.forEach(function (bean) {
            var baseRotation = Number(bean.dataset.rotation || 0);
            var driftX = Number(bean.dataset.driftX || 0);
            var driftY = Number(bean.dataset.driftY || 0);
            var rotationDrift = Number(bean.dataset.rotationDrift || 0);
            var driftDuration = Number(bean.dataset.driftDuration || 7);
            var pulseDuration = Number(bean.dataset.pulseDuration || 5);
            var scaleMin = Number(bean.dataset.scaleMin || 0.95);
            var scaleMax = Number(bean.dataset.scaleMax || 1.05);
            var delay = Number(bean.dataset.delay || 0);
            var pulseDelay = Number(bean.dataset.pulseDelay || 0);

            gsapApi.set(bean, {
                xPercent: -50,
                yPercent: -50,
                x: 0,
                y: 0,
                scale: scaleMin,
                rotation: baseRotation,
                transformOrigin: "50% 50%"
            });

            beanTweens.push(gsapApi.to(bean, {
                x: driftX * (window.innerWidth / 100),
                y: driftY * (window.innerHeight / 100),
                rotation: baseRotation + rotationDrift,
                duration: driftDuration,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
                delay: delay
            }));

            beanTweens.push(gsapApi.to(bean, {
                scale: scaleMax,
                duration: pulseDuration,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
                delay: pulseDelay
            }));
        });

        beanAnimationsActive = true;
    }

    function setBeanAnimationState(shouldRun) {
        if (!beanTweens.length || beanAnimationsActive === shouldRun) {
            return;
        }

        beanTweens.forEach(function (tween) {
            if (!tween || typeof tween.paused !== "function") {
                return;
            }
            tween.paused(!shouldRun);
        });

        beanAnimationsActive = shouldRun;
    }

    function updateBeanVisibility() {
        var viewportHeight;
        var cloudTop;
        var fadeStart;
        var fadeEnd;
        var progress;
        var maxOpacity;

        visibilityRafId = null;

        if (!beanField) {
            return;
        }

        if (!cloudWrap) {
            beanField.style.opacity = "0.56";
            return;
        }

        viewportHeight = window.innerHeight || 1;
        cloudTop = cloudWrap.getBoundingClientRect().top;
        fadeStart = viewportHeight * 1.02;
        fadeEnd = viewportHeight * 0.54;
        progress = clamp((fadeStart - cloudTop) / Math.max(1, fadeStart - fadeEnd), 0, 1);
        maxOpacity = 0.72;

        beanField.style.opacity = (progress * maxOpacity).toFixed(3);
    }

    function queueVisibilityUpdate() {
        if (visibilityRafId !== null) {
            return;
        }
        visibilityRafId = window.requestAnimationFrame(updateBeanVisibility);
    }

    cloudSources.forEach(function (src) {
        preloadImageSource(src, "cloud", "high");
    });
    preloadImageSource(beanSource, "personal-bean", "high");
    personalItems.forEach(function (item) {
        if (!item || !item.currentSrc && !item.src) {
            return;
        }

        preloadImageSource(item.currentSrc || item.src, "personal-item", "auto");
    });

    document.querySelectorAll(".cv-personal-prelude-cloud").forEach(function (cloud) {
        cloud.loading = "eager";
        cloud.decoding = "sync";
        cloud.fetchPriority = "high";
    });

    createBeanElements();
    animateBeans();
    updateBeanVisibility();
    
    function applyMobileLayout() {
        currentLayoutMode = "mobile";
        if (personalSection) {
            personalSection.classList.add("is-mobile-layout");
        }
        teardownPersonalScrollMotion();
        buildPersonalCloudConfigs();
        buildPersonalItemConfigs();
        renderPersonalBackground(mobileStaticProgress);
        renderPersonalClouds(mobileStaticProgress);
        renderPersonalItems(mobileStaticProgress);
    }

    function applyDesktopLayout() {
        currentLayoutMode = "desktop";
        if (personalSection) {
            personalSection.classList.remove("is-mobile-layout");
        }
        setupPersonalScrollMotion();
    }

    function applyResponsiveLayout(force) {
        var nextLayoutMode = mobileLayoutQuery && mobileLayoutQuery.matches ? "mobile" : "desktop";

        if (!force && nextLayoutMode === currentLayoutMode) {
            if (nextLayoutMode === "desktop" && scrollTriggerApi && typeof scrollTriggerApi.refresh === "function") {
                scrollTriggerApi.refresh();
            } else if (nextLayoutMode === "mobile") {
                applyMobileLayout();
            }
            return;
        }

        if (nextLayoutMode === "mobile") {
            applyMobileLayout();
            return;
        }

        applyDesktopLayout();
        if (scrollTriggerApi && typeof scrollTriggerApi.refresh === "function") {
            scrollTriggerApi.refresh();
        }
    }

    applyResponsiveLayout(true);
    setupPersonalPointerMotion();
    window.addEventListener("scroll", queueVisibilityUpdate, { passive: true });
    window.addEventListener("resize", queueVisibilityUpdate);
    window.addEventListener("load", function () {
        applyResponsiveLayout(false);

        if (pointerIsActive && canUsePointerReactiveMotion) {
            updatePointerReactiveTargets();
            queuePointerReactiveMotion();
        }
    });
    window.addEventListener("resize", function () {
        applyResponsiveLayout(false);

        if (pointerIsActive && canUsePointerReactiveMotion) {
            updatePointerReactiveTargets();
            queuePointerReactiveMotion();
        }
    });

    if ("IntersectionObserver" in window && beanField) {
        var observer = new IntersectionObserver(function (entries) {
            var entry = entries[0];
            setBeanAnimationState(!!entry && entry.isIntersecting);
        }, {
            threshold: 0.05
        });

        observer.observe(beanField);
    }
})();
