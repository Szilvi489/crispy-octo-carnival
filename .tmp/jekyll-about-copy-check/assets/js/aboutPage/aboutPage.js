(async function () {
    var aboutSection = document.querySelector(".about-page-section");
    var globeMount = document.getElementById("aboutPageGlobeMount");
    var starfield = document.querySelector(".about-page-starfield");
    var globeFactory;
    var globeInstance;
    var controls;
    var renderer;
    var gsapApi = window.gsap;
    var sceneLights;
    var motionAnimationFrameId = null;
    var aboutMotionCurrent = 0;
    var aboutMotionTarget = 0;
    var globeBaseLat = 25;
    var globeBaseLng = 18;
    var globeBaseAltitude = 2.05;
    var globeLngPerMotionUnit = 120;
    var wheelToMotionFactor = 0.01;
    var aboutGradientStartAngle = 71;
    var aboutGradientEndAngle = 278;
    var aboutGradientMotionRange = 1.8;
    var starCount = 110;
    var twinkleRatio = 0.26;

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function lerp(start, end, progress) {
        return start + ((end - start) * progress);
    }

    function syncGlobeSize() {
        var rect;
        var width;
        var height;

        if (!globeInstance || !globeMount) {
            return;
        }

        rect = globeMount.getBoundingClientRect();
        width = Math.max(1, Math.round(rect.width));
        height = Math.max(1, Math.round(rect.height));

        globeInstance.width(width);
        globeInstance.height(height);
    }

    function renderAboutMotion() {
        globeInstance.pointOfView({
            lat: globeBaseLat,
            lng: globeBaseLng + (aboutMotionCurrent * globeLngPerMotionUnit),
            altitude: globeBaseAltitude
        }, 0);
    }

    function renderAboutGradient() {
        var gradientProgress;
        var gradientAngle;

        if (!aboutSection) {
            return;
        }

        gradientProgress = clamp(aboutMotionCurrent / aboutGradientMotionRange, 0, 1);
        gradientAngle = lerp(aboutGradientStartAngle, aboutGradientEndAngle, gradientProgress);
        aboutSection.style.setProperty("--about-page-bg-angle", gradientAngle.toFixed(2) + "deg");
    }

    function stepAboutMotion() {
        motionAnimationFrameId = window.requestAnimationFrame(stepAboutMotion);
        aboutMotionCurrent += (aboutMotionTarget - aboutMotionCurrent) * 0.12;

        renderAboutGradient();

        if (globeInstance) {
            renderAboutMotion();
        }
    }

    function queueAboutMotionLoop() {
        if (motionAnimationFrameId !== null) {
            return;
        }

        motionAnimationFrameId = window.requestAnimationFrame(stepAboutMotion);
    }

    function randomBetween(min, max) {
        return min + (Math.random() * (max - min));
    }

    function createStarfield() {
        var fragment;
        var index;

        if (!starfield || starfield.dataset.ready === "true") {
            return;
        }

        fragment = document.createDocumentFragment();

        for (index = 0; index < starCount; index += 1) {
            var star = document.createElement("span");
            var baseOpacity = randomBetween(0.22, 0.9);
            var halo = randomBetween(2.4, 7.4);
            var size = randomBetween(1.2, 3.8);

            star.className = "about-page-star";
            star.style.setProperty("--star-x", randomBetween(4, 96).toFixed(2));
            star.style.setProperty("--star-y", randomBetween(4, 96).toFixed(2));
            star.style.setProperty("--star-size", size.toFixed(2));
            star.style.setProperty("--star-halo", halo.toFixed(2));
            star.style.setProperty("--star-opacity", baseOpacity.toFixed(3));
            fragment.appendChild(star);

            if (gsapApi && typeof gsapApi.to === "function" && Math.random() < twinkleRatio) {
                gsapApi.to(star, {
                    opacity: randomBetween(0.12, 0.96),
                    scale: randomBetween(0.82, 1.38),
                    filter: "brightness(" + randomBetween(0.86, 1.28).toFixed(2) + ")",
                    duration: randomBetween(280, 620),
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: randomBetween(-260, 0)
                });
            }
        }

        starfield.appendChild(fragment);
        starfield.dataset.ready = "true";
    }

    if (!globeMount) {
        return;
    }

    createStarfield();

    try {
        globeFactory = (await import("https://esm.sh/globe.gl@2.39.2?bundle")).default;
    } catch (error) {
        console.error("About page Globe.gl import failed:", error);
        return;
    }

    globeInstance = globeFactory()(globeMount)
        .backgroundColor("rgba(0, 0, 0, 0)")
        .showAtmosphere(true)
        .globeImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png")
        .atmosphereColor("#ffffff")
        .atmosphereAltitude(0.28)
        .showGraticules(true);

    sceneLights = typeof globeInstance.lights === "function" ? globeInstance.lights() : null;
    if (Array.isArray(sceneLights)) {
        if (sceneLights[0]) {
            sceneLights[0].intensity = 4;
        }

        if (sceneLights[1]) {
            sceneLights[1].intensity = 0.15;
            if (sceneLights[1].position && typeof sceneLights[1].position.set === "function") {
                sceneLights[1].position.set(120, 80, 160);
            }
        }
    }

    globeInstance.onGlobeReady(function () {
        var currentMaterial = globeInstance.globeMaterial();

        currentMaterial.bumpScale = 1;
        if (currentMaterial.color && typeof currentMaterial.color.set === "function") {
            currentMaterial.color.set("#ffffff");
        }
        if (currentMaterial.emissive && typeof currentMaterial.emissive.set === "function") {
            currentMaterial.emissive.set("#0a3450");
            currentMaterial.emissiveIntensity = 0.0;
        }
        if (currentMaterial.specular && typeof currentMaterial.specular.set === "function") {
            currentMaterial.specular.set("#b6fbff86");
        }
        if (typeof currentMaterial.shininess !== "undefined") {
            currentMaterial.shininess = 29;
        }
        currentMaterial.needsUpdate = true;
    });

    syncGlobeSize();

    controls = typeof globeInstance.controls === "function" ? globeInstance.controls() : null;
    if (controls) {
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.rotateSpeed = 1;
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0;

        if (typeof controls.enableZoom !== "undefined") {
            controls.enableZoom = false;
        }

        if (typeof controls.zoomSpeed !== "undefined") {
            controls.zoomSpeed = 0;
        }
    }

    renderer = typeof globeInstance.renderer === "function" ? globeInstance.renderer() : null;
    if (renderer && typeof renderer.setClearColor === "function") {
        renderer.setPixelRatio(window.devicePixelRatio);

    }

    renderAboutMotion();
    renderAboutGradient();
    queueAboutMotionLoop();

    globeMount.addEventListener("pointerdown", function () {
        globeMount.classList.add("is-dragging");
    });

    window.addEventListener("pointerup", function () {
        globeMount.classList.remove("is-dragging");
    });

    globeMount.addEventListener("pointerleave", function () {
        globeMount.classList.remove("is-dragging");
    });

    globeMount.addEventListener("wheel", function (event) {
        event.preventDefault();
        aboutMotionTarget += event.deltaY * wheelToMotionFactor;
        queueAboutMotionLoop();
    }, { passive: false });

    window.addEventListener("resize", syncGlobeSize);
})();
