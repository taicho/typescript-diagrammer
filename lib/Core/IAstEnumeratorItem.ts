import * as tss from "typescript";

export interface IAstEnumeratorItem {
    fullName: string;
    name: string;
    kindName: string;
    kind: tss.SyntaxKind;
    loc: number;
}
