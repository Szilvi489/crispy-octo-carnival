(function () {
    var section = document.getElementById("cv-dreamjob");
    var beanField = section ? section.querySelector(".cv-dreamjob-bean-field") : null;
    var gsapApi = window.gsap;
    var head = document.head || document.getElementsByTagName("head")[0];
    var beanSource = "/assets/images/CV/removedBackgroundImages/magicbeanPink.png";
    var beanLayerConfigs = [
        { className: "cv-dreamjob-bean--layer-1", sizes: [15, 13, 12], count: 7, driftMin: 4.2, driftMax: 6.8, pulseMin: 3.2, pulseMax: 5.2 },
        { className: "cv-dreamjob-bean--layer-2", sizes: [11, 9, 8], count: 8, driftMin: 4.8, driftMax: 7.3, pulseMin: 3.5, pulseMax: 5.8 },
        { className: "cv-dreamjob-bean--layer-3", sizes: [7.4, 6.5, 5.8], count: 9, driftMin: 5.2, driftMax: 7.8, pulseMin: 3.8, pulseMax: 6.2 },
        { className: "cv-dreamjob-bean--layer-4", sizes: [5.3, 4.5, 3.8], count: 10, driftMin: 5.8, driftMax: 8.4, pulseMin: 4.1, pulseMax: 6.8 },
        { className: "cv-dreamjob-bean--layer-5", sizes: [3.6, 3.1, 2.6], count: 10, driftMin: 6.2, driftMax: 8.9, pulseMin: 4.5, pulseMax: 7.1 }
    ];
    var beanRotations = [-52, -26, -8, 18, 38];

    if (!section || !beanField) {
        return;
    }

    function randomBetween(min, max) {
        return min + (Math.random() * (max - min));
    }

    function pickRandom(values) {
        return values[Math.floor(Math.random() * values.length)];
    }

    function preloadBeanSource() {
        var link;
        var preloadImage = new Image();
        var key = "dreamjob-bean:" + beanSource;

        if (head && !head.querySelector('link[data-cv-preload="' + key + '"]')) {
            link = document.createElement("link");
            link.rel = "preload";
            link.as = "image";
            link.href = beanSource;
            link.fetchPriority = "high";
            link.setAttribute("data-cv-preload", key);
            head.appendChild(link);
        }

        preloadImage.decoding = "async";
        preloadImage.fetchPriority = "high";
        preloadImage.src = beanSource;
    }

    function createBeanElements() {
        var fragment;

        if (beanField.dataset.beansReady === "true") {
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
                var driftX = randomBetween(-6.2, 6.2);
                var driftY = randomBetween(-5.3, 5.3);
                var rotationDrift = randomBetween(-18, 18);
                var pulseStrength = randomBetween(0.06, 0.16);

                bean.className = "cv-dreamjob-bean " + layerConfig.className;
                bean.src = beanSource;
                bean.alt = "";
                bean.loading = "lazy";
                bean.decoding = "async";
                bean.style.setProperty("--dream-bean-size", size + "vw");
                bean.style.left = randomBetween(4, 96).toFixed(2) + "%";
                bean.style.top = randomBetween(8, 94).toFixed(2) + "%";
                bean.style.transform = "translate(-50%, -50%) rotate(" + baseRotation.toFixed(2) + "deg)";
                bean.dataset.rotation = String(baseRotation);
                bean.dataset.rotationDrift = String(rotationDrift);
                bean.dataset.driftX = String(driftX);
                bean.dataset.driftY = String(driftY);
                bean.dataset.driftDuration = String(randomBetween(layerConfig.driftMin, layerConfig.driftMax));
                bean.dataset.pulseDuration = String(randomBetween(layerConfig.pulseMin, layerConfig.pulseMax));
                bean.dataset.scaleMin = String((layerBaseScale - pulseStrength).toFixed(3));
                bean.dataset.scaleMax = String((layerBaseScale + pulseStrength).toFixed(3));
                bean.dataset.delay = String(randomBetween(-8.8, 0));
                bean.dataset.pulseDelay = String(randomBetween(-6.8, 0));
                fragment.appendChild(bean);
            }
        });

        beanField.appendChild(fragment);
        beanField.dataset.beansReady = "true";
    }

    function animateBeans() {
        var beans;

        if (!gsapApi || typeof gsapApi.to !== "function") {
            return;
        }

        beans = Array.prototype.slice.call(beanField.querySelectorAll(".cv-dreamjob-bean"));

        beans.forEach(function (bean) {
            var baseRotation = Number(bean.dataset.rotation || 0);
            var driftX = Number(bean.dataset.driftX || 0);
            var driftY = Number(bean.dataset.driftY || 0);
            var rotationDrift = Number(bean.dataset.rotationDrift || 0);
            var driftDuration = Number(bean.dataset.driftDuration || 12);
            var pulseDuration = Number(bean.dataset.pulseDuration || 9);
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

    preloadBeanSource();
    createBeanElements();
    animateBeans();
})();
