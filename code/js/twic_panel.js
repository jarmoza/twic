var TWiC = (function(namespace){

    // Base for TWiC panels
    namespace.Panel = function(p_coordinates, p_size, p_name, p_level, p_linkedViews){

        this.m_coordinates = p_coordinates;
        this.m_size = p_size;
        this.m_name = p_name;
        this.m_level = p_level;
        this.m_linkedViews = p_linkedViews;

        this.m_div = null;
        this.m_svg = null;
        this.m_groupOverlay = null;
        this.m_panelRect = null;
        this.m_resizers = {};
        this.m_lastScrollLRPos = 0;
        this.m_lastScrollTBPos = 0;
    };

    namespace.Panel.method("Initialize", function(){});
    namespace.Panel.method("Start", function(){});
    namespace.Panel.method("Update", function(data){});

    namespace.Panel.method("GetViewBoxArray", function(element){
        return element.attr("viewBox").split(" ");
    });

    namespace.Panel.method("MakeResizable", function(){

        this.m_lastScrollLRPos = 0;
        this.m_lastScrollTBPos = 0;

        if ( null != this.m_div ){

            /*
            .on("drag", function(){

                // Determine resizer position relative to resizable (parent)
                x = d3.mouse(this.m_div)[0];

                // Avoid negative or really small widths
                x = Math.max(50, x);

                this.m_div.style("width", x + "px");
            }.bind(this));
            */

        var minSize = namespace.Panel.prototype.s_minimumPanelSize;
        var dragResize, dragResizeStart, dragResizeEnd;

        /*var xscale = d3.scale.linear().domain([0, this.m_size.width]).range([0, this.m_size.width])
        var zoom = d3.behavior.zoom().scaleExtent([1, 1]);
        zoom.x(xscale);
        zoom.on('zoom', function() {
          var t = zoom.translate(),
              tx = t[0],
              ty = t[1];

          tx = Math.min(tx, 0);
          //tx = Math.max(tx, width - max);
          zoom.translate([tx, ty]);

          svg.select('.data').attr('d', line);
        }.bind(this));

        svg.call(zoom);*/

        // Scroll behavior

        this.m_div.on("scroll", function(d){

            var currentScrollLRPos = this.m_div.node().scrollLeft;
            if ( this.m_lastScrollLRPos < currentScrollLRPos ) {
                this.m_resizers["right"].style("left", parseInt(this.m_resizers["right"].style("left"), 10) + currentScrollLRPos - this.m_lastScrollLRPos);
            }
            this.m_lastScrollLRPos = currentScrollLRPos;

            var currentScrollTBPos = this.m_div.node().scrollTop;
            if ( this.m_lastScrollTBPos < currentScrollTBPos ) {
                this.m_resizers["bottom"].style("bottom", parseInt(this.m_resizers["bottom"].style("bottom"), 10) + currentScrollTBPos - this.m_lastScrollTBPos);
            }
            this.m_lastScrollTBPos = currentScrollTBPos;
            //console.log("Current scroll: " + currentScrollLRPos);

        }.bind(this));


        // Left
        this.m_resizers["left"] = this.m_div.append("div").attr("class", "left_resizer");
        dragResize = d3.behavior.drag()
                                .on("drag", function(){
                                    var rightPos = parseInt(this.m_div.style("left"), 10) + parseInt(this.m_div.style("width"), 10);
                                    var height = parseInt(this.m_div.style("height"), 10);
                                    var mouseX = d3.mouse(this.m_div.node().parentNode)[0];
                                    //var viewBoxArray = this.m_svg.attr("viewBox").split(" ");

                                    if ( rightPos - mouseX > minSize){

                                        this.m_div.style("left", mouseX)
                                             .style("width", rightPos - mouseX)
                                             .attr("width", rightPos - mouseX);
                                    }
                                    else {

                                        this.m_div.style("left", rightPos - minSize)
                                             .style("width", minSize)
                                             .attr("width", minSize);
                                    }


                                }.bind(this));
        this.m_resizers["left"].call(dragResize);

        // Right
        this.m_resizers["right"] = this.m_div.append("div").attr("class", "right_resizer");
        dragResize = d3.behavior.drag()
                                .on("drag", function(){
                                    var rightPos = parseInt(this.m_div.style("left"), 10) + parseInt(this.m_div.style("width"), 10);
                                    var x = Math.max(minSize, d3.mouse(this.m_div.node())[0]);
                                    var viewBoxArray = this.m_svg.attr("viewBox").split(" ");
                                    this.m_div.style("width", x + "px");
                                    this.m_div.attr("width", x + "px");
                                    this.m_svg.style("width", x + "px");
                                    this.m_svg.attr("width", x + "px");
                                    this.m_svg.attr("viewBox", viewBoxArray[0] + " " +
                                                               viewBoxArray[1] + " " +
                                                               x + " " + parseInt(this.m_div.style("height"), 10));
                                }.bind(this));
        this.m_resizers["right"].call(dragResize);

        // Top
        this.m_resizers["top"] = this.m_div.append("div").attr("class", "top_resizer");
        dragResize = d3.behavior.drag()
                                .on("dragstart", function(){ this.m_div.style("overflow-y","hidden"); }.bind(this))
                                .on("drag", function(){

                                    var bottomPos = parseInt(this.m_div.style("top"), 10) + parseInt(this.m_div.style("height"), 10);
                                    var mouseY = d3.mouse(this.m_div.node().parentNode)[1];
                                    if ( bottomPos - mouseY > minSize ){
                                        this.m_div.style("top", mouseY)
                                             .style("height", bottomPos - mouseY);
                                        this.m_svg.style("top", mouseY)
                                             .style("height", bottomPos - mouseY);
                                        this.m_svg.attr("viewBox", "0 " + (bottomPos - mouseY) +
                                                                   " " + parseInt(this.m_svg.style("right"), 10) +
                                                                   " " + parseInt(this.m_svg.style("bottom"), 10));
                                    }
                                    else {
                                        this.m_div.style("top", bottomPos - minSize)
                                             .style("height", minSize);
                                        this.m_svg.style("top", bottomPos - minSize)
                                             .style("height", minSize);
                                        this.m_svg.attr("viewBox", "0 " + (bottomPos - minSize) +
                                                                   " " + parseInt(this.m_svg.style("right"), 10) +
                                                                   " " + parseInt(this.m_svg.style("bottom"), 10));

                                    }

                                }.bind(this))
                                .on("dragend", function(){ this.m_div.style("overflow-y","auto"); }.bind(this));
        this.m_resizers["top"].call(dragResize);

        // Bottom
        this.m_resizers["bottom"] = this.m_div.append("div").attr("class", "bottom_resizer");
        dragResize = d3.behavior.drag()
                                .on("dragstart", function(){ this.m_div.style("overflow-y","hidden"); }.bind(this))
                                .on("drag", function(){
                                    var y = Math.max(minSize, d3.mouse(this.m_div.node())[1])
                                    this.m_div.style("height", y + "px");
                                    this.m_div.attr("height", y + "px");
                                    this.m_svg.attr("height", y + "px");
                                    this.m_svg.attr("viewBox", "0 0 " + parseInt(this.m_svg.style("right"), 10) +
                                                               " " + parseInt(this.m_svg.style("bottom"), 10));
                                }.bind(this))
                                .on("dragend", function(){ this.m_div.style("overflow-y","auto"); }.bind(this));                                ;
        this.m_resizers["bottom"].call(dragResize);

        // Southeast
        this.m_resizers["se"] = this.m_div.append("div").attr("class", "se_resizer");
        dragResize = d3.behavior.drag()
                                .on("dragstart", function(){ this.m_div.style("overflow-y","hidden"); }.bind(this))
                                .on("drag", function(){

                                    var x = Math.max(50, d3.mouse(this.m_div.node())[0]);
                                    this.m_div.style("width", x + "px");
                                    this.m_div.attr("width", x + "px");
                                    this.m_svg.attr("width", x + "px");
                                    var y = Math.max(50, d3.mouse(this.m_div.node())[1])
                                    this.m_div.style("height", y + "px");
                                    this.m_div.attr("height", y + "px");
                                    this.m_svg.attr("height", y + "px");
                                    this.m_svg.attr("viewBox", "0 0 " + x + " " + y);

                                }.bind(this))
                                .on("dragend", function(){ this.m_div.style("overflow-y","auto"); }.bind(this));                                ;
        this.m_resizers["se"].call(dragResize);

        // Northeast
        this.m_resizers["ne"] = this.m_div.append("div").attr("class", "ne_resizer");
        dragResize = d3.behavior.drag()
                                .on("dragstart", function(){ this.m_div.style("overflow-y","hidden"); }.bind(this))
                                .on("drag", function(){

                                    var x = Math.max(50, d3.mouse(this.m_div.node())[0]);
                                    this.m_div.style("width", x + "px");
                                    this.m_div.attr("width", x + "px");
                                    this.m_svg.attr("width", x + "px");
                                    var bottomPos = parseInt(this.m_div.style("top"), 10) + parseInt(this.m_div.style("height"), 10);
                                    var mouseY = d3.mouse(this.m_div.node().parentNode)[1];
                                    if ( bottomPos - mouseY > minSize ){
                                        this.m_div.style("top", mouseY)
                                             .style("height", bottomPos - mouseY);
                                        this.m_svg.style("top", mouseY)
                                             .style("height", bottomPos - mouseY);
                                        this.m_svg.attr("viewBox","0 " + mouseY + " " + x + parseInt(this.m_div.style("bottom"), 10));
                                    }
                                    else {
                                        this.m_div.style("top", bottomPos - minSize)
                                             .style("height", minSize);
                                        this.m_svg.style("top", bottomPos - minSize)
                                             .style("height", minSize);
                                        this.m_svg.attr("viewBox","0 " + (bottomPos - minSize) + " " + x + parseInt(this.m_div.style("bottom"), 10));
                                    }

                                }.bind(this))
                                .on("dragend", function(){ this.m_div.style("overflow-y","auto"); }.bind(this));
        this.m_resizers["ne"].call(dragResize);

        // Southwest
        this.m_resizers["sw"] = this.m_div.append("div").attr("class", "sw_resizer");
        dragResize = d3.behavior.drag()
                                .on("dragstart", function(){ this.m_div.style("overflow-y","hidden"); }.bind(this))
                                .on("drag", function(){

                                    var y = Math.max(minSize, d3.mouse(this.m_div.node())[1])
                                    this.m_div.style("height", y + "px");
                                    this.m_div.attr("height", y + "px");
                                    this.m_svg.attr("height", y + "px");
                                    var rightPos = parseInt(this.m_div.style("left"), 10) + parseInt(this.m_div.style("width"), 10);
                                    var mouseX = d3.mouse(this.m_div.node().parentNode)[0];
                                    if ( rightPos - mouseX > minSize){
                                        this.m_div.style("left", mouseX)
                                             .style("width", rightPos - mouseX);
                                        this.m_svg.style("left", mouseX)
                                             .style("width", rightPos - mouseX);
                                        this.m_svg.attr("viewBox", mouseX + " 0 " + parseInt(this.m_div.style("right"), 10)
                                                                  + " " + y);
                                    }
                                    else {
                                        this.m_div.style("left", rightPos - minSize)
                                             .style("width", minSize);
                                        this.m_svg.style("left", rightPos - minSize)
                                             .style("width", minSize);
                                        this.m_svg.attr("viewBox",(rightPos - minSize) + " 0 " +
                                                                  " " + parseInt(this.m_div.style("right"), 10) + " " + y);
                                    }

                                }.bind(this))
                                .on("dragend", function(){ this.m_div.style("overflow-y","auto"); }.bind(this));
        this.m_resizers["sw"].call(dragResize);

        // Northwest
        this.m_resizers["nw"] = this.m_div.append("div").attr("class", "nw_resizer");
        dragResize = d3.behavior.drag()
                                .on("dragstart", function(){ this.m_div.style("overflow-y","hidden"); }.bind(this))
                                .on("drag", function(){

                                    var bottomPos = parseInt(this.m_div.style("top"), 10) + parseInt(this.m_div.style("height"), 10);
                                    var mouseY = d3.mouse(this.m_div.node().parentNode)[1];
                                    var topValue;
                                    if ( bottomPos - mouseY > minSize ){
                                        this.m_div.style("top", mouseY)
                                             .style("height", bottomPos - mouseY);
                                        this.m_svg.style("top", mouseY)
                                             .style("height", bottomPos - mouseY);
                                        topValue = mouseY;
                                    }
                                    else {
                                        this.m_div.style("top", bottomPos - minSize)
                                             .style("height", minSize);
                                        this.m_svg.style("top", bottomPos - minSize)
                                             .style("height", minSize);
                                        topValue = bottomPos - minSize;
                                    }
                                    var rightPos = parseInt(this.m_div.style("left"), 10) + parseInt(this.m_div.style("width"), 10);
                                    var mouseX = d3.mouse(this.m_div.node().parentNode)[0];
                                    if ( rightPos - mouseX > minSize){
                                        this.m_div.style("left", mouseX)
                                             .style("width", rightPos - mouseX);
                                        this.m_svg.style("left", mouseX)
                                             .style("width", rightPos - mouseX);
                                        this.m_svg.attr("viewBox", "0 " + topValue + " " + mouseX +
                                                                   " " + parseInt(this.m_div.style("bottom"), 10));
                                    }
                                    else {
                                        this.m_div.style("left", rightPos - minSize)
                                             .style("width", minSize);
                                        this.m_svg.style("left", rightPos - minSize)
                                             .style("width", minSize);
                                        this.m_svg.attr("viewBox", "0 " + topValue + " " + (rightPos - minSize) +
                                                                   " " + parseInt(this.m_div.style("bottom"), 10));
                                    }

                                }.bind(this))
                                .on("dragend", function(){ this.m_div.style("overflow-y","auto"); }.bind(this));
        this.m_resizers["nw"].call(dragResize);

        }
    });

    namespace.Panel.prototype.s_minimumPanelSize = 50;

    // Base for TWiC graph view
    namespace.GraphView = function(p_coordinates, p_size, p_name, p_level, p_linkedViews){

        namespace.Panel.apply(this, arguments);
    };
    namespace.GraphView.inherits(namespace.Panel);

    namespace.GraphView.prototype.Collide = function(node) {

        var radiusExtension = 16;
        var r = node.radius + radiusExtension,
            nx1 = node.x - r,
            nx2 = node.x + r,
            ny1 = node.y - r,
            ny2 = node.y + r;

        return function(quad, x1, y1, x2, y2) {

            if (quad.point && (quad.point !== node)) {

                var x = node.x - quad.point.x,
                    y = node.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = node.radius + quad.point.radius;

                if (l < r) {

                    l = (l - r) / l * .5;
                    node.x -= x *= l;
                    node.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                }
            }

            return x1 > nx2
                || x2 < nx1
                || y1 > ny2
                || y2 < ny1;
        };
    };


    // High level corpus view (TWiC.CorpusCluster)
    namespace.CorpusView = function(p_coordinates, p_size, p_name, p_level, p_linkedViews){

        namespace.GraphView.apply(this, arguments);
    };
    namespace.CorpusView.inherits(namespace.GraphView);


    // Higher midlevel corpus bullseye cluster view (TWiC.CorpusCluster)
    namespace.CorpusClusterView = function(p_coordinates, p_size, p_name, p_level, p_linkedViews){

        namespace.GraphView.apply(this, arguments);

        this.m_twicObjects = [];
        this.m_objectsJSON = [];
        this.m_nodes = [];
        this.m_links = [];
        this.m_graph = null;
        this.m_idealText = this.m_level.m_corpusMap["ideal_text"];
        this.b_positionsCalculated = false;
        this.m_rootIndex = -1;
        this.m_zoomBehavior = d3.behavior.zoom();
    };
    namespace.CorpusClusterView.inherits(namespace.GraphView);

    namespace.CorpusClusterView.method("Initialize", function(p_levelDiv){

        this.m_div = p_levelDiv.append("div")
                               .attr("class", "div_twic_graph_corpusclusterview div_twic_graph twic_panel")
                               .attr("id", "div_twic_graph_corpusclusterview_" + this.m_name)
                               .style("left", this.m_coordinates.x)
                               .style("top", this.m_coordinates.y)
                               .style("max-width", this.m_size.width)
                               .style("max-height", this.m_size.height)
                               .style("width", this.m_size.width)
                               .style("height", this.m_size.height);

        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_graph")
                               .attr("id", "svg_twic_graph_corpusclusterview_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height);

        // Add group and rectangle for trapping mouse events in the graph
        this.m_groupOverlay = this.m_svg.append("g")
                                        .attr("class","group_twic_graph_corpusclusterview_overlay")
                                        .attr("id", "group_twic_graph_corpusclusterview_overlay_" + this.m_name)
                                        .call(this.m_zoomBehavior.scaleExtent(TWiC.CorpusClusterView.prototype.s_scaleExtentLimits).on("zoom", this.ScrollToZoom(this)));

        this.m_panelRect = this.m_groupOverlay.append("rect")
                                              .attr("class","rect_twic_graph")
                                              .attr("id","rect_twic_graph_corpusclusterview_" + this.m_name)
                                              .attr("x", this.m_coordinates.x)
                                              .attr("y", this.m_coordinates.y)
                                              .attr("rx", this.m_div.style("border-radius"))
                                              .attr("ry", this.m_div.style("border-radius"))
                                              .attr("width", this.m_size.width)
                                              .attr("height", this.m_size.height);

        // Add resize bars/capability to panel
        //this.MakeResizable();

        var twic_objects = [];
        var twic_cluster_json_list = [];

        // Distance to ideal normalization via corpus map JSON data
        var avg = 0.0;
        for ( var index = 0; index < this.m_level.m_corpusMap["children"].length; index++ )
            avg += this.m_level.m_corpusMap["children"][index]["distance2ideal"];
        avg /= this.m_level.m_corpusMap["children"].length;

        // Build all clusters
        var linkDilation = 80;
        for ( var index = 0; index < this.m_level.m_corpusMap["children"].length; index ++ ){

            var twic_cluster = new TWiC.ClusterCircle([0,0], 20, index, this.m_level, this, this.m_linkedViews, 10,
                                                      this.m_level.m_corpusMap["children"][index]["topics"],
                                                      this.m_level.m_corpusMap["children"][index]["ideal_text"]);
            var twic_cluster_json = {
                "name":this.m_level.m_corpusMap["children"][index]["name"],
                "ideal_text":this.m_level.m_corpusMap["children"][index]["ideal_text"],
                //"distance2ideal":this.m_level.m_corpusMap["children"][index]["distance2ideal"],
                "distance2ideal":2 + Math.abs((this.m_level.m_corpusMap["children"][index]["distance2ideal"] - avg) * linkDilation),
                "topics":this.m_level.m_corpusMap["children"][index]["topics"],
                "children":[]
            };

            // Add ideal text filename for this cluster
            twic_cluster_json["children"].push(this.m_level.m_corpusMap["children"]["ideal_text"]);
            // Add text filenames inside this cluster
            /*for ( var index2 = 0; index2 < this.m_level.m_corpusMap["children"]["children"].length; index2++ ){
                 twic_cluster_json["children"].push(this.m_level.m_corpusMap["children"]["children"][index2]["name"]);
            }*/
            this.m_objectsJSON.push(twic_cluster_json);
            this.m_twicObjects.push(twic_cluster);
        }

        // Node zero for the force-directed graph will be the "ideal_text" of this level
        var rootIndex = 0;
        for ( var index = 0; index < this.m_objectsJSON.length; index++ ){

            if ( this.m_idealText == this.m_objectsJSON[index]["ideal_text"] ){

                //this.m_nodes.push({"node_index":index});
                this.m_nodes.push({"index":index});
                rootIndex = index;
                this.m_rootIndex = rootIndex;
            }
        }

        // In case the ideal text for the corpus is not among the ideal texts represented by a cluster
        var b_fakeRoot = false;
        if ( 0 == this.m_nodes.length ){

            // Add a fake node which will represent this ideal text as the central node amongst the clusters
            b_fakeRoot = true;
            rootIndex = this.m_twicObjects.length;
            this.m_rootIndex = rootIndex;
            //this.m_nodes.push({"node_index":rootIndex});
            this.m_nodes.push({"index":rootIndex});

            // Top X topics of the fake node
            var topTopics = [];
            var topTopicCount = 10;
            for ( var index = 0; index < topTopicCount; index++ ) { topTopics.push([]) };
            var topTopicID = "";
            for ( var topic in this.m_level.m_corpusMap["topics"] ){
                if ( this.m_level.m_corpusMap["topics"][topic][0] < topTopicCount + 1){
                    topTopics[this.m_level.m_corpusMap["topics"][topic][0] - 1] = this.m_level.m_corpusMap["topics"][topic];
                }
            }

            // Add a twic cluster object to the graph to represent this single document (may enable clickability later)
            /*var topTopicID = "";
            for ( var topic in CorpusClusterView.prototype.s_corpusMap["topics"] ){
                if ( 1 == CorpusClusterView.prototype.s_corpusMap["topics"][topic][0] ){
                    topTopicID = topic;
                    break;
                }
            }
            var topTopic = [CorpusClusterView.prototype.s_corpusMap["topics"][topTopicID]];*/
            this.m_twicObjects.push(new TWiC.ClusterCircle([0,0], 20, rootIndex, this.m_level, this, this.m_linkedViews,
                                                           topTopicCount, topTopics, this.m_level.m_corpusMap["ideal_text"]));
        }

        // Establish the rest of the nodes and edges for the force-directed graph
        for ( var index = 0; index < this.m_objectsJSON.length; index++ ){

            //if ( this.m_idealText == this.m_objectsJSON[index]["ideal_text"] )
            if ( rootIndex == index )
                continue;

            //this.m_nodes.push({"node_index":index});
            this.m_nodes.push({"index":index, "name":this.m_objectsJSON[index]["name"]});
            this.m_links.push({
                "source":index,
                "target":rootIndex,
                "value":this.m_objectsJSON[index]["distance2ideal"]
            });
        }

        // Set up the force-directed graph
        this.m_graph = d3.layout.force()
                                .nodes(this.m_nodes)
                                .links(this.m_links)
                                .size([this.m_size.width, this.m_size.height])
                                .charge(0.2)
                                .gravity(0)
                                //.chargeDistance(10)
                                .linkDistance(function(d){ return d.value * TWiC.CorpusClusterView.prototype.s_linkDistanceMod; });
    });

    namespace.CorpusClusterView.method("Start", function(){

        // Start the force-directed graph
        //this.m_graph.start();

        // Add lines for the links and bind the link data to them
        var link = this.m_svg.selectAll(".link")
                       .data(this.m_links)
                       .enter()
                       .append("line")
                       .attr("class", "link")
                       //.style("stroke-width", function(d) { return Math.sqrt(d.value); })
                       .style("stroke-width",1)
                       .style("stroke","lightgray");
                       //.style("opacity", TWiC.ClusterCircle.s_unhighlightedOpacity);

        // Bind TWiC object data to the node data
        for ( index = 0; index < this.m_twicObjects.length; index++ ) {
            for ( var index2 = 0; index2 < this.m_nodes.length; index2++ ){
                //if ( this.m_twicObjects[index].nodeIndex == this.m_nodes[index2]["node_index"] ){
                if ( this.m_twicObjects[index].m_name == this.m_nodes[index2]["index"] ){
                    this.m_twicObjects[index].BindDataToNode(this.m_nodes[index2]);
                    break;
                }
                /*graph.nodes[index].width = twic_rectangles[index].dimensions[0];
                graph.nodes[index].height = twic_rectangles[index].dimensions[1];
                graph.nodes[index].cornerRadius = twic_rectangles[index].cornerRadius;
                graph.nodes[index].fillColor = twic_rectangles[index].fillColor;*/
            }
        }

        // NOTE: force.drag call should be on svg parent,
        // like it is here on the top group for this TWiC rectangle
        var node = this.m_svg.selectAll(".node")
                             .data(this.m_nodes)
                             .enter()
                             .append("g")
                             .attr("class", "node")
                             //.attr("id", function(d){return "node_" + d.node_index;})
                             .attr("id", function(d){return "node_" + d.index;});
                             //.call(this.m_graph.drag);

        // Neat transition in effect for circles from:
        // http://bl.ocks.org/mbostock/7881887
        /*node.transition()
            .duration(750)
            .delay(function(d, i) { return i * 5; })
            .attrTween("r", function(d) {
              var i = d3.interpolate(0, d.radius);
              return function(t) { return d.radius = i(t); };
            });
        */

        // Append TWiC object svg elements to the nodes with corresponding bound data
        for ( index = 0; index < this.m_twicObjects.length; index++ ) {
            for ( var index2 = 0; index2 < this.m_nodes.length; index2++ ){
                //if ( this.m_twicObjects[index].nodeIndex == this.m_nodes[index2]["node_index"] ){
                if ( this.m_twicObjects[index].m_name == this.m_nodes[index2]["index"] ){
                    this.m_twicObjects[index].AppendSVGandBindData(this.m_svg.select(".node#node_" + index2), this.m_nodes[index2]["children"]);
                }
            }
        }
        /*node.append("svg:rect")
               .attr("class", "node_rects")
               .attr("width", function(d){ return d.width; })
               .attr("height", function(d){ return d.height; })
               .attr("rx", function(d){ return d.cornerRadius; })
               .attr("ry", function(d){ return d.cornerRadius; })
               .style("stroke", function(d) { return fascicleColors[d.fascicle]; })
               .style("fill", function(d) { return d.fillColor})
               .style("position", "absolute");
        */



        // Add tick function for graph corresponding to object type
        setTimeout(function(){

            this.m_graph.start();

            for (var i = 1000; i > 0; --i)
                this.Tick();

            this.m_graph.stop();

            this.b_positionsCalculated = true;

            //this.m_svg.attr("opacity", this.m_svg.style("opacity") + 0.001);
        }.bind(this), 10);

        // Move nodes back into view

        for ( var index = 0; index < this.m_twicObjects.length; index++ ){
            if ( this.m_twicObjects[index].m_clusterGroup ){
                //this.m_twicObjects[index].m_clusterGroup.attr("transform","translate(-100 -100)");
            }
        }



    /*this.m_svg.transition()
    .duration(750)
    .delay(function(d, i) { return i * 5; })
    .styleTween("width", function(d) {
      var i = d3.interpolate(0, this.m_svg.attr("width"));
      return function(t) { return this.m_svg.attr("width", i(t)); }.bind(this);
    }.bind(this));*/


        //this.m_svg.style("opacity", 1);

        //twicLevel.m_graph.start();
        //this.m_graph.on("tick", function() { twicLevel.Tick(twicLevel); });
    });

    namespace.CorpusClusterView.method("ScrollToZoom", function(p_twicLevel){

      var cb = function(error, data){

          // Scale the level group attached to the svg container
          d3.select("#twic_level_" + p_twicLevel.m_name).attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }

      return cb;
    });

    namespace.CorpusClusterView.method("Tick", function(){

        var links = this.m_svg.selectAll(".link"); // Perform visible/active test later
        var nodes = this.m_svg.selectAll(".node"); // Perform visible/active test later
        var svgWidth = parseInt(this.m_svg.attr("width"));
        var svgHeight = parseInt(this.m_svg.attr("height"));

        this.m_nodes[this.m_rootIndex].x = svgWidth >> 1;
        this.m_nodes[this.m_rootIndex].y = svgHeight >> 1;

        if ( !this.b_positionsCalculated ){

            nodes.attr("cx", function(d) { return d.x = Math.max(d.radius, Math.min(svgWidth - d.radius, d.x)); })
                 .attr("cy", function(d) { return d.y = Math.max(d.radius, Math.min(svgHeight - d.radius, d.y)); });

            var q = d3.geom.quadtree(this.m_nodes);
            var i = 0;
            var n = this.m_nodes.length;

            while (++i < n) { q.visit(namespace.GraphView.prototype.Collide(this.m_nodes[i])); }

            links.attr("x1", function(d) { d.source.firstX = d.source.x; return d.source.x; })
                 .attr("y1", function(d) { d.source.firstY = d.source.y; return d.source.y; })
                 .attr("x2", function(d) { d.target.firstX = d.target.x; return d.target.x; })
                 .attr("y2", function(d) { d.target.firstY = d.target.y; return d.target.y; });

            nodes.attr("transform", function(d) {
                d.firstX = d.x;
                d.firstY = d.y;
                return "translate(" + d.x + "," + d.y + ")";
            });
        }
        else{
             links.attr("x1", function(d) { return d.source.firstX; })
                  .attr("y1", function(d) { return d.source.firstY; })
                  .attr("x2", function(d) { return d.target.firstX; })
                  .attr("y2", function(d) { return d.target.firstY; });

              nodes.attr("transform", function(d) { return "translate(" + d.firstX + "," + d.firstY + ")"; });
        }
    });

    namespace.CorpusClusterView.method("Update", function(data){

        /*for ( var index = 0; index < this.m_twicObjects.length; index++ ){

            if ( this.m_twicObjects[index].m_clusterGroup
                   .selectAll(".topic_circle")
                   .filter(function(d){ return d.topicID == data.topicID; }.bind(data.topicID))
                   .empty() ){
                this.m_twicObjects[index].DarkenCluster();
            }
            else {
                this.m_twicObjects[index].HighlightCluster(data.topicID);
            }
        }*/

        if ( null != data ){
            this.HighlightAllClustersWithTopic(data);
        } else {
            this.DarkenAllClusters();
        }
    });

    namespace.CorpusClusterView.method("DarkenAllClusters", function(){

        // Darken all clusters
        this.m_svg.selectAll(".topic_circle")
                  .style("fill", function(d){ return d.locolor; })
                  .style("opacity", TWiC.ClusterCircle.prototype.s_unhighlightedOpacity);

        // Set the
    });

    namespace.CorpusClusterView.method("HighlightAllClustersWithTopic", function(data){

        // Color all circles that represent the given topic
        var filteredCircles = this.m_svg.selectAll(".topic_circle")
                                        .filter(function(d){ return d.topicID == data.topicID; })
                                        .style("fill", data.color)
                                        .style("opacity", 1.0);

        // Darken all circles that don't represent the given topic
        this.m_svg.selectAll(".topic_circle")
                  .filter(function(d){ return d.topicID != data.topicID; })
                  .style("fill", function(d){ return d.locolor; })
                  .style("opacity", TWiC.ClusterCircle.prototype.s_unhighlightedOpacity);

        // Raise the opacity of all circles in the highlighted cluster
        filteredCircles.each(function(d){
            d3.select(this.parentNode)
              .selectAll(".topic_circle")
              .filter(function(d){return d.topicID != data.topicID; })
              .style("opacity", TWiC.ClusterCircle.prototype.s_semihighlightedOpacity)
              .style("fill", function(d){return d.midcolor;});
          });
    });

    namespace.CorpusClusterView.method("ClickedClusterCircle", function(p_clusterCircle){

        for ( var index = 0; index < this.m_linkedViews.length; index++ ) {
            if ( "click" == this.m_linkedViews[index].update ) {
                this.m_linkedViews[index].panel.Update({topicID: p_clusterCircle.m_name})
            }
        }
    });

    namespace.CorpusClusterView.prototype.s_linkDistanceMod = 100;
    namespace.CorpusClusterView.prototype.s_scaleExtentLimits = [1, 16];


    // Lower midlevel document rectangle cluster view (TWiC.TextRectangle)
    namespace.TextClusterView = function(p_coordinates, p_size, p_name, p_level, p_linkedViews, p_clusterIndex){

        namespace.GraphView.apply(this, arguments);

        this.m_twicObjects = [];
        this.m_objectsJSON = [];
        this.m_nodes = [];
        this.m_links = [];
        this.m_graph = null;
        this.m_clusterIndex = p_clusterIndex;
        this.m_idealText = this.m_level.m_corpusMap["children"][this.m_clusterIndex]["ideal_text"];
        this.b_positionsCalculated = false;
        this.m_rootIndex = -1;
        this.m_zoomBehavior = d3.behavior.zoom();

        this.m_clusterSvgGroup = null;
    };
    namespace.TextClusterView.inherits(namespace.GraphView);

    namespace.TextClusterView.method("Initialize", function(p_levelDiv){

        this.m_div = p_levelDiv.append("div")
                               .attr("class", "div_twic_graph_textclusterview div_twic_graph twic_panel")
                               .attr("id", "div_twic_graph_textclusterview_" + this.m_name)
                               .style("left", this.m_coordinates.x)
                               .style("top", this.m_coordinates.y)
                               .style("width", this.m_size.width)
                               .style("height", this.m_size.height)
                               .style("max-width", this.m_size.width)
                               .style("max-height", this.m_size.height)

        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_graph")
                               .attr("id", "svg_twic_graph_textclusterview_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height);

        // Add group and rectangle for trapping mouse events in the graph
        this.m_groupOverlay = this.m_svg.append("g")
                                        .attr("class","group_twic_graph_overlay")
                                        .attr("id", "group_twic_graph_overlay_textclusterview_" + this.m_name);
                                        //.call(this.m_zoomBehavior.scaleExtent(TWiC.CorpusClusterView.prototype.s_scaleExtentLimits).on("zoom", this.ScrollToZoom(this)))

        // Add a background rect to the svg group
        this.m_panelRect = this.m_groupOverlay.append("rect")
                                              .attr("class","rect_twic_graph_textclusterview")
                                              .attr("id","rect_twic_graph_textclusterview_" + this.m_name)
                                              .attr("x", this.m_coordinates.x)
                                              .attr("y", this.m_coordinates.y)
                                              .attr("width", this.m_size.width)
                                              .attr("height", this.m_size.height)
                                              .attr("rx", this.m_div.style("border-radius"))
                                              .attr("ry", this.m_div.style("border-radius"))
                                              .style("fill", "white");

        this.m_clusterSvgGroup = this.m_svg.append("g");

        this.InitializeGraph();
    });

    namespace.TextClusterView.method("InitializeGraph", function(){

        var twic_objects = [];
        var twic_cluster_json_list = [];

        // Distance to ideal normalization via corpus map JSON data
        var avg = 0.0;
        for ( var index = 0; index < this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"].length; index++ )
            avg += this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["distance2ideal"];
        avg /= this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"].length;

        // Build all clusters
        var linkDilation = 40;
        for ( var index = 0; index < this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"].length; index ++ ){

            var textRectangle = new TWiC.TextRectangle({x:0,y:0}, {width:0,height:0},
                                                       this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["name"], this.m_level,
                                                       this, this.m_linkedViews);
            // Load the individual JSON for this text
            textRectangle.Load();

            var textrect_json = {
                "name":this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["name"],
                "ideal_text":this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["ideal_text"],
                //"distance2ideal":this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["distance2ideal"],
                "distance2ideal":2 + Math.abs((this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["distance2ideal"] - avg) * linkDilation),
                "topics":this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["topics"],
                "children":[]
            };

            // Add ideal text filename for this cluster
            textrect_json["children"].push(this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"]["ideal_text"]);
            // Add text filenames inside this cluster
            /*for ( var index2 = 0; index2 < this.m_level.m_corpusMap["children"]["children"].length; index2++ ){
                 twic_cluster_json["children"].push(this.m_level.m_corpusMap["children"]["children"][index2]["name"]);
            }*/
            this.m_objectsJSON.push(textrect_json);
            this.m_twicObjects.push(textRectangle);
        }

        // Node zero for the force-directed graph will be the "ideal_text" of this cluster
        var rootIndex = 0;
        for ( var index = 0; index < this.m_objectsJSON.length; index++ ){

            if ( this.m_idealText == this.m_objectsJSON[index]["ideal_text"] ){

                //this.m_nodes.push({"node_index":index});
                this.m_nodes.push({"index":index});
                rootIndex = index;
                this.m_rootIndex = rootIndex;
            }
        }

        // In case the ideal text for the cluster is not among the ideal texts represented by a cluster
        var b_fakeRoot = false;
        /*if ( 0 == this.m_nodes.length ){

            // Add a fake node which will represent this ideal text as the central node amongst the clusters
            b_fakeRoot = true;
            rootIndex = this.m_twicObjects.length;
            this.m_rootIndex = rootIndex;
            //this.m_nodes.push({"node_index":rootIndex});
            this.m_nodes.push({"index":rootIndex});

            // Top X topics of the fake node
            var topTopics = [];
            var topTopicCount = 10;
            for ( var index = 0; index < topTopicCount; index++ ) { topTopics.push([]) };
            var topTopicID = "";
            for ( var topic in this.m_level.m_corpusMap["topics"] ){
                if ( this.m_level.m_corpusMap["topics"][topic][0] < topTopicCount + 1){
                    topTopics[this.m_level.m_corpusMap["topics"][topic][0] - 1] = this.m_level.m_corpusMap["topics"][topic];
                }
            }

            // Add a twic cluster object to the graph to represent this single document (may enable clickability later)
            //var topTopicID = "";
            //for ( var topic in CorpusClusterView.prototype.s_corpusMap["topics"] ){
            //    if ( 1 == CorpusClusterView.prototype.s_corpusMap["topics"][topic][0] ){
            //        topTopicID = topic;
            //        break;
            //    }
            //}
            //var topTopic = [CorpusClusterView.prototype.s_corpusMap["topics"][topTopicID]];
            this.m_twicObjects.push(new TWiC.ClusterCircle([0,0], 20, rootIndex, this.m_level, this, this.m_linkedViews,
                                                           topTopicCount, topTopics, this.m_level.m_corpusMap["ideal_text"]));
        }*/

        // Establish the rest of the nodes and edges for the force-directed graph
        for ( var index = 0; index < this.m_objectsJSON.length; index++ ){

            //if ( this.m_idealText == this.m_objectsJSON[index]["ideal_text"] )
            if ( rootIndex == index )
                continue;

            //this.m_nodes.push({"node_index":index});
            this.m_nodes.push({"index":index, "name":this.m_objectsJSON[index]["name"],
                               "center":
            [this.m_twicObjects[index].m_coordinates.x + (this.m_twicObjects[index].m_size.width >> 1),
             this.m_twicObjects[index].m_coordinates.y + (this.m_twicObjects[index].m_size.height >> 1)] });
            this.m_links.push({
                "source":index,
                "target":rootIndex,
                "value":this.m_objectsJSON[index]["distance2ideal"]
            });
        }

        // Set up the force-directed graph
        this.m_graph = d3.layout.force()
                                .nodes(this.m_nodes)
                                .links(this.m_links)
                                .size([this.m_size.width, this.m_size.height])
                                .charge(0.2)
                                .gravity(0)
                                //.chargeDistance(10)
                                .linkDistance(function(d){ return d.value * TWiC.CorpusClusterView.prototype.s_linkDistanceMod; });
    });

    namespace.TextClusterView.method("Start", function(){

        /*var panelCenter = [this.m_size["width"] >> 1, this.m_size["height"] >> 1];
        var textRectangle = new TWiC.TextRectangle({x:panelCenter[0],y:panelCenter[1]}, {width:17,height:22},
                                                   this.m_level.m_corpusMap["children"][0]["ideal_text"], this.m_level,
                                                   this, this.m_linkedViews);

        textRectangle.Load();

        this.m_level.m_queue.await(function(){
            textRectangle.Draw();
        }.bind(textRectangle));*/

        this.m_level.m_queue.await(function(){

            // Add lines for the links and bind the link data to them
            var link = this.m_clusterSvgGroup.selectAll(".link")
                           .data(this.m_links)
                           .enter()
                           .append("line")
                           .attr("class", "link")
                           .style("stroke-width", 2)
                           .style("stroke","lightgray");

            // Bind TWiC object data to the node data
            for ( var index = 0; index < this.m_twicObjects.length; index++ ) {

                for ( var index2 = 0; index2 < this.m_nodes.length; index2++ ){

                    if ( this.m_twicObjects[index].m_name == this.m_nodes[index2]["name"] ){
                        this.m_twicObjects[index].BindDataToNode(this.m_nodes[index2]);
                        break;
                    }
                }
            }

            // Append TWiC object svg elements to the nodes with corresponding bound data
            for ( index = 0; index < this.m_twicObjects.length; index++ ) {

                for ( var index2 = 0; index2 < this.m_nodes.length; index2++ ){

                    if ( this.m_twicObjects[index].m_name == this.m_nodes[index2]["name"] ){

                        this.m_twicObjects[index].Draw();
                    }
                }
            }

            // Now bind the data to the nodes
            this.m_svg.selectAll(".node")
                      .data(this.m_nodes)
                      .enter();

            // Add tick function for graph corresponding to object type
            setTimeout(function(){

                this.m_graph.start();

                for (var i = 1000; i > 0; --i) {

                    this.Tick();
                }

                this.m_graph.stop();

                this.b_positionsCalculated = true;

                //this.m_svg.attr("opacity", this.m_svg.style("opacity") + 0.001);
            }.bind(this), 10);

            /*this.m_svg.transition()
                      .duration(750)
                      .delay(function(d, i) { return i * 5; })
                      .styleTween("width", function(d) {

                          var i = d3.interpolate(0, this.m_svg.attr("width"));
                          return function(t) {

                              return this.m_svg.attr("width", i(t));
                          }.bind(this);
                      }.bind(this));

            this.m_svg.style("opacity", 1.0);
            twicLevel.m_graph.start();
            this.m_graph.on("tick", function() { twicLevel.Tick(twicLevel); });*/

        }.bind(this));
    });

    namespace.TextClusterView.method("Tick", function(){

        var links = this.m_svg.selectAll(".link"); // Perform visible/active test later
        var nodes = this.m_svg.selectAll(".node"); // Perform visible/active test later
        var svgWidth = parseInt(this.m_svg.attr("width"));
        var svgHeight = parseInt(this.m_svg.attr("height"));

        this.m_nodes[this.m_rootIndex].x = svgWidth >> 1;
        this.m_nodes[this.m_rootIndex].y = svgHeight >> 1;

        if ( !this.b_positionsCalculated ){

            nodes.attr("x", function(d) {
                     return this.m_twicObjects[d.index].m_coordinates.x + (this.m_twicObjects[d.index].m_size.width >> 1);
            }.bind(this))
                 .attr("cy", function(d) {
                     return this.m_twicObjects[d.index].m_coordinates.y + (this.m_twicObjects[d.index].m_size.height >> 1);
            }.bind(this));

            var q = d3.geom.quadtree(this.m_nodes);
            var i = 0;
            var n = this.m_nodes.length;

            while (++i < n) { q.visit(namespace.GraphView.prototype.Collide(this.m_nodes[i])); }

            links.attr("x1", function(d) { d.source.firstX = d.source.x; return d.source.x; })
                 .attr("y1", function(d) { d.source.firstY = d.source.y; return d.source.y; })
                 .attr("x2", function(d) { d.target.firstX = d.target.x; return d.target.x; })
                 .attr("y2", function(d) { d.target.firstY = d.target.y; return d.target.y; });

            nodes.attr("transform", function(d) {
                d.firstX = d.x;
                d.firstY = d.y;
                return "translate(" + d.x + "," + d.y + ")";
            });
        }
        else{
             links.attr("x1", function(d) { return d.source.firstX; })
                  .attr("y1", function(d) { return d.source.firstY; })
                  .attr("x2", function(d) { return d.target.firstX; })
                  .attr("y2", function(d) { return d.target.firstY; });

              nodes.attr("transform", function(d) { return "translate(" + d.firstX + "," + d.firstY + ")"; });
        }
    });

    namespace.TextClusterView.method("Update", function(data){

        // Stop the force directed graph
        this.m_graph.stop();

        // Clear out svg objects
        this.m_clusterSvgGroup.selectAll("*").remove();

        // Reset prior values and assign new cluster index
        this.m_twicObjects = [];
        this.m_objectsJSON = [];
        this.m_nodes = [];
        this.m_links = [];
        this.m_graph = null;
        this.m_clusterIndex = data.topicID;
        this.m_idealText = this.m_level.m_corpusMap["children"][this.m_clusterIndex]["ideal_text"];
        this.b_positionsCalculated = false;
        this.m_rootIndex = -1;

        // Re-initialize and start the graph
        this.InitializeGraph();
        this.Start();

        // Create new TextRectangles and load their JSON
        /*for ( var index = 0; index < data.texts.length; index++ ){
             var textRectangle = new TextRectangle({x:0,y:0}, {width:17,height:22},
                                                   data.texts[index], this.m_level,
                                                   this.m_panel, this.m_linkedViews);
             textRectangle.Load();
             this.m_twicObjects.push(textRectangle);
        }

        q.await(function(){

            for ( var index = 0; index < this.m_twicObjects.length; index++ ) {
                this.m_twicObjects.Draw();
            }

        });*/
    });


    // Low level individual text view (TWiC.TopicTextHTML)
    namespace.TextView = function(p_coordinates, p_size, p_name, p_level, p_linkedViews, p_fileID){

        namespace.GraphView.apply(this, arguments);

        this.m_fileID = p_fileID;
        this.m_HTML = null;
    };
    namespace.TextView.inherits(namespace.GraphView);

    namespace.TextView.method("Initialize", function(p_levelDiv){

        this.m_div = p_levelDiv.append("div")
                               .attr("class", "div_twic_graph_textview div_twic_graph twic_panel")
                               .attr("id", "div_twic_graph_textview_" + this.m_name)
                               .style("left", this.m_coordinates.x)
                               .style("top", this.m_coordinates.y)
                               .style("width", this.m_size.width)
                               .style("height", this.m_size.height)
                               .style("max-width", this.m_size.width)
                               .style("max-height", this.m_size.height)

        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_graph")
                               .attr("id", "svg_twic_graph_textview_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height);

        // Add group and rectangle for trapping mouse events in the graph
        this.m_groupOverlay = this.m_svg.append("g")
                                        .attr("class","group_twic_graph_overlay")
                                        .attr("id", "group_twic_graph_overlay_textview_" + this.m_name);
                                        //.call(this.m_zoomBehavior.scaleExtent(TWiC.CorpusClusterView.prototype.s_scaleExtentLimits).on("zoom", this.ScrollToZoom(this)))

        // Add a background rect to the svg group
        this.m_panelRect = this.m_groupOverlay.append("rect")
                                              .attr("class","rect_twic_graph_textview")
                                              .attr("id","rect_twic_graph_textview_" + this.m_name)
                                              .attr("x", this.m_coordinates.x)
                                              .attr("y", this.m_coordinates.y)
                                              .attr("width", this.m_size.width)
                                              .attr("height", this.m_size.height)
                                              .attr("rx", this.m_div.style("border-radius"))
                                              .attr("ry", this.m_div.style("border-radius"));

        // Load the JSON for this text
        this.Load();
    });

    namespace.TextView.method("Load", function(){

        this.m_level.m_queue.defer(function(callback) {

            d3.xhr("data/input/html/" + this.m_fileID + ".html", function(error, data){

                htmlData = data.response;
                this.m_HTML = htmlData;
                callback(null, htmlData);
            }.bind(this));

        }.bind(this));
    });

    namespace.TextView.method("Start", function(){

        this.m_svg.append("g").style("overflow", "auto").append("foreignObject")
                        .attr("width", this.m_size.width)
                        .attr("height", this.m_size.height)
                        .append("xhtml:body")
                        .style("background-color", "#002240")
                        .style("font-family", "Archer")
                        .style("font-size", 20)
                        .style("color", "#FAFAD2")
                        .style("float", "left")
                        .style("text-align", "left")
                        .style("overflow", "auto")
                        .html(this.m_HTML);

        this.m_svg.select(".title")
                  .style("font-size", "26")
                  .style("text-align", "center");
        this.m_svg.select(".left")
                  .style("float","left")
                  .style("position", "relative")
                  .style("transform", "translateY(65%)")
                  .style("top", "25%")
                  .style("padding", "10")
                  .style("margin-bottom", "25");
        this.m_svg.select(".center")
                  .style("float","left")
                  .style("position", "relative")
                  .style("margin", "0 auto !important")
                  .style("display", "inline-block")
                  .style("font-size", "18");
        this.m_svg.select(".topics")
                  .style("float","left")
                  .style("position", "relative")
                  .style("overflow", "auto");

        myPanel = this;
        this.m_svg.selectAll("span")
                  .on("mouseover", function(){
                      var spanTopicID = this.title.split(" ")[1];
                      var data = {topicID: spanTopicID, color:myPanel.m_level.m_topicColors[spanTopicID]};
                      for ( var index = 0; index < myPanel.m_linkedViews.length; index++ ) {
                          if ( "mouseover" == myPanel.m_linkedViews[index].update ) {
                              myPanel.m_linkedViews[index].panel.Update(data);
                          }
                      }
                  })
                  .on("mouseout", function(){
                      for ( var index = 0; index < myPanel.m_linkedViews.length; index++ ) {
                          if ( "mouseover" == myPanel.m_linkedViews[index].update ) {
                              myPanel.m_linkedViews[index].panel.Update(null);
                          }
                      }
                  });
    });


    // Base for informational views
    namespace.InformationView = function(p_coordinates, p_size, p_name, p_level, p_linkedViews){

        namespace.Panel.apply(this, arguments);
    };
    namespace.InformationView.inherits(namespace.Panel);


    // Shows corpus, cluster(?), and text topic word lists (TWiC.TextLine)
    namespace.TopicBar = function(p_coordinates, p_size, p_name, p_level, p_linkedViews){

        namespace.InformationView.apply(this, arguments);
    };
    namespace.TopicBar.inherits(namespace.InformationView);

    namespace.TopicBar.method("Initialize", function(p_levelDiv){

        // No initial selected text
        this.m_currentSelection = -1;

        this.m_div = p_levelDiv.append("div")
                               .attr("class", "div_twic_info_topicbar div_twic_info twic_panel")
                               .attr("id", "div_twic_info_topicbar_" + this.m_name)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height)
                               .style("left", this.m_coordinates.x)
                               .style("top", this.m_coordinates.y)
                               .style("max-width", this.m_size.width)
                               .style("max-height", this.m_size.height);

        // Topic bar svg viewport
        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_info")
                               .attr("id","svg_twic_info_topicbar_" + this.m_name)
                               .attr("x", 0)
                               .attr("y", 0)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height)
                               .attr("viewBox", "0 0 " + this.m_size.width + " " + this.m_size.height);

        /*this.m_svg.append("defs")
                  .append("clipPath")
                  .attr("id", "clippath1")
                  .append("rect")
                  .style("position", "relative")
                  .attr("x", 0)
                  .attr("y", 0)
                  .attr("width", this.m_size.width)
                  .attr("height", this.m_size.height);*/


        // Topic bar topic word list group
        this.m_groupOverlay = this.m_svg.append("g")
                                        .attr("class","group_twic_topicbar");

        // Add resize bars/capability to panel
        //this.MakeResizable();

        // Create topic array for svg text printing
        var topicStrArray = [];
        var topicStr;
        for ( var topic_index = 0; topic_index < this.m_level.m_topicWordLists.length; topic_index++ ) {

            topicStr = "Topic " + topic_index.toString() + ": ";
            for ( var word_index = 0; word_index < this.m_level.m_topicWordLists[topic_index].length; word_index++ ){

                topicStr += this.m_level.m_topicWordLists[topic_index][word_index] + " ";
            }
            topicStrArray.push(topicStr.trim());
        }

        // Print svg text/tspans for each topic using the 'textFlow' library
        var rectGrowth = 0;
        //for ( var index = 0, yPosition = TWiC_TopicBar.prototype.s_textInfo.yStart;
        for ( var index = 0, yPosition = namespace.TopicBar.prototype.s_textInfo.yStart + namespace.TopicBar.prototype.s_textInfo.fontSize;
        //for ( var index = 0, yPosition = namespace.TopicBar.prototype.s_textInfo.fontSize;
                  index < topicStrArray.length; index++ ){

            // Append opaque rectangle that will be used as highlight for each topic word list
            var highlightRect = this.m_groupOverlay.append("rect")
                                             .attr("class", "topic_highlightrect")
                                             .attr("id", "topic_" + index)
                                             .attr("fill", this.m_level.m_topicColors[index])

            // Add the topic text element
            var topicText = this.m_groupOverlay.append("text")
                                         .attr("class", "topic_wordlist")
                                         .attr("id", "topic_" + index)
                                         .datum({"id":index.toString()})
                                         .attr("x", "0")
                                         .attr("y", yPosition)
                                         .attr("dx", "0")
                                         .attr("dy", "0")
                                         .attr("fill", this.m_level.m_topicColors[index])
                                         .on("click", function(d){
                                                update_data = {topicID:d.id, color:this.m_level.m_topicColors[d.id]};
                                                this.HighlightText(update_data);
                                                for ( var view_index = 0; view_index < this.m_linkedViews.length;
                                                      view_index++ ){
                                                    if ( "click" == this.m_linkedViews[view_index].update ) {
                                                        this.m_linkedViews[view_index].panel.Update(update_data);
                                                    }
                                                }
                                             }.bind(this));
            //var dy = 30;
            var dy = textFlow(topicStrArray[index],
                              topicText[0][0],
                              namespace.TopicBar.prototype.s_svgSize.width,
                              namespace.TopicBar.prototype.s_textInfo.fontSize,
                              //topicText.style("font-size"),
                              namespace.TopicBar.prototype.s_textInfo.yIncrement, false);

            // More attributes added after svg text is added to the DOM
            // (done this way for drawing order/later highlighting)
            highlightRect.datum({"dy":rectGrowth + dy, "height":dy})
                         .attr("x", topicText.attr("x"))
                         .attr("y", parseInt(topicText.attr("y")) - parseInt(topicText.style("font-size")))
                         .attr("width", namespace.TopicBar.prototype.s_svgSize.width)
                         .attr("height", dy)
                         .attr("opacity", 0);

            yPosition += dy;
            rectGrowth += dy;
        }

        // Alter the height of the svg and rect to match the printed topics
        this.m_svg.attr("height", rectGrowth);
    });


    namespace.TopicBar.method("HighlightText", function(data){

        // De-highlight current highlighted text if any selection
        if ( -1 != this.m_currentSelection ) {
            d3.select(".topic_wordlist#topic_" + this.m_currentSelection)
              .attr("fill", function(d){ return this.m_level.m_topicColors[this.m_currentSelection]; }.bind(this));
            d3.select(".topic_highlightrect#topic_" + this.m_currentSelection)
              .attr("fill", this.m_div.style("background-color"))
              .attr("opacity", "0");
        }

        // Highlight the newly selected topic
        d3.select(".topic_wordlist#topic_" + data.topicID).attr("fill", this.m_div.style("background-color"));
        d3.select(".topic_highlightrect#topic_" + data.topicID).attr("fill", data.color).attr("opacity", "1");
        this.m_currentSelection = data.topicID;
    });

    namespace.TopicBar.method("Update", function(data){

        // Highlight the topic word list and scroll to it
        if ( null != data ) {

            d3.select(".topic_wordlist#topic_" + data.topicID).attr("fill", this.m_div.style("background-color"));
            d3.select(".topic_highlightrect#topic_" + data.topicID).attr("fill", data.color).attr("opacity", "1");
            dy = d3.select(".topic_highlightrect#topic_" + data.topicID).datum()["dy"]
            var viewBoxArray = d3.select(".svg_twic_info").attr("viewBox").split(" ");
            d3.select(".svg_twic_info").attr("viewBox", viewBoxArray[0] + " " + dy + " " +
                                             viewBoxArray[2] + " " +
                                             viewBoxArray[3]);

            // Save the current highlighted topic ID
            this.m_currentSelection = data.topicID;
        }
        // De-highlight all topic words lists and scroll back to the top of the topic bar
        else {

            d3.selectAll(".topic_wordlist").attr("fill", function(d){ return this.m_level.m_topicColors[d.id]; }.bind(this));
            d3.selectAll(".topic_highlightrect").attr("fill", this.m_div.style("background-color")).attr("opacity", "0");
            var viewBoxArray = d3.select(".svg_twic_info").attr("viewBox").split(" ");
            d3.select(".svg_twic_info").attr("viewBox", viewBoxArray[0] + " " + namespace.TopicBar.prototype.s_textInfo.yIncrement + " " +
                                             viewBoxArray[2] + " " +
                                             viewBoxArray[3]);

            // Reset the current selected topic to none
            this.m_currentSelection = -1;
        }
    });

    namespace.TopicBar.prototype.s_svgSize = { "width":1280, "height":165 };
    namespace.TopicBar.prototype.s_textInfo = { "yStart":-1415, "yIncrement":30, "fontSize":20 };


    // Shows individual cluster and text information tiles (TWiC.DocumentTiles)
    namespace.DocumentBar = function(p_coordinates, p_size, p_name, p_level, p_linkedViews){

        namespace.InformationView.apply(this, arguments);
    };
    namespace.DocumentBar.inherits(namespace.InformationView);

    namespace.DocumentBar.method("Initialize", function(p_levelDiv){

        this.m_div = p_levelDiv.append("div")
                               .attr("class", "div_twic_info_docbar div_twic_info twic_panel")
                               .attr("id", "div_twic_info_docbar_" + this.m_name)
                               //.style("float", "left")
                               .style("left", this.m_coordinates.x)
                               .style("top", this.m_coordinates.y)
                               .style("max-width", this.m_size.width)
                               .style("max-height", this.m_size.height)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height);

        // Document bar svg viewport (NOTE: viewBox needed?)
        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_info")
                               .attr("id","svg_twic_info_docbar_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height);
                               //.attr("width", namespace.DocumentBar.prototype.s_svgSize.width)
                               //.attr("height", namespace.DocumentBar.prototype.s_svgSize.height);
                               //.attr("viewBox", "0 0 " +
                               //      (TWiC_DocumentBar.prototype.s_svgSize.width) + " " +
                               //      (TWiC_DocumentBar.prototype.s_svgSize.height));

        // Add resize bars/capability to panel
        //this.MakeResizable();
    });

    namespace.DocumentBar.prototype.s_svgSize = { "width":600, "height":600 };


    return namespace;

}(TWiC || {}));