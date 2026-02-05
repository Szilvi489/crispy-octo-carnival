(() => {
    const dataEl = document.getElementById("forest-gallery-data");
    if (!dataEl) {
        return;
    }

      let data;
    try {
        data = JSON.parse(dataEl.textContent || "{}");
    } catch (error) {
        return;
    }

    console.log(data);
    const track = document.querySelector(".image-track");
    const carousel = document.querySelector(".image-carousel");
    const section = document.querySelector(".double-expo-section");

    const doubleExpoImages = {
        first :document.querySelector(".double-expo-first-image"),
        second :document.querySelector(".double-expo-second-image")
    };

    if (!track || !carousel || !section || !doubleExpoImages.first || !doubleExpoImages.second) {
        return;
    } 

    const layout = Array.isArray(data.layout) ? data.layout : [];
    const all = Array.isArray(data.all) ? data.all : [];


    const firstImage = layout.find((item) => item.position === "first");
    const secondImage = layout.find((item) => item.position === "second");

    if (firstImage) {
        doubleExpoImages.first.src = firstImage.path;
    }

    if (secondImage) {
        doubleExpoImages.second.src = secondImage.path;
    }

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const lerp = (start, end, t) => start + (end - start) * t;

    let rafId = null;
    let manualProgress = 0;
    const updateOpacity = (progressOverride) => {
        rafId = null;
        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight || 1;
        const total = rect.height + viewportHeight;
        const progressRaw = (viewportHeight - rect.top) / total;
        const progress = typeof progressOverride === "number"
            ? clamp(progressOverride, 0, 1)
            : clamp(progressRaw, 0, 1);

        let firstOpacity = 1;
        let secondOpacity = 0;

        if (progress < 0.4) {
            const t = progress / 0.4;
            firstOpacity = lerp(1, 0.5, t);
            secondOpacity = lerp(0, 0.5, t);
        } else if (progress < 0.6) {
            firstOpacity = 0.5;
            secondOpacity = 0.5;
        } else {
            const t = (progress - 0.6) / 0.4;
            firstOpacity = lerp(0.5, 0, t);
            secondOpacity = lerp(0.5, 1, t);
        }

        doubleExpoImages.first.style.opacity = `${firstOpacity}`;
        doubleExpoImages.second.style.opacity = `${secondOpacity}`;
    };

    const onScroll = () => {
        if (!rafId) {
            rafId = requestAnimationFrame(updateOpacity);
        }
    };

    const onWheel = (event) => {
        if (section.getBoundingClientRect().height <= 0) {
            return;
        }
        event.preventDefault();
        const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
        manualProgress = clamp(manualProgress + delta * 0.001, 0, 1);
        if (!rafId) {
            rafId = requestAnimationFrame(() => updateOpacity(manualProgress));
        }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    section.addEventListener("wheel", onWheel, { passive: false });
    updateOpacity(0);



})();
