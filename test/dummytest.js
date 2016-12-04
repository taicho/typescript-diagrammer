var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var NamespaceOne;
(function (NamespaceOne) {
    var ClassOne = (function () {
        function ClassOne() {
            this.Prop1 = "fds";
            this.Prop2 = "fdsf";
        }
        return ClassOne;
    }());
    NamespaceOne.ClassOne = ClassOne;
    var ClassTwo = (function (_super) {
        __extends(ClassTwo, _super);
        function ClassTwo() {
            _super.call(this);
            this.Prop1 = "fsfd";
        }
        return ClassTwo;
    }(ClassOne));
    NamespaceOne.ClassTwo = ClassTwo;
})(NamespaceOne || (NamespaceOne = {}));
var NamespaceTwo;
(function (NamespaceTwo) {
    var ClassThree = (function () {
        function ClassThree() {
            this.Prop1 = "fds";
            this.Prop2 = "fdsf";
        }
        return ClassThree;
    }());
    NamespaceTwo.ClassThree = ClassThree;
    var ClassFour = (function (_super) {
        __extends(ClassFour, _super);
        function ClassFour() {
            _super.call(this);
            this.FakeProperty = "fsdf";
            this.Prop1 = "fsfd";
        }
        return ClassFour;
    }(ClassThree));
    NamespaceTwo.ClassFour = ClassFour;
})(NamespaceTwo || (NamespaceTwo = {}));
