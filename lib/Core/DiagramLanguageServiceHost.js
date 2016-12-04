"use strict";
var ts = require("typescript");
var DiagramLanguageServiceHost = (function () {
    function DiagramLanguageServiceHost() {
        var _this = this;
        this.Files = {};
        this.log = function (_) { };
        this.trace = function (_) { };
        this.error = function (_) { };
        this.getScriptIsOpen = function (_) { return true; };
        this.getCurrentDirectory = function () { return ""; };
        this.getDefaultLibFileName = function (options) { return "lib"; };
        this.getScriptVersion = function (fileName) { return _this.Files[fileName].ver.toString(); };
        this.getScriptSnapshot = function (fileName) { return _this.Files[fileName].file; };
    }
    DiagramLanguageServiceHost.prototype.getCompilationSettings = function () {
        if (this.Options) {
            return this.Options;
        }
        return ts.getDefaultCompilerOptions();
    };
    DiagramLanguageServiceHost.prototype.getScriptFileNames = function () {
        var names = [];
        for (var name_1 in this.Files) {
            if (this.Files.hasOwnProperty(name_1)) {
                names.push(name_1);
            }
        }
        return names;
    };
    DiagramLanguageServiceHost.prototype.addFile = function (fileName, body) {
        var snap = ts.ScriptSnapshot.fromString(body);
        snap.getChangeRange = function (_) { return undefined; };
        var existing = this.Files[fileName];
        if (existing) {
            this.Files[fileName].ver++;
            this.Files[fileName].file = snap;
        }
        else {
            this.Files[fileName] = { ver: 1, file: snap };
        }
    };
    return DiagramLanguageServiceHost;
}());
exports.__esModule = true;
exports["default"] = DiagramLanguageServiceHost;

//# sourceMappingURL=DiagramLanguageServiceHost.js.map
