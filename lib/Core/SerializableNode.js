"use strict";
var SerializableNode = (function () {
    function SerializableNode(node) {
        var _this = this;
        this.Children = [];
        this.BaseTypes = [];
        this.letiables = [];
        this.Parameters = [];
        this.Loc = 0;
        node.BaseTypes.forEach(function (b) {
            _this.BaseTypes.push(b.Id);
        });
        for (var name_1 in node.Children) {
            this.Children.push(node.Children[name_1].Id);
        }
        this.FullName = node.FullName;
        this.Id = node.Id;
        this.KindName = node.KindName;
        this.Name = node.Name;
        if (node.Parent) {
            this.Parent = node.Parent.Id;
        }
    }
    return SerializableNode;
}());
exports.__esModule = true;
exports["default"] = SerializableNode;

//# sourceMappingURL=SerializableNode.js.map
