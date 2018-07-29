import * as fs from "fs";
import ProcessorFile from "./ProcessorFile";
import SerializableNode from "./SerializableNode";
import { INodeList } from "./INodeList";




export function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

export function toSerializableNodes(nodes: INodeList) {
    let newNodes: SerializableNode[] = [];
    for (let name in nodes) {
        let item = nodes[name];
        newNodes.push(new SerializableNode(item));
    }
    return newNodes;
}

export function getFilePaths(dir, files: ProcessorFile[], filter) {
    let fileTree = fs.readdirSync(dir);
    fileTree.forEach((f) => {
        let path = dir + "\\" + f;
        let fStat = fs.lstatSync(path);
        if (fStat.isDirectory()) {
            this.getFilePaths(path, files, filter);
        }
        else if (fStat.isFile()) {
            if (filter && filter(path)) {
                let procFile = new ProcessorFile(path);
                files.push(procFile);
            }
            else if (!filter) {
                let procFile = new ProcessorFile(path);
                files.push(procFile);
            }
        }
    });
}