(function ($) {
    "use strict";

    $(window).on("load", function () {
        gsap_rs_split_text();
        gsap_rs_scrollRotate();
        gsap_rs_MoveOnScroll();
        gsap_rs_custom_cursor();
        gsap_rs_image_reveal();
        gsap_rs_counter_anim();
        gsap_rs_stagger_cards();
    });

    // Split Text — char-by-char entrance
    function gsap_rs_split_text() {
        setTimeout(function () {
            var els = $("body:not(.rtl) .rs-split-text-enable");
            if (els.length === 0) return;
            gsap.registerPlugin(SplitText, ScrollTrigger);
            els.each(function (index, element) {
                var split = new SplitText(element, { type: "chars, words" });
                gsap.set(element, { perspective: 400 });

                if ($(element).hasClass("split-in-up")) {
                    gsap.set(split.chars, { opacity: 0, y: "30", ease: "circ.out" });
                }
                if ($(element).hasClass("split-in-fade")) {
                    gsap.set(split.chars, { opacity: 0, ease: "Back.easeOut" });
                }
                if ($(element).hasClass("split-in-right")) {
                    gsap.set(split.chars, { opacity: 0, x: "20", ease: "Back.easeOut" });
                }
                if ($(element).hasClass("split-in-rotate")) {
                    gsap.set(split.chars, { opacity: 0, rotateX: "50deg", ease: "circ.out" });
                }

                element.anim = gsap.to(split.chars, {
                    scrollTrigger: {
                        trigger: element,
                        toggleActions: "restart pause resume reverse",
                        start: "top 90%"
                    },
                    x: "0", y: "0", rotateX: "0", scale: 1, opacity: 1,
                    duration: 0.8, stagger: 0.025
                });
            });
        }, 200);
    }

    // Rotate on Scroll
    function gsap_rs_scrollRotate() {
        gsap.registerPlugin(ScrollTrigger);
        document.querySelectorAll('.gsap-rotate').forEach((element) => {
            let cls = element.className.match(/to-(\d+)/);
            let val = cls ? parseInt(cls[1]) : 360;
            gsap.to(element, {
                rotation: val * 0.2,
                scrollTrigger: { trigger: element, start: 'top 90%', end: 'bottom', scrub: 1 }
            });
        });
        document.querySelectorAll('.gsap-rotate-anti').forEach((element) => {
            let cls = element.className.match(/to-(\d+)/);
            let val = cls ? parseInt(cls[1]) : 360;
            gsap.to(element, {
                rotation: -(val * 0.2),
                scrollTrigger: { trigger: element, start: 'top 90%', end: 'bottom', scrub: 1 }
            });
        });
    }

    // Parallax Move on Scroll
    function gsap_rs_MoveOnScroll() {
        gsap.registerPlugin(ScrollTrigger);
        document.querySelectorAll('.gsap-move').forEach((element) => {
            let dir = element.className.match(/(?:^|\s)(left|right|up|down)(?:-(\d+))?(?:\s|$)/);
            let direction = dir ? dir[1] : 'up';
            let val = dir && dir[2] ? parseFloat(dir[2]) : 60;
            let props = {};
            if (direction === 'up')    props = { y: -val };
            if (direction === 'down')  props = { y:  val };
            if (direction === 'left')  props = { x: -val };
            if (direction === 'right') props = { x:  val };
            gsap.to(element, {
                ...props,
                scrollTrigger: { trigger: element, start: 'top 90%', scrub: 1.7 }
            });
        });
    }

    // Image Reveal (clip-path wipe) — safe version
    function gsap_rs_image_reveal() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);
        setTimeout(() => {
            document.querySelectorAll(".rs-image.scroll_reveal").forEach((wrapper) => {
                let image = wrapper.querySelector("img");
                if (!image) return;
                let dir = wrapper.getAttribute('data-dir') || '';
                wrapper.classList.add("reveal-active");
                let fromClip = dir === 'reveal_right' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
                let tl = gsap.timeline({
                    scrollTrigger: { trigger: wrapper, start: "top 85%", once: true }
                });
                tl.fromTo(wrapper,
                    { clipPath: fromClip },
                    { clipPath: 'inset(0 0% 0 0%)', duration: 1, ease: 'power2.out' }
                ).fromTo(image,
                    { scale: 1.12 },
                    { scale: 1, duration: 1, ease: 'power2.out' }, '-=1'
                );
            });
        }, 300);
    }

    // Counter animation (odometer-style)
    function gsap_rs_counter_anim() {
        gsap.registerPlugin(ScrollTrigger);
        document.querySelectorAll('.rs-counter-number').forEach(el => {
            const target = parseInt(el.getAttribute('data-target') || el.innerText, 10);
            gsap.fromTo(el, { innerText: 0 }, {
                innerText: target,
                duration: 2.5,
                ease: "power2.out",
                snap: { innerText: 1 },
                scrollTrigger: { trigger: el, start: "top 85%", once: true },
                onUpdate: function () { el.innerText = Math.ceil(this.targets()[0].innerText); }
            });
        });
    }

    // Stagger card entrances — use fromTo so elements are visible if GSAP doesn't fire
    function gsap_rs_stagger_cards() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);
        document.querySelectorAll('.gsap-stagger-parent').forEach(parent => {
            const cards = parent.querySelectorAll('.gsap-stagger-child');
            if (!cards.length) return;
            gsap.fromTo(cards,
                { opacity: 0, y: 40 },
                {
                    opacity: 1, y: 0, duration: 0.65, stagger: 0.1,
                    ease: "power3.out",
                    scrollTrigger: { trigger: parent, start: "top 85%", once: true }
                }
            );
        });
    }

    // Custom cursor
    function gsap_rs_custom_cursor() {
        var cursorBall = document.getElementById("cursor-ball");
        if (!cursorBall) return;
        let mouse = { x: 0, y: 0 }, pos = { x: 0, y: 0 }, ratio = 0.15;
        gsap.set(cursorBall, { xPercent: -50, yPercent: -50 });
        document.addEventListener("mousemove", function (e) {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        gsap.ticker.add(function () {
            pos.x += (mouse.x - pos.x) * ratio;
            pos.y += (mouse.y - pos.y) * ratio;
            gsap.set(cursorBall, { x: pos.x, y: pos.y });
        });
        $("a, button").on("mouseenter", function () {
            gsap.to(cursorBall, { scale: 1.8, opacity: 0.15, duration: 0.3 });
        }).on("mouseleave", function () {
            gsap.to(cursorBall, { scale: 1, opacity: 1, duration: 0.3 });
        });
    }

})(jQuery);
