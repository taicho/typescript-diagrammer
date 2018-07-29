import * as fs from 'fs';
import * as tss from 'typescript';
import DiagramCompilerHost from './Core/DiagramCompilerHost';
import DiagramLanguageServiceHost from './Core/DiagramLanguageServiceHost';
import DgmlGenerator from './Core/Generators/DgmlGenerator';
import { IGenerator } from './Core/Generators/IGenerator';
import { IAstEnumeratorItem } from './Core/IAstEnumeratorItem';
import { IAstProcessedItem } from './Core/IAstProcessedItem';
import { INodeList } from './Core/INodeList';
import { IProcessorItem } from './Core/IProcessorItem';
import NodeItem from './Core/NodeItem';
import ProcessorFile from './Core/ProcessorFile';
import ProcessorString from './Core/ProcessorFile';
import SerializableNode from './Core/SerializableNode';
import * as Utilities from './Core/Utilities';

export default class Processor {

    public static fromDirectory(path: string) {
        const x = new DiagramLanguageServiceHost();
        const processor = new Processor();
        const files = [];
        Utilities.getFilePaths(path, files, (path2) => {
            const pathLower = path2.toLowerCase();
            if (pathLower.indexOf('d.ts') < 0 && pathLower.indexOf('.ts') >= 0) {
                return true;
            }
            return false;
        });
        processor.Items = files;
    }

    public static fromFile(path: string) {
        const processor = new Processor();
        processor.Items = [new ProcessorFile(path)];
        return processor;
    }

    public static fromString(str: string) {
        const processor = new Processor();
        processor.Items = [new ProcessorString(str)];
        return processor;
    }
    public Nodes: INodeList = null;
    public Items: IProcessorItem[] = null;
    public Processed = false;
    public Generator: IGenerator = new DgmlGenerator();

    public getAllNodes(sf: tss.SourceFile): tss.Node[] {
        const nodes: tss.Node[] = [];
        function allNodes(n: tss.Node) {
            tss.forEachChild(n, (n2) => { nodes.push(n2); allNodes(n2); return false; });
        }
        allNodes(sf);
        return nodes;
    }

    public testCollections(typeChecker: tss.TypeChecker, nodes: tss.Node[]) {
        const symbols = nodes.map((v) => typeChecker.getSymbolAtLocation(v)).filter((f) => f != null);
        const types = symbols.map((s) => typeChecker.getDeclaredTypeOfSymbol(s)).filter((f) => f != null);
    }

