(function () {
    const section = document.getElementById("cv-intro");
    const gsapApi = window.gsap;

    if (!section) {
        return;
    }

    const title = section.querySelector(".title");
    const orbitScene = section.querySelector(".cv-intro-orbit-scene");
    const canUseGsap = !!gsapApi && typeof gsapApi.fromTo === "function";

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

    document.addEventListener("cv-education-visibility", (event) => {
        const detail = event && event.detail ? event.detail : {};

        if (!orbitScene) {
            return;
        }

        orbitScene.classList.toggle("is-education-hidden", !!detail.isVisible);
    });
})();
