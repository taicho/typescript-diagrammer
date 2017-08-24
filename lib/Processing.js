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
    Processor.prototype.testCollections = function (typeChecker, nodes) {
        var symbols = nodes.map(function (v) { return typeChecker.getSymbolAtLocation(v); }).filter(function (f) { return f != null; });
        var types = symbols.map(function (s) { return typeChecker.getDeclaredTypeOfSymbol(s); }).filter(function (f) { return f != null; });
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
            var results = this.buildNodesNew(nodes);
            this.testCollections(typeChecker, nodes);
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
    Processor.prototype.getAllNames = function (typeChecker, nodes) {
        return nodes.map(function (n) { return typeChecker.getSymbolAtLocation(n).name; });
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
    Processor.prototype.getBaseTypeNames = function (node) {
        var results = [];
        var clauses;
        if (node.kind === tss.SyntaxKind.ClassDeclaration) {
            var casted = node;
            clauses = casted.heritageClauses;
        }
        else if (node.kind === tss.SyntaxKind.InterfaceDeclaration) {
            var casted = node;
            clauses = casted.heritageClauses;
        }
        if (clauses) {
            for (var i = 0, len = clauses.length; i < len; i++) {
                var clause = clauses[i];
                if (clause.types) {
                    for (var x = 0, len2 = clause.types.length; x < len2; x++) {
                        var type = clause.types[x];
                        if (type.expression.kind === tss.SyntaxKind.Identifier) {
                            results.push(type.expression.getText());
                        }
                    }
                }
            }
            return results;
        }
        return null;
    };
    Processor.prototype.buildNodesNew = function (nodes) {
        var supportedType = tss.SyntaxKind.ClassDeclaration | tss.SyntaxKind.InterfaceDeclaration | tss.SyntaxKind.ModuleDeclaration;
        nodes = nodes.filter(function (n) { return NodeItem_1["default"].IsSupportedKindNode(n); });
        var results = [];
        for (var i = 0, len = nodes.length; i < len; i++) {
            var node = nodes[i];
            var nodeItem = NodeItem_1["default"].fromNode(node);
            results.push(nodeItem);
        }
        this.resolveNodes(results);
        return results;
    };
    Processor.prototype.getNodeList = function (nodes) {
        var dictionary = {};
        nodes.forEach(function (n) {
            dictionary[n.FullName] = n;
        });
        return dictionary;
    };
    Processor.prototype.resolveNodes = function (nodes) {
        var dictionary = this.getNodeList(nodes);
        for (var i = 0, len = nodes.length; i < len; i++) {
            var node = nodes[i];
            node.resolveParent(dictionary);
        }
    };
    Processor.prototype.buildNodes = function (items) {
        var nodeList = {};
        var _loop_1 = function(name_1) {
            var item = items[name_1];
            if (item.kind === tss.SyntaxKind.ModuleDeclaration) {
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
            if (item.kind === tss.SyntaxKind.ClassDeclaration || item.kind === tss.SyntaxKind.InterfaceDeclaration) {
                var classPath = item.fullName.replace("." + item.name, "");
                var parentNode = nodeList[classPath];
                var newNode = new NodeItem_1["default"]();
                newNode.KindName = item.kind === tss.SyntaxKind.ClassDeclaration ? "Class" : "Interface";
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
            case tss.SyntaxKind.ModuleDeclaration:
                var m = unit;
                masterArr.push({ fullName: fullName, name: name, kindName: kindName, kind: kind, loc: m.getEnd() - m.getStart() });
                lastModuleName = fullName;
                this.forEachSyntaxList(m.getChildren(), function (item) {
                    _this.enumerate(item, masterArr, lastModuleName);
                });
                break;
            case tss.SyntaxKind.ClassDeclaration:
                var c = unit;
                masterArr.push({ fullName: fullName, name: name, kindName: kindName, kind: kind, loc: c.getEnd() - c.getStart() });
                this.forEachSyntaxList(c.getChildren(), function (item) {
                    _this.enumerate(item, masterArr);
                });
                break;
            case tss.SyntaxKind.InterfaceDeclaration:
                var ix = unit;
                masterArr.push({ fullName: fullName, name: name, kindName: kindName, kind: kind, loc: ix.getEnd() - ix.getStart() });
                break;
            case tss.SyntaxKind.VariableDeclaration:
                break;
        }
        return masterArr;
    };
    Processor.prototype.getKindName = function (kind) {
        switch (kind) {
            case tss.SyntaxKind.ModuleDeclaration:
                return "Module";
            case tss.SyntaxKind.ClassDeclaration:
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
            case tss.SyntaxKind.SourceFile:
            case tss.SyntaxKind.ModuleDeclaration:
                var m = unit;
                lastModuleName = fullName;
                this.forEachSyntaxList(m.getChildren(), function (item) {
                    _this.enumerateAndFindDependencies(item, items, nodes, lastModuleName);
                });
                break;
            case tss.SyntaxKind.ClassDeclaration:
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
            case tss.SyntaxKind.VariableDeclaration:
                break;
        }
        return nodes;
    };
    return Processor;
}());
exports.__esModule = true;
exports["default"] = Processor;

//# sourceMappingURL=Processing.js.map
