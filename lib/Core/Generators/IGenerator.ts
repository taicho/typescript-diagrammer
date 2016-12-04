import { INodeList } from "../INodeList";
export interface IGenerator {
    generate(nodes: INodeList): string;
}