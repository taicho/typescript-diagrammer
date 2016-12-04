"use strict";
var fs = require("fs");
var ProcessorFile = (function () {
    function ProcessorFile(path) {
        this.Path = null;
        this.Path = path;
    }
    ProcessorFile.prototype.getText = function () {
        return fs.readFileSync(this.Path).toString();
    };
    return ProcessorFile;
}());
exports.__esModule = true;
exports["default"] = ProcessorFile;

//# sourceMappingURL=ProcessorFile.js.map
