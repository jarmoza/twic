var TWiC = (function(namespace){

    // Base for TWiC panels
    namespace.Panel = function(p_coordinates, p_size, p_level){

        this.m_coordinates = p_coordinates;
        this.m_size = p_size;
        this.m_name = namespace.GetUniqueID();
        this.m_level = p_level;
        this.m_linkedViews = [];

        this.m_div = null;
        this.m_svg = null;
        this.m_groupOverlay = null;
        this.m_panelRect = null;
        this.m_resizers = {};
        this.m_lastScrollLRPos = 0;
        this.m_lastScrollTBPos = 0;

        this.m_paused = false;
        this.m_showEffects = false;

        this.m_transitionWhenClicked = false;
        this.m_transitionIn = null;
        this.m_transitionOut = null;

        this.m_controlBar = null;

        if ( null != this.m_level ) {
            this.m_level.AddPanel(this);
        }
    };

    namespace.Panel.method("Initialize", function(){ });
    namespace.Panel.method("Start", function(){ });
    namespace.Panel.method("Update", function(p_data, p_updateType){ });

    namespace.Panel.method("Pause", function(p_state){ this.m_paused = p_state; });
    namespace.Panel.method("IsPaused", function(){ return this.m_paused; });
    namespace.Panel.method("UseEffects", function(p_state){ this.m_showEffects = p_state; });
    namespace.Panel.method("IsUsingEffects", function(){ return this.m_showEffects; });
    namespace.Panel.method("UseTransitions", function(p_state){ this.m_transitionWhenClicked = p_state; });
    namespace.Panel.method("IsUsingTransitions", function(){ return this.m_transitionWhenClicked; });

    namespace.Panel.method("AddBarText", function(){ });

    namespace.Panel.method("AddLinkedView", function(p_linkedPanel, p_linkType){

        this.m_linkedViews.push({panel:p_linkedPanel, update:p_linkType});
    });

    namespace.Panel.method("AddLinkedViews", function(p_linkedPanelMaps){

        for ( var index = 0; index < p_linkedPanelMaps.length; index++ ){
            this.m_linkedViews.push(p_linkedPanelMaps[index]);
        }
    });

    namespace.Panel.method("GetViewBoxArray", function(p_element){ 

        return p_element.attr("viewBox").split(" ");
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

    namespace.Panel.method("SetContainer", function(p_container){

        // Saves a reference to the panel's TWiC container object and its control bar
        this.m_container = p_container;
        this.m_controlBar = this.m_container.m_controlBar;
    });

    namespace.Panel.prototype.GetTopNTopics = function(p_topicList, p_topicCount){
        
        var topTopics = [];
        for ( var index = 0; index < p_topicCount; index++ ){
            topTopics.push([]);
        }
        for ( index in p_topicList ) {

            for ( var index2 = 0; index2 < p_topicCount; index2++ ){

                if ( p_topicList[index][0] == index2 + 1 ) {
                    topTopics[index2] = [index, p_topicList[index][1]];
                }
            }
        }

        return topTopics;
    };
    
    namespace.Panel.prototype.s_borderRadius = 15;
    namespace.Panel.prototype.s_minimumPanelSize = 50;


    // Base for TWiC graph view
    namespace.GraphView = function(p_coordinates, p_size, p_level){

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
    namespace.GraphView.prototype.s_datashapeClassName = "graph_shape";
    namespace.GraphView.prototype.s_datashapeClassSelect = ".graph_shape";
    namespace.GraphView.prototype.s_datashapeTextClassName = "graph_shape_text";
    namespace.GraphView.prototype.s_datashapeTextClassSelect = ".graph_shape_text";


    // High level corpus view (TWiC.CorpusView)
    namespace.CorpusView = function(p_coordinates, p_size, p_level, p_radius, p_numberTopics){

        namespace.GraphView.apply(this, arguments);

        this.m_radius = p_radius;
        this.m_numberTopics = p_numberTopics;

        this.m_corpusCluster = null;
        this.m_nodes = [];
        this.m_zoomBehavior = d3.behavior.zoom();
    };
    namespace.CorpusView.inherits(namespace.GraphView);

    namespace.CorpusView.method("Initialize", function(p_parentDiv){

        // Set up the corpus view's div
        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_graph_corpusview div_twic_graph twic_panel")
                                .attr("id", "div_twic_graph_corpusview_" + this.m_name)
                                .style("left", this.m_coordinates.x)
                                .style("top", this.m_coordinates.y)
                                .style("max-width", this.m_size.width)
                                .style("max-height", this.m_size.height)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height);

        // Set up the corpus view's svg
        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_graph")
                               .attr("id", "svg_twic_graph_corpusview_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height);

        // Add group and rectangle for trapping mouse events in the graph
        this.m_groupOverlay = this.m_svg.append("g")
                                        .attr("class","group_twic_graph_corpusview_overlay")
                                        .attr("id", "group_twic_graph_corpusview_overlay_" + this.m_name)
                                        .style("position", "absolute");

        // Add the rectangle where all graph data will sit
        this.m_panelRect = this.m_groupOverlay.append("path")
                                              .attr("d", namespace.BottomRoundedRect(0, 0, this.m_size.width,
                                                                                     this.m_size.height,
                                                                                     namespace.Panel.prototype.s_borderRadius))
                                              .attr("class","rect_twic_graph")
                                              .attr("id","rect_twic_graph_corpusview_" + this.m_name)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue);

        // Create the corpus TWiC bullseye
        this.m_corpusCluster = new TWiC.ClusterCircle({x: this.m_size.width >> 1, y: this.m_size.height - (this.m_size.height * 0.6)},
                                                      this.m_radius,
                                                      this.m_level.m_corpusMap["name"], 
                                                      this.m_level, 
                                                      this, 
                                                      this.m_linkedViews,
                                                      this.m_numberTopics,
                                                      this.m_level.m_corpusMap["topics"],
                                                      this.m_level.m_corpusMap["name"]);

        // Add my text to the container's control bar
        this.AddBarText();
    });

    namespace.CorpusView.method("Start", function(p_parentDiv){

        // Add the single bullseye for the corpus view
        this.m_nodes.push({index: 0, name: this.m_name});
        var node = this.m_svg.selectAll(".node")
                             .data(this.m_nodes)
                             .enter()
                             .append("g")
                             .attr("class", "node")
                             .attr("id", function(d){return "node_" + d.index;})
                             .attr("x", this.m_corpusCluster.m_coordinates.x)
                             .attr("y", this.m_corpusCluster.m_coordinates.y)
                             .style("position", "absolute");
                             //.call(this.m_zoomBehavior.scaleExtent(TWiC.CorpusView.prototype.s_scaleExtentLimits).on("zoom", this.m_transitionOut));;

        // Create the svg for this node
        this.m_corpusCluster.AppendSVGandBindData(node, [this.m_name]);

        /* // Transitions between corpus view and corpus cluster view
        var fadeOutTrans = new TWiC.FadeInOut(this.m_corpusCluster.m_clusterGroup, 2000, 0.1);
        var zoomInTrans = new TWiC.ZoomIn(this.m_corpusCluster.m_clusterGroup, 2000, {x:this.m_size.width >> 1, y:this.m_size.height>>1}, 5);
        this.m_exitTransition = new TWiC.LinkedTransition(zoomInTrans, fadeOutTrans);*/

        // Start with the bullseye unhighlighted
        //this.DarkenAllDataShapes();

        // Start with the bullseye highlighted
        this.HighlightAllDataShapes();

        // Add the title of the corpus as text for this TWiC bullseye
        this.m_corpusCluster.AddTextTag(this.m_corpusCluster.m_title, 14 + (0.2 * this.m_corpusCluster.m_radius),
                                        namespace.Level.prototype.s_palette.gold,
                                        {x:this.m_corpusCluster.m_coordinates.x - (1.7 * this.m_corpusCluster.m_radius),
                                         y:this.m_corpusCluster.m_coordinates.y + this.m_corpusCluster.m_radius + (0.30 * this.m_corpusCluster.m_radius)},
                                        1.0);
    });

    namespace.CorpusView.method("Update", function(p_data, p_updateType){

        if ( !this.m_paused ) {

            // Mouseover updates
            if ( namespace.Interaction.mouseover == p_updateType ){
                
                if ( null != p_data ){
                    this.HighlightAllDataShapesWithTopic(p_data);
                } else {
                    //this.DarkenAllDataShapes();
                    this.HighlightAllDataShapes();
                }
            }
        }
    });

    namespace.CorpusView.method("AddBarText", function(){

        this.m_controlBar.AddText(function(p_controlBar){

            p_controlBar.m_barText = p_controlBar.m_controlGroup.append("text")
                                                                .attr("x", (p_controlBar.m_barThickness >> 1))
                                                                .attr("y", (p_controlBar.m_barThickness * 0.65));

            p_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                  .style("opacity", 1.0);

            p_controlBar.m_barText.append("tspan")
                                  .html("TWiC:&nbsp;&nbsp;")
                                  .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            p_controlBar.m_barText.append("tspan")
                                  .html("Top&nbsp;")
                                  .attr("fill", namespace.Level.prototype.s_palette.gold)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            // NOTE: Topic count is currently hard-coded, TODO: parametrize
            p_controlBar.m_barText.append("tspan")
                                  .html(10)
                                  .attr("fill", namespace.Level.prototype.s_palette.green)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 24);

            p_controlBar.m_barText.append("tspan")
                                  .html("&nbsp;topics in&nbsp;")
                                  .attr("fill", namespace.Level.prototype.s_palette.gold)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            p_controlBar.m_barText.append("tspan")
                                  .html(this.m_level.m_corpusMap["name"])
                                  .attr("fill", namespace.Level.prototype.s_palette.lightblue)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            /*var myTip = d3.tip().attr("class", "d3-tip")
                                .direction("s")
                                .offset([0,0])
                                .html("Topic Words in Context: Corpus View<br><br>" +
                                      "Actions:<br><br>" +
                                      "Mouseover - Highlights topics in view<br>" +
                                      "Click - Click on topic rings to pause viewing;<br>" +
                                      "click again to resume.<br><br>" +
                                      "Description:<br><br>" +
                                      "&nbsp;&nbsp;Here is a representation of a familiar output from<br>" +
                                      "MALLET, the top N topics of an entire corpus, which<br>" +
                                      "itself is a calculated average of the topic distributions<br>" +
                                      "of each document in the corpus.  As you mouse over the<br>" +
                                      "bullseye-like shape, you move toward the most prevalent<br>" +
                                      "topics of the corpus, the words of which can be seen in<br>" +
                                      "the topic bar below. These topics, as they are distributed<br>" +
                                      "throughout the corpus, can be seen as well as you mouseover.");

            this.m_svg.call(myTip);
            this.m_controlBar.m_helpBoxText.on(namespace.Interaction.mouseover, myTip.show)
                                           .on("mouseout", myTip.hide);*/

        }.bind(this));
    });

    namespace.CorpusView.method("DarkenAllDataShapes", function(){

        // Darken all shapes
        this.m_svg.selectAll(TWiC.CorpusView.prototype.s_datashapeClassSelect)
                  .style("fill", function(d){ return d.locolor; })
                  .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
    });

    namespace.CorpusView.method("HighlightAllDataShapes", function(){

        // Highlight all shapes
        this.m_svg.selectAll(TWiC.CorpusView.prototype.s_datashapeClassSelect)
                  .style("opacity", 1.0)
                  .style("fill", function(d){ return d.color; });
    });

    namespace.CorpusView.method("HighlightAllDataShapesWithTopic", function(p_data){

        // Highlight the moused-over shape
        var filteredShapes = this.m_svg.selectAll(TWiC.CorpusView.prototype.s_datashapeClassSelect)
                                       .filter(function(d){ return d.topicID == p_data.topicID; })
                                       .style("opacity", 1.0)
                                       .style("fill", p_data.color);

        // Make the rest of the shapes have a locolor but still be highlighted
        this.m_svg.selectAll(TWiC.CorpusView.prototype.s_datashapeClassSelect)
                  .filter(function(d){ return d.topicID != p_data.topicID; })
                  .style("opacity", 1.0)
                  .style("fill", function(d){ return d.locolor; });
    });

    namespace.CorpusView.prototype.s_datashapeClassName = "corpus_shape";
    namespace.CorpusView.prototype.s_datashapeClassSelect = ".corpus_shape";
    namespace.CorpusView.prototype.s_datashapeTextClassName = "corpus_shape_text";
    namespace.CorpusView.prototype.s_datashapeTextClassSelect = ".corpus_shape_text";
    namespace.CorpusView.prototype.s_scaleExtentLimits = [1, 16];    


    // Higher midlevel corpus bullseye cluster view (TWiC.CorpusClusterView)
    namespace.CorpusClusterView = function(p_coordinates, p_size, p_level){

        namespace.GraphView.apply(this, arguments);

        this.m_twicObjects = [];
        this.m_objectsJSON = [];
        this.m_nodes = [];
        this.m_links = [];
        this.m_graph = null;
        this.b_positionsCalculated = false;
        this.m_rootIndex = -1;
        this.m_zoomBehavior = d3.behavior.zoom();
    };
    namespace.CorpusClusterView.inherits(namespace.GraphView);

    namespace.CorpusClusterView.method("Initialize", function(p_parentDiv){

        this.m_coordinates.x = 0;
        this.m_coordinates.y = 0;

        // Set up the div for the corpus cluster view
        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_graph_corpusclusterview div_twic_graph twic_panel")
                                .attr("id", "div_twic_graph_corpusclusterview_" + this.m_name)
                                .style("left", this.m_coordinates.x)
                                .style("top", this.m_coordinates.y)
                                .style("max-width", this.m_size.width)
                                .style("max-height", this.m_size.height)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height);

        // Set up the svg for the corpus cluster view
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
                                        .attr("id", "group_twic_graph_corpusclusterview_overlay_" + this.m_name);
                                        //.call(this.m_zoomBehavior.scaleExtent(TWiC.CorpusClusterView.prototype.s_scaleExtentLimits).on("zoom", this.ScrollToZoom(this)));

        // Add the rectangle where all graph data will sit
        this.m_panelRect = this.m_groupOverlay.append("path")
                                              .attr("d", namespace.BottomRoundedRect(this.m_coordinates.x,
                                                                                     this.m_coordinates.y,
                                                                                     this.m_size.width,
                                                                                     this.m_size.height,
                                                                                     namespace.Panel.prototype.s_borderRadius))
                                              .attr("class","rect_twic_graph")
                                              .attr("id","rect_twic_graph_corpusclusterview_" + this.m_name)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue);


        // Make the control bar visible up front (as graph takes time to load)
        this.m_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                   .style("opacity", 1.0);

        // Add resize bars/capability to panel
        //this.MakeResizable();

        var twic_objects = [];
        var twic_cluster_json_list = [];
        var halfDimensions = {width:this.m_size.width >> 1, height: this.m_size.height >> 1};
        var clusterCount = Object.keys(this.m_level.m_corpusMap["children"]).length;

        // Distance to ideal normalization via corpus map JSON data
        var avg = 0.0;
        for ( var index = 0; index < clusterCount; index++ ){
            avg += this.m_level.m_corpusMap["children"][index]["dist2avg"];
        }
        avg /= this.m_level.m_corpusMap["children"].length;

        // Build all clusters
        var linkDilation = 80;
        for ( var index = 0; index < clusterCount; index++ ){

            var twic_cluster = new TWiC.ClusterCircle({x:0, y:0}, 25, this.m_level.m_corpusMap["children"][index]["name"], this.m_level, this, this.m_linkedViews, 10,
                                                      this.m_level.m_corpusMap["children"][index]["topics"],
                                                      index.toString());

            // Cluster circles are scaled in the CorpusClusterView
            twic_cluster.SetScaledRadius(true);

            var twic_cluster_json = {
                "name": this.m_level.m_corpusMap["children"][index]["name"],
                "dist2avg": 2 + Math.abs((this.m_level.m_corpusMap["children"][index]["dist2avg"] - avg) * linkDilation),
                "topics": this.m_level.m_corpusMap["children"][index]["topics"],
                "children": []
            };

            // Add ideal text filename for this cluster - WHY???
            //twic_cluster_json["children"].push(this.m_level.m_corpusMap["children"]["ideal_text"]);

            // Add text filenames inside this cluster
            /*for ( var index2 = 0; index2 < this.m_level.m_corpusMap["children"]["children"].length; index2++ ){
                 twic_cluster_json["children"].push(this.m_level.m_corpusMap["children"]["children"][index2]["name"]);
            }*/

            this.m_objectsJSON.push(twic_cluster_json);
            this.m_twicObjects.push(twic_cluster);
        }

        // Node zero for the force-directed graph will be a cluster circle representing
        // the average topic distribution for this cluster
        this.m_rootIndex = 0;
        this.m_nodes.push({"index": this.m_rootIndex, "name": this.m_level.m_corpusMap["name"]});

        // Top N topics of this node
        var topTopics = [];
        var topTopicCount = 10;
        for ( var index = 0; index < topTopicCount; index++ ) { topTopics.push([]) };
        var topTopicID = "";
        for ( var topic in this.m_level.m_corpusMap["topics"] ){
            if ( this.m_level.m_corpusMap["topics"][topic][0] < topTopicCount + 1){
                topTopics[this.m_level.m_corpusMap["topics"][topic][0] - 1] = this.m_level.m_corpusMap["topics"][topic];
            }
        }

        //var topTopics = namespace.Panel.prototype.GetTopNTopics(this.m_level.m_corpusMap["topics"], topTopicCount);

        var centralNode = new TWiC.ClusterCircle({x: 0, y: 0}, 25,
                                                 this.m_rootIndex, this.m_level, this, 
                                                 this.m_linkedViews, topTopicCount, topTopics,
                                                 this.m_nodes[0]["name"]);
        centralNode.SetScaledRadius(true);
        this.m_twicObjects.push(centralNode);
        

        // Establish the rest of the nodes and edges for the force-directed graph
        for ( var index = 0; index < this.m_objectsJSON.length; index++ ){

            if ( this.m_rootIndex == index )
                continue;

            //this.m_nodes.push({"node_index":index});
            this.m_nodes.push({"index": index, "name": this.m_objectsJSON[index]["name"]});
            this.m_links.push({
                "source":index,
                "target":this.m_rootIndex,
                "value":this.m_objectsJSON[index]["dist2avg"]
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
                       .style("stroke-width", 0.5)
                       .style("stroke","lightgray")
                       .style("opacity", TWiC.ClusterCircle.s_semihighlightedOpacity);

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
                             .style("position", "absolute")
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
                    if ( 0 == index ){
                        var textColor = namespace.Level.prototype.s_palette.gold;
                    } else {
                        var textColor = this.m_level.m_topicColors[index];
                    }
                    this.m_twicObjects[index].AddTextTag(this.m_nodes[index2]["name"].toString(),
                                                         20, textColor,
                                                         {x:this.m_twicObjects[index].m_coordinates.x - ((7 * index.toString().length) >> 1),
                                                          y:this.m_twicObjects[index].m_coordinates.y + (1.6 * this.m_twicObjects[index].m_radius)},
                                                         1.0);
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
            for ( var index = 0; index < 1000; index++ ) {
                this.Tick();
            }
            this.m_graph.stop();
            this.b_positionsCalculated = true;
        }.bind(this), 10);

        // Add my text to the container's control bar
        this.AddBarText();
    });

    namespace.CorpusClusterView.method("Update", function(p_data, p_updateType){

        if ( !this.m_paused ) {

            if ( namespace.Interaction.dblclick == p_updateType ){

                for ( var index = 0; index < this.m_linkedViews.length; index++ ) {
                    if ( namespace.Interaction.dblclick == this.m_linkedViews[index].update ) {
                        this.m_linkedViews[index].panel.Update({topicID: p_data.m_name}, p_updateType);
                    }
                }
            } else if ( namespace.Interaction.mouseover == p_updateType ) {
                if ( null != p_data ){
                    this.HighlightAllDataShapesWithTopic(p_data);
                } else {
                    //this.DarkenAllDataShapes();
                    this.HighlightAllDataShapes();
                }
            }
        } else {

            // If the panel is paused, but a cluster circle is double clicked,
            // unpause the panel and pass the double click to linked panels
            if ( namespace.Interaction.dblclick == p_updateType ){            

                // Pass the double click to linked panels
                for ( var index = 0; index < this.m_linkedViews.length; index++ ) {
                    if ( namespace.Interaction.dblclick == this.m_linkedViews[index].update ) {
                        var initialPauseState = this.m_linkedViews[index].panel.IsPaused();
                        if ( initialPauseState ){
                            this.m_linkedViews[index].panel.Pause(false);
                        }
                        this.m_linkedViews[index].panel.Update({topicID: p_data.m_name}, p_updateType);
                        if ( initialPauseState ){
                            this.m_linkedViews[index].panel.Pause(true);
                        }
                    }
                }
            }
        }
    });

    namespace.CorpusClusterView.method("AddBarText", function(){

        this.m_controlBar.AddText(function(p_controlBar){

            p_controlBar.m_barText = p_controlBar.m_controlGroup.append("text")
                                                    .attr("x", (p_controlBar.m_barThickness >> 1))
                                                    .attr("y", (p_controlBar.m_barThickness * 0.65));

            p_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                  .style("opacity", 1.0);

            p_controlBar.m_barText.append("tspan")
                                  .html("TWiC:&nbsp;&nbsp;")
                                  .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            p_controlBar.m_barText.append("tspan")
                                  .html("Texts Clustered by Top Topic in the ")
                                  .attr("fill", namespace.Level.prototype.s_palette.gold)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            p_controlBar.m_barText.append("tspan")
                                  .html(Object.keys(this.m_level.m_topicColors).length)
                                  .attr("fill", namespace.Level.prototype.s_palette.green)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 24);

            p_controlBar.m_barText.append("tspan")
                                  .html("&nbsp;topics of&nbsp;")
                                  .attr("fill", namespace.Level.prototype.s_palette.gold)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            p_controlBar.m_barText.append("tspan")
                                  .html(this.m_level.m_corpusMap["name"])
                                  .attr("fill", namespace.Level.prototype.s_palette.lightblue)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            /*var myTip = d3.tip().attr("class", "d3-tip")
                                .direction("w")
                                .offset([0,-300])
                                .html("Topic Words in Context: Corpus Cluster View<br><br>" +
                                      "Actions:<br>" +
                                      "Mouseover - Highlight topics as they appear in text clusters<br>" +
                                      "throughout the corpus.<br>" +
                                      "Click - Click on topic rings to pause viewing;<br>" +
                                      "click again to resume<br>" +
                                      "Double Click - Reveals the underlying text cluster<br>" +
                                      "in the Text Cluster View.<br><br>" +
                                      "Description:<br><br>" +
                                      "The corpus cluster view is one level below the corpus view.<br>" +
                                      "Texts are clustered by their top topic represented with similar<br>" +
                                      "bullseye abstraction, each of which shows the average top N topics<br>" +
                                      "of that cluster. At the center of the graph lies the cluster<br>" +
                                      "closest to the average corpus topic distribution (as visible in<br>" +
                                      "the corpus view), the distribution against which which all clusters<br>" +
                                      "of texts are compared and appropriately placed in space via<br>" +
                                      "computed distance measure.");

            this.m_svg.call(myTip);
            this.m_controlBar.m_helpBoxText.on(namespace.Interaction.mouseover, myTip.show)
                                           .on("mouseout", myTip.hide);*/
        }.bind(this));
    });

    namespace.CorpusClusterView.method("DarkenAllDataShapes", function(){

        // Darken all shapes
        var allShapes = this.m_svg.selectAll(TWiC.CorpusClusterView.prototype.s_datashapeClassSelect)
                  .style("fill", function(d){ return d.locolor; })
                  .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);

        // Darken all text
        this.m_svg.selectAll(TWiC.CorpusClusterView.prototype.s_datashapeTextClassSelect)
                  .selectAll("tspan")
                  .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
    });

    namespace.CorpusClusterView.method("HighlightAllDataShapes", function(){

        // Highlight all shapes
        this.m_svg.selectAll(TWiC.CorpusClusterView.prototype.s_datashapeClassSelect)
                  .style("opacity", 1.0)
                  .style("fill", function(d){ return d.color; });

        // Highlight all text
        this.m_svg.selectAll(TWiC.CorpusClusterView.prototype.s_datashapeTextClassSelect)
                  .selectAll("tspan")
                  .style("opacity", 1.0);
    });

    namespace.CorpusClusterView.method("HighlightAllDataShapesWithTopic", function(data){

        // Color all shapes that represent the given topic
        var filteredShapes = this.m_svg.selectAll(TWiC.CorpusClusterView.prototype.s_datashapeClassSelect)
                                        .filter(function(d){ return d.topicID == data.topicID; })
                                        .style("fill", data.color)
                                        .style("opacity", 1.0);

        // Darken all shapes that don't represent the given topic
        var darkShapes = this.m_svg.selectAll(TWiC.CorpusClusterView.prototype.s_datashapeClassSelect)
                  .filter(function(d){ return d.topicID != data.topicID; })
                  .style("fill", function(d){ return d.locolor; })
                  .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
        darkShapes.each(function(d){
            d3.select(this.parentNode)
              .selectAll("tspan")
              .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
        });

        // Raise the opacity of all shapes and text in the highlighted datashape
        filteredShapes.each(function(d){
            
            d3.select(this.parentNode)
              .selectAll(TWiC.CorpusClusterView.prototype.s_datashapeClassSelect)
              .filter(function(d){return d.topicID != data.topicID; })
              .style("opacity", 1.0)
              .style("fill", function(d){return d.locolor; });

            d3.select(this.parentNode)
              .selectAll("tspan")
              .style("opacity", 1.0);
        });                  
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

            nodes.attr("cx", function(d) {
                     return d.x = Math.max(d.radius, Math.min(svgWidth - d.radius, d.x));
                 })
                 .attr("cy", function(d) {
                     return d.y = Math.max(d.radius, Math.min(svgHeight - d.radius, d.y));
                 });

            var q = d3.geom.quadtree(this.m_nodes);
            var i = 0;
            var n = this.m_nodes.length;

            while (++i < n) { q.visit(namespace.GraphView.prototype.Collide(this.m_nodes[i])); }

            links.attr("x1", function(d) {
                     d.source.firstX = d.source.x; return d.source.x;
                 })
                 .attr("y1", function(d) {
                     d.source.firstY = d.source.y; return d.source.y;
                 })
                 .attr("x2", function(d) {
                     d.target.firstX = d.target.x; return d.target.x;
                 })
                 .attr("y2", function(d) {
                     d.target.firstY = d.target.y; return d.target.y;
                 });

            nodes.attr("transform", function(d) {
                d.firstX = d.x;
                d.firstY = d.y;
                return "translate(" + d.x + "," + d.y + ")";
            });
        }
        else{

            links.attr("x1", function(d) {
                     return d.source.firstX;
                 })
                 .attr("y1", function(d) {
                     return d.source.firstY;
                 })
                 .attr("x2", function(d) {
                     return d.target.firstX;
                 })
                 .attr("y2", function(d) {
                     return d.target.firstY;
                 });

            nodes.attr("transform", function(d) {
                     return "translate(" + d.firstX + "," + d.firstY + ")";
                 });
        }
    });

    namespace.CorpusClusterView.prototype.s_datashapeClassName = "corpuscluster_shape";
    namespace.CorpusClusterView.prototype.s_datashapeClassSelect = ".corpuscluster_shape";
    namespace.CorpusClusterView.prototype.s_datashapeTextClassName = "corpuscluster_shape_text";
    namespace.CorpusClusterView.prototype.s_datashapeTextClassSelect = ".corpuscluster_shape_text";
    namespace.CorpusClusterView.prototype.s_linkDistanceMod = 100;
    namespace.CorpusClusterView.prototype.s_scaleExtentLimits = [1, 16];


    // Lower midlevel document rectangle cluster view (TWiC.TextRectangle)
    namespace.TextClusterView = function(p_coordinates, p_size, p_level, p_clusterIndex){

        namespace.GraphView.apply(this, arguments);

        this.m_twicObjects = [];
        this.m_objectsJSON = [];
        this.m_nodes = [];
        this.m_links = [];
        this.m_graph = null;
        this.m_clusterIndex = p_clusterIndex;
        this.b_positionsCalculated = false;
        this.m_rootIndex = -1;
        this.m_zoomBehavior = d3.behavior.zoom();
        this.m_clusterSvgGroup = null;
    };
    namespace.TextClusterView.inherits(namespace.GraphView);

    namespace.TextClusterView.method("Initialize", function(p_parentDiv){

        // Panel coordinates are relative to its parent
        this.m_coordinates.x = 0;
        this.m_coordinates.y = 0;

        // Set up the div for the text cluster view
        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_graph_textclusterview div_twic_graph twic_panel")
                                .attr("id", "div_twic_graph_textclusterview_" + this.m_name)
                                .style("left", this.m_coordinates.x)
                                .style("top", this.m_coordinates.y)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height)
                                .style("max-width", this.m_size.width)
                                .style("max-height", this.m_size.height)

        // Set up the svg for the text cluster view
        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_graph")
                               .attr("id", "svg_twic_graph_textclusterview_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height);

        // Add group for trapping mouse events in the graph
        this.m_groupOverlay = this.m_svg.append("g")
                                        .attr("class","group_twic_graph_overlay")
                                        .attr("id", "group_twic_graph_overlay_textclusterview_" + this.m_name);
                                        //.call(this.m_zoomBehavior.scaleExtent(TWiC.CorpusClusterView.prototype.s_scaleExtentLimits).on("zoom", this.ScrollToZoom(this)))

        // Add the rectangle where all graph data will sit
        this.m_panelRect = this.m_groupOverlay.append("path")
                                              .attr("d", namespace.BottomRoundedRect(this.m_coordinates.x,
                                              this.m_coordinates.y, this.m_size.width, this.m_size.height, namespace.Panel.prototype.s_borderRadius))
                                              .attr("class","rect_twic_graph")
                                              .attr("id","rect_twic_graph_textclusterview_" + this.m_name)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue);

        this.m_clusterSvgGroup = this.m_groupOverlay.append("g").attr("id", "clustersvg_group")
                                                       .attr("width", this.m_size.width)
                                                       .attr("height", this.m_size.height)
                                                       .attr("transform", "translate(" + ((this.m_coordinates.x + (this.m_size.width >> 2)) * 0.4)
                                                             + "," + ((this.m_coordinates.y + (this.m_size.height >> 2)) * 0.4) + ") scale(0.75)");


        // Add my text to the container's control bar
        this.AddBarText();

        this.InitializeGraph();
    });

    namespace.TextClusterView.method("InitializeGraph", function(){

        var twic_objects = [];
        var twic_cluster_json_list = [];

        // Distance to ideal normalization via corpus map JSON data
        var avg = 0.0;
        for ( var index = 0; index < this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"].length; index++ )
            avg += this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["dist2avg"];
        avg /= this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"].length;

        // Node zero for the force-directed graph will be a cluster circle representing the average
        // topic distribution of this text cluster
        this.m_rootIndex = 0;
        this.m_nodes.push({"index": this.m_rootIndex, "name": this.m_level.m_corpusMap["children"][this.m_clusterIndex]["name"]});

        // Add the svg group for this central node
        this.m_clusterSvgGroup.append("g")
                              .attr("class", "node")
                              .style("position", "absolute")                        
                              .attr("id", "node_" + this.m_rootIndex);
                              

        // Top N topics of the fake node
        var topTopics = [];
        var topTopicCount = 10;
        for ( var index = 0; index < topTopicCount; index++ ) { topTopics.push([]) };
        var topTopicID = "";
        for ( var topic in this.m_level.m_corpusMap["children"][this.m_clusterIndex]["topics"] ){
            if ( this.m_level.m_corpusMap["children"][this.m_clusterIndex]["topics"][topic][0] < topTopicCount + 1){
                topTopics[this.m_level.m_corpusMap["children"][this.m_clusterIndex]["topics"][topic][0]] = this.m_level.m_corpusMap["children"][this.m_clusterIndex]["topics"][topic];
            }
        }

        var centralNode = new TWiC.ClusterCircle({x: 0, y: 0}, 25 * 1.333, this.m_nodes[0]["name"], this.m_level, this, this.m_linkedViews,
                                                 topTopicCount, topTopics, this.m_nodes[0]["name"]);
        centralNode.SetScaledRadius(true);
        this.m_twicObjects.push(centralNode);
        this.m_objectsJSON.push({"name": centralNode.m_name, "dist2avg": 0.0, "topics": topTopics, "children":[]});        

        // Build all clusters
        var linkDilation = 40;
        var halfDimensions = {width:this.m_size.width >> 1, height: this.m_size.height >> 1};
        for ( var index = 0; index < this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"].length; index ++ ){

            var textRectangle = new TWiC.TextRectangle({x:0,y:0}, {width:0,height:0},
                                                       this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["name"], this.m_level,
                                                       this, this.m_linkedViews, this.m_clusterIndex);
            // Load the individual JSON for this text
            textRectangle.Load();

            var textrect_json = {
                "name":this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["name"],
                "dist2avg":2 + Math.abs((this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["dist2avg"] - avg) * linkDilation),
                "topics":this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["topics"],
                "children":[]
            };

            // Add ideal text filename for this cluster - Why???
            //textrect_json["children"].push(this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"]["ideal_text"]);
      
            // Add text filenames inside this cluster
            /*for ( var index2 = 0; index2 < this.m_level.m_corpusMap["children"]["children"].length; index2++ ){
                 twic_cluster_json["children"].push(this.m_level.m_corpusMap["children"]["children"][index2]["name"]);
            }*/
      
            this.m_objectsJSON.push(textrect_json);
            this.m_twicObjects.push(textRectangle);
        }        

        // Establish the rest of the nodes and edges for the force-directed graph
        for ( var index = 0; index < this.m_objectsJSON.length; index++ ){

            if ( this.m_rootIndex == index )
                continue;

            var tempRadius = Math.sqrt(((this.m_twicObjects[index].m_size.width >> 1) * (this.m_twicObjects[index].m_size.width >> 1)) + ((this.m_twicObjects[index].m_size.height >> 1) * (this.m_twicObjects[index].m_size.height >> 1)));
            this.m_nodes.push({"index":index, "name":this.m_objectsJSON[index]["name"]});
            this.m_links.push({
                "source":index,
                "target":this.m_rootIndex,
                "value":this.m_objectsJSON[index]["dist2avg"]
            });
        }

        // Set up the force-directed graph
        this.m_graph = d3.layout.force()
                                .nodes(this.m_nodes)
                                .links(this.m_links)
                                .size([this.m_size.width, this.m_size.height])
                                .charge(-400)
                                .gravity(0.05)
                                .linkStrength(0.1)
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
            this.m_clusterSvgGroup.selectAll(".link")
                                  .data(this.m_links)
                                  .enter()
                                  .append("line")
                                  .attr("class", "link")
                                  .style("stroke-width", 0.5)
                                  .style("stroke","lightgray")
                                  .style("opacity", TWiC.ClusterCircle.s_semihighlightedOpacity);

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

                        // Simple test to discern between TextRectangles and the central ClusterCircle
                        if ( undefined != this.m_twicObjects[index].Draw ){

                            this.m_twicObjects[index].Draw();                            
                            var fileID = this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index - 1]["name"];                                
                            var title = this.m_level.m_corpusInfo.file_info[parseInt(fileID)][1];                           

                        } else {
                            // Adds a cluster circle in the center (with no attached filenames --> [])
                            this.m_twicObjects[index].AppendSVGandBindData(this.m_svg.select(".node#node_" + index), []);
                            var title = "Topic Cluster " + this.m_clusterIndex.toString(); 
                        }

                        this.m_twicObjects[index].AddTextTag(title,
                                                             20, TWiC.Level.prototype.s_palette.gold,
                                                             {x:this.m_twicObjects[index].m_coordinates.x - ((7 * title.length) >> 1),
                                                              y:this.m_twicObjects[index].m_coordinates.y + (2.75 * this.m_twicObjects[index].m_radius)},
                                                             0.0);                         
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

                for ( var index = 1000; index > 0; --index ) {

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

    namespace.TextClusterView.method("Update", function(p_data, p_updateType){

        if ( !this.m_paused ){

            if ( p_updateType && namespace.Interaction.mouseover == p_updateType ){

                if ( null != p_data ){

                    // If mouseover occurs over the center of a text rectangle show all text titles
                    if ( parseInt(p_data.topicID) == this.m_clusterIndex ){
                        this.HighlightAllDataShapes(true);
                    // Highlight all matching cluster rectangle shapes
                    } else {
                        this.HighlightAllDataShapesWithTopic(p_data);
                    }
                // Otherwise, this is a mouseout from a text rectangle.
                // Highlight all but show no titles
                } else {
                    //this.DarkenAllDataShapes();
                    this.HighlightAllDataShapes(false);
                }
            } else {
                if ( p_data && p_data.topicID != this.m_clusterIndex && this.m_level.m_corpusMap["children"][this.m_clusterIndex] ) {

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
                    this.m_clusterIndex = p_data.topicID;                    
                    this.b_positionsCalculated = false;
                    this.m_rootIndex = -1;

                    this.m_controlBar.m_barText.selectAll("*").remove();
                    this.AddBarText(50, "top");

                    // Re-initialize and start the graph
                    this.InitializeGraph();
                    this.Start();
                }
            }
        } else {
            // If the panel is paused, but a cluster rectangle is double clicked,
            // unpause the panel and pass the double click to linked panels
            if ( namespace.Interaction.dblclick == p_updateType ){

                // Pass the double click to linked panels
                for ( var index = 0; index < this.m_linkedViews.length; index++ ) {
                    if ( namespace.Interaction.dblclick == this.m_linkedViews[index].update ) {
                        this.m_linkedViews[index].panel.Update(p_data, p_updateType);
                    }
                }

                // Stop the click from passing through to other objects
                d3.event.stopPropagation();
            }
        }
    });

    namespace.TextClusterView.method("AddBarText", function(){

        this.m_controlBar.AddText(function(p_controlBar){

            p_controlBar.m_barText = p_controlBar.m_controlGroup.append("text")
                                                    .attr("x", (p_controlBar.m_barThickness >> 1))
                                                    .attr("y", (p_controlBar.m_barThickness * 0.65));

            p_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue).style("opacity", 1.0);

            p_controlBar.m_barText.append("tspan")
                                  .html("TWiC:&nbsp;&nbsp;")
                                  .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            p_controlBar.m_barText.append("tspan")
                                  .html("Texts with Top Topic of&nbsp;")
                                  .attr("fill", namespace.Level.prototype.s_palette.gold)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            p_controlBar.m_barText.append("tspan")
                                  .html(this.m_clusterIndex)
                                  .attr("fill", this.m_level.m_topicColors[this.m_clusterIndex])
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 24);

            p_controlBar.m_barText.append("tspan")
                                  .html("&nbsp;in&nbsp;")
                                  .attr("fill", namespace.Level.prototype.s_palette.gold)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            p_controlBar.m_barText.append("tspan")
                                  .html(this.m_level.m_corpusMap["name"])
                                  .attr("fill", namespace.Level.prototype.s_palette.lightblue)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            /*var myTip = d3.tip().attr("class", "d3-tip")
                                .direction("s")
                                .offset([0,0])
                                .html("Corpus-Cluster View: One level below the corpus view, texts are clustered by their top topic<br>" +
                                      "represented with similar abstraction. At the center of the graph\nlies the central statistical<br>" +
                                      "measure by which all clusters of texts are measured. In the case on display, the top 10 topics<br>" +
                                      "of each cluster is shown through the bullseye-like shape (with the most central topic at its center),<br>" +
                                      "and those clusters are shown at a computed distance from the average topic distribution of the corpus.");

            this.m_svg.call(myTip);
            this.m_controlBar.m_helpBoxText.on(namespace.Interaction.mouseover, myTip.show)
                                           .on("mouseout", myTip.hide);*/
        }.bind(this));
    });

    namespace.TextClusterView.method("DarkenAllDataShapes", function(){

        // Darken all clusters
        var allShapes = this.m_svg.selectAll(TWiC.TextClusterView.prototype.s_datashapeClassSelect);
        allShapes.each(function(d){

            if ( "path" == this.nodeName || "circle" == this.nodeName ){
                d3.select(this).style("fill", d.locolor)
                               .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
            } else if ( "rect" == this.nodeName ){
                d3.select(this).style("stroke", d.locolor)
                               .style("stroke-opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
            } else if ( "group" == this.nodeName ){
                d3.select(this).selectAll("rect").style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
                d3.select(this).selectAll("path").style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
            }
        });

        // Hide all text
        this.m_svg.selectAll(TWiC.TextClusterView.prototype.s_datashapeTextClassSelect)
                  .selectAll("tspan")
                  .style("opacity", 0.0);
    });

    namespace.TextClusterView.method("HighlightAllDataShapes", function(p_showText){

        // All shapes get highlighted
        var allShapes = this.m_svg.selectAll(TWiC.TextClusterView.prototype.s_datashapeClassSelect);
        allShapes.each(function(d){

            if ( "path" == this.nodeName || "circle" == this.nodeName ){
                d3.select(this).style("fill", d.color)
                               .style("opacity", 1.0);
            } else if ( "rect" == this.nodeName ){
                d3.select(this).style("stroke", d.color)
                               .style("stroke-opacity", 1.0);
            } else if ( "group" == this.nodeName ) {
                d3.select(this).selectAll("rect").style("opacity", 1.0);
                d3.select(this).selectAll("path").style("opacity", 1.0);
            }
        });

        // Text highlighting is optional
        if ( p_showText ){
            this.m_svg.selectAll(TWiC.TextClusterView.prototype.s_datashapeTextClassSelect)
                      .selectAll("tspan")
                      .style("opacity", 1.0);      
        } else {
            this.m_svg.selectAll(TWiC.TextClusterView.prototype.s_datashapeTextClassSelect)
                      .selectAll("tspan")
                      .style("opacity", 0.0);             
        }
    });

    namespace.TextClusterView.method("HighlightAllDataShapesWithTopic", function(data){

        // Darken all shapes and text first
        this.DarkenAllDataShapes();

        // Highlight all shapes that represent the given topic
        var filteredShapes = this.m_svg.selectAll(TWiC.TextClusterView.prototype.s_datashapeClassSelect)
                                       .filter(function(d){ return d.topicID == data.topicID; });
        filteredShapes.each(function(d){

            // Highlight all paths, circles, and rectangles 
            if ( "path" == this.nodeName || "circle" == this.nodeName ){
                d3.select(this).style("fill", d.color)
                               .style("opacity", 1.0);
            } else if ( "rect" == this.nodeName ){
                d3.select(this).style("stroke", d.color)
                               .style("stroke-opacity", 1.0);
            } else if ( "group" == this.nodeName ){
                d3.select(this).selectAll("rect").style("opacity", 1.0);
                d3.select(this).selectAll("path").style("opacity", 1.0);                
            }

            // Raise the opacity, but not color of shapes in the same datashape that do not represent the given topic
            var nonHighlights = d3.select(this.parentNode)
                                  .selectAll(TWiC.TextClusterView.prototype.s_datashapeClassSelect)
                                  .filter(function(d){return d.topicID != data.topicID; });
            nonHighlights.each(function(d){
                if ( "path" == this.nodeName || "circle" == this.nodeName ){
                    d3.select(this).style("fill", d.locolor)
                        .style("opacity", 1.0);
                } else if ( "rect" == this.nodeName ){
                    d3.select(this).style("stroke", d.locolor)
                        .style("stroke-opacity", 1.0);
                } else if ( "group" == this.nodeName ){
                    d3.select(this).selectAll("rect").style("opacity", 1.0);
                    d3.select(this).selectAll("path").style("opacity", 1.0);                    
                }
            });

            // Highlight the text of shapes with attached text
            if ( d && d.shapeRef ){
                d.shapeRef.m_textTag.selectAll("tspan")
                                    .style("opacity", 1.0);
            }
        });

        // Darken all shapes that don't represent the given topic
        /*var darkShapes = this.m_svg.selectAll(TWiC.TextClusterView.prototype.s_datashapeClassSelect)
                                   .filter(function(d){ return d.topicID != data.topicID; });
        darkShapes.each(function(d){

            if ( "path" == this.nodeName || "circle" == this.nodeName ){
                d3.select(this).style("fill", d.locolor)
                               .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
            } else if ( "rect" == this.nodeName ){
                d3.select(this).style("stroke", d.locolor)
                               .style("stroke-opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
            } else if ( "group" == this.nodeName ){
                d3.select(this).selectAll("rect").style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
                d3.select(this).selectAll("path").style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);                
            }

            // Hide the text of these darkened shapes
            if ( d && d.shapeRef ){
                d.shapeRef.m_textTag.selectAll("tspan")
                                    .style("opacity", 0.0);
            }
        });*/

        /*// Raise the opacity of all circles in the highlighted cluster
        filteredShapes.each(function(d){
            d3.select(this.parentNode)
              .selectAll(TWiC.TextClusterView.prototype.s_datashapeClassSelect)
              .filter(function(d){return d.topicID != data.topicID; })
              .style("stroke-opacity", 1.0);

            d.shapeRef.m_shapeGroup.style("opacity", 1.0);
            d.shapeRef.m_shapeGroup
              .selectAll(".clusterrect_text")
              .selectAll("tspan")
              .style("opacity", 1.0);
            d.shapeRef.m_textTag.style("opacity", 1.0);
        });

        // Duplicated code for cluster circle at the center of the panel
        // Color all circles that represent the given topic
        var filteredCircles = this.m_svg.selectAll(".topic_circle")
                                        .filter(function(d){ return d.topicID == data.topicID; })
                                        .style("fill", data.color)
                                        .style("opacity", 1.0);

        // Darken all circles that don't represent the given topic
        this.m_svg.selectAll(".topic_circle")
                  .filter(function(d){ return d.topicID != data.topicID; })
                  .style("fill", function(d){ return d.locolor; })
                  .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);

        // Raise the opacity of all circles in the highlighted cluster
        filteredCircles.each(function(d){
            d3.select(this.parentNode)
              .selectAll(".topic_circle")
              .filter(function(d){return d.topicID != data.topicID; })
              .style("opacity", 1.0);

            d3.select(this.parentNode)
              .selectAll("tspan")
              .style("opacity", 1.0);
        });*/
    });

    namespace.TextClusterView.method("Tick", function(){

        var links = this.m_svg.selectAll(".link"); // Perform visible/active test later
        var nodes = this.m_svg.selectAll(".node"); // Perform visible/active test later
        var svgWidth = parseInt(this.m_svg.attr("width"));
        var svgHeight = parseInt(this.m_svg.attr("height"));
        var tempRadius = Math.sqrt(((this.m_size.width >> 1) * (this.m_size.width >> 1)) + ((this.m_size.height >> 1) * (this.m_size.height >> 1)));

        this.m_nodes[this.m_rootIndex].x = svgWidth >> 1;
        this.m_nodes[this.m_rootIndex].y = svgHeight >> 1;



        if ( !this.b_positionsCalculated ){

            nodes.attr("cx", function(d) {
                     return d.x = Math.max(this.m_twicObjects[d.index].m_radius, Math.min(svgWidth - this.m_twicObjects[d.index].m_radius, d.x));
                 }.bind(this))
                 .attr("cy", function(d) {
                     return d.y = Math.max(this.m_twicObjects[d.index].m_radius, Math.min(svgHeight - this.m_twicObjects[d.index].m_radius, d.y));
                 }.bind(this));

            var q = d3.geom.quadtree(this.m_nodes);
            var i = 0;
            var n = this.m_nodes.length;

            while (++i < n) { q.visit(namespace.GraphView.prototype.Collide(this.m_nodes[i])); }

            links.attr("x1", function(d) {
                     d.source.firstX = d.source.x; return d.source.x;
                 })
                 .attr("y1", function(d) {
                     d.source.firstY = d.source.y; return d.source.y;
                 })
                 .attr("x2", function(d) {
                     d.target.firstX = d.target.x; return d.target.x;
                 })
                 .attr("y2", function(d) {
                     d.target.firstY = d.target.y; return d.target.y;
                 });

            nodes.attr("transform", function(d) {
                d.firstX = d.x;
                d.firstY = d.y;
                return "translate(" + d.x + "," + d.y + ")";
            });
        }
        else{

            links.attr("x1", function(d) {
                     return d.source.firstX;
                 })
                 .attr("y1", function(d) {
                     return d.source.firstY;
                 })
                 .attr("x2", function(d) {
                     return d.target.firstX;
                 })
                 .attr("y2", function(d) {
                     return d.target.firstY;
                 });

            nodes.attr("transform", function(d) {
                     return "translate(" + d.firstX + "," + d.firstY + ")";
                 });
        }
    });

    namespace.TextClusterView.prototype.s_datashapeClassName = "textcluster_shape";
    namespace.TextClusterView.prototype.s_datashapeClassSelect = ".textcluster_shape";
    namespace.TextClusterView.prototype.s_datashapeTextClassName = "textcluster_shape_text";
    namespace.TextClusterView.prototype.s_datashapeTextClassSelect = ".textcluster_shape_text";


    // Low level individual text view (TWiC.TopicTextHTML)
    namespace.TextView = function(p_coordinates, p_size, p_level, p_fileID){

        namespace.GraphView.apply(this, arguments);

        this.m_fileID = p_fileID;
        this.m_data = null;

        // Old usage: individual HTML file added to the panel as foreignObject
        // for AddHTMLAsForeignObject()
        //this.m_HTML = null;
    };
    namespace.TextView.inherits(namespace.GraphView);

    namespace.TextView.method("Initialize", function(p_parentDiv){

        this.m_coordinates.x = 0;
        this.m_coordinates.y = 0;

        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_graph_textview div_twic_graph twic_panel")
                                .attr("id", "div_twic_graph_textview_" + this.m_name)
                                .style("left", this.m_coordinates.x)
                                .style("top", this.m_coordinates.y)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height)
                                .style("max-width", this.m_size.width)
                                .style("max-height", this.m_size.height)
                                // New
                                .style("overflow", "scroll")
                                .style("border-radius", namespace.Panel.prototype.s_borderRadius);


        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_graph")
                               .attr("id", "svg_twic_graph_textview_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height);


        // (Testing) Load the HTML for an initial text
        //this.Load();

        // Add group and rectangle for trapping mouse events in the graph
        this.m_groupOverlay = this.m_svg.append("g")
                                        .attr("class","group_twic_graph_overlay")
                                        .attr("id", "group_twic_graph_overlay_textview_" + this.m_name)
                                        .attr("position", "absolute");
                                        //.call(this.m_zoomBehavior.scaleExtent(TWiC.CorpusClusterView.prototype.s_scaleExtentLimits).on("zoom", this.ScrollToZoom(this)))

        // Add a background rect to the svg group
        this.m_panelRect = this.m_groupOverlay.append("path")
                                              .attr("d", namespace.BottomRoundedRect(this.m_coordinates.x,
                                              this.m_coordinates.y, this.m_size.width, this.m_size.height, namespace.Panel.prototype.s_borderRadius))
                                              .attr("class","rect_twic_graph")
                                              .attr("id","rect_twic_graph_textview_" + this.m_name)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue);

        /*this.m_highlightRect = this.m_groupOverlay.append("rect")
                                                  .attr("x", this.m_coordinates.x)
                                                  .attr("y", this.m_coordinates.y - this.m_controlBar.m_size.height)
                                                  .attr("width", this.m_size.width)
                                                  .attr("height", this.m_size.height + this.m_controlBar.m_size.height)
                                                  .attr("fill", "none")
                                                  .style("opacity", 0.0);*/

        // Append a separate group for foreignObject tags for the text
        this.m_textGroup = this.m_groupOverlay.append("g")
                                              .attr("class", "group_textview_text");

        // Make the bar text opaque initially
        this.m_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                   .style("opacity", 1.0);
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

    namespace.TextView.method("Start", function(){ });

    namespace.TextView.method("Update", function(p_data, p_updateType){

        if ( !this.IsPaused() ) {

            if ( namespace.Interaction.mouseover == p_updateType ) {

                if ( null == p_data ) {
                    //this.DarkenTopicText();
                    this.HighlightAllWords();
                } else {
                    this.DarkenAllWords();
                    this.HighlightTopicText(p_data);
                }
            } else {

                // Save a reference to the JSON data
                this.m_data = p_data;

                // Create text objects from this text's JSON
                this.CreateTextSVGFromJSON(p_data);
                //this.CreateHTMLFromJSON(p_data);
                //this.AddHTMLAsForeignObject(data);

                // Remove any old text and add my new text to the container's control bar
                this.AddBarText();
            }
        }
    });

    namespace.TextView.method("CreateTextSVGFromJSON", function(data){

        var currentX = namespace.TextView.prototype.s_textStartPosition.x;
        var currentY = namespace.TextView.prototype.s_textStartPosition.y;
        var rectGrowth = this.m_size.height;
        var dy = namespace.TopicBar.prototype.s_textInfo.yIncrement;

        // Remove old texts from the view
        //this.m_textGroup.selectAll("*").remove();
        this.m_groupOverlay.selectAll("*").remove();

        // Initial loop for path/panel rectangle resize (rectangle needs to be drawn first)
        for ( var index = 0; index < data.json.lines_and_colors.length; index++ ) {
            currentY += dy;
            if ( currentY > this.m_size.height ){
                rectGrowth += dy;
            }
        }

        // Resize the svg and panel rectangle
        this.m_svg.attr("height", rectGrowth);
        this.m_groupOverlay.selectAll(".rect_twic_graph").remove();
        this.m_panelRect = this.m_groupOverlay.append("path")
                                              .attr("d", namespace.BottomRoundedRect(this.m_coordinates.x,
                                              this.m_coordinates.y, this.m_size.width, rectGrowth, namespace.Panel.prototype.s_borderRadius))
                                              .attr("class","rect_twic_graph")
                                              .attr("id","rect_twic_graph_textview_" + this.m_name)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue);
        this.m_div.style("border-radius", namespace.Panel.prototype.s_borderRadius);

        // Re-add text groups
        this.m_textGroup = this.m_groupOverlay.append("g")
                                              .attr("class", "group_textview_text");
        var containerGroup = this.m_textGroup.append("g").attr("class", "textview_container")
                                                 .style("width", this.m_size.width - namespace.TextView.prototype.s_borderWidth)
                                                 .style("height", this.m_size.height - namespace.TextView.prototype.s_borderWidth)
                                                 .style("position", "relative")
                                                 .style("overflow", "auto");

        // Build the HTML text
        currentX = 50;
        currentY = 100;
        for ( var index = 0; index < data.json.lines_and_colors.length; index++ ) {

            words = data.json.lines_and_colors[index][0].split(" ");
            var lineText = "";

            currentX = 50;
            var text;

            for ( var index2 = 0; index2 < words.length; index2++ ) {

                // NOTE: undefined HACK
                if ( "-1" == data.json.lines_and_colors[index][1][index2] ||
                     undefined == data.json.lines_and_colors[index][1][index2] ){

                    //var dlocolor = namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorMidlight,
                    //                             TWiC.Level.prototype.s_palette.gold);


                    text = containerGroup.append("text").attr("class", "text_word")
                                                 //.datum({locolor: dlocolor})
                                                 .attr("x", currentX)
                                                 .attr("y", currentY)
                                                 .attr("dx", "0")
                                                 .attr("dy", "0")
                                                 .attr("fill", namespace.Level.prototype.s_palette.gold)
                                                 .style("font-family", namespace.Level.prototype.s_fontFamily)
                                                 .style("font-size", 20)
                                                 .style("position", "absolute")
                                                 .style("opacity", 1.0)
                                                 .html(words[index2] + "&nbsp;");
                }
                else {

                    var dlocolor = namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorLolight,
                                                 this.m_level.m_topicColors[data.json.lines_and_colors[index][1][index2]]);

                    text = containerGroup.append("text").attr("class", "text_coloredword")
                                                 .datum({topicID: data.json.lines_and_colors[index][1][index2],
                                                         locolor: dlocolor,
                                                         color:this.m_level.m_topicColors[data.json.lines_and_colors[index][1][index2]]})
                                                 .attr("x", currentX)
                                                 .attr("y", currentY)
                                                 .attr("dx", "0")
                                                 .attr("dy", "0")
                                                 .attr("fill", this.m_level.m_topicColors[data.json.lines_and_colors[index][1][index2]])
                                                 .style("font-family", namespace.Level.prototype.s_fontFamily)
                                                 .style("font-size", 20)
                                                 .style("position", "absolute")
                                                 .style("opacity", 1.0)
                                                 .html(words[index2] + "&nbsp;");
                }

                currentX += text[0][0].offsetWidth * 0.67;
                //currentX += text[0][0].offsetWidth * 0.9;
            }

            currentY += dy;
            if ( currentY > this.m_size.height ){
                rectGrowth += dy;
            }
        }

        this.m_svg.selectAll(".text_coloredword")
                  .on(namespace.Interaction.click, function(){
                      // Pause/unpause my panel's Update() to keep
                      // highlighting frozen or allow it to resume
                      var initialPauseState = this.IsPaused();
                      this.Pause(!initialPauseState);

                      // Pause/unpause all of my panel's linked views as well
                      for ( var index = 0; index < this.m_linkedViews.length;
                            index++ ) {
                          this.m_linkedViews[index].panel.Pause(!initialPauseState);
                      }
                  }.bind(this))
                  .on(namespace.Interaction.mouseover, function(d){

                      this.Update(d, namespace.Interaction.mouseover);
                      for ( var index = 0; index < this.m_linkedViews.length; index++ ) {
                          if ( namespace.Interaction.mouseover == this.m_linkedViews[index].update ) {
                              this.m_linkedViews[index].panel.Update(d, namespace.Interaction.mouseover);
                          }
                      }
                  }.bind(this))
                  .on("mouseout", function(){

                      this.Update(null, namespace.Interaction.mouseover);
                      for ( var index = 0; index < this.m_linkedViews.length; index++ ) {
                          if ( namespace.Interaction.mouseover == this.m_linkedViews[index].update ) {
                              this.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                          }
                      }
                  }.bind(this));
    });

    namespace.TextView.method("CreateHTMLFromJSON", function(data){

        // Panel border reflects the color of the most prevalent topic
        /*this.m_panelRect.style("stroke", this.m_level.m_topicColors[data.clusterIndex])
                        .style("stroke-width", namespace.TextView.prototype.s_borderWidth);
        this.m_controlBar.m_barPath.style("stroke", this.m_level.m_topicColors[data.clusterIndex])
                                   .style("stroke-width", namespace.TextView.prototype.s_borderWidth);*/

        /*data.lines_and_colors
        data.title
        data.publication
        data.filename*/

        // Remove old texts from the view
        this.m_textGroup.selectAll("*").remove();

        // Add div for text
        var textBody = this.m_textGroup.append("foreignObject").append("xhtml:body");
        var containerDiv = textBody.append("div").attr("class", "textview_container")
                                                 .style("width", this.m_size.width - namespace.TextView.prototype.s_borderWidth)
                                                 .style("height", this.m_size.height - namespace.TextView.prototype.s_borderWidth)
                                                 .style("position", "relative")
                                                 .style("overflow", "auto");
                                                 //.style("border", namespace.TextView.prototype.s_borderWidth + "px")
                                                 //.style("border-style", "solid")
                                                 //.style("border-color", this.m_level.m_topicColors[data.clusterIndex]);
        //var titleDiv = containerDiv.append("div").attr("class", "title");
        //var publicationDiv = containerDiv.append("div").attr("class", "publication");
        var textDiv = containerDiv.append("div").attr("class", "center");
        var lineTextAll = "";

        //titleDiv.html("<b>" + data.json.title + "</b>");
        //publicationDiv.html("<b>" + data.json.publication + "</b>");

        // Build the HTML text
        for ( var index = 0; index < data.json.lines_and_colors.length; index++ ) {

            var words = data.json.lines_and_colors[index][0].split(" ");
            var lineText = "";

            for ( var index2 = 0; index2 < words.length; index2++ ) {

                if ( "-1" == data.json.lines_and_colors[index][1][index2] ){
                    lineText = lineText + words[index2];
                }
                else {
                    lineText = lineText + "<span title=\"Topic " + data.json.lines_and_colors[index][1][index2] +
                    "\"><font color=\"" + this.m_level.m_topicColors[data.json.lines_and_colors[index][1][index2]] +
                    "\"><b>" + words[index2] + "</b></font></span>"
                }

                if ( index2 + 1 < words.length ) {
                    lineText = lineText + " ";
                }
                else {
                    lineText = lineText + "<br>";
                }
            }
            lineTextAll = lineTextAll + lineText;
        }

        // Apply the HTML text to the TextView main div
        textDiv.html(lineTextAll);

        // Apply styles to the divs
        textDiv.style("left", 100)//this.m_coordinates.x)
               .style("top", 50)//this.m_coordinates.y)
               .style("float","left")
               .style("position", "absolute")
               .style("margin", "0 auto !important")
               //.style("display", "inline-block")
               .style("font-size", "18")
               //.style("width", this.m_size.width)
               //.style("max-width", this.m_size.width)
               //.style("height", this.m_size.height)
               //.style("max-height", this.m_size.height)
               .style("max-width", "100%")
               //.style("max-height", this.m_size.height - namespace.TextView.prototype.s_borderWidth)
               //.style("background-color", namespace.Level.prototype.s_palette.darkblue)
               .style("font-family", namespace.Level.prototype.s_fontFamily)
               .style("font-size", 20)
               .style("color", namespace.Level.prototype.s_palette.gold)
               .style("float", "left")
               .style("text-align", "left");

        /*titleDiv.style("color", this.m_level.m_topicColors[data.clusterIndex])
                .style("max-width", "100%")//this.m_size.width)
                .style("font-size", "26")
                .style("font-family", namespace.Level.prototype.s_fontFamily)
                .style("top", "25px")
                .style("left", "100px")
                .style("margin", "0 auto !important")
                .style("position", "absolute")
                .style("float", "left");

        publicationDiv.style("color", this.m_level.m_topicColors[data.clusterIndex])
                .style("max-width", "100%")
                .style("font-size", "22")
                .style("font-family", namespace.Level.prototype.s_fontFamily)
                .style("top", "55px")
                .style("left", "100px")
                .style("margin", "0 auto !important")
                .style("position", "absolute")
                .style("float", "left")
                .style("margin-bottom", "25px");*/

        myPanel = this;
        this.m_svg.selectAll("span")
                  .on(namespace.Interaction.click, function(){
                      // Pause/unpause my panel's Update() to keep
                      // highlighting frozen or allow it to resume
                      var initialPauseState = this.IsPaused();
                      this.Pause(!initialPauseState);

                      // Pause/unpause all of my panel's linked views as well
                      for ( var index = 0; index < this.m_linkedViews.length;
                            index++ ) {
                          this.m_linkedViews[index].panel.Pause(!initialPauseState);
                      }
                  }.bind(this))
                  .on(namespace.Interaction.mouseover, function(){
                      var spanTopicID = this.title.split(" ")[1];
                      var data = {topicID: spanTopicID, color:myPanel.m_level.m_topicColors[spanTopicID]};
                      for ( var index = 0; index < myPanel.m_linkedViews.length; index++ ) {
                          if ( namespace.Interaction.mouseover == myPanel.m_linkedViews[index].update ) {
                              myPanel.m_linkedViews[index].panel.Update(data, namespace.Interaction.mouseover);
                          }
                      }
                  })
                  .on("mouseout", function(){
                      for ( var index = 0; index < myPanel.m_linkedViews.length; index++ ) {
                          if ( namespace.Interaction.mouseover == myPanel.m_linkedViews[index].update ) {
                              myPanel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                          }
                      }
                  });
    });

    namespace.TextView.method("AddHTMLAsForeignObject", function(){

        this.m_groupOverlay.style("overflow", "auto").append("foreignObject")
                        .attr("width", this.m_size.width)
                        .attr("height", this.m_size.height)
                        .append("xhtml:body")
                        .style("background-color", namespace.Level.prototype.s_palette.darkblue)
                        .style("font-family", namespace.Level.prototype.s_fontFamily)
                        .style("font-size", 20)
                        .style("color", namespace.Level.prototype.s_palette.gold)
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
                  .on(namespace.Interaction.mouseover, function(){
                      var spanTopicID = this.title.split(" ")[1];
                      var data = {topicID: spanTopicID, color:myPanel.m_level.m_topicColors[spanTopicID]};
                      for ( var index = 0; index < myPanel.m_linkedViews.length; index++ ) {
                          if ( namespace.Interaction.mouseover == myPanel.m_linkedViews[index].update ) {
                              myPanel.m_linkedViews[index].panel.Update(data, namespace.Interaction.mouseover);
                          }
                      }
                  })
                  .on("mouseout", function(){
                      for ( var index = 0; index < myPanel.m_linkedViews.length; index++ ) {
                          if ( namespace.Interaction.mouseover == myPanel.m_linkedViews[index].update ) {
                              myPanel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                          }
                      }
                  });
    });

    namespace.TextView.method("AddBarText", function(){

        this.m_controlBar.AddText(function(p_controlBar){

            p_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                  .style("opacity", 1.0);

            if ( null == p_controlBar.m_barText ) {
                p_controlBar.m_barText = p_controlBar.m_controlGroup.append("text")
                                                        .attr("x", (p_controlBar.m_barThickness >> 1))
                                                        .attr("y", (p_controlBar.m_barThickness * 0.65));
            }

            if ( null != this.m_data ){

                this.m_controlBar.m_barText.selectAll("*").remove();

                p_controlBar.m_barText.append("tspan")
                                      .html("TWiC:&nbsp;&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 21);

                p_controlBar.m_barText.append("tspan")
                                      .html("\"" + this.m_data.json.title + "\"")
                                      .attr("fill", this.m_level.m_topicColors[this.m_data.clusterIndex])
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 23);

                p_controlBar.m_barText.append("tspan")
                                      .html("&nbsp;from&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.gold)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 21);

                p_controlBar.m_barText.append("tspan")
                                      .html("Topic Cluster " + this.m_data.clusterIndex)
                                      .attr("fill", this.m_level.m_topicColors[this.m_data.clusterIndex])
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 21);

                p_controlBar.m_barText.append("tspan")
                                      .html("&nbsp;in&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.gold)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 21);

                p_controlBar.m_barText.append("tspan")
                                      .html(this.m_level.m_corpusMap["name"])
                                      .attr("fill", namespace.Level.prototype.s_palette.lightblue)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 21);
            }
        }.bind(this));
    });

    namespace.TextView.method("DarkenAllWords", function(){

        this.m_svg.selectAll(".text_word")
                  //.attr("fill", function(d){ return d.locolor; });
                  .attr("fill", namespace.Level.prototype.s_palette.logold);
        this.m_svg.selectAll(".text_coloredword")
                  .attr("fill", function(d){ return d.locolor; });
    });

    namespace.TextView.method("HighlightAllWords", function(){

        this.m_svg.selectAll(".text_word")
                  .attr("fill", namespace.Level.prototype.s_palette.gold);
        this.m_svg.selectAll(".text_coloredword")
                  .attr("fill", function(d){ return d.color; });
    });

    namespace.TextView.method("HighlightTopicText", function(p_data){

        this.m_svg.selectAll(".text_coloredword")
                  .filter(function(d){ return d.topicID == p_data.topicID; })
                  .attr("fill", function(d){ return d.color; });

        this.m_svg.selectAll(".text_coloredword")
                  .filter(function(d){ return d.topicID != p_data.topicID; })
                  .attr("fill", function(d){ return d.locolor; });

    });

    namespace.TextView.method("DarkenTopicText", function(p_data){

        this.m_svg.selectAll(".text_coloredword")
                  .attr("fill", function(d){ return d.locolor; });
    });

    namespace.TextView.prototype.s_borderWidth = 5;
    namespace.TextView.prototype.s_textStartPosition = {x: 50, y: 100};
    namespace.TextView.prototype.s_datashapeClassName = "text_shape";
    namespace.TextView.prototype.s_datashapeClassSelect = ".text_shape";
    namespace.TextView.prototype.s_datashapeTextClassName = "text_shape_text";
    namespace.TextView.prototype.s_datashapeTextClassSelect = ".text_shape_text";


    // Base for informational views
    namespace.InformationView = function(p_coordinates, p_size, p_name, p_level, p_linkedViews){

        namespace.Panel.apply(this, arguments);
    };
    namespace.InformationView.inherits(namespace.Panel);


    // Shows corpus, cluster(?), and text topic word lists (TWiC.TextLine)
    namespace.TopicBar = function(p_coordinates, p_size, p_level){

        namespace.InformationView.apply(this, arguments);

        // Initial values
        this.m_currentSelection = -1;
    };
    namespace.TopicBar.inherits(namespace.InformationView);

    namespace.TopicBar.method("Initialize", function(p_parentDiv){

        this.m_coordinates.x = 0;
        this.m_coordinates.y = 0;

        // No initial selected text
        this.m_currentSelection = -1;

        /*this.m_div = p_parentDiv.append("div")
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
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.x)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height)
                               //.attr("viewBox", "0 " + namespace.TopicBar.prototype.s_textInfo.yIncrement + " " + this.m_size.width + " " + this.m_size.height);
                               .attr("viewBox", "0 0 " + this.m_size.width + " " + this.m_size.height)
                               .style("position", "absolute");*/



        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_info_topicbar div_twic_info twic_panel")
                                .attr("id", "div_twic_info_topicbar_" + this.m_name)
                                .style("left", this.m_coordinates.x)
                                .style("top", this.m_coordinates.y)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height)
                                .style("overflow", "scroll")
                                .style("border-radius", namespace.Panel.prototype.s_borderRadius);

        // Topic bar svg viewport
        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_info")
                               .attr("id","svg_twic_info_topicbar_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height);


        // Topic bar topic word list group
        this.m_groupOverlay = this.m_svg.append("g")
                                        .attr("class","group_twic_topicbar");

        // Add background rectangle
        this.m_panelRect = this.m_groupOverlay.append("rect")
                                              .attr("class", "rect_twic_topicbar")
                                              .attr("id", "rect_twic_topicbar_" + this.m_name)
                                              .attr("x", this.m_coordinates.x)
                                              .attr("y", this.m_coordinates.y)
                                              .attr("width", this.m_size.width)
                                              .attr("height", this.m_size.height)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                              .attr("rx", namespace.Panel.prototype.s_borderRadius)
                                              .attr("ry", namespace.Panel.prototype.s_borderRadius);

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
        //for ( var index = 0, yPosition = namespace.TopicBar.prototype.s_textInfo.yStart + namespace.TopicBar.prototype.s_textInfo.fontSize;
        for ( var index = 0, yPosition = namespace.TopicBar.prototype.s_textInfo.fontSize;
                  index < topicStrArray.length; index++ ){

            // Append opaque rectangle that will be used as highlight for each topic word list
            var highlightRect = this.m_groupOverlay.append("rect")
                                             .attr("class", "topic_highlightrect")
                                             .attr("id", "topic_" + index)
                                             .attr("fill", this.m_level.m_topicColors[index]);

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
                                         .on(namespace.Interaction.click, function(d){
                                                update_data = {topicID:d.id, color:this.m_level.m_topicColors[d.id]};
                                                this.HighlightText(update_data);
                                                for ( var view_index = 0; view_index < this.m_linkedViews.length;
                                                      view_index++ ){
                                                    if ( namespace.Interaction.click == this.m_linkedViews[view_index].update ) {

                                                        this.m_linkedViews[view_index].panel.Update(update_data);
                                                        /*var initialPauseState = this.m_linkedViews[view_index].IsPaused();
                                                        if ( !initialPauseState) {
                                                            this.m_linkedViews[view_index].panel.Update(update_data);
                                                            this.m_linkedViews[view_index].Pause(true);
                                                        } else {
                                                            this.m_linkedViews[view_index].Pause(false);
                                                            this.m_linkedViews[view_index].panel.Update(update_data);
                                                        }*/
                                                    }
                                                }
                                         }.bind(this));

            // NOTE: dy seems to be an unreliable measure, textFlow.js may be buggy
            // Implementing "numTspansAdded" - 05/28/2015
            var dy = textFlow(topicStrArray[index],
                              topicText[0][0],
                              this.m_size.width,
                              namespace.TopicBar.prototype.s_textInfo.fontSize,
                              namespace.TopicBar.prototype.s_textInfo.yIncrement, false);

            var numTspansAdded = topicText.selectAll("tspan")[0].length;
            dy = namespace.TopicBar.prototype.s_textInfo.yIncrement * numTspansAdded;

            // More attributes added after svg text is added to the DOM
            // (done this way for drawing order/later highlighting)
            highlightRect.datum({"dy":rectGrowth + dy, "height":dy, "lines":numTspansAdded})
                         .attr("x", topicText.attr("x"))
                         .attr("y", parseInt(topicText.attr("y")) - parseInt(topicText.style("font-size")))
                         .attr("width", this.m_size.width)
                         .attr("height", dy)
                         .attr("opacity", 0);

            // Hacky way of ensuring wrapped text is not overwritten by the next topic word list
            yPosition += dy;
            rectGrowth += dy;
        }

        // Alter the height of the svg and rect to match the printed topics
        this.m_svg.attr("height", rectGrowth);
        this.m_panelRect.attr("height", rectGrowth);
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

        if ( !this.m_paused ) {

            // Highlight the topic word list and scroll to it
            if ( null != data ) {

                this.m_svg.select(".topic_wordlist#topic_" + data.topicID).attr("fill", this.m_panelRect.attr("fill"));
                this.m_svg.select(".topic_highlightrect#topic_" + data.topicID).attr("fill", data.color).attr("opacity", 1.0);
                var dy = this.m_svg.select(".topic_highlightrect#topic_" + data.topicID).datum()["dy"]
                var numLines = this.m_svg.select(".topic_highlightrect#topic_" + data.topicID).datum()["lines"]

                this.m_div[0][0].scrollTop = dy - (numLines * namespace.TopicBar.prototype.s_textInfo.yIncrement);
                //var viewBoxArray = this.m_div.select(".svg_twic_info").attr("viewBox").split(" ");
                //this.m_div.select(".svg_twic_info").attr("viewBox", viewBoxArray[0] + " " + dy + " " +
                //                                 viewBoxArray[2] + " " +
                //                                 viewBoxArray[3]);

                // Save the current highlighted topic ID
                this.m_currentSelection = data.topicID;
            }
            // De-highlight all topic words lists and scroll back to the top of the topic bar
            else {

                this.m_svg.selectAll(".topic_wordlist").attr("fill", function(d){ return this.m_level.m_topicColors[d.id]; }.bind(this));
                this.m_svg.selectAll(".topic_highlightrect").attr("fill", this.m_panelRect.attr("fill")).attr("opacity", 0);
                //var viewBoxArray = this.m_div.select(".svg_twic_info").attr("viewBox").split(" ");
                //this.m_div.select(".svg_twic_info").attr("viewBox", viewBoxArray[0] + " 0 " + viewBoxArray[2] + " " + viewBoxArray[3]);
                this.m_div[0][0].scrollTop = 0;

                // Reset the current selected topic to none
                this.m_currentSelection = -1;
            }
        }
    });

    namespace.TopicBar.prototype.s_svgSize = { "width":1280, "height":165 };
    namespace.TopicBar.prototype.s_textInfo = { "yStart":-1400, "yIncrement":30, "fontSize":20 };


    // Shows individual cluster and text information tiles (TWiC.DocumentTiles)
    namespace.DocumentBar = function(p_coordinates, p_size, p_name, p_level, p_linkedViews){

        namespace.InformationView.apply(this, arguments);
    };
    namespace.DocumentBar.inherits(namespace.InformationView);

    namespace.DocumentBar.method("Initialize", function(p_parentDiv){

        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_info_docbar div_twic_info twic_panel")
                                .attr("id", "div_twic_info_docbar_" + this.m_name)
                                .style("float", "left")
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