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

        /* Swiper Dynamic Slider — handles all Bustar data attributes */
        /* Skip .rs-testimonial-slider-wrapper .swiper — handled by inline script */
        $('.rs-swiper .swiper, .swiper[data-item]').not('.rs-testimonial-slider-wrapper .swiper').each(function (index) {
            var $swiper = $(this);
            var loop = $swiper.data('loop') !== false;
            var autoplayData = $swiper.data('autoplay');
            var autoplay = autoplayData !== false && autoplayData !== 'false'
                ? { delay: ($swiper.data('delay') ? parseInt($swiper.data('delay')) : 3000), disableOnInteraction: false }
                : false;
            var slidesPerView = parseInt($swiper.data('item')) || 1;
            var margin = parseInt($swiper.data('margin') || $swiper.data('margin-xl') || 30);
            var effectVal = $swiper.data('effect');
            var effect = (effectVal && effectVal !== 'false') ? effectVal : 'slide';
            var speed = parseInt($swiper.data('speed')) || 700;

            var rsNavPrev = 'rs-nav-prev-' + index;
            var rsNavNext = 'rs-nav-next-' + index;
            $swiper.closest('.rs-swiper').find('.swiper-button-prev').addClass(rsNavPrev);
            $swiper.closest('.rs-swiper').find('.swiper-button-next').addClass(rsNavNext);
            var rsPagination = 'rs-pagination-' + index;
            $swiper.closest('.rs-swiper').find('.swiper-pagination').addClass(rsPagination);

            // Read all breakpoint values
            var itemXs  = parseInt($swiper.data('item-xs'))  || 1;
            var itemSm  = parseInt($swiper.data('item-sm'))  || itemXs;
            var itemMd  = parseInt($swiper.data('item-md'))  || 2;
            var itemLg  = parseInt($swiper.data('item-lg'))  || itemMd;
            var itemXl  = parseInt($swiper.data('item-xl'))  || itemLg;
            var marginXl = parseInt($swiper.data('margin-xl')) || margin;

            var swiper = new Swiper(this, {
                loop: loop,
                autoplay: autoplay,
                effect: effect,
                slidesPerView: itemXs,
                spaceBetween: margin,
                speed: speed,
                grabCursor: true,
                watchOverflow: false,
                pagination: { el: '.' + rsPagination, dynamicBullets: ($swiper.data('dots-dynamic') !== false), clickable: true },
                navigation: { nextEl: '.' + rsNavPrev, prevEl: '.' + rsNavNext },
                breakpoints: {
                    480:  { slidesPerView: itemXs, spaceBetween: margin },
                    576:  { slidesPerView: itemSm, spaceBetween: margin },
                    768:  { slidesPerView: itemMd, spaceBetween: margin },
                    992:  { slidesPerView: itemLg, spaceBetween: margin },
                    1200: { slidesPerView: itemXl, spaceBetween: marginXl },
                    1400: { slidesPerView: slidesPerView, spaceBetween: marginXl },
                }
            });
            if (autoplay) {
                $swiper.on('mouseenter', function () { if (swiper.autoplay) swiper.autoplay.stop(); })
                       .on('mouseleave', function () { if (swiper.autoplay) swiper.autoplay.start(); });
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
