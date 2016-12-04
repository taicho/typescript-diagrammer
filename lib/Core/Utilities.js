"use strict";
var fs = require("fs");
var ProcessorFile_1 = require("./ProcessorFile");
var SerializableNode_1 = require("./SerializableNode");
function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
exports.randomInt = randomInt;
function toSerializableNodes(nodes) {
    var newNodes = [];
    for (var name_1 in nodes) {
        var item = nodes[name_1];
        newNodes.push(new SerializableNode_1["default"](item));
    }
    return newNodes;
}
exports.toSerializableNodes = toSerializableNodes;
function getFilePaths(dir, files, filter) {
    var _this = this;
    var fileTree = fs.readdirSync(dir);
    fileTree.forEach(function (f) {
        var path = dir + "\\" + f;
        var fStat = fs.lstatSync(path);
        if (fStat.isDirectory()) {
            _this.getFilePaths(path, files, filter);
        }
        else if (fStat.isFile()) {
            if (filter && filter(path)) {
                var procFile = new ProcessorFile_1["default"](path);
                files.push(procFile);
            }
            else if (!filter) {
                var procFile = new ProcessorFile_1["default"](path);
                files.push(procFile);
            }
        }
    });
}
exports.getFilePaths = getFilePaths;

//# sourceMappingURL=Utilities.js.map
