"use strict";

(function () {
    class Utility {
        static inputFile(callback) {
            let input = document.createElement("input");
            input.type = "file";
            input.addEventListener("change", function () { callback(this.files[0]); });
            input.click();
        }

        static download(object, name) {
            let objectURL = window.URL.createObjectURL(object);
            let a = document.createElement("a");
            a.download = name;
            a.href = objectURL;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(objectURL);
            document.body.removeChild(a);
        }

        static blobToDataURL(blob, callback) {
            let reader = new FileReader();
            reader.addEventListener("load", function () { callback(this.result); });
            reader.readAsDataURL(blob);
        }

        static dataURLtoBlob(dataURL) {
            let byteString = atob(dataURL.split(",")[1]);
            let mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
            let arrayBuffer = new ArrayBuffer(byteString.length);
            let uInt8Array = new Uint8Array(arrayBuffer);
            for (let i = 0; i < byteString.length; i++) {
                uInt8Array[i] = byteString.charCodeAt(i);
            }
            return new Blob([new DataView(arrayBuffer)], { type: mimeString });
        }

        static generateUuid() {
            let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
            for (let i = 0, len = chars.length; i < len; i++) {
                switch (chars[i]) {
                    case "x":
                        chars[i] = Math.floor(Math.random() * 16).toString(16);
                        break;
                    case "y":
                        chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                        break;
                }
            }
            return chars.join('');
        }
    }

    class ElementExtension {
        static apply(element) {
            ElementExtension.applyDispatchStandardEvent(element);
        }

        static applyDispatchStandardEvent(element) {
            element.dispatchStandardEvent = function (eventType) {
                let event = document.createEvent("Event");
                event.initEvent(eventType, false, true);
                element.dispatchEvent(event);
            };
        }
    }

    class TextareaExtension {
        static apply(textarea) {
            ElementExtension.apply(textarea);
            TextareaExtension.applyModifyEvent(textarea);
            TextareaExtension.applyHistory(textarea);
        }

        static applyModifyEvent(textarea) {
            textarea.addEventListener("modify", function () {
                textarea.dispatchStandardEvent("keydown");
                textarea.dispatchStandardEvent("keypress");
                textarea.dispatchStandardEvent("keyup");
            });
        }

        static applyHistory(textarea) {
            let history = [textarea.value];
            let historyIndex = 0;
            let timeout = 1000;
            let timeoutID = 0;

            textarea.addEventListener("keydown", function (event) {
                if (event.ctrlKey && event.key == "z") {
                    undo();
                    event.stopPropagation();
                    event.preventDefault();
                } else if (event.ctrlKey && event.key == "Z"
                    || event.ctrlKey && event.key == "y") {
                    redo();
                    event.stopPropagation();
                    event.preventDefault();
                }
            });

            textarea.addEventListener("keyup", function (event) {
                window.clearTimeout(timeoutID);
                timeoutID = window.setTimeout(updateHistory, timeout);
            });

            function undo() {
                updateHistory();
                if (historyIndex > 0) {
                    historyIndex--;
                    textarea.value = history[historyIndex];
                }
            }

            function redo() {
                updateHistory();
                if (historyIndex < history.length - 1) {
                    historyIndex++;
                    textarea.value = history[historyIndex];
                }
            }

            function updateHistory() {
                if (history[historyIndex] != textarea.value) {
                    historyIndex++;
                    history[historyIndex] = textarea.value;
                    history = history.slice(0, historyIndex + 1);
                }
            }
        }
    }

    class EventTarget {
        constructor() {
            this.listeners_ = {};
        }

        addEventListener(type, callback) {
            if (!(type in this.listeners_)) {
                this.listeners_[type] = [];
            }
            this.listeners_[type].push(callback);
        }

        removeEventListener(type, callback) {
            if (!(type in this.listeners_)) {
                return;
            }
            let stack = this.listeners_[type];
            for (let i = 0, l = stack.length; i < l; i++) {
                if (stack[i] === callback) {
                    stack.splice(i, 1);
                    return this.removeEventListener(type, callback);
                }
            }
        }

        dispatchEvent(event) {
            if (!(event.type in this.listeners_)) {
                return;
            }
            let stack = this.listeners_[event.type];
            for (let i = 0, l = stack.length; i < l; i++) {
                stack[i].call(this, event);
            }
        }

        dispatchStandardEvent(eventType) {
            let event = document.createEvent("Event");
            event.initEvent(eventType, false, true);
            this.dispatchEvent(event);
        }
    }

    class ObjectEventTarget extends EventTarget {
        constructor(value = null) {
            super();
            this.value_ = value;
        }

        getValue() {
            return this.value_;
        }

        setValue(value) {
            this.value_ = value;
            this.dispatchStandardEvent("modify");
        }
    }

    class MarkdownParser {
        constructor() {
        }

        parse(string) {
            return this.postrender(this.render(this.prerender(string)));
        }

        prerender(string) {
            return string;
        }

        render(string) {
            return marked(string, { renderer: this.renderer() });
        }

        renderer() {
            let renderer = new marked.Renderer();

            renderer.code = function (code, language) {
                let array = /(\w+)?(?:\[(line-numbers)(?:\/(-?\d+))?\])?/.exec(language != null ? language : "");
                return "<pre"
                    + (array[2] != null ? " class=\"wrappable-line-numbers\"" : "")
                    + (array[3] != null ? " data-start=\"" + array[3] + "\"" : "")
                    + ">"
                    + "<code"
                    + (array[1] != null ? " class=\"wrap language-" + array[1] + "\"" : " class=\"wrap language-none\"")
                    + ">"
                    + code.replace(/</g, "&lt;")
                    + "</code>"
                    + "</pre>";
            };

            renderer.heading = function (text, level) {
                let array = /^(?:(#[A-Za-z0-9_-]+)?((?:\.[A-Za-z0-9_-]+)*) +)?(.*)/.exec(text);
                return "<h" + level
                    + (array[1] != null ? " id=\"" + array[1].substring(1) + "\"" : "")
                    + (array[2] != null ? " class=\"" + array[2].substring(1).replace(".", " ") + "\"" : "")
                    + ">"
                    + (array[3] != null ? array[3] : "")
                    + "</h" + level + ">";
            };

            renderer.paragraph = function (text) {
                let array = /^\| +(?:(#[A-Za-z0-9_-]+)?((?:\.[A-Za-z0-9_-]+)*) +)?([^\n]+)\n?((?:.+\n?)*)/.exec(text);
                if (array == null) {
                    return "<p>" + text + "</p>\n";
                } else {
                    return "<figure data-is-clean"
                        + (array[1] != null ? " id=\"" + array[1].substring(1) + "\"" : "")
                        + (array[2] != null ? " class=\"" + array[2].substring(1).replace(".", " ") + "\"" : "")
                        + "><figcaption>"
                        + array[3]
                        + "</figcaption>"
                        + "</figure>"
                        + marked(array[4]);
                }
            }

            renderer.codespan = function (code) {
                return "<code class=\"wrap language-none\">" + code + "</code>"
            }

            return renderer;
        }

        postrender(string) {
            let wrapper = document.createElement("div");
            wrapper.innerHTML = string;

            (function () {
                for (let element of wrapper.querySelectorAll("pre")) {
                    let figure = previousFigure(element, function (figure) {
                        if (figure.dataset.isClean == "" || figure.dataset.isCode == "") {
                            delete figure.dataset.isClean;
                            figure.dataset.isCode = "";
                            return false;
                        } else {
                            return true;
                        }
                    });
                    figure.dataset.isCode = "";
                    figure.appendChild(element);
                    Prism.highlightElement(element.querySelector("code"));
                }

                for (let element of wrapper.querySelectorAll("figure[data-is-code]")) {
                    delete element.dataset.isCode;
                }

                for (let element of wrapper.querySelectorAll("table")) {
                    previousFigure(element).appendChild(element);
                }

                for (let element of wrapper.querySelectorAll("p")) {
                    if (element.querySelector(":not(img)") == null
                        && /^\n*$/.test(element.textContent)) {
                        let figure = previousFigure(element);
                        let figcaption = figure.querySelector("figcaption");
                        for (let img of element.querySelectorAll("img")) {
                            figure.insertBefore(img, figcaption);
                        }
                        element.remove();
                    }
                }

                function previousFigure(element, filter = function (figure) {
                    if (figure.dataset.isClean == "") {
                        delete figure.dataset.isClean;
                        return false;
                    } else {
                        return true;
                    }
                }) {
                    let figure = element.previousElementSibling;
                    if (figure == null
                        || figure.tagName.toLowerCase() != "figure"
                        || filter(figure)) {
                        figure = document.createElement("figure");
                        element.parentElement.insertBefore(figure, element);
                    }
                    return figure;
                }
            })();

            (function () {
                let header = [];
                let caption = {
                    code: { total: 0, headerTotal: [], header: [] },
                    table: { total: 0, headerTotal: [], header: [] },
                    image: { total: 0, headerTotal: [], header: [] },
                };

                for (let element of wrapper.children) {
                    if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(element.tagName.toLowerCase())) {
                        updateHeader(element);
                    } else if (element.tagName.toLowerCase() == "figure"
                        && element.querySelector("figcaption") != null) {
                        if (element.querySelector("pre") != null) {
                            updateCaption(element, "code");
                        } else if (element.querySelector("table") != null) {
                            updateCaption(element, "table");
                        } else if (element.querySelector("img") != null) {
                            updateCaption(element, "image");
                        }
                    }
                }

                function updateHeader(element) {
                    header = header.concat([0, 0, 0, 0, 0, 0]).slice(0, element.tagName.toLowerCase().substring(1));
                    header[header.length - 1]++;
                    element.dataset["header"] = "";
                    for (let i = 0; i < header.length; i++) {
                        element.dataset["h" + (i + 1)] = header[i];
                    }
                }

                function updateCaption(element, target) {
                    let figcaption = element.querySelector("figcaption");
                    for (let i = 0, headerUpdated = false; i < header.length; i++) {
                        if (caption[target].header[i] != header[i] || headerUpdated) {
                            caption[target].header[i] = header[i];
                            caption[target].headerTotal[i] = 0;
                            headerUpdated = true;
                        }
                    }

                    caption[target].header = caption[target].header.slice(0, header.length);
                    caption[target].headerTotal = caption[target].headerTotal.slice(0, header.length);

                    caption[target].total++;
                    for (let i = 0; i < header.length; i++) {
                        caption[target].headerTotal[i]++;
                    }

                    figcaption.dataset[target] = "";
                    figcaption.dataset["total"] = caption[target].total;
                    for (let i = 0; i < header.length; i++) {
                        figcaption.dataset["h" + (i + 1)] = header[i];
                        figcaption.dataset["h" + (i + 1) + "Total"] = caption[target].headerTotal[i];
                    }
                }
            })();

            (function () {
                for (let element of wrapper.querySelectorAll("a[href^=\"#\"]")) {
                    let target = wrapper.querySelector(element.getAttribute("href"));
                    if (target != null) {
                        if (target.tagName.toLowerCase() == "figure") {
                            target = target.querySelector("figcaption");
                        }

                        for (let key of Object.keys(target.dataset)) {
                            element.dataset[key] = target.dataset[key];
                        }
                    }
                }
            })();

            return wrapper.innerHTML;
        }
    }

    class FinancierData extends EventTarget {
        constructor() {
            super();

            this.properties_ = {};
            for (let key of this.objectEventTargetProperties_()) {
                this.properties_[key] = new ObjectEventTarget("");
            }

            for (let key of this.financierDataResourcesProperties_()) {
                this.properties_[key] = new FinancierData.Resources();
            }
        }

        objectEventTargetProperties_() {
            return ["name", "markdown", "css"];
        }

        financierDataResourcesProperties_() {
            return ["resources"];
        }

        loadFromObject(object) {
            this.destroy();

            let reader = new FileReader();
            reader.addEventListener("load", loaded.bind(this));
            reader.readAsText(object);

            function loaded() {
                let jsonObject = JSON.parse(reader.result);

                for (let key of this.financierDataResourcesProperties_()) {
                    for (let uuid of Object.keys(jsonObject[key])) {
                        this.properties_[key].addFromDataURL(jsonObject[key][uuid], uuid);
                    }
                }

                for (let key of this.objectEventTargetProperties_()) {
                    this.properties_[key].setValue(jsonObject[key] || "");
                }

                this.dispatchStandardEvent("load");
            }
        }

        toObject() {
            let jsonObject = {};

            for (let key of this.objectEventTargetProperties_()) {
                jsonObject[key] = this.properties_[key].getValue();
            }

            for (let key of this.financierDataResourcesProperties_()) {
                jsonObject[key] = {};
                for (let uuid of Object.keys(this.properties_[key].getAll())) {
                    jsonObject[key][uuid] = this.properties_[key].get(uuid).getDataURL();
                }
            }

            return new Blob([JSON.stringify(jsonObject)], { type: "application/json" });
        }

        destroy() {
            for (let key of this.objectEventTargetProperties_()) {
                this.properties_[key].setValue("");
            }

            for (let key of this.financierDataResourcesProperties_()) {
                this.properties_[key].removeAll();
            }

            this.dispatchEvent("destroy");
        }

        getProperty(key) {
            return this.properties_[key];
        }
    }

    FinancierData.Resources = class extends EventTarget {
        constructor() {
            super();
            this.resources_ = {};
        }

        addFromObject(object, uuid = Utility.generateUuid()) {
            this.resources_[uuid] = FinancierData.Resources.Resource.createFromObject(object);
            this.dispatchStandardEvent("modify");
            return uuid;
        }

        addFromDataURL(dataURL, uuid = Utility.generateUuid()) {
            this.resources_[uuid] = FinancierData.Resources.Resource.createFromDataURL(dataURL);
            this.dispatchStandardEvent("modify");
            return uuid;
        }

        get(uuid) {
            return this.resources_[uuid];
        }

        getAll() {
            return this.resources_;
        }

        remove(uuid) {
            if (this.resources_[uuid] != null) {
                this.resources_[uuid].destroy();
                delete this.resources_[uuid];
                this.dispatchStandardEvent("modify");
            }
        }

        removeAll() {
            for (let uuid of Object.keys(this.resources_)) {
                this.remove(uuid);
            }
        }
    }

    FinancierData.Resources.Resource = class {
        constructor() {
            this.object_ = null;
            this.objectURL_ = null;
            this.dataURL_ = null;
        }

        static createFromObject(object) {
            let resource = new FinancierData.Resources.Resource();
            resource.object_ = object;
            resource.objectURL_ = window.URL.createObjectURL(resource.object_);
            Utility.blobToDataURL(resource.object_, function (dataURL) { resource.dataURL_ = dataURL; });
            return resource;
        }

        static createFromDataURL(dataURL) {
            let resource = new FinancierData.Resources.Resource();
            resource.object_ = Utility.dataURLtoBlob(dataURL);
            resource.objectURL_ = window.URL.createObjectURL(resource.object_);
            resource.dataURL_ = dataURL;
            return resource;
        }

        destroy() {
            window.URL.revokeObjectURL(this.objectURL_);
        }

        getObject() {
            return this.object_;
        }

        getObjectURL() {
            return this.objectURL_;
        }

        getDataURL() {
            return this.dataURL_;
        }
    }

    class FinancierMarkdownParser extends MarkdownParser {
        constructor(financierData) {
            super();
            this.financierData_ = financierData;

            this.renderer_ = super.renderer();
            this.renderer_.image = function (href, title, text) {
                return "<img src=\""
                    + (this.financierData_.getProperty("resources").get(href) != null
                        ? this.financierData_.getProperty("resources").get(href).getObjectURL() : href) + "\""
                    + (title != null ? " title=\"" + title + "\"" : "")
                    + (text != null ? " alt=\"" + text + "\"" : "") + ">";
            }.bind(this);
        }

        renderer() {
            return this.renderer_;
        }
    }

    class FinancierElements extends EventTarget {
        constructor() {
            super();

            this.elements_ = {};
            window.addEventListener("DOMContentLoaded", this.loadElements_.bind(this));
        }

        loadElements_() {
            this.elements_["head.style"] = document.querySelector("head style");

            this.elements_["files.import.button"] = document.querySelector("#financier-information__import");
            this.elements_["files.export.button"] = document.querySelector("#financier-information__export");
            this.elements_["files.print.button"] = document.querySelector("#financier-information__print");

            this.elements_["field.name.textarea"] = document.querySelector("#financier-information-name__textarea");
            this.elements_["field.markdown.textarea"] = document.querySelector("#financier-main__textarea");
            this.elements_["field.css.textarea"] = document.querySelector("#financier-css__textarea");

            this.elements_["resources.div"] = document.querySelector("#financier-resources div");

            this.elements_["preview.main"] = document.querySelector(".financier-preview .financier");

            this.dispatchStandardEvent("load");
        }

        modify(key, operation) {
            let args = Array.prototype.slice.call(arguments, 2);

            switch (key) {
                case "resources.div":
                    this.modifyResourcesDiv_(operation, args);
                    break;
            }
        }

        modifyResourcesDiv_(operation, args) {
            switch (operation) {
                case "append":
                    let identifier = args[0];
                    let overviewImgSrcURL = args[1];
                    let overviewClick = args[2];
                    let closeClick = args[3];

                    let resource = document.createElement("div");
                    resource.className = "financier-resources__resource mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet";
                    resource.dataset.identifier = identifier;
                    this.elements_["resources.div"].appendChild(resource);

                    let overview = document.createElement("button");
                    overview.className = "financier-resources__resource-overview mdl-button mdl-js-button";
                    overview.addEventListener("click", function () { overviewClick(identifier); });
                    resource.appendChild(overview);

                    let overviewImg = document.createElement("img");
                    overviewImg.src = overviewImgSrcURL;
                    overview.appendChild(overviewImg);

                    let close = document.createElement("button");
                    close.className = "financier-resources__resource-close mdl-button mdl-js-button mdl-button--icon";
                    close.addEventListener("click", function () { closeClick(identifier); });
                    resource.appendChild(close);

                    let closeIcon = document.createElement("i");
                    closeIcon.className = "material-icons";
                    closeIcon.innerHTML = "close";
                    close.appendChild(closeIcon);

                    break;
                case "removeAll":
                    while (this.elements_["resources.div"].firstChild) {
                        this.elements_["resources.div"].removeChild(this.elements_["resources.div"].firstChild);
                    }
                    break;
            }
        }

        select(key) {
            return this.elements_[key];
        }
    }

    let financierData = new FinancierData();
    let financierMarkdownParser = new FinancierMarkdownParser(financierData);
    let financierElements = new FinancierElements();

    financierData.addEventListener("load", function () {
        financierElements.select("field.name.textarea").value = financierData.getProperty("name").getValue();
        financierElements.select("field.markdown.textarea").value = financierData.getProperty("markdown").getValue();
        financierElements.select("field.css.textarea").value = financierData.getProperty("css").getValue();

        financierElements.select("field.name.textarea").dispatchStandardEvent("modify");
        financierElements.select("field.markdown.textarea").dispatchStandardEvent("modify");
        financierElements.select("field.css.textarea").dispatchStandardEvent("modify");
    });

    financierData.getProperty("markdown").addEventListener("modify", function () {
        financierElements.select("preview.main").innerHTML =
            financierMarkdownParser.parse(financierData.getProperty("markdown").getValue());
    });

    financierData.getProperty("css").addEventListener("modify", function () {
        financierElements.select("head.style").innerHTML = financierData.getProperty("css").getValue();
    });

    financierData.getProperty("resources").addEventListener("modify", function () {
        financierElements.modify("resources.div", "removeAll");
        for (let uuid of Object.keys(financierData.getProperty("resources").getAll())) {
            financierElements.modify("resources.div", "append",
                uuid, financierData.getProperty("resources").get(uuid).getObjectURL(), overviewClick, closeClick);
        }

        function overviewClick(identifier) {
            let markdown = "![](" + identifier + ")";
            let textarea = financierElements.select("field.markdown.textarea");
            textarea.value = textarea.value.substring(0, textarea.selectionStart)
                + markdown + textarea.value.substring(textarea.selectionEnd);
            textarea.dispatchStandardEvent("modify");
        }

        function closeClick(identifier) {
            financierData.getProperty("resources").remove(identifier);
        }
    });

    financierElements.addEventListener("load", function () {
        financierElements.select("files.import.button").addEventListener("click", function () {
            Utility.inputFile(function (file) {
                switch (file.name.substring(file.name.lastIndexOf(".")).toLowerCase()) {
                    case ".json":
                        handleJson(file);
                        break;
                    case ".jpeg":
                    case ".jpg":
                    case ".png":
                        handleImage(file);
                        break;
                }
            });

            function handleJson(file) {
                financierData.loadFromObject(file);
            }

            function handleImage(file) {
                let uuid = financierData.getProperty("resources").addFromObject(file);
                let markdown = "![](" + uuid + ")";
                let textarea = financierElements.select("field.markdown.textarea");
                textarea.value = textarea.value.substring(0, textarea.selectionStart)
                    + markdown + textarea.value.substring(textarea.selectionEnd);
                textarea.dispatchStandardEvent("modify");
            }
        });
    });

    financierElements.addEventListener("load", function () {
        financierElements.select("files.export.button").addEventListener("click", function () {
            Utility.download(financierData.toObject(), financierData.getProperty("name").getValue());
        });
    });

    financierElements.addEventListener("load", function () {
        financierElements.select("files.print.button").addEventListener("click", function () {
            window.print();
        });
    });

    financierElements.addEventListener("load", function () {
        financierElements.select("field.name.textarea").addEventListener("keyup", function () {
            financierData.getProperty("name").setValue(financierElements.select("field.name.textarea").value);
        });
    });

    financierElements.addEventListener("load", function () {
        financierElements.select("field.markdown.textarea").addEventListener("keyup", function () {
            financierData.getProperty("markdown").setValue(financierElements.select("field.markdown.textarea").value);
        });
    });

    financierElements.addEventListener("load", function () {
        financierElements.select("field.css.textarea").addEventListener("keyup", function () {
            financierData.getProperty("css").setValue(financierElements.select("field.css.textarea").value);
        });
    });

    window.addEventListener("DOMContentLoaded", function () {
        for (let element of document.querySelectorAll("textarea, input[type=\"text\"]")) {
            TextareaExtension.apply(element);
        }
    });

    window.addEventListener("beforeunload", function (event) {
        event.returnValue = "\o/";
    });
})();
