export class D3Generator {

    // private static toD3Nodes(nodeList: NodeList, name: string, size: number = null) {
    //     var root = { name: name, children: [], size: size };
    //     if (nodeList) {
    //         for (var id in nodeList) {
    //             var nodeItem = nodeList[id];
    //             root.children.push(this.toD3Nodes(nodeItem.Children, nodeItem.Name, Utilities.randomInt(10, 2000)));
    //         }
    //     }
    //     return root;
    // }

    // static createLocTree(processor: Processor) {
    //     processor.execute();
    //     processor.applyLoc();
    //     var nodeList = processor.Nodes;








    //     var w = 5000 - 80,
    //         h = 5000 - 180,
    //         x = d3.scale.linear().range([0, w]),
    //         y = d3.scale.linear().range([0, h]),
    //         color = d3.scale.category20c(),
    //         root,
    //         node;

    //     var treemap = d3.layout.treemap()
    //         .round(false)
    //         .size([w, h])
    //         .sticky(true)
    //         .value(function (d) { return d.size; });

    //     root = this.toD3Nodes(nodeList, "Root", Utilities.randomInt(10, 2000));

    //     var nodes = <any[]>treemap.nodes(root)
    //         .filter(function (d) { return !d.children; });

    //     var doc = builder.create({ svg: { "@width": w, "@height": h } });
    //     var group = doc.ele({ "g": { "@transform": "translate(0.5,0.5)" } });

    //     nodes.forEach((node) => {
    //         var innerGroup = group.ele({
    //             g: {
    //                 "@transform": `translate(${node.x},${node.y})`,
    //                 rect: {
    //                     "@width": node.dx - 1,
    //                     "@height": node.dy - 1,
    //                     "@fill": color(node.name),
    //                 },
    //                 text: {
    //                     "@x": node.dx / 2,
    //                     "@y": node.dy / 2,
    //                     "@dy": "0.35em",
    //                     "@text-anchor": "middle",
    //                     "#text": node.name
    //                 }
    //             }
    //         });


    //     });
    //     var result = doc.end({ pretty: true });



    //     //var svg = d3.select("body").append("div")
    //     //    .attr("class", "chart")
    //     //    .style("width", w + "px")
    //     //    .style("height", h + "px")
    //     //    .append("svg:svg")
    //     //    .attr("width", w)
    //     //    .attr("height", h)
    //     //    .append("svg:g")
    //     //    .attr("transform", "translate(.5,.5)");

    //     //var cell = svg.selectAll("g")
    //     //    .data(nodes)
    //     //    .enter().append("svg:g")
    //     //    .attr("class", "cell")
    //     //    .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; }); 

    //     //cell.append("svg:rect")
    //     //    .attr("width", function (d) { return d.dx - 1; })
    //     //    .attr("height", function (d) { return d.dy - 1; })
    //     //    .style("fill", function (d) { return color(d.parent.name); });

    //     //cell.append("svg:text")
    //     //    .attr("x", function (d) { return d.dx / 2; })
    //     //    .attr("y", function (d) { return d.dy / 2; })
    //     //    .attr("dy", ".35em")
    //     //    .attr("text-anchor", "middle")
    //     //    .text(function (d) { return d.name; })
    //     //    .style("opacity", function (d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });

    //     //var html = d3.select('body').html();


    // }

    // private static position(thisContext) {
    //     thisContext.style("left", function (d) { return d.x + "px"; })
    //         .style("top", function (d) { return d.y + "px"; })
    //         .style("width", function (d) { return Math.max(0, d.dx - 1) + "px"; })
    //         .style("height", function (d) { return Math.max(0, d.dy - 1) + "px"; });
    // }
}