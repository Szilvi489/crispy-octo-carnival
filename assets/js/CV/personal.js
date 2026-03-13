(function () {
    var cloudSources = [
        "/assets/images/CV/removedBackgroundImages/white-cloud-small.png",
        "/assets/images/CV/removedBackgroundImages/white-cloud2-small.png",
        "/assets/images/CV/removedBackgroundImages/white-cloud3-small.png",
        "/assets/images/CV/removedBackgroundImages/white-cloud4-small.png"
    ];
    var head = document.head || document.getElementsByTagName("head")[0];

    function preloadCloudSource(src) {
        var link;
        var preloadImage;

        if (head && !head.querySelector('link[data-cv-cloud-preload="' + src + '"]')) {
            link = document.createElement("link");
            link.rel = "preload";
            link.as = "image";
            link.href = src;
            link.setAttribute("data-cv-cloud-preload", src);
            head.appendChild(link);
        }

        preloadImage = new Image();
        preloadImage.decoding = "sync";
        preloadImage.fetchPriority = "high";
        preloadImage.src = src;
        if (typeof preloadImage.decode === "function") {
            preloadImage.decode().catch(function () {});
        }
    }

    cloudSources.forEach(preloadCloudSource);

    document.querySelectorAll(".cv-personal-prelude-cloud").forEach(function (cloud) {
        cloud.loading = "eager";
        cloud.decoding = "sync";
        cloud.fetchPriority = "high";
    });
})();