    public execute() {
        if (!this.Processed) {
            const fileNamePart = 'Output.ts';
            const source = this.getFileString();
            const host = new DiagramCompilerHost();
            host.addFile(fileNamePart, source);
            const program = tss.createProgram([fileNamePart], host.getCompilationSettings(), host);
            const typeChecker = program.getTypeChecker();
            const sourceFile = program.getSourceFile(fileNamePart);
            const nodes = this.getAllNodes(sourceFile);
            const results = this.buildNodesNew(nodes);
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

    public emit(): string {
        this.execute();
        return this.Generator.generate(this.Nodes);
    }

    public toJson() {
        return JSON.stringify(Utilities.toSerializableNodes(this.Nodes));
    }

    public getAllNames(typeChecker: tss.TypeChecker, nodes: tss.Node[]) {
        return nodes.map((n) => typeChecker.getSymbolAtLocation(n).name);
    }

    // applyLoc() {
    //     this.Files.forEach(function (file) {
    //         let code = fs.readFileSync(file.Path).toString();
    //         file.Loc = code.split("\n").filter((f) => { return f != ""; }).length;
    //     });
    // }
    public getDistinctNames(masterArr: any[]): IAstProcessedItem {
        const names: IAstProcessedItem = {};
        masterArr.forEach((item) => {
            if (!(item.name in names)) {
                names[item.fullName] = item;
            }
        });
        return names;

    }

    public getName(nameObject, arr: string[] = []) {
        if (typeof (nameObject) === 'string') {
            arr.push(nameObject);
        } else if (nameObject.name) {
            this.getName(nameObject.name, arr);
        } else if (nameObject.identifier) {
            this.getName(nameObject.identifier, arr);
        } else if (nameObject.left) {
            const n = nameObject as tss.QualifiedName;
            this.getName(n.left, arr);
            this.getName(n.right, arr);
        } else if (nameObject.text) {
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
        return arr.join('.');
    }

    public getBaseTypeNames(node: tss.Node) {
        const results = [];
        let clauses: tss.HeritageClause[];
        if (node.kind === tss.SyntaxKind.ClassDeclaration) {
            const casted = node as tss.ClassLikeDeclaration;
            clauses = casted.heritageClauses as any;
        } else if (node.kind === tss.SyntaxKind.InterfaceDeclaration) {
            const casted = node as tss.InterfaceDeclaration;
            clauses = casted.heritageClauses as any;
        }
        if (clauses) {
            for (let i = 0, len = clauses.length; i < len; i++) {
                const clause = clauses[i];
                if (clause.types) {
                    for (let x = 0, len2 = clause.types.length; x < len2; x++) {
                        const type = clause.types[x];
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

    public buildNodesNew(nodes: tss.Node[]) {
        // tslint:disable-next-line:no-bitwise
        const supportedType = tss.SyntaxKind.ClassDeclaration | tss.SyntaxKind.InterfaceDeclaration | tss.SyntaxKind.ModuleDeclaration;
        nodes = nodes.filter((n) => NodeItem.IsSupportedKindNode(n));
        const results: NodeItem[] = [];
        for (let i = 0, len = nodes.length; i < len; i++) {
            const node = nodes[i];
            const nodeItem = NodeItem.fromNode(node);
            results.push(nodeItem);
        }
        this.resolveNodes(results);
        return results;
    }

    public getNodeList(nodes: NodeItem[]): INodeList {
        const dictionary = {};
        nodes.forEach((n) => {
            dictionary[n.FullName] = n;
        });
        return dictionary;
    }

    public resolveNodes(nodes: NodeItem[]) {
        const dictionary = this.getNodeList(nodes);
        for (let i = 0, len = nodes.length; i < len; i++) {
            const node = nodes[i];
            node.resolveParent(dictionary);
        }
    }

    public buildNodes(items: IAstProcessedItem): INodeList {
        const nodeList: INodeList = {};
        for (const name of Object.keys(items)) {
            const item = items[name];
            if (item.kind === tss.SyntaxKind.ModuleDeclaration) {
                const fullNameSplit = item.fullName.split('.');
                let lastNode: NodeItem = null;
                const fullName: string[] = [];
                fullNameSplit.forEach((splitName) => {
                    fullName.push(splitName);
                    const fullNameCurrent = fullName.join('.');
                    let nodeItem: NodeItem = null;
                    if (lastNode) {
                        nodeItem = lastNode.Children[splitName];
                    } else {
                        nodeItem = nodeList[fullNameCurrent];
                    }
                    if (!nodeItem) {
                        const newNode = new NodeItem();
                        nodeItem = newNode;
                        newNode.Name = splitName;
                        newNode.FullName = fullNameCurrent;
                        newNode.KindName = 'Module';
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
        for (const name of Object.keys(items)) {
            const item = items[name];
            if (item.kind === tss.SyntaxKind.ClassDeclaration || item.kind === tss.SyntaxKind.InterfaceDeclaration) {
                const classPath = item.fullName.replace('.' + item.name, '');
                const parentNode = nodeList[classPath];
                const newNode = new NodeItem();
                newNode.KindName = item.kind === tss.SyntaxKind.ClassDeclaration ? 'Class' : 'Interface';
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

    public forEachSyntaxList(list: any[], func: (item: any, index?: number) => void) {
        const count = list.length;
        for (let i = 0; i < count; i++) {
            func(list[i], i);
        }
    }

    public enumerate(unit, masterArr: IAstEnumeratorItem[] = [], lastModuleName = '') {
        const modules = null;
        const classes = null;
        const kind = unit.kind();
        let fullName = null;
        let name = null;
        if (lastModuleName) {
            name = this.getName(unit);
            fullName = lastModuleName + '.' + name;
        } else {
            fullName = this.getName(unit);
            name = fullName;
        }
        const kindName = this.getKindName(kind);
        switch (kind) {
            case tss.SyntaxKind.ModuleDeclaration:
                const m = unit as tss.ModuleDeclaration;
                masterArr.push({ fullName, name, kindName, kind, loc: m.getEnd() - m.getStart() });
                lastModuleName = fullName;
                this.forEachSyntaxList(m.getChildren(), (item) => {
                    this.enumerate(item, masterArr, lastModuleName);
                });
                break;

            case tss.SyntaxKind.ClassDeclaration:
                const c = unit as tss.ClassDeclaration;
                masterArr.push({ fullName, name, kindName, kind, loc: c.getEnd() - c.getStart() });
                this.forEachSyntaxList(c.getChildren(), (item) => {
                    this.enumerate(item, masterArr);
                });
                break;
            case tss.SyntaxKind.InterfaceDeclaration:
                const ix = unit as tss.ClassDeclaration;
                masterArr.push({ fullName, name, kindName, kind, loc: ix.getEnd() - ix.getStart() });
                break;
            case tss.SyntaxKind.VariableDeclaration:
                break;
        }

        return masterArr;
    }

    public getKindName(kind: tss.SyntaxKind) {
        switch (kind) {
            case tss.SyntaxKind.ModuleDeclaration:
                return 'Module';
            case tss.SyntaxKind.ClassDeclaration:
                return 'Class';
        }
        return 'Unknown';
    }

    public enumerateAndFindDependencies(unit, items: IAstProcessedItem, nodes: INodeList, lastModuleName = '', lastNode?: NodeItem) {
        const modules = null;
        let name = null;
        const classes = null;
        const kind = unit.kind();
        let fullName = null;
        if (lastModuleName) {
            name = this.getName(unit);
            fullName = lastModuleName + '.' + name;
        } else {
            fullName = this.getName(unit);
            name = fullName;
        }
        const kindName = this.getKindName(kind);
        switch (kind) {
            case tss.SyntaxKind.SourceFile:
            case tss.SyntaxKind.ModuleDeclaration:
                const m = unit as tss.ModuleDeclaration;
                lastModuleName = fullName;
                this.forEachSyntaxList(m.getChildren(), (item) => {
                    this.enumerateAndFindDependencies(item, items, nodes, lastModuleName);
                });
                break;

            case tss.SyntaxKind.ClassDeclaration:
                const c = unit as tss.ClassDeclaration;

                const currentNode = nodes[fullName];
                this.forEachSyntaxList(c.heritageClauses as any, (item) => {
                    if (item.types) {
                        for (const typeItem of item.types) {
                            const typeName = this.getName(typeItem);
                            const newName = lastModuleName + '.' + typeName;
                            let node = nodes[newName];
                            if (!node) {
                                const alternateName = lastModuleName.substring(0, lastModuleName.lastIndexOf('.') + 1) + typeName;
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

    protected getFileString() {
        let fileString = '';
        this.Items.forEach((file) => {
            const code = file.getText();
            fileString += code;
        });
        return fileString;
    }

}
