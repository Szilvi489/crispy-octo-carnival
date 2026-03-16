(function () {
    var cloudSources = [
        "/assets/images/CV/removedBackgroundImages/white-cloud-small.png",
        "/assets/images/CV/removedBackgroundImages/white-cloud2-small.png",
        "/assets/images/CV/removedBackgroundImages/white-cloud3-small.png",
        "/assets/images/CV/removedBackgroundImages/white-cloud4-small.png"
    ];
    var beanSource = "/assets/images/CV/removedBackgroundImages/magicbeanPink.png";
    var beanField = document.querySelector(".cv-personal-bean-field");
    var cloudWrap = document.querySelector(".cv-personal-transition-clouds");
    var gsapApi = window.gsap;
    var head = document.head || document.getElementsByTagName("head")[0];
    var visibilityRafId = null;
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

            gsapApi.to(bean, {
                x: driftX * (window.innerWidth / 100),
                y: driftY * (window.innerHeight / 100),
                rotation: baseRotation + rotationDrift,
                duration: driftDuration,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
                delay: delay
            });

            gsapApi.to(bean, {
                scale: scaleMax,
                duration: pulseDuration,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
                delay: pulseDelay
            });
        });
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

    document.querySelectorAll(".cv-personal-prelude-cloud").forEach(function (cloud) {
        cloud.loading = "eager";
        cloud.decoding = "sync";
        cloud.fetchPriority = "high";
    });

    createBeanElements();
    animateBeans();
    updateBeanVisibility();
    window.addEventListener("scroll", queueVisibilityUpdate, { passive: true });
    window.addEventListener("resize", queueVisibilityUpdate);
})();
