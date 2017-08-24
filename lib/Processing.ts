import * as fs from "fs";
import * as tss from "typescript";
import DiagramLanguageServiceHost from "./Core/DiagramLanguageServiceHost";
import DiagramCompilerHost from "./Core/DiagramCompilerHost";
import { IProcessorItem } from "./Core/IProcessorItem";
import { IAstProcessedItem } from "./Core/IAstProcessedItem";
import { IAstEnumeratorItem } from "./Core/IAstEnumeratorItem";
import { INodeList } from "./Core/INodeList";
import ProcessorFile from "./Core/ProcessorFile";
import NodeItem from "./Core/NodeItem";
import ProcessorString from "./Core/ProcessorFile";
import SerializableNode from "./Core/SerializableNode";
import * as Utilities from "./Core/Utilities";
import { IGenerator } from "./Core/Generators/IGenerator";
import DgmlGenerator from "./Core/Generators/DgmlGenerator";




export default class Processor {
    Nodes: INodeList = null;
    Items: IProcessorItem[] = null;
    Processed = false;
    Generator: IGenerator = new DgmlGenerator();


    static fromDirectory(path: string) {
        let x = new DiagramLanguageServiceHost();
        let processor = new Processor();
        let files = [];
        Utilities.getFilePaths(path, files, function (path) {
            let pathLower = path.toLowerCase();
            if (pathLower.indexOf("d.ts") < 0 && pathLower.indexOf(".ts") >= 0) {
                return true;
            }
            return false;
        });
        processor.Items = files;
    }

    static fromFile(path: string) {
        let processor = new Processor();
        processor.Items = [new ProcessorFile(path)];
        return processor;
    }

    static fromString(str: string) {
        let processor = new Processor();
        processor.Items = [new ProcessorString(str)];
        return processor;
    }

    getAllNodes(sf: tss.SourceFile): tss.Node[] {
        let nodes: tss.Node[] = [];
        function allNodes(n: tss.Node) {
            tss.forEachChild(n, n => { nodes.push(n); allNodes(n); return false; });
        };
        allNodes(sf);
        return nodes;
    }

    testCollections(typeChecker: tss.TypeChecker, nodes: tss.Node[]) {
        let symbols = nodes.map(function (v) { return typeChecker.getSymbolAtLocation(v); }).filter((f) => f != null);
        let types = symbols.map((s) => { return typeChecker.getDeclaredTypeOfSymbol(s); }).filter((f) => f != null);
    }

    execute() {
        if (!this.Processed) {
            let fileNamePart = "Output.ts";
            let source = this.getFileString();
            let host = new DiagramCompilerHost();
            host.addFile(fileNamePart, source);
            let program = tss.createProgram([fileNamePart], host.getCompilationSettings(), host);
            let typeChecker = program.getTypeChecker();
            let sourceFile = program.getSourceFile(fileNamePart);
            let nodes = this.getAllNodes(sourceFile);
            let results = this.buildNodesNew(nodes);
            this.testCollections(typeChecker, nodes);
            this.Processed = true;
            // let syntaxTree = tss.Parser.parse(fileNamePart, tss.SimpleText.fromString(source), /*isDeclaration*/ true,
            //     new tss.ParseOptions(tss.LanguageVersion.EcmaScript5, /*autoSemicolon*/ true));                
            // let cs = new tss.CompilationSettings();
            // cs.codeGenTarget = tss.LanguageVersion.EcmaScript5;
            // let ics = tss.ImmutableCompilationSettings.fromCompilationSettings(cs);
            // let sourceUnit = tss.SyntaxTreeToAstVisitor.visit(syntaxTree, fileNamePart, ics, /*incrementalAST*/ false);                
            // let masterArr = this.enumerate(sourceUnit);
            // let names = this.getDistinctNames(masterArr);
            // let nodes = this.buildNodes(names);
            // let completeNodes = this.enumerateAndFindDependencies(sourceUnit, names, nodes);
            // this.Nodes = completeNodes;
            // this.Processed = true;
        }
    }

    protected getFileString() {
        let fileString = "";
        this.Items.forEach(function (file) {
            let code = file.getText();
            fileString += code;
        });
        return fileString;
    }

    emit(): string {
        this.execute();
        return this.Generator.generate(this.Nodes);
    }



    toJson() {
        return JSON.stringify(Utilities.toSerializableNodes(this.Nodes));
    }

    getAllNames(typeChecker: tss.TypeChecker, nodes: tss.Node[]) {
        return nodes.map((n) => typeChecker.getSymbolAtLocation(n).name);
    }


