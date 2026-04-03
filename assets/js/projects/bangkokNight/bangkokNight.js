/* global ResizeObserver */

(async () => {
    const dataEl = document.getElementById("bn-gallery-data");
    const section = document.querySelector(".bangkok-night-section");
    const stage = document.querySelector(".bangkok-night-content");
    const track = document.querySelector(".bangkok-night-track");
    const overlay = document.querySelector(".bangkok-night-overlay");
    const overlayContent = overlay
        ? overlay.querySelector(".bangkok-night-overlay__content")
        : null;
    const overlayCloseButtons = overlay
        ? overlay.querySelectorAll("[data-close-overlay]")
        : [];

    if (!dataEl || !section || !stage || !track) {
        return;
    }

    let data;
    try {
        data = JSON.parse(dataEl.textContent || "{}");
    } catch (error) {
        return;
    }

    const stageConfig =
        data.stage && typeof data.stage === "object" ? data.stage : {};
    const items = Array.isArray(data.items) ? data.items : [];
    const motions = Array.isArray(data.motions) ? data.motions : [];

    if (!items.length) {
        return;
    }

    const gsapApi = window.gsap;
    const scrollTriggerApi = window.ScrollTrigger;
    if (!gsapApi || typeof gsapApi.timeline !== "function" || !scrollTriggerApi) {
        return;
    }

    if (typeof gsapApi.registerPlugin === "function") {
        gsapApi.registerPlugin(scrollTriggerApi);
    }

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const normalizeLayer = (value) =>
        clamp(Number.parseInt(value, 10) || 1, 1, 4);
    const toFiniteNumber = (value) => {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
    };
    const timelineLength = Math.max(
        1,
        Number.parseFloat(stageConfig.timeline_length) || 1
    );
    const timelineSpan = timelineLength * 100;
    const backgroundShiftEntries = Array.isArray(stageConfig.background_shifts)
        ? stageConfig.background_shifts
        : [];
    const toTimelinePosition = (value, fallback = 0) => {
        const parsed = toFiniteNumber(value);
        return clamp(parsed === null ? fallback : parsed, 0, timelineLength) * 100;
    };
    const toRadians = (value) => {
        const parsed = toFiniteNumber(value);
        return parsed === null ? value : (parsed * Math.PI) / 180;
    };
    const normalizeMotionTarget = (runtime, value) => {
        if (runtime.item.type === "model") {
            return value === "model" ? "model" : "modelItem";
        }

        return "item";
    };
    const ORIGIN_MAP = {
        center: "50% 50%",
        middle: "50% 50%",
        left: "0% 50%",
        right: "100% 50%",
        top: "50% 0%",
        bottom: "50% 100%",
        "top-left": "0% 0%",
        "top-right": "100% 0%",
        "bottom-left": "0% 100%",
        "bottom-right": "100% 100%"
    };
    const resolveTransformOrigin = (value) => {
        if (typeof value !== "string" || !value.trim()) {
            return null;
        }

        const normalized = value.trim().toLowerCase();
        return ORIGIN_MAP[normalized] || value.trim();
    };
    const parseIdleMotion = (source) => {
        if (!source || typeof source !== "object") {
            return null;
        }

        return {
            startAt: toFiniteNumber(source.start_at) ?? 0,
            x: toFiniteNumber(source.x) ?? 0,
            y: toFiniteNumber(source.y) ?? 0,
            z: toFiniteNumber(source.z) ?? 0,
            rotationX: toFiniteNumber(source.rotationX) ?? 0,
            rotationY: toFiniteNumber(source.rotationY) ?? 0,
            rotationZ: toFiniteNumber(source.rotationZ) ?? 0,
            scale: toFiniteNumber(source.scale) ?? 0,
            speed: Math.max(0.05, toFiniteNumber(source.speed) ?? 0.7),
            phase: toFiniteNumber(source.phase) ?? 0
        };
    };

    const scrollLength = Math.max(
        2600,
        Number.parseFloat(stageConfig.scroll_length) || 5200
    );
    const designWidth = Math.max(
        320,
        Number.parseFloat(stageConfig.design_width) || 1680
    );
    const designHeight = Math.max(
        320,
        Number.parseFloat(stageConfig.design_height) || 900
    );
    const perspective = Math.max(
        800,
        Number.parseFloat(stageConfig.perspective) || 2200
    );
    const sceneMetrics = {
        width: designWidth,
        height: designHeight,
        scale: 1,
        offsetX: 0,
        offsetY: 0
    };
    const applySceneScale = () => {
        const stageWidth = Math.max(1, stage.clientWidth || window.innerWidth || 1);
        const stageHeight = Math.max(
            1,
            stage.clientHeight || window.innerHeight || 1
        );
        const scale = Math.min(
            1,
            stageWidth / designWidth,
            stageHeight / designHeight
        );

        sceneMetrics.scale = Number.isFinite(scale) && scale > 0 ? scale : 1;
        sceneMetrics.offsetX = Math.max(
            0,
            (stageWidth - designWidth * sceneMetrics.scale) / 2
        );
        sceneMetrics.offsetY = Math.max(
            0,
            (stageHeight - designHeight * sceneMetrics.scale) / 2
        );

        track.style.width = `${designWidth}px`;
        track.style.height = `${designHeight}px`;
        track.style.transform = `translate3d(${sceneMetrics.offsetX}px, ${sceneMetrics.offsetY}px, 0) scale(${sceneMetrics.scale})`;
    };

    section.style.minHeight = `${scrollLength}px`;
    stage.style.setProperty("--bangkok-night-perspective", `${perspective}px`);
    applySceneScale();

    if (
        typeof stageConfig.perspective_origin === "string" &&
        stageConfig.perspective_origin.trim()
    ) {
        stage.style.setProperty(
            "--bangkok-night-perspective-origin",
            stageConfig.perspective_origin.trim()
        );
    }

    const backgroundShifts = backgroundShiftEntries
        .map((entry) => {
            if (!entry || typeof entry !== "object") {
                return null;
            }

            const backgroundValue =
                typeof entry.background === "string" && entry.background.trim()
                    ? entry.background.trim()
                    : typeof entry.color === "string" && entry.color.trim()
                      ? entry.color.trim()
                      : "";

            if (!backgroundValue) {
                return null;
            }

            return {
                at: toTimelinePosition(entry.at, 0),
                background: backgroundValue
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.at - b.at);

    let backgroundLayers = null;
    if (backgroundShifts.length) {
        const backgroundShell = document.createElement("div");
        const baseLayer = document.createElement("div");
        const blendLayer = document.createElement("div");

        backgroundShell.className = "bangkok-night-backgrounds";
        baseLayer.className = "bangkok-night-background-layer is-base";
        blendLayer.className = "bangkok-night-background-layer is-blend";

        baseLayer.style.background = backgroundShifts[0].background;
        baseLayer.style.opacity = "1";
        blendLayer.style.opacity = "0";

        backgroundShell.appendChild(baseLayer);
        backgroundShell.appendChild(blendLayer);
        section.prepend(backgroundShell);

        backgroundLayers = {
            shell: backgroundShell,
            baseLayer,
            blendLayer
        };
    }

    const layerEls = new Map(
        Array.from(section.querySelectorAll(".bangkok-night-layer")).map(
            (layerEl) => [
                Number.parseInt(layerEl.dataset.layer || "0", 10),
                layerEl
            ]
        )
    );

    const itemMap = new Map();
    const modelRuntimes = [];
    const modelLayerStages = new Map();
    let currentTimelinePosition = 0;

    if (typeof ResizeObserver === "function") {
        const stageResizeObserver = new ResizeObserver(() => {
            applySceneScale();
            scrollTriggerApi.refresh();
        });
        stageResizeObserver.observe(stage);
    }

    window.addEventListener("resize", () => {
        applySceneScale();
        scrollTriggerApi.refresh();
    });

    const openOverlay = (item) => {
        if (!overlay || !overlayContent) {
            return;
        }

        overlayContent.innerHTML = "";

        const title = document.createElement("p");
        title.className = "bangkok-night-overlay__title";
        title.textContent =
            item.overlay_title || item.title || item.id || "Bangkok Night item";
        overlayContent.appendChild(title);

        if (item.type === "image") {
            const media = document.createElement("img");
            media.className = "bangkok-night-overlay__image";
            media.src = item.src;
            media.alt =
                item.alt || item.overlay_title || item.id || "Bangkok Night image";
            overlayContent.appendChild(media);
        } else if (item.type === "video") {
            const media = document.createElement("video");
            media.className = "bangkok-night-overlay__video";
            media.src = item.src;
            media.controls = true;
            media.autoplay = true;
            media.loop = item.loop !== false;
            media.muted = false;
            media.playsInline = true;
            overlayContent.appendChild(media);
        } else if (item.type === "text") {
            const copy = document.createElement("p");
            copy.className = "bangkok-night-overlay__text";
            copy.textContent = item.text || "";
            overlayContent.appendChild(copy);
        }

        overlay.hidden = false;
        overlay.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    };

    const closeOverlay = () => {
        if (!overlay) {
            return;
        }

        const playingVideo = overlay.querySelector("video");
        if (playingVideo) {
            playingVideo.pause();
        }

        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
        if (overlayContent) {
            overlayContent.innerHTML = "";
        }
        document.body.style.overflow = "";
    };

    overlayCloseButtons.forEach((button) => {
        button.addEventListener("click", closeOverlay);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && overlay && !overlay.hidden) {
            closeOverlay();
        }
    });

    const loadMediaMeta = (entry) =>
        new Promise((resolve) => {
            if (!entry || typeof entry.type !== "string") {
                resolve(null);
                return;
            }

            const base = {
                id: entry.id || "",
                type: entry.type,
                layer: normalizeLayer(entry.layer),
                overlay: Boolean(entry.overlay),
                title: typeof entry.title === "string" ? entry.title : "",
                overlay_title:
                    typeof entry.overlay_title === "string"
                        ? entry.overlay_title
                        : "",
                class_name:
                    typeof entry.class_name === "string" ? entry.class_name : "",
                idle_motion: parseIdleMotion(entry.idle_motion)
            };

            if (entry.type === "image") {
                if (typeof entry.src !== "string" || !entry.src.length) {
                    resolve(null);
                    return;
                }

                const img = new Image();
                img.onload = () => {
                    const height =
                        Math.max(140, Number.parseFloat(entry.height) || 320);
                    resolve({
                        ...base,
                        src: entry.src,
                        alt: typeof entry.alt === "string" ? entry.alt : base.id,
                        height,
                        width: Math.round(
                            height *
                                ((img.naturalWidth || 1) /
                                    (img.naturalHeight || 1))
                        )
                    });
                };
                img.onerror = () => resolve(null);
                img.src = entry.src;
                return;
            }

            if (entry.type === "video") {
                if (typeof entry.src !== "string" || !entry.src.length) {
                    resolve(null);
                    return;
                }

                const video = document.createElement("video");
                video.preload = "metadata";
                video.onloadedmetadata = () => {
                    const height =
                        Math.max(140, Number.parseFloat(entry.height) || 280);
                    const ratio = (video.videoWidth || 16) / (video.videoHeight || 9);
                    resolve({
                        ...base,
                        src: entry.src,
                        height,
                        width: Math.round(height * ratio),
                        autoplay: entry.autoplay !== false,
                        muted: entry.muted !== false,
                        loop: entry.loop !== false
                    });
                };
                video.onerror = () => resolve(null);
                video.src = entry.src;
                return;
            }

            if (entry.type === "model") {
                if (typeof entry.src !== "string" || !entry.src.length) {
                    resolve(null);
                    return;
                }

                resolve({
                    ...base,
                    src: entry.src,
                    width: Math.max(220, Number.parseFloat(entry.width) || 360),
                    height: Math.max(220, Number.parseFloat(entry.height) || 460)
                });
                return;
            }

            if (entry.type === "text") {
                const textStartSource =
                    entry.text_start && typeof entry.text_start === "object"
                        ? entry.text_start
                        : null;

                resolve({
                    ...base,
                    tag: typeof entry.tag === "string" ? entry.tag : "p",
                    text: typeof entry.text === "string" ? entry.text : "",
                    text_start: textStartSource
                        ? {
                              length: Math.max(
                                  1,
                                  Number.parseInt(textStartSource.length, 10) || 1
                              ),
                              class_name:
                                  typeof textStartSource.class_name === "string"
                                      ? textStartSource.class_name
                                      : ""
                          }
                        : null,
                    width: Math.max(160, Number.parseFloat(entry.width) || 280),
                    height: Number.parseFloat(entry.height) || null
                });
                return;
            }

            resolve(null);
        });

    const makeInteractive = (element, item) => {
        if (!item.overlay) {
            return;
        }

        element.classList.add("is-clickable");
        element.tabIndex = 0;
        element.setAttribute("role", "button");
        element.setAttribute(
            "aria-label",
            `Open ${item.overlay_title || item.title || item.id}`
        );

        const handler = () => openOverlay(item);
        element.addEventListener("click", handler);
        element.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handler();
            }
        });
    };

    const createItemElement = (runtime) => {
        const item = runtime.item;
        const root = document.createElement("article");
        const idleLayer = document.createElement("div");
        root.className = `bangkok-night-item bangkok-night-item--${item.type}`;
        if (item.class_name) {
            item.class_name
                .split(/\s+/)
                .filter(Boolean)
                .forEach((className) => {
                    root.classList.add(className);
                });
        }

        root.dataset.id = item.id;
        root.dataset.layer = String(item.layer);
        root.style.setProperty("--item-width", `${item.width}px`);
        if (item.height) {
            root.style.setProperty("--item-height", `${item.height}px`);
        }
        idleLayer.className = "bangkok-night-item__idle-layer";
        root.appendChild(idleLayer);
        runtime.idleLayer = idleLayer;

        if (item.type === "image") {
            const image = document.createElement("img");
            image.className = "bangkok-night-item__image";
            image.src = item.src;
            image.alt = item.alt || item.id;
            idleLayer.appendChild(image);
        } else if (item.type === "video") {
            const video = document.createElement("video");
            video.className = "bangkok-night-item__video";
            video.src = item.src;
            video.autoplay = item.autoplay;
            video.muted = item.muted;
            video.loop = item.loop;
            video.playsInline = true;
            video.preload = "metadata";
            idleLayer.appendChild(video);
        } else if (item.type === "text") {
            const textNode = document.createElement(item.tag || "p");
            textNode.className = "bangkok-night-item__text";

            if (item.text_start && item.text) {
                const leadLength = Math.min(
                    item.text.length,
                    Math.max(1, item.text_start.length || 1)
                );
                const leadSpan = document.createElement("span");
                leadSpan.className = "bangkok-night-item__text-start";
                if (item.text_start.class_name) {
                    leadSpan.classList.add(item.text_start.class_name);
                }
                leadSpan.textContent = item.text.slice(0, leadLength);
                textNode.appendChild(leadSpan);
                textNode.appendChild(
                    document.createTextNode(item.text.slice(leadLength))
                );
            } else {
                textNode.textContent = item.text;
            }

            idleLayer.appendChild(textNode);
        }

        if (item.type !== "text") {
            const idTag = document.createElement("span");
            idTag.className = "bangkok-night-item__id";
            idTag.textContent = item.id;
            idleLayer.appendChild(idTag);

            const layerTag = document.createElement("span");
            layerTag.className = "bangkok-night-item__layer";
            layerTag.textContent = `Layer ${item.layer}`;
            idleLayer.appendChild(layerTag);
        }

        makeInteractive(root, item);
        return root;
    };

    const resolvedItems = (await Promise.all(items.map(loadMediaMeta))).filter(Boolean);
    if (!resolvedItems.length) {
        return;
    }

    const idleRuntimes = [];

    resolvedItems.forEach((item) => {
        const layerEl = layerEls.get(item.layer);
        if (!layerEl) {
            return;
        }

        const runtime = {
            item,
            root: null,
            actorProxy:
                item.type === "model"
                    ? {
                          autoAlpha: 0,
                          x: 0,
                          y: 0,
                          z: 0,
                          scale: 1,
                          rotationX: 0,
                          rotationY: 0,
                          rotationZ: 0
                      }
                    : null,
            modelProxy:
                item.type === "model"
                    ? {
                          x: 0,
                          y: 0,
                          z: 0,
                          scale: 1,
                          rotationX: 0,
                          rotationY: 0,
                          rotationZ: 0
                      }
                    : null,
            modelLayerStage: null,
            anchorGroup: null,
            innerGroup: null,
            idleLayer: null,
            modelObject: null,
            opacityApplied: 1,
            idleMotion: item.idle_motion || null
        };

        if (item.type === "model") {
            modelRuntimes.push(runtime);
        } else {
            runtime.root = createItemElement(runtime);
            layerEl.appendChild(runtime.root);
        }

        if (runtime.idleMotion) {
            idleRuntimes.push(runtime);
        }

        itemMap.set(item.id, runtime);
    });

    const normalizeMotionVars = (source, targetKind) => {
        if (!source || typeof source !== "object") {
            return {};
        }

        const vars = {};
        const isDomTarget = targetKind === "item";

        Object.entries(source).forEach(([key, value]) => {
            if (value === undefined || value === null || value === "") {
                return;
            }

            if (key === "origin" || key === "pivot" || key === "transformOrigin") {
                if (isDomTarget) {
                    const origin = resolveTransformOrigin(value);
                    if (origin) {
                        vars.transformOrigin = origin;
                    }
                }
                return;
            }

            if (key === "rotateM") {
                if (isDomTarget) {
                    vars.rotation = value;
                    vars.transformOrigin = "50% 50%";
                } else {
                    vars.rotationZ = toRadians(value);
                }
                return;
            }

            if (key === "rotateL") {
                if (isDomTarget) {
                    vars.rotationY = value;
                    vars.transformOrigin = "0% 50%";
                } else {
                    vars.rotationY = toRadians(value);
                }
                return;
            }

            if (key === "rotateR") {
                if (isDomTarget) {
                    vars.rotationY = value;
                    vars.transformOrigin = "100% 50%";
                } else {
                    vars.rotationY = toRadians(value);
                }
                return;
            }

            if (key === "rotateT") {
                if (isDomTarget) {
                    vars.rotationX = value;
                    vars.transformOrigin = "50% 0%";
                } else {
                    vars.rotationX = toRadians(value);
                }
                return;
            }

            if (key === "rotateB") {
                if (isDomTarget) {
                    vars.rotationX = value;
                    vars.transformOrigin = "50% 100%";
                } else {
                    vars.rotationX = toRadians(value);
                }
                return;
            }

            if (key === "rotate" || key === "rotation" || key === "rotateZ") {
                if (isDomTarget) {
                    vars.rotation = value;
                } else {
                    vars.rotationZ = toRadians(value);
                }
                return;
            }

            if (key === "rotationZ") {
                if (isDomTarget) {
                    vars.rotation = value;
                } else {
                    vars.rotationZ = toRadians(value);
                }
                return;
            }

            if (key === "rotateX" || key === "rotationX") {
                vars.rotationX = isDomTarget ? value : toRadians(value);
                return;
            }

            if (key === "rotateY" || key === "rotationY") {
                vars.rotationY = isDomTarget ? value : toRadians(value);
                return;
            }

            vars[key] = value;
        });

        if (isDomTarget) {
            vars.force3D = true;
        }

        return vars;
    };

    const resolveMotionSteps = (motion) => {
        if (Array.isArray(motion.steps) && motion.steps.length) {
            return motion.steps;
        }

        return [
            {
                start:
                    motion.start !== undefined && motion.start !== null
                        ? motion.start
                        : motion.at,
                end: motion.end,
                from: motion.from,
                to: motion.to,
                ease: motion.ease,
                duration: motion.duration
            }
        ];
    };

    const resolveMotionTarget = (runtime, targetKind) => {
        if (targetKind === "modelItem") {
            return runtime.actorProxy;
        }

        if (targetKind === "model") {
            return runtime.modelProxy;
        }

        return runtime.root;
    };
    const getIdleMotionState = (runtime, now, alpha) => {
        const idleMotion = runtime.idleMotion;

        if (!idleMotion || alpha <= 0.01) {
            return {
                x: 0,
                y: 0,
                z: 0,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                scale: 1
            };
        }

        const idleStart = toTimelinePosition(idleMotion.startAt, 0);
        if (currentTimelinePosition < idleStart) {
            return {
                x: 0,
                y: 0,
                z: 0,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                scale: 1
            };
        }

        const idlePrimary = Math.sin(now * idleMotion.speed + idleMotion.phase);
        const idleSecondary = Math.cos(
            now * (idleMotion.speed * 0.73) + idleMotion.phase * 1.31
        );
        const idleTertiary = Math.sin(
            now * (idleMotion.speed * 0.51) + idleMotion.phase * 0.67
        );

        return {
            x: idleMotion.x * idleSecondary,
            y: idleMotion.y * idlePrimary,
            z: idleMotion.z * idleTertiary,
            rotationX: toRadians(idleMotion.rotationX * idleSecondary),
            rotationY: toRadians(idleMotion.rotationY * idlePrimary),
            rotationZ: toRadians(idleMotion.rotationZ * idleTertiary),
            scale: 1 + idleMotion.scale * idlePrimary
        };
    };
    const setActorOpacity = (runtime, alpha) => {
        if (!runtime.modelObject) {
            return;
        }

        const nextAlpha = clamp(alpha, 0, 1);
        const appliedAlpha = nextAlpha > 0.01 ? 1 : 0;
        if (Math.abs(nextAlpha - runtime.opacityApplied) < 0.01) {
            return;
        }

        runtime.opacityApplied = nextAlpha;
        runtime.modelObject.traverse((node) => {
            if (!node || !node.isMesh || !node.material) {
                return;
            }

            const applyMaterial = (material) => {
                material.transparent = appliedAlpha < 1;
                material.opacity = appliedAlpha;
                material.depthWrite = appliedAlpha === 1;
            };

            if (Array.isArray(node.material)) {
                node.material.forEach(applyMaterial);
            } else {
                applyMaterial(node.material);
            }
        });
    };

    const setupModelItems = async () => {
        if (!modelRuntimes.length) {
            return;
        }

        let THREE;
        let GLTFLoader;
        try {
            const [threeModule, loaderModule] = await Promise.all([
                import("https://esm.sh/three@0.150.1"),
                import("https://esm.sh/three@0.150.1/examples/jsm/loaders/GLTFLoader.js")
            ]);
            THREE = threeModule;
            GLTFLoader = loaderModule.GLTFLoader;
        } catch (error) {
            console.error("Bangkok Night Three.js module import failed:", error);
            return;
        }

        const getLayerStage = (layer) => {
            if (modelLayerStages.has(layer)) {
                return modelLayerStages.get(layer);
            }

            const layerEl = layerEls.get(layer);
            if (!layerEl) {
                return null;
            }

            const host = document.createElement("div");
            host.className = "bangkok-night-model-stage";
            layerEl.prepend(host);

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 8000);
            const renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
                renderer.outputColorSpace = THREE.SRGBColorSpace;
            }
            if ("toneMapping" in renderer && THREE.ACESFilmicToneMapping) {
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.08;
            }

            const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
            const fillLight = new THREE.DirectionalLight(0xb4d8ff, 1.2);
            fillLight.position.set(-220, 180, 240);
            const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
            keyLight.position.set(240, 240, 320);

            scene.add(ambientLight);
            scene.add(fillLight);
            scene.add(keyLight);

            host.appendChild(renderer.domElement);

            const layerStage = {
                host,
                scene,
                camera,
                renderer,
                actors: [],
                viewportWidth: 1,
                viewportHeight: 1,
                fov: 34
            };

            modelLayerStages.set(layer, layerStage);
            return layerStage;
        };

        const updateLayerStageSize = (layerStage) => {
            const width = Math.max(1, sceneMetrics.width || designWidth || 1);
            const height = Math.max(1, sceneMetrics.height || designHeight || 1);
            const cameraDistance =
                height / (2 * Math.tan((layerStage.fov * Math.PI) / 360));

            layerStage.viewportWidth = width;
            layerStage.viewportHeight = height;
            layerStage.camera.aspect = width / height;
            layerStage.camera.position.z = cameraDistance;
            layerStage.camera.updateProjectionMatrix();
            layerStage.camera.lookAt(0, 0, 0);

            layerStage.renderer.setPixelRatio(
                Math.min(window.devicePixelRatio || 1, 2)
            );
            layerStage.renderer.setSize(width, height, false);
        };

        const updateAllLayerStageSizes = () => {
            modelLayerStages.forEach(updateLayerStageSize);
        };

        const loader = new GLTFLoader();
        await Promise.all(
            modelRuntimes.map(
                (runtime) =>
                    new Promise((resolve) => {
                        const layerStage = getLayerStage(runtime.item.layer);
                        if (!layerStage) {
                            resolve();
                            return;
                        }

                        const anchorGroup = new THREE.Group();
                        const innerGroup = new THREE.Group();
                        anchorGroup.add(innerGroup);
                        layerStage.scene.add(anchorGroup);
                        layerStage.actors.push(runtime);

                        runtime.modelLayerStage = layerStage;
                        runtime.anchorGroup = anchorGroup;
                        runtime.innerGroup = innerGroup;

                        loader.load(
                            runtime.item.src,
                            (gltf) => {
                                const modelObject = gltf.scene;
                                const box = new THREE.Box3().setFromObject(modelObject);
                                const size = new THREE.Vector3();
                                const center = new THREE.Vector3();
                                box.getSize(size);
                                box.getCenter(center);

                                modelObject.position.sub(center);
                                const maxDim = Math.max(
                                    size.x || 1,
                                    size.y || 1,
                                    size.z || 1
                                );
                                const normalizedWorldSize = 220;
                                const fitScale = normalizedWorldSize / maxDim;
                                modelObject.scale.setScalar(
                                    Number.isFinite(fitScale) && fitScale > 0
                                        ? fitScale
                                        : 1
                                );
                                runtime.opacityApplied = -1;
                                setActorOpacity(runtime, 1);

                                innerGroup.add(modelObject);
                                runtime.modelObject = modelObject;
                                resolve();
                            },
                            undefined,
                            (error) => {
                                console.error(
                                    `Bangkok Night GLB load failed for ${runtime.item.id}:`,
                                    error
                                );
                                resolve();
                            }
                        );
                    })
            )
        );

        updateAllLayerStageSizes();

        if (typeof ResizeObserver === "function") {
            const resizeObserver = new ResizeObserver(() => {
                updateAllLayerStageSizes();
            });
            resizeObserver.observe(stage);
        }

        window.addEventListener("resize", updateAllLayerStageSizes);

    };
    const startRuntimeLoop = () => {
        if (!modelRuntimes.length && !idleRuntimes.length) {
            return;
        }

        const runtimeLoop = () => {
            const now = performance.now() / 1000;

            modelRuntimes.forEach((runtime) => {
                if (
                    !runtime.modelLayerStage ||
                    !runtime.anchorGroup ||
                    !runtime.innerGroup
                ) {
                    return;
                }

                const width = runtime.modelLayerStage.viewportWidth;
                const height = runtime.modelLayerStage.viewportHeight;
                const actorScale = toFiniteNumber(runtime.actorProxy.scale) ?? 1;
                const innerScale = toFiniteNumber(runtime.modelProxy.scale) ?? 1;
                const actorX = toFiniteNumber(runtime.actorProxy.x) ?? 0;
                const actorY = toFiniteNumber(runtime.actorProxy.y) ?? 0;
                const actorZ = toFiniteNumber(runtime.actorProxy.z) ?? 0;
                const localX = toFiniteNumber(runtime.modelProxy.x) ?? 0;
                const localY = toFiniteNumber(runtime.modelProxy.y) ?? 0;
                const localZ = toFiniteNumber(runtime.modelProxy.z) ?? 0;
                const alpha = clamp(
                    toFiniteNumber(runtime.actorProxy.autoAlpha) ?? 1,
                    0,
                    1
                );
                const idleState = getIdleMotionState(runtime, now, alpha);

                runtime.anchorGroup.visible = alpha > 0.01;
                setActorOpacity(runtime, alpha);

                runtime.anchorGroup.position.set(
                    actorX + runtime.item.width / 2 - width / 2,
                    height / 2 - (actorY + runtime.item.height / 2),
                    actorZ
                );
                runtime.anchorGroup.rotation.set(
                    toFiniteNumber(runtime.actorProxy.rotationX) ?? 0,
                    toFiniteNumber(runtime.actorProxy.rotationY) ?? 0,
                    toFiniteNumber(runtime.actorProxy.rotationZ) ?? 0
                );
                runtime.anchorGroup.scale.setScalar(actorScale);

                runtime.innerGroup.position.set(
                    localX + idleState.x,
                    -(localY + idleState.y),
                    localZ + idleState.z
                );
                runtime.innerGroup.rotation.set(
                    (toFiniteNumber(runtime.modelProxy.rotationX) ?? 0) +
                        idleState.rotationX,
                    (toFiniteNumber(runtime.modelProxy.rotationY) ?? 0) +
                        idleState.rotationY,
                    (toFiniteNumber(runtime.modelProxy.rotationZ) ?? 0) +
                        idleState.rotationZ
                );
                runtime.innerGroup.scale.setScalar(innerScale * idleState.scale);
            });

            idleRuntimes.forEach((runtime) => {
                if (!runtime.root || !runtime.idleLayer || runtime.item.type === "model") {
                    return;
                }

                const alpha = clamp(
                    toFiniteNumber(runtime.root.style.opacity) ?? 1,
                    0,
                    1
                );
                const idleState = getIdleMotionState(runtime, now, alpha);

                runtime.idleLayer.style.transform = `translate3d(${idleState.x}px, ${idleState.y}px, ${idleState.z}px) rotateX(${idleState.rotationX}rad) rotateY(${idleState.rotationY}rad) rotateZ(${idleState.rotationZ}rad) scale(${idleState.scale})`;
            });

            modelLayerStages.forEach((layerStage) => {
                layerStage.renderer.render(layerStage.scene, layerStage.camera);
            });

            requestAnimationFrame(runtimeLoop);
        };

        runtimeLoop();
    };

    const buildTimeline = () => {
        const timeline = gsapApi.timeline({
            defaults: {
                ease: "none"
            },
            onUpdate: () => {
                currentTimelinePosition = timeline.time();
            },
            scrollTrigger: {
                trigger: section,
                start: "top top",
                end: `+=${scrollLength}`,
                scrub: true,
                pin: stage,
                anticipatePin: 1,
                invalidateOnRefresh: true
            }
        });

        if (backgroundLayers && backgroundShifts.length) {
            const { baseLayer, blendLayer } = backgroundLayers;

            backgroundShifts.forEach((shift, index) => {
                const nextShift = backgroundShifts[index + 1];

                if (index === 0) {
                    timeline.set(
                        baseLayer,
                        {
                            background: shift.background,
                            opacity: 1,
                            immediateRender: false
                        },
                        shift.at
                    );
                }

                if (!nextShift) {
                    return;
                }

                timeline.set(
                    blendLayer,
                    {
                        background: nextShift.background,
                        opacity: 0,
                        immediateRender: false
                    },
                    shift.at
                );

                timeline.to(
                    blendLayer,
                    {
                        opacity: 1,
                        duration: Math.max(0.01, nextShift.at - shift.at),
                        ease: "none"
                    },
                    shift.at
                );

                timeline.set(
                    baseLayer,
                    {
                        background: nextShift.background,
                        opacity: 1,
                        immediateRender: false
                    },
                    nextShift.at
                );

                timeline.set(
                    blendLayer,
                    {
                        opacity: 0,
                        immediateRender: false
                    },
                    nextShift.at
                );
            });
        }

        const defaultDomState = {
            autoAlpha: 0,
            x: 0,
            y: 0,
            z: 0,
            scale: 1,
            rotation: 0,
            rotationX: 0,
            rotationY: 0,
            transformOrigin: "50% 50%",
            force3D: true
        };
        const defaultModelItemState = {
            autoAlpha: 0,
            x: 0,
            y: 0,
            z: 0,
            scale: 1,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0
        };
        const defaultModelState = {
            x: 0,
            y: 0,
            z: 0,
            scale: 1,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0
        };

        const initialStates = new Map();
        const tweens = [];

        motions.forEach((motion) => {
            if (!motion || typeof motion.item !== "string") {
                return;
            }

            const runtime = itemMap.get(motion.item);
            if (!runtime) {
                return;
            }

            const targetKind = normalizeMotionTarget(runtime, motion.target);
            const target = resolveMotionTarget(runtime, targetKind);
            if (!target) {
                return;
            }

            const steps = resolveMotionSteps(motion)
                .map((step) => {
                    const start = toTimelinePosition(
                        step.start !== undefined ? step.start : step.at,
                        0
                    );
                    const explicitEnd =
                        step.end !== undefined && step.end !== null
                            ? toTimelinePosition(step.end, 0)
                            : null;
                    const fallbackDuration = clamp(
                        toFiniteNumber(step.duration ?? motion.duration) ?? 0.16,
                        0.02,
                        1
                    );
                    const end =
                        explicitEnd !== null
                            ? explicitEnd
                            : start + fallbackDuration * 100;

                    return {
                        start,
                        end: Math.max(start + 0.01, end),
                        from: step.from,
                        to: step.to,
                        ease:
                            typeof step.ease === "string"
                                ? step.ease
                                : typeof motion.ease === "string"
                                  ? motion.ease
                                  : "none"
                    };
                })
                .sort((a, b) => a.start - b.start);

            if (!steps.length) {
                return;
            }

            const initialKey = `${runtime.item.id}:${targetKind}`;
            const firstStep = steps[0];
            const initialVars = normalizeMotionVars(
                motion.initial || firstStep.from || null,
                targetKind
            );

            const existingInitial = initialStates.get(initialKey);
            if (!existingInitial || firstStep.start < existingInitial.start) {
                initialStates.set(initialKey, {
                    runtime,
                    targetKind,
                    start: firstStep.start,
                    vars: initialVars
                });
            }

            steps.forEach((step) => {
                tweens.push({
                    runtime,
                    targetKind,
                    start: step.start,
                    duration: Math.max(0.01, step.end - step.start),
                    fromVars: normalizeMotionVars(step.from, targetKind),
                    toVars: normalizeMotionVars(step.to, targetKind),
                    ease: step.ease
                });
            });
        });

        itemMap.forEach((runtime) => {
            if (runtime.root) {
                gsapApi.set(runtime.root, defaultDomState);
            }
            if (runtime.actorProxy) {
                Object.assign(runtime.actorProxy, defaultModelItemState);
            }
            if (runtime.modelProxy) {
                Object.assign(runtime.modelProxy, defaultModelState);
            }
        });

        initialStates.forEach(({ runtime, targetKind, vars }) => {
            if (targetKind === "modelItem") {
                Object.assign(runtime.actorProxy, defaultModelItemState, vars);
                return;
            }

            if (targetKind === "model") {
                Object.assign(runtime.modelProxy, defaultModelState, vars);
                return;
            }

            if (runtime.root) {
                gsapApi.set(runtime.root, {
                    ...defaultDomState,
                    ...vars
                });
            }
        });

        tweens
            .sort((a, b) => a.start - b.start)
            .forEach(
                ({
                    runtime,
                    targetKind,
                    start,
                    duration,
                    fromVars,
                    toVars,
                    ease
                }) => {
                    const target = resolveMotionTarget(runtime, targetKind);
                    if (!target || !Object.keys(toVars).length) {
                        return;
                    }

                    if (Object.keys(fromVars).length) {
                        timeline.fromTo(
                            target,
                            fromVars,
                            {
                                ...toVars,
                                duration,
                                ease,
                                immediateRender: false
                            },
                            start
                        );
                        return;
                    }

                    timeline.to(
                        target,
                        {
                            ...toVars,
                            duration,
                            ease
                        },
                        start
                    );
                }
            );

        // Keep the full authored timeline length even if the current scene
        // only uses the early portion of it, so later beats can be added
        // without slowing down the existing choreography.
        timeline.to({ hold: 0 }, { hold: 0, duration: 0.001 }, timelineSpan);
        currentTimelinePosition = timeline.time();
    };

    await setupModelItems();
    buildTimeline();
    startRuntimeLoop();
    scrollTriggerApi.refresh();
})();
