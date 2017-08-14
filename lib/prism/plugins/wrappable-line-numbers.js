(function () {
    if (typeof self === "undefined" || !self.Prism || !self.document) {
        return;
    }

    Prism.hooks.add("complete", function (env) {
        if (!env.code) {
            return;
        }

        let pre = env.element.parentNode;
        if (pre == null
            || pre.tagName.toLowerCase() != "pre"
            || (!pre.classList.contains("wrappable-line-numbers") && !env.element.classList.contains("wrappable-line-numbers"))
            || env.element.querySelector(".wrappable-line-numbers-rows")) {
            return;
        }

        env.element.classList.remove("wrappable-line-numbers");
        pre.classList.add("wrappable-line-numbers");

        env.element.innerHTML = env.element.innerHTML
            .replace(/^/gm, "<span class=\"wrappable-line-numbers-rows\">")
            .replace(/\n|$/g, "</span>");

        if (pre.hasAttribute("data-start")) {
            pre.style.counterReset = "linenumber " + (pre.getAttribute("data-start") - 1);
        }
    });
}());
