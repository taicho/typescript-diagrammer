namespace NamespaceOne {
    export class ClassOne {
        Prop1: string = "fds";
        Prop2: string = "fdsf";
    }

    export class ClassTwo extends ClassOne {
        constructor() {
            super();
        }

        Prop1: string = "fsfd";
    }

    export interface IMyInterface {
        FakeProperty: string;
    }
}


namespace NamespaceTwo {
    export class ClassThree {
        Prop1: string = "fds";
        Prop2: string = "fdsf";
    }

    export class ClassFour extends ClassThree implements NamespaceOne.IMyInterface {
        FakeProperty = "fsdf";

        constructor() {
            super();
        }

        Prop1: string = "fsfd";
    }
}