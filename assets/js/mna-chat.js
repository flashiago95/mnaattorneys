/* MNA website assistant widget. Shown only when /api/chat reports it is configured. */
(function () {
    "use strict";

    var ENDPOINT = "/api/chat";
    var SUGGESTIONS = [
        "What services does MNA offer?",
        "Who are the directors?",
        "What does MNA Forensics do?",
        "Where are your offices?",
        "How do I book a consultation?"
    ];
    var history = []; // [{role, content}]
    var busy = false;

    function esc(s) {
        return s.replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    // Minimal, safe Markdown: links to site pages / mail / tel, bold, bullet lists, paragraphs.
    function render(md) {
        var out = [], list = null;
        esc(md).split(/\n/).forEach(function (line) {
            var t = line.trim();
            var item = /^[-*•]\s+(.*)/.exec(t);
            if (item) {
                if (!list) { list = []; }
                list.push(item[1]);
                return;
            }
            if (list) { out.push("<ul>" + list.map(function (i) { return "<li>" + inline(i) + "</li>"; }).join("") + "</ul>"); list = null; }
            if (t) out.push("<p>" + inline(t) + "</p>");
        });
        if (list) out.push("<ul>" + list.map(function (i) { return "<li>" + inline(i) + "</li>"; }).join("") + "</ul>");
        return out.join("");
    }
    function inline(s) {
        s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        return s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, text, href) {
            var ok = /^(mailto:|tel:|https:\/\/(www\.)?mnaattorneys\.co\.za|[a-z0-9-]+\.html(#[\w-]+)?(\?[\w=&%+.-]*)?$|#[\w-]+$)/i.test(href);
            return ok ? '<a href="' + href + '">' + text + "</a>" : text;
        });
    }

    function build() {
        var root = document.createElement("div");
        root.className = "mna-chat";
        root.innerHTML =
            '<button type="button" class="mna-chat-launch" aria-expanded="false" aria-controls="mnaChatPanel">' +
                '<i class="ri-chat-3-line" aria-hidden="true"></i><span>Ask MNA</span></button>' +
            '<section class="mna-chat-panel" id="mnaChatPanel" role="dialog" aria-label="Ask MNA" hidden>' +
                '<header class="mna-chat-head">' +
                    '<div><p class="mna-chat-title">Ask MNA</p><p class="mna-chat-sub">Answers about the firm, its services and people</p></div>' +
                    '<button type="button" class="mna-chat-close" aria-label="Close"><i class="ri-close-line"></i></button>' +
                '</header>' +
                '<div class="mna-chat-log" aria-live="polite"></div>' +
                '<div class="mna-chat-chips"></div>' +
                '<form class="mna-chat-form">' +
                    '<label class="mna-hp-label" for="mnaChatInput">Your question</label>' +
                    '<textarea id="mnaChatInput" rows="1" maxlength="1500" placeholder="Type your question…" required></textarea>' +
                    '<button type="submit" aria-label="Send"><i class="ri-send-plane-2-line"></i></button>' +
                '</form>' +
                '<p class="mna-chat-note">General information only, not legal advice. Using this chat does not create an attorney-client relationship, so please don\'t share confidential details. For your matter, <a href="contact.html">contact a director</a>.</p>' +
            '</section>';
        document.body.appendChild(root);

        var launch = root.querySelector(".mna-chat-launch");
        var panel = root.querySelector(".mna-chat-panel");
        var log = root.querySelector(".mna-chat-log");
        var chips = root.querySelector(".mna-chat-chips");
        var form = root.querySelector(".mna-chat-form");
        var input = root.querySelector("textarea");

        function open(state) {
            panel.hidden = !state;
            root.classList.toggle("is-open", state);
            launch.setAttribute("aria-expanded", String(state));
            if (state) setTimeout(function () { input.focus(); }, 50);
        }
        launch.addEventListener("click", function () { open(panel.hidden); });
        root.querySelector(".mna-chat-close").addEventListener("click", function () { open(false); launch.focus(); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) open(false); });

        function bubble(role, html) {
            var el = document.createElement("div");
            el.className = "mna-chat-msg mna-chat-msg--" + role;
            el.innerHTML = html;
            log.appendChild(el);
            log.scrollTop = log.scrollHeight;
            return el;
        }

        bubble("bot", render("Hello. I can answer questions about MNA Attorneys: our services, people, offices and how to get in touch. How can I help?"));
        SUGGESTIONS.forEach(function (q) {
            var b = document.createElement("button");
            b.type = "button";
            b.textContent = q;
            b.addEventListener("click", function () { ask(q); });
            chips.appendChild(b);
        });

        input.addEventListener("input", function () {
            input.style.height = "auto";
            input.style.height = Math.min(input.scrollHeight, 120) + "px";
        });
        input.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
        });
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var q = input.value.trim();
            if (q) ask(q);
        });

        function ask(q) {
            if (busy) return;
            busy = true;
            chips.hidden = true;
            input.value = "";
            input.style.height = "auto";
            bubble("user", "<p>" + esc(q) + "</p>");
            history.push({ role: "user", content: q });
            var el = bubble("bot", '<span class="mna-chat-typing"><i></i><i></i><i></i></span>');
            var text = "";

            fetch(ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history })
            }).then(function (res) {
                if (!res.ok || !res.body) {
                    return res.json().catch(function () { return {}; }).then(function (j) {
                        throw new Error(j.error || "unavailable");
                    });
                }
                var reader = res.body.getReader();
                var dec = new TextDecoder();
                var buf = "";
                function pump() {
                    return reader.read().then(function (r) {
                        if (r.done) return;
                        buf += dec.decode(r.value, { stream: true });
                        var lines = buf.split("\n");
                        buf = lines.pop();
                        lines.forEach(function (line) {
                            if (!line) return;
                            var ev;
                            try { ev = JSON.parse(line); } catch (err) { return; }
                            if (ev.reset) text = "";
                            if (ev.t) text += ev.t;
                            if (ev.replace) text = ev.replace;
                            if (ev.error) throw new Error(ev.error);
                            el.innerHTML = render(text || "…");
                            log.scrollTop = log.scrollHeight;
                        });
                        return pump();
                    });
                }
                return pump();
            }).then(function () {
                if (!text) throw new Error("empty");
                history.push({ role: "assistant", content: text });
            }).catch(function (err) {
                var msg = err && err.message && err.message.length > 20 ? err.message
                    : "Sorry, the assistant is unavailable right now. Please call 011 513 3387 or use the enquiry form.";
                el.innerHTML = render(msg.replace("enquiry form", "[enquiry form](contact.html)"));
                history.pop(); // let the visitor ask again
            }).then(function () {
                busy = false;
                input.focus();
            });
        }
    }

    function init() {
        fetch(ENDPOINT, { method: "GET" })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (j) { if (j && j.ready) build(); })
            .catch(function () { /* assistant not available: show nothing */ });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
