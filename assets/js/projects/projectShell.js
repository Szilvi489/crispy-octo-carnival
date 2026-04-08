(() => {
    const shell = document.querySelector("[data-project-shell]");
    const gallery = document.querySelector("[data-horizontal-gallery]");
    const items = [...document.querySelectorAll("[data-project-shell-item]")];
    const metaItems = [...document.querySelectorAll(".project-shell__meta-item")];
    const gsapApi = window.gsap;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!items.length) {
        return;
    }

    const projectTitle = document.title || "project";

    const seededUnit = (seed) => {
        const value = Math.sin(seed) * 10000;
        return value - Math.floor(value);
    };

    const titleSeed = [...projectTitle].reduce((total, char) => total + char.charCodeAt(0), 0);
    const clampDistance = gsapApi?.utils?.clamp ? gsapApi.utils.clamp(-1.18, 1.18) : (value) => Math.max(-1.18, Math.min(1.18, value));
    let syncFrame = 0;

    const itemState = items.map((item, index) => {
        const image = item.querySelector(".project-shell__image");
        const scale = 0.84 + seededUnit(titleSeed + index * 1.73) * 0.24;
        const depth = -12 + seededUnit(titleSeed + index * 2.31 + 17) * 24;

        item.style.setProperty("--image-scale", scale.toFixed(3));

        return {
            item,
            image,
            depth
        };
    });

    const syncTransforms = () => {
        if (!gallery || !gsapApi || prefersReducedMotion) {
            return;
        }

        const viewportCenter = gallery.getBoundingClientRect().left + gallery.clientWidth / 2;

        itemState.forEach((entry) => {
            if (!entry.image) {
                return;
            }

            const rect = entry.item.getBoundingClientRect();
            const itemCenter = rect.left + rect.width / 2;
            const normalizedDistance = clampDistance((itemCenter - viewportCenter) / gallery.clientWidth);
            const verticalShift = -normalizedDistance * entry.depth;

            gsapApi.to(entry.image, {
                y: verticalShift,
                duration: 0.85,
                ease: "power3.out",
                overwrite: "auto"
            });
        });
    };

    const revealItems = () => {
        if (!gsapApi || prefersReducedMotion) {
            items.forEach((item) => item.classList.add("is-visible"));
            return;
        }

        if (shell) {
            shell.classList.add("project-shell--enhanced");
        }

        gsapApi.set(items, {
            autoAlpha: 0,
            x: 86,
            y: 22
        });
        gsapApi.set(metaItems, {
            autoAlpha: 0,
            y: 18
        });

        itemState.forEach((entry) => {
            if (!entry.image) {
                return;
            }

            gsapApi.set(entry.image, { scale: 1, transformOrigin: "50% 50%" });
        });

        const intro = gsapApi.timeline({ defaults: { ease: "expo.out" } });
        intro.to(metaItems, {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            stagger: 0.05
        });
        intro.to(items, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 1.15,
            stagger: 0.075,
            onStart: () => {
                items.forEach((item) => item.classList.add("is-visible"));
            }
        }, 0.14);
    };

    const requestSync = () => {
        if (!gsapApi || prefersReducedMotion) {
            return;
        }

        if (syncFrame) {
            return;
        }

        syncFrame = window.requestAnimationFrame(() => {
            syncFrame = 0;
            syncTransforms();
        });
    };

    if (gallery && !prefersReducedMotion) {
        gallery.addEventListener("wheel", (event) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
                return;
            }

            const maxScrollLeft = gallery.scrollWidth - gallery.clientWidth;
            if (maxScrollLeft <= 0) {
                return;
            }

            const canScrollForward = event.deltaY > 0 && gallery.scrollLeft < maxScrollLeft;
            const canScrollBackward = event.deltaY < 0 && gallery.scrollLeft > 0;

            if (!canScrollForward && !canScrollBackward) {
                return;
            }

            event.preventDefault();
            gallery.scrollBy({ left: event.deltaY * 0.9, behavior: "auto" });
        }, { passive: false });

        gallery.addEventListener("keydown", (event) => {
            if (event.key === "ArrowRight") {
                event.preventDefault();
                gallery.scrollBy({ left: gallery.clientWidth * 0.65, behavior: "smooth" });
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                gallery.scrollBy({ left: gallery.clientWidth * -0.65, behavior: "smooth" });
            }

            if (event.key === "Home") {
                event.preventDefault();
                gallery.scrollTo({ left: 0, behavior: "smooth" });
            }

            if (event.key === "End") {
                event.preventDefault();
                gallery.scrollTo({ left: gallery.scrollWidth, behavior: "smooth" });
            }
        });

        gallery.addEventListener("scroll", requestSync, { passive: true });
        window.addEventListener("resize", requestSync);
        window.addEventListener("load", requestSync, { once: true });
    }

    revealItems();
    requestSync();

    itemState.forEach((entry) => {
        entry.image?.addEventListener("load", requestSync, { once: true });
    });
})();
