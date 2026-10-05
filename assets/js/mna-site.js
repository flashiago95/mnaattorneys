/* MNA Attorneys: enquiry forms and page helpers (no dependencies) */
(function () {
    "use strict";

    // Enquiries are relayed by FormSubmit to the address below. The first
    // submission triggers a one-time activation email to that inbox.
    var ENQUIRY_ENDPOINT = "https://formsubmit.co/ajax/info@mnaattorneys.co.za";
    var FALLBACK_EMAIL = "info@mnaattorneys.co.za";

    function setError(field, message) {
        var wrap = field.closest(".mna-field, .mna-consent");
        if (!wrap) return;
        wrap.classList.toggle("has-error", !!message);
        var slot = wrap.querySelector(".mna-field-error");
        if (slot) slot.textContent = message || "";
    }

    function validate(form) {
        var ok = true;
        form.querySelectorAll("[required]").forEach(function (field) {
            var message = "";
            if (field.type === "checkbox" && !field.checked) {
                message = "Please confirm so that we can respond to you.";
            } else if (field.type !== "checkbox" && !field.value.trim()) {
                message = "This field is required.";
            } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
                message = "Please enter a valid email address.";
            }
            setError(field, message);
            if (message && ok) { field.focus(); ok = false; }
        });
        return ok;
    }

    function mailtoFallback(data) {
        var body = Object.keys(data)
            .filter(function (k) { return k.charAt(0) !== "_"; })
            .map(function (k) { return k + ": " + data[k]; })
            .join("\n");
        return "mailto:" + FALLBACK_EMAIL +
            "?subject=" + encodeURIComponent(data._subject || "Website enquiry") +
            "&body=" + encodeURIComponent(body);
    }

    document.querySelectorAll("form.mna-js-enquiry").forEach(function (form) {
        var status = form.querySelector(".mna-form-status");
        var button = form.querySelector("button[type=submit]");
        var label = button ? button.innerHTML : "";

        form.querySelectorAll("input, select, textarea").forEach(function (field) {
            field.addEventListener("input", function () { setError(field, ""); });
            field.addEventListener("change", function () { setError(field, ""); });
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            status.className = "mna-form-status";
            status.textContent = "";
            if (!validate(form)) return;

            var data = {};
            new FormData(form).forEach(function (value, key) { data[key] = String(value).trim(); });
            if (data._honey) return; // bot trap
            data._subject = "Website enquiry: " + (data["Practice area"] || "General") + " (" + (data.Name || "") + ")";
            data._template = "table";

            button.disabled = true;
            button.textContent = "Sending…";

            fetch(ENQUIRY_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(data)
            })
                .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json }; }); })
                .then(function (r) {
                    if (!r.ok || String(r.json.success) !== "true") throw new Error("rejected");
                    form.reset();
                    status.classList.add("is-ok");
                    status.textContent = "Thank you. Your enquiry has reached our team and we will be in touch within one business day.";
                })
                .catch(function () {
                    status.classList.add("is-err");
                    status.innerHTML = "We couldn't send that just now. Please call 011 513 3387 or " +
                        "<a href=\"" + mailtoFallback(data) + "\">email your enquiry</a> instead.";
                })
                .finally(function () {
                    button.disabled = false;
                    button.innerHTML = label;
                });
        });
    });

    // Services page: highlight the practice area currently in view
    var indexLinks = document.querySelectorAll(".mna-practice-index a");
    if (indexLinks.length && "IntersectionObserver" in window) {
        var byId = {};
        indexLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                indexLinks.forEach(function (a) { a.classList.remove("is-current"); });
                var link = byId[entry.target.id];
                if (link) link.classList.add("is-current");
            });
        }, { rootMargin: "-30% 0px -60% 0px" });
        document.querySelectorAll(".mna-area[id]").forEach(function (s) { observer.observe(s); });
    }

    // Pre-select a practice area when arriving from a services link (?area=...)
    var area = new URLSearchParams(window.location.search).get("area");
    if (area) {
        document.querySelectorAll("select[name='Practice area']").forEach(function (sel) {
            Array.prototype.forEach.call(sel.options, function (opt) {
                if (opt.value === area) sel.value = area;
            });
        });
    }
})();

/* Press page: filter updates by type */
(function () {
    "use strict";
    var buttons = document.querySelectorAll(".mna-press-filters button");
    if (!buttons.length) return;
    var items = document.querySelectorAll(".mna-press-item");
    buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            var filter = btn.getAttribute("data-filter");
            buttons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
            items.forEach(function (item) {
                item.hidden = filter !== "all" && item.getAttribute("data-kind") !== filter;
            });
        });
    });
})();
