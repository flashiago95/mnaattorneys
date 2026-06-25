(function ($) {
    "use strict";

    /* Windows Load */
    $(window).on('load', function () {
        // Preloader
        $("#pre-load").delay(800).fadeOut(600);
        $(".pre-loader").delay(800).fadeOut(600);
        // WOW Animation
        wowAnimation();
    });

    /* Wow Active */
    function wowAnimation() {
        var wow = new WOW({
            boxClass: 'wow',
            animateClass: 'animated',
            offset: 0,
            mobile: false,
            live: true
        });
        wow.init();
    }

    /* Data Background */
    $("[data-background").each(function () {
        $(this).css("background-image", "url( " + $(this).attr("data-background") + "  )");
    });
    $("[data-bg-color]").each(function () {
        $(this).css("background-color", $(this).attr("data-bg-color"));
    });

    /* Odometer */
    $('.odometer').appear(function (e) {
        var odo = $(".odometer");
        odo.each(function () {
            var countNumber = $(this).attr("data-count");
            $(this).html(countNumber);
        });
    });

    $(document).ready(function () {

        /* Scroll progress & back to top */
        $(window).on("scroll", function () {
            var scrollTop = $(window).scrollTop();
            $(".progress-circle").css("stroke-dashoffset",
                113.1 - 113.1 * (scrollTop / ($(document).height() - $(window).height())));
            if (scrollTop > 150) {
                $(".backtotop-wrap").addClass("active-progress").fadeIn();
            } else {
                $(".backtotop-wrap").removeClass("active-progress").fadeOut();
            }
            // Sticky header
            if (scrollTop > 200) {
                $("#rs-sticky-header").addClass("active");
            } else {
                $("#rs-sticky-header").removeClass("active");
            }
        });

        $(".backtotop-wrap").on("click", function () {
            $("html,body").animate({ scrollTop: 0 }, 500);
        });

        /* Mobile Menu */
        $("#mobile-menu").meanmenu({
            meanMenuContainer: ".mobile-menu",
            meanScreenWidth: "1199",
            meanExpand: ['<i class="ri-add-large-line"></i>'],
        });

        /* Swiper Dynamic Slider */
        $('.rs-swiper .swiper').each(function (index) {
            var $swiper = $(this);
            var loop = $swiper.data('loop') === undefined ? true : $swiper.data('loop');
            var autoplay = $swiper.data('autoplay') === undefined ? true : $swiper.data('autoplay');
            var slidesPerView = $swiper.data('item');
            var margin = ($swiper.data('margin') ? $swiper.data('margin') : 30);
            var effect = $swiper.data('effect') || 'slide';
            var speed = $swiper.data('speed') || 500;

            var rsNavPrev = `rs-nav-prev-${index}`;
            var rsNavNext = `rs-nav-next-${index}`;
            $swiper.closest('.rs-swiper').find('.swiper-button-prev').addClass(rsNavPrev);
            $swiper.closest('.rs-swiper').find('.swiper-button-next').addClass(rsNavNext);
            var rsPagination = `rs-pagination-${index}`;
            $swiper.closest('.rs-swiper').find('.swiper-pagination').addClass(rsPagination);

            var swiper = new Swiper(this, {
                loop: loop,
                autoplay: autoplay,
                effect: effect,
                slidesPerView: (slidesPerView ? slidesPerView : 1),
                spaceBetween: margin,
                speed: speed,
                grabCursor: true,
                pagination: { el: `.${rsPagination}`, dynamicBullets: true, clickable: true },
                navigation: { nextEl: `.${rsNavPrev}`, prevEl: `.${rsNavNext}` },
                breakpoints: {
                    481:  { slidesPerView: ($swiper.data('item-xs') ? $swiper.data('item-xs') : 1), spaceBetween: margin },
                    576:  { slidesPerView: ($swiper.data('item-sm') ? $swiper.data('item-sm') : 1), spaceBetween: margin },
                    768:  { slidesPerView: ($swiper.data('item-md') ? $swiper.data('item-md') : 1), spaceBetween: margin },
                    992:  { slidesPerView: ($swiper.data('item-lg') ? $swiper.data('item-lg') : 1), spaceBetween: margin },
                    1201: { slidesPerView: (slidesPerView ? slidesPerView : 1), spaceBetween: margin },
                }
            });
            if (autoplay) {
                $swiper.on('mouseenter', function () { swiper.autoplay.stop(); })
                       .on('mouseleave', function () { swiper.autoplay.start(); });
            }
        });

        /* Smooth Scrolling — Lenis */
        if ($('.rs-smoother-yes').length) {
            const lenis = new Lenis({ smoothWheel: true, wheelMultiplier: 1.2, duration: 1.5, lerp: 0.1 });
            function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
            requestAnimationFrame(raf);
            document.querySelectorAll('a[href^="#"]').forEach((el) => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    const id = el.getAttribute('href')?.slice(1);
                    if (!id) return;
                    const target = document.getElementById(id);
                    if (target) { lenis.scrollTo(target); }
                });
            });
        }

        /* Footer year */
        var yearEl = document.getElementById("year");
        if (yearEl) { yearEl.innerHTML = new Date().getFullYear(); }

        /* Active menu item */
        const currentPath = window.location.pathname.split('/').pop();
        document.querySelectorAll('.multipage-menu a').forEach(link => {
            const linkPath = link.getAttribute('href');
            if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
                link.classList.add('active');
                let p = link.parentElement;
                while (p) { if (p.tagName === 'LI') p.classList.add('active'); p = p.parentElement; }
            }
        });
    });

})(jQuery);
