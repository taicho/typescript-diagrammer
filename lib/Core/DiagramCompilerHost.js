"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ts = require("typescript");
var DiagramLanguageServiceHost_1 = require("./DiagramLanguageServiceHost");
var DiagramCompilerHost = (function (_super) {
    __extends(DiagramCompilerHost, _super);
    function DiagramCompilerHost() {
        _super.apply(this, arguments);
        this.getCanonicalFileName = function (fileName) { return fileName; };
        this.useCaseSensitiveFileNames = function () { return true; };
        this.getNewLine = function () { return "\n"; };
        this.getDirectories = function (path) { return []; };
    }
    DiagramCompilerHost.prototype.getSourceFile = function (filename, languageVersion, onError) {
        var f = this.Files[filename];
        if (!f)
            return null;
        var sourceFile = ts.createLanguageServiceSourceFile(filename, f.file, ts.ScriptTarget.ES5, f.ver.toString(), true);
        return sourceFile;
    };
    DiagramCompilerHost.prototype.writeFile = function (filename, data, writeByteOrderMark, onError) {
    };
    DiagramCompilerHost.prototype.fileExists = function (str) {
        return true;
    };
    DiagramCompilerHost.prototype.readFile = function (str) {
        return "";
    };
    return DiagramCompilerHost;
}(DiagramLanguageServiceHost_1["default"]));
exports.__esModule = true;
exports["default"] = DiagramCompilerHost;

//# sourceMappingURL=DiagramCompilerHost.js.map
