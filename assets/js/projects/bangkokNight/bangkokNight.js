/* global ResizeObserver */

(async () => {
    const dataEl = document.getElementById("bn-gallery-data");
    const section = document.querySelector(".bangkok-night-section");
    const stage = document.querySelector(".bangkok-night-content");
    const track = document.querySelector(".bangkok-night-track");
    const overlay = document.querySelector(".bangkok-night-overlay");
    const overlayContent = overlay ? overlay.querySelector(".bangkok-night-overlay__content") : null;
    const overlayCloseButtons = overlay ? overlay.querySelectorAll("[data-close-overlay]") : [];

    if (!dataEl || !section || !stage || !track) {
        return;
    }

    let data;
    try {
        data = JSON.parse(dataEl.textContent || "{}");
    } catch (error) {
        return;
    }

    const stageConfig = data.stage && typeof data.stage === "object" ? data.stage : {};
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

    const scrollLength = Math.max(2600, Number.parseFloat(stageConfig.scroll_length) || 5200);
    section.style.minHeight = `${scrollLength}px`;

    const layerEls = new Map(
        Array.from(section.querySelectorAll(".bangkok-night-layer")).map((layerEl) => [
            Number.parseInt(layerEl.dataset.layer || "0", 10),
            layerEl
        ])
    );

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const normalizeLayer = (value) => clamp(Number.parseInt(value, 10) || 1, 1, 4);
    const itemMap = new Map();
    const modelRuntimes = [];

    const openOverlay = (item) => {
        if (!overlay || !overlayContent) {
            return;
        }

        overlayContent.innerHTML = "";

        const title = document.createElement("p");
        title.className = "bangkok-night-overlay__title";
        title.textContent = item.overlay_title || item.title || item.id || "Bangkok Night item";
        overlayContent.appendChild(title);

        if (item.type === "image") {
            const media = document.createElement("img");
            media.className = "bangkok-night-overlay__image";
            media.src = item.src;
            media.alt = item.alt || item.overlay_title || item.id || "Bangkok Night image";
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

    const loadMediaMeta = (entry) => new Promise((resolve) => {
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
            overlay_title: typeof entry.overlay_title === "string" ? entry.overlay_title : "",
            class_name: typeof entry.class_name === "string" ? entry.class_name : ""
        };

        if (entry.type === "image") {
            if (typeof entry.src !== "string" || !entry.src.length) {
                resolve(null);
                return;
            }

            const img = new Image();
            img.onload = () => {
                const height = Math.max(140, Number.parseFloat(entry.height) || 320);
                resolve({
                    ...base,
                    src: entry.src,
                    alt: typeof entry.alt === "string" ? entry.alt : base.id,
                    height,
                    width: Math.round(height * ((img.naturalWidth || 1) / (img.naturalHeight || 1)))
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
                const height = Math.max(140, Number.parseFloat(entry.height) || 280);
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
            resolve({
                ...base,
                tag: typeof entry.tag === "string" ? entry.tag : "p",
                text: typeof entry.text === "string" ? entry.text : "",
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
        element.setAttribute("aria-label", `Open ${item.overlay_title || item.title || item.id}`);

        const handler = () => openOverlay(item);
        element.addEventListener("click", handler);
        element.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handler();
            }
        });
    };

    const createItemElement = (item) => {
        const root = document.createElement("article");
        root.className = `bangkok-night-item bangkok-night-item--${item.type}`;
        if (item.class_name) {
            root.classList.add(item.class_name);
        }
        root.dataset.id = item.id;
        root.dataset.layer = String(item.layer);
        root.style.setProperty("--item-width", `${item.width}px`);
        if (item.height) {
            root.style.setProperty("--item-height", `${item.height}px`);
        }

        const idTag = document.createElement("span");
        idTag.className = "bangkok-night-item__id";
        idTag.textContent = item.id;

        root.appendChild(idTag);

        if (item.type === "image") {
            const image = document.createElement("img");
            image.className = "bangkok-night-item__image";
            image.src = item.src;
            image.alt = item.alt || item.id;
            root.appendChild(image);
        } else if (item.type === "video") {
            const video = document.createElement("video");
            video.className = "bangkok-night-item__video";
            video.src = item.src;
            video.autoplay = item.autoplay;
            video.muted = item.muted;
            video.loop = item.loop;
            video.playsInline = true;
            video.preload = "metadata";
            root.appendChild(video);
        } else if (item.type === "text") {
            const textNode = document.createElement(item.tag || "p");
            textNode.className = "bangkok-night-item__text";
            textNode.textContent = item.text;
            root.appendChild(textNode);
        } else if (item.type === "model") {
            const shell = document.createElement("div");
            shell.className = "bangkok-night-item__model-shell";

            const canvasHost = document.createElement("div");
            canvasHost.className = "bangkok-night-item__model-canvas";

            const title = document.createElement("span");
            title.className = "bangkok-night-item__model-title";
            title.textContent = item.title || item.id;

            shell.appendChild(canvasHost);
            shell.appendChild(title);
            root.appendChild(shell);

            modelRuntimes.push({ item, root, canvasHost });
        }

        if (item.type !== "text") {
            const layerTag = document.createElement("span");
            layerTag.className = "bangkok-night-item__layer";
            layerTag.textContent = `Layer ${item.layer}`;
            root.appendChild(layerTag);
        }

        makeInteractive(root, item);
        return root;
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
            return;
        }

        const loader = new GLTFLoader();
        const renderers = [];

        const resizeRenderer = (runtime) => {
            const width = Math.max(1, runtime.canvasHost.clientWidth);
            const height = Math.max(1, runtime.canvasHost.clientHeight);
            runtime.camera.aspect = width / height;
            runtime.camera.updateProjectionMatrix();
            runtime.renderer.setSize(width, height, false);
        };

        modelRuntimes.forEach((runtime) => {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
            camera.position.z = 4.2;

            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            runtime.canvasHost.appendChild(renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
            const directionalLight = new THREE.DirectionalLight(0xfff0cc, 1.8);
            directionalLight.position.set(2, 3, 4);
            scene.add(ambientLight);
            scene.add(directionalLight);

            runtime.scene = scene;
            runtime.camera = camera;
            runtime.renderer = renderer;
            renderers.push(runtime);

            resizeRenderer(runtime);

            loader.load(
                runtime.item.src,
                (gltf) => {
                    const model = gltf.scene;
                    const box = new THREE.Box3().setFromObject(model);
                    const size = new THREE.Vector3();
                    const center = new THREE.Vector3();
                    box.getSize(size);
                    box.getCenter(center);

                    model.position.sub(center);

                    const maxDim = Math.max(size.x, size.y, size.z) || 1;
                    const scale = 2.2 / maxDim;
                    model.scale.setScalar(scale);
                    model.rotation.y = Math.PI * 0.12;
                    model.rotation.x = -0.08;

                    scene.add(model);
                    runtime.model = model;
                },
                undefined,
                () => {}
            );

            if (typeof ResizeObserver !== "undefined") {
                const observer = new ResizeObserver(() => resizeRenderer(runtime));
                observer.observe(runtime.canvasHost);
            }
        });

        const renderLoop = () => {
            renderers.forEach((runtime) => {
                if (runtime.model) {
                    runtime.model.rotation.y += 0.008;
                }
                runtime.renderer.render(runtime.scene, runtime.camera);
            });
            requestAnimationFrame(renderLoop);
        };

        renderLoop();
        window.addEventListener("resize", () => {
            renderers.forEach((runtime) => resizeRenderer(runtime));
        });
    };

    const buildTimeline = () => {
        const durationScale = 100;
        const timeline = gsapApi.timeline({
            defaults: {
                ease: "power2.out"
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

        itemMap.forEach((runtime) => {
            gsapApi.set(runtime.root, {
                autoAlpha: 0,
                x: 0,
                y: 0,
                rotate: 0,
                scale: 1
            });
        });

        motions.forEach((motion) => {
            if (!motion || typeof motion.item !== "string") {
                return;
            }

            const runtime = itemMap.get(motion.item);
            if (!runtime) {
                return;
            }

            const start = clamp(
                Number.parseFloat(
                    motion.start !== undefined ? motion.start : motion.at
                ) || 0,
                0,
                1
            ) * durationScale;
            const fromVars = motion.from && typeof motion.from === "object" ? { ...motion.from } : null;
            const toVars = motion.to && typeof motion.to === "object" ? { ...motion.to } : {};
            const rawDuration = clamp(Number.parseFloat(toVars.duration || motion.duration || 0.16), 0.02, 1);
            const end = motion.end !== undefined
                ? clamp(Number.parseFloat(motion.end) || 0, 0, 1) * durationScale
                : start + rawDuration * durationScale;
            const duration = Math.max(0.01, end - start);
            delete toVars.duration;
            const ease = typeof motion.ease === "string" ? motion.ease : undefined;

            if (fromVars) {
                timeline.fromTo(
                    runtime.root,
                    fromVars,
                    {
                        ...toVars,
                        duration,
                        ease
                    },
                    start
                );
            } else {
                timeline.to(
                    runtime.root,
                    {
                        ...toVars,
                        duration,
                        ease
                    },
                    start
                );
            }
        });
    };

    const resolvedItems = (await Promise.all(items.map(loadMediaMeta))).filter(Boolean);
    if (!resolvedItems.length) {
        return;
    }

    resolvedItems.forEach((item) => {
        const layerEl = layerEls.get(item.layer);
        if (!layerEl) {
            return;
        }

        const root = createItemElement(item);
        layerEl.appendChild(root);
        itemMap.set(item.id, { item, root });
    });

    await setupModelItems();
    buildTimeline();
    ScrollTrigger.refresh();
})();
