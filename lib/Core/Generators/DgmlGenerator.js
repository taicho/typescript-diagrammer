"use strict";
var Utilities = require("../Utilities");
var builder = require("xmlbuilder");
var DgmlGenerator = (function () {
    function DgmlGenerator() {
    }
    DgmlGenerator.prototype.generate = function (nodes) {
        return this.getNodeXml(nodes);
    };
    DgmlGenerator.prototype.getNodeXml = function (nodes) {
        var completeNodes = nodes;
        var objectNodes = Utilities.toSerializableNodes(completeNodes);
        var nodeMap = {};
        objectNodes.forEach(function (n) {
            nodeMap[n.Id] = n;
        });
        var doc = builder.create("DirectedGraph");
        var nodesEle = doc.ele("Nodes");
        var linksEle = doc.ele("Links");
        var _loop_1 = function(id) {
            var node = nodeMap[id];
            switch (node.KindName) {
                case "Class":
                case "Interface":
                    if (node.KindName === "Class" || node.KindName === "Interface") {
                        nodesEle.ele("Node", {
                            Category: node.KindName === "Class" ? "CodeSchema_Class" : "CodeSchema_Interface", Group: "Collapsed", Id: id, Label: node.KindName === "Class" ? node.Name : "Interface:" + node.Name
                        });
                    }
                    node.BaseTypes.forEach(function (baseNode) {
                        linksEle.ele("Link", { Source: baseNode, Target: id });
                    });
                    break;
                case "Module":
                    nodesEle.ele("Node", {
                        Id: id, Label: node.Name, Group: "Expanded", Category: "CodeSchema_Namespace"
                    });
                    break;
            }
            if (node.Parent) {
                linksEle.ele("Link", { Source: node.Parent, Target: id, Category: "Contains" });
            }
        };
        for (var id in nodeMap) {
            _loop_1(id);
        }
        doc.att("xmlns", "http://schemas.microsoft.com/vs/2009/dgml");
        this.addStyles(doc);
        return doc.end({ pretty: true });
    };
    DgmlGenerator.prototype.addStyles = function (xmlRoot) {
        var styles = xmlRoot.ele("Styles");
        styles.ele({
            "#list": [{
                    Style: {
                        TargetType: "Node",
                        GroupLabel: "Class",
                        ValueLabel: "Has category",
                        Condition: { Expression: "HasCategory('CodeSchema_Type')" },
                        "#list": [
                            { Setter: { Property: "Background", Value: "#FF1382CE" } },
                            { Setter: { Property: "Stroke", Value: "#FF1382CE" } },
                            { Setter: { Property: "Icon", Value: "CodeSchema_Class" } },
                        ]
                    }
                },
                {
                    Style: {
                        TargetType: "Node",
                        GroupLabel: "Namespace",
                        ValueLabel: "Has category",
                        Condition: { Expression: "HasCategory('CodeSchema_Namespace')" },
                        "#list": [
                            { Setter: { Property: "Background", Value: "#FF0E619A" } },
                            { Setter: { Property: "Stroke", Value: "#FF0E619A" } },
                            { Setter: { Property: "Icon", Value: "CodeSchema_Namespace" } },
                        ]
                    }
                },
                {
                    Style: {
                        TargetType: "Node",
                        GroupLabel: "Interface",
                        ValueLabel: "Has category",
                        Condition: { Expression: "HasCategory('CodeSchema_Interface')" },
                        "#list": [
                            { Setter: { Property: "Background", Value: "#FF1382CE" } },
                            { Setter: { Property: "Stroke", Value: "#FF1382CE" } },
                            { Setter: { Property: "Icon", Value: "CodeSchema_Interface" } },
                        ]
                    }
                }
            ]
        });
    };
    return DgmlGenerator;
}());
exports.__esModule = true;
exports["default"] = DgmlGenerator;

//# sourceMappingURL=DgmlGenerator.js.map
