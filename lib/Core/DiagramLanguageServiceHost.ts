import * as ts from "typescript";
export default class DiagramLanguageServiceHost implements ts.LanguageServiceHost {
    Files: { [fileName: string]: { file: ts.IScriptSnapshot; ver: number } } = {};
    Options: ts.CompilerOptions;


    log = _ => { };
    trace = _ => { };
    error = _ => { };
    getCompilationSettings() {
        if (this.Options) {
            return this.Options;
        }
        return ts.getDefaultCompilerOptions();
    }
    getScriptIsOpen = _ => true;
    getCurrentDirectory = () => "";
    getDefaultLibFileName = (options) => "lib";

    getScriptVersion = fileName => this.Files[fileName].ver.toString();
    getScriptSnapshot = fileName => this.Files[fileName].file;

    getScriptFileNames(): string[] {
        let names: string[] = [];
        for (let name in this.Files) {
            if (this.Files.hasOwnProperty(name)) {
                names.push(name);
            }
        }
        return names;
    }


    addFile(fileName: string, body: string) {
        let snap = ts.ScriptSnapshot.fromString(body);
        snap.getChangeRange = _ => undefined;
        let existing = this.Files[fileName];
        if (existing) {
            this.Files[fileName].ver++;
            this.Files[fileName].file = snap;
        } else {
            this.Files[fileName] = { ver: 1, file: snap };
        }
    }
}