import Processor from "./Processing";
let proc = Processor.fromFile("/Users/taicho/Google Drive/Current Development/Git/typescript-diagrammer/test/dummytest.ts");
let str = proc.emit();