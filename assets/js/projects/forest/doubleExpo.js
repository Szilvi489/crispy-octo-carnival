(() => {
    const sections = document.querySelectorAll(".double-expo-section");
    if (!sections.length) {
        return;
    }

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const lerp = (start, end, t) => start + (end - start) * t;

    sections.forEach((section) => {
        const dataEl = section.querySelector(".forest-gallery-data");
        if (!dataEl) {
            return;
        }

        let data;
        try {
            data = JSON.parse(dataEl.textContent || "{}");
        } catch (error) {
            return;
        }

        const track = section.querySelector(".image-track");
        const carousel = section.querySelector(".image-carousel");
        const firstContainer = section.querySelector(".double-expo-first-container");
        const secondContainer = section.querySelector(".double-expo-second-container");
        let firstImageEl = section.querySelector(".double-expo-first-image");
        let secondImageEl = section.querySelector(".double-expo-second-image");
        if (!firstImageEl && firstContainer) {
            firstImageEl = document.createElement("img");
            firstImageEl.className = "image double-expo-first-image";
            firstImageEl.alt = "";
            firstImageEl.loading = "lazy";
            firstImageEl.decoding = "async";
            firstContainer.appendChild(firstImageEl);
        }
        if (!secondImageEl && secondContainer) {
            secondImageEl = document.createElement("img");
            secondImageEl.className = "image double-expo-second-image";
            secondImageEl.alt = "";
            secondImageEl.loading = "lazy";
            secondImageEl.decoding = "async";
            secondContainer.appendChild(secondImageEl);
        }
        const doubleExpoImages = {
            first: firstImageEl,
            second: secondImageEl
        };

        if (!track || !carousel || !doubleExpoImages.first || !doubleExpoImages.second) {
            return;
        }

        const layout = Array.isArray(data.layout) ? data.layout : [];
        const firstImage = layout.find((item) => item.position === "first");
        const secondImage = layout.find((item) => item.position === "second");

        if (firstImage) {
            doubleExpoImages.first.src = firstImage.path;
        }

        if (secondImage) {
            doubleExpoImages.second.src = secondImage.path;
        }

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
            const rect = section.getBoundingClientRect();
            const isInView = rect.top < window.innerHeight && rect.bottom > 0;
            if (!isInView) {
                return;
            }

            const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
            manualProgress = clamp(manualProgress + delta * 0.001, 0, 1);

            if (manualProgress > 0 && manualProgress < 1) {
                event.preventDefault();
            }

            if (!rafId) {
                rafId = requestAnimationFrame(() => updateOpacity(manualProgress));
            }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        section.addEventListener("wheel", onWheel, { passive: false });
        updateOpacity(0);
    });
})();
