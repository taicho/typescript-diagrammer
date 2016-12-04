import NodeItem from "./NodeItem";
export default class SerializableNode {
    Parent: number;
    Children: number[] = [];
    FullName: string;
    Name: string;
    KindName: string;
    BaseTypes: number[] = [];
    letiables: number[] = [];
    Parameters: number[] = [];
    Id: number;
    Loc: number = 0;
    constructor(node: NodeItem) {
        node.BaseTypes.forEach((b) => {
            this.BaseTypes.push(b.Id);
        });
        for (let name in node.Children) {
            this.Children.push(node.Children[name].Id);
        }
        this.FullName = node.FullName;
        this.Id = node.Id;
        this.KindName = node.KindName;
        this.Name = node.Name;
        if (node.Parent) {
            this.Parent = node.Parent.Id;
        }
    }
}