    // applyLoc() {
    //     this.Files.forEach(function (file) {
    //         let code = fs.readFileSync(file.Path).toString();
    //         file.Loc = code.split("\n").filter((f) => { return f != ""; }).length;
    //     });
    // }
    getDistinctNames(masterArr: any[]): IAstProcessedItem {
        let names: IAstProcessedItem = {};
        masterArr.forEach((item) => {
            if (!(item.name in names)) {
                names[item.fullName] = item;
            }
        });
        return names;

    }

    getName(nameObject, arr: string[] = []) {
        if (typeof (nameObject) === "string") {
            arr.push(nameObject);
        }
        else if (nameObject.name) {
            this.getName(nameObject.name, arr);
        }
        else if (nameObject.identifier) {
            this.getName(nameObject.identifier, arr);
        }
        else if (nameObject.left) {
            let n = <tss.QualifiedName>nameObject;
            this.getName(n.left, arr);
            this.getName(n.right, arr);
        }
        else if (nameObject.text) {
            this.getName(nameObject, arr);
        }
        // else if (nameObject instanceof tss.EntityName) {
        //     let n = <tss.QualifiedName>nameObject;        
        //     getName(n.left, arr);
        //     getName(n.right, arr);
        // }
        // else if (nameObject instanceof tss.Identifier) {
        //     let n = <tss.Identifier>nameObject;
        //     arr.push(n.text());
        // }
        return arr.join(".");
    }


    getBaseTypeNames(node: tss.Node) {
        let results = [];
        let clauses: tss.HeritageClause[];
        if (node.kind === tss.SyntaxKind.ClassDeclaration) {
            let casted = <tss.ClassLikeDeclaration>node;
            clauses = casted.heritageClauses;
        }
        else if (node.kind === tss.SyntaxKind.InterfaceDeclaration) {
            let casted = <tss.InterfaceDeclaration>node;
            clauses = casted.heritageClauses;
        }
        if (clauses) {
            for (let i = 0, len = clauses.length; i < len; i++) {
                let clause = clauses[i];
                if (clause.types) {
                    for (let x = 0, len2 = clause.types.length; x < len2; x++) {
                        let type = clause.types[x];
                        if (type.expression.kind === tss.SyntaxKind.Identifier) {
                            results.push(type.expression.getText());
                        }
                    }
                }
            }

            return results;
        }
        return null;
    }

    buildNodesNew(nodes: tss.Node[]) {
        let supportedType = tss.SyntaxKind.ClassDeclaration | tss.SyntaxKind.InterfaceDeclaration | tss.SyntaxKind.ModuleDeclaration;
        nodes = nodes.filter((n) => NodeItem.IsSupportedKindNode(n));
        let results: NodeItem[] = [];
        for (let i = 0, len = nodes.length; i < len; i++) {
            let node = nodes[i];
            let nodeItem = NodeItem.fromNode(node);
            results.push(nodeItem);
        }
        this.resolveNodes(results);
        return results;
    }

    getNodeList(nodes: NodeItem[]): INodeList {
        let dictionary = {};
        nodes.forEach((n) => {
            dictionary[n.FullName] = n;
        });
        return dictionary;
    }

    resolveNodes(nodes: NodeItem[]) {
        const dictionary = this.getNodeList(nodes);
        for (let i = 0, len = nodes.length; i < len; i++) {
            let node = nodes[i];
            node.resolveParent(dictionary);
        }
    }



    buildNodes(items: IAstProcessedItem): INodeList {
        let nodeList: INodeList = {};
        for (let name in items) {
            let item = items[name];
            if (item.kind === tss.SyntaxKind.ModuleDeclaration) {
                let fullNameSplit = item.fullName.split(".");
                let lastNode: NodeItem = null;
                let fullName: string[] = [];
                fullNameSplit.forEach((splitName) => {
                    fullName.push(splitName);
                    let fullNameCurrent = fullName.join(".");
                    let nodeItem: NodeItem = null;
                    if (lastNode) {
                        nodeItem = lastNode.Children[splitName];
                    }
                    else {
                        nodeItem = nodeList[fullNameCurrent];
                    }
                    if (!nodeItem) {
                        let newNode = new NodeItem();
                        nodeItem = newNode;
                        newNode.Name = splitName;
                        newNode.FullName = fullNameCurrent;
                        newNode.KindName = "Module";
                        newNode.Loc = item.loc;
                        nodeList[newNode.FullName] = newNode;
                        if (lastNode) {
                            newNode.Parent = lastNode;
                            lastNode.Children[newNode.Name] = newNode;
                        }
                    }
                    lastNode = nodeItem;
                });
            }
        }
        for (let name in items) {
            let item = items[name];
            if (item.kind === tss.SyntaxKind.ClassDeclaration || item.kind === tss.SyntaxKind.InterfaceDeclaration) {
                let classPath = item.fullName.replace("." + item.name, "");
                let parentNode = nodeList[classPath];
                let newNode = new NodeItem();
                newNode.KindName = item.kind === tss.SyntaxKind.ClassDeclaration ? "Class" : "Interface";
                newNode.FullName = item.fullName;
                newNode.Loc = item.loc;
                newNode.Name = item.name;
                newNode.Parent = parentNode;
                if (parentNode) {
                    parentNode.Children[item.name] = newNode;
                }
                nodeList[newNode.FullName] = newNode;
            }
        }


        return nodeList;
    }


