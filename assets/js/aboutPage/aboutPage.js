(async function () {
    var aboutSection = document.querySelector(".about-page-section");
    var globeMount = document.getElementById("aboutPageGlobeMount");
    var starfield = document.querySelector(".about-page-starfield");
    var panels = {
        intro: document.querySelector(".about-page-panel--intro"),
        first: document.querySelector(".about-page-panel--first"),
        second: document.querySelector(".about-page-panel--second"),
        third: document.querySelector(".about-page-panel--third"),
        final: document.querySelector(".about-page-panel--final")
    };
    var panelList = [
        panels.intro,
        panels.first,
        panels.second,
        panels.third,
        panels.final
    ].filter(Boolean);
    var globeFactory;
    var globeInstance;
    var controls;
    var renderer;
    var gsapApi = window.gsap;
    var scrollTriggerApi = window.ScrollTrigger;
    var sceneLights;
    var aboutTimeline = null;
    var currentLayoutMode = "";
    var compactLayoutQuery = window.matchMedia("(max-width: 900px)");
    var autoRotateResumeTimerId = null;
    var starCount = 110;
    var twinkleRatio = 0.26;
    var globeMarkers = [
        {
            lat: 48.2082,
            lng: 16.3738,
            altitude: 0.018,
            label: "Vienna"
        }
    ];
    var sceneState = {
        lat: 24,
        lng: 18,
        altitude: 2.05,
        atmosphereAltitude: 0.28,
        gradientAngle: 71,
        globeLeft: 74,
        globeTop: 50,
        globeSizeVmin: 56,
        ambient: 1.3,
        directional: 0.78
    };
    var desktopSceneState = Object.assign({}, sceneState);
    var compactSceneState = {
        lat: 20,
        lng: 30,
        altitude: 1.88,
        atmosphereAltitude: 0.14,
        gradientAngle: 118,
        globeLeft: 50,
        globeTop: 50,
        globeSizeVmin: 70,
        ambient: 1.18,
        directional: 0.56
    };

    function randomBetween(min, max) {
        return min + (Math.random() * (max - min));
    }

    function createGlobeMarkerElement(marker) {
        var pinEl;
        var headEl;
        var coreEl;
        var tailEl;

        if (marker.element) {
            return marker.element;
        }

        pinEl = document.createElement("div");
        pinEl.className = "about-page-vienna-pin";
        pinEl.setAttribute("aria-hidden", "true");
        if (marker.label) {
            pinEl.title = marker.label;
        }

        headEl = document.createElement("span");
        headEl.className = "about-page-vienna-pin__head";

        coreEl = document.createElement("span");
        coreEl.className = "about-page-vienna-pin__core";
        headEl.appendChild(coreEl);

        tailEl = document.createElement("span");
        tailEl.className = "about-page-vienna-pin__tail";

        pinEl.appendChild(headEl);
        pinEl.appendChild(tailEl);

        marker.element = pinEl;
        return pinEl;
    }

    function clearAutoRotateResume() {
        if (autoRotateResumeTimerId !== null) {
            window.clearTimeout(autoRotateResumeTimerId);
            autoRotateResumeTimerId = null;
        }
    }

    function setAutoRotate(isEnabled) {
        if (!controls) {
            return;
        }

        controls.autoRotate = isEnabled;
        controls.autoRotateSpeed = isEnabled ? 2.5 : 0;
    }

    function scheduleAutoRotateResume(delayMs) {
        clearAutoRotateResume();
        autoRotateResumeTimerId = window.setTimeout(function () {
            setAutoRotate(true);
            autoRotateResumeTimerId = null;
        }, delayMs);
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

    function renderScene() {
        if (aboutSection) {
            aboutSection.style.setProperty("--about-page-bg-angle", sceneState.gradientAngle.toFixed(2) + "deg");
        }

        if (globeMount) {
            globeMount.style.setProperty("--about-globe-left", sceneState.globeLeft.toFixed(2) + "vw");
            globeMount.style.setProperty("--about-globe-top", sceneState.globeTop.toFixed(2) + "vh");
            globeMount.style.setProperty("--about-globe-size-vmin", sceneState.globeSizeVmin.toFixed(2));
        }

        syncGlobeSize();

        if (Array.isArray(sceneLights)) {
            if (sceneLights[0]) {
                sceneLights[0].intensity = sceneState.ambient;
            }

            if (sceneLights[1]) {
                sceneLights[1].intensity = sceneState.directional;
                if (sceneLights[1].position && typeof sceneLights[1].position.set === "function") {
                    sceneLights[1].position.set(120, 80, 160);
                }
            }
        }

        if (globeInstance) {
            if (typeof globeInstance.atmosphereAltitude === "function") {
                globeInstance.atmosphereAltitude(sceneState.atmosphereAltitude);
            }
            globeInstance.pointOfView({
                lat: sceneState.lat,
                lng: sceneState.lng,
                altitude: sceneState.altitude
            }, 0);
        }
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

    function showStaticIntro() {
        if (!panels.intro) {
            return;
        }

        panels.intro.style.opacity = "1";
        panels.intro.style.transform = "translate3d(0, 0, 0)";
    }

    function showStaticPanels() {
        if (!panelList.length) {
            return;
        }

        if (gsapApi && typeof gsapApi.set === "function") {
            gsapApi.set(panelList, {
                clearProps: "opacity,visibility,transform,x,y"
            });
            gsapApi.set(panelList, {
                autoAlpha: 1,
                x: 0,
                y: 0
            });
            return;
        }

        panelList.forEach(function (panel) {
            panel.style.opacity = "1";
            panel.style.visibility = "visible";
            panel.style.transform = "none";
        });
    }

    function killScrollSequence() {
        if (!aboutTimeline) {
            return;
        }

        if (aboutTimeline.scrollTrigger) {
            aboutTimeline.scrollTrigger.kill();
        }

        aboutTimeline.kill();
        aboutTimeline = null;
    }

    function setupPanelStates() {
        if (!gsapApi || typeof gsapApi.set !== "function") {
            return;
        }

        gsapApi.set([panels.intro, panels.first, panels.second, panels.third, panels.final], {
            autoAlpha: 0
        });

        gsapApi.set([panels.intro, panels.first, panels.second, panels.final], {
            y: 120
        });

        gsapApi.set(panels.third, {
            y: 160
        });
    }

    function buildScrollSequence() {
        var panelTiming = {
            introInAt: 0,
            introOutAt: 0.96,
            firstInAt: 1.16,
            firstOutAt: 2.18,
            secondInAt: 2.32,
            secondOutAt: 3.5,
            thirdInAt: 4.10,
            thirdOutAt: 5.20,
            finalInAt: 5.90
        };

        if (
            !aboutSection ||
            !gsapApi ||
            !scrollTriggerApi ||
            typeof gsapApi.timeline !== "function"
        ) {
            showStaticIntro();
            return;
        }

        if (typeof gsapApi.registerPlugin === "function") {
            gsapApi.registerPlugin(scrollTriggerApi);
        }

        setupPanelStates();

        aboutTimeline = gsapApi.timeline({
            defaults: {
                ease: "none"
            },
            scrollTrigger: {
                trigger: aboutSection,
                start: "top top",
                end: function () {
                    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
                    return "+=" + Math.round(viewportHeight * 4.6);
                },
                scrub: 1.15,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onRefresh: syncGlobeSize
            }
        });

        aboutTimeline.eventCallback("onUpdate", renderScene);

        aboutTimeline
            .fromTo(panels.intro, {
                autoAlpha: 1,
                y: 48
            }, {
                autoAlpha: 1,
                y: 0,
                duration: 0.42
            }, panelTiming.introInAt)
            .to(panels.intro, {
                autoAlpha: 0,
                y: -440,
                duration: 0.54
            }, panelTiming.introOutAt)
            .fromTo(panels.first, {
                autoAlpha: 0,
                y: 140
            }, {
                autoAlpha: 1,
                y: 0,
                duration: 0.66
            }, panelTiming.firstInAt)
            .to(panels.first, {
                autoAlpha: 0,
                y: -150,
                duration: 0.92
            }, panelTiming.firstOutAt)
            .fromTo(panels.second, {
                autoAlpha: 0,
                y: 150
            }, {
                autoAlpha: 1,
                y: 0,
                duration: 0.76
            }, panelTiming.secondInAt)
            .to(panels.second, {
                autoAlpha: 0,
                y: -160,
                duration: 0.54
            }, panelTiming.secondOutAt)
            .fromTo(panels.third, {
                autoAlpha: 0,
                y: 160
            }, {
                autoAlpha: 1,
                y: 0,
                duration: 0.78
            }, panelTiming.thirdInAt)
            .to(panels.third, {
                autoAlpha: 0,
                y: -170,
                duration: 0.52
            }, panelTiming.thirdOutAt)
            .fromTo(panels.final, {
                autoAlpha: 0,
                y: 140
            }, {
                autoAlpha: 1,
                y: 0,
                duration: 0.72
            }, panelTiming.finalInAt)
            .to(sceneState, {
                lng: 145,
                gradientAngle: 118,
                ambient: 1.18,
                directional: 0.88,
                duration: 1.15,
                onUpdate: renderScene
            }, 0)
            .to(sceneState, {
                lng: 455,
                globeLeft: 27,
                globeTop: 47,
                globeSizeVmin: 60,
                lat: 20,
                gradientAngle: 170,
                ambient: 1.32,
                directional: 0.62,
                duration: 1.45,
                onUpdate: renderScene
            }, 1.2)
            .to(sceneState, {
                lng: 620,
                globeLeft: 50,
                globeTop: 104,
                globeSizeVmin: 112,
                lat: 12,
                gradientAngle: 230,
                ambient: 1.5,
                directional: 0.36,
                duration: 1.45,
                onUpdate: renderScene
            }, 2.65)
            .to(sceneState, {
                lng: 705,
                globeTop: 128,
                globeSizeVmin: 124,
                lat: 18,
                gradientAngle: 278,
                ambient: 0.92,
                directional: 0.18,
                duration: 1.08,
                onUpdate: renderScene
            }, 4.02);

        renderScene();
        return aboutTimeline;
    }

    function applyResponsiveLayout(forceRebuild) {
        var nextLayoutMode = compactLayoutQuery.matches ? "compact" : "desktop";

        if (!forceRebuild && nextLayoutMode === currentLayoutMode) {
            if (nextLayoutMode === "compact") {
                showStaticPanels();
            } else if (
                scrollTriggerApi &&
                typeof scrollTriggerApi.refresh === "function"
            ) {
                scrollTriggerApi.refresh();
            }
            renderScene();
            return;
        }

        killScrollSequence();
        currentLayoutMode = nextLayoutMode;

        if (aboutSection) {
            aboutSection.classList.toggle(
                "is-compact-layout",
                nextLayoutMode === "compact"
            );
        }

        if (nextLayoutMode === "compact") {
            Object.assign(sceneState, compactSceneState);
            showStaticPanels();
            renderScene();
            if (
                scrollTriggerApi &&
                typeof scrollTriggerApi.refresh === "function"
            ) {
                scrollTriggerApi.refresh();
            }
            return;
        }

        Object.assign(sceneState, desktopSceneState);
        aboutTimeline = buildScrollSequence();
        if (
            scrollTriggerApi &&
            typeof scrollTriggerApi.refresh === "function"
        ) {
            scrollTriggerApi.refresh();
        }
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
        .showGraticules(true)
        .htmlElementsData(globeMarkers)
        .htmlLat("lat")
        .htmlLng("lng")
        .htmlAltitude("altitude")
        .htmlTransitionDuration(0)
        .htmlElement(createGlobeMarkerElement);

    sceneLights = typeof globeInstance.lights === "function" ? globeInstance.lights() : null;
    renderScene();

    globeInstance.onGlobeReady(function () {
        var currentMaterial = globeInstance.globeMaterial();

        currentMaterial.bumpScale = 0.55;
        if (currentMaterial.color && typeof currentMaterial.color.set === "function") {
            currentMaterial.color.set("#ffffff");
        }
        if (currentMaterial.emissive && typeof currentMaterial.emissive.set === "function") {
            currentMaterial.emissive.set("#08141c");
            currentMaterial.emissiveIntensity = 0.0;
        }
        if (currentMaterial.specular && typeof currentMaterial.specular.set === "function") {
            currentMaterial.specular.set("#5d6f80");
        }
        if (typeof currentMaterial.shininess !== "undefined") {
            currentMaterial.shininess = 14;
        }
        currentMaterial.needsUpdate = true;
        renderScene();
    });

    syncGlobeSize();

    controls = typeof globeInstance.controls === "function" ? globeInstance.controls() : null;
    if (controls) {
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.rotateSpeed = 1;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2.5;

        if (typeof controls.zoomSpeed !== "undefined") {
            controls.zoomSpeed = 0;
        }
    }

    renderer = typeof globeInstance.renderer === "function" ? globeInstance.renderer() : null;
    if (renderer && typeof renderer.setPixelRatio === "function") {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }

    applyResponsiveLayout(true);

    globeMount.addEventListener("pointerdown", function () {
        clearAutoRotateResume();
        setAutoRotate(false);
        globeMount.classList.add("is-dragging");
    });

    window.addEventListener("pointerup", function () {
        globeMount.classList.remove("is-dragging");
        scheduleAutoRotateResume(1100);
    });

    globeMount.addEventListener("pointerleave", function () {
        globeMount.classList.remove("is-dragging");
    });

    window.addEventListener("resize", function () {
        syncGlobeSize();
        applyResponsiveLayout(false);
    });
})();
