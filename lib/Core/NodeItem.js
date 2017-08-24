"use strict";
var tss = require("typescript");
var NodeItem = (function () {
    function NodeItem() {
        this.Children = {};
        this.BaseTypes = [];
        this.Variables = [];
        this.Parameters = [];
        this.Loc = 0;
        this.Id = ++NodeItem.IdCounter;
    }
    NodeItem.fromNode = function (node) {
        if (NodeItem.IsSupportedKindNode(node)) {
            var casted = node;
            var nodeItem = new NodeItem();
            nodeItem.OriginalNode = node;
            nodeItem.KindName = NodeItem.getKindName(node.kind);
            nodeItem.Name = casted.name.text;
            nodeItem.FullName = NodeItem.getFullName(node);
            return nodeItem;
        }
        return null;
    };
    NodeItem.getKindName = function (kind) {
        switch (kind) {
            case tss.SyntaxKind.ClassDeclaration:
                return "Class";
            case tss.SyntaxKind.InterfaceDeclaration:
                return "Interface";
            case tss.SyntaxKind.ModuleDeclaration:
                return "Module";
        }
        return null;
    };
    NodeItem.prototype.resolveParent = function (typeDictionary) {
        if (this.OriginalNode.parent) {
            var names = this.FullName.split(".");
            var parentName = names.slice(0, names.length - 1).join(".");
            var parent_1 = typeDictionary[parentName];
            if (parent_1) {
                this.Parent = parent_1;
            }
        }
    };
    NodeItem.getFullName = function (node) {
        var _this = this;
        var parents = [];
        var originalNode = node;
        while (node.parent) {
            parents.push(node.parent);
            node = node.parent;
        }
        var names = parents.filter(function (p) { return NodeItem.IsSupportedKindNode(p); }).map(function (p) { return _this.getName(p); }).reverse();
        var seperator = names.length === 0 ? "" : ".";
        return "" + names.join(".") + seperator + this.getName(originalNode);
    };
    NodeItem.getName = function (node) {
        if (NodeItem.IsSupportedKindNode(node)) {
            var casted = node;
            return casted.name.text;
        }
        return null;
    };
    NodeItem.IsSupportedKindNode = function (node) {
        return NodeItem.IsSupportedKind(node.kind);
    };
    NodeItem.IsSupportedKind = function (kind) {
        switch (kind) {
            case tss.SyntaxKind.ClassDeclaration:
                return true;
            case tss.SyntaxKind.InterfaceDeclaration:
                return true;
            case tss.SyntaxKind.ModuleDeclaration:
                return true;
        }
        return false;
    };
    NodeItem.IdCounter = 0;
    return NodeItem;
}());
exports.__esModule = true;
exports["default"] = NodeItem;

//# sourceMappingURL=NodeItem.js.map
