(async function () {
    var globeMount = document.getElementById("aboutPageGlobeMount");
    var threeModule;
    var globeFactory;
    var globeInstance;
    var controls;
    var renderer;
    var customMaterial;

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
        .backgroundColor("rgba(2, 2, 2, 0.93)")
        .showAtmosphere(true)
        .atmosphereColor("#48e7ff")
        .atmosphereAltitude(0.28)
        .showGraticules(true)
        .globeCurvatureResolution(58);

    customMaterial = new threeModule.MeshPhongMaterial({
        color: new threeModule.Color("#07131d"),
        emissive: new threeModule.Color("#0da8d6"),
        emissiveIntensity: 0.72,
        specular: new threeModule.Color("#b6fbff"),
        shininess: 82,
        transparent: true,
        opacity: 0.98
    });
    globeInstance.onGlobeReady(function () {
        globeInstance.globeMaterial(customMaterial);
    });

    syncGlobeSize();

    controls = typeof globeInstance.controls === "function" ? globeInstance.controls() : null;
    if (controls) {
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.rotateSpeed = 0.78;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.7;
    }

    renderer = typeof globeInstance.renderer === "function" ? globeInstance.renderer() : null;
    if (renderer && typeof renderer.setClearColor === "function") {
        renderer.setPixelRatio(window.devicePixelRatio);

    }

    globeInstance.pointOfView({
        lat: 25,
        lng: 18,
        altitude: 2.05
    }, 0);

    globeMount.addEventListener("pointerdown", function () {
        globeMount.classList.add("is-dragging");
    });

    window.addEventListener("pointerup", function () {
        globeMount.classList.remove("is-dragging");
    });

    globeMount.addEventListener("pointerleave", function () {
        globeMount.classList.remove("is-dragging");
    });

    window.addEventListener("resize", syncGlobeSize);
})();
