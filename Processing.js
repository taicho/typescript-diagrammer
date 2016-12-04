"use strict";
var tss = require("typescript");
var DiagramLanguageServiceHost_1 = require("./Core/DiagramLanguageServiceHost");
var DiagramCompilerHost_1 = require("./Core/DiagramCompilerHost");
var ProcessorFile_1 = require("./Core/ProcessorFile");
var NodeItem_1 = require("./Core/NodeItem");
var ProcessorFile_2 = require("./Core/ProcessorFile");
var Utilities = require("./Core/Utilities");
var DgmlGenerator_1 = require("./Core/Generators/DgmlGenerator");
var Processor = (function () {
    function Processor() {
        this.Nodes = null;
        this.Items = null;
        this.Processed = false;
        this.Generator = new DgmlGenerator_1["default"]();
    }
    Processor.fromDirectory = function (path) {
        var x = new DiagramLanguageServiceHost_1["default"]();
        var processor = new Processor();
        var files = [];
        Utilities.getFilePaths(path, files, function (path) {
            var pathLower = path.toLowerCase();
            if (pathLower.indexOf("d.ts") < 0 && pathLower.indexOf(".ts") >= 0) {
                return true;
            }
            return false;
        });
        processor.Items = files;
    };
    Processor.fromFile = function (path) {
        var processor = new Processor();
        processor.Items = [new ProcessorFile_1["default"](path)];
        return processor;
    };
    Processor.fromString = function (str) {
        var processor = new Processor();
        processor.Items = [new ProcessorFile_2["default"](str)];
        return processor;
    };
    Processor.prototype.getAllNodes = function (sf) {
        var nodes = [];
        function allNodes(n) {
            tss.forEachChild(n, function (n) { nodes.push(n); allNodes(n); return false; });
        }
        ;
        allNodes(sf);
        return nodes;
    };
    Processor.prototype.execute = function () {
        if (!this.Processed) {
            var fileNamePart = "Output.ts";
            var source = this.getFileString();
            var host = new DiagramCompilerHost_1["default"]();
            host.addFile(fileNamePart, source);
            var program = tss.createProgram([fileNamePart], host.getCompilationSettings(), host);
            var typeChecker = program.getTypeChecker();
            var sourceFile = program.getSourceFile(fileNamePart);
            var nodes = this.getAllNodes(sourceFile);
            this.Processed = true;
        }
    };
    Processor.prototype.getFileString = function () {
        var fileString = "";
        this.Items.forEach(function (file) {
            var code = file.getText();
            fileString += code;
        });
        return fileString;
    };
    Processor.prototype.emit = function () {
        this.execute();
        return this.Generator.generate(this.Nodes);
    };
    Processor.prototype.toJson = function () {
        return JSON.stringify(Utilities.toSerializableNodes(this.Nodes));
    };
    // applyLoc() {
    //     this.Files.forEach(function (file) {
    //         let code = fs.readFileSync(file.Path).toString();
    //         file.Loc = code.split("\n").filter((f) => { return f != ""; }).length;
    //     });
    // }
    Processor.prototype.getDistinctNames = function (masterArr) {
        var names = {};
        masterArr.forEach(function (item) {
            if (!(item.name in names)) {
                names[item.fullName] = item;
            }
        });
        return names;
    };
    Processor.prototype.getName = function (nameObject, arr) {
        if (arr === void 0) { arr = []; }
        if (typeof (nameObject) === "string") {
            arr.push(nameObject);
        }
        else if (nameObject.name) {
            this.getName(nameObject.name, arr);
        }
        else if (nameObject.identifier) {
            this.getName(nameObject.identifier, arr);
        }
        else if (nameObject.left) {
            var n = nameObject;
            this.getName(n.left, arr);
            this.getName(n.right, arr);
        }
        else if (nameObject.text) {
            this.getName(nameObject, arr);
        }
        // else if (nameObject instanceof tss.EntityName) {
        //     let n = <tss.QualifiedName>nameObject;        
        //     getName(n.left, arr);
        //     getName(n.right, arr);
        // }
        // else if (nameObject instanceof tss.Identifier) {
        //     let n = <tss.Identifier>nameObject;
        //     arr.push(n.text());
        // }
        return arr.join(".");
    };
    Processor.prototype.buildNodes = function (items) {
        var nodeList = {};
        var _loop_1 = function(name_1) {
            var item = items[name_1];
            if (item.kind === 216 /* ModuleDeclaration */) {
                var fullNameSplit = item.fullName.split(".");
                var lastNode_1 = null;
                var fullName_1 = [];
                fullNameSplit.forEach(function (splitName) {
                    fullName_1.push(splitName);
                    var fullNameCurrent = fullName_1.join(".");
                    var nodeItem = null;
                    if (lastNode_1) {
                        nodeItem = lastNode_1.Children[splitName];
                    }
                    else {
                        nodeItem = nodeList[fullNameCurrent];
                    }
                    if (!nodeItem) {
                        var newNode = new NodeItem_1["default"]();
                        nodeItem = newNode;
                        newNode.Name = splitName;
                        newNode.FullName = fullNameCurrent;
                        newNode.KindName = "Module";
                        newNode.Loc = item.loc;
                        nodeList[newNode.FullName] = newNode;
                        if (lastNode_1) {
                            newNode.Parent = lastNode_1;
                            lastNode_1.Children[newNode.Name] = newNode;
                        }
                    }
                    lastNode_1 = nodeItem;
                });
            }
        };
        for (var name_1 in items) {
            _loop_1(name_1);
        }
        for (var name_2 in items) {
            var item = items[name_2];
            if (item.kind === 212 /* ClassDeclaration */ || item.kind === 213 /* InterfaceDeclaration */) {
                var classPath = item.fullName.replace("." + item.name, "");
                var parentNode = nodeList[classPath];
                var newNode = new NodeItem_1["default"]();
                newNode.KindName = item.kind === 212 /* ClassDeclaration */ ? "Class" : "Interface";
                newNode.FullName = item.fullName;
                newNode.Loc = item.loc;
                newNode.Name = item.name;
                newNode.Parent = parentNode;
                if (parentNode) {
                    parentNode.Children[item.name] = newNode;
                }
                nodeList[newNode.FullName] = newNode;
            }
        }
        return nodeList;
    };
    Processor.prototype.forEachSyntaxList = function (list, func) {
        var count = list.length;
        for (var i = 0; i < count; i++) {
            func(list[i], i);
        }
    };
    Processor.prototype.enumerate = function (unit, masterArr, lastModuleName) {
        var _this = this;
        if (masterArr === void 0) { masterArr = []; }
        if (lastModuleName === void 0) { lastModuleName = ""; }
        var modules = null;
        var classes = null;
        var kind = unit.kind();
        var fullName = null;
        var name = null;
        if (lastModuleName) {
            name = this.getName(unit);
            fullName = lastModuleName + "." + name;
        }
        else {
            fullName = this.getName(unit);
            name = fullName;
        }
        var kindName = this.getKindName(kind);
        switch (kind) {
            case 216 /* ModuleDeclaration */:
                var m = unit;
                masterArr.push({ fullName: fullName, name: name, kindName: kindName, kind: kind, loc: m.getEnd() - m.getStart() });
                lastModuleName = fullName;
                this.forEachSyntaxList(m.getChildren(), function (item) {
                    _this.enumerate(item, masterArr, lastModuleName);
                });
                break;
            case 212 /* ClassDeclaration */:
                var c = unit;
                masterArr.push({ fullName: fullName, name: name, kindName: kindName, kind: kind, loc: c.getEnd() - c.getStart() });
                this.forEachSyntaxList(c.getChildren(), function (item) {
                    _this.enumerate(item, masterArr);
                });
                break;
            case 213 /* InterfaceDeclaration */:
                var ix = unit;
                masterArr.push({ fullName: fullName, name: name, kindName: kindName, kind: kind, loc: ix.getEnd() - ix.getStart() });
                break;
            case 209 /* VariableDeclaration */:
                break;
        }
        return masterArr;
    };
    Processor.prototype.getKindName = function (kind) {
        switch (kind) {
            case 216 /* ModuleDeclaration */:
                return "Module";
            case 212 /* ClassDeclaration */:
                return "Class";
        }
        return "Unknown";
    };
    Processor.prototype.enumerateAndFindDependencies = function (unit, items, nodes, lastModuleName, lastNode) {
        var _this = this;
        if (lastModuleName === void 0) { lastModuleName = ""; }
        var modules = null;
        var name = null;
        var classes = null;
        var kind = unit.kind();
        var fullName = null;
        if (lastModuleName) {
            name = this.getName(unit);
            fullName = lastModuleName + "." + name;
        }
        else {
            fullName = this.getName(unit);
            name = fullName;
        }
        var kindName = this.getKindName(kind);
        switch (kind) {
            case 246 /* SourceFile */:
            case 216 /* ModuleDeclaration */:
                var m = unit;
                lastModuleName = fullName;
                this.forEachSyntaxList(m.getChildren(), function (item) {
                    _this.enumerateAndFindDependencies(item, items, nodes, lastModuleName);
                });
                break;
            case 212 /* ClassDeclaration */:
                var c = unit;
                var currentNode_1 = nodes[fullName];
                this.forEachSyntaxList(c.heritageClauses, function (item) {
                    if (item.types) {
                        for (var i = 0; i < item.types.length; i++) {
                            var name_3 = _this.getName(item.types[i]);
                            var newName = lastModuleName + "." + name_3;
                            var node = nodes[newName];
                            if (!node) {
                                var alternateName = lastModuleName.substring(0, lastModuleName.lastIndexOf(".") + 1) + name_3;
                                node = nodes[alternateName];
                            }
                            if (node) {
                                currentNode_1.BaseTypes.push(node);
                            }
                        }
                    }
                });
                this.forEachSyntaxList(c.getChildren(), function (item) {
                    _this.enumerateAndFindDependencies(item, items, nodes, lastModuleName, currentNode_1);
                });
                break;
            case 209 /* VariableDeclaration */:
                break;
        }
        return nodes;
    };
    return Processor;
}());
exports.__esModule = true;
exports["default"] = Processor;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJQcm9jZXNzaW5nLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIHRzcyA9IHJlcXVpcmUoXCJ0eXBlc2NyaXB0XCIpO1xudmFyIERpYWdyYW1MYW5ndWFnZVNlcnZpY2VIb3N0XzEgPSByZXF1aXJlKFwiLi9Db3JlL0RpYWdyYW1MYW5ndWFnZVNlcnZpY2VIb3N0XCIpO1xudmFyIERpYWdyYW1Db21waWxlckhvc3RfMSA9IHJlcXVpcmUoXCIuL0NvcmUvRGlhZ3JhbUNvbXBpbGVySG9zdFwiKTtcbnZhciBQcm9jZXNzb3JGaWxlXzEgPSByZXF1aXJlKFwiLi9Db3JlL1Byb2Nlc3NvckZpbGVcIik7XG52YXIgTm9kZUl0ZW1fMSA9IHJlcXVpcmUoXCIuL0NvcmUvTm9kZUl0ZW1cIik7XG52YXIgUHJvY2Vzc29yRmlsZV8yID0gcmVxdWlyZShcIi4vQ29yZS9Qcm9jZXNzb3JGaWxlXCIpO1xudmFyIFV0aWxpdGllcyA9IHJlcXVpcmUoXCIuL0NvcmUvVXRpbGl0aWVzXCIpO1xudmFyIERnbWxHZW5lcmF0b3JfMSA9IHJlcXVpcmUoXCIuL0NvcmUvR2VuZXJhdG9ycy9EZ21sR2VuZXJhdG9yXCIpO1xudmFyIFByb2Nlc3NvciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUHJvY2Vzc29yKCkge1xuICAgICAgICB0aGlzLk5vZGVzID0gbnVsbDtcbiAgICAgICAgdGhpcy5JdGVtcyA9IG51bGw7XG4gICAgICAgIHRoaXMuUHJvY2Vzc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuR2VuZXJhdG9yID0gbmV3IERnbWxHZW5lcmF0b3JfMVtcImRlZmF1bHRcIl0oKTtcbiAgICB9XG4gICAgUHJvY2Vzc29yLmZyb21EaXJlY3RvcnkgPSBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICB2YXIgeCA9IG5ldyBEaWFncmFtTGFuZ3VhZ2VTZXJ2aWNlSG9zdF8xW1wiZGVmYXVsdFwiXSgpO1xuICAgICAgICB2YXIgcHJvY2Vzc29yID0gbmV3IFByb2Nlc3NvcigpO1xuICAgICAgICB2YXIgZmlsZXMgPSBbXTtcbiAgICAgICAgVXRpbGl0aWVzLmdldEZpbGVQYXRocyhwYXRoLCBmaWxlcywgZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgICAgIHZhciBwYXRoTG93ZXIgPSBwYXRoLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAocGF0aExvd2VyLmluZGV4T2YoXCJkLnRzXCIpIDwgMCAmJiBwYXRoTG93ZXIuaW5kZXhPZihcIi50c1wiKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICBwcm9jZXNzb3IuSXRlbXMgPSBmaWxlcztcbiAgICB9O1xuICAgIFByb2Nlc3Nvci5mcm9tRmlsZSA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIHZhciBwcm9jZXNzb3IgPSBuZXcgUHJvY2Vzc29yKCk7XG4gICAgICAgIHByb2Nlc3Nvci5JdGVtcyA9IFtuZXcgUHJvY2Vzc29yRmlsZV8xW1wiZGVmYXVsdFwiXShwYXRoKV07XG4gICAgICAgIHJldHVybiBwcm9jZXNzb3I7XG4gICAgfTtcbiAgICBQcm9jZXNzb3IuZnJvbVN0cmluZyA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgdmFyIHByb2Nlc3NvciA9IG5ldyBQcm9jZXNzb3IoKTtcbiAgICAgICAgcHJvY2Vzc29yLkl0ZW1zID0gW25ldyBQcm9jZXNzb3JGaWxlXzJbXCJkZWZhdWx0XCJdKHN0cildO1xuICAgICAgICByZXR1cm4gcHJvY2Vzc29yO1xuICAgIH07XG4gICAgUHJvY2Vzc29yLnByb3RvdHlwZS5nZXRBbGxOb2RlcyA9IGZ1bmN0aW9uIChzZikge1xuICAgICAgICB2YXIgbm9kZXMgPSBbXTtcbiAgICAgICAgZnVuY3Rpb24gYWxsTm9kZXMobikge1xuICAgICAgICAgICAgdHNzLmZvckVhY2hDaGlsZChuLCBmdW5jdGlvbiAobikgeyBub2Rlcy5wdXNoKG4pOyBhbGxOb2RlcyhuKTsgcmV0dXJuIGZhbHNlOyB9KTtcbiAgICAgICAgfVxuICAgICAgICA7XG4gICAgICAgIGFsbE5vZGVzKHNmKTtcbiAgICAgICAgcmV0dXJuIG5vZGVzO1xuICAgIH07XG4gICAgUHJvY2Vzc29yLnByb3RvdHlwZS5leGVjdXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMuUHJvY2Vzc2VkKSB7XG4gICAgICAgICAgICB2YXIgZmlsZU5hbWVQYXJ0ID0gXCJPdXRwdXQudHNcIjtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSB0aGlzLmdldEZpbGVTdHJpbmcoKTtcbiAgICAgICAgICAgIHZhciBob3N0ID0gbmV3IERpYWdyYW1Db21waWxlckhvc3RfMVtcImRlZmF1bHRcIl0oKTtcbiAgICAgICAgICAgIGhvc3QuYWRkRmlsZShmaWxlTmFtZVBhcnQsIHNvdXJjZSk7XG4gICAgICAgICAgICB2YXIgcHJvZ3JhbSA9IHRzcy5jcmVhdGVQcm9ncmFtKFtmaWxlTmFtZVBhcnRdLCBob3N0LmdldENvbXBpbGF0aW9uU2V0dGluZ3MoKSwgaG9zdCk7XG4gICAgICAgICAgICB2YXIgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gICAgICAgICAgICB2YXIgc291cmNlRmlsZSA9IHByb2dyYW0uZ2V0U291cmNlRmlsZShmaWxlTmFtZVBhcnQpO1xuICAgICAgICAgICAgdmFyIG5vZGVzID0gdGhpcy5nZXRBbGxOb2Rlcyhzb3VyY2VGaWxlKTtcbiAgICAgICAgICAgIHRoaXMuUHJvY2Vzc2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUHJvY2Vzc29yLnByb3RvdHlwZS5nZXRGaWxlU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZmlsZVN0cmluZyA9IFwiXCI7XG4gICAgICAgIHRoaXMuSXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgdmFyIGNvZGUgPSBmaWxlLmdldFRleHQoKTtcbiAgICAgICAgICAgIGZpbGVTdHJpbmcgKz0gY29kZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmaWxlU3RyaW5nO1xuICAgIH07XG4gICAgUHJvY2Vzc29yLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmV4ZWN1dGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuR2VuZXJhdG9yLmdlbmVyYXRlKHRoaXMuTm9kZXMpO1xuICAgIH07XG4gICAgUHJvY2Vzc29yLnByb3RvdHlwZS50b0pzb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShVdGlsaXRpZXMudG9TZXJpYWxpemFibGVOb2Rlcyh0aGlzLk5vZGVzKSk7XG4gICAgfTtcbiAgICAvLyBhcHBseUxvYygpIHtcbiAgICAvLyAgICAgdGhpcy5GaWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgLy8gICAgICAgICBsZXQgY29kZSA9IGZzLnJlYWRGaWxlU3luYyhmaWxlLlBhdGgpLnRvU3RyaW5nKCk7XG4gICAgLy8gICAgICAgICBmaWxlLkxvYyA9IGNvZGUuc3BsaXQoXCJcXG5cIikuZmlsdGVyKChmKSA9PiB7IHJldHVybiBmICE9IFwiXCI7IH0pLmxlbmd0aDtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gfVxuICAgIFByb2Nlc3Nvci5wcm90b3R5cGUuZ2V0RGlzdGluY3ROYW1lcyA9IGZ1bmN0aW9uIChtYXN0ZXJBcnIpIHtcbiAgICAgICAgdmFyIG5hbWVzID0ge307XG4gICAgICAgIG1hc3RlckFyci5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICBpZiAoIShpdGVtLm5hbWUgaW4gbmFtZXMpKSB7XG4gICAgICAgICAgICAgICAgbmFtZXNbaXRlbS5mdWxsTmFtZV0gPSBpdGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5hbWVzO1xuICAgIH07XG4gICAgUHJvY2Vzc29yLnByb3RvdHlwZS5nZXROYW1lID0gZnVuY3Rpb24gKG5hbWVPYmplY3QsIGFycikge1xuICAgICAgICBpZiAoYXJyID09PSB2b2lkIDApIHsgYXJyID0gW107IH1cbiAgICAgICAgaWYgKHR5cGVvZiAobmFtZU9iamVjdCkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGFyci5wdXNoKG5hbWVPYmplY3QpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5hbWVPYmplY3QubmFtZSkge1xuICAgICAgICAgICAgdGhpcy5nZXROYW1lKG5hbWVPYmplY3QubmFtZSwgYXJyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChuYW1lT2JqZWN0LmlkZW50aWZpZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZ2V0TmFtZShuYW1lT2JqZWN0LmlkZW50aWZpZXIsIGFycik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobmFtZU9iamVjdC5sZWZ0KSB7XG4gICAgICAgICAgICB2YXIgbiA9IG5hbWVPYmplY3Q7XG4gICAgICAgICAgICB0aGlzLmdldE5hbWUobi5sZWZ0LCBhcnIpO1xuICAgICAgICAgICAgdGhpcy5nZXROYW1lKG4ucmlnaHQsIGFycik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobmFtZU9iamVjdC50ZXh0KSB7XG4gICAgICAgICAgICB0aGlzLmdldE5hbWUobmFtZU9iamVjdCwgYXJyKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBlbHNlIGlmIChuYW1lT2JqZWN0IGluc3RhbmNlb2YgdHNzLkVudGl0eU5hbWUpIHtcbiAgICAgICAgLy8gICAgIGxldCBuID0gPHRzcy5RdWFsaWZpZWROYW1lPm5hbWVPYmplY3Q7ICAgICAgICBcbiAgICAgICAgLy8gICAgIGdldE5hbWUobi5sZWZ0LCBhcnIpO1xuICAgICAgICAvLyAgICAgZ2V0TmFtZShuLnJpZ2h0LCBhcnIpO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGVsc2UgaWYgKG5hbWVPYmplY3QgaW5zdGFuY2VvZiB0c3MuSWRlbnRpZmllcikge1xuICAgICAgICAvLyAgICAgbGV0IG4gPSA8dHNzLklkZW50aWZpZXI+bmFtZU9iamVjdDtcbiAgICAgICAgLy8gICAgIGFyci5wdXNoKG4udGV4dCgpKTtcbiAgICAgICAgLy8gfVxuICAgICAgICByZXR1cm4gYXJyLmpvaW4oXCIuXCIpO1xuICAgIH07XG4gICAgUHJvY2Vzc29yLnByb3RvdHlwZS5idWlsZE5vZGVzID0gZnVuY3Rpb24gKGl0ZW1zKSB7XG4gICAgICAgIHZhciBub2RlTGlzdCA9IHt9O1xuICAgICAgICB2YXIgX2xvb3BfMSA9IGZ1bmN0aW9uKG5hbWVfMSkge1xuICAgICAgICAgICAgdmFyIGl0ZW0gPSBpdGVtc1tuYW1lXzFdO1xuICAgICAgICAgICAgaWYgKGl0ZW0ua2luZCA9PT0gMjE2IC8qIE1vZHVsZURlY2xhcmF0aW9uICovKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bGxOYW1lU3BsaXQgPSBpdGVtLmZ1bGxOYW1lLnNwbGl0KFwiLlwiKTtcbiAgICAgICAgICAgICAgICB2YXIgbGFzdE5vZGVfMSA9IG51bGw7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bGxOYW1lXzEgPSBbXTtcbiAgICAgICAgICAgICAgICBmdWxsTmFtZVNwbGl0LmZvckVhY2goZnVuY3Rpb24gKHNwbGl0TmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBmdWxsTmFtZV8xLnB1c2goc3BsaXROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZ1bGxOYW1lQ3VycmVudCA9IGZ1bGxOYW1lXzEuam9pbihcIi5cIik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub2RlSXRlbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0Tm9kZV8xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSXRlbSA9IGxhc3ROb2RlXzEuQ2hpbGRyZW5bc3BsaXROYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJdGVtID0gbm9kZUxpc3RbZnVsbE5hbWVDdXJyZW50XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIW5vZGVJdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Tm9kZSA9IG5ldyBOb2RlSXRlbV8xW1wiZGVmYXVsdFwiXSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUl0ZW0gPSBuZXdOb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Tm9kZS5OYW1lID0gc3BsaXROYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Tm9kZS5GdWxsTmFtZSA9IGZ1bGxOYW1lQ3VycmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld05vZGUuS2luZE5hbWUgPSBcIk1vZHVsZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Tm9kZS5Mb2MgPSBpdGVtLmxvYztcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVMaXN0W25ld05vZGUuRnVsbE5hbWVdID0gbmV3Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0Tm9kZV8xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3Tm9kZS5QYXJlbnQgPSBsYXN0Tm9kZV8xO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3ROb2RlXzEuQ2hpbGRyZW5bbmV3Tm9kZS5OYW1lXSA9IG5ld05vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGFzdE5vZGVfMSA9IG5vZGVJdGVtO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBmb3IgKHZhciBuYW1lXzEgaW4gaXRlbXMpIHtcbiAgICAgICAgICAgIF9sb29wXzEobmFtZV8xKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBuYW1lXzIgaW4gaXRlbXMpIHtcbiAgICAgICAgICAgIHZhciBpdGVtID0gaXRlbXNbbmFtZV8yXTtcbiAgICAgICAgICAgIGlmIChpdGVtLmtpbmQgPT09IDIxMiAvKiBDbGFzc0RlY2xhcmF0aW9uICovIHx8IGl0ZW0ua2luZCA9PT0gMjEzIC8qIEludGVyZmFjZURlY2xhcmF0aW9uICovKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzUGF0aCA9IGl0ZW0uZnVsbE5hbWUucmVwbGFjZShcIi5cIiArIGl0ZW0ubmFtZSwgXCJcIik7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudE5vZGUgPSBub2RlTGlzdFtjbGFzc1BhdGhdO1xuICAgICAgICAgICAgICAgIHZhciBuZXdOb2RlID0gbmV3IE5vZGVJdGVtXzFbXCJkZWZhdWx0XCJdKCk7XG4gICAgICAgICAgICAgICAgbmV3Tm9kZS5LaW5kTmFtZSA9IGl0ZW0ua2luZCA9PT0gMjEyIC8qIENsYXNzRGVjbGFyYXRpb24gKi8gPyBcIkNsYXNzXCIgOiBcIkludGVyZmFjZVwiO1xuICAgICAgICAgICAgICAgIG5ld05vZGUuRnVsbE5hbWUgPSBpdGVtLmZ1bGxOYW1lO1xuICAgICAgICAgICAgICAgIG5ld05vZGUuTG9jID0gaXRlbS5sb2M7XG4gICAgICAgICAgICAgICAgbmV3Tm9kZS5OYW1lID0gaXRlbS5uYW1lO1xuICAgICAgICAgICAgICAgIG5ld05vZGUuUGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnROb2RlLkNoaWxkcmVuW2l0ZW0ubmFtZV0gPSBuZXdOb2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBub2RlTGlzdFtuZXdOb2RlLkZ1bGxOYW1lXSA9IG5ld05vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5vZGVMaXN0O1xuICAgIH07XG4gICAgUHJvY2Vzc29yLnByb3RvdHlwZS5mb3JFYWNoU3ludGF4TGlzdCA9IGZ1bmN0aW9uIChsaXN0LCBmdW5jKSB7XG4gICAgICAgIHZhciBjb3VudCA9IGxpc3QubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGZ1bmMobGlzdFtpXSwgaSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFByb2Nlc3Nvci5wcm90b3R5cGUuZW51bWVyYXRlID0gZnVuY3Rpb24gKHVuaXQsIG1hc3RlckFyciwgbGFzdE1vZHVsZU5hbWUpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKG1hc3RlckFyciA9PT0gdm9pZCAwKSB7IG1hc3RlckFyciA9IFtdOyB9XG4gICAgICAgIGlmIChsYXN0TW9kdWxlTmFtZSA9PT0gdm9pZCAwKSB7IGxhc3RNb2R1bGVOYW1lID0gXCJcIjsgfVxuICAgICAgICB2YXIgbW9kdWxlcyA9IG51bGw7XG4gICAgICAgIHZhciBjbGFzc2VzID0gbnVsbDtcbiAgICAgICAgdmFyIGtpbmQgPSB1bml0LmtpbmQoKTtcbiAgICAgICAgdmFyIGZ1bGxOYW1lID0gbnVsbDtcbiAgICAgICAgdmFyIG5hbWUgPSBudWxsO1xuICAgICAgICBpZiAobGFzdE1vZHVsZU5hbWUpIHtcbiAgICAgICAgICAgIG5hbWUgPSB0aGlzLmdldE5hbWUodW5pdCk7XG4gICAgICAgICAgICBmdWxsTmFtZSA9IGxhc3RNb2R1bGVOYW1lICsgXCIuXCIgKyBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZnVsbE5hbWUgPSB0aGlzLmdldE5hbWUodW5pdCk7XG4gICAgICAgICAgICBuYW1lID0gZnVsbE5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtpbmROYW1lID0gdGhpcy5nZXRLaW5kTmFtZShraW5kKTtcbiAgICAgICAgc3dpdGNoIChraW5kKSB7XG4gICAgICAgICAgICBjYXNlIDIxNiAvKiBNb2R1bGVEZWNsYXJhdGlvbiAqLzpcbiAgICAgICAgICAgICAgICB2YXIgbSA9IHVuaXQ7XG4gICAgICAgICAgICAgICAgbWFzdGVyQXJyLnB1c2goeyBmdWxsTmFtZTogZnVsbE5hbWUsIG5hbWU6IG5hbWUsIGtpbmROYW1lOiBraW5kTmFtZSwga2luZDoga2luZCwgbG9jOiBtLmdldEVuZCgpIC0gbS5nZXRTdGFydCgpIH0pO1xuICAgICAgICAgICAgICAgIGxhc3RNb2R1bGVOYW1lID0gZnVsbE5hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3JFYWNoU3ludGF4TGlzdChtLmdldENoaWxkcmVuKCksIGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmVudW1lcmF0ZShpdGVtLCBtYXN0ZXJBcnIsIGxhc3RNb2R1bGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjEyIC8qIENsYXNzRGVjbGFyYXRpb24gKi86XG4gICAgICAgICAgICAgICAgdmFyIGMgPSB1bml0O1xuICAgICAgICAgICAgICAgIG1hc3RlckFyci5wdXNoKHsgZnVsbE5hbWU6IGZ1bGxOYW1lLCBuYW1lOiBuYW1lLCBraW5kTmFtZToga2luZE5hbWUsIGtpbmQ6IGtpbmQsIGxvYzogYy5nZXRFbmQoKSAtIGMuZ2V0U3RhcnQoKSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmZvckVhY2hTeW50YXhMaXN0KGMuZ2V0Q2hpbGRyZW4oKSwgZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuZW51bWVyYXRlKGl0ZW0sIG1hc3RlckFycik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDIxMyAvKiBJbnRlcmZhY2VEZWNsYXJhdGlvbiAqLzpcbiAgICAgICAgICAgICAgICB2YXIgaXggPSB1bml0O1xuICAgICAgICAgICAgICAgIG1hc3RlckFyci5wdXNoKHsgZnVsbE5hbWU6IGZ1bGxOYW1lLCBuYW1lOiBuYW1lLCBraW5kTmFtZToga2luZE5hbWUsIGtpbmQ6IGtpbmQsIGxvYzogaXguZ2V0RW5kKCkgLSBpeC5nZXRTdGFydCgpIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyMDkgLyogVmFyaWFibGVEZWNsYXJhdGlvbiAqLzpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFzdGVyQXJyO1xuICAgIH07XG4gICAgUHJvY2Vzc29yLnByb3RvdHlwZS5nZXRLaW5kTmFtZSA9IGZ1bmN0aW9uIChraW5kKSB7XG4gICAgICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgICAgICAgY2FzZSAyMTYgLyogTW9kdWxlRGVjbGFyYXRpb24gKi86XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiTW9kdWxlXCI7XG4gICAgICAgICAgICBjYXNlIDIxMiAvKiBDbGFzc0RlY2xhcmF0aW9uICovOlxuICAgICAgICAgICAgICAgIHJldHVybiBcIkNsYXNzXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFwiVW5rbm93blwiO1xuICAgIH07XG4gICAgUHJvY2Vzc29yLnByb3RvdHlwZS5lbnVtZXJhdGVBbmRGaW5kRGVwZW5kZW5jaWVzID0gZnVuY3Rpb24gKHVuaXQsIGl0ZW1zLCBub2RlcywgbGFzdE1vZHVsZU5hbWUsIGxhc3ROb2RlKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChsYXN0TW9kdWxlTmFtZSA9PT0gdm9pZCAwKSB7IGxhc3RNb2R1bGVOYW1lID0gXCJcIjsgfVxuICAgICAgICB2YXIgbW9kdWxlcyA9IG51bGw7XG4gICAgICAgIHZhciBuYW1lID0gbnVsbDtcbiAgICAgICAgdmFyIGNsYXNzZXMgPSBudWxsO1xuICAgICAgICB2YXIga2luZCA9IHVuaXQua2luZCgpO1xuICAgICAgICB2YXIgZnVsbE5hbWUgPSBudWxsO1xuICAgICAgICBpZiAobGFzdE1vZHVsZU5hbWUpIHtcbiAgICAgICAgICAgIG5hbWUgPSB0aGlzLmdldE5hbWUodW5pdCk7XG4gICAgICAgICAgICBmdWxsTmFtZSA9IGxhc3RNb2R1bGVOYW1lICsgXCIuXCIgKyBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZnVsbE5hbWUgPSB0aGlzLmdldE5hbWUodW5pdCk7XG4gICAgICAgICAgICBuYW1lID0gZnVsbE5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtpbmROYW1lID0gdGhpcy5nZXRLaW5kTmFtZShraW5kKTtcbiAgICAgICAgc3dpdGNoIChraW5kKSB7XG4gICAgICAgICAgICBjYXNlIDI0NiAvKiBTb3VyY2VGaWxlICovOlxuICAgICAgICAgICAgY2FzZSAyMTYgLyogTW9kdWxlRGVjbGFyYXRpb24gKi86XG4gICAgICAgICAgICAgICAgdmFyIG0gPSB1bml0O1xuICAgICAgICAgICAgICAgIGxhc3RNb2R1bGVOYW1lID0gZnVsbE5hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3JFYWNoU3ludGF4TGlzdChtLmdldENoaWxkcmVuKCksIGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmVudW1lcmF0ZUFuZEZpbmREZXBlbmRlbmNpZXMoaXRlbSwgaXRlbXMsIG5vZGVzLCBsYXN0TW9kdWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDIxMiAvKiBDbGFzc0RlY2xhcmF0aW9uICovOlxuICAgICAgICAgICAgICAgIHZhciBjID0gdW5pdDtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudE5vZGVfMSA9IG5vZGVzW2Z1bGxOYW1lXTtcbiAgICAgICAgICAgICAgICB0aGlzLmZvckVhY2hTeW50YXhMaXN0KGMuaGVyaXRhZ2VDbGF1c2VzLCBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS50eXBlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtLnR5cGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVfMyA9IF90aGlzLmdldE5hbWUoaXRlbS50eXBlc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld05hbWUgPSBsYXN0TW9kdWxlTmFtZSArIFwiLlwiICsgbmFtZV8zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBub2RlID0gbm9kZXNbbmV3TmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbHRlcm5hdGVOYW1lID0gbGFzdE1vZHVsZU5hbWUuc3Vic3RyaW5nKDAsIGxhc3RNb2R1bGVOYW1lLmxhc3RJbmRleE9mKFwiLlwiKSArIDEpICsgbmFtZV8zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlID0gbm9kZXNbYWx0ZXJuYXRlTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlXzEuQmFzZVR5cGVzLnB1c2gobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3JFYWNoU3ludGF4TGlzdChjLmdldENoaWxkcmVuKCksIGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmVudW1lcmF0ZUFuZEZpbmREZXBlbmRlbmNpZXMoaXRlbSwgaXRlbXMsIG5vZGVzLCBsYXN0TW9kdWxlTmFtZSwgY3VycmVudE5vZGVfMSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDIwOSAvKiBWYXJpYWJsZURlY2xhcmF0aW9uICovOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlcztcbiAgICB9O1xuICAgIHJldHVybiBQcm9jZXNzb3I7XG59KCkpO1xuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gUHJvY2Vzc29yO1xuIl0sImZpbGUiOiJQcm9jZXNzaW5nLmpzIn0=
