(function () {
    var section = document.getElementById("cv-dreamjob");
    var beanField = section ? section.querySelector(".cv-dreamjob-bean-field") : null;
    var gsapApi = window.gsap;
    var head = document.head || document.getElementsByTagName("head")[0];
    var beanSource = "/CV/assets/images/CV/removedBackgroundImages/magicbeanPink.png";
    var beanTweens = [];
    var textColorTweens = [];
    var beanAnimationsActive = false;
    var textAnimationsActive = false;
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
        beanTweens = [];

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

    function splitTextChars(node) {
        var originalText;
        var fragment;

        if (!node || node.dataset.splitReady === "true") {
            return;
        }

        originalText = node.textContent || "";
        node.textContent = "";
        node.classList.add("cv-dreamjob-text-split");
        fragment = document.createDocumentFragment();

        originalText.split("").forEach(function (character) {
            var span = document.createElement("span");
            span.className = "cv-dreamjob-char";

            if (character === " ") {
                span.className += " cv-dreamjob-char-space";
                span.textContent = "\u00A0";
            } else {
                span.textContent = character;
            }

            fragment.appendChild(span);
        });

        node.appendChild(fragment);
        node.dataset.splitReady = "true";
    }

    function distributeByPosition(vars) {
        var ease = vars.ease && gsapApi.parseEase(vars.ease);
        var from = vars.from || 0;
        var base = vars.base || 0;
        var axis = vars.axis;
        var ratio = { center: 0.5, end: 1, edges: 0.5 }[from] || 0;
        var distances;

        return function (i, target, list) {
            var length = list.length;
            var originX;
            var originY;
            var x;
            var y;
            var d;
            var j;
            var minX;
            var maxX;
            var minY;
            var maxY;
            var positions;

            if (!distances) {
                distances = [];
                minX = minY = Infinity;
                maxX = maxY = -minX;
                positions = [];

                for (j = 0; j < length; j += 1) {
                    d = list[j].getBoundingClientRect();
                    x = (d.left + d.right) / 2;
                    y = (d.top + d.bottom) / 2;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    positions[j] = { x: x, y: y };
                }

                originX = isNaN(from) ? minX + ((maxX - minX) * ratio) : (positions[from].x || 0);
                originY = isNaN(from) ? minY + ((maxY - minY) * ratio) : (positions[from].y || 0);
                maxX = 0;
                minX = Infinity;

                for (j = 0; j < length; j += 1) {
                    x = positions[j].x - originX;
                    y = originY - positions[j].y;
                    distances[j] = d = !axis
                        ? Math.sqrt((x * x) + (y * y))
                        : Math.abs(axis === "y" ? y : x);

                    if (d > maxX) maxX = d;
                    if (d < minX) minX = d;
                }

                distances.max = Math.max(0.00001, maxX - minX);
                distances.min = minX;
                distances.v = length =
                    (vars.amount || (vars.each * length) || 0) * (from === "edges" ? -1 : 1);
                distances.b = length < 0 ? base - length : base;
            }

            length = (distances[i] - distances.min) / distances.max;
            return distances.b + (ease ? ease(length) : length) * distances.v;
        };
    }

    function animateTextChars() {
        var textNodes;

        if (!gsapApi || typeof gsapApi.to !== "function") {
            return;
        }

        textNodes = Array.prototype.slice.call(
            section.querySelectorAll(".cv-dreamjob-content h2, .cv-dreamjob-content p")
        );
        textColorTweens = [];

        textNodes.forEach(function (node) {
            var chars;
            var colorTween;

            splitTextChars(node);
            chars = Array.prototype.slice.call(node.querySelectorAll(".cv-dreamjob-char"));

            if (!chars.length) {
                return;
            }

            gsapApi.set(chars, { color: "rgba(10, 110, 55, 0.69)" });

            colorTween = gsapApi.to(chars, {
                color: "rgba(195, 27, 27, 0.73)",
                duration: 1.75,
                ease: "sine.inOut",
                stagger: distributeByPosition({
                    amount: 1.5,
                    from: "center"
                }),
                repeat: -1,
                yoyo: true,
                repeatDelay: 0.12
            });

            textColorTweens.push(colorTween);
        });

        textAnimationsActive = true;
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

    function setTextAnimationState(shouldRun) {
        if (!textColorTweens.length || textAnimationsActive === shouldRun) {
            return;
        }

        textColorTweens.forEach(function (tween) {
            if (!tween || typeof tween.paused !== "function") {
                return;
            }
            tween.paused(!shouldRun);
        });

        textAnimationsActive = shouldRun;
    }

    preloadBeanSource();
    createBeanElements();
    animateBeans();
    animateTextChars();

    if ("IntersectionObserver" in window && beanField) {
        var observer = new IntersectionObserver(function (entries) {
            var entry = entries[0];
            setBeanAnimationState(!!entry && entry.isIntersecting);
            setTextAnimationState(!!entry && entry.isIntersecting);
        }, {
            threshold: 0.05
        });

        observer.observe(beanField);
    }
})();
