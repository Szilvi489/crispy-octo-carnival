(function () {
    var circle = document.querySelector(".contact-gradient-circle");
    var stage = document.querySelector(".contact-circle-stage");
    var section = document.querySelector(".contact-page-section");
    var form = section ? section.querySelector(".contact-form") : null;
    var titleContact = section ? section.querySelector(".titleP1") : null;
    var titleMe = section ? section.querySelector(".titleP2") : null;
    var formLines = section ? section.querySelectorAll(".contact-form > .row, .contact-form > .column") : [];
    var submitButton = section ? section.querySelector(".contact-submit-button") : null;
    var statusEl = section ? section.querySelector(".contact-form-status") : null;
    var gsapApi = window.gsap;
    var isSubmitting = false;

    function setStatus(message, type) {
        if (!statusEl) {
            return;
        }

        statusEl.textContent = message || "";
        statusEl.classList.remove("is-success", "is-error");

        if (type === "success") {
            statusEl.classList.add("is-success");
        } else if (type === "error") {
            statusEl.classList.add("is-error");
        }
    }

    function initAnimations() {
        var sunSpeed;
        var sinkRangePercent;
        var colorTarget;
        var timeline;
        var backgroundTimeline;

        if (!circle || !stage || !section || !gsapApi || typeof gsapApi.timeline !== "function") {
            return;
        }

        sunSpeed = 12;
        sinkRangePercent = 8;
        colorTarget = circle;
        timeline = gsapApi.timeline({
            repeat: -1,
            repeatDelay: 1.25,
            delay: 0.35
        });

        timeline.to(colorTarget, {
            "--sun-c1": "#f12808",
            "--sun-c2": "#d65708",
            "--sun-c3": "#1bee07",
            duration: sunSpeed,
            ease: "sine.inOut"
        });
        timeline.to(colorTarget, {
            "--sun-c1": "#d83b07",
            "--sun-c2": "#1dbb14",
            "--sun-c3": "#0f7b0b",
            duration: sunSpeed,
            ease: "sine.inOut"
        });
        timeline.to(colorTarget, {
            "--sun-c1": "#c84f07",
            "--sun-c2": "#1bee07",
            "--sun-c3": "#18a006",
            duration: sunSpeed,
            ease: "sine.inOut"
        });
        timeline.to(colorTarget, {
            "--sun-c1": "#f12808",
            "--sun-c2": "#cf5d09",
            "--sun-c3": "#1bee07",
            duration: sunSpeed,
            ease: "sine.inOut"
        });

        backgroundTimeline = gsapApi.timeline({
            repeat: -1,
            yoyo: true,
            defaults: { duration: 18, ease: "sine.inOut" }
        });

        backgroundTimeline
            .to(section, {
                "--bg-c1": "#f12808",
                "--bg-c2": "#1f4cbc",
                "--bg-c3": "#043494",
                "--bg-x": "18%",
                "--bg-y": "30%"
            })
            .to(section, {
                "--bg-c1": "#cc330a",
                "--bg-c2": "#043494",
                "--bg-c3": "#1bee07",
                "--bg-x": "84%",
                "--bg-y": "68%"
            })
            .to(section, {
                "--bg-c1": "#f12808",
                "--bg-c2": "#c63a0a",
                "--bg-c3": "#043494",
                "--bg-x": "50%",
                "--bg-y": "50%"
            });

        gsapApi.to(stage, {
            yPercent: sinkRangePercent,
            duration: 90,
            ease: "none",
            yoyo: true,
            repeat: -1
        });

        if (titleContact) {
            gsapApi.from(titleContact, {
                duration: 1.05,
                y: function () { return -(window.innerHeight * 0.55); },
                opacity: 0,
                ease: "expo.out",
                delay: 0.18,
                clearProps: "transform,opacity"
            });
        }

        if (titleMe) {
            gsapApi.from(titleMe, {
                duration: 1.05,
                y: function () { return window.innerHeight * 0.55; },
                opacity: 0,
                ease: "expo.out",
                delay: 0.24,
                clearProps: "transform,opacity"
            });
        }

        if (formLines.length) {
            var typingTimeline = gsapApi.timeline({ delay: 0.55 });
            var secondsPerChar = 0.018;

            if (submitButton) {
                gsapApi.set(submitButton, { autoAlpha: 0, y: 10 });
            }

            formLines.forEach(function (line) {
                var lineTexts = line.querySelectorAll(".contact-text");
                var lineControls = line.querySelectorAll(".contact-input");

                if (lineControls.length) {
                    gsapApi.set(lineControls, { autoAlpha: 0, y: 10 });
                }

                lineTexts.forEach(function (block) {
                    var fullText = (block.textContent || "").trim();
                    var progress;
                    if (!fullText) {
                        return;
                    }

                    block.textContent = "";
                    progress = { count: 0 };

                    typingTimeline.to(progress, {
                        count: fullText.length,
                        duration: Math.max(0.2, fullText.length * secondsPerChar),
                        ease: "none",
                        onUpdate: function () {
                            block.textContent = fullText.slice(0, Math.floor(progress.count));
                        }
                    });
                });

                if (lineControls.length) {
                    typingTimeline.to(lineControls, {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.22,
                        stagger: 0.06,
                        ease: "power2.out",
                        clearProps: "transform,opacity,visibility"
                    });
                }
            });

            if (submitButton) {
                typingTimeline.to(submitButton, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.24,
                    ease: "power2.out",
                    clearProps: "transform,opacity,visibility"
                });
            }

            return;
        }

        if (section) {
            var formTextBlocks = section.querySelectorAll(".contact-form .contact-text");
            if (!formTextBlocks.length) {
                return;
            }

            var fallbackTypingTimeline = gsapApi.timeline({ delay: 0.55 });
            var fallbackSecondsPerChar = 0.018;

            formTextBlocks.forEach(function (block) {
                var fullText = (block.textContent || "").trim();
                var progress;
                if (!fullText) {
                    return;
                }

                block.textContent = "";
                progress = { count: 0 };

                fallbackTypingTimeline.to(progress, {
                    count: fullText.length,
                    duration: Math.max(0.2, fullText.length * fallbackSecondsPerChar),
                    ease: "none",
                    onUpdate: function () {
                        block.textContent = fullText.slice(0, Math.floor(progress.count));
                    }
                });
            });
        }
    }

    function initFormSubmission() {
        if (!form || !submitButton) {
            return;
        }

        form.addEventListener("submit", function (event) {
            var formData;
            var nameValue;
            var emailValue;
            var reasonValue;
            var messageValue;

            event.preventDefault();

            if (isSubmitting) {
                return;
            }

            formData = new FormData(form);
            nameValue = String(formData.get("name") || "").trim();
            emailValue = String(formData.get("email") || "").trim();
            reasonValue = String(formData.get("reason") || "").trim();
            messageValue = String(formData.get("message") || "").trim();

            if (!nameValue || !emailValue || !reasonValue || !messageValue) {
                setStatus("Please fill in your name, email, reason, and message.", "error");
                return;
            }

            isSubmitting = true;
            submitButton.disabled = true;
            submitButton.textContent = "Sending...";
            setStatus("Sending your message...", null);

            window.fetch(form.action, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                },
                body: formData
            })
                .then(function (response) {
                    return response.json()
                        .catch(function () {
                            return {};
                        })
                        .then(function (payload) {
                            return {
                                ok: response.ok,
                                payload: payload
                            };
                        });
                })
                .then(function (result) {
                    var message = result.payload && result.payload.message
                        ? result.payload.message
                        : "Something went wrong. Please try again.";

                    if (!result.ok || !result.payload || result.payload.ok !== true) {
                        throw new Error(message);
                    }

                    form.reset();
                    setStatus(message, "success");
                })
                .catch(function (error) {
                    setStatus(
                        error && error.message ? error.message : "Something went wrong. Please try again.",
                        "error"
                    );
                })
                .finally(function () {
                    isSubmitting = false;
                    submitButton.disabled = false;
                    submitButton.textContent = "Send Message";
                });
        });
    }

    initAnimations();
    initFormSubmission();
})();
