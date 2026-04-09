(() => {
    var gsapApi = window.gsap;

    function whenDocumentReady() {
        if (document.readyState === "loading") {
            return new Promise((resolve) => {
                document.addEventListener("DOMContentLoaded", resolve, { once: true });
            });
        }

        return Promise.resolve();
    }

    function whenWindowLoaded() {
        if (document.readyState === "complete") {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            window.addEventListener("load", resolve, { once: true });
        });
    }

    async function startIndexSequence() {
        var bodySection;
        var loaderSection;

        await whenDocumentReady();

        bodySection = document.querySelector(".index-gallery");
        loaderSection = document.querySelector(".index-loading-section");

        if (!bodySection || !loaderSection || !gsapApi) {
            await whenWindowLoaded();
            await window.initIndexBody?.();
            return;
        }

        gsapApi.set(bodySection, { autoAlpha: 0 });
        gsapApi.set(loaderSection, { autoAlpha: 1 });

        await Promise.all([
            window.playIndexLoaderIn?.(),
            whenWindowLoaded()
        ]);

        await window.initIndexBody?.();
        await window.playIndexLoaderOut?.();

        await new Promise((resolve) => {
            gsapApi.to(bodySection, {
                autoAlpha: 1,
                duration: 0.8,
                ease: "power2.out",
                onComplete: resolve
            });
        });
    }

    startIndexSequence();
})();
