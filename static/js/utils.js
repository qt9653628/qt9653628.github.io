export function fixProto(target, prototype) {
    var setPrototypeOf = Object.setPrototypeOf;
    setPrototypeOf
        ? setPrototypeOf(target, prototype)
        : (target.__proto__ = prototype);
}
export function fixStack(target, fn) {
    if (fn === void 0) { fn = target.constructor; }
    var captureStackTrace = Error.captureStackTrace;
    captureStackTrace && captureStackTrace(target, fn);
}
//# sourceMappingURL=utils.js.map