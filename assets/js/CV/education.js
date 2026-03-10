(function () {
    var wrapper = document.querySelector(".cv-horizontal-intro-education");
    var track = wrapper ? wrapper.querySelector(".cv-horizontal-track") : null;
    var gsapApi = window.gsap;
    var scrollTriggerApi = window.ScrollTrigger;

    if (!wrapper || !track || !gsapApi || !scrollTriggerApi || typeof gsapApi.to !== "function") {
        return;
    }

    if (typeof gsapApi.registerPlugin === "function") {
        gsapApi.registerPlugin(scrollTriggerApi);
    }

    gsapApi.to(track, {
        x: function () {
            return -(track.scrollWidth - window.innerWidth);
        },
        ease: "none",
        scrollTrigger: {
            trigger: wrapper,
            start: "top top",
            end: function () {
                return "+=" + (track.scrollWidth - window.innerWidth);
            },
            scrub: true,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
        }
    });
})();
