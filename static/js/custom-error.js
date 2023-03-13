var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { fixProto, fixStack } from './utils';
var CustomError = (function (_super) {
    __extends(CustomError, _super);
    function CustomError(message, options) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, message, options) || this;
        Object.defineProperty(_this, 'name', {
            value: _newTarget.name,
            enumerable: false,
            configurable: true,
        });
        fixProto(_this, _newTarget.prototype);
        fixStack(_this);
        return _this;
    }
    return CustomError;
}(Error));
export { CustomError };
//# sourceMappingURL=custom-error.js.map