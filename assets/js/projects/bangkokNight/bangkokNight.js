(() => {
    const dataEl = document.getElementById("bn-gallery-data");
    if (!dataEl) {
        return;
    }

    let data;
    try {
        data = JSON.parse(dataEl.textContent || "{}");
    } catch (error) {
        return;
    }

    const track = document.querySelector(".image-track");
    const carousel = document.querySelector(".image-carousel");
    const layerEls = {
        back: document.querySelector(".layer-back"),
        middle: document.querySelector(".layer-middle"),
        front: document.querySelector(".layer-front")
    };

    if (!track || !carousel || !layerEls.back || !layerEls.middle || !layerEls.front) {
        return;
    }

    const all = Array.isArray(data.all) ? data.all : [];
    const sizes = {
        small: Array.isArray(data.small) ? data.small : [],
        medium: Array.isArray(data.medium) ? data.medium : [],
        large: Array.isArray(data.large) ? data.large : []
    };
    const layers = {
        back: Array.isArray(data.layerBack) ? data.layerBack : [],
        middle: Array.isArray(data.layerMiddle) ? data.layerMiddle : [],
        front: Array.isArray(data.layerFront) ? data.layerFront : []
    };

    const sizePriority = ["large", "medium", "small"];
    const layerPriority = ["front", "middle", "back"];
    const sizeMap = new Map();
    const layerMap = new Map();

    sizePriority.forEach((key) => {
        sizes[key].forEach((path) => {
            if (!sizeMap.has(path)) {
                sizeMap.set(path, key);
            }
        });
    });

    layerPriority.forEach((key) => {
        layers[key].forEach((path) => {
            if (!layerMap.has(path)) {
                layerMap.set(path, key);
            }
        });
    });

    const sizeOrder = ["small", "medium", "large"];
    const layerOrder = ["back", "middle", "front"];
    const sizeDimensions = {
        small: 220,
        medium: 320,
        large: 460
    };

    const hashToUnit = (value) => {
        let hash = 0;
        for (let i = 0; i < value.length; i += 1) {
            hash = (hash << 5) - hash + value.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash) % 1000 / 1000;
    };

    const chooseByHash = (path, options, salt) => {
        const seed = hashToUnit(`${path}-${salt}`);
        const index = Math.floor(seed * options.length);
        return options[Math.min(index, options.length - 1)];
    };

    const items = all.map((path) => {
        const size = sizeMap.get(path) || chooseByHash(path, sizeOrder, "size");
        const layer = layerMap.get(path) || chooseByHash(path, layerOrder, "layer");
        return { path, size, layer };
    });

    let x = 80;
    items.forEach((item, index) => {
        const baseWidth = sizeDimensions[item.size] || sizeDimensions.medium;
        const jitter = (hashToUnit(`${item.path}-x`) - 0.5) * 80;
        const depthOffset = item.layer === "back" ? 50 : item.layer === "middle" ? 20 : -10;
        const yBase = item.layer === "back" ? 80 : item.layer === "middle" ? 140 : 200;
        const yJitter = (hashToUnit(`${item.path}-y`) - 0.5) * 90;
        const y = Math.max(30, yBase + yJitter + depthOffset);

        const wrapper = document.createElement("div");
        wrapper.className = `carousel-item size-${item.size}`;
        wrapper.style.setProperty("--x", `${x + jitter}px`);
        wrapper.style.setProperty("--y", `${y}px`);
        wrapper.style.setProperty("--z", item.layer === "front" ? "3" : item.layer === "middle" ? "2" : "1");

        const img = new Image();
        img.src = item.path;
        img.alt = item.path.split("/").pop().replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");

        wrapper.appendChild(img);
        layerEls[item.layer].appendChild(wrapper);

        const overlap = index % 2 === 0 ? 0.6 : 0.7;
        x += baseWidth * overlap;
    });

    track.style.width = `${Math.max(1200, x + 200)}px`;

    let rafId = null;
    let pendingDelta = 0;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const getMaxScroll = () => Math.max(0, carousel.scrollWidth - carousel.clientWidth);

    const applyScroll = () => {
        if (pendingDelta === 0) {
            rafId = null;
            return;
        }

        const maxScroll = getMaxScroll();
        const next = clamp(carousel.scrollLeft + pendingDelta, 0, maxScroll);
        carousel.scrollLeft = next;
        pendingDelta = 0;
        rafId = requestAnimationFrame(applyScroll);
    };

    const onWheel = (event) => {
        if (carousel.scrollWidth <= carousel.clientWidth) {
            return;
        }

        event.preventDefault();
        const lineScale = 24;
        const pageScale = carousel.clientWidth;
        const modeScale = event.deltaMode === 1 ? lineScale : event.deltaMode === 2 ? pageScale : 1;
        const delta = (event.deltaY !== 0 ? event.deltaY : event.deltaX) * modeScale;
        pendingDelta += delta;

        if (!rafId) {
            rafId = requestAnimationFrame(applyScroll);
        }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
})();
