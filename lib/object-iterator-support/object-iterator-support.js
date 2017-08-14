(function () {
    if (Object.prototype[Symbol.iterator] === undefined) {
        Object.prototype[Symbol.iterator] = function () {
            return Array.prototype[Symbol.iterator].call(Array.prototype.slice.call(this, 0));
        };
    }
})();