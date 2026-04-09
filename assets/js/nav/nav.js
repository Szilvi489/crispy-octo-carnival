(() => {
    const trigger = document.querySelector(".navSquareColour");
    const overlay = document.getElementById("navOverlay");
    const closeButton = document.getElementById("navClose");

    if (!trigger || !overlay || !closeButton) {
        return;
    }

    const root = document.documentElement;

    const openMenu = () => {
        root.classList.add("nav-open");
        trigger.setAttribute("aria-expanded", "true");
        overlay.setAttribute("aria-hidden", "false");
    };

    const closeMenu = () => {
        root.classList.remove("nav-open");
        trigger.setAttribute("aria-expanded", "false");
        overlay.setAttribute("aria-hidden", "true");
    };

    trigger.addEventListener("click", openMenu);
    closeButton.addEventListener("click", closeMenu);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    const initNavShrinkWithGsap = () => {
        const gsapApi = window.gsap;
        if (!gsapApi || typeof gsapApi.to !== "function") {
            return;
        }
        const measuredSize = Math.round(trigger.getBoundingClientRect().width);
        const expandedSizePx = measuredSize > 0 ? measuredSize : 60;
        const compactSizePx = Math.max(28, Math.round(expandedSizePx * 0.77));
        const shrinkAtScrollPx = 24;

        const playNavArrival = () => {
            gsapApi.fromTo(
                trigger,
                { autoAlpha: 0, scale: 0.45, transformOrigin: "50% 50%" },
                { autoAlpha: 1, scale: 1, duration: 1.05, ease: "expo.out", overwrite: "auto" }
            );
        };
        const queueNavArrival = () => {
            window.setTimeout(playNavArrival, 90);
        };

        const shrinkTween = gsapApi.to(trigger, {
            width: compactSizePx,
            height: compactSizePx,
            duration: 0.24,
            ease: "power2.out",
            paused: true
        });

        const updateNavSizeOnScroll = () => {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
            if (scrollY > shrinkAtScrollPx) {
                shrinkTween.play();
                return;
            }
            shrinkTween.reverse();
        };

        trigger.style.width = `${expandedSizePx}px`;
        trigger.style.height = `${expandedSizePx}px`;
        queueNavArrival();

        window.addEventListener("scroll", updateNavSizeOnScroll, { passive: true });
        window.addEventListener("resize", updateNavSizeOnScroll);
        window.addEventListener("pageshow", (event) => {
            if (event.persisted) {
                queueNavArrival();
                updateNavSizeOnScroll();
            }
        });
        updateNavSizeOnScroll();
    };

    if (window.gsap && typeof window.gsap.to === "function") {
        initNavShrinkWithGsap();
    } else {
        window.addEventListener("load", initNavShrinkWithGsap, { once: true });
    }
})();
