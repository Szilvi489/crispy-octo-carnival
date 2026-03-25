(function () {
    var experienceSection = document.getElementById("cv-experience");
    var skillsSection = document.getElementById("cv-skills");
    var gsapApi = window.gsap;
    var scrollTriggerApi = window.ScrollTrigger;
    var stackTrigger = null;

    if (
        !experienceSection ||
        !skillsSection ||
        !gsapApi ||
        !scrollTriggerApi ||
        typeof scrollTriggerApi.create !== "function"
    ) {
        return;
    }

    if (typeof gsapApi.registerPlugin === "function") {
        gsapApi.registerPlugin(scrollTriggerApi);
    }

    function createStackedTransition() {
        if (stackTrigger && typeof stackTrigger.kill === "function") {
            stackTrigger.kill();
        }

        stackTrigger = scrollTriggerApi.create({
            trigger: experienceSection,
            start: function () {
                if (experienceSection.offsetHeight < window.innerHeight) {
                    return "top top";
                }
                return "bottom bottom";
            },
            endTrigger: skillsSection,
            end: "top top",
            pin: true,
            pinSpacing: false,
            anticipatePin: 1,
            invalidateOnRefresh: true
        });
    }

    experienceSection.style.zIndex = "5";
    skillsSection.style.zIndex = "6";

    createStackedTransition();

    window.addEventListener("load", function () {
        if (scrollTriggerApi && typeof scrollTriggerApi.refresh === "function") {
            scrollTriggerApi.refresh();
        }
    });
})();
