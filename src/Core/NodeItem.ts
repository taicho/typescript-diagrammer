import * as tss from "typescript";
import { INodeList } from "./INodeList";

export default class NodeItem {
    Parent: NodeItem;
    Children: INodeList = {};
    FullName: string;
    Name: string;
    KindName: string;
    BaseTypes: NodeItem[] = [];
    Variables: NodeItem[] = [];
    Parameters: NodeItem[] = [];
    Id: number;
    Loc: number = 0;
    OriginalNode: tss.Node;

    static IdCounter = 0;

    constructor() {
        this.Id = ++NodeItem.IdCounter;
    }

    static fromNode(node: tss.Node): NodeItem {
        if (NodeItem.IsSupportedKindNode(node)) {
            let casted = <tss.ClassLikeDeclaration>node;
            let nodeItem = new NodeItem();
            nodeItem.OriginalNode = node;
            nodeItem.KindName = NodeItem.getKindName(node.kind);
            nodeItem.Name = casted.name.text;
            nodeItem.FullName = NodeItem.getFullName(node);
            return nodeItem;
        }
        return null;
    }

    static getKindName(kind: tss.SyntaxKind) {
        switch (kind) {
            case tss.SyntaxKind.ClassDeclaration:
                return "Class";
            case tss.SyntaxKind.InterfaceDeclaration:
                return "Interface";
            case tss.SyntaxKind.ModuleDeclaration:
                return "Module";
        }
        return null;
    }

    resolveParent(typeDictionary: INodeList) {
        if (this.OriginalNode.parent) {
            let names = this.FullName.split(".");
            let parentName = names.slice(0, names.length - 1).join(".");
            let parent = typeDictionary[parentName];
            if (parent) {
                this.Parent = parent;
            }
        }

    }

    static getFullName(node: tss.Node): string {
        let parents: tss.Node[] = [];
        let originalNode = node;
        while (node.parent) {
            parents.push(node.parent);
            node = node.parent;
        }
        let names = parents.filter((p) => NodeItem.IsSupportedKindNode(p)).map((p) => this.getName(p)).reverse();
        let seperator = names.length === 0 ? "" : ".";
        return `${names.join(".")}${seperator}${this.getName(originalNode)}`;
    }

    static getName(node: tss.Node) {
        if (NodeItem.IsSupportedKindNode(node)) {
            let casted = <tss.ClassLikeDeclaration>node;
            return casted.name.text;
        }
        return null;
    }

    static IsSupportedKindNode(node: tss.Node) {
        return NodeItem.IsSupportedKind(node.kind);
    }

    static IsSupportedKind(kind: tss.SyntaxKind) {
        switch (kind) {
            case tss.SyntaxKind.ClassDeclaration:
                return true;
            case tss.SyntaxKind.InterfaceDeclaration:
                return true;
            case tss.SyntaxKind.ModuleDeclaration:
                return true;
        }
        return false;
    }

}