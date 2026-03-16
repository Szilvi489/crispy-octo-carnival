(function () {
    const section = document.getElementById("cv-intro");
    const gsapApi = window.gsap;

    if (!section) {
        return;
    }

    const title = section.querySelector(".title");
    const orbitScene = section.querySelector(".cv-intro-orbit-scene");
    const factsDrawer = section.querySelector(".cv-facts-drawer");
    const factsPanel = section.querySelector(".cv-facts-panel");
    const factsToggle = section.querySelector(".cv-facts-toggle");
    const metaWrap = section.querySelector(".cv-facts-meta");
    const metaCards = metaWrap ? Array.from(metaWrap.querySelectorAll(".cv-facts-card")) : [];
    const canUseGsap = !!gsapApi && typeof gsapApi.fromTo === "function";
    let factsScrollRafId = null;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const syncFactsPanelState = (isOpen) => {
        if (!factsDrawer || !factsPanel || !factsToggle) {
            return;
        }

        factsDrawer.classList.toggle("is-open", isOpen);
        factsPanel.classList.toggle("is-open", isOpen);
        factsPanel.setAttribute("aria-hidden", isOpen ? "false" : "true");
        factsToggle.classList.toggle("is-open", isOpen);
        factsToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    };

    const updateFactsScrollShift = () => {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        const toggleWidth = factsToggle ? factsToggle.getBoundingClientRect().width : 56;
        const panelWidth = factsPanel ? factsPanel.getBoundingClientRect().width : 320;
        const maxShift = panelWidth + toggleWidth + 32;
        const shift = clamp(scrollY * 0.65, 0, maxShift);

        factsScrollRafId = null;

        if (!factsDrawer) {
            return;
        }

        factsDrawer.style.setProperty("--cv-facts-scroll-shift", shift.toFixed(2) + "px");
    };

    const queueFactsScrollShift = () => {
        if (factsScrollRafId !== null) {
            return;
        }

        factsScrollRafId = window.requestAnimationFrame(updateFactsScrollShift);
    };

    const initFloatingCards = () => {
        if (!metaWrap || metaCards.length < 2) {
            return;
        }

        metaWrap.classList.add("is-floating");

        const state = [];
        const spacingPx = 3;
        const wallPaddingPx = 8;
        const minSpeedPx = 84;
        const maxSpeedPx = 100;
        let boundsWidth = 0;
        let boundsHeight = 0;
        let rafId = 0;
        let lastTimestamp = 0;
        let resizeTimeoutId = 0;
        let isVisible = true;

        const randomInRange = (min, max) => min + Math.random() * (max - min);
        const getRandomPosition = (radius) => {
            const minX = radius + wallPaddingPx;
            const maxX = Math.max(minX, boundsWidth - radius - wallPaddingPx);
            const minY = radius + wallPaddingPx;
            const maxY = Math.max(minY, boundsHeight - radius - wallPaddingPx);
            return {
                x: randomInRange(minX, maxX),
                y: randomInRange(minY, maxY)
            };
        };

        const keepInBounds = (item) => {
            const minX = item.radius + wallPaddingPx;
            const maxX = Math.max(minX, boundsWidth - item.radius - wallPaddingPx);
            const minY = item.radius + wallPaddingPx;
            const maxY = Math.max(minY, boundsHeight - item.radius - wallPaddingPx);

            if (item.x < minX) {
                item.x = minX;
                item.vx = Math.abs(item.vx);
            } else if (item.x > maxX) {
                item.x = maxX;
                item.vx = -Math.abs(item.vx);
            }

            if (item.y < minY) {
                item.y = minY;
                item.vy = Math.abs(item.vy);
            } else if (item.y > maxY) {
                item.y = maxY;
                item.vy = -Math.abs(item.vy);
            }
        };

        const placeCards = () => {
            boundsWidth = Math.max(260, Math.round(metaWrap.clientWidth));
            boundsHeight = Math.max(280, Math.round(metaWrap.clientHeight));
            state.length = 0;

            metaCards.forEach((card) => {
                const size = Math.max(86, Math.round(card.offsetWidth || card.getBoundingClientRect().width || 160));
                const radius = size / 2;
                let position = getRandomPosition(radius);
                let attempts = 0;

                while (attempts < 220) {
                    let overlaps = false;
                    for (let i = 0; i < state.length; i += 1) {
                        const other = state[i];
                        const dx = position.x - other.x;
                        const dy = position.y - other.y;
                        const minDist = radius + other.radius + spacingPx;
                        if ((dx * dx) + (dy * dy) < (minDist * minDist)) {
                            overlaps = true;
                            break;
                        }
                    }
                    if (!overlaps) {
                        break;
                    }
                    position = getRandomPosition(radius);
                    attempts += 1;
                }

                const angle = Math.random() * Math.PI * 2;
                const speed = randomInRange(minSpeedPx, maxSpeedPx);
                state.push({
                    el: card,
                    radius,
                    x: position.x,
                    y: position.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed
                });
            });
        };

        const resolveCollisions = () => {
            for (let i = 0; i < state.length; i += 1) {
                for (let j = i + 1; j < state.length; j += 1) {
                    const a = state[i];
                    const b = state[j];
                    const dx = b.x - a.x;
                    const dy = b.y - a.y;
                    const distSq = (dx * dx) + (dy * dy);
                    const minDist = a.radius + b.radius + spacingPx;

                    if (distSq >= (minDist * minDist)) {
                        continue;
                    }

                    const dist = Math.sqrt(distSq) || 0.0001;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const overlap = minDist - dist;
                    const tx = -ny;
                    const ty = nx;
                    const v1n = (a.vx * nx) + (a.vy * ny);
                    const v1t = (a.vx * tx) + (a.vy * ty);
                    const v2n = (b.vx * nx) + (b.vy * ny);
                    const v2t = (b.vx * tx) + (b.vy * ty);
                    const restitution = 0.96;
                    const newV1n = v2n * restitution;
                    const newV2n = v1n * restitution;

                    a.x -= nx * overlap * 0.5;
                    a.y -= ny * overlap * 0.5;
                    b.x += nx * overlap * 0.5;
                    b.y += ny * overlap * 0.5;

                    a.vx = (tx * v1t) + (nx * newV1n);
                    a.vy = (ty * v1t) + (ny * newV1n);
                    b.vx = (tx * v2t) + (nx * newV2n);
                    b.vy = (ty * v2t) + (ny * newV2n);

                    keepInBounds(a);
                    keepInBounds(b);
                }
            }
        };

        const render = () => {
            for (let i = 0; i < state.length; i += 1) {
                const item = state[i];
                item.el.style.transform = `translate3d(${Math.round(item.x - item.radius)}px, ${Math.round(item.y - item.radius)}px, 0)`;
            }
        };

        const animate = (timestamp) => {
            if (!isVisible) {
                rafId = 0;
                return;
            }
            if (!lastTimestamp) {
                lastTimestamp = timestamp;
            }

            const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
            lastTimestamp = timestamp;

            for (let i = 0; i < state.length; i += 1) {
                const item = state[i];
                item.x += item.vx * dt;
                item.y += item.vy * dt;
                keepInBounds(item);
            }

            resolveCollisions();
            render();
            rafId = window.requestAnimationFrame(animate);
        };

        const start = () => {
            if (rafId) {
                return;
            }
            metaWrap.classList.add("is-physics");
            lastTimestamp = 0;
            rafId = window.requestAnimationFrame(animate);
        };

        const stop = () => {
            if (!rafId) {
                return;
            }
            window.cancelAnimationFrame(rafId);
            rafId = 0;
        };

        const refreshLayout = () => {
            placeCards();
            render();
        };

        const onResize = () => {
            window.clearTimeout(resizeTimeoutId);
            resizeTimeoutId = window.setTimeout(refreshLayout, 130);
        };

        refreshLayout();

        if (canUseGsap) {
            gsapApi.fromTo(
                metaCards,
                { autoAlpha: 0 },
                {
                    autoAlpha: 1,
                    duration: 0.8,
                    ease: "power3.out",
                    stagger: 0.09
                }
            );
        } else {
            metaCards.forEach((card) => {
                card.style.opacity = "1";
            });
        }

        window.addEventListener("resize", onResize);

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries) => {
                const entry = entries[0];
                isVisible = !!entry && entry.isIntersecting;
                if (isVisible) {
                    start();
                } else {
                    stop();
                }
            }, { threshold: 0.05 });
            observer.observe(section);
        }

        start();
    };

    const playTitleArrival = () => {
        if (!title) {
            return;
        }

        if (!canUseGsap) {
            title.style.opacity = "1";
            title.style.transform = "translateY(0)";
            return;
        }

        gsapApi.killTweensOf(title);
        gsapApi.fromTo(
            title,
            { y: 170, autoAlpha: 0, filter: "blur(4px)" },
            {
                y: 0,
                autoAlpha: 1,
                filter: "blur(0px)",
                duration: 1.1,
                ease: "power3.out",
                clearProps: "filter"
            }
        );
    };

    const queueTitleArrival = () => {
        window.setTimeout(playTitleArrival, 80);
    };

    if (document.readyState === "complete") {
        queueTitleArrival();
    } else {
        window.addEventListener("load", queueTitleArrival, { once: true });
    }

    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            queueTitleArrival();
        }
    });

    if (factsDrawer && factsPanel && factsToggle) {
        syncFactsPanelState(false);
        updateFactsScrollShift();

        factsToggle.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            syncFactsPanelState(!factsPanel.classList.contains("is-open"));
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                syncFactsPanelState(false);
            }
        });

        window.addEventListener("scroll", queueFactsScrollShift, { passive: true });
        window.addEventListener("resize", queueFactsScrollShift);

        try {
            initFloatingCards();
        } catch (error) {
            if (metaWrap) {
                metaWrap.classList.remove("is-physics");
            }
            console.error("CV intro bubbles failed to initialize", error);
        }
    }

    document.addEventListener("cv-education-visibility", (event) => {
        const detail = event && event.detail ? event.detail : {};

        if (!orbitScene) {
            return;
        }

        orbitScene.classList.toggle("is-education-hidden", !!detail.isVisible);
    });
})();
