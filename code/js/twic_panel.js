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

        this.m_paused = false;

        this.m_controlBar = null;

        this.m_underlyingPanelOpen = false;

        this.m_hidden = false;

        if ( null != this.m_level ) {
            this.m_level.AddPanel(this);
        }
    };

    namespace.Panel.method("Initialize", function(){

        var x = 0;
    });

    namespace.Panel.method("Start", function(){

        var x = 0;
    });

    namespace.Panel.method("Update", function(p_data, p_updateType){

        var x = 0;
    });

    namespace.Panel.method("Pause", function(p_state){

        this.m_paused = p_state;
    });

    namespace.Panel.method("IsPaused", function(){

        return this.m_paused;
    });

    namespace.Panel.method("IsUnderlyingPanelOpen", function(){

        return this.m_underlyingPanelOpen;
    });

    namespace.Panel.method("SetContainer", function(p_container){

        // Saves a reference to the panel's TWiC container object and its control bar
        this.m_container = p_container;
        this.m_controlBar = this.m_container.m_controlBar;
    });

    namespace.Panel.method("SetPosition", function(p_coordinates){

        this.m_coordinates.x = p_coordinates.x;
        this.m_coordinates.y = p_coordinates.y;
    });

    namespace.Panel.method("SetSize", function(p_size){

      this.m_size.width = p_size.width;
      this.m_size.height = p_size.height;
    });

    namespace.Panel.method("AddBarText", function(){

        var x = 0;
    });

    namespace.Panel.method("AddLinkedView", function(p_linkedPanel, p_linkType){

        this.m_linkedViews.push({panel:p_linkedPanel, update:p_linkType});
    });

    namespace.Panel.method("GetRectPath", function(p_orientation){

        // Determine the type of partially-rounded rectangle to draw
        switch ( p_orientation ){

            case 'top':
                var path = namespace.TopRoundedRect(this.m_coordinates.x, this.m_coordinates.x,
                                                    this.m_size.width, this.m_size.height,
                                                    namespace.Panel.prototype.s_borderRadius);
                break;

            case 'bottom':
                var path = namespace.BottomRoundedRect(this.m_coordinates.x, this.m_coordinates.y,
                                                       this.m_size.width, this.m_size.height,
                                                       namespace.Panel.prototype.s_borderRadius);
                break;

            case 'left':
                var path = namespace.LeftRoundedRect(this.m_coordinates.x, this.m_coordinates.y,
                                                     this.m_size.width, this.m_size.height,
                                                     namespace.Panel.prototype.s_borderRadius);
                break;

            case 'right':
                var path = namespace.RightRoundedRect(this.m_coordinates.x, this.m_coordinates.y,
                                                      this.m_size.width, this.m_size.height,
                                                      namespace.Panel.prototype.s_borderRadius);
                break;
        };

        return path;
    });

    namespace.Panel.method("Hide", function(p_hide){

        if ( p_hide ){

            // Save the current dimensions for unhiding
            this.m_recentDims = { width: this.m_size.width,
                                  height: this.m_size.height + this.m_controlBar.m_size.height };
            this.m_recentPos = { x: parseFloat(this.m_container.m_div.style("left")),
                                 y: parseFloat(this.m_container.m_div.style("top")) };

            // Transition will be to the minimum panel width and size of the control bar only
            var transition = {
                position: { x: this.m_recentPos.x, y: this.m_recentPos.y },
                size: { width: namespace.Panel.prototype.s_minimumPanelSize,
                        height: namespace.Control.prototype.s_defaultThickness },
                duration: 500
            };

            // Disable resizing
            this.ToggleResize(true);
        } else {

            this.m_recentPos = { x: parseFloat(this.m_container.m_div.style("left")),
                                 y: parseFloat(this.m_container.m_div.style("top")) };

            // Bring back to size before hiding
            var transition = {
                position: { x: this.m_recentPos.x, y: this.m_recentPos.y },
                size: { width: this.m_recentDims.width, height: this.m_recentDims.height },
                duration: 500
            };

            // Enable resizing
            this.ToggleResize(false);
        }

        // Save the current hidden state
        this.m_hidden = p_hide;

        // Change the control bar text
        this.AddBarText(this.m_hidden);

        // Resize the container
        if ( this.m_hidden ){

            this.Move(transition, "end", function(){

                // Reorganize the panels
                $(this.m_level.m_div[0]).packery();

                // Make sure the shrunken bar is fully rounded
                this.m_controlBar.m_barPath.transition()
                                           .duration(10)
                                           .attr("d",
                                                 namespace.FullyRoundedRect(this.m_coordinates.x,
                                                                            this.m_coordinates.y,
                                                                            this.m_container.m_size.width,
                                                                            namespace.Control.prototype.s_defaultThickness,
                                                                            namespace.Panel.prototype.s_borderRadius));
            }.bind(this));
        } else {

            this.m_controlBar.m_barPath.attr("d",
                                             namespace.TopRoundedRect(this.m_coordinates.x,
                                                                      this.m_coordinates.y,
                                                                      this.m_container.m_size.width,
                                                                      namespace.Control.prototype.s_defaultThickness,
                                                                      namespace.Panel.prototype.s_borderRadius));


            this.Move(transition, "end", function(){

                // Reorganize the panels
                $(this.m_level.m_div[0]).packery();
            }.bind(this));
        }
    });

    namespace.Panel.method("IsHidden", function(){

        return this.m_hidden;
    });

    namespace.Panel.method("MakeDraggable", function(){

        // Make this panel draggable
        $(this.m_container.m_div[0]).draggable({
            start: function(){ this.m_level.Pause(true); }.bind(this),
            drag: function(){
                this.m_container.m_div.node().parentNode.appendChild(this.m_container.m_div.node());
                this.m_level.Pause();
            }.bind(this),
            stop: function(){ this.m_level.Pause(false); }.bind(this)
        });
    });

    namespace.Panel.method("MakeResizable", function(p_maintainAspectRatio){

        if ( undefined === p_maintainAspectRatio ){
            p_maintainAspectRatio = true;
        }

        // Minimum width is dependent on the width of the control bar's descriptive text
        var resizeMinWidth = namespace.Panel.prototype.s_minimumPanelSize;
        var resizeMinHeight = namespace.Panel.prototype.s_minimumPanelSize;
        /*if ( this.m_controlBar && this.m_controlBar.m_barText ){
            var resizeMinWidth = (parseInt(this.m_controlBar.m_barText.attr("x")) << 1) + this.m_controlBar.m_barText[0][0].getBBox().width;
            var resizeMinHeight = (parseInt(this.m_controlBar.m_barText.attr("y")) << 1) + this.m_controlBar.m_barText[0][0].getBBox().height;
            if ( resizeMinHeight < namespace.Panel.prototype.s_minimumPanelSize ){
                resizeMinHeight = namespace.Panel.prototype.s_minimumPanelSize;
            }
            if ( resizeMinWidth < namespace.Panel.prototype.s_minimumPanelSize ){
                resizeMinWidht = namespace.Panel.prototype.s_minimumPanelSize;
            }
        }*/

        $(this.m_container.m_div[0]).resizable({alsoResize: "#" + $(this.m_container.m_div[0]).attr("id") + " .div_twic_control .twic_panel",
                                                aspectRatio: p_maintainAspectRatio,
                                                autoHide: true,
                                                minWidth: resizeMinWidth,
                                                minHeight: resizeMinHeight,
                                                maxWidth: this.m_level.m_size.width,
                                                maxHeight: this.m_level.m_size.height,
                                                handles: "n, s, e, w, nw, ne, sw, se",
                                                resize: function(){
                                                    this.OnResize(false);
                                                    this.m_level.m_resizeOccurred = true;
                                                }.bind(this)});
    });

    namespace.Panel.method("Maximize", function(){

        // Make sure to flag this panel as not hidden, in case maximizing from hidden state
        if ( this.m_hidden ){

            // Change the control bar text
            this.m_hidden = false;
            this.AddBarText(this.m_hidden);

            // Make sure panel rect is visible
            this.m_panelRectDiv.style("opacity", 1.0);
        }
        var transition = {
            size: { width: this.m_level.m_size.width,
                    height: this.m_level.m_size.height },
            duration: 1500
        };

        this.m_container.m_div.transition()
                              .duration(transition.duration)
                              .style("width", transition.size.width)
                              .style("height", transition.size.height)
                              .tween("maximize-components", function(){
                                  return function(){
                                      this.OnResize(false);
                                  }.bind(this);
                              }.bind(this))
                              .each("end", function(){
                                  this.m_level.OrganizePanels();
                              }.bind(this));
    });

    namespace.Panel.method("Minimize", function(){

        // Make sure to flag this panel as not hidden, in case minimizing from hidden state
        if ( this.m_hidden ){

            // Allow the panel to be resizable again
            this.ToggleResize(false);

            // Change the control bar text
            this.m_hidden = false;
            this.AddBarText(this.m_hidden);

            // Make sure panel rect is visible
            this.m_panelRectDiv.style("opacity", 1.0);
        }

        var transition = {
            size: { width: namespace.Panel.prototype.s_minimumPanelSize,
                    height: namespace.Panel.prototype.s_minimumPanelSize },
            duration: 1500
        };

        this.m_container.m_div.transition()
                              .duration(transition.duration)
                              .style("width", transition.size.width)
                              .style("height", transition.size.height)
                              .tween("minimize-components", function(){
                                  return function(){
                                      this.OnResize(false);
                                  }.bind(this);
                              }.bind(this))
                              .each("end", function(){
                                  this.m_level.OrganizePanels();
                              }.bind(this));
    });

    namespace.Panel.method("Move", function(p_transition, p_callbackTiming, p_callback){

        // Determine the traits of the given transition
        if ( p_transition.position ){
            this.m_container.SetPosition(p_transition.position);
        }
        if ( p_transition.size ) {
            this.m_container.SetSize(p_transition.size);
        }

        // NOTE: CSS max-width, max-height never changes

        // Container transitions to its position/dimensions
        this.m_container.m_div.transition()
                              .duration(p_transition.duration)
                              .style("left", this.m_container.m_coordinates.x)
                              .style("top", this.m_container.m_coordinates.y)
                              .style("width", this.m_container.m_size.width)
                              .style("height", this.m_container.m_size.height);

        // NOTE: Panels and control bars are relatively positioned in their parent container div

        // Panel and its svg transition to new position/dimensions
        this.m_div.transition().duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .style("height", this.m_size.height)
                               .each("start", function(p_transition, p_callbackTiming, p_callback){

                                   this.m_panelRectDiv.transition()
                                                      .duration(p_transition.duration)
                                                      .style("width", p_transition.size.width)
                                                      .style("height", p_transition.size.height - this.m_controlBar.m_size.height);
                                   this.m_panelRectSvg.transition()
                                                      .duration(p_transition.duration)
                                                      .attr("width", p_transition.size.width)
                                                      .attr("height", p_transition.size.height - this.m_controlBar.m_size.height)
                                                      .attr("viewBox", "0 0 " +
                                                                       p_transition.size.width + " " +
                                                                       (p_transition.size.height - this.m_controlBar.m_size.height));
                                   this.m_panelRect.transition()
                                                   .duration(p_transition.duration)
                                                   .attr("d", namespace.BottomRoundedRect(0, 0,
                                                                  p_transition.size.width,
                                                                  p_transition.size.height - this.m_controlBar.m_size.height,
                                                                  namespace.Panel.prototype.s_borderRadius));

                                   this.m_svg.transition()
                                             .duration(p_transition.duration)
                                             .attr("width", this.m_size.width)
                                             .attr("height", this.m_size.height)
                                             .each("end", function(){

                                                 if ( "end" == p_callbackTiming ){

                                                    p_callback();
                                                 }

                                             }.bind(this, p_callbackTiming, p_callback));

                                   if ( "start" == p_callbackTiming ){
                                       p_callback();
                                   }

                               }.bind(this, p_transition, p_callbackTiming, p_callback));

        // Control bar and its path (not svg) transition to new position/width
        this.m_controlBar.m_size.width = this.m_size.width;
        this.m_controlBar.m_div.transition()
                               .duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .each("start", function(p_transition){

                                   this.m_controlBar.m_barPath.transition()
                                                              .duration(p_transition.duration)
                                                              .attr("d", this.m_controlBar.GetRectPath());
                                   this.m_controlBar.m_svg.transition()
                                                          .duration(p_transition.duration)
                                                          .attr("width", this.m_size.width)
                                                          .attr("viewBox", "0 0 " + (this.m_size.width) + " " + this.m_controlBar.m_size.height);

                               }.bind(this, p_transition));
    });

    namespace.Panel.method("OnResize", function(p_packery){

        var packeryReorganize = true;
        if ( undefined !== p_packery ){
            packeryReorganize = p_packery;
        }

        var containerWidth = parseFloat(this.m_container.m_div.style("width"));
        var containerHeight = parseFloat(this.m_container.m_div.style("height"));
        var controlBarHeight = ( this.m_controlBar ) ? this.m_controlBar.m_size.height : 0;

        // Control bar resize
        if ( this.m_controlBar ){

            this.m_controlBar.m_size.width = containerWidth;
            this.m_controlBar.m_div.style("width", containerWidth);
            this.m_controlBar.m_svg.attr("width", containerWidth)
                                   .attr("viewBox", "0 0 " + containerWidth + " " + controlBarHeight);
        }

        // Panel resize (vars for potentially faster access to the dimension values)
        this.m_size.width = Math.abs(containerWidth);
        this.m_size.height = Math.abs(containerHeight - controlBarHeight);
        var divWidth = this.m_size.width;
        var divHeight = this.m_size.height;

        this.m_div.style("width", divWidth)
                  .style("height", divHeight);
        this.m_svg.attr("width", divWidth)
                  .attr("height", divHeight);

        // Panel rect resize
        this.m_panelRectDiv.style("width", divWidth)
                           .style("height", divHeight);
        this.m_panelRectSvg.attr("width", divWidth)
                           .attr("height", divHeight)
                           .attr("viewBox", "0 0 " + divWidth + " " + divHeight);

        if ( containerWidth > parseInt(this.m_div.style("max-width")) ) {
            this.m_div.style("max-width", containerWidth);
            this.m_panelRectDiv.style("max-width", containerWidth);
        }
        if ( containerHeight > parseInt(this.m_div.style("max-height") + controlBarHeight) ) {
            this.m_div.style("max-height", containerHeight - controlBarHeight);
            this.m_panelRectDiv.style("max-height", containerHeight - controlBarHeight);
        }

        this.m_panelRect.attr("d", namespace.BottomRoundedRect(0, 0, divWidth, divHeight,
                                                               namespace.Panel.prototype.s_borderRadius));

        // Re-append this container to the level div to bump up its z-order
        this.m_container.m_div.node().parentNode.appendChild(this.m_container.m_div.node());

        // Packery re-layout call
        if ( packeryReorganize ){
            $(this.m_level.m_div[0]).packery();
        }

        if ( this.m_controlBar ){
            this.m_controlBar.UpdateBarPath(this.m_controlBar.GetRectPath());
        }

        // Force level HTML redraw in order to overcome bug where SVG elements not resized until next redraw occurs
        $(this.m_level.m_div.node().parentNode).hide().show(0);
    });

    namespace.Panel.method("OpenUnderlyingPanel", function(p_data, p_coordinates, p_size){

        return null;
    });

    namespace.Panel.method("ReappendShapes", function(){

        var x = 0;
    });

    namespace.Panel.method("ToggleResize", function(p_enableResize){

        $(this.m_container.m_div[0]).resizable({ disabled: p_enableResize,
                                                 handles: "n, s, e, w, nw, ne, sw, se" });
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
    namespace.Panel.prototype.s_minimumPanelSize = 500;
    namespace.Panel.prototype.s_panelLevelBuffer = 50;


    // Base for TWiC graph view
    namespace.GraphView = function(p_coordinates, p_size, p_level){

        namespace.Panel.apply(this, arguments);

        this.m_largestShapeRadius = 16;
    };
    namespace.GraphView.inherits(namespace.Panel);

    namespace.GraphView.prototype.Collide = function(node){

        var shapePadding = 15;
        var r = node.radius + this.m_largestShapeRadius + shapePadding;
        var nx1 = node.x - r;
        var nx2 = node.x + r;
        var ny1 = node.y - r;
        var ny2 = node.y + r;

        return function(quad, x1, y1, x2, y2) {

            if ( quad.point && ( quad.point !== node ) ){

                var x = node.x - quad.point.x,
                    y = node.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = node.radius + quad.point.radius;

                if ( l < r ){

                    l = (l - r) / l * .5;
                    node.x -= x *= l;
                    node.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                }
            }

            return ( x1 > nx2 ||
                     x2 < nx1 ||
                     y1 > ny2 ||
                     y2 < ny1 );
        };
    };

    namespace.GraphView.prototype.MouseBehavior = function(p_panel, p_data, p_mouseEventType){

        // (1) Paused
        //   (A) Mouseover --> Nothing
        //   (B) Click --> Unpauses panel and linked panels --> Unhighlights all data shapes --> Shows panel data in Data Bar
        //   (C) Double-Click --> Mimics Click (B)
        //   (D) Mouseout --> Nothing
        // (2) Unpaused
        //   (A) Mouseover --> Nothing
        //   (B) Click --> Shows panel data in Data Bar
        //   (C) Double-Click --> Nothing
        //   (D) Mouseout --> Nothing

        // Paused
        if ( p_panel.IsPaused() ){

            switch ( p_mouseEventType ){

                // (A) Mouseover --> Nothing
                case namespace.Interaction.mouseover:

                    break;

                // (B) Click --> Unpauses panel and linked panels --> Unhighlights all data shapes --> Shows panel data in Data Bar
                case namespace.Interaction.click:
                // (C) Double-Click --> Mimics Click (B)
                case namespace.Interaction.dblclick:

                    p_panel.Pause(false);
                    p_panel.Update(null, namespace.Interaction.mouseover);
                    for ( var index = 0; index < p_panel.m_linkedViews.length; index++ ){

                        p_panel.m_linkedViews[index].panel.Pause(false);
                        p_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                    }

                    // Initial code for panel click to display panel information
                    //this.m_level.m_infoViews[1].Update({ shapeRef: p_panel }, namespace.Interaction.click);

                    break;

                // (D) Mouseout --> Nothing
                case namespace.Interaction.mouseout:

                    break;
            }

        // Unpaused
        } else {

            switch ( p_mouseEventType ){

                // (A) Mouseover --> Nothing
                case namespace.Interaction.mouseover:

                    break;

                // (B) Click --> Shows panel data in Data Bar
                case namespace.Interaction.click:
                // (C) Double-Click --> Mimics Click (B)
                case namespace.Interaction.dblclick:

                    // Initial code for panel click to display panel information
                    //this.m_level.m_infoViews[1].Update({ shapeRef: p_panel }, namespace.Interaction.click);

                    break;

                // (D) Mouseout --> Nothing
                case namespace.Interaction.mouseout:

                    break;
            }
        }
    };

    namespace.GraphView.prototype.s_datashapeClassName = "graph_shape";
    namespace.GraphView.prototype.s_datashapeClassSelect = ".graph_shape";
    namespace.GraphView.prototype.s_datashapeTextClassName = "graph_shape_text";
    namespace.GraphView.prototype.s_datashapeTextClassSelect = ".graph_shape_text";
    namespace.GraphView.prototype.s_linkDistanceMod = 100;


    // High level corpus view (TWiC.CorpusView)
    namespace.CorpusView = function(p_coordinates, p_size, p_level, p_radius, p_numberTopics){

        namespace.GraphView.apply(this, arguments);

        this.m_radius = p_radius;
        this.m_numberTopics = p_numberTopics;

        this.m_corpusCluster = null;
        this.m_nodes = [];
    };
    namespace.CorpusView.inherits(namespace.GraphView);

    namespace.CorpusView.method("Initialize", function(p_parentDiv){

        // Div and svg for panel rect (required because of resizing behavior inconsistent with scaling data shapes)
        // Control bar height is reduced by 1 to prevent pixel spacing between panel and control bar from dragging rounding-inaccuracy
        var controlBarHeight = ( this.m_controlBar ) ? this.m_controlBar.m_size.height - 1 : 0;

        // Add the div, svg, rectangle on top of which all graph data will sit
        this.m_panelRectDiv = p_parentDiv.append("div")
                                        .attr("class", "div_panel_rect")
                                        .attr("id", "div_panel_rect_" + this.m_name)
                                        .style("position", "absolute")
                                        .style("left", this.m_coordinates.x)
                                        .style("top", this.m_coordinates.y + controlBarHeight)
                                        .style("width", this.m_size.width)
                                        .style("height", this.m_size.height)
                                        .style("max-width", this.m_size.width)
                                        .style("max-height", this.m_size.height)
                                        .style("border-radius", namespace.Panel.prototype.s_borderRadius);
        this.m_panelRectSvg = this.m_panelRectDiv.append("svg")
                                                 .attr("x", this.m_coordinates.x)
                                                 .attr("y", this.m_coordinates.y)
                                                 .attr("width", this.m_size.width)
                                                 .attr("height", this.m_size.height)
                                                 .attr("viewBox", "0 0 " + this.m_size.width + " " + this.m_size.height);
        this.m_panelRect = this.m_panelRectSvg.append("path")
                                              .attr("d", namespace.BottomRoundedRect(0, 0, this.m_size.width,
                                                                                     this.m_size.height,
                                                                                     namespace.Panel.prototype.s_borderRadius))
                                              .attr("class", "rect_twic_graph")
                                              .attr("id", "rect_twic_graph_corpusview_" + this.m_name)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue);

        // Set up the corpus view's div for its graph data
        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_graph_corpusview div_twic_graph twic_panel")
                                .attr("id", "div_twic_graph_corpusview_" + this.m_name)
                                .style("max-width", this.m_size.width)
                                .style("max-height", this.m_size.height)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height)
                                .style("background", "transparent")
                                .style("border-radius", namespace.Panel.prototype.s_borderRadius)
                                .style("position", "absolute")
                                .style("left", this.m_coordinates.x)
                                .style("top", this.m_coordinates.y + controlBarHeight);

        // Set up the corpus view's svg
        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_graph")
                               .attr("id", "svg_twic_graph_corpusview_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height)
                               .attr("viewBox", "0 0 " + this.m_size.width + " " + this.m_size.height);

        // Add group and rectangle for trapping mouse events in the graph
        this.m_groupOverlay = this.m_svg.append("g")
                                        .attr("class","group_twic_graph_corpusview_overlay")
                                        .attr("id", "group_twic_graph_corpusview_overlay_" + this.m_name);

        // Transaprent rectangle to capture clicks outside of the corpus TWiC bullseye
        this.m_clickRectangle = this.m_groupOverlay.append("rect")
                                                   .attr("x", 0)
                                                   .attr("y", 0)
                                                   .attr("width", this.m_size.width)
                                                   .attr("height", this.m_size.height)
                                                   .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                                   .style("opacity", 0)
                                                   .on(namespace.Interaction.click, function(){
                                                       namespace.GraphView.prototype.MouseBehavior(this, null, namespace.Interaction.click);
                                                   }.bind(this));

        // Create the corpus TWiC bullseye
        this.m_corpusCluster = new TWiC.TopicBullseye({ x: this.m_size.width >> 1,
                                                        y: this.m_size.height - (this.m_size.height * 0.6) },
                                                      this.m_radius,
                                                      this.m_level.m_corpusMap["name"],
                                                      this.m_level,
                                                      this,
                                                      this.m_linkedViews,
                                                      this.m_numberTopics,
                                                      this.m_level.m_corpusMap["topics"],
                                                      this.m_level.m_corpusMap["name"],
                                                      true);

        // Add my text to the container's control bar
        this.AddBarText(false);
    });

    namespace.CorpusView.method("Start", function(p_parentDiv){

        // Add the single bullseye for the corpus view
        this.m_nodes.push({ index: 0, name: this.m_name });
        var node = this.m_groupOverlay.selectAll(".node")
                                      .data(this.m_nodes)
                                      .enter()
                                      .append("g")
                                      .attr("class", "node")
                                      .attr("id", function(d){return "node_" + d.index;})
                                      .attr("x", this.m_corpusCluster.m_coordinates.x)
                                      .attr("y", this.m_corpusCluster.m_coordinates.y)
                                      .style("position", "absolute");

        // Create the svg for this node
        this.m_corpusCluster.Draw(node, [this.m_name]);

        // Start with the bullseye highlighted
        this.HighlightAllDataShapes();

        // Add the title of the corpus as text for this TWiC bullseye
        this.m_corpusCluster.AddTextTag(this.m_corpusCluster.m_title, 14 + (0.2 * this.m_corpusCluster.m_radius),
                                        namespace.Level.prototype.s_palette.gold,
                                        {x:this.m_corpusCluster.m_coordinates.x - (1.7 * this.m_corpusCluster.m_radius),
                                         y:this.m_corpusCluster.m_coordinates.y + this.m_corpusCluster.m_radius + (0.30 * this.m_corpusCluster.m_radius)},
                                        1.0, this.m_groupOverlay);

        // Make all objects of this panel resizable and draggable
        this.MakeResizable(false);
        this.MakeDraggable();
    });

    namespace.CorpusView.method("Update", function(p_data, p_updateType){

        // Mouseover updates
        if ( namespace.Interaction.mouseover == p_updateType ){

            if ( !this.m_paused ) {

                if ( null != p_data ){
                    this.HighlightAllDataShapesWithTopic(p_data);
                } else {
                    this.HighlightAllDataShapes();
                }
            }
        } else if ( namespace.Interaction.dblclick == p_updateType ){

            // Double-clicks can come through, even if the CorpusView is paused

            // Tell the level to open the underlying panel (CorpusClusterView) if not open
            if ( !this.IsUnderlyingPanelOpen() ){

                this.Pause(false);
                this.Update({ topicID: this.m_level.m_highlightedTopic,
                              color: this.m_level.m_topicColors[this.m_level.m_highlightedTopic] },
                            namespace.Interaction.mouseover);
                this.Pause(true);
                this.m_level.m_infoViews[0].m_panel.Pause(true);
                this.m_level.Update(p_data, p_updateType);
            }
        }
    });

    namespace.CorpusView.method("AddBarText", function(p_altText){

        this.m_controlBar.AddText(function(p_controlBar){

            if ( p_controlBar.m_barText ){
                p_controlBar.m_barText.selectAll("*").remove();
            }

            if ( !this.m_textFirstSet ){
                this.m_textPos = { x: p_controlBar.GetNextWidgetPos().x, y: p_controlBar.GetNextWidgetPos().y };
                this.m_textFirstSet = true;
            }

            if ( !p_altText ){

                p_controlBar.m_barText = p_controlBar.m_controlGroup.append("text")
                                                                    .attr("x", this.m_textPos.x)
                                                                    .attr("y", this.m_textPos.y);

                p_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                      .style("opacity", 1.0);

                p_controlBar.m_barText.append("tspan")
                                      .html("TWiC:&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);

                p_controlBar.m_barText.append("tspan")
                                      .html("Top&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.gold)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);

                // NOTE: Topic count is currently hard-coded, TODO: parametrize
                p_controlBar.m_barText.append("tspan")
                                      .html(10)
                                      .attr("fill", namespace.Level.prototype.s_palette.green)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 28);

                p_controlBar.m_barText.append("tspan")
                                      .html("&nbsp;topics in&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.gold)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);

                p_controlBar.m_barText.append("tspan")
                                      .html(this.m_level.m_corpusMap["name"])
                                      .attr("fill", namespace.Level.prototype.s_palette.lightblue)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);

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
                                               .on(namespace.Interaction.mouseout, myTip.hide);*/
            } else {

                p_controlBar.m_barText = p_controlBar.m_controlGroup.append("text")
                                                                    .attr("x", this.m_textPos.x)
                                                                    .attr("y", this.m_textPos.y);

                p_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                      .style("opacity", 1.0);

                p_controlBar.m_barText.append("tspan")
                                      .html("TWiC:&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);

                p_controlBar.m_barText.append("tspan")
                                      .html("Corpus View")
                                      .attr("fill", namespace.Level.prototype.s_palette.gold)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);
            }

        }.bind(this));
    });

    namespace.CorpusView.method("DarkenAllDataShapes", function(){

        // Darken all shapes
        this.m_svg.selectAll(TWiC.CorpusView.prototype.s_datashapeClassSelect)
                  .style("fill", function(d){ return d.locolor; })
                  .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
    });

    namespace.CorpusView.method("HighlightAllDataShapes", function(){

        // Reset saved topic highlight ID
        this.m_level.m_highlightedTopic = -1;

        // Highlight all shapes
        this.m_svg.selectAll(TWiC.CorpusView.prototype.s_datashapeClassSelect)
                  .style("opacity", 1.0)
                  .style("fill", function(d){ return d.color; });
    });

    namespace.CorpusView.method("HighlightAllDataShapesWithTopic", function(p_data){

        // Save the highlighted topic for future reference
        this.m_level.m_highlightedTopic = p_data.topicID;

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

    namespace.CorpusView.method("Move", function(p_transition, p_callbackTiming, p_callback){

        // Determine the traits of the given transition
        if ( p_transition.position ){
            this.m_container.SetPosition(p_transition.position);
        }
        if ( p_transition.size ) {
            this.m_container.SetSize(p_transition.size);
        }

        // NOTE: CSS max-width, max-height never changes

        // Container transitions to its position/dimensions
        this.m_container.m_div.transition()
                              .duration(p_transition.duration)
                              .style("left", this.m_container.m_coordinates.x)
                              .style("top", this.m_container.m_coordinates.y)
                              .style("width", this.m_container.m_size.width)
                              .style("height", this.m_container.m_size.height);

        // NOTE: Panels and control bars are relatively positioned in their parent container div

        // Panel and its svg transition to new position/dimensions
        this.m_div.transition().duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .style("height", this.m_size.height)
                               .each("start", function(p_transition, p_callbackTiming, p_callback){

                                   this.m_panelRectDiv.transition()
                                                      .duration(p_transition.duration)
                                                      .style("width", p_transition.size.width)
                                                      .style("height", p_transition.size.height - this.m_controlBar.m_size.height);
                                   this.m_panelRectSvg.transition()
                                                      .duration(p_transition.duration)
                                                      .attr("width", p_transition.size.width)
                                                      .attr("height", p_transition.size.height - this.m_controlBar.m_size.height)
                                                      .attr("viewBox", "0 0 " +
                                                                       p_transition.size.width + " " +
                                                                       (p_transition.size.height - this.m_controlBar.m_size.height));
                                   this.m_panelRect.transition()
                                                   .duration(p_transition.duration)
                                                   .attr("d", namespace.BottomRoundedRect(0, 0,
                                                                  p_transition.size.width,
                                                                  p_transition.size.height - this.m_controlBar.m_size.height,
                                                                  namespace.Panel.prototype.s_borderRadius));

                                   this.m_svg.transition()
                                             .duration(p_transition.duration)
                                             .attr("width", this.m_size.width)
                                             .attr("height", this.m_size.height)
                                             .each("end", function(p_callbackTiming, p_callback){

                                                 if ( "end" == p_callbackTiming ){
                                                    p_callback();
                                                 }

                                             }.bind(this, p_callbackTiming, p_callback));

                                   if ( "start" == p_callbackTiming ){
                                       p_callback();
                                   }

                               }.bind(this, p_transition, p_callbackTiming, p_callback));

        // Control bar and its path (not svg) transition to new position/width
        this.m_controlBar.m_size.width = this.m_size.width;
        this.m_controlBar.m_div.transition()
                               .duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .each("start", function(p_transition){

                                   this.m_controlBar.m_barPath.transition()
                                                              .duration(p_transition.duration)
                                                              .attr("d", this.m_controlBar.GetRectPath());
                                   this.m_controlBar.m_svg.transition()
                                                          .duration(p_transition.duration)
                                                          .attr("width", this.m_size.width)
                                                          .attr("viewBox", "0 0 " + (this.m_size.width) + " " + this.m_controlBar.m_size.height);

                               }.bind(this, p_transition));
    });

    namespace.CorpusView.method("OpenUnderlyingPanel", function(p_data, p_coordinates, p_size){

        // Create new CorpusClusterView panel
        var corpusClusterView = new namespace.CorpusClusterView({ x: p_coordinates.x, y: p_coordinates.y },
                                                                { width: p_size.width, height: p_size.height },
                                                                this.m_level);

        // Link the CorpusClusterView to all open information views via mouseover
        for ( var index = 0; index < this.m_linkedViews.length; index++ ){

            if ( this.m_linkedViews[index].panel instanceof namespace.InformationView &&
                 namespace.Interaction.mouseover == this.m_linkedViews[index].update ){
                corpusClusterView.AddLinkedView(this.m_linkedViews[index].panel, namespace.Interaction.mouseover);
            }
        }

        // Link the CorpusView and CorpusClusterView panels via mouseover
        this.AddLinkedView(corpusClusterView, namespace.Interaction.mouseover);
        corpusClusterView.AddLinkedView(this, namespace.Interaction.mouseover);

        // Link the TopicBar and DataBar to the CorpusClusterView via click
        this.m_level.m_infoViews[0].m_panel.AddLinkedView(corpusClusterView, namespace.Interaction.click);
        this.m_level.m_infoViews[1].m_panel.AddLinkedView(corpusClusterView, namespace.Interaction.click);
        this.m_level.m_infoViews[1].m_panel.AddLinkedView(corpusClusterView, namespace.Interaction.mouseover);

        // Initialize and Start the CorpusClusterView
        corpusClusterView.m_container.Initialize(this.m_level.m_div);

        // Fake transition to allow for loading of data time buffer (NOTE: Does this work?)
        corpusClusterView.m_container.m_div.transition().delay(100).style("top", corpusClusterView.m_container.m_div.style("top"));
        corpusClusterView.m_container.Start();
        corpusClusterView.m_div.style("opacity", 0.0);
        corpusClusterView.m_controlBar.m_div.style("opacity", 0.0);
        corpusClusterView.m_panelRectDiv.style("opacity", 0.0);

        corpusClusterView.m_div.transition().delay(500).duration(3000).style("opacity", 1.0);
        corpusClusterView.m_controlBar.m_div.transition()
                                            .delay(500).duration(3000)
                                            .style("opacity", 1.0);
        corpusClusterView.m_panelRectDiv.transition()
                                        .delay(500).duration(3000)
                                        .style("opacity", 1.0);
        corpusClusterView.Pause(true);

        // Indicate that the underlying panel for CorpusView has now been opened
        this.m_underlyingPanelOpen = true;
    });

    namespace.CorpusView.prototype.s_datashapeClassName = "corpus_shape";
    namespace.CorpusView.prototype.s_datashapeClassSelect = ".corpus_shape";
    namespace.CorpusView.prototype.s_datashapeTextClassName = "corpus_shape_text";
    namespace.CorpusView.prototype.s_datashapeTextClassSelect = ".corpus_shape_text";


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
    };
    namespace.CorpusClusterView.inherits(namespace.GraphView);

    namespace.CorpusClusterView.method("Initialize", function(p_parentDiv){

        this.m_container.SetPosition(this.m_coordinates);
        this.m_container.m_div.style("left", this.m_container.m_coordinates.x);
        this.m_container.m_div.style("top", this.m_container.m_coordinates.y);

        this.m_coordinates.x = 0;
        this.m_coordinates.y = 0;

        // Div and svg for panel rect (required because of resizing behavior inconsistent with scaling data shapes)
        var controlBarHeight = ( this.m_controlBar ) ? this.m_controlBar.m_size.height - 1 : 0;
        this.m_panelRectDiv = p_parentDiv.append("div")
                                        .attr("class", "div_panel_rect")
                                        .attr("id", "div_panel_rect_" + this.m_name)
                                        .style("position", "absolute")
                                        .style("left", this.m_coordinates.x)
                                        .style("top", this.m_coordinates.y + controlBarHeight)
                                        .style("width", this.m_size.width)
                                        .style("height", this.m_size.height)
                                        .style("max-width", this.m_size.width)
                                        .style("max-height", this.m_size.height)
                                        .style("border-radius", namespace.Panel.prototype.s_borderRadius);

        this.m_panelRectSvg = this.m_panelRectDiv.append("svg")
                                                 .attr("x", this.m_coordinates.x)
                                                 .attr("y", this.m_coordinates.y)
                                                 .attr("width", this.m_size.width)
                                                 .attr("height", this.m_size.height)
                                                 .attr("viewBox", "0 0 " + this.m_size.width + " " + this.m_size.height);

        // Add the rectangle where all graph data will sit
        this.m_panelRect = this.m_panelRectSvg.append("path")
                                              .attr("d", namespace.BottomRoundedRect(this.m_coordinates.x,
                                                                                     this.m_coordinates.y,
                                                                                     this.m_size.width,
                                                                                     this.m_size.height,
                                                                                     namespace.Panel.prototype.s_borderRadius))
                                              .attr("class", "rect_twic_graph")
                                              .attr("id", "rect_twic_graph_corpusclusterview_" + this.m_name)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue);

        // Set up the div for the corpus cluster view
        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_graph_corpusclusterview div_twic_graph twic_panel")
                                .attr("id", "div_twic_graph_corpusclusterview_" + this.m_name)
                                .style("max-width", this.m_size.width)
                                .style("max-height", this.m_size.height)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height)
                                .style("border-radius", namespace.Panel.prototype.s_borderRadius)
                                .style("position", "absolute")
                                .style("left", this.m_coordinates.x)
                                .style("top", this.m_coordinates.y + controlBarHeight);

        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_graph")
                               .attr("id", "svg_twic_graph_corpusclusterview_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height)
                               .attr("viewBox", "-50 -50 " + (this.m_size.width + 100) + " " + (this.m_size.height + 100));

        // Add group and rectangle for trapping mouse events in the graph
        this.m_groupOverlay = this.m_svg.append("g")
                                        .attr("class","group_twic_graph_corpusclusterview_overlay")
                                        .attr("id", "group_twic_graph_corpusclusterview_overlay_" + this.m_name);

        // Transaprent rectangle to capture clicks outside of the TWiC cluster bullseyes
        this.m_clickRectangle = this.m_groupOverlay.append("rect")
                                                   .attr("x", -87)
                                                   .attr("y", -50)
                                                   .attr("width", this.m_size.width + 175)
                                                   .attr("height", this.m_size.height + 100)
                                                   .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                                   .style("opacity", 0)
                                                   .style("position", "absolute")
                                                   .on(namespace.Interaction.click, function(){
                                                       namespace.GraphView.prototype.MouseBehavior(this, null, namespace.Interaction.click);
                                                   }.bind(this));


        // Add search bar to the corpus cluster view's control bar
        //this.m_controlBar.AddSearch();

        // Initialize the graph with TWiC bullseye nodes for a force-directed layout
        this.InitializeGraph();
    });

    namespace.CorpusClusterView.method("InitializeGraph", function(){

        var twic_objects = [];
        var twic_cluster_json_list = [];
        var clusterCount = Object.keys(this.m_level.m_corpusMap["children"]).length;

        // Initial radius before scaling is the average available space in the panel for each shape,
        // and then halved to retain spacing between clusters for better viz.
        var avgDataShapeRadius = Math.sqrt((1.0 / Math.PI) * ((this.m_size.width * this.m_size.height) / clusterCount));
        avgDataShapeRadius >>= 1;

        // Distance to ideal normalization via corpus map JSON data
        var avg = 0.0;
        for ( var index = 0; index < clusterCount; index++ ){
            avg += this.m_level.m_corpusMap["children"][index]["dist2avg"];
        }
        avg /= Object.keys(this.m_level.m_corpusMap["children"]).length;

        // Node zero for the force-directed graph will be a cluster circle representing
        // the average topic distribution for this cluster
        this.m_rootIndex = 0;
        this.m_nodes.push({"index": this.m_rootIndex, "name": "", "radius": avgDataShapeRadius});

        // Top N topics of this node
        var topTopics = [];
        var topTopicCount = 10;
        for ( var index = 0; index < topTopicCount; index++ ) { topTopics.push([]) };
        var topTopicID = "";
        for ( var topic in this.m_level.m_corpusMap["topics"] ){
            if ( this.m_level.m_corpusMap["topics"][topic][0] < topTopicCount + 1){
                topTopics[this.m_level.m_corpusMap["topics"][topic][0] - 1] = [topic, this.m_level.m_corpusMap["topics"][topic][1]];
            }
        }

        var centralNode = new TWiC.TopicBullseye({ x: 0, y: 0 },
                                                 avgDataShapeRadius,
                                                 namespace.CorpusClusterView.prototype.s_infoFlavorText,
                                                 this.m_level,
                                                 this,
                                                 this.m_linkedViews,
                                                 topTopicCount,
                                                 this.m_level.m_corpusMap["topics"],
                                                 this.m_nodes[0]["name"],
                                                 true);
        centralNode.SetScaledRadius(true);
        centralNode.m_allowDblclick = false;
        this.m_twicObjects.push(centralNode);
        this.m_nodes[0].radius = centralNode.m_size;

        // Determine how to scale distance to fit current panel space (all distances inflated by node zero radius to avoid collision)
        this.m_linkDistLimits = { min: this.m_level.m_corpusMap["children"][0]["dist2avg"] + this.m_nodes[0].radius,
                                  max: this.m_level.m_corpusMap["children"][0]["dist2avg"] + this.m_nodes[0].radius };
        for ( var index = 1; index < clusterCount; index++ ){
            this.m_linkDistLimits.min = Math.min(this.m_linkDistLimits.min, this.m_level.m_corpusMap["children"][index]["dist2avg"] + this.m_nodes[0].radius);
            this.m_linkDistLimits.max = Math.max(this.m_linkDistLimits.max, this.m_level.m_corpusMap["children"][index]["dist2avg"] + this.m_nodes[0].radius);
        }
        this.b_adjustDistances = ( this.m_linkDistLimits.min < 0 );
        var longestPanelDist = Math.min(this.m_size.width, this.m_size.height);
        this.m_adjustedDistances = [];
        for ( var index = 0; index < clusterCount; index++ ){
            var adjDistance = this.m_level.m_corpusMap["children"][index]["dist2avg"];
            if ( this.b_adjustDistances ){
                adjDistance += this.m_linkDistLimits.min;
            }
            this.m_adjustedDistances.push(adjDistance);
        }

        // Subtract min from distances and convert to scale of 1-100
        var linkLimitScaleFactor = 100.0 / (this.m_linkDistLimits.max - this.m_linkDistLimits.min);
        for ( var index = 0; index < this.m_adjustedDistances.length; index++ ){
            this.m_adjustedDistances[index] -= this.m_linkDistLimits.min;
            this.m_adjustedDistances[index] *= linkLimitScaleFactor;
        }

        // Build all clusters
        var linkDilation = 80;
        for ( var index = 0; index < clusterCount; index++ ){

            var twic_cluster = new TWiC.TopicBullseye({ x: 0, y: 0 },
                                                      avgDataShapeRadius,
                                                      this.m_level.m_corpusMap["children"][index]["name"],
                                                      this.m_level,
                                                      this,
                                                      this.m_linkedViews,
                                                      10,
                                                      this.m_level.m_corpusMap["children"][index]["topics"],
                                                      index.toString(),
                                                      false);

            // Cluster circles are scaled in the CorpusClusterView
            twic_cluster.SetScaledRadius(true);

            var twic_cluster_json = {
                "name": this.m_level.m_corpusMap["children"][index]["name"],
                //"dist2avg": 2 + Math.abs((this.m_level.m_corpusMap["children"][index]["dist2avg"] - avg) * linkDilation),
                //"dist2avg": (this.m_adjustedDistances[index] * longestPanelDist) / this.m_linkDistLimits.max,
                "dist2avg": (this.m_adjustedDistances[index] * longestPanelDist) / 100.0,
                "topics": this.m_level.m_corpusMap["children"][index]["topics"],
                "children": []
            };

            this.m_objectsJSON.push(twic_cluster_json);
            this.m_twicObjects.push(twic_cluster);
        }

        // Establish the rest of the nodes and edges for the force-directed graph
        for ( var index = 1; index <= this.m_objectsJSON.length; index++ ){

            this.m_nodes.push({"index": index, "name": this.m_objectsJSON[index - 1]["name"]});
            this.m_links.push({
                "source": index,
                "target": this.m_rootIndex,
                "value": this.m_objectsJSON[index - 1]["dist2avg"]
            });
        }

        // Set up the force-directed graph
        this.m_graph = d3.layout.force()
                                .nodes(this.m_nodes)
                                .links(this.m_links)
                                .size([this.m_size.width, this.m_size.height])
                                .charge(function(d){
                                    return -5 * d.radius;
                                })
                                .gravity(0.06)
                                .linkDistance(function(d){ return d.value; })
                                .on("end", function(){ this.m_graph.stop(); }.bind(this));
    });

    namespace.CorpusClusterView.method("InitializeGraph_ArchimedeanSpiral", function(){

        // Calculate the world

        // Set up the SVG

        // Set up the TopicBullseyes

        // Sort them by dist2avg

        // Function arguments needed: svg, data, circleMax, padding, steps
        //this.ArchimedeanSpiral(this.m_svg, [], )
    });

    namespace.CorpusClusterView.method("ReappendShapes", function(){

        for ( var index = 0; index < this.m_twicObjects.length; index++ ){
            this.m_twicObjects[index].ReappendShape();
        }
    });

    namespace.CorpusClusterView.method("Start", function(){

        // Add lines for the links and bind the link data to them
        var links = this.m_groupOverlay.selectAll(".link")
                                       .data(this.m_links)
                                       .enter()
                                       .append("line")
                                       .attr("class", "link")
                                       .attr("id", function(d){ return "link" + (d.source - 1); })
                                       .style("stroke-width", 0.5)
                                       .style("stroke", namespace.Level.prototype.s_palette.lightgray)
                                       .style("opacity", TWiC.DataShape.s_semihighlightedOpacity);

        // Save the TWiC datashape's radius to the graph node (for graph/collision usage)
        for ( index = 1; index < this.m_twicObjects.length; index++ ) {
            for ( var index2 = 1; index2 < this.m_nodes.length; index2++ ){
                if ( (parseInt(this.m_twicObjects[index].m_name) + 1) == this.m_nodes[index2]["index"] ){
                    this.m_nodes[index2].radius = this.m_twicObjects[index].m_size;
                    break;
                }
            }
        }

        // NOTE: force.drag call should be on svg parent,
        // like it is here on the top group for this TWiC rectangle
        var nodes = this.m_groupOverlay.selectAll(".node")
                                       .data(this.m_nodes)
                                       .enter()
                                       .append("g")
                                       .attr("class", "node")
                                       .style("position", "absolute")
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

        // Draw the central node
        this.m_twicObjects[0].Draw(this.m_groupOverlay.select(".node#node_0"), []);
        this.m_twicObjects[0].AddTextTag("", 20, namespace.Level.prototype.s_palette.gold,
                                         { x: this.m_twicObjects[0].m_coordinates.x,
                                           y: this.m_twicObjects[0].m_coordinates.y },
                                         0.0);
        if ( this.m_twicObjects[0].m_size > this.m_largestShapeRadius ){
            this.m_largestShapeRadius = this.m_twicObjects[0].m_size;
        }

        // Append TWiC object svg elements to the nodes with corresponding bound data
        for ( index = 1; index < this.m_twicObjects.length; index++ ) {

            for ( var index2 = 1; index2 < this.m_nodes.length; index2++ ){

                if ( this.m_twicObjects[index].m_name == this.m_nodes[index2]["name"] ){

                    var children = this.m_objectsJSON[index - 1].children;
                    this.m_twicObjects[index].Draw(this.m_groupOverlay.select(".node#node_" + index2), children);
                    var textColor = this.m_level.m_topicColors[index - 1];
                    this.m_twicObjects[index].AddTextTag(this.m_nodes[index2]["name"].toString(),
                                                         20,
                                                         textColor,
                                                         { x: this.m_twicObjects[index].m_coordinates.x - ((7 * index.toString().length) >> 1),
                                                           y: this.m_twicObjects[index].m_coordinates.y + (1.6 * this.m_twicObjects[index].m_radius) },
                                                         1.0);
                    if ( this.m_twicObjects[index].m_size > this.m_largestShapeRadius ){
                        this.m_largestShapeRadius = this.m_twicObjects[index].m_size;
                    }
                }
            }
        }

        // Add tick function for graph corresponding to object type
        setTimeout(function(){
            this.m_graph.start();
            for ( var index = 0; index < 1000; index++ ){
                this.Tick();
            }
            this.m_graph.stop();
            this.b_positionsCalculated = true;
        }.bind(this), 10);

        // Normal graph start
        //this.m_graph.on("tick", function(){ this.Tick(); }.bind(this));
        //this.m_graph.start();

        // Add my text to the container's control bar
        this.AddBarText(false);

        // Make all objects of this panel resizable and draggable
        this.MakeResizable(false);
        this.MakeDraggable();
    });

    namespace.CorpusClusterView.method("Update", function(p_data, p_updateType){

        if ( !this.m_paused ) {

            if ( namespace.Interaction.dblclick == p_updateType ){

                if ( !this.IsUnderlyingPanelOpen() ){
                   this.m_level.Update(p_data, p_updateType);
                } else {
                    for ( var index = 0; index < this.m_linkedViews.length; index++ ) {

                        if ( namespace.Interaction.dblclick == this.m_linkedViews[index].update ) {
                            this.m_linkedViews[index].panel.Pause(false);
                            this.m_linkedViews[index].panel.Update({ topicID: p_data.m_name}, p_updateType);
                            this.m_linkedViews[index].panel.Pause(true);
                        }
                    }
                }
            } else if ( namespace.Interaction.mouseover == p_updateType ) {

                if ( null != p_data ){
                    this.HighlightAllDataShapesWithTopic(p_data);
                } else {
                    this.HighlightAllDataShapes();
                }
            }
        } else {

            // If the panel is paused, but a cluster circle is double clicked,
            // unpause the panel and pass the double click to linked panels
            if ( namespace.Interaction.dblclick == p_updateType ){

                // Tell the level to open the underlying panel (TextClusterView) if not open
                if ( !this.IsUnderlyingPanelOpen() ){
                   this.m_level.Update(p_data, p_updateType);
                } else {

                    // Pass the double click to linked panels
                    for ( var index = 0; index < this.m_linkedViews.length; index++ ) {

                        if ( namespace.Interaction.dblclick == this.m_linkedViews[index].update ) {

                            this.m_linkedViews[index].panel.Pause(false);
                            this.m_linkedViews[index].panel.Update({ topicID: p_data.m_name }, p_updateType);
                            this.m_linkedViews[index].panel.Pause(true);
                        }
                    }
                }
            }
        }
    });

    namespace.CorpusClusterView.method("AddBarText", function(p_altText){

        this.m_controlBar.AddText(function(p_controlBar){

            if ( p_controlBar.m_barText ){
                p_controlBar.m_barText.selectAll("*").remove();
            }

            if ( !this.m_textFirstSet ){
                this.m_textPos = { x: p_controlBar.GetNextWidgetPos().x, y: p_controlBar.GetNextWidgetPos().y };
                this.m_textFirstSet = true;
            }

            if ( !p_altText ){

                p_controlBar.m_barText = p_controlBar.m_controlGroup.append("text")
                                                        .attr("x", this.m_textPos.x)
                                                        .attr("y", this.m_textPos.y);

                p_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                      .style("opacity", 1.0);

                p_controlBar.m_barText.append("tspan")
                                      .html("TWiC:&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);

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
                                               .on(namespace.Interaction.mouseout, myTip.hide);*/
            } else {

                p_controlBar.m_barText = p_controlBar.m_controlGroup.append("text")
                                                        .attr("x", this.m_textPos.x)
                                                        .attr("y", this.m_textPos.y);

                p_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                      .style("opacity", 1.0);

                p_controlBar.m_barText.append("tspan")
                                      .html("TWiC:&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);

                p_controlBar.m_barText.append("tspan")
                                      .html("Corpus Cluster View")
                                      .attr("fill", namespace.Level.prototype.s_palette.gold)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);
            }
        }.bind(this));
    });

    // Original implementation of D3 archimedean spiral with circle nodes:
    // http://stackoverflow.com/questions/27596115/finding-x-y-coordinates-of-a-point-on-an-archimedean-spiral
    namespace.CorpusClusterView.method("ArchimedeanSpiral", function(data, circleMax, padding, steps){

        // Create the spiral based on the ordered TopicBullseyes
        var d = circleMax + padding;
        var arcAxis = [];
        var angle = 0;

        for ( var index = 0; index < steps; index++){

            var radius = Math.sqrt(index + 1);

            //sin(angle) = opposite/hypothenuse => used asin to get angle
            angle += Math.asin(1 / radius);
            var x = Math.cos(angle) * (radius * d);
            var y = Math.sin(angle)*(radius * d);

            arcAxis.push({"x": x,"y": y})
        }

        var lineFunction = d3.svg.line()
            .x(function(d) { return this.m_size.width + d.x; }.bind(this))
            .y(function(d) { return this.m_size.height + d.y; }.bind(this))
            .interpolate("cardinal");

        this.m_svg.append("path")
            .attr("d", lineFunction(arcAxis))
            .attr("stroke", "gray")
            .attr("stroke-width", 5)
            .attr("fill", "none");

        var circles = this.m_svg.selectAll("circle")
            .data(arcAxis)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return this.m_size.width + d.x; }.bind(this))
            .attr("cy", function (d) { return this.m_size.height + d.y; }.bind(this))
            .attr("r", 10);

        return arcAxis;
    });

    namespace.CorpusClusterView.method("DarkenAllDataShapes", function(){

        // Darken all shapes
        var allShapes = this.m_svg.selectAll(TWiC.CorpusClusterView.prototype.s_datashapeClassSelect)
                                  .style("fill", function(d){ return d.locolor; })
                                  .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);

        // Darken all inner text rectangles
        this.m_svg.selectAll(".text_info_rect")
                  .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity)
                  .style("stroke-opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);

        // Darken all text
        this.m_svg.selectAll(TWiC.CorpusClusterView.prototype.s_datashapeTextClassSelect)
                  .selectAll("tspan")
                  .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);

        // Darken all graph links
        this.m_svg.selectAll(".link").style("opacity", TWiC.DataShape.prototype.s_unhighlightedOpacity)
                                     .style("stroke", namespace.Level.prototype.s_palette.link)
                                     .style("stroke-width", 0.5);
    });

    namespace.CorpusClusterView.method("HighlightAllDataShapes", function(){

        // Reset saved topic highlight ID
        this.m_level.m_highlightedTopic = -1;

        // Highlight all shapes
        this.m_svg.selectAll(TWiC.CorpusClusterView.prototype.s_datashapeClassSelect)
                  .style("opacity", 1.0)
                  .style("fill", function(d){ return d.color; });

        // Highlight all inner text rectangles
        //this.m_svg.selectAll(".text_info_rect")
        //this.m_svg.selectAll(".topicbullseye_text")
        this.m_svg.selectAll(TWiC.CorpusClusterView.prototype.s_datashapeTextClassSelect)
                  .style("opacity", 1.0)
                  .style("stroke-opacity", /*TWiC.DataShape.prototype.s_semihighlightedOpacity*/1.0);

        // Highlight all text
        this.m_svg.selectAll(TWiC.CorpusClusterView.prototype.s_datashapeTextClassSelect)
                  .selectAll("tspan")
                  .style("opacity", 1.0);

        // Highlight all graph links
        this.m_svg.selectAll(".link").style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity + 0.3)
                                     .style("stroke", namespace.Level.prototype.s_palette.link)
                                     .style("stroke-width", 0.5);
    });

    namespace.CorpusClusterView.method("HighlightAllDataShapesWithTopic", function(p_data){

        // Start with all shapes darkened
        this.DarkenAllDataShapes();

        // Save the highlighted topic for future reference
        this.m_level.m_highlightedTopic = p_data.topicID;

        // Color all shapes that represent the given topic
        var filteredShapes = this.m_svg.selectAll(TWiC.CorpusClusterView.prototype.s_datashapeClassSelect)
                                        .filter(function(d){ return d.topicID == p_data.topicID; })
                                        .style("fill", p_data.color)
                                        .style("opacity", 1.0);

        // Darken all shapes that don't represent the given topic
        var darkShapes = this.m_svg.selectAll(TWiC.CorpusClusterView.prototype.s_datashapeClassSelect)
                  .filter(function(d){ return d.topicID != p_data.topicID; })
                  .style("fill", function(d){ return d.locolor; })
                  .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
        darkShapes.each(function(d){
            d3.select(this.parentNode)
              .selectAll("tspan")
              .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
        });

        // Raise the opacity of all shapes and text in the highlighted datashape
        filteredShapes.each(function(d){

            if ( d.topicID != p_data.topicID && d.shapeRef.m_textRect.classed("text_info_rect") ){
                d.shapeRef.m_textRect.style("opacity", 1.0)
                                     .style("stroke-opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
            }

            d3.select(this.parentNode)
              .selectAll(TWiC.CorpusClusterView.prototype.s_datashapeClassSelect)
              .filter(function(d){return d.topicID != p_data.topicID; })
              .style("opacity", 1.0)
              .style("fill", function(d){return d.locolor; });

            d3.select(this.parentNode)
              .selectAll("tspan")
              .style("opacity", 1.0);

            // Highlight the graph link corresponding to this shape
            if ( !isNaN(parseInt(d.shapeRef.m_name)) ){
                d.shapeRef.m_panel.m_svg.selectAll("line#link" + d.shapeRef.m_name)
                                        .style("opacity", 1.0)
                                        .style("stroke", d.shapeRef.m_panel.m_level.m_topicColors[d.shapeRef.m_name])
                                        .style("stroke-width", 1.0);
            }
        });

        // Highlight any inner rectangles matching the topic ID
        this.m_svg.selectAll(".text_info_rect")
                  .filter(function(d){ return d.topicID == p_data.topicID; })
                  .style("opacity", 1.0)
                  .style("stroke-opacity", 1.0);
    });

    namespace.CorpusClusterView.method("Move", function(p_transition, p_callbackTiming, p_callback){

        // Determine the traits of the given transition
        if ( p_transition.position ){
            this.m_container.SetPosition(p_transition.position);
        }
        if ( p_transition.size ) {
            this.m_container.SetSize(p_transition.size);
        }

        // NOTE: CSS max-width, max-height never changes

        // Container transitions to its position/dimensions
        this.m_container.m_div.transition()
                              .duration(p_transition.duration)
                              .style("left", this.m_container.m_coordinates.x)
                              .style("top", this.m_container.m_coordinates.y)
                              .style("width", this.m_container.m_size.width)
                              .style("height", this.m_container.m_size.height);

        // NOTE: Panels and control bars are relatively positioned in their parent container div

        // Panel and its svg transition to new position/dimensions
        this.m_div.transition().duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .style("height", this.m_size.height)
                               .each("start", function(p_transition, p_callbackTiming, p_callback){

                                   this.m_panelRectDiv.transition()
                                                      .duration(p_transition.duration)
                                                      .style("width", p_transition.size.width)
                                                      .style("height", p_transition.size.height - this.m_controlBar.m_size.height);
                                   this.m_panelRectSvg.transition()
                                                      .duration(p_transition.duration)
                                                      .attr("width", p_transition.size.width)
                                                      .attr("height", p_transition.size.height - this.m_controlBar.m_size.height)
                                                      .attr("viewBox", "0 0 " +
                                                                       p_transition.size.width + " " +
                                                                       (p_transition.size.height - this.m_controlBar.m_size.height));
                                    this.m_panelRect.transition()
                                                    .duration(p_transition.duration)
                                                    .attr("d", namespace.BottomRoundedRect(0,
                                                               0,
                                                               p_transition.size.width,
                                                               p_transition.size.height - this.m_controlBar.m_size.height,
                                                               namespace.Panel.prototype.s_borderRadius));

                                   this.m_svg.transition()
                                             .duration(p_transition.duration)
                                             .attr("width", this.m_size.width)
                                             .attr("height", this.m_size.height)
                                             .each("end", function(){

                                                 if ( "end" == p_callbackTiming ){
                                                    p_callback();
                                                 }
                                             }.bind(this, p_callbackTiming, p_callback));

                                   if ( "start" == p_callbackTiming ){
                                       p_callback();
                                   }

                               }.bind(this, p_transition, p_callbackTiming, p_callback));

        // Control bar and its path (not svg) transition to new position/width
        this.m_controlBar.m_size.width = this.m_size.width;
        this.m_controlBar.m_div.transition()
                               .duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .each("start", function(p_transition){

                                   this.m_controlBar.m_barPath.transition()
                                                              .duration(p_transition.duration)
                                                              .attr("d", this.m_controlBar.GetRectPath());
                                   this.m_controlBar.m_svg.transition()
                                                          .duration(p_transition.duration)
                                                          .attr("width", this.m_size.width)
                                                          .attr("viewBox", "0 0 " + (this.m_size.width) + " " + this.m_controlBar.m_size.height);

                               }.bind(this, p_transition));
    });

    namespace.CorpusClusterView.method("OpenUnderlyingPanel", function(p_data, p_coordinates, p_size){

        // Create new TextClusterView panel
        var textClusterView = new namespace.TextClusterView({ x: p_coordinates.x, y: p_coordinates.y },
                                                            { width: p_size.width, height: p_size.height },
                                                            this.m_level,
                                                            parseInt(p_data.m_title));

        // Link the TextClusterView to all open information views via mouseover
        for ( var index = 0; index < this.m_linkedViews.length; index++ ){

            if ( this.m_linkedViews[index].panel instanceof namespace.InformationView &&
                 namespace.Interaction.mouseover == this.m_linkedViews[index].update ){
                textClusterView.AddLinkedView(this.m_linkedViews[index].panel, namespace.Interaction.mouseover);
            }
        }

        // Link the CorpusView, CorpusClusterView, and TextClusterView panels via mouseover
        this.m_level.m_graphViews[0].m_panel.AddLinkedView(textClusterView, namespace.Interaction.mouseover);
        textClusterView.AddLinkedView(this.m_level.m_graphViews[0].m_panel, namespace.Interaction.mouseover);
        this.AddLinkedView(textClusterView, namespace.Interaction.mouseover);
        textClusterView.AddLinkedView(this, namespace.Interaction.mouseover);
        this.AddLinkedView(textClusterView, namespace.Interaction.dblclick);

        // Link the TopicBar and DataBar to the TextClusterView via click
        this.m_level.m_infoViews[0].m_panel.AddLinkedView(textClusterView, namespace.Interaction.click);
        this.m_level.m_infoViews[1].m_panel.AddLinkedView(textClusterView, namespace.Interaction.click);
        this.m_level.m_infoViews[1].m_panel.AddLinkedView(textClusterView, namespace.Interaction.mouseover);

        // Initialize and Start the TextClusterView
        textClusterView.m_container.Initialize(this.m_level.m_div);
        textClusterView.m_container.Start();

        textClusterView.m_div.style("opacity", 0.0);
        textClusterView.m_controlBar.m_div.style("opacity", 0.0);
        textClusterView.m_panelRectDiv.style("opacity", 0.0);
        textClusterView.m_div.transition().delay(500).duration(3000).style("opacity", 1.0);
        textClusterView.m_controlBar.m_div.transition().delay(500).duration(3000).style("opacity", 1.0);
        textClusterView.m_panelRectDiv.transition().delay(500).duration(3000).style("opacity", 1.0);

        // Indicate that the underlying panel for CorpusView has now been opened
        this.m_underlyingPanelOpen = true;
    });

    namespace.CorpusClusterView.method("ScrollToZoom", function(p_twicLevel){

      var cb = function(error, data){

          // Scale the level group attached to the svg container
          d3.select("#twic_level_" + p_twicLevel.m_name).attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }

      return cb;
    });

    namespace.CorpusClusterView.method("TickAlt", function(){

        var svgWidth = parseInt(this.m_svg.attr("width"));
        var svgHeight = parseInt(this.m_svg.attr("height"));

        this.m_nodes[this.m_rootIndex].x = svgWidth >> 1;
        this.m_nodes[this.m_rootIndex].y = svgHeight >> 1;

        this.m_svg.selectAll(".node")
                  .each(function(d){

                    var circle = d3.select(this)
                                   .selectAll("circle")
                                   .attr('cx', d.x)
                                   .attr('cy', d.y);
                    var rings = d3.select(this)
                                  .selectAll("path")
                                  .attr("transform", "translate(" + d.x + "," + d.y + ")");
                  });

        this.m_svg.selectAll(".link")
                  .attr('x1', function(d){ return d.source.x; })
                  .attr('y1', function(d){ return d.source.y; })
                  .attr('x2', function(d){ return d.target.x; })
                  .attr('y2', function(d){ return d.target.y; });
    });

    namespace.CorpusClusterView.method("Tick", function(){

        var links = this.m_svg.selectAll(".link"); // Perform visible/active test later
        var nodes = this.m_svg.selectAll(".node"); // Perform visible/active test later

        var svgWidth = parseInt(this.m_svg.attr("width"));
        var svgHeight = parseInt(this.m_svg.attr("height"));

        this.m_nodes[this.m_rootIndex].x = svgWidth >> 1;
        this.m_nodes[this.m_rootIndex].y = svgHeight >> 1;

        if ( !this.b_positionsCalculated ){

            nodes.attr("cx", function(d){
                     return d.x = Math.max(d.radius, Math.min(svgWidth - d.radius, d.x));
                 }.bind(this))
                 .attr("cy", function(d){
                     return d.y = Math.max(d.radius, Math.min(svgHeight - d.radius, d.y));
                 }.bind(this));

            /*nodes.each(function(d){

                d.x = Math.max(d.radius, Math.min(svgWidth - d.radius, d.x));
                if ( isNaN(d.x) ){
                    var x = 0;
                }
                d.y = Math.max(d.radius, Math.min(svgHeight - d.radius, d.y));
                var circle = d3.select(this)
                               .selectAll("circle")
                               .attr("cx", d.x)
                               .attr("cy", d.y);
                var rings = d3.select(this)
                              .selectAll("path")
                              .attr("transform", "translate(" + d.x + "," + d.y + ")");
            });*/

            var q = d3.geom.quadtree(this.m_nodes);
            var i = 0;
            var n = this.m_nodes.length;

            // CONTINUE WORK HERE
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

            //this.b_positionsCalculated = true;
        }
        else {

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
    namespace.CorpusClusterView.prototype.s_infoFlavorText = "Topic Avg. of Corpus Topic Clusters";


    // Lower midlevel document rectangle cluster view (TWiC.TopicBullseye)
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
        this.m_clusterSvgGroup = null;
        this.m_numberTopics = 5;
    };
    namespace.TextClusterView.inherits(namespace.GraphView);

    namespace.TextClusterView.method("Initialize", function(p_parentDiv){

        // Set the container to the given coordinates from the TextClusterView constructor
        this.m_container.SetPosition(this.m_coordinates);
        this.m_container.m_div.style("left", this.m_container.m_coordinates.x);
        this.m_container.m_div.style("top", this.m_container.m_coordinates.y);

        // Zero out the coordinates to be the top left of the div(s) (position: absolute)
        this.m_coordinates.x = 0;
        this.m_coordinates.y = 0;

        // Div and svg for panel rect (required because of resizing behavior inconsistent with scaling data shapes)
        var controlBarHeight = ( this.m_controlBar ) ? this.m_controlBar.m_size.height - 1 : 0;
        this.m_panelRectDiv = p_parentDiv.append("div")
                                         .attr("class", "div_panel_rect")
                                         .attr("id", "div_panel_rect_" + this.m_name)
                                         .style("position", "absolute")
                                         .style("left", this.m_coordinates.x)
                                         .style("top", this.m_coordinates.y + controlBarHeight)
                                         .style("width", this.m_size.width)
                                         .style("height", this.m_size.height)
                                         .style("max-width", this.m_size.width)
                                         .style("max-height", this.m_size.height)
                                         .style("border-radius", namespace.Panel.prototype.s_borderRadius);
        this.m_panelRectSvg = this.m_panelRectDiv.append("svg")
                                                 .attr("x", this.m_coordinates.x)
                                                 .attr("y", this.m_coordinates.y)
                                                 .attr("width", this.m_size.width)
                                                 .attr("height", this.m_size.height)
                                                 .attr("viewBox", "0 0 " + this.m_size.width + " " + this.m_size.height);

        // Add the rectangle where all graph data will sit
        this.m_panelRect = this.m_panelRectSvg.append("path")
                                              .attr("d", namespace.BottomRoundedRect(this.m_coordinates.x,
                                                                                     this.m_coordinates.y,
                                                                                     this.m_size.width,
                                                                                     this.m_size.height,
                                                                                     namespace.Panel.prototype.s_borderRadius))
                                              .attr("class", "rect_twic_graph")
                                              .attr("id", "rect_twic_graph_textclusterview_" + this.m_name)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue);

        // Set up the div for the text cluster view
        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_graph_textclusterview div_twic_graph twic_panel")
                                .attr("id", "div_twic_graph_textclusterview_" + this.m_name)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height)
                                .style("max-width", this.m_size.width)
                                .style("max-height", this.m_size.height)
                                .style("border-radius", namespace.Panel.prototype.s_borderRadius)
                                .style("position", "absolute")
                                .style("left", this.m_coordinates.x)
                                .style("top", this.m_coordinates.y + controlBarHeight);

        // Set up the svg for the text cluster view
        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_graph")
                               .attr("id", "svg_twic_graph_textclusterview_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height)
                               .attr("viewBox", "-50 -50 " + (this.m_size.width + 100) + " " + (this.m_size.height + 100));

        // Add group for trapping mouse events in the graph
        this.m_groupOverlay = this.m_svg.append("g")
                                        .attr("class","group_twic_graph_overlay")
                                        .attr("id", "group_twic_graph_overlay_textclusterview_" + this.m_name);

        // Transaprent rectangle to capture clicks outside of the TWiC topic rectangles
        this.m_clickRectangle = this.m_groupOverlay.append("rect")
                                                   .attr("x", -50)
                                                   .attr("y", -50)
                                                   .attr("width", (this.m_size.width + 100))
                                                   .attr("height", (this.m_size.height + 100))
                                                   .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                                   .style("opacity", 0)
                                                   .on(namespace.Interaction.click, function(){
                                                       namespace.GraphView.prototype.MouseBehavior(this, null, namespace.Interaction.click);
                                                    }.bind(this));

        this.m_clusterSvgGroup = this.m_groupOverlay.append("g").attr("id", "clustersvg_group")
                                                       .attr("width", this.m_size.width)
                                                       .attr("height", this.m_size.height)
                                                       .attr("transform", "translate(" + ((this.m_coordinates.x + (this.m_size.width >> 2)) * 0.4)
                                                             + "," + ((this.m_coordinates.y + (this.m_size.height >> 2)) * 0.4) + ") scale(0.75)");


        // Add my text to the container's control bar
        this.AddBarText(false);

        this.InitializeGraph();
    });

    namespace.TextClusterView.method("InitializeGraph", function(){

        var twic_objects = [];
        var twic_cluster_json_list = [];
        var textCount = this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"].length;
        var avgTextCount = 0;
        for ( var index = 0; index < Object.keys(this.m_level.m_corpusMap["children"]).length; index++ ){
            avgTextCount += this.m_level.m_corpusMap["children"][index]["children"].length;
        }
        avgTextCount /= Object.keys(this.m_level.m_corpusMap["children"]).length;

        // Initial radius before scaling is the average available space in the panel for each shape,
        // and then halved to retain spacing between texts for better viz.
        var avgDataShapeRadius = Math.sqrt((1.0 / Math.PI) * ((this.m_size.width * this.m_size.height) / textCount));
        avgDataShapeRadius >>= 1;
        var avgDataShapeRadius4Center = Math.sqrt((1.0 / Math.PI) * ((this.m_size.width * this.m_size.height) / avgTextCount));
        avgDataShapeRadius4Center >>= 1;

        // Average distance to ideal normalization via corpus map JSON data
        var avg = 0.0;
        for ( var index = 0; index < textCount; index++ )
            avg += this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["dist2avg"];
        avg /= Object.keys(this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"]).length;

        // Determine how to scale distance to fit current panel space
        this.m_linkDistLimits = { min: this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][0]["dist2avg"],
                                  max: this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][0]["dist2avg"] };
        for ( var index = 1; index < textCount; index++ ){
            this.m_linkDistLimits.min = Math.min(this.m_linkDistLimits.min, this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["dist2avg"]);
            this.m_linkDistLimits.max = Math.max(this.m_linkDistLimits.max, this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["dist2avg"]);
        }
        this.b_adjustDistances = ( this.m_linkDistLimits.min < 0 );
        var longestPanelDist = Math.min(this.m_size.width, this.m_size.height);
        this.m_adjustedDistances = [];
        for ( var index = 0; index < textCount; index++ ){
            var adjDistance = this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["dist2avg"];
            if ( this.b_adjustDistances ){
                adjDistance += this.m_linkDistLimits.min;
            }
            this.m_adjustedDistances.push(adjDistance);
        }
        if ( this.m_linkDistLimits.min == 0 ){
            this.m_linkDistLimits.min += 100;
        }

        // Subtract min from distances and convert to scale of 1-100
        var linkLimitScaleFactor = 100.0 / (this.m_linkDistLimits.max - this.m_linkDistLimits.min);
        for ( var index = 0; index < this.m_adjustedDistances.length; index++ ){
            this.m_adjustedDistances[index] -= this.m_linkDistLimits.min;
            this.m_adjustedDistances[index] *= linkLimitScaleFactor;
        }

        // Node zero for the force-directed graph will be a cluster circle representing the average
        // topic distribution of this text cluster
        this.m_rootIndex = 0;
        this.m_nodes.push({ "index": this.m_rootIndex,
                            "name": namespace.TextClusterView.prototype.s_infoFlavorText,
                            "radius": avgDataShapeRadius4Center });

        // Top N topics of the fake node
        var topTopics = [];
        var topTopicCount = 10;
        for ( var index = 0; index < topTopicCount; index++ ) { topTopics.push([]) };
        var topTopicID = "";
        for ( var topic in this.m_level.m_corpusMap["children"][this.m_clusterIndex]["topics"] ){
            if ( this.m_level.m_corpusMap["children"][this.m_clusterIndex]["topics"][topic][0] < topTopicCount + 1){
                topTopics[this.m_level.m_corpusMap["children"][this.m_clusterIndex]["topics"][topic][0] - 1] = [topic, this.m_level.m_corpusMap["children"][this.m_clusterIndex]["topics"][topic][1]];
            }
        }

        // Add the svg group for this central node
        this.m_clusterSvgGroup.append("g")
                              .attr("class", "node")
                              .style("position", "absolute")
                              .attr("id", "node_" + this.m_rootIndex);

        var centralNode = new TWiC.TopicBullseye({ x: 0, y: 0 },
                                                 avgDataShapeRadius4Center,
                                                 this.m_nodes[0]["name"],
                                                 this.m_level,
                                                 this,
                                                 this.m_linkedViews,
                                                 topTopicCount,
                                                 this.m_level.m_corpusMap["children"][this.m_clusterIndex]["topics"],
                                                 this.m_level.m_corpusMap["children"][this.m_clusterIndex]["name"],
                                                 false);

        // Overrides default text count calculation for topic bullseye and instead uses the number of texts in this cluster
        centralNode.SetTextCount(textCount);
        centralNode.SetPanelNodeIndex(0);
        centralNode.SetScaledRadius(true);
        centralNode.m_allowDblclick = false;
        this.m_twicObjects.push(centralNode);
        this.m_objectsJSON.push({ "name": centralNode.m_name, "dist2avg": 0.0, "topics": topTopics, "children":[] });
        this.m_nodes[0].radius = centralNode.m_size;

        // Build all clusters
        var linkDilation = 80;
        for ( var index = 0; index < textCount; index++ ){

            var textRectangle = new TWiC.TopicRectangle({ x: 0, y: 0 },
                                                        { width: 0, height: 0 },
                                                        this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["name"],
                                                        this.m_level,
                                                        this,
                                                        this.m_linkedViews,
                                                        this.m_clusterIndex,
                                                        this.m_numberTopics);
            textRectangle.SetPanelNodeIndex(index);

            // Load the individual JSON for this text
            textRectangle.Load();

            var textrect_json = {
                "name": this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["name"],
                //"dist2avg": 2 + Math.abs((this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["dist2avg"] - avg) * linkDilation),
                "dist2avg": (this.m_adjustedDistances[index] * longestPanelDist) / 100.0,
                "topics": this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index]["topics"],
                "children": []
            };

            this.m_objectsJSON.push(textrect_json);
            this.m_twicObjects.push(textRectangle);
        }

        // Establish the rest of the nodes and edges for the force-directed graph
        for ( var index = 0; index < this.m_objectsJSON.length; index++ ){

            if ( this.m_rootIndex == index )
                continue;

            //var tempRadius = Math.sqrt(((this.m_twicObjects[index].m_size.width >> 1) * (this.m_twicObjects[index].m_size.width >> 1)) + ((this.m_twicObjects[index].m_size.height >> 1) * (this.m_twicObjects[index].m_size.height >> 1)));
            this.m_nodes.push({ "index": index, "name": this.m_objectsJSON[index]["name"] });
            var tempDist = this.m_objectsJSON[index]["dist2avg"];
            if ( tempDist < avgDataShapeRadius4Center ){
                tempDist = avgDataShapeRadius4Center;
            }
            this.m_links.push({
                "source": index,
                "target": this.m_rootIndex,
                "value": tempDist
            });
        }

        // Set up the force-directed graph
        this.m_graph = d3.layout.force()
                                .nodes(this.m_nodes)
                                .links(this.m_links)
                                .size([this.m_size.width, this.m_size.height])
                                .charge(-150)
                                .gravity(0.06)
                                .linkDistance(function(d){ return d.value + namespace.GraphView.prototype.s_linkDistanceMod; });
    });

    namespace.TextClusterView.method("Start", function(){

        this.m_level.m_queue.await(function(){

            // Add lines for the links and bind the link data to them
            this.m_clusterSvgGroup.selectAll(".link")
                                  .data(this.m_links)
                                  .enter()
                                  .append("line")
                                  .attr("class", "link")
                                  .attr("id", function(d){ return "link" + d.source; })
                                  .style("stroke-width", 0.5)
                                  .style("stroke",namespace.Level.prototype.s_palette.lightgray)
                                  .style("opacity", TWiC.TopicBullseye.s_semihighlightedOpacity);

            // Save the TWiC datashape's radius to the graph node (for graph/collision usage)
            for ( var index = 0; index < this.m_twicObjects.length; index++ ) {

                for ( var index2 = 0; index2 < this.m_nodes.length; index2++ ){

                    if ( this.m_twicObjects[index].m_name == this.m_nodes[index2]["name"] ){

                        if ( 0 == index ){
                            this.m_nodes[index2].radius = this.m_twicObjects[index].m_size;
                        } else {
                            var topTopicCount = 5;
                            var highlightRectWidth =  2 * topTopicCount * namespace.TopicRectangle.prototype.borderWidth;
                            var totalDims = { width: this.m_twicObjects[index].m_size.width + highlightRectWidth,
                                              height: this.m_twicObjects[index].m_size.height + highlightRectWidth };
                            this.m_nodes[index2].radius = Math.sqrt(((totalDims.width >> 1) * (totalDims.width >> 1)) +
                                                                    ((totalDims.height >> 1) * (totalDims.height >> 1)));
                        }

                        break;
                    }
                }
            }

            // Append TWiC object svg elements to the nodes with corresponding bound data
            for ( index = 0; index < this.m_twicObjects.length; index++ ) {

                for ( var index2 = 0; index2 < this.m_nodes.length; index2++ ){

                    if ( this.m_twicObjects[index].m_name == this.m_nodes[index2]["name"] ){

                        // Simple test to discern between TopicBullseyes and the central TopicBullseye
                        //if ( undefined != this.m_twicObjects[index].Draw ){
                        if ( namespace.TopicRectangle.prototype.s_shapeChar == this.m_twicObjects[index].m_shapeChar ){

                            this.m_twicObjects[index].Draw();
                            var fileID = this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index - 1]["name"];

                            // Checking for full filename with underscore
                            /*var underscoreIndex = fileID.indexOf("_")
                            if ( -1 != underscoreIndex ){
                                fileID = fileID.substring(0, underscoreIndex)
                            }*/

                            //var title = this.m_level.m_corpusInfo.file_info[parseInt(fileID)][1];

                            var title = this.m_level.m_corpusInfo.file_info[fileID][1];

                            // Save the title for later reference/use
                            this.m_twicObjects[index].SetTitle(title);

                        } else {
                            // Adds a cluster circle in the center (with no attached filenames --> [])
                            this.m_twicObjects[index].Draw(this.m_svg.select(".node#node_" + index), []);
                            //var title = "Topic Cluster " + this.m_clusterIndex.toString();
                            var title = "";
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
                for ( var index = 1000; index > 0; --index ) { this.Tick(); }
                this.m_graph.stop();
                this.b_positionsCalculated = true;
            }.bind(this), 10);

            // Normal graph start
            //this.m_graph.on("tick", function(){ this.Tick(); }.bind(this));
            //this.m_graph.start();

            // Make all objects of this panel resizable and draggable
            this.MakeResizable(false);
            this.MakeDraggable();

            // Update the panel for potential highlighting now that all SVG objects have been built
            if ( -1 != this.m_level.m_highlightedTopic ){
                var initialPauseState = this.m_paused;
                this.Pause(false);
                this.Update({topicID: this.m_level.m_highlightedTopic}, namespace.Interaction.mouseover);
                this.Pause(initialPauseState);
            }

        }.bind(this));
    });

    namespace.TextClusterView.method("Update", function(p_data, p_updateType){

        if ( !this.m_paused ){

            if ( p_updateType && namespace.Interaction.mouseover == p_updateType ){

                // Mouseover --> highlight of cluster rect outline or topic rectangle stroke
                if ( null != p_data ){
                    this.HighlightAllDataShapesWithTopic(p_data);
                // Otherwise, this is a mouseout from a text rectangle.
                // Highlight all but show no titles
                } else {
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
                    //this.AddBarText(50, "top");
                    this.AddBarText(false);

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

    namespace.TextClusterView.method("AddBarText", function(p_altText){

        this.m_controlBar.AddText(function(p_controlBar){

            if ( p_controlBar.m_barText ){
                p_controlBar.m_barText.selectAll("*").remove();
            }
            if ( !this.m_textFirstSet ){
                this.m_textPos = { x: p_controlBar.GetNextWidgetPos().x, y: p_controlBar.GetNextWidgetPos().y };
                this.m_textFirstSet = true;
            }

            if ( !p_altText ){

                p_controlBar.m_barText = p_controlBar.m_controlGroup.append("text")
                                                        .attr("x", this.m_textPos.x)
                                                        .attr("y", this.m_textPos.y);

                p_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue).style("opacity", 1.0);

                p_controlBar.m_barText.append("tspan")
                                      .html("TWiC:&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);

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
                                               .on(namespace.Interaction.mouseout, myTip.hide);*/
            } else {

                p_controlBar.m_barText = p_controlBar.m_controlGroup.append("text")
                                                        .attr("x", this.m_textPos.x)
                                                        .attr("y", this.m_textPos.y);

                p_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue).style("opacity", 1.0);

                p_controlBar.m_barText.append("tspan")
                                      .html("TWiC:&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);

                p_controlBar.m_barText.append("tspan")
                                      .html("Text Cluster View")
                                      .attr("fill", namespace.Level.prototype.s_palette.gold)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);
            }
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
            } else if ( "g" == this.nodeName ){
                d3.select(this).selectAll("rect").style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
                d3.select(this).selectAll("path").style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
            }
        });

        // Darken all inner text rectangles
        this.m_svg.selectAll(".text_info_rect")
                  .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity)
                  .style("stroke", function(d){ return d.locolor; })
                  .style("stroke-opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);

        // Hide all text
        this.m_svg.selectAll(TWiC.TextClusterView.prototype.s_datashapeTextClassSelect)
                  .selectAll("tspan")
                  .style("opacity", 0.0);

        // Darken all graph links
        this.m_clusterSvgGroup.selectAll(".link").style("opacity", TWiC.DataShape.prototype.s_unhighlightedOpacity)
                                                 .style("stroke", namespace.Level.prototype.s_palette.link)
                                                 .style("stroke-width", 1);
    });

    namespace.TextClusterView.method("HighlightAllDataShapes", function(p_showText){

        // Reset saved topic highlight ID
        this.m_level.m_highlightedTopic = -1;

        // All shapes get highlighted
        var allShapes = this.m_svg.selectAll(TWiC.TextClusterView.prototype.s_datashapeClassSelect);
        allShapes.each(function(d){

            if ( "path" == this.nodeName || "circle" == this.nodeName ){
                d3.select(this).style("fill", d.color)
                               .style("opacity", 1.0);
            } else if ( "rect" == this.nodeName ){
                d3.select(this).style("stroke", d.color)
                               .style("opacity", 1.0)
                               .style("stroke-opacity", 1.0);
            } else if ( "g" == this.nodeName ) {
                d3.select(this).selectAll("rect").style("opacity", 1.0);
                d3.select(this).selectAll("path").style("opacity", 1.0);
            }
        });

        // Highlight all inner text rectangles
        this.m_svg.selectAll(".text_info_rect")
                  .style("opacity", 1.0)
                  .style("stroke", function(d){ return d.color; })
                  .style("stroke-opacity", 1.0);

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

        // Highlight all graph links
        this.m_clusterSvgGroup.selectAll(".link").style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity + 0.3)
                                                 .style("stroke", namespace.Level.prototype.s_palette.link)
                                                 .style("stroke-width", 1);
    });

    namespace.TextClusterView.method("HighlightAllDataShapesWithTopic", function(p_data){

        // Darken all shapes and text first
        this.DarkenAllDataShapes();

        // Save the highlighted topic for future reference
        this.m_level.m_highlightedTopic = p_data.topicID;

        // Highlight all shapes that represent the given topic
        var filteredShapes = this.m_svg.selectAll(TWiC.TextClusterView.prototype.s_datashapeClassSelect)
                                       .filter(function(d){ return d.topicID == p_data.topicID; });
        filteredShapes.each(function(d){

            // Highlight all paths, circles, and rectangles
            if ( "path" == this.nodeName || "circle" == this.nodeName ){
                d3.select(this).style("fill", d.color)
                               .style("opacity", 1.0);
            } else if ( "rect" == this.nodeName ){
                d3.select(this).style("stroke", d.color)
                               .style("opacity", 1.0)
                               .style("stroke-opacity", 1.0);
                d3.select(this.parentNode.parentNode.parentNode).selectAll(".text_info_rect").style("opacity", 1.0);
            } else if ( "g" == this.nodeName ){
                d3.select(this).selectAll("rect").style("opacity", 1.0);
                d3.select(this).selectAll("path").style("opacity", 1.0);
            }

            // Raise the opacity, but not color of shapes in the same datashape that do not represent the given topic
            var nonHighlights = d3.select(this.parentNode)
                                  .selectAll(TWiC.TextClusterView.prototype.s_datashapeClassSelect)
                                  .filter(function(d){return d.topicID != p_data.topicID; });
            nonHighlights.each(function(d){
                if ( "path" == this.nodeName || "circle" == this.nodeName ){
                    d3.select(this).style("fill", d.locolor)
                        .style("opacity", 1.0);
                } else if ( "rect" == this.nodeName ){
                    d3.select(this).style("stroke", d.locolor)
                        .style("stroke-opacity", 1.0);
                } else if ( "g" == this.nodeName ){
                    d3.select(this).selectAll("rect").style("opacity", 1.0);
                    d3.select(this).selectAll("path").style("opacity", 1.0);
                }
            });

            // Highlight the text of shapes with attached text
            if ( d && d.shapeRef ){

                d.shapeRef.m_textTag.selectAll("tspan")
                                    .style("opacity", 1.0);

                if ( namespace.TopicRectangle.prototype.s_shapeChar == d.shapeRef.m_shapeChar ){
                    d.shapeRef.m_textRect.style("opacity", 1.0);
                    d3.select(d.shapeRef.m_textRect.node().parentNode)
                      .selectAll("path")
                      .style("opacity", 1.0);
                }

                // Highlight the graph link corresponding to this shape
                if ( !isNaN(parseInt(d.shapeRef.m_name)) ){
                    d.shapeRef.m_panel.m_clusterSvgGroup.select("line#link" + (d.shapeRef.m_panelNodeIndex + 1))
                                                        .style("opacity", 1.0)
                                                        .style("stroke", d.shapeRef.m_panel.m_level.m_topicColors[d.shapeRef.m_clusterIndex])
                                                        .style("stroke-width", 2);
                }
            }
        });

        var filteredTextRectangles = this.m_svg.selectAll(".text_info_rect")
                                               .filter(function(d){ return d.topicID == p_data.topicID; });
        filteredTextRectangles.each(function(d){
            d3.select(this).style("opacity", 1.0)
                           .style("stroke", d.color)
                           .style("stroke-opacity", 1.0)
                           .selectAll("path")
                           .style("opacity", 1.0)
                           .style("fill", function(d){ return d.color; });
        });
    });

    namespace.TextClusterView.method("Move", function(p_transition, p_callbackTiming, p_callback){

        // Determine the traits of the given transition
        if ( p_transition.position ){
            this.m_container.SetPosition(p_transition.position);
        }
        if ( p_transition.size ) {
            this.m_container.SetSize(p_transition.size);
        }

        // NOTE: CSS max-width, max-height never changes

        // Container transitions to its position/dimensions
        this.m_container.m_div.transition()
                              .duration(p_transition.duration)
                              .style("left", this.m_container.m_coordinates.x)
                              .style("top", this.m_container.m_coordinates.y)
                              .style("width", this.m_container.m_size.width)
                              .style("height", this.m_container.m_size.height);

        // NOTE: Panels and control bars are relatively positioned in their parent container div

        // Panel and its svg transition to new position/dimensions
        this.m_div.transition().duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .style("height", this.m_size.height)
                               .each("start", function(p_transition, p_callbackTiming, p_callback){

                                   this.m_panelRectDiv.transition()
                                                   .duration(p_transition.duration)
                                                   .style("width", p_transition.size.width)
                                                   .style("height", p_transition.size.height - this.m_controlBar.m_size.height);
                                   this.m_panelRectSvg.transition()
                                                   .duration(p_transition.duration)
                                                   .attr("width", p_transition.size.width)
                                                   .attr("height", p_transition.size.height - this.m_controlBar.m_size.height)
                                                   .attr("viewBox", "0 0 " +
                                                                    p_transition.size.width + " " +
                                                                    (p_transition.size.height - this.m_controlBar.m_size.height));
                                   this.m_panelRect.transition()
                                                   .duration(p_transition.duration)
                                                   .attr("d", namespace.BottomRoundedRect(0, 0,
                                                                  p_transition.size.width,
                                                                  p_transition.size.height - this.m_controlBar.m_size.height,
                                                                  namespace.Panel.prototype.s_borderRadius));

                                   this.m_svg.transition()
                                             .duration(p_transition.duration)
                                             .attr("width", this.m_size.width)
                                             .attr("height", this.m_size.height)
                                             .each("end", function(){

                                                 if ( "end" == p_callbackTiming ){

                                                    p_callback();
                                                 }

                                             }.bind(this, p_callbackTiming, p_callback));

                                   if ( "start" == p_callbackTiming ){
                                       p_callback();
                                   }

                               }.bind(this, p_transition, p_callbackTiming, p_callback));

        // Control bar and its path (not svg) transition to new position/width
        this.m_controlBar.m_size.width = this.m_size.width;
        this.m_controlBar.m_div.transition()
                               .duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .each("start", function(p_transition){

                                   this.m_controlBar.m_barPath.transition()
                                                              .duration(p_transition.duration)
                                                              .attr("d", this.m_controlBar.GetRectPath());
                                   this.m_controlBar.m_svg.transition()
                                                          .duration(p_transition.duration)
                                                          .attr("width", this.m_size.width)
                                                          .attr("viewBox", "0 0 " + (this.m_size.width) + " " + this.m_controlBar.m_size.height);

                               }.bind(this, p_transition));
    });

    namespace.TextClusterView.method("OpenUnderlyingPanel", function(p_data, p_coordinates, p_size){

        // Create new TextView panel
        var textView = new namespace.TextView({ x: p_coordinates.x, y: p_coordinates.y },
                                              { width: p_size.width, height: p_size.height },
                                              this.m_level);

        // Link the TextView to all open information views via mouseover
        for ( var index = 0; index < this.m_linkedViews.length; index++ ){

            if ( this.m_linkedViews[index].panel instanceof namespace.InformationView &&
                 namespace.Interaction.mouseover == this.m_linkedViews[index].update ){
                textView.AddLinkedView(this.m_linkedViews[index].panel, namespace.Interaction.mouseover);
            }
        }

        // Link the CorpusView, CorpusClusterView, TextClusterView, and TextView panels via mouseover
        this.m_level.m_graphViews[0].m_panel.AddLinkedView(textView, namespace.Interaction.mouseover);
        textView.AddLinkedView(this.m_level.m_graphViews[0].m_panel, namespace.Interaction.mouseover);
        this.m_level.m_graphViews[1].m_panel.AddLinkedView(textView, namespace.Interaction.mouseover);
        textView.AddLinkedView(this.m_level.m_graphViews[1].m_panel, namespace.Interaction.mouseover);
        this.AddLinkedView(textView, namespace.Interaction.mouseover);
        textView.AddLinkedView(this, namespace.Interaction.mouseover);
        this.AddLinkedView(textView, namespace.Interaction.dblclick);

        // Link the TopicBar and DataBar to the TextView via click
        this.m_level.m_infoViews[0].m_panel.AddLinkedView(textView, namespace.Interaction.click);
        this.m_level.m_infoViews[1].m_panel.AddLinkedView(textView, namespace.Interaction.click);
        this.m_level.m_infoViews[1].m_panel.AddLinkedView(textView, namespace.Interaction.mouseover);

        // Initialize and Start the TextView
        textView.m_container.Initialize(this.m_level.m_div, true);
        textView.m_container.Start();
        textView.m_div.style("opacity", 0.0);
        textView.m_controlBar.m_div.style("opacity", 0.0);
        textView.m_panelRectDiv.style("opacity", 0.0);
        textView.m_div.transition().delay(500).duration(3000).style("opacity", 1.0);
        textView.m_controlBar.m_div.transition().delay(500).duration(3000).style("opacity", 1.0);
        textView.m_panelRectDiv.transition().delay(500).duration(3000).style("opacity", 1.0);

        // Initial update call shows the text clicked
        textView.Update(p_data, namespace.Interaction.dblclick);

        // Update the view if a topic is already highlighted
        if ( -1 != this.m_level.m_highlightedTopic ){
            var initialPauseState = textView.IsPaused();
            textView.Pause(false);
            textView.Update(p_data, namespace.Interaction.mouseover);
            if ( initialPauseState ){
                textView.Pause(true);
            }
        // Else, just highlight all words
        } else {
            textView.Update(null, namespace.Interaction.mouseover);
        }

        // Indicate that the underlying panel for CorpusView has now been opened
        this.m_underlyingPanelOpen = true;
    });

    namespace.TextClusterView.method("Tick", function(){

        var links = this.m_svg.selectAll(".link"); // Perform visible/active test later
        var nodes = this.m_svg.selectAll(".node"); // Perform visible/active test later
        var svgWidth = parseInt(this.m_svg.attr("width"));
        var svgHeight = parseInt(this.m_svg.attr("height"));

        this.m_nodes[this.m_rootIndex].x = svgWidth >> 1;
        this.m_nodes[this.m_rootIndex].y = svgHeight >> 1;

        if ( !this.b_positionsCalculated ){

            nodes.attr("cx", function(d) {
                     //return d.x = Math.max(this.m_twicObjects[d.index].m_radius, Math.min(svgWidth - this.m_twicObjects[d.index].m_radius, d.x));
                     return d.x = Math.max(d.radius, Math.min(svgWidth - d.radius, d.x));
                 }.bind(this))
                 .attr("cy", function(d) {
                     //return d.y = Math.max(this.m_twicObjects[d.index].m_radius, Math.min(svgHeight - this.m_twicObjects[d.index].m_radius, d.y));
                     return d.y = Math.max(d.radius, Math.min(svgHeight - d.radius, d.y));
                 }.bind(this));

            var q = d3.geom.quadtree(this.m_nodes);
            var i = 0;
            var n = this.m_nodes.length;

            while ( ++i < n ){ q.visit(namespace.GraphView.prototype.Collide(this.m_nodes[i])); }

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

            this.b_positionsCalculated = true;
        }
        else {

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
    namespace.TextClusterView.prototype.s_infoFlavorText = "Topic Avg. of Text Cluster";


    // Low level individual text view (TWiC.TopicTextHTML)
    namespace.TextView = function(p_coordinates, p_size, p_level){

        namespace.GraphView.apply(this, arguments);

        this.m_data = null;
        this.m_filename = "";
    };
    namespace.TextView.inherits(namespace.GraphView);

    namespace.TextView.method("Initialize", function(p_parentDiv){

        // Set up the panel container to the given coordinates
        this.m_container.SetPosition(this.m_coordinates);
        this.m_container.m_div.style("left", this.m_container.m_coordinates.x);
        this.m_container.m_div.style("top", this.m_container.m_coordinates.y);

        // TextView's container has overflow hidden (for long texts)
        this.m_container.m_div.style("overflow", "hidden");
        this.m_container.m_div[0][0].style["border-radius"] = namespace.Panel.prototype.s_borderRadius + "px";

        // Top/left coordinates are relative to the containing div/level
        this.m_coordinates.x = 0;
        this.m_coordinates.y = 0;

        // Div and svg for panel rect (required because of resizing behavior inconsistent with scaling data shapes)
        // -borderRadius for overflow trick for long texts
        var controlBarHeight = ( this.m_controlBar ) ? this.m_controlBar.m_size.height - namespace.Panel.prototype.s_borderRadius + 4 : 0;
        this.m_panelRectDiv = p_parentDiv.append("div")
                                        .attr("class", "div_panel_rect")
                                        .attr("id", "div_panel_rect_" + this.m_name)
                                        .style("position", "absolute")
                                        .style("left", this.m_coordinates.x)
                                        .style("top", this.m_coordinates.y + controlBarHeight)
                                        .style("width", this.m_size.width)
                                        .style("height", this.m_size.height + namespace.Panel.prototype.s_borderRadius)
                                        .style("max-width", this.m_level.m_size.width)
                                        .style("max-height", this.m_level.m_size.height)
                                        .style("overflow", "hidden");
        this.m_panelRectDiv[0][0].style["border-radius"] = namespace.Panel.prototype.s_borderRadius + "px";

        this.m_panelRectSvg = this.m_panelRectDiv.append("svg")
                                                 .attr("x", this.m_coordinates.x)
                                                 .attr("y", this.m_coordinates.y)
                                                 .attr("width", this.m_size.width)
                                                 .attr("height", this.m_size.height + namespace.Panel.prototype.s_borderRadius)
                                                 .attr("viewBox", "0 0 " + this.m_size.width + " " + (this.m_size.height + namespace.Panel.prototype.s_borderRadius));

        // Add the rectangle where all graph data will sit
        this.m_panelRect = this.m_panelRectSvg.append("path")
                                              .attr("d", namespace.BottomRoundedRect(this.m_coordinates.x,
                                                                                     this.m_coordinates.y,
                                                                                     this.m_size.width,
                                                                                     this.m_size.height + namespace.Panel.prototype.s_borderRadius,
                                                                                     namespace.Panel.prototype.s_borderRadius))
                                              .attr("class", "rect_twic_graph")
                                              .attr("id", "rect_twic_graph_textview_" + this.m_name)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                              .style("position", "absolute");

        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_graph_textview div_twic_graph twic_panel")
                                .attr("id", "div_twic_graph_textview_" + this.m_name)
                                .style("left", this.m_coordinates.x)
                                .style("top", this.m_coordinates.y + controlBarHeight)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height)
                                .style("max-width", this.m_level.m_size.width)
                                .style("max-height", this.m_level.m_size.height)
                                .style("overflow", "scroll")
                                .style("border-radius", namespace.Panel.prototype.s_borderRadius)
                                .style("position", "absolute");

        // Add de-click behavior to the panel div
        this.m_div.on(namespace.Interaction.click, function(){
            namespace.GraphView.prototype.MouseBehavior(this, null, namespace.Interaction.click);
        }.bind(this));

        /*this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_graph")
                               .attr("id", "svg_twic_graph_textview_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height)
                               .attr("viewBox", "0 0 " + this.m_size.width + " " + this.m_size.height);*/

        // Save the minimum width and height to preserve the initial svg text size
        this.m_minDims = { width: this.m_size.width, height: this.m_size.height };

        // Add group and rectangle for trapping mouse events in the graph
        this.m_groupOverlay = //this.m_svg.append("g")
                              this.m_div.append("g")
                                        .attr("class","group_twic_graph_overlay")
                                        .attr("id", "group_twic_graph_overlay_textview_" + this.m_name)
                                        .style("position", "relative");

        // Transaprent rectangle to capture clicks outside of the topic words in context
        this.m_clickRectangle = this.m_groupOverlay.append("rect")
                                                   .attr("x", 0)
                                                   .attr("y", 0)
                                                   .attr("width", this.m_size.width)
                                                   .attr("height", this.m_size.height)
                                                   .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                                   .style("opacity", 0)
                                                   .on(namespace.Interaction.click, function(){
                                                       namespace.GraphView.prototype.MouseBehavior(this, null, namespace.Interaction.click);
                                                   }.bind(this));

        // Append a separate group for foreignObject tags for the text
        //this.m_textGroup = this.m_groupOverlay.append("g")
        //                                      .attr("class", "group_textview_text")
        //                                      .style("relative");

        // Make the bar text opaque initially
        this.m_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                   .style("opacity", 1.0);

        // Make all objects of this panel resizable and draggable
        this.MakeResizable(false);
        this.MakeDraggable();
    });

    namespace.TextView.method("Start", function(){

        if ( "" != this.m_filename ){
            this.Load();
        }
    });

    namespace.TextView.method("Update", function(p_data, p_updateType){

        if ( !this.IsPaused() ) {

            if ( namespace.Interaction.mouseover == p_updateType ) {

                if ( null == p_data ) {
                    this.HighlightAllWords();
                } else {
                    this.DarkenAllWords();
                    this.HighlightTopicText(p_data);
                }
            } else {

                // Save a reference to the JSON data
                this.m_data = p_data;

                // Create text objects from this text's JSON
                //this.CreateTextSVGFromJSON(p_data);
                this.CreateHTMLFromJSON(p_data);

                // Remove any old text and add my new text to the container's control bar
                this.AddBarText(false);

                // Make all objects of this panel resizable and draggable
                this.MakeResizable();
                this.MakeDraggable();

                // Update as if being moused over and then clicked
                this.Update(p_data, namespace.Interaction.mouseover);
                this.Pause(true);
            }
        }
    });

    namespace.TextView.method("AddBarText", function(p_altText){

        this.m_controlBar.AddText(function(p_controlBar){

            if ( !p_altText ){

                if ( !this.m_textFirstSet ){
                    this.m_textPos = { x: p_controlBar.GetNextWidgetPos().x, y: p_controlBar.GetNextWidgetPos().y };
                    this.m_textFirstSet = true;
                }

                p_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                      .style("opacity", 1.0);

                if ( null == p_controlBar.m_barText ) {
                    p_controlBar.m_barText = p_controlBar.m_controlGroup.append("text")
                                                            .attr("x", this.m_textPos.x)
                                                            .attr("y", this.m_textPos.y);
                }

                if ( null != this.m_data ){

                    this.m_controlBar.m_barText.selectAll("*").remove();

                    p_controlBar.m_barText.append("tspan")
                                          .html("TWiC:&nbsp;")
                                          .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                          .style("font-family", namespace.Level.prototype.s_fontFamily)
                                          .style("font-size", 25);

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
            } else {

                p_controlBar.m_barText.selectAll("*").remove();

                p_controlBar.m_barText.append("tspan")
                                      .html("TWiC:&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);

                p_controlBar.m_barText.append("tspan")
                                      .html("Text View")
                                      .attr("fill", namespace.Level.prototype.s_palette.gold)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);
            }
        }.bind(this));
    });

    namespace.TextView.method("CreateHTMLFromJSON", function(p_data){

        // 1. Set starting positions/sizes

        // Start position for text
        var currentX = namespace.TextView.prototype.s_textStartPosition.x;
        var currentY = namespace.TextView.prototype.s_textStartPosition.y;

        // Initialize size of the svg for the text (initial panel height + space for rounded corners)
        var rectGrowth = this.m_size.height + namespace.Panel.prototype.s_borderRadius;

        // Pixel space per line
        var dy = namespace.TopicBar.prototype.s_textInfo.yIncrement;


        // 2. Remove old text from the view
        this.m_groupOverlay.selectAll("*").remove();

        // Delete the old TopicText data shape here
        if ( this.m_topicText ){
            this.m_topicText = null;
        }

        // 3. Set up the panel components for this new text

        // Initial loop for path/panel rectangle resize (rectangle needs to be drawn first)
        for ( var index = 0; index < p_data.json.lines_and_colors.length; index++ ) {
            currentY += dy;
            if ( currentY > this.m_size.height ){
                rectGrowth += dy;
            }
        }

        // Ensure scrollbar is set to top of panel div
        $(this.m_div[0][0]).scrollTop(0);

        // Resize the panel rectangle svg
        this.m_panelRectSvg.attr("height", rectGrowth)
                           .attr("viewBox", "0 0 " + this.m_size.width + " " + rectGrowth);

        // Make sure to remove the old rectangle for the underlying panel rectangle
        this.m_container.m_div.selectAll(".rect_twic_graph").remove();

        // Add the new panel rectangle to be shown under the new text
        this.m_panelRect = this.m_panelRectSvg.append("path")
                                              .attr("d", namespace.BottomRoundedRect(0,
                                                                                     0,
                                                                                     this.m_size.width,
                                                                                     rectGrowth,
                                                                                     namespace.Panel.prototype.s_borderRadius))
                                              .attr("class", "rect_twic_graph")
                                              .attr("id", "rect_twic_graph_textview_" + this.m_name)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                              .style("position", "absolute");

        // Ensures corner rounding in panel (NOTE: Should be re-tested 09/05/2015)
        this.m_container.m_div[0][0].style["border-radius"] = namespace.Panel.prototype.s_borderRadius + "px";
        this.m_div.style("border-radius", namespace.Panel.prototype.s_borderRadius);
        this.m_panelRectDiv[0][0].style["border-radius"] = namespace.Panel.prototype.s_borderRadius + "px";

        // 4. Re-add text svg groups
        //this.m_textGroup = this.m_groupOverlay.append("g")
        //                                      .attr("class", "group_textview_text");
        this.m_containerGroup = this.m_groupOverlay.append("g")
                                                .attr("class", "textview_container")
                                                .style("width", this.m_size.width - namespace.TextView.prototype.s_borderWidth)
                                                .style("height", this.m_size.height - namespace.TextView.prototype.s_borderWidth)
                                                .style("position", "relative")
                                                .style("overflow", "auto");

        // 5. Build the HTML text
        currentX = 50;
        currentY = 100;

        this.m_topicText = new namespace.TopicText({x: currentX, y: currentY},
                                                   this.m_size,
                                                   "",
                                                   this.m_level,
                                                   this,
                                                   this.m_linkedViews,
                                                   this.m_data);
        this.m_topicText.Draw(this.m_containerGroup);

        // Spacing between (optional) title bar and text
        /*this.m_containerGroup.append("p")
                             .append("span")
                             .style("font-family", namespace.Level.prototype.s_fontFamily)
                             .style("font-size", 22)
                             .html("&nbsp;")

        for ( var index = 0; index < p_data.json.lines_and_colors.length; index++ ) {

            words = p_data.json.lines_and_colors[index][0].split(" ");
            var lineText = "";

            currentX = 50;
            var text;

            var currentLine = this.m_containerGroup.append("p")
                                                   .style("word-spacing", namespace.Level.prototype.s_fontSpacing.Inconsolata22)
                                                   .style("display", "inline-block")
                                                   .style("line-height", "0px");

            // Spacing between div edge and text
            currentLine.append("span")
                       .style("font-family", namespace.Level.prototype.s_fontFamily)
                       .style("font-size", 22)
                       .style("opacity", 1.0)
                       .html("&nbsp;&nbsp;&nbsp;&nbsp;");

            for ( var index2 = 0; index2 < words.length; index2++ ) {

                // NOTE: undefined HACK
                if ( "-1" == p_data.json.lines_and_colors[index][1][index2] ||
                     undefined == p_data.json.lines_and_colors[index][1][index2] ){

                    text = currentLine.append("span")
                                                .attr("class", "text_word")
                                                .style("color", namespace.Level.prototype.s_palette.gold)
                                                .style("font-family", namespace.Level.prototype.s_fontFamily)
                                                .style("font-size", 22)
                                                .style("opacity", 1.0)
                                                .html(words[index2] + "&nbsp;");


                    currentX += text[0][0].offsetWidth * 0.66;
                }
                else {

                    var dlocolor = namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorLolight,
                                                 this.m_level.m_topicColors[p_data.json.lines_and_colors[index][1][index2]]);

                    var quoteType = "";
                    var quotePlace = "";
                    var tempWord = words[index2];
                    if ( "\"" == words[index2][0] || "\'" == words[index2][0] ){
                        quoteType = words[index2][0];
                        quotePlace = "b";
                        tempWord = words[index2].substring(1, words[index2].length);
                    } else if ( "\"" == words[index2][words[index2].length - 1] || "\'" == words[index2][words[index2].length - 1] ){
                        quoteType = words[index2][words[index2].length - 1];
                        quotePlace = "a";
                        tempWord = words[index2].substring(0, words[index2].length - 1);
                    }

                    if ( "b" == quotePlace ){

                        text = currentLine.append("span")
                                                    .attr("class", "text_word")
                                                    .style("color", namespace.Level.prototype.s_palette.gold)
                                                    .style("font-family", namespace.Level.prototype.s_fontFamily)
                                                    .style("font-size", 22)
                                                    .style("opacity", 1.0)
                                                    .html(quoteType);

                        currentX += text[0][0].offsetWidth * 0.66;
                    }

                    tempTempWord = ( quotePlace == "a" ) ? tempWord : tempWord + "&nbsp;";

                    text = currentLine.append("span")
                                                .attr("class", "text_coloredword")
                                                .datum({ topicID: p_data.json.lines_and_colors[index][1][index2],
                                                         locolor: dlocolor,
                                                         color:this.m_level.m_topicColors[p_data.json.lines_and_colors[index][1][index2]],
                                                         word: tempTempWord })
                                                .style("color", this.m_level.m_topicColors[p_data.json.lines_and_colors[index][1][index2]])
                                                .style("font-family", namespace.Level.prototype.s_fontFamily)
                                                .style("font-size", 22)
                                                .style("opacity", 1.0)
                                                .html(tempTempWord);

                    currentX += text[0][0].offsetWidth * 0.66;

                    if ( "a" == quotePlace ){

                        text = currentLine.append("span")
                                                    .attr("class", "text_word")
                                                    .style("color", namespace.Level.prototype.s_palette.gold)
                                                    .style("font-family", namespace.Level.prototype.s_fontFamily)
                                                    .style("font-size", 22)
                                                    .style("opacity", 1.0)
                                                    .html(quoteType + "&nbsp;");

                        currentX += text[0][0].offsetWidth * 0.66;
                    }
                }
            }

            currentY += dy;
            if ( currentY > this.m_size.height ){
                rectGrowth += dy;
            }

            // Append a break so the next line is drawn beneath
            this.m_containerGroup.append("br");
        }


        // 6. Add mousover behavior for colored and non-colored words
        this.m_div.selectAll(".text_coloredword")
                  .attr("height", rectGrowth)
                  .on(namespace.Interaction.click, function(d){
                      this.MouseBehavior(d, namespace.Interaction.click);
                      d3.event.stopPropagation();
                  }.bind(this))
                  .on(namespace.Interaction.mouseover, function(d){
                      this.MouseBehavior(d, namespace.Interaction.mouseover);
                  }.bind(this))
                  .on(namespace.Interaction.mouseout, function(d){
                      this.MouseBehavior(null, namespace.Interaction.mouseout);
                  }.bind(this));

        this.m_div.selectAll(".text_word")
                  .on(namespace.Interaction.click, function(d){
                      if ( -1 != this.m_level.m_highlightedTopic ){
                          this.MouseBehavior(null, namespace.Interaction.click);
                          d3.event.stopPropagation();
                      }
                  }.bind(this));*/


        // 7. Force container div redraw (for datashapes scaling)
        var oldContainerDivDisplay = this.m_container.m_div.style("display");
        this.m_container.m_div.style("display", "none");
        this.m_container.m_div.style("display", oldContainerDivDisplay);
    });

    namespace.TextView.method("CreateTextSVGFromJSON", function(data){

        // 1. Set starting positions/sizes

        // Start position for text
        var currentX = namespace.TextView.prototype.s_textStartPosition.x;
        var currentY = namespace.TextView.prototype.s_textStartPosition.y;

        // Initialize size of the svg for the text (initial panel height + space for rounded corners)
        var rectGrowth = this.m_size.height + namespace.Panel.prototype.s_borderRadius;

        // Pixel space per line
        var dy = namespace.TopicBar.prototype.s_textInfo.yIncrement;


        // 2. Remove old text from the view
        this.m_groupOverlay.selectAll("*").remove();


        // 3. Set up the panel components for this new text

        // Initial loop for path/panel rectangle resize (rectangle needs to be drawn first)
        for ( var index = 0; index < data.json.lines_and_colors.length; index++ ) {
            currentY += dy;
            if ( currentY > this.m_size.height ){
                rectGrowth += dy;
            }
        }

        // Resize the svg
        this.m_svg.attr("width", this.m_size.width)
                  .attr("height", rectGrowth)
                  .attr("viewBox", "0 0 " + this.m_size.width + " " + rectGrowth);

        // Ensure scrollbar is set to top of panel div
        $(this.m_div[0][0]).scrollTop(0);

        // Resize the panel rectangle svg
        this.m_panelRectSvg.attr("height", rectGrowth)
                           .attr("viewBox", "0 0 " + this.m_size.width + " " + rectGrowth);

        // Make sure to remove the old rectangle for the underlying panel rectangle
        this.m_container.m_div.selectAll(".rect_twic_graph").remove();

        // Add the new panel rectangle to be shown under the new text
        this.m_panelRect = this.m_panelRectSvg.append("path")
                                              .attr("d", namespace.BottomRoundedRect(0,
                                                                                     0,
                                                                                     this.m_size.width,
                                                                                     rectGrowth,
                                                                                     namespace.Panel.prototype.s_borderRadius))
                                              .attr("class", "rect_twic_graph")
                                              .attr("id", "rect_twic_graph_textview_" + this.m_name)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                              .style("position", "absolute");

        // Ensures corner rounding in panel (NOTE: Should be re-tested 09/05/2015)
        this.m_container.m_div[0][0].style["border-radius"] = namespace.Panel.prototype.s_borderRadius + "px";
        this.m_div.style("border-radius", namespace.Panel.prototype.s_borderRadius);
        this.m_panelRectDiv[0][0].style["border-radius"] = namespace.Panel.prototype.s_borderRadius + "px";

        // Transaprent rectangle to capture clicks outside of the topic words in context
        this.m_clickRectangle = this.m_groupOverlay.append("rect")
                                                   .attr("x", 0)
                                                   .attr("y", 0)
                                                   .attr("width", this.m_size.width)
                                                   .attr("height", rectGrowth)
                                                   .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                                   .style("opacity", 0)
                                                   .on(namespace.Interaction.click, function(){
                                                       namespace.GraphView.prototype.MouseBehavior(this, null, namespace.Interaction.click);
                                                   }.bind(this));

        // 4. Re-add text svg groups
        //this.m_textGroup = this.m_groupOverlay.append("g")
        //                                      .attr("class", "group_textview_text");
        this.m_containerGroup = this.m_groupOverlay.append("g")
                                                .attr("class", "textview_container")
                                                .style("width", this.m_size.width - namespace.TextView.prototype.s_borderWidth)
                                                .style("height", this.m_size.height - namespace.TextView.prototype.s_borderWidth)
                                                .style("position", "relative")
                                                .style("overflow", "auto");

        // 5. Build the SVG text
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

                    text = this.m_containerGroup.append("text").attr("class", "text_word")
                                                 .attr("x", currentX)
                                                 .attr("y", currentY)
                                                 .attr("dx", "0")
                                                 .attr("dy", "0")
                                                 .attr("fill", namespace.Level.prototype.s_palette.gold)
                                                 .style("font-family", namespace.Level.prototype.s_fontFamily)
                                                 .style("font-size", 22)
                                                 .style("opacity", 1.0)
                                                 .html(words[index2] + "&nbsp;");

                    currentX += text[0][0].offsetWidth * 0.66;
                }
                else {

                    //var dlocolor = namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorLolight,
                    //                             this.m_level.m_topicColors[data.json.lines_and_colors[index][1][index2]]);
                    var dlocolor = this.m_level.m_topicColorsLoBlend[data.json.lines_and_colors[index][1][index2]];

                    var quoteType = "";
                    var quotePlace = "";
                    var tempWord = words[index2];
                    if ( "\"" == words[index2][0] || "\'" == words[index2][0] ){
                        quoteType = words[index2][0];
                        quotePlace = "b";
                        tempWord = words[index2].substring(1, words[index2].length);
                    } else if ( "\"" == words[index2][words[index2].length - 1] || "\'" == words[index2][words[index2].length - 1] ){
                        quoteType = words[index2][words[index2].length - 1];
                        quotePlace = "a";
                        tempWord = words[index2].substring(0, words[index2].length - 1);
                    }

                    if ( "b" == quotePlace ){

                        text = this.m_containerGroup.append("text").attr("class", "text_word")
                                                     .attr("x", currentX)
                                                     .attr("y", currentY)
                                                     .attr("dx", "0")
                                                     .attr("dy", "0")
                                                     .attr("fill", namespace.Level.prototype.s_palette.gold)
                                                     .style("font-family", namespace.Level.prototype.s_fontFamily)
                                                     .style("font-size", 22)
                                                     .style("opacity", 1.0)
                                                     .html(quoteType);
                        currentX += text[0][0].offsetWidth * 0.66;
                    }

                    tempTempWord = ( quotePlace == "a" ) ? tempWord : tempWord + "&nbsp;";
                    text = this.m_containerGroup.append("text").attr("class", "text_coloredword")
                                                 .datum({ topicID: data.json.lines_and_colors[index][1][index2],
                                                          locolor: dlocolor,
                                                          color:this.m_level.m_topicColors[data.json.lines_and_colors[index][1][index2]],
                                                          word: tempTempWord })
                                                 .attr("x", currentX)
                                                 .attr("y", currentY)
                                                 .attr("dx", "0")
                                                 .attr("dy", "0")
                                                 .attr("fill", this.m_level.m_topicColors[data.json.lines_and_colors[index][1][index2]])
                                                 .style("font-family", namespace.Level.prototype.s_fontFamily)
                                                 .style("font-size", 22)
                                                 .style("opacity", 1.0)
                                                 .html(tempTempWord);

                    currentX += text[0][0].offsetWidth * 0.66;
                    //currentX += text[0][0].offsetWidth * 0.05;

                    if ( "a" == quotePlace ){

                        text = this.m_containerGroup.append("text").attr("class", "text_word")
                                                     .attr("x", currentX)
                                                     .attr("y", currentY)
                                                     .attr("dx", "0")
                                                     .attr("dy", "0")
                                                     .attr("fill", namespace.Level.prototype.s_palette.gold)
                                                     .style("font-family", namespace.Level.prototype.s_fontFamily)
                                                     .style("font-size", 22)
                                                     .style("opacity", 1.0)
                                                     .html(quoteType + "&nbsp;");
                        currentX += text[0][0].offsetWidth * 0.66;
                    }
                }

                //currentX += text[0][0].offsetWidth * 0.67;
                //currentX += text[0][0].offsetWidth;
                //currentX += text[0][0].offsetWidth * 0.66;
            }

            currentY += dy;
            if ( currentY > this.m_size.height ){
                rectGrowth += dy;
            }
        }


        // 6. Add mousover behavior for colored and non-colored words
        this.m_svg.selectAll(".text_coloredword")
                  .attr("height", rectGrowth)
                  .on(namespace.Interaction.click, function(d){
                      this.MouseBehavior(d, namespace.Interaction.click);
                  }.bind(this))
                  .on(namespace.Interaction.mouseover, function(d){
                      this.MouseBehavior(d, namespace.Interaction.mouseover);
                  }.bind(this))
                  .on(namespace.Interaction.mouseout, function(d){
                      this.MouseBehavior(null, namespace.Interaction.mouseout);
                  }.bind(this));

        this.m_svg.selectAll(".text_word")
                  .on(namespace.Interaction.click, function(d){
                      if ( -1 != this.m_level.m_highlightedTopic ){
                          this.MouseBehavior(null, namespace.Interaction.click);
                      }
                  }.bind(this));


        // 7. Force container div redraw (for datashapes scaling)
        var oldContainerDivDisplay = this.m_container.m_div.style("display");
        this.m_container.m_div.style("display", "none");
        this.m_container.m_div.style("display", oldContainerDivDisplay);
    });

    namespace.TextView.method("DarkenAllWords", function(){

        /*this.m_svg.selectAll(".text_word")
                  .attr("fill", namespace.Level.prototype.s_palette.logold);
        this.m_svg.selectAll(".text_coloredword")
                  .attr("fill", function(d){ return d.locolor; });*/

        // Reference to the current level for D3 functions
        var myLevel = this.m_level;

        this.m_div.selectAll(".text_word")
                  .style("color", namespace.Level.prototype.s_palette.logold);
        var myLevel = this.m_level;
        this.m_div.selectAll(".text_coloredword")
                  .style("color", function(d){

                    // Trick: Initially recover topic ID from span style color
                    if ( undefined == d ){
                        var newData = myLevel.AddDataToSpanBasedOnColor(this);
                        return newData.locolor;
                    } else {
                        return d.locolor;
                    }
                });
    });

    namespace.TextView.method("DarkenTopicText", function(p_data){

        /*this.m_svg.selectAll(".text_coloredword")
                  .attr("fill", function(d){ return d.locolor; });*/

        this.m_div.selectAll(".text_coloredword")
                  .style("color", function(d){ return d.locolor; });
    });

    namespace.TextView.method("Hide", function(p_hide){

        if ( p_hide ){

            // Save the current dimensions for unhiding
            this.m_recentDims = { width: this.m_size.width,
                                  height: this.m_size.height + this.m_controlBar.m_size.height,
                                  //extendedHeight: parseFloat(this.m_svg.attr("height")) };
                                  extendedHeight: parseFloat(this.m_div.attr("scrollHeight")) };
            this.m_recentPos = { x: parseFloat(this.m_container.m_div.style("left")),
                                 y: parseFloat(this.m_container.m_div.style("top")) };

            // Transition will be to the minimum panel width and size of the control bar only
            var transition = {
                position: { x: this.m_recentPos.x, y: this.m_recentPos.y },
                size: { width: namespace.Panel.prototype.s_minimumPanelSize,
                        height: namespace.Control.prototype.s_defaultThickness },
                duration: 500
            };

            // Disable resizing
            this.ToggleResize(true);
        } else {

            this.m_recentPos = { x: parseFloat(this.m_container.m_div.style("left")),
                                 y: parseFloat(this.m_container.m_div.style("top")) };

            // Make the panel rectangle visible again
            this.m_panelRectDiv.style("opacity", 1.0);

            // Bring back to size before hiding
            var transition = {
                position: { x: this.m_recentPos.x, y: this.m_recentPos.y },
                size: { width: this.m_recentDims.width, height: this.m_recentDims.height },
                duration: 500
            };

            this.m_container.SetPosition({ x: parseFloat(this.m_container.m_div.style("left")),
                                           y: parseFloat(this.m_container.m_div.style("top")) });

            // Enable resizing
            this.ToggleResize(false);
        }

        // Save the current hidden state
        this.m_hidden = p_hide;

        // Change the control bar text
        this.AddBarText(this.m_hidden);

        if ( this.m_hidden ){

            // Resize the container
            this.Move(transition, "end", function(){

                // Reorganize the panels
                this.m_level.OrganizePanels();

                // Make sure the shrunken bar is fully rounded
                this.m_controlBar.m_barPath.transition()
                                           .duration(10)
                                           .attr("d",
                                                 namespace.FullyRoundedRect(this.m_coordinates.x,
                                                                            this.m_coordinates.y,
                                                                            this.m_container.m_size.width,
                                                                            namespace.Control.prototype.s_defaultThickness,
                                                                            namespace.Panel.prototype.s_borderRadius));

                // Hide the panel rectangle
                this.m_panelRectDiv.style("opacity", 0);

            }.bind(this), false);
        } else {

            this.m_controlBar.m_barPath.attr("d",
                                             namespace.TopRoundedRect(this.m_coordinates.x,
                                                                      this.m_coordinates.y,
                                                                      this.m_container.m_size.width,
                                                                      namespace.Control.prototype.s_defaultThickness,
                                                                      namespace.Panel.prototype.s_borderRadius));


            this.Move(transition, "end", function(){

                // Reorganize the panels
                this.m_level.OrganizePanels();

            }.bind(this), true);
        }
    });

    namespace.TextView.method("HighlightAllWords", function(){

        /*this.m_svg.selectAll(".text_word")
                  .attr("fill", namespace.Level.prototype.s_palette.gold);
        this.m_svg.selectAll(".text_coloredword")
                  .attr("fill", function(d){ return d.color; });*/

        // Reference to the current level for D3 functions
        var myLevel = this.m_level;

        this.m_div.selectAll(".text_word")
                  .style("color", namespace.Level.prototype.s_palette.gold);
        this.m_div.selectAll(".text_coloredword")
                  .style("color", function(d){

                    // Trick: Initially recover topic ID from span style color
                    if ( undefined == d ){
                        var newData = myLevel.AddDataToSpanBasedOnColor(this);
                        return newData.color;
                    } else {
                        return d.color;
                    }
                });
    });

    namespace.TextView.method("HighlightTopicText", function(p_data){

        // Save the highlighted topic for future reference
        this.m_level.m_highlightedTopic = p_data.topicID;

        // Reference to the current level for D3 functions
        var myLevel = this.m_level;

        /*this.m_svg.selectAll(".text_coloredword")
                  .filter(function(d){ return d.topicID == p_data.topicID; })
                  .attr("fill", function(d){ return d.color; });

        this.m_svg.selectAll(".text_coloredword")
                  .filter(function(d){ return d.topicID != p_data.topicID; })
                  .attr("fill", function(d){ return d.locolor; });*/

        this.m_div.selectAll(".text_coloredword")
                  .filter(function(d){

                    // Trick: Initially recover topic ID from span style
                    if ( undefined == d ){
                        var newData = myLevel.AddDataToSpanBasedOnColor(this);
                        return newData.topicID == p_data.topicID;
                    } else {
                        return d.topicID == p_data.topicID;
                    }
                  })
                  .style("color", function(d){ return d.color; });

        this.m_div.selectAll(".text_coloredword")
                  .filter(function(d){

                    // Trick: Initially recover topic ID from span style
                    if ( undefined == d ){
                        var newData = myLevel.AddDataToSpanBasedOnColor(this, myLevel);
                        return newData.topicID != p_data.topicID;
                    }
                    else {
                        return d.topicID != p_data.topicID;
                    }
                  })
                  .style("color", function(d){ return d.locolor; });
    });

    namespace.TextView.method("Load", function(){

        //this.m_level.m_queue.defer(function(callback){

            // Queue up loading of the text
            d3.json(this.m_filename, function(error, data) {

                // Save a reference to the JSON data
                this.m_data = data.document;

                var textData = { json: this.m_data,
                                 clusterIndex: 0,
                                 topicID: 0,
                                 color: this.m_level.m_topicColors[0] };

                // Update the panel to present the new text
                var initialPauseState = this.IsPaused();
                this.Pause(false);
                this.Update(textData, namespace.Interaction.click);
                if ( initialPauseState ){
                    this.Pause(true);
                }

                //callback(null, this.m_data);

            }.bind(this));
        //}.bind(this));
    });

    namespace.TextView.method("MouseBehavior", function(p_data, p_mouseEventType){

        // Unhighlighted
        if ( -1 == this.m_level.m_highlightedTopic ){

            // (1) Unhighlighted (Is Always Unpaused)
            //   (A) Mouseover --> Highlights topic text and topic elsewhere in linked panels
            //   (B) Click --> Mimics mouseover when unhighlighted (A) --> Pauses state of panel and linked panels
            //   (C) Double-Click --> Mimics click when unhighlighted (B)
            //   (D) Mouseout --> Nothing

            switch ( p_mouseEventType ){

                // (A) Mouseover --> Highlights topic text and topic elsewhere in linked panels
                case namespace.Interaction.mouseover:

                    this.Update(p_data, namespace.Interaction.mouseover);
                    for ( var index = 0; index < this.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == this.m_linkedViews[index].update ){
                            this.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                    }

                    break;

                // (B) Click --> Mimics mouseover when unhighlighted (A) --> Pauses state of panel and linked panels
                case namespace.Interaction.click:
                // (C) Double-Click --> Mimics click when unhighlighted (B)
                case namespace.Interaction.dblclick:

                    this.Update(p_data, namespace.Interaction.mouseover);
                    this.Pause(true);
                    for ( var index = 0; index < this.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == this.m_linkedViews[index].update ){

                            if ( this.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                this.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.click);
                            }
                            this.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                        this.m_linkedViews[index].panel.Pause(true);
                    }

                    break;

                // (D) Mouseout --> Nothing
                case namespace.Interaction.mouseout:

                    break;
            }
        // Highlighted
        } else {

            // (2) Highlighted
            //   (A) Paused
            //     (I) Mouseover --> Nothing
            //     (II) Click
            //       (a) Same ring --> Unpauses panel and linked panels --> Unhighlights all shapes
            //       (b) Different ring --> Mimics click when unhighlighted (1.B)
            //     (III) Double-Click --> Mimics Click (II)
            //     (IV) Mouseout --> Nothing
            //  (B) Unpaused
            //    (I) Mouseover --> Mimics Mouseover Unhighlighted (1.A)
            //    (II) Click - Any ring --> Pauses panel and linked panels
            //    (III) Double-Click --> Mimics Click (II)
            //    (IV) Mouseout --> Unhighlights all text
            // Paused
            if ( this.IsPaused() ){

                switch ( p_mouseEventType ){

                    // (I) Mouseover --> Nothing
                    case namespace.Interaction.mouseover:

                        break;

                    // (II) Click
                    case namespace.Interaction.click:
                    // (III) Double-Click --> Mimics Click (II)
                    case namespace.Interaction.dblclick:

                        // (a) Same topic text --> Unpauses panel and linked panels --> Unhighlights all shapes
                        if ( null == p_data || p_data.topicID == this.m_level.m_highlightedTopic ){

                            this.Pause(false);
                            this.Update(null, namespace.Interaction.mouseover);
                            for ( var index = 0; index < this.m_linkedViews.length; index++ ){

                                this.m_linkedViews[index].panel.Pause(false);
                                this.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                            }
                        // (b) Different topic text --> Mimics click when unhighlighted (1.B)
                        } else {

                            this.Pause(false);
                            this.Update(p_data, namespace.Interaction.mouseover);
                            this.Pause(true);
                            for ( var index = 0; index < this.m_linkedViews.length; index++ ){

                                this.m_linkedViews[index].panel.Pause(false);
                                if ( namespace.Interaction.mouseover == this.m_linkedViews[index].update ){

                                    if ( this.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                        this.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.click);
                                    }
                                    this.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                                }
                                this.m_linkedViews[index].panel.Pause(true);
                            }
                        }

                        break;

                    // (IV) Mouseout --> Nothing
                    case namespace.Interaction.mouseout:

                        break;
                }
            // Unpaused
            } else {

                switch ( p_mouseEventType ){

                    // (I) Mouseover --> Mimics Mouseover Unhighlighted (1.A)
                    case namespace.Interaction.mouseover:

                        this.Update(p_data, namespace.Interaction.mouseover);
                        for ( var index = 0; index < this.m_linkedViews.length; index++ ){

                            if ( namespace.Interaction.mouseover == this.m_linkedViews[index].update ){
                                this.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                            }
                        }

                        break;

                    // (II) Click - Any topic text --> Pauses panel and linked panels
                    case namespace.Interaction.click:
                    // (III) Double-Click --> Mimics Click (II)
                    case namespace.Interaction.dblclick:

                        this.Update(p_data, namespace.Interaction.mouseover);
                        this.Pause(true);
                        for ( var index = 0; index < this.m_linkedViews.length; index++ ){
                            if ( namespace.Interaction.mouseover == this.m_linkedViews[index].update ){

                                if ( this instanceof namespace.DataBar ){
                                    this.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.click);
                                }
                                this.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                            }
                            this.m_linkedViews[index].panel.Pause(true);
                        }

                        break;

                    // (IV) Mouseout --> Unhighlights all text
                    case namespace.Interaction.mouseout:

                        this.Update(null, namespace.Interaction.mouseover);
                        for ( var index = 0; index < this.m_linkedViews.length; index++ ){
                            this.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                        }

                        break;
                }

            }
        }
    });

    namespace.TextView.method("Move", function(p_transition, p_callbackTiming, p_callback, p_expand){

        // Determine the traits of the given transition
        if ( p_transition.position ){
            this.m_container.SetPosition(p_transition.position);
        }
        if ( p_transition.size ) {
            this.m_container.SetSize(p_transition.size);
        }

        // NOTE: CSS max-width, max-height never changes

        // Container transitions to its position/dimensions
        this.m_container.m_div.transition()
                              .duration(p_transition.duration)
                              .style("left", this.m_container.m_coordinates.x)
                              .style("top", this.m_container.m_coordinates.y)
                              .style("width", this.m_container.m_size.width)
                              .style("height", this.m_container.m_size.height);

        // NOTE: Panels and control bars are relatively positioned in their parent container div

        // Panel and its svg transition to new position/dimensions
        this.m_div.transition().duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .style("height", this.m_size.height)
                               .each("start", function(p_transition, p_callbackTiming, p_callback, p_expand){

                                   this.m_panelRectDiv.transition()
                                                      .duration(p_transition.duration)
                                                      .style("width", p_transition.size.width)
                                                      .style("height", p_transition.size.height);

                                   this.m_panelRectSvg.transition()
                                                      .duration(p_transition.duration)
                                                      .attr("width", p_transition.size.width)
                                                      .attr("height", p_transition.size.height)
                                                      .attr("viewBox", "0 0 " +
                                                                       p_transition.size.width + " " + p_transition.size.height);

                                   this.m_panelRect.transition()
                                                   .duration(p_transition.duration)
                                                   .attr("d", namespace.BottomRoundedRect(0, 0,
                                                                  p_transition.size.width,
                                                                  p_transition.size.height,
                                                                  namespace.Panel.prototype.s_borderRadius))
                                                    .each("end", function(){

                                                        if ( "end" == p_callbackTiming ){

                                                            p_callback();
                                                        }
                                                    }.bind(this, p_callbackTiming, p_callback));

                                   if ( "start" == p_callbackTiming ){
                                       p_callback();
                                   }

                               }.bind(this, p_transition, p_callbackTiming, p_callback, p_expand));

        // Control bar and its path (not svg) transition to new position/width
        this.m_controlBar.m_size.width = this.m_size.width;
        this.m_controlBar.m_div.transition()
                               .duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .each("start", function(p_transition){

                                   this.m_controlBar.m_barPath.transition()
                                                              .duration(p_transition.duration)
                                                              .attr("d", this.m_controlBar.GetRectPath());
                                   this.m_controlBar.m_svg.transition()
                                                          .duration(p_transition.duration)
                                                          .attr("width", this.m_size.width)
                                                          .attr("viewBox", "0 0 " + (this.m_size.width) + " " + this.m_controlBar.m_size.height);

                               }.bind(this, p_transition));
    });

    namespace.TextView.method("OnResize", function(p_packery){

        var packeryReorganize = true;
        if ( undefined !== p_packery ){
            packeryReorganize = p_packery;
        }

        var containerWidth = parseFloat(this.m_container.m_div.style("width"));
        var containerHeight = parseFloat(this.m_container.m_div.style("height"));
        var controlBarHeight = ( this.m_controlBar ) ? this.m_controlBar.m_size.height : 0;

        // Control bar resize
        if ( this.m_controlBar ){

            this.m_controlBar.m_size.width = containerWidth;
            this.m_controlBar.m_div.style("width", containerWidth);
            this.m_controlBar.m_svg.attr("width", containerWidth)
                                   .attr("viewBox", "0 0 " + containerWidth + " " + controlBarHeight);
        }

        // Panel resize (vars for potentially faster access to the dimension values)
        this.m_size.width = Math.abs(containerWidth);
        this.m_size.height = Math.abs(containerHeight - controlBarHeight);
        var divWidth = this.m_size.width;
        var divHeight = this.m_size.height;

        // Difference - TextView.OnResize() does not resize (and thus, scale) svg
        this.m_div.style("width", divWidth)
                  .style("height", divHeight);

        // Panel rect resize - Difference TextView: divHeight + namespace.Panel.prototype.s_borderRadius
        this.m_panelRectDiv.style("width", divWidth)
                           .style("height", divHeight + namespace.Panel.prototype.s_borderRadius);
        this.m_panelRectSvg.attr("width", divWidth)
                           .attr("height", divHeight + namespace.Panel.prototype.s_borderRadius)
                           .attr("viewBox", "0 0 " + divWidth + " " + (divHeight + namespace.Panel.prototype.s_borderRadius));

        // Might be outdated resize code
        if ( containerWidth > parseInt(this.m_div.style("max-width")) ) {
            this.m_div.style("max-width", containerWidth);
            this.m_panelRectDiv.style("max-width", containerWidth);
        }
        if ( containerHeight > parseInt(this.m_div.style("max-height") + controlBarHeight) ) {
            this.m_div.style("max-height", containerHeight - controlBarHeight);
            this.m_panelRectDiv.style("max-height", containerHeight - controlBarHeight);
        }

        // Difference - divHeight + namespace.Panel.prototype.s_borderRadius
        this.m_panelRect.attr("d", namespace.BottomRoundedRect(0, 0, divWidth, divHeight + namespace.Panel.prototype.s_borderRadius,
                                                               namespace.Panel.prototype.s_borderRadius));

        // Re-append this container to the level div to bump up its z-order
        this.m_container.m_div.node().parentNode.appendChild(this.m_container.m_div.node());

        // Packery re-layout call
        if ( packeryReorganize ){
            $(this.m_level.m_div[0]).packery();
        }

        if ( this.m_controlBar ){
            this.m_controlBar.UpdateBarPath(this.m_controlBar.GetRectPath());
        }

        // Force level HTML redraw in order to overcome bug where SVG elements not resized until next redraw occurs
        $(this.m_level.m_div.node().parentNode).hide().show(0);
    });

    namespace.TextView.method("SetText", function(p_name, p_isURL){

        // Save the filename
        this.m_filename = ( p_isURL ) ? p_name : namespace.TopicRectangle.prototype.jsonDirectory + p_name;
    });

    namespace.TextView.prototype.s_borderWidth = 5;
    namespace.TextView.prototype.s_textStartPosition = {x: 50, y: 100};
    namespace.TextView.prototype.s_datashapeClassName = "text_shape";
    namespace.TextView.prototype.s_datashapeClassSelect = ".text_shape";
    namespace.TextView.prototype.s_datashapeTextClassName = "text_shape_text";
    namespace.TextView.prototype.s_datashapeTextClassSelect = ".text_shape_text";


    namespace.PublicationView = function(p_coordinates, p_size, p_level, p_name, p_filename){

        namespace.GraphView.apply(this, arguments);

        this.m_name = p_name;
        this.m_filename = p_filename;
        this.m_objectsJSON = [];
        this.m_twicObjects = [];

        this.m_numberTopics = 5;
    };
    namespace.PublicationView.inherits(namespace.GraphView);

    namespace.PublicationView.method("Initialize", function(p_parentDiv){

        // Set up the panel container to the given coordinates
        this.m_container.SetPosition(this.m_coordinates);
        this.m_container.m_div.style("left", this.m_container.m_coordinates.x);
        this.m_container.m_div.style("top", this.m_container.m_coordinates.y);

        // Top/left coordinates are relative to the containing div/level
        this.m_coordinates.x = 0;
        this.m_coordinates.y = 0;

        // Div and svg for panel rect (required because of resizing behavior inconsistent with scaling data shapes)
        var controlBarHeight = ( this.m_controlBar ) ? this.m_controlBar.m_size.height - 1 : 0;
        this.m_panelRectDiv = p_parentDiv.append("div")
                                        .attr("class", "div_panel_rect")
                                        .attr("id", "div_panel_rect_" + this.m_name)
                                        .style("position", "absolute")
                                        .style("left", this.m_coordinates.x)
                                        .style("top", this.m_coordinates.y + controlBarHeight)
                                        .style("width", this.m_size.width)
                                        .style("height", this.m_size.height)
                                        .style("max-width", this.m_size.width)
                                        .style("max-height", this.m_size.height);
        this.m_panelRectSvg = this.m_panelRectDiv.append("svg")
                                                 .attr("x", this.m_coordinates.x)
                                                 .attr("y", this.m_coordinates.y)
                                                 .attr("width", this.m_size.width)
                                                 .attr("height", this.m_size.height)
                                                 .attr("viewBox", "0 0 " + this.m_size.width + " " + this.m_size.height);

        // Add the rectangle where all graph data will sit
        this.m_panelRect = this.m_panelRectSvg.append("path")
                                              .attr("d",
                                                    namespace.BottomRoundedRect(this.m_coordinates.x,
                                                                                this.m_coordinates.y,
                                                                                this.m_size.width,
                                                                                this.m_size.height,
                                                                                namespace.Panel.prototype.s_borderRadius))
                                              .attr("class", "rect_twic_graph")
                                              .attr("id", "rect_twic_graph_publicationview_" + this.m_name)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                              .style("position", "absolute");

        // Set up the div for the publication view
        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_graph_publicationview div_twic_graph twic_panel")
                                .attr("id", "div_twic_graph_publicationview_" + this.m_name)
                                .style("left", this.m_coordinates.x)
                                .style("top", this.m_coordinates.y + controlBarHeight)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height)
                                .style("max-width", this.m_size.width)
                                .style("max-height", this.m_size.height)
                                .style("overflow", "scroll")
                                .style("border-radius", namespace.Panel.prototype.s_borderRadius)
                                .style("position", "absolute");

        // Set up the svg for the publication view
        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_graph")
                               .attr("id", "svg_twic_graph_publicationview_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height)
                               .attr("viewBox", "0 0 " + this.m_size.width + " " + this.m_size.height);

        // Add group and rectangle for trapping mouse events in the graph
        this.m_groupOverlay = this.m_svg.append("g")
                                        .attr("class","group_twic_graph_overlay")
                                        .attr("id", "group_twic_graph_overlay_publicationview_" + this.m_name);

        this.m_clickRectangle = this.m_groupOverlay.append("rect")
                                                   .attr("x", 0)
                                                   .attr("y", 0)
                                                   .attr("width", this.m_size.width)
                                                   .attr("height", this.m_size.height)
                                                   .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                                   .style("opacity", 0)
                                                   .on(namespace.Interaction.click, function(){
                                                       namespace.GraphView.prototype.MouseBehavior(this, null, namespace.Interaction.click);
                                                   }.bind(this));

        this.m_clusterSvgGroup = this.m_groupOverlay.append("g").attr("id", "clustersvg_group")
                                                       .attr("width", this.m_size.width)
                                                       .attr("height", this.m_size.height);

        // Make the bar text opaque initially
        this.m_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                   .style("opacity", 1.0);

        // Load the publication-order JSON
        this.Load();

        // Add the corresponding text rectangles to the panel once the JSON is loaded
        this.Start();

        // Make the publication view draggable and resizable
        this.MakeDraggable();

        // Text View will be open
        this.m_underlyingPanelOpen = true;
    });

    namespace.PublicationView.method("Start", function(){

        // Extra Notes for future implementation
        // Draw lines/linkes between docs in order, when width exceeds panel width
        // draw ____| line down and to the left like this
        // Append TWiC object svg elements to the nodes with corresponding bound data

        // Wait till all JSON is loaded
        this.m_level.m_queue.await(function(){

            // Add my text to the container's control bar
            this.AddBarText(false);

            // Can only make resizable once control bar text is in place
            this.MakeResizable(false);

            // Calculate mid-point positions for each page
            var currentPage = 0;
            var pageInfo = []; // {start: "", mid: ""} start is absolute to the panel, mid is relative to start
            var currentHeight = 0;

            var pagesStartPosition = this.m_size.height >> 4; // Starting position for texts is 1/8 panel height
            var pageSpacing = this.m_size.height >> 3;
            var currentPagesOffset = pagesStartPosition;
            var currentRadius = 0;
            for ( var index = 0; index < this.m_twicObjects.length; index++ ){

                if ( index + 1 < this.m_twicObjects.length && parseInt(this.m_data.texts[index].page) - 1 > currentPage ){

                    pageInfo.push({start: currentPagesOffset, mid: currentHeight >> 1, r: currentRadius});
                    currentPagesOffset += currentHeight + pageSpacing;
                    currentHeight = 0;
                    currentPage++
                }

                if ( this.m_twicObjects[index].m_size.height + (namespace.TopicRectangle.prototype.borderWidth * 2 * this.m_numberTopics) > currentHeight ){
                    currentHeight = this.m_twicObjects[index].m_size.height + (namespace.TopicRectangle.prototype.borderWidth * 2 * this.m_numberTopics);
                    currentRadius = this.m_twicObjects[index].m_radius;
                }
            }
            pageInfo.push({start: currentPagesOffset, mid: currentHeight >> 1, r: currentRadius});

            // Draw the text rectangles and resize the panel as necessary
            var textSpacing = this.m_size.width >> 4; // Text spacing is 1/8 the width of the panel
            var currentXOffset = textSpacing;
            currentPage = 0;
            for ( var index = 0; index < this.m_twicObjects.length; index++ ){

                // Determine if texts are on the next "page"
                if ( parseInt(this.m_data.texts[index].page) - 1 > currentPage ){

                    currentPage++;
                    currentXOffset = textSpacing;
                }

                // Determine the text coordinates via its page and item count
                this.m_twicObjects[index].m_coordinates = { x: currentXOffset,
                                                            y: pageInfo[currentPage].start + pageInfo[currentPage].mid - (this.m_twicObjects[index].m_size.height >> 1) };

                // Draw the text rectangle and rectangular topic "bullseye"
                this.m_twicObjects[index].Draw();

                // Alter the svg, panel rectangle, and divs to the needed limits to fit all of the texts
                if ( index + 1 == this.m_twicObjects.length ){

                    // Resize the svg and panel rectangle
                    var rectGrowth = pageInfo[currentPage].start + (2 * pageInfo[currentPage].mid) + (pageInfo[currentPage].r);
                    this.m_svg.attr("height", rectGrowth)
                              .attr("viewBox", "0 0 " + this.m_size.width + " " + rectGrowth);
                    this.m_panelRectSvg.attr("height", rectGrowth)
                                       .attr("viewBox", "0 0 " + this.m_size.width + " " + rectGrowth);
                    this.m_container.m_div.selectAll(".rect_twic_graph").remove();
                    this.m_panelRect = this.m_panelRectSvg.append("path")
                                                          .attr("d", namespace.BottomRoundedRect(0,
                                                                                                 0,
                                                                                                 this.m_size.width,
                                                                                                 rectGrowth,
                                                                                                 namespace.Panel.prototype.s_borderRadius))
                                                          .attr("class", "rect_twic_graph")
                                                          .attr("id", "rect_twic_graph_publicationview_" + this.m_name)
                                                          .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                                          .style("position", "absolute");
                    this.m_div.style("border-radius", namespace.Panel.prototype.s_borderRadius);
                    this.m_panelRectDiv.style("border-radius", namespace.Panel.prototype.s_borderRadius);
                }

                currentXOffset += textSpacing + this.m_twicObjects[index].m_size.width + (namespace.TopicRectangle.prototype.borderWidth * 2 * this.m_numberTopics);
            }

            // Draw the lines in between texts and the titles for each text
            currentPage = 0;
            for ( var index = 0; index < this.m_twicObjects.length; index++ ){

                // Determine if texts are on the next "page"
                if ( parseInt(this.m_data.texts[index].page) - 1 > currentPage ){

                    currentPage++;
                }

                // Draw the line between this and the next text
                if ( index + 1 < this.m_twicObjects.length &&
                     this.m_data.texts[index + 1].page == this.m_data.texts[index].page){

                    this.m_clusterSvgGroup.append("line")
                                          .attr("stroke-linecap", "square")
                                          .attr("x1", this.m_twicObjects[index].m_coordinates.x /*+ (this.m_twicObjects[index].m_size.width >> 1)*/ + this.m_twicObjects[index].m_size.width + (this.m_numberTopics * namespace.TopicRectangle.prototype.borderWidth))
                                          .attr("y1", pageInfo[currentPage].start + pageInfo[currentPage].mid)
                                          .attr("x2", this.m_twicObjects[index + 1].m_coordinates.x/* + (this.m_twicObjects[index + 1].m_size.width >> 1)*/ - (this.m_numberTopics * namespace.TopicRectangle.prototype.borderWidth))
                                          .attr("y2", pageInfo[currentPage].start + pageInfo[currentPage].mid)
                                          .style("stroke", namespace.Level.prototype.s_palette.gold)
                                          .style("stroke-width", 5)
                                          .style("opacity", TWiC.TopicBullseye.s_semihighlightedOpacity);
                }

                // Add the title of the text below the text rectangle
                this.m_twicObjects[index].AddTextTag(this.m_data.texts[index].title, 20, TWiC.Level.prototype.s_palette.gold,
                                                     {x: this.m_twicObjects[index].m_coordinates.x - ((7 * this.m_data.texts[index].title.length) >> 1),
                                                      y: this.m_twicObjects[index].m_coordinates.y + (2.85 * this.m_twicObjects[index].m_radius)},
                                                     0.0);

            }

            // Re-append all text rectangles to the DOM to make sure they are above the joining lines
            for ( var index = 0; index < this.m_twicObjects.length; index++ ){
                var textRectGroup = d3.select("#textrect_node_" + this.m_twicObjects[index].m_name);
                textRectGroup.node().parentNode.appendChild(textRectGroup.node());
            }

            // Start with all data shapes highlights
            this.HighlightAllDataShapes(true);

        }.bind(this));
    });

    namespace.PublicationView.method("Update", function(p_data, p_updateType){

        // Update handles mouseover of cluster/text rectangles

        // Click freezes highlighting (handled in the datashape)

        // Doubleclick opens information on this text in the TBD doc information bar

        if ( !this.m_paused ){

            if ( p_updateType && namespace.Interaction.mouseover == p_updateType ){

                if ( null != p_data ){
                    this.HighlightAllDataShapesWithTopic(p_data);
                // Otherwise, this is a mouseout from a text rectangle.
                } else {
                    this.HighlightAllDataShapes(true);
                }
            }
            else if ( p_updateType && namespace.Interaction.dblclick == p_updateType ){

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
        else {

         if ( p_updateType && namespace.Interaction.dblclick == p_updateType ){

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

    namespace.PublicationView.method("AddBarText", function(p_altText){

        this.m_controlBar.AddText(function(p_controlBar){

            if ( !p_altText ){

                if ( !this.m_textFirstSet ){
                    this.m_textPos = { x: p_controlBar.GetNextWidgetPos().x, y: p_controlBar.GetNextWidgetPos().y };
                    this.m_textFirstSet = true;
                }

                p_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                      .style("opacity", 1.0);

                if ( null == p_controlBar.m_barText ) {
                    p_controlBar.m_barText = p_controlBar.m_controlGroup.append("text")
                                                            .attr("x", this.m_textPos.x)
                                                            .attr("y", this.m_textPos.y);
                }

                if ( null != this.m_data ){

                    this.m_controlBar.m_barText.selectAll("*").remove();

                    p_controlBar.m_barText.append("tspan")
                                          .html("TWiC:&nbsp;")
                                          .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                          .style("font-family", namespace.Level.prototype.s_fontFamily)
                                          .style("font-size", 25);

                    p_controlBar.m_barText.append("tspan")
                                          .html("\"" + this.m_data.title + "\"")
                                          .attr("fill", namespace.Level.prototype.s_palette.gold)
                                          .style("font-family", namespace.Level.prototype.s_fontFamily)
                                          .style("font-size", 23);

                    /*p_controlBar.m_barText.append("tspan")
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
                                          .style("font-size", 21);*/
                }
            } else {

                this.m_controlBar.m_barText.selectAll("*").remove();

                p_controlBar.m_barText.append("tspan")
                                      .html("TWiC:&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);

                p_controlBar.m_barText.append("tspan")
                                      .html("Publication View")
                                      .attr("fill", namespace.Level.prototype.s_palette.gold)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);
            }
        }.bind(this));
    });

    namespace.PublicationView.method("DarkenAllDataShapes", function(){

        // Darken all clusters
        var allShapes = this.m_svg.selectAll(TWiC.PublicationView.prototype.s_datashapeClassSelect);
        allShapes.each(function(d){

            if ( "path" == this.nodeName || "circle" == this.nodeName ){
                d3.select(this).style("fill", d.locolor)
                               .style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
            } else if ( "rect" == this.nodeName ){
                d3.select(this).style("stroke", d.locolor)
                               .style("stroke-opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
            } else if ( "g" == this.nodeName ){
                d3.select(this).selectAll("rect").style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
                d3.select(this).selectAll("path").style("opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
            }
        });

        // Hide all text
        this.m_svg.selectAll(TWiC.PublicationView.prototype.s_datashapeTextClassSelect)
                  .selectAll("tspan")
                  .style("opacity", 0.0);
    });

    namespace.PublicationView.method("HighlightAllDataShapes", function(p_showText){

        // All shapes get highlighted
        var allShapes = this.m_svg.selectAll(TWiC.PublicationView.prototype.s_datashapeClassSelect);
        allShapes.each(function(d){

            if ( "path" == this.nodeName || "circle" == this.nodeName ){
                d3.select(this).style("fill", d.color)
                               .style("opacity", 1.0);
            } else if ( "rect" == this.nodeName ){
                d3.select(this).style("stroke", d.color)
                               .style("opacity", 1.0)
                               .style("stroke-opacity", 1.0);
                if ( d.shapeRef && d.shapeRef.m_textRect.classed("text_info_rect")){
                    d.shapeRef.m_textRect.attr("opacity", 1.0)
                                         .attr("stroke-opacity", 1.0);
                }

            } else if ( "g" == this.nodeName ) {
                d3.select(this).selectAll("rect").style("opacity", 1.0);
                d3.select(this).selectAll("path").style("opacity", 1.0);
            }
        });

        // Text highlighting is optional
        if ( p_showText ){
            this.m_svg.selectAll(TWiC.PublicationView.prototype.s_datashapeTextClassSelect)
                      .selectAll("tspan")
                      .style("opacity", 1.0);
        } else {
            this.m_svg.selectAll(TWiC.PublicationView.prototype.s_datashapeTextClassSelect)
                      .selectAll("tspan")
                      .style("opacity", 0.0);
        }
    });

    namespace.PublicationView.method("HighlightAllDataShapesWithTopic", function(p_data){

        // Darken all shapes and text first
        this.DarkenAllDataShapes();

        // Save the highlighted topic for future reference
        this.m_level.m_highlightedTopic = p_data.topicID;

        // Highlight all shapes that represent the given topic
        var filteredShapes = this.m_svg.selectAll(TWiC.PublicationView.prototype.s_datashapeClassSelect)
                                       .filter(function(d){ return d.topicID == p_data.topicID; });
        filteredShapes.each(function(d){

            // Highlight all paths, circles, and rectangles
            if ( "path" == this.nodeName || "circle" == this.nodeName ){
                d3.select(this).style("fill", d.color)
                               .style("opacity", 1.0);
            } else if ( "rect" == this.nodeName ){
                d3.select(this).style("stroke", d.color)
                               .style("opacity", 1.0)
                               .style("stroke-opacity", 1.0);
                d3.select(this.parentNode.parentNode.parentNode).selectAll(".text_info_rect").style("opacity", 1.0);
                if ( d.shapeRef && d.shapeRef.m_textRect.classed("text_info_rect") &&
                     d.shapeRef.m_textRect.datum().topicID != p_data.topicID ){
                    d3.select(this.parentNode.parentNode.parentNode).selectAll(".text_info_rect").style("stroke-opacity", TWiC.DataShape.prototype.s_semihighlightedOpacity);
                }
            } else if ( "g" == this.nodeName ){
                d3.select(this).selectAll("rect").style("opacity", 1.0);
                d3.select(this).selectAll("path").style("opacity", 1.0);
            }

            // Raise the opacity, but not color of shapes in the same datashape that do not represent the given topic
            var nonHighlights = d3.select(this.parentNode)
                                  .selectAll(TWiC.PublicationView.prototype.s_datashapeClassSelect)
                                  .filter(function(d){return d.topicID != p_data.topicID; });
            nonHighlights.each(function(d){
                if ( "path" == this.nodeName || "circle" == this.nodeName ){
                    d3.select(this).style("fill", d.locolor)
                                   .style("opacity", 1.0);
                } else if ( "rect" == this.nodeName ){
                    d3.select(this).style("stroke", d.locolor)
                        .style("stroke-opacity", 1.0);
                } else if ( "g" == this.nodeName ){
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
    });

    namespace.PublicationView.method("Load", function(){

        this.m_level.m_queue.defer(function(callback) {

            d3.json(TWiC.Level.prototype.s_jsonDirectory + this.m_filename, function(error, data){

                this.m_data = data;

                for ( var index = 0; index < this.m_data.count; index++ ){

                    var topTopic = {id: 0, value: this.m_level.m_corpusInfo.file_info[this.m_data.texts[index].file][2][0] };
                    for ( var index2 = 0; index2 < this.m_level.m_corpusInfo.file_info[this.m_data.texts[index].file][2].length; index2++ ){
                        if ( this.m_level.m_corpusInfo.file_info[this.m_data.texts[index].file][2][index2] > topTopic.value ){
                            topTopic.id = index2;
                            topTopic.value = this.m_level.m_corpusInfo.file_info[this.m_data.texts[index].file][2][index2];
                        }
                    }
                    var textRectangle = new TWiC.TopicRectangle({x:0,y:0}, {width:0,height:0},
                                                               this.m_data.texts[index].file, this.m_level,
                                                               this, this.m_linkedViews,
                                                               topTopic.id,
                                                               this.m_numberTopics);

                    // Load the individual JSON for this text
                    textRectangle.Load();
                    textRectangle.SetTitle(this.m_data.texts[index].title);

                    var textrect_json = {
                        "name": this.m_data.texts[index].title,
                        "topics": this.m_level.m_corpusInfo.file_info[this.m_data.texts[index].file][2],
                    };

                    this.m_objectsJSON.push(textrect_json);
                    this.m_twicObjects.push(textRectangle);
                }

                callback(null, data);
            }.bind(this));
        }.bind(this));

        // Will have to load the individual text JSONs as well here or elsewhere once the
        var x = 0;
    });

    namespace.PublicationView.method("Move", function(p_transition, p_callbackTiming, p_callback){

        // Determine the traits of the given transition
        if ( p_transition.position ){
            this.m_container.SetPosition(p_transition.position);
        }
        if ( p_transition.size ) {
            this.m_container.SetSize(p_transition.size);
        }

        // NOTE: CSS max-width, max-height never changes

        // Container transitions to its position/dimensions
        this.m_container.m_div.transition()
                              .duration(p_transition.duration)
                              .style("left", this.m_container.m_coordinates.x)
                              .style("top", this.m_container.m_coordinates.y)
                              .style("width", this.m_container.m_size.width)
                              .style("height", this.m_container.m_size.height);

        // NOTE: Panels and control bars are relatively positioned in their parent container div

        // Panel and its svg transition to new position/dimensions
        this.m_div.transition().duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .style("height", this.m_size.height)
                               .each("start", function(p_transition, p_callbackTiming, p_callback){

                                   this.m_panelRectDiv.transition()
                                                   .duration(p_transition.duration)
                                                   .style("width", p_transition.size.width)
                                                   .style("height", p_transition.size.height - this.m_controlBar.m_size.height);
                                   this.m_panelRectSvg.transition()
                                                   .duration(p_transition.duration)
                                                   .attr("width", p_transition.size.width)
                                                   .attr("height", p_transition.size.height - this.m_controlBar.m_size.height)
                                                   .attr("viewBox", "0 0 " +
                                                                    p_transition.size.width + " " +
                                                                    (p_transition.size.height - this.m_controlBar.m_size.height));
                                   this.m_panelRect.transition()
                                                   .duration(p_transition.duration)
                                                   .attr("d", namespace.BottomRoundedRect(0, 0,
                                                                  p_transition.size.width,
                                                                  p_transition.size.height - this.m_controlBar.m_size.height,
                                                                  namespace.Panel.prototype.s_borderRadius));

                                   this.m_svg.transition()
                                             .duration(p_transition.duration)
                                             .attr("width", this.m_size.width)
                                             .attr("height", this.m_size.height)
                                             .each("end", function(){

                                                 if ( "end" == p_callbackTiming ){

                                                    p_callback();
                                                 }

                                             }.bind(this, p_callbackTiming, p_callback));

                                   if ( "start" == p_callbackTiming ){
                                       p_callback();
                                   }

                               }.bind(this, p_transition, p_callbackTiming, p_callback));

        // Control bar and its path (not svg) transition to new position/width
        this.m_controlBar.m_size.width = this.m_size.width;
        this.m_controlBar.m_div.transition()
                               .duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .each("start", function(p_transition){

                                   this.m_controlBar.m_barPath.transition()
                                                              .duration(p_transition.duration)
                                                              .attr("d", this.m_controlBar.GetRectPath());
                                   this.m_controlBar.m_svg.transition()
                                                          .duration(p_transition.duration)
                                                          .attr("width", this.m_size.width)
                                                          .attr("viewBox", "0 0 " + (this.m_size.width) + " " + this.m_controlBar.m_size.height);

                               }.bind(this, p_transition));
    });

    namespace.PublicationView.method("OpenUnderlyingPanel", function(p_data, p_coordinates, p_size){

        // Create new TextView panel
        var textView = new namespace.TextView({ x: p_coordinates.x, y: p_coordinates.y },
                                              { width: p_size.width, height: p_size.height },
                                              this.m_level);

        // Link the TextView to all open information views via mouseover
        for ( var index = 0; index < this.m_linkedViews.length; index++ ){

            if ( this.m_linkedViews[index].panel instanceof namespace.InformationView ){
                textView.AddLinkedView(this.m_linkedViews[index].panel, namespace.Interaction.mouseover);
            }
        }

        // Link the Publication and TextView panels via mouseover and double click
        this.AddLinkedView(textView, namespace.Interaction.mouseover);
        textView.AddLinkedView(this, namespace.Interaction.mouseover);
        this.AddLinkedView(textView, namespace.Interaction.dblclick);

        // Link the TopicBar to the TextView via click
        this.m_level.m_infoViews[0].m_panel.AddLinkedView(textView, namespace.Interaction.click);

        // Initialize and Start the TextView
        textView.m_container.Initialize(this.m_level.m_div);
        textView.m_container.Start();
        textView.m_div.style("opacity", 0.0);
        textView.m_controlBar.m_div.style("opacity", 0.0);
        textView.m_panelRectDiv.style("opacity", 0.0);
        textView.m_div.transition().delay(500).duration(3000).style("opacity", 1.0);
        textView.m_controlBar.m_div.transition().delay(500).duration(3000).style("opacity", 1.0);
        textView.m_panelRectDiv.transition().delay(500).duration(3000).style("opacity", 1.0);

        // Initial update call shows the text clicked
        textView.Update(p_data, namespace.Interaction.dblclick);

        // Update the view if a topic is already highlighted
        if ( -1 != this.m_level.m_highlightedTopic ){
            textView.Update(p_data, namespace.Interaction.mouseover);
        // Else, just highlight all words
        } else {
            textView.Update(null, namespace.Interaction.mouseover);
        }

        // Indicate that the underlying panel for CorpusView has now been opened
        this.m_underlyingPanelOpen = true;
    });

    namespace.PublicationView.prototype.s_datashapeClassName = "publication_shape";
    namespace.PublicationView.prototype.s_datashapeClassSelect = ".publication_shape";
    namespace.PublicationView.prototype.s_datashapeTextClassName = "publication_shape_text";
    namespace.PublicationView.prototype.s_datashapeTextClassSelect = ".publication_shape_text";


    // Base for informational views
    namespace.InformationView = function(p_coordinates, p_size, p_level){

        namespace.Panel.apply(this, arguments);
    };
    namespace.InformationView.inherits(namespace.Panel);


    namespace.TopicBar = function(p_coordinates, p_size, p_level){

        namespace.InformationView.apply(this, arguments);
    };
    namespace.TopicBar.inherits(namespace.InformationView);

    namespace.TopicBar.method("Initialize", function(p_parentDiv){

        this.m_coordinates.x = 0;
        this.m_coordinates.y = 0;

        // No initial selected text
        this.m_level.m_highlightedTopic = -1;

        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_info_topicbar div_twic_info twic_panel")
                                .attr("id", "div_twic_info_topicbar_" + this.m_name)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height)
                                .style("overflow", "auto")
                                .style("border-radius", namespace.Panel.prototype.s_borderRadius)
                                .style("position", "relative");

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
        for ( var index = 0, yPosition = namespace.TopicBar.prototype.s_textInfo.fontSize; index < topicStrArray.length; index++ ){

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

                                                if ( 1 == parseInt(this.m_svg.select(".topic_highlightrect#topic_" + d.id).attr("opacity")) ){

                                                    var update_data = null;
                                                    this.Update(update_data, namespace.Interaction.click);
                                                    for ( var view_index = 0; view_index < this.m_linkedViews.length;
                                                          view_index++ ){

                                                        if ( namespace.Interaction.click == this.m_linkedViews[view_index].update ) {

                                                            this.m_linkedViews[view_index].panel.Pause(false);
                                                            this.m_linkedViews[view_index].panel.Update(update_data, namespace.Interaction.mouseover);
                                                        }
                                                    }
                                                    this.Pause(false);

                                                } else {

                                                    var update_data = {topicID:d.id, color:this.m_level.m_topicColors[d.id]};
                                                    this.HighlightText(update_data);
                                                    for ( var view_index = 0; view_index < this.m_linkedViews.length;
                                                          view_index++ ){

                                                        if ( namespace.Interaction.click == this.m_linkedViews[view_index].update ) {

                                                            var initialPauseState = this.m_linkedViews[view_index].panel.IsPaused();
                                                            if ( !initialPauseState) {

                                                                this.m_linkedViews[view_index].panel.Update(update_data, namespace.Interaction.mouseover);
                                                                this.m_linkedViews[view_index].panel.Pause(true);
                                                            } else {

                                                                this.m_linkedViews[view_index].panel.Pause(false);
                                                                this.m_linkedViews[view_index].panel.Update(update_data, namespace.Interaction.mouseover);
                                                                this.m_linkedViews[view_index].panel.Pause(true);
                                                            }
                                                        }
                                                    }
                                                    this.Pause(true);
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
            highlightRect.datum({"dy": rectGrowth + dy, "height": dy, "lines": numTspansAdded})
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

        // Make all objects of this panel resizable and draggable
        this.MakeResizable(false);
        this.MakeDraggable();
    });

    namespace.TopicBar.method("HighlightText", function(data){

        // De-highlight current highlighted text if any selection
        if ( -1 != this.m_level.m_highlightedTopic ) {
            d3.select(".topic_wordlist#topic_" + this.m_level.m_highlightedTopic)
              .attr("fill", function(d){ return this.m_level.m_topicColors[this.m_level.m_highlightedTopic]; }.bind(this));
            d3.select(".topic_highlightrect#topic_" + this.m_level.m_highlightedTopic)
              .attr("fill", this.m_div.style("background-color"))
              .attr("opacity", "0");
        }

        // Highlight the newly selected topic
        d3.select(".topic_wordlist#topic_" + data.topicID).attr("fill", this.m_div.style("background-color"));
        d3.select(".topic_highlightrect#topic_" + data.topicID).attr("fill", data.color).attr("opacity", "1");
        this.m_level.m_highlightedTopic = data.topicID;
    });

    namespace.TopicBar.method("Update", function(p_data, p_updateType){

        if ( !this.m_paused ) {

            // Highlight the topic word list and scroll to it
            if ( null != p_data ) {

                this.m_svg.select(".topic_wordlist#topic_" + p_data.topicID).attr("fill", this.m_panelRect.attr("fill"));
                this.m_svg.select(".topic_highlightrect#topic_" + p_data.topicID).attr("fill", p_data.color).attr("opacity", 1.0);
                var dy = this.m_svg.select(".topic_highlightrect#topic_" + p_data.topicID).datum()["dy"];
                var numLines = this.m_svg.select(".topic_highlightrect#topic_" + p_data.topicID).datum()["lines"];

                $(this.m_div[0][0]).scrollTop(dy - (numLines * namespace.TopicBar.prototype.s_textInfo.yIncrement));

                // Save the current highlighted topic ID
                this.m_level.m_highlightedTopic = p_data.topicID;
            }
            // De-highlight all topic words lists and scroll back to the top of the topic bar
            else {

                this.m_svg.selectAll(".topic_wordlist").attr("fill", function(d){ return this.m_level.m_topicColors[d.id]; }.bind(this));
                this.m_svg.selectAll(".topic_highlightrect").attr("fill", this.m_panelRect.attr("fill")).attr("opacity", 0);

                $(this.m_div[0][0]).scrollTop(0);

                // Reset the current selected topic to none
                this.m_level.m_highlightedTopic = -1;
            }
        } else {
            if ( namespace.Interaction.click == p_updateType ){
                this.m_svg.selectAll(".topic_wordlist").attr("fill", function(d){ return this.m_level.m_topicColors[d.id]; }.bind(this));
                this.m_svg.selectAll(".topic_highlightrect").attr("fill", this.m_panelRect.attr("fill")).attr("opacity", 0);

                // Reset the current selected topic to none
                this.m_level.m_highlightedTopic = -1;
            }
        }
    });

    namespace.TopicBar.method("MakeResizable", function(p_maintainAspectRatio){

        if ( undefined === p_maintainAspectRatio ){
            p_maintainAspectRatio = true;
        }

        // Topic bar's minimum is less than normal (for space savings)
        var resizeMinWidth = namespace.Panel.prototype.s_minimumPanelSize;
        var resizeMinHeight = namespace.TopicBar.prototype.s_minHeight;

        $(this.m_container.m_div[0]).resizable({alsoResize: "#" + $(this.m_container.m_div[0]).attr("id") + " .twic_panel",
                                                aspectRatio: p_maintainAspectRatio,
                                                autoHide: true,
                                                minWidth: resizeMinWidth,
                                                minHeight: resizeMinHeight,
                                                maxWidth: this.m_level.m_size.width,
                                                maxHeight: this.m_level.m_size.height,
                                                handles: "n, s, e, w, nw, ne, sw, se",
                                                resize: function(){
                                                    this.OnResize(false);
                                                    this.m_level.m_resizeOccurred = true;
                                                }.bind(this)});
        $(this.m_container.m_div[0]).resizable("option","autoHide",true);
    });

    namespace.TopicBar.method("Move", function(p_transition, p_callbackTiming, p_callback){

        // Determine the traits of the given transition
        if ( p_transition.position ){
            this.m_container.SetPosition(p_transition.position);
        }
        if ( p_transition.size ) {
            this.m_container.SetSize(p_transition.size);
        }

        // NOTE: CSS max-width, max-height changes in case the panel is grown

        // Transition the container div's position/size
        this.m_container.m_div.transition()
                              .duration(p_transition.duration)
                              .style("left", this.m_container.m_coordinates.x)
                              .style("top", this.m_container.m_coordinates.y)
                              .style("width", this.m_container.m_size.width)
                              .style("height", this.m_container.m_size.height);

        // NOTE: Panels and control bars are relatively positioned in their parent container div

        // Transition the panel's div to new dimensions and call the provided callback
        this.m_div.transition().duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .style("height", this.m_size.height)
                               .each(p_callbackTiming, p_callback);

        // Ensure the highlight remains at the top of the topic bar div
        $(this.m_div[0][0]).scrollTop();
    });

    namespace.TopicBar.method("OnResize", function(p_packery){

        var packeryReorganize = true;
        if ( undefined !== p_packery ){
            packeryReorganize = p_packery;
        }

        var containerWidth = parseFloat(this.m_container.m_div.style("width"));
        var containerHeight = parseFloat(this.m_container.m_div.style("height"));
        var controlBarHeight = ( this.m_controlBar ) ? this.m_controlBar.m_size.height : 0;

        // Control bar resize
        if ( this.m_controlBar ){
            this.m_controlBar.m_size.width = containerWidth;
            this.m_controlBar.m_div.style("width", containerWidth);
            this.m_controlBar.m_svg.attr("width", containerWidth)
                                   .attr("viewBox", "0 0 " + containerWidth + " " + controlBarHeight);
        }

        // Panel resize (vars for potentially faster access to the dimension values)
        var oldSvgDims = { width: parseInt(this.m_svg.attr("width")), height: parseInt(this.m_svg.attr("height")) };
        var oldToNewProportion = { width: containerWidth / this.m_size.width, height: containerHeight / this.m_size.height };
        this.m_size.width = Math.abs(containerWidth);
        this.m_size.height = Math.abs(containerHeight - controlBarHeight);
        var divWidth = this.m_size.width;
        var divHeight = this.m_size.height;

        this.m_div.style("width", divWidth)
                  .style("height", divHeight);

        if ( containerWidth > parseInt(this.m_div.style("max-width")) ) {
            this.m_div.style("max-width", containerWidth);
        }
        if ( containerHeight > parseInt(this.m_div.style("max-height") + controlBarHeight) ) {
            this.m_div.style("max-height", containerHeight - controlBarHeight);
        }

        // Re-append this container to the level div to bump up its z-order
        this.m_container.m_div.node().parentNode.appendChild(this.m_container.m_div.node());

        // Packery re-layout call
        if ( packeryReorganize ){
            $(this.m_level.m_div[0]).packery();
        }

        // Force level HTML redraw in order to overcome bug where SVG elements not resized until next redraw occurs
        $(this.m_level.m_div.node().parentNode).hide().show(0);
    });

    namespace.TopicBar.prototype.s_minHeight = 200;
    namespace.TopicBar.prototype.s_textInfo = { "yStart": -1400, "yIncrement": 30, "fontSize": 20 };


    // Shows individual cluster and text information tiles (TWiC.DocumentTiles)
    namespace.DataBar = function(p_coordinates, p_size, p_level){

        namespace.InformationView.apply(this, arguments);

        this.m_topicDataTiles = [];
        this.m_metaDataTiles = [];
        this.m_wordWeightDataTiles = [];
        this.m_nextTilePos = { x: 0, y: 0 };
        this.m_highlightIndex = -1;
    };
    namespace.DataBar.inherits(namespace.InformationView);

    namespace.DataBar.method("Initialize", function(p_parentDiv){

        // Set up the panel container to the given coordinates
        this.m_container.SetPosition(this.m_coordinates);
        this.m_container.m_div.style("left", this.m_container.m_coordinates.x)
                              .style("top", this.m_container.m_coordinates.y)
                              .style("overflow", "hidden")
                              .style("border-radius", namespace.Panel.prototype.s_borderRadius);

        // Top/left coordinates are relative to the containing div/level
        this.m_coordinates.x = 0;
        this.m_coordinates.y = 0;

        // Div and svg for panel rect (required because of resizing behavior inconsistent with scaling data shapes)
        var controlBarHeight = ( this.m_controlBar ) ? this.m_controlBar.m_size.height - 2 : 0;
        this.m_panelRectDiv = p_parentDiv.append("div")
                                        .attr("class", "div_panel_rect")
                                        .attr("id", "div_panel_rect_" + this.m_name)
                                        .style("position", "absolute")
                                        .style("left", this.m_coordinates.x)
                                        .style("top", this.m_coordinates.y + controlBarHeight)
                                        .style("width", this.m_size.width)
                                        .style("height", this.m_size.height)
                                        .style("max-width", this.m_level.m_size.width)
                                        .style("max-height", this.m_level.m_size.height)
                                        .style("border-radius", namespace.Panel.prototype.s_borderRadius);
        this.m_panelRectSvg = this.m_panelRectDiv.append("svg")
                                                 .attr("x", this.m_coordinates.x)
                                                 .attr("y", this.m_coordinates.y)
                                                 .attr("width", this.m_size.width)
                                                 .attr("height", this.m_size.height)
                                                 .attr("viewBox", "0 0 " + this.m_size.width + " " + this.m_size.height);

        // Add the rectangle where all graph data will sit
        this.m_panelRect = this.m_panelRectSvg.append("path")
                                              .attr("d",
                                                    namespace.BottomRoundedRect(this.m_coordinates.x,
                                                                                this.m_coordinates.y,
                                                                                this.m_size.width,
                                                                                this.m_size.height,
                                                                                namespace.Panel.prototype.s_borderRadius))
                                              .attr("class", "rect_twic_graph")
                                              .attr("id", "rect_twic_graph_databar_" + this.m_name)
                                              .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                              .style("position", "absolute");

        // Set up the div for the data bar
        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_graph_databar div_twic_graph twic_panel")
                                .attr("id", "div_twic_graph_databar_" + this.m_name)
                                .style("left", this.m_coordinates.x)
                                .style("top", this.m_coordinates.y + controlBarHeight)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height)
                                .style("max-width", this.m_level.m_size.width)
                                .style("max-height", this.m_level.m_size.height)
                                .style("border-radius", namespace.Panel.prototype.s_borderRadius)
                                .style("position", "absolute");

        // Set up the svg for the data bar
        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_graph")
                               .attr("id", "svg_twic_graph_databar_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height)
                               .attr("viewBox", "0 0 " + this.m_size.width + " " + this.m_size.height);

        // Save the minimum width and height to preserve the initial svg size
        this.m_minDims = { width: this.m_size.width, height: this.m_size.height };

        // Add group and rectangle for trapping mouse events in the graph
        this.m_groupOverlay = this.m_svg.append("g")
                                        .attr("class","group_twic_graph_overlay")
                                        .attr("id", "group_twic_graph_overlay_databar_" + this.m_name);


        this.m_tileGroup = this.m_groupOverlay.append("g").attr("id", "tile_group")
                                              .attr("width", this.m_size.width)
                                              .attr("height", this.m_size.height);

        // Make the bar text opaque initially
        this.m_controlBar.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                   .style("opacity", 1.0);

        // Add my text to the container's control bar
        this.AddBarText(namespace.DataBar.prototype.s_defaultTitle, "");

        // Make the publication view draggable and resizable
        this.MakeResizable(false);
        this.MakeDraggable();
    });

    namespace.DataBar.method("Start", function(){

        // Data bar starts loaded with information about the corpus view bullseye
        // (2x to unpause the panel and its linked views)
        this.Update({ shapeRef: this.m_level.m_graphViews[0].m_panel.m_corpusCluster },
                    namespace.Interaction.click);
    });

    namespace.DataBar.method("Update", function(p_data, p_updateType, p_tileUpdate){

        // DataBar click
        if ( namespace.Interaction.click == p_updateType ){

            if ( undefined === p_data.shapeRef ){

                // Handle clicks on topic words in TextView
                if ( undefined !== p_data.word ){

                    // Remove all tiles from the DOM
                    this.m_tileGroup.selectAll("*").remove();

                    // Save a reference to the current shape being highlighted
                    this.m_currentShape = p_data.shapeRef;

                    // Reset fields
                    this.m_topicDataTiles = [];
                    this.m_wordWeightDataTiles = [];
                    this.m_nextTilePos.y = 0;
                    var rectGrowth = ( this.m_controlBar ) ? this.m_controlBar.m_size.height - 1 : 0;
                    var panelTitle = namespace.DataBar.prototype.s_defaultTitle;
                    var panelTitleID = "";
                    var dist2avg = 0;

                    // Panel title
                    panelTitle = "Words of Topic";
                    panelTitleID = p_data.topicID;

                    // Display the bullseye name
                    this.AddBarText(panelTitle, panelTitleID, false);

                    // Save the title/ID and switch back to alt text if hidden
                    if ( this.m_hidden ){
                        this.AddBarText("", 0, true);
                    }

                    // Create and draw new word weight tiles based on the clicked topic word
                    rectGrowth += this.DrawWordWeightTiles(rectGrowth, p_data);

                    // Resize the svg and panel rectangle
                    this.m_svg.attr("width", this.m_size.width)
                              .attr("height", rectGrowth)
                              .attr("viewBox", "0 0 " + this.m_size.width + " " + rectGrowth);
                    this.m_minDims.width = this.m_size.width;
                    this.m_minDims.height = rectGrowth;
                    $(this.m_div[0][0]).scrollTop(0);
                    this.m_panelRectSvg.attr("height", rectGrowth)
                                       .attr("viewBox", "0 0 " + this.m_size.width + " " + rectGrowth);
                    this.m_panelRectSvg.selectAll("*").remove();
                    this.m_panelRect = this.m_panelRectSvg.append("path")
                                                          .attr("d", namespace.BottomRoundedRect(0,
                                                                         0,
                                                                         this.m_size.width,
                                                                         rectGrowth,
                                                                         namespace.Panel.prototype.s_borderRadius))
                                                          .attr("class", "rect_twic_graph")
                                                          .attr("id", "rect_twic_graph_databar_" + this.m_name)
                                                          .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                                          .style("position", "absolute");

                    // Re-establish border radius
                    this.m_container.m_div[0][0].style["border-radius"] = namespace.Panel.prototype.s_borderRadius + "px";
                    this.m_div.style("border-radius", namespace.Panel.prototype.s_borderRadius);
                    this.m_panelRectDiv[0][0].style["border-radius"] = namespace.Panel.prototype.s_borderRadius + "px";
                }

            } else {

                if ( p_data.shapeRef != this.m_currentShape ){

                    // Remove all tiles from the DOM
                    this.m_tileGroup.selectAll("*").remove();

                    // Save a reference to the current shape being highlighted
                    this.m_currentShape = p_data.shapeRef;

                    // Reset fields
                    this.m_topicDataTiles = [];
                    this.m_wordWeightDataTiles = [];
                    this.m_nextTilePos.y = 0;
                    var rectGrowth = ( this.m_controlBar ) ? this.m_controlBar.m_size.height - 1 : 0;
                    var panelTitle = namespace.DataBar.prototype.s_defaultTitle;
                    var panelTitleID = "";
                    var dist2avg = 0;

                    if ( p_data.shapeRef instanceof namespace.TopicBullseye ){

                        // Four possible data representations
                        // 1. Corpus Avg Bullseye
                        if ( this.m_level.m_corpusMap["name"] == p_data.shapeRef.m_name ){

                            panelTitle = p_data.shapeRef.m_name;
                        }
                        // 2. Corpus Cluster Bullseye (m_name will just be the topic ID number)
                        else if ( !isNaN(parseInt(p_data.shapeRef.m_name)) ){

                            panelTitle = "Topic Cluster";
                            panelTitleID = p_data.shapeRef.m_name;
                            var myPanel = p_data.shapeRef.m_panel;
                            // -2 to reduce inflated distance set at CorpusClusterView.InitializeGraph()
                            //dist2avg = p_data.shapeRef.m_panel.m_objectsJSON[parseInt(p_data.shapeRef.m_title)].dist2avg;
                            dist2avg = myPanel.m_adjustedDistances[parseInt(p_data.shapeRef.m_title)] -
                                       (( myPanel.b_adjustDistances ) ? myPanel.m_linkDistLimits.min : 0);
                            dist2avg = Math.abs(dist2avg);
                        }
                        // 3. Avg of Corpus Clusters Bullseye
                        else if ( namespace.CorpusClusterView.prototype.s_infoFlavorText == p_data.shapeRef.m_name ){

                            panelTitle = p_data.shapeRef.m_name;
                        }
                        // 4. Avg of Text Cluster Bullseye
                        else if ( namespace.TextClusterView.prototype.s_infoFlavorText == p_data.shapeRef.m_name ){

                            panelTitle = p_data.shapeRef.m_name;
                            panelTitleID = p_data.shapeRef.m_panel.m_clusterIndex;
                        }

                        // Display the bullseye name
                        this.AddBarText(panelTitle, panelTitleID, false);

                    } else if ( p_data.shapeRef instanceof namespace.TopicRectangle ){

                        // One possible data representation
                        // 1. Text Rectangle
                        panelTitle = p_data.shapeRef.m_title;

                        // Find the dist2avg for this text
                        /*for ( var index = 0; index < p_data.shapeRef.m_panel.m_objectsJSON.length; index++ ){
                            if ( p_data.shapeRef.m_panel.m_objectsJSON[index].name == p_data.shapeRef.m_fileID ){
                                dist2avg = p_data.shapeRef.m_panel.m_objectsJSON[index].dist2avg;
                                break;
                            }
                        }*/
                        var myPanel = p_data.shapeRef.m_panel;
                        if ( myPanel.m_adjustedDistances ){
                            dist2avg = myPanel.m_adjustedDistances[p_data.shapeRef.m_panelNodeIndex] -
                                       (( myPanel.b_adjustDistances ) ? myPanel.m_linkDistLimits.min : 0);
                            dist2avg = Math.abs(dist2avg);
                        }

                        // Display the rectangle name
                        this.AddBarText(panelTitle, panelTitleID, false);
                    }

                    // Save the title/ID and switch back to alt text if hidden
                    if ( this.m_hidden ){
                        this.AddBarText("", 0, true);
                    }

                    // Display the distance of this datashape to the average of its cluster in-panel, if applicable
                    // and other possible metadata for this datashape
                    rectGrowth += this.DrawMetaDataTiles(rectGrowth, p_data, dist2avg, p_data.shapeRef.m_textCount);

                    // Create and draw new topic tiles based on the clicked datashape
                    rectGrowth += this.DrawTopicTiles(rectGrowth, p_data);

                    // Resize the svg and panel rectangle
                    this.m_svg.attr("width", this.m_size.width)
                              .attr("height", rectGrowth)
                              .attr("viewBox", "0 0 " + this.m_size.width + " " + rectGrowth);
                    this.m_minDims.width = this.m_size.width;
                    this.m_minDims.height = rectGrowth;
                    $(this.m_div[0][0]).scrollTop(0);
                    this.m_panelRectSvg.attr("height", rectGrowth)
                                       .attr("viewBox", "0 0 " + this.m_size.width + " " + rectGrowth);
                    this.m_panelRectSvg.selectAll("*").remove();
                    this.m_panelRect = this.m_panelRectSvg.append("path")
                                                          .attr("d", namespace.BottomRoundedRect(0,
                                                                         0,
                                                                         this.m_size.width,
                                                                         rectGrowth,
                                                                         namespace.Panel.prototype.s_borderRadius))
                                                          .attr("class", "rect_twic_graph")
                                                          .attr("id", "rect_twic_graph_databar_" + this.m_name)
                                                          .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                                          .style("position", "absolute");

                    // Re-establish border radius
                    this.m_container.m_div[0][0].style["border-radius"] = namespace.Panel.prototype.s_borderRadius + "px";
                    this.m_div.style("border-radius", namespace.Panel.prototype.s_borderRadius);
                    this.m_panelRectDiv[0][0].style["border-radius"] = namespace.Panel.prototype.s_borderRadius + "px";
                }
            }
        // DataBar mouseover
        } else if ( namespace.Interaction.mouseover == p_updateType ){

            if ( !this.IsPaused() ){

                var dataTilesRef = ( 0 == this.m_wordWeightDataTiles.length ) ? this.m_topicDataTiles : this.m_wordWeightDataTiles;
                if ( null != p_data ){

                    for ( var index = 0; index < dataTilesRef.length; index++ ){

                        // Highlight the moused-over topic tile
                        if ( p_data.topicID == dataTilesRef[index].m_topicID ){

                            dataTilesRef[index].HighlightTile(true);
                            this.m_highlightIndex = index;
                            this.m_level.m_highlightedTopic = p_data.topicID;

                            // Set the scroll position of the panel so that this tile is at the top
                            if ( undefined === p_tileUpdate ){
                                $(this.m_div[0][0]).scrollTop(dataTilesRef[index].m_coordinates.y);
                            }
                            break;
                        }
                    }
                } else {

                    for ( var index = 0; index < dataTilesRef.length; index++ ){
                        dataTilesRef[index].HighlightTile(false);
                    }

                    this.m_highlightIndex = -1;

                    if ( undefined === p_tileUpdate ){
                        $(this.m_div[0][0]).scrollTop(0);
                    }
                }
            }
        }
    });

    namespace.DataBar.method("AddBarText", function(p_barText, p_id, p_altText){

        this.m_controlBar.AddText(function(p_barText, p_id, p_altText){

            console.log("Bar Text");
            console.log(p_barText);

            // Remove any former panel title first
            this.m_controlGroup.selectAll("text").remove("*");

            if ( !this.m_textFirstSet ){
                this.m_textPos = { x: this.GetNextWidgetPos().x, y: this.GetNextWidgetPos().y };
                this.m_textFirstSet = true;
            }

            this.m_barText = this.m_controlGroup.append("text")
                                                                .attr("x", this.m_textPos.x)
                                                                .attr("y", this.m_textPos.y);

            if ( !p_altText ){

                this.m_recentPanelTitle = p_barText;
                this.m_recentPanelID = p_id;

                this.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                      .style("opacity", 1.0);

                this.m_barText.append("tspan")
                                      .html("TWiC:&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);

                this.m_barText.append("tspan")
                                      .html(p_barText)
                                      .attr("fill", namespace.Level.prototype.s_palette.gold)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 20);

                if ( "" !== p_id ) {
                    this.m_barText.append("tspan")
                                          .html("&nbsp;" + p_id)
                                          .attr("fill", this.m_panel.m_level.m_topicColors[p_id])
                                          .style("font-family", namespace.Level.prototype.s_fontFamily)
                                          .style("font-size", 21);
                }
            } else {

                this.m_barPath.attr("fill", namespace.Level.prototype.s_palette.darkblue)
                                      .style("opacity", 1.0);

                this.m_barText.append("tspan")
                                      .html("TWiC:&nbsp;")
                                      .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);

                this.m_barText.append("tspan")
                                      .html("Data Bar")
                                      .attr("fill", namespace.Level.prototype.s_palette.gold)
                                      .style("font-family", namespace.Level.prototype.s_fontFamily)
                                      .style("font-size", 25);
            }
         }.bind(this.m_controlBar, p_barText, p_id, p_altText));
    });

    namespace.DataBar.method("DrawMetaDataTiles", function(p_currentY, p_data, p_dist2avg, p_textCount){

        if ( p_dist2avg > 0 ){

            var newTile = new namespace.MetaDataTile({ x: this.m_nextTilePos.x, y: this.m_nextTilePos.y },
                                                     namespace.MetaDataTile.prototype.s_tileDims,
                                                     "metadata_dist2avg",
                                                     this.m_level,
                                                     this,
                                                     p_data.shapeRef,
                                                     "Distance to Cluster Avg",
                                                     p_dist2avg);
            this.m_nextTilePos.y += namespace.MetaDataTile.prototype.s_tileDims.height +
                                    namespace.DataBar.prototype.s_elementSpacing;
            p_currentY += namespace.MetaDataTile.prototype.s_tileDims.height +
                          namespace.DataBar.prototype.s_elementSpacing;

            this.m_metaDataTiles.push(newTile);
            newTile.Draw(true);
        }

        if ( p_textCount > 0){

            var newTile = new namespace.MetaDataTile({ x: this.m_nextTilePos.x, y: this.m_nextTilePos.y },
                                                     namespace.MetaDataTile.prototype.s_tileDims,
                                                     "metadata_textcount",
                                                     this.m_level,
                                                     this,
                                                     p_data.shapeRef,
                                                     "Text Count",
                                                     p_textCount);
            this.m_nextTilePos.y += namespace.MetaDataTile.prototype.s_tileDims.height +
                                    namespace.DataBar.prototype.s_elementSpacing;
            p_currentY += namespace.MetaDataTile.prototype.s_tileDims.height +
                          namespace.DataBar.prototype.s_elementSpacing;

            this.m_metaDataTiles.push(newTile);
            newTile.Draw(false);
        }

        return p_currentY;
    });

    namespace.DataBar.method("DrawTopicTiles", function(p_currentY, p_data){

        var topicsSorted = Object.keys(p_data.shapeRef.m_fullTopicListRef).sort(function(a, b) { return p_data.shapeRef.m_fullTopicListRef[a][1] - p_data.shapeRef.m_fullTopicListRef[b][1]; });
        var topicList = [];
        for ( var index = topicsSorted.length - 1; index >= 0; index-- ){
            topicList.push([topicsSorted[index], p_data.shapeRef.m_fullTopicListRef[topicsSorted[index]][1]])
        }

        var proportionSum = 0;
        for ( var index = 0; index < topicList.length; index++ ){

            this.m_topicDataTiles.push(new namespace.TopicTile({ x: this.m_nextTilePos.x, y: this.m_nextTilePos.y },
                                                               namespace.TopicTile.prototype.s_tileDims,
                                                               "topic_" + topicList[index][0],
                                                               this.m_level,
                                                               this,
                                                               p_data.shapeRef,
                                                               topicList[index][0]));
            this.m_nextTilePos.y += namespace.TopicTile.prototype.s_tileDims.height +
                                    namespace.DataBar.prototype.s_elementSpacing;
            p_currentY += namespace.TopicTile.prototype.s_tileDims.height +
                          namespace.DataBar.prototype.s_elementSpacing;

            // Sum up the proportion amounts for drawing of topic percents proportional to panel width
            proportionSum += this.m_topicDataTiles[index].m_topicProportion;
        }

        for ( var index = 0; index < topicList.length; index++ ){
            this.m_topicDataTiles[index].Draw(this.m_topicDataTiles[index].m_topicProportion / proportionSum);
        }

        return p_currentY;
    });

    namespace.DataBar.method("DrawWordWeightTiles", function(p_currentY, p_data){

        var wordWeightsMap = this.m_level.m_corpusWordWeights[p_data.topicID];
        var wordWeightsSorted = Object.keys(wordWeightsMap).sort(function(a, b) { return wordWeightsMap[a] - wordWeightsMap[b]; });
        var wordWeightsList = [];
        for ( var index = wordWeightsSorted.length - 1; index >= 0; index-- ){
            wordWeightsList.push([wordWeightsSorted[index], wordWeightsMap[wordWeightsSorted[index]]])
        }

        var proportionSum = 0;
        for ( var index = 0; index < wordWeightsList.length; index++ ){

            // NOTE: Currently no TWiC.DataShape associated with topic words (thus null argument)
            this.m_wordWeightDataTiles.push(new namespace.WordWeightTile({ x: this.m_nextTilePos.x, y: this.m_nextTilePos.y },
                                                                         namespace.WordWeightTile.prototype.s_tileDims,
                                                                         wordWeightsList[index][0],
                                                                         this.m_level,
                                                                         this,
                                                                         null,
                                                                         p_data.topicID,
                                                                         wordWeightsList[index][0],
                                                                         wordWeightsList[index][1]));
            this.m_nextTilePos.y += namespace.WordWeightTile.prototype.s_tileDims.height +
                                    namespace.DataBar.prototype.s_elementSpacing;
            p_currentY += namespace.WordWeightTile.prototype.s_tileDims.height +
                          namespace.DataBar.prototype.s_elementSpacing;

            // Sum up the proportion amounts for drawing of topic percents proportional to panel width
            proportionSum += this.m_wordWeightDataTiles[index].m_value;
        }

        for ( var index = 0; index < wordWeightsList.length; index++ ){
            this.m_wordWeightDataTiles[index].Draw(proportionSum);
        }

        return p_currentY;
    });

    namespace.DataBar.method("GetCurrentShape", function(){

        return this.m_currentShape;
    });

    namespace.DataBar.method("Hide", function(p_hide, p_optionalOrganize){

        var reorganize = ( undefined === p_optionalOrganize ) ? true : p_optionalOrganize;

        if ( p_hide ){

            // Save the current dimensions for unhiding
            this.m_recentDims = { width: this.m_size.width,
                                  height: this.m_size.height + this.m_controlBar.m_size.height,
                                  extendedHeight: parseFloat(this.m_svg.attr("height")) };
            this.m_recentPos = { x: parseFloat(this.m_container.m_div.style("left")),
                                 y: parseFloat(this.m_container.m_div.style("top")) };

            // Transition will be to the minimum panel width and size of the control bar only
            var transition = {
                position: { x: this.m_recentPos.x, y: this.m_recentPos.y },
                size: { width: namespace.Panel.prototype.s_minimumPanelSize,
                        height: namespace.Control.prototype.s_defaultThickness },
                duration: 500
            };

            // Disable resizing
            this.ToggleResize(true);
        } else {

            this.m_recentPos = { x: parseFloat(this.m_container.m_div.style("left")),
                                 y: parseFloat(this.m_container.m_div.style("top")) };

            // Bring back to size before hiding
            var transition = {
                position: { x: this.m_recentPos.x, y: this.m_recentPos.y },
                size: { width: this.m_recentDims.width, height: this.m_recentDims.height },
                duration: 500
            };

            // Enable resizing
            this.ToggleResize(false);
        }

        // Save the current hidden state
        this.m_hidden = p_hide;

        // Change the control bar text
        if ( this.m_hidden ){
            this.AddBarText("", 0, true);
        } else {
            this.AddBarText(this.m_controlBar.m_recentPanelTitle, this.m_controlBar.m_recentPanelID, false);
        }

        if ( this.m_hidden ){

            // Resize the container
            this.Move(transition, "end", function(){

                // Reorganize the panels
                if ( reorganize ){
                    this.m_level.OrganizePanels();
                }

                // Make sure the shrunken bar is fully rounded
                this.m_controlBar.m_barPath.transition()
                                           .duration(10)
                                           .attr("d",
                                                 namespace.FullyRoundedRect(this.m_coordinates.x,
                                                                            this.m_coordinates.y,
                                                                            this.m_container.m_size.width,
                                                                            namespace.Control.prototype.s_defaultThickness,
                                                                            namespace.Panel.prototype.s_borderRadius));


            }.bind(this), !this.m_hidden);
        } else {

            this.m_controlBar.m_barPath.attr("d",
                                             namespace.TopRoundedRect(this.m_coordinates.x,
                                                                      this.m_coordinates.y,
                                                                      this.m_container.m_size.width,
                                                                      namespace.Control.prototype.s_defaultThickness,
                                                                      namespace.Panel.prototype.s_borderRadius));


            this.Move(transition, "end", function(){

                // Make sure the scroll bar is at the appropriate position
                if ( -1 == this.m_level.m_highlightedTopic ){
                    $(this.m_div[0][0]).scrollTop(0);
                } else {
                    $(this.m_div[0][0]).scrollTop(this.m_topicDataTiles[this.m_highlightIndex].m_coordinates.y);
                }

                if ( reorganize ){
                    this.m_level.OrganizePanels();
                }
            }.bind(this), !this.m_hidden);
        }
    });

    namespace.DataBar.method("Move", function(p_transition, p_callbackTiming, p_callback, p_expand){

        // Determine the traits of the given transition
        if ( p_transition.position ){
            this.m_container.SetPosition(p_transition.position);
        }
        if ( p_transition.size ) {
            this.m_container.SetSize(p_transition.size);
        }

        // NOTE: CSS max-width, max-height never changes

        // Container transitions to its position/dimensions
        this.m_container.m_div.transition()
                              .duration(p_transition.duration)
                              .style("left", this.m_container.m_coordinates.x)
                              .style("top", this.m_container.m_coordinates.y)
                              .style("width", this.m_container.m_size.width)
                              .style("height", this.m_container.m_size.height);

        // NOTE: Panels and control bars are relatively positioned in their parent container div

        // Panel and its svg transition to new position/dimensions
        this.m_div.transition().duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .style("height", this.m_size.height - 2)
                               .each("start", function(p_transition, p_callbackTiming, p_callback, p_expand){

                                   this.m_panelRectDiv.transition()
                                                      .duration(p_transition.duration)
                                                      .style("width", p_transition.size.width)
                                                      .style("height", p_transition.size.height - this.m_controlBar.m_size.height - 1);
                                   this.m_panelRectSvg.transition()
                                                      .duration(p_transition.duration)
                                                      .attr("width", p_transition.size.width)
                                                      .attr("height", (( p_expand ) ? this.m_recentDims.extendedHeight : p_transition.size.height) - this.m_controlBar.m_size.height)
                                                      .attr("viewBox", "0 0 " +
                                                                       p_transition.size.width + " " +
                                                                       ((( p_expand ) ? this.m_recentDims.extendedHeight : p_transition.size.height) - this.m_controlBar.m_size.height));
                                   this.m_panelRect.transition()
                                                   .duration(p_transition.duration)
                                                   .attr("d", namespace.BottomRoundedRect(0, 0,
                                                                  p_transition.size.width,
                                                                  (( p_expand ) ? this.m_recentDims.extendedHeight : p_transition.size.height) - this.m_controlBar.m_size.height,
                                                                  namespace.Panel.prototype.s_borderRadius))
                                                    .each("end", function(){

                                                        if ( "end" == p_callbackTiming ){

                                                           p_callback();
                                                        }

                                                    }.bind(this, p_callbackTiming, p_callback));

                                    // Optional main div svg scaling
                                    var changeSvgDims = false;
                                    var divWidth = this.m_size.width;
                                    var divHeight = this.m_size.height;
                                    var newSvgDims = { width: this.m_minDims.width, height: this.m_minDims.height };
                                    if ( divWidth > this.m_minDims.width ){
                                        newSvgDims.width = divWidth;
                                        changeSvgDims = true;
                                    }

                                    if ( changeSvgDims ){
                                        this.m_svg.transition()
                                                  .duration(p_transition.duration)
                                                  .attr("width", newSvgDims.width)
                                                  .attr("height", newSvgDims.height)
                                                  .attr("viewBox", "0 0 " + newSvgDims.width + " " + newSvgDims.height);
                                    }

                                    // Resize data tiles
                                    var tileTransition = { size: { width: p_transition.size.width - (2 * namespace.DataBar.prototype.s_elementSpacing) },
                                                           duration: p_transition.duration, }
                                    for ( var index = 0; index < this.m_metaDataTiles.length; index++ ){
                                        this.m_metaDataTiles[index].ResizeOverTime(tileTransition);
                                    }
                                    for ( var index = 0; index < this.m_topicDataTiles.length; index++ ){
                                        this.m_topicDataTiles[index].ResizeOverTime(tileTransition);
                                    }

                                   if ( "start" == p_callbackTiming ){
                                       p_callback();
                                   }

                               }.bind(this, p_transition, p_callbackTiming, p_callback, p_expand));

        // Control bar and its path (not svg) transition to new position/width
        this.m_controlBar.m_size.width = this.m_size.width;
        this.m_controlBar.m_div.transition()
                               .duration(p_transition.duration)
                               .style("width", this.m_size.width)
                               .each("start", function(p_transition){

                                   this.m_controlBar.m_barPath.transition()
                                                              .duration(p_transition.duration)
                                                              .attr("d", this.m_controlBar.GetRectPath());
                                   this.m_controlBar.m_svg.transition()
                                                          .duration(p_transition.duration)
                                                          .attr("width", this.m_size.width)
                                                          .attr("viewBox", "0 0 " + (this.m_size.width) + " " + this.m_controlBar.m_size.height);

                               }.bind(this, p_transition));

        // Ensure scroll bar stays with any highlighted topic tile at the top of the panel
        if ( this.m_highlightIndex >= 0 ){
            $(this.m_div[0][0]).scrollTop(this.m_topicDataTiles[this.m_highlightIndex].m_coordinates.y);
            this.m_topicDataTiles[this.m_highlightIndex].HighlightTile(true);
        } else {
            $(this.m_div[0][0]).scrollTop(0);
        }
    });

    namespace.DataBar.method("OnResize", function(p_packery){

        var packeryReorganize = true;
        if ( undefined !== p_packery ){
            packeryReorganize = p_packery;
        }

        var containerWidth = parseFloat(this.m_container.m_div.style("width"));
        var containerHeight = parseFloat(this.m_container.m_div.style("height"));
        var controlBarHeight = ( this.m_controlBar ) ? this.m_controlBar.m_size.height : 0;

        // Control bar resize
        if ( this.m_controlBar ){
            this.m_controlBar.m_size.width = containerWidth;
            this.m_controlBar.m_div.style("width", containerWidth);
            this.m_controlBar.m_svg.attr("width", containerWidth)
                                   .attr("viewBox", "0 0 " + containerWidth + " " + controlBarHeight);
        }

        // Panel resize (vars for potentially faster access to the dimension values)
        this.m_size.width = Math.abs(containerWidth);
        this.m_size.height = Math.abs(containerHeight - controlBarHeight);
        var divWidth = this.m_size.width;
        var divHeight = this.m_size.height;

        this.m_div.style("width", divWidth)
                  .style("height", divHeight);

        // Optional main div svg scaling
        var changeSvgDims = false;
        var newSvgDims = { width: this.m_minDims.width, height: this.m_minDims.height };
        if ( divWidth > this.m_minDims.width ){
            newSvgDims.width = divWidth;
            changeSvgDims = true;
        }

        if ( changeSvgDims ){
            this.m_svg.attr("width", newSvgDims.width)
                     .attr("height", newSvgDims.height)
                     .attr("viewBox", "0 0 " + newSvgDims.width + " " + newSvgDims.height);
        }

        // Resize data tiles
        var tileTransition = { size: { width: this.m_size.width - (2 * namespace.DataBar.prototype.s_elementSpacing) },
                               duration: 5, }
        for ( var index = 0; index < this.m_metaDataTiles.length; index++ ){
            this.m_metaDataTiles[index].ResizeOverTime(tileTransition);
        }
        for ( var index = 0; index < this.m_topicDataTiles.length; index++ ){
            this.m_topicDataTiles[index].ResizeOverTime(tileTransition);
        }

        // Panel rect resize
        this.m_panelRectDiv.style("width", divWidth)
                           .style("height", divHeight + namespace.Panel.prototype.s_borderRadius);
        this.m_panelRectSvg.attr("width", divWidth)
                           .attr("height", divHeight + namespace.Panel.prototype.s_borderRadius)
                           .attr("viewBox", "0 0 " + divWidth + " " + (divHeight + namespace.Panel.prototype.s_borderRadius));

        if ( containerWidth > parseInt(this.m_div.style("max-width")) ) {
            this.m_div.style("max-width", containerWidth);
            this.m_panelRectDiv.style("max-width", containerWidth);
        }
        if ( containerHeight > parseInt(this.m_div.style("max-height") + controlBarHeight) ) {
            this.m_div.style("max-height", containerHeight - controlBarHeight);
            this.m_panelRectDiv.style("max-height", containerHeight - controlBarHeight);
        }

        this.m_panelRect.attr("d", namespace.BottomRoundedRect(0, 0, divWidth, divHeight + namespace.Panel.prototype.s_borderRadius,
                                                               namespace.Panel.prototype.s_borderRadius));

        // Re-append this container to the level div to bump up its z-order
        this.m_container.m_div.node().parentNode.appendChild(this.m_container.m_div.node());

        // Packery re-layout call
        if ( packeryReorganize ){
            $(this.m_level.m_div[0]).packery();
        }

        if ( this.m_controlBar ){
            this.m_controlBar.UpdateBarPath(this.m_controlBar.GetRectPath());
        }

        // Force level HTML redraw in order to overcome bug where SVG elements not resized until next redraw occurs
        $(this.m_level.m_div.node().parentNode).hide().show(0);
    });

    namespace.DataBar.prototype.s_datashapeClassName = "databar_shape";
    namespace.DataBar.prototype.s_datashapeClassSelect = ".databar_shape";
    namespace.DataBar.prototype.s_datashapeTextClassName = "databar_shape_text";
    namespace.DataBar.prototype.s_datashapeTextClassSelect = ".databar_shape_text";
    namespace.DataBar.prototype.s_defaultTitle = "Information Panel";
    namespace.DataBar.prototype.s_elementSpacing = 15;


    return namespace;

}(TWiC || {}));