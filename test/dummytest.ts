namespace NamespaceOne {
    export namespace InnerNamespaceOne{
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

    export class ClassX extends ClassTwo {
        constructor() {
            super();
        }

        MyProp = 2;

    }

    export interface IMyInterface {
        FakeProperty: string;
    }
   }
}


namespace NamespaceTwo {
    export class ClassThree {
        Prop1: string = "fds";
        Prop2: string = "fdsf";
    }

    export class ClassFour extends ClassThree implements NamespaceOne.InnerNamespaceOne.IMyInterface {
        FakeProperty = "fsdf";

        constructor() {
            super();
        }

        Prop1: string = "fsfd";
    }
}