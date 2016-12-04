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

    static IdCounter = 0;

    constructor() {
        this.Id = ++NodeItem.IdCounter;
    }

}