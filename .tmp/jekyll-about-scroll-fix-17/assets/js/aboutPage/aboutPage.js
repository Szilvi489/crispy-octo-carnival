(async function () {
    var globeMount = document.getElementById("aboutPageGlobeMount");
    var threeModule;
    var globeFactory;
    var globeInstance;
    var controls;
    var renderer;
    var globeLights;
    var cloudsMesh = null;
    var cloudsAnimationFrameId = null;
    var motionAnimationFrameId = null;
    var cloudsRotationStep = -0.006;
    var cloudsAltitude = 0.004;
    var cloudsImageUrl = "https://cdn.jsdelivr.net/npm/three-globe@2.45.1/example/clouds/clouds.png";
    var aboutMotionCurrent = 0;
    var aboutMotionTarget = 0;
    var globeBaseLat = 25;
    var globeBaseLng = 18;
    var globeBaseAltitude = 2.05;
    var globeLngPerMotionUnit = 120;
    var wheelToMotionFactor = 0.01;

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

    function stepAboutMotion() {
        motionAnimationFrameId = window.requestAnimationFrame(stepAboutMotion);
        aboutMotionCurrent += (aboutMotionTarget - aboutMotionCurrent) * 0.12;

        if (!globeInstance) {
            return;
        }

        renderAboutMotion();
    }

    function queueAboutMotionLoop() {
        if (motionAnimationFrameId !== null) {
            return;
        }

        motionAnimationFrameId = window.requestAnimationFrame(stepAboutMotion);
    }

    if (!globeMount) {
        return;
    }

    try {
        threeModule = await import("https://esm.sh/three@0.150.1");
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
        .atmosphereColor("#48e7ff")
        .atmosphereAltitude(0.28)
        .showGraticules(true);

    globeLights = [
        new threeModule.AmbientLight(0xffffff, 0),
        new threeModule.DirectionalLight(0xffffff, 9.7),
        new threeModule.DirectionalLight(0x66d9ff, 9.1)
    ];
    globeLights[1].position.set(140, 90, 180);
    globeLights[2].position.set(-120, -40, 130);
    globeInstance.lights(globeLights);

    globeInstance.onGlobeReady(function () {
        var currentMaterial = globeInstance.globeMaterial();
        var textureLoader = new threeModule.TextureLoader();
        var globeRadius = typeof globeInstance.getGlobeRadius === "function" ? globeInstance.getGlobeRadius() : 100;

        currentMaterial.bumpScale = 1;
        currentMaterial.color = new threeModule.Color("#ffffff");
        currentMaterial.emissive = new threeModule.Color("#0a3450");
        currentMaterial.emissiveIntensity = 0.0;
        currentMaterial.specular = new threeModule.Color("#b6fbff");
        currentMaterial.shininess = 100;
        currentMaterial.needsUpdate = true;

        if (!cloudsMesh) {
            textureLoader.load(cloudsImageUrl, function (cloudsTexture) {
                cloudsMesh = new threeModule.Mesh(
                    new threeModule.SphereGeometry(globeRadius * (1 + cloudsAltitude), 75, 75),
                    new threeModule.MeshPhongMaterial({
                        map: cloudsTexture,
                        transparent: true
                    })
                );

                globeInstance.scene().add(cloudsMesh);

                if (cloudsAnimationFrameId === null) {
                    var rotateClouds = function () {
                        cloudsAnimationFrameId = window.requestAnimationFrame(rotateClouds);

                        if (!cloudsMesh) {
                            return;
                        }

                        cloudsMesh.rotation.y += cloudsRotationStep * Math.PI / 180;
                    };

                    rotateClouds();
                }
            }, undefined, function (error) {
                console.error("About page clouds texture failed to load:", error);
            });
        }
    });

    syncGlobeSize();

    controls = typeof globeInstance.controls === "function" ? globeInstance.controls() : null;
    if (controls) {
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.rotateSpeed = 15;
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
