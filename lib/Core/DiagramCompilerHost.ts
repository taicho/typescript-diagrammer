import * as ts from "typescript";
import DiagramLanguageServiceHost from "./DiagramLanguageServiceHost";
export default class DiagramCompilerHost extends DiagramLanguageServiceHost implements ts.CompilerHost {
    getSourceFile(filename: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile {
        let f = this.Files[filename];
        if (!f) return null;
        let sourceFile = ts.createLanguageServiceSourceFile(filename, f.file, ts.ScriptTarget.ES5, f.ver.toString(), true);
        return sourceFile;
    }
    writeFile(filename: string, data: string, writeByteOrderMark: boolean, onError?: (message: string) => void): void {
    }
    getCanonicalFileName = (fileName: string) => fileName;
    useCaseSensitiveFileNames = () => true;
    getNewLine = () => "\n";

    fileExists(str: string) {
        return true;
    }

    readFile(str: string) {
        return "";
    }

    getDirectories = (path) => [];

}