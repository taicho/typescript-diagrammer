import * as fs from "fs";
import { IProcessorItem } from "./IProcessorItem";
export default class ProcessorString implements IProcessorItem {

    constructor(public Text: string) {

    }

    getText() {
        return this.Text;
    }
}
