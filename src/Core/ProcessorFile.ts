import * as fs from "fs";
import { IProcessorItem } from "./IProcessorItem";
export default class ProcessorFile implements IProcessorItem {
    Path: string = null;

    constructor(path: string) {
        this.Path = path;
    }

    getText() {
        return fs.readFileSync(this.Path).toString();
    }

}
