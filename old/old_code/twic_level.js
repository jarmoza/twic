/* TWiC Level

- Contains objects
- Contains a force-directed graph
- Data (minimal loaded as needed by this level)

*/
var TWIC = (function(twic_namespace){

    twic_namespace.TWiC_Level = function(p_svgParent, p_location, p_dimensions, p_levelName, p_idealText){

        this.m_location = p_location;
        this.m_svgParent = p_svgParent;
        this.m_dimensions = p_dimensions;
        this.m_levelName = p_levelName;
        this.m_twicObjects = null;
        this.m_objectsJSON = null;
        this.m_nodes = [];
        this.m_links = [];
        this.m_graph = null;
        this.m_idealText = p_idealText;
        this.b_positionsCalculated = false;
        this.m_rootIndex = -1;
        this.m_zoomBehavior = d3.behavior.zoom();
    };

    twic_namespace.TWiC_Level.prototype.s_linkDistanceMod = 100;
    twic_namespace.TWiC_Level.prototype.s_rectCornerRadius = 15;
    twic_namespace.TWiC_Level.prototype.s_corpusMap = null;
    twic_namespace.TWiC_Level.prototype.scaleExtentLimits = [1, 16];
    namespace.DataShape.prototype.s_objectCount = 0;

    twic_namespace.TWiC_Level.method("AddObjects", function(p_twicObjects, p_objectsJSON){
        this.m_twicObjects = p_twicObjects;
        this.m_objectsJSON = p_objectsJSON;
    });

    twic_namespace.TWiC_Level.method("LoadLevel", function(){

        // Add level group and rectangle
        this.m_svgParent.append("g")
                        //.attr("class", "twic_level_group")
                        .attr("class","overlay")
                        .attr("id", "twic_level_" + this.m_levelName)
                        .call(this.m_zoomBehavior.scaleExtent(TWIC.TWiC_Level.prototype.scaleExtentLimits).on("zoom", this.ScrollToZoom(this)))
                        .append("rect")
                        .attr("class","twic_level_rect")
                        .attr("id","twic_level_rect_" + this.m_levelName)
                        .attr("x", this.m_location[0])
                        .attr("y", this.m_location[1])
                        .attr("rx", TWIC.TWiC_Level.prototype.s_rectCornerRadius + "px")
                        .attr("ry", TWIC.TWiC_Level.prototype.s_rectCornerRadius + "px")
                        .attr("width",this.m_dimensions[0])
                        .attr("height", this.m_dimensions[1])
                        //.style("stroke","black")
                        //.style("stroke-width","2")
                        .style("fill", "white");
    });

    twic_namespace.TWiC_Level.method("LoadGraph", function(){

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
            for ( var index = 0; index < topTopicCount; index++ ) topTopics.push([]);
            var topTopicID = "";
            for ( var topic in TWIC.TWiC_Level.prototype.s_corpusMap["topics"] ){
                if ( TWIC.TWiC_Level.prototype.s_corpusMap["topics"][topic][0] < topTopicCount + 1){
                    topTopics[TWIC.TWiC_Level.prototype.s_corpusMap["topics"][topic][0] - 1] = TWIC.TWiC_Level.prototype.s_corpusMap["topics"][topic];
                }
            }

            // Add a twic cluster object to the graph to represent this single document (may enable clickability later)
            /*var topTopicID = "";
            for ( var topic in TWiC_Level.prototype.s_corpusMap["topics"] ){
                if ( 1 == TWiC_Level.prototype.s_corpusMap["topics"][topic][0] ){
                    topTopicID = topic;
                    break;
                }
            }
            var topTopic = [TWiC_Level.prototype.s_corpusMap["topics"][topTopicID]];*/

            this.m_twicObjects.push(new TWIC.TWiC_Cluster(d3.select("#twic_level_" + this.m_levelName),
                                                    [0,0], 20, topTopicCount, TWIC.TWiC_Object.prototype.s_topicColors, topTopics,
                                                    TWIC.TWiC_Level.prototype.s_corpusMap["ideal_text"], rootIndex));
        }

        // Establish the rest of the nodes and edges for the force-directed graph
        for ( var index = 0; index < this.m_objectsJSON.length; index++ ){

            //if ( this.m_idealText == this.m_objectsJSON[index]["ideal_text"] )
            if ( rootIndex == index )
                continue;

            //this.m_nodes.push({"node_index":index});
            this.m_nodes.push({"index":index});
            this.m_links.push({
                "source":index,
                "target":rootIndex,
                "value":this.m_objectsJSON[index]["distance2ideal"]
            });
        }

        // DEBUG
        /*for ( var index = 0; index < this.m_links.length; index++ ){
            console.log("Link[" + index + "]: (" + this.m_links[index]["source"] + "," +
                this.m_links[index]["target"] + "," + this.m_links[index]["value"] + ")");
        }
        console.log("\n");
        for ( var index = 0; index < this.m_nodes.length; index++ ){
            console.log("Node " + this.m_nodes[index]["node_index"]);
        }*/


        // Set up the force-directed graph
        this.m_graph = d3.layout.force()
                                .nodes(this.m_nodes)
                                .links(this.m_links)
                                .size(this.m_dimensions)
                                .charge(0.2)
                                .gravity(0)
                                //.chargeDistance(10)
                                .linkDistance(function(d){ return d.value * TWIC.TWiC_Level.prototype.s_linkDistanceMod; });
    });

    twic_namespace.TWiC_Level.method("Start", function(){

        // Start the force-directed graph
        //this.m_graph.start();

        // Add lines for the links and bind the link data to them
        var link = this.m_svgParent.selectAll(".link")
                                     .data(this.m_links)
                                   .enter()
                                   .append("line")
                                   .attr("class", "link")
                                   .style("stroke-width", function(d) { return Math.sqrt(d.value); })
                                   .style("stroke","black");
                                   //.style("stroke-width", 5);

        // Bind TWiC object data to the node data
        for ( index = 0; index < this.m_twicObjects.length; index++ ) {
            for ( var index2 = 0; index2 < this.m_nodes.length; index2++ ){
                //if ( this.m_twicObjects[index].nodeIndex == this.m_nodes[index2]["node_index"] ){
                if ( this.m_twicObjects[index].nodeIndex == this.m_nodes[index2]["index"] ){
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
        // like it is here on the top group for this TWIC rectangle
        var node = this.m_svgParent.selectAll(".node")
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
                if ( this.m_twicObjects[index].nodeIndex == this.m_nodes[index2]["index"] ){
                    this.m_twicObjects[index].AppendSVGandBindData(d3.select(".node#node_" + index2));
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
        var twicLevel = this;
        setTimeout(function(){

            twicLevel.m_graph.start();

            for (var i = 1000; i > 0; --i)
                twicLevel.Tick(twicLevel);

            twicLevel.m_graph.stop();

            twicLevel.b_positionsCalculated = true;
        }, 10);

        //twicLevel.m_graph.start();
        //this.m_graph.on("tick", function() { twicLevel.Tick(twicLevel); });
    });

    twic_namespace.TWiC_Level.method("ScrollToZoom", function(twic_level){

      var cb = function(error, data){

        // Scale the level group attached to the svg container
        d3.select("#twic_level_" + twic_level.m_levelName).attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }

      return cb;
    });

    twic_namespace.TWiC_Level.method("Tick", function(twicLevel){

        var links = d3.selectAll(".link"); // Perform visible/active test later
        var nodes = d3.selectAll(".node"); // Perform visible/active test later
        var svgWidth = parseInt(d3.select("svg").attr("width"));
        var svgHeight = parseInt(d3.select("svg").attr("height"));

        twicLevel.m_nodes[twicLevel.m_rootIndex].x = svgWidth >> 1;
        twicLevel.m_nodes[twicLevel.m_rootIndex].y = svgHeight >> 1;

        if ( !twicLevel.b_positionsCalculated ){

            nodes.attr("cx", function(d) { return d.x = Math.max(d.radius, Math.min(svgWidth - d.radius, d.x)); })
                 .attr("cy", function(d) { return d.y = Math.max(d.radius, Math.min(svgHeight - d.radius, d.y)); });

            var q = d3.geom.quadtree(twicLevel.m_nodes);
            var i = 0;
              var n = twicLevel.m_nodes.length;

              while (++i < n) { q.visit(TWIC.collide(twicLevel.m_nodes[i])); }

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


    twic_namespace.collide = function(node) {

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

    return twic_namespace;

}(TWIC || {}));
