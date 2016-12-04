"use strict";
var NodeItem = (function () {
    function NodeItem() {
        this.Children = {};
        this.BaseTypes = [];
        this.Variables = [];
        this.Parameters = [];
        this.Loc = 0;
        this.Id = ++NodeItem.IdCounter;
    }
    NodeItem.IdCounter = 0;
    return NodeItem;
}());
exports.__esModule = true;
exports["default"] = NodeItem;

//# sourceMappingURL=NodeItem.js.map
