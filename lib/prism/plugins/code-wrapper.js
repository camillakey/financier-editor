(function () {
    if (typeof self === "undefined" || !self.Prism || !self.document) {
        return;
    }

    Prism.hooks.add("complete", function (env) {
        if (!env.code) {
            return;
        }

        if (env.element.classList.contains("wrap")) {
            replace(env.element.firstChild);
            function replace(element) {
                for (let e = element; e != null; e = e.nextSibling) {
                    replace(e.firstChild);
                    if (e.nodeValue != null) {
                        e.nodeValue = e.nodeValue.replace(/ /g, "\u00a0");
                    }
                }
            }
        }
    });
}());