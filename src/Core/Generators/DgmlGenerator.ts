import { IGenerator } from "./IGenerator";
import { INodeList } from "../INodeList";
import * as Utilities from "../Utilities";
import SerializableNode from "../SerializableNode";
import * as builder from "xmlbuilder";
export default class DgmlGenerator implements IGenerator {


    generate(nodes: INodeList): string {
        return this.getNodeXml(nodes);
    }

    getNodeXml(nodes: INodeList) {
        const completeNodes = nodes;

        const objectNodes = Utilities.toSerializableNodes(completeNodes);
        const nodeMap: { [index: number]: SerializableNode } = {};
        objectNodes.forEach((n) => {
            nodeMap[n.Id] = n;
        });
        const doc = builder.create("DirectedGraph");
        const nodesEle = doc.ele("Nodes");
        const linksEle = doc.ele("Links");
        for (let id in nodeMap) {
            let node = nodeMap[id];
            switch (node.KindName) {
                case "Class":
                case "Interface":
                    if (node.KindName === "Class" || node.KindName === "Interface") {
                        nodesEle.ele("Node", {
                            Category: node.KindName === "Class" ? "CodeSchema_Class" : "CodeSchema_Interface", Group: "Collapsed", Id: id, Label: node.KindName === "Class" ? node.Name : "Interface:" + node.Name
                        });
                    }
                    node.BaseTypes.forEach((baseNode) => {
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


        }
        doc.att("xmlns", "http://schemas.microsoft.com/vs/2009/dgml");
        this.addStyles(doc);
        return doc.end({ pretty: true });
    }

    addStyles(xmlRoot) {
        let styles = xmlRoot.ele("Styles");
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
    }
}