    forEachSyntaxList(list: any[], func: (item: any, index?: number) => void) {
        let count = list.length;
        for (let i = 0; i < count; i++) {
            func(list[i], i);
        }
    }


    enumerate(unit, masterArr: IAstEnumeratorItem[] = [], lastModuleName = "") {
        let modules = null;
        let classes = null;
        let kind = unit.kind();
        let fullName = null;
        let name = null;
        if (lastModuleName) {
            name = this.getName(unit);
            fullName = lastModuleName + "." + name;
        }
        else {
            fullName = this.getName(unit);
            name = fullName;
        }
        let kindName = this.getKindName(kind);
        switch (kind) {
            case tss.SyntaxKind.ModuleDeclaration:
                let m = <tss.ModuleDeclaration>unit;
                masterArr.push({ fullName: fullName, name: name, kindName: kindName, kind: kind, loc: m.getEnd() - m.getStart() });
                lastModuleName = fullName;
                this.forEachSyntaxList(m.getChildren(), (item) => {
                    this.enumerate(item, masterArr, lastModuleName);
                });
                break;

            case tss.SyntaxKind.ClassDeclaration:
                let c = <tss.ClassDeclaration>unit;
                masterArr.push({ fullName: fullName, name: name, kindName: kindName, kind: kind, loc: c.getEnd() - c.getStart() });
                this.forEachSyntaxList(c.getChildren(), (item) => {
                    this.enumerate(item, masterArr);
                });
                break;
            case tss.SyntaxKind.InterfaceDeclaration:
                let ix = <tss.ClassDeclaration>unit;
                masterArr.push({ fullName: fullName, name: name, kindName: kindName, kind: kind, loc: ix.getEnd() - ix.getStart() });
                break;
            case tss.SyntaxKind.VariableDeclaration:
                break;
        }


        return masterArr;
    }


    getKindName(kind: tss.SyntaxKind) {
        switch (kind) {
            case tss.SyntaxKind.ModuleDeclaration:
                return "Module";
            case tss.SyntaxKind.ClassDeclaration:
                return "Class";
        }
        return "Unknown";
    }

    enumerateAndFindDependencies(unit, items: IAstProcessedItem, nodes: INodeList, lastModuleName = "", lastNode?: NodeItem) {
        let modules = null;
        let name = null;
        let classes = null;
        let kind = unit.kind();
        let fullName = null;
        if (lastModuleName) {
            name = this.getName(unit);
            fullName = lastModuleName + "." + name;
        }
        else {
            fullName = this.getName(unit);
            name = fullName;
        }
        let kindName = this.getKindName(kind);
        switch (kind) {
            case tss.SyntaxKind.SourceFile:
            case tss.SyntaxKind.ModuleDeclaration:
                let m = <tss.ModuleDeclaration>unit;
                lastModuleName = fullName;
                this.forEachSyntaxList(m.getChildren(), (item) => {
                    this.enumerateAndFindDependencies(item, items, nodes, lastModuleName);
                });
                break;

            case tss.SyntaxKind.ClassDeclaration:
                let c = <tss.ClassDeclaration>unit;

                let currentNode = nodes[fullName];
                this.forEachSyntaxList(c.heritageClauses, (item) => {
                    if (item.types) {
                        for (let i = 0; i < item.types.length; i++) {
                            let name = this.getName(item.types[i]);
                            let newName = lastModuleName + "." + name;
                            let node = nodes[newName];
                            if (!node) {
                                let alternateName = lastModuleName.substring(0, lastModuleName.lastIndexOf(".") + 1) + name;
                                node = nodes[alternateName];
                            }
                            if (node) {
                                currentNode.BaseTypes.push(node);
                            }
                        }


                    }
                });
                this.forEachSyntaxList(c.getChildren(), (item) => {
                    this.enumerateAndFindDependencies(item, items, nodes, lastModuleName, currentNode);
                });
                break;
            case tss.SyntaxKind.VariableDeclaration:
                break;
        }


        return nodes;
    }


}

















