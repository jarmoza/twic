var TWiC = (function(namespace){

    namespace.TopRoundedRect = function(p_x, p_y, p_width, p_height, p_borderRadius){

        return "M" + p_x + "," + (p_y + p_borderRadius)
               + "a" + p_borderRadius + "," + p_borderRadius + " 0 0 1 " + p_borderRadius + "," + -p_borderRadius
               + "h" + (p_width - (2 * p_borderRadius))
               + "a" + p_borderRadius + "," + p_borderRadius + " 0 0 1 " + p_borderRadius + "," + p_borderRadius
               + "v" + (p_height - p_borderRadius)
               + "h" + -p_width
               + "z";
    };

    namespace.BottomRoundedRect = function(p_x, p_y, p_width, p_height, p_borderRadius){

          return "M" + p_x + "," + p_y
           + "h" + p_width
           + "v" + (p_height - p_borderRadius)
           + "a" + p_borderRadius + "," + p_borderRadius + " 0 0 1 " + -p_borderRadius + "," + p_borderRadius
           + "h" + -(p_width - (2 * p_borderRadius))
           + "a" + p_borderRadius + "," + p_borderRadius + " 0 0 1 " + -p_borderRadius + "," + -p_borderRadius
           + "z";
    };

    namespace.LeftRoundedRect = function(p_x, p_y, p_width, p_height, p_borderRadius){

        return "M" + (p_x + p_borderRadius)+ "," + p_y
           + "a" + -p_borderRadius + "," + p_borderRadius + " 0 0 0 " + -p_borderRadius + "," + p_borderRadius
           + "v" + (p_height - (2 * p_borderRadius))
           + "a" + p_borderRadius + "," + p_borderRadius + " 0 0 0 " + p_borderRadius + "," + p_borderRadius
           + "h" + p_width
           + "v" + -p_height
           + "z";
    };

    namespace.RightRoundedRect = function(p_x, p_y, p_width, p_height, p_borderRadius){

        return "M" + p_x + "," + p_y
           + "h" + (p_width - p_borderRadius)
           + "a" + p_borderRadius + "," + p_borderRadius + " 0 0 1 " + p_borderRadius + "," + p_borderRadius
           + "v" + (p_height - 2 * p_borderRadius)
           + "a" + p_borderRadius + "," + p_borderRadius + " 0 0 1 " + -p_borderRadius + "," + p_borderRadius
           + "h" + (p_borderRadius - p_width)
           + "z";
    };

    namespace.FullyRoundedRect = function(p_x, p_y, p_width, p_height, p_borderRadius){

        return "M" + (p_x + p_borderRadius) + "," + p_y
           + "h" + (p_width - 2 * p_borderRadius)
           + "a" + p_borderRadius + "," + p_borderRadius + " 0 0 1 " + p_borderRadius + "," + p_borderRadius
           + "v" + (p_height - 2 * p_borderRadius)
           + "a" + -p_borderRadius + "," + p_borderRadius + " 0 0 1 " + -p_borderRadius + "," + p_borderRadius
           + "h" + -(p_width - 2 * p_borderRadius)
           + "a" + p_borderRadius + "," + p_borderRadius + " 0 0 1 " + -p_borderRadius + "," + -p_borderRadius
           + "v" + -(p_height - 2 * p_borderRadius)
           + "a" + p_borderRadius + "," + p_borderRadius + " 0 0 1 " + p_borderRadius + "," + -p_borderRadius
           + "z";
    };


    namespace.Control = function(p_barThickness, p_orientation){

        this.m_barThickness = p_barThickness;
        this.m_orientation = p_orientation;
        this.m_name = namespace.GetUniqueID();
        this.m_coordinates = {x: 0, y: 0};

        // To be determined upon initialization
        this.m_size = {};

        // Initial values
        this.m_div = null;
        this.m_svg = null;
        this.m_controlGroup = null;
        this.m_barPath = null;
        this.m_barText = null;
        this.m_nextControlWidgetPos = { x: this.m_barThickness >> 1,
                                        y: this.m_barThickness * 0.65 };
        this.m_textFirstSet = false;
    };

    namespace.Control.method("GetNextWidgetPos", function(){

        return this.m_nextControlWidgetPos;
    });

    namespace.Control.method("SetNextWidgetPos", function(p_nextPos){

        this.m_nextControlWidgetPos.x = p_nextPos.x;
        this.m_nextControlWidgetPos.y = p_nextPos.y;
    });

    namespace.Control.method("Initialize", function(p_parentDiv){

        // Get string for control bar path rect
        var path = this.GetRectPath();

        // Add the control bar's div and svg tags
        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_control")
                                .attr("id", "div_twic_control_" + this.m_name)
                                .style("left", this.m_coordinates.x)
                                .style("top", this.m_coordinates.y)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height)
                                .style("max-width", this.m_size.width)
                                .style("max-height", this.m_size.height)
                                .style("background", "transparent")
                                .style("float", "left")
                                .style("margin", 0);

        this.m_svg = this.m_div.append("svg")
                               .attr("class", "svg_twic_control")
                               .attr("id", "svg_twic_control_" + this.m_name)
                               .attr("x", this.m_coordinates.x)
                               .attr("y", this.m_coordinates.y)
                               .attr("width", this.m_size.width)
                               .attr("height", this.m_size.height)
                               .attr("viewBox", "0 0 " + this.m_size.width + " " + this.m_size.height);

        // Make a group to hold the control bar components
        this.m_controlGroup = this.m_svg.append("g")
                                        .attr("class", "group_control")
                                        .attr("id", "group_control_" + this.m_name);

        // Add the path for the control bar shape (the panel/owner will determine the text/controls itself)
        this.m_barPath = this.m_controlGroup.append("path")
                                            .attr("d", path)
                                            .style("opacity", 0)
                                            .attr("fill", namespace.Level.prototype.s_palette.beige)
                                            .attr("id", "twic_barpath_" + this.m_name);
                                            // Path outline
                                            //.attr("stroke", namespace.Level.prototype.s_palette.purple)
                                            //.attr("stroke-width", 4.5);

        // Add minimizing and maximizing buttons to the control bar for the panel
        this.AddPanelSizeControls();
    });

    namespace.Control.method("Update", function(p_data, p_updateType){

        // Update each control

        // Help

        // Search

        var x = 0;
    });

    namespace.Control.method("AddHelp", function(){

        // Explanation '?'
        var helpBoxOffset = { x: this.m_size.width - 50, y: this.m_coordinates.y + 10 };
        var helpBoxPath = "M" + this.m_
        this.m_helpBox = this.m_controlGroup.append("rect")
                                            .attr("x", helpBoxOffset.x)
                                            .attr("y", helpBoxOffset.y)
                                            .attr("width", 30)
                                            .attr("height", 30)
                                            .attr("fill", TWiC.Level.prototype.s_palette.darkblue)
                                            .attr("rx", 5)
                                            .attr("ry", 5);
        this.m_helpBoxText = this.m_controlGroup.append("text")
                                                .attr("x", helpBoxOffset.x)
                                                .attr("y", helpBoxOffset.y)
                                                .attr("dx", 11)
                                                .attr("dy", 23)
                                                .attr("width", 30)
                                                .attr("height", 30)
                                                .attr("fill", TWiC.Level.prototype.s_palette.lightpurple)
                                                .attr("rx", 5)
                                                .attr("ry", 5)
                                                .html("?")
                                                .style("font-family", namespace.Level.prototype.s_fontFamily)
                                                .style("font-size", 23);
    });

    namespace.Control.method("AddPanelSizeControls", function(){

        // Add the hide button
        var circleCenter = { cx: this.m_nextControlWidgetPos.x + namespace.Control.prototype.s_sizeControlRadius,
                             cy: this.m_nextControlWidgetPos.y - (namespace.Control.prototype.s_sizeControlRadius >> 1) - (namespace.Control.prototype.s_sizeControlRadius >> 1) };
        this.m_controlGroup.append("circle")
                           .attr("cx", circleCenter.cx)
                           .attr("cy", circleCenter.cy)
                           .attr("r", namespace.Control.prototype.s_sizeControlRadius)
                           .attr("fill", namespace.Level.prototype.s_palette.hide)
                           .attr("stroke", namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorLolight,
                                                                namespace.Level.prototype.s_palette.hide))
                           .attr("stroke-width", 1);
        this.m_controlGroup.append("rect")
                           .attr("x", circleCenter.cx - namespace.Control.prototype.s_sizeControlRadius - (namespace.Control.prototype.s_sizeControlRadius >> 1))
                           .attr("y", circleCenter.cy - namespace.Control.prototype.s_sizeControlRadius - (namespace.Control.prototype.s_sizeControlRadius >> 1))
                           .attr("width", 3 * namespace.Control.prototype.s_sizeControlRadius)
                           .attr("height", 3 * namespace.Control.prototype.s_sizeControlRadius)
                           .style("opacity", 0)
                           .on(namespace.Interaction.click, function(){
                               this.m_panel.Hide(!this.m_panel.m_hidden);
                           }.bind(this))
                           .on(namespace.Interaction.mouseover, function(){
                               this.HighlightPanelSizeControls(true);
                           }.bind(this))
                           .on(namespace.Interaction.mouseout, function(){
                               this.HighlightPanelSizeControls(false);
                           }.bind(this));

        this.DrawChevron({ x: this.m_nextControlWidgetPos.x + namespace.Control.prototype.s_sizeControlRadius,
                           y: this.m_nextControlWidgetPos.y - (namespace.Control.prototype.s_sizeControlRadius >> 1) - (namespace.Control.prototype.s_sizeControlRadius >> 1)},
                           "up");
        this.DrawChevron({ x: this.m_nextControlWidgetPos.x + namespace.Control.prototype.s_sizeControlRadius,
                           y: this.m_nextControlWidgetPos.y - (namespace.Control.prototype.s_sizeControlRadius >> 1) - (namespace.Control.prototype.s_sizeControlRadius >> 1)},
                           "down");


        // Add the minimize button
        circleCenter = { cx: this.m_nextControlWidgetPos.x + 4 + (4 * namespace.Control.prototype.s_sizeControlRadius),
                         cy: this.m_nextControlWidgetPos.y - (namespace.Control.prototype.s_sizeControlRadius >> 1) - (namespace.Control.prototype.s_sizeControlRadius >> 1) };
        this.m_controlGroup.append("circle")
                           .attr("cx", circleCenter.cx)
                           .attr("cy", circleCenter.cy)
                           .attr("r", namespace.Control.prototype.s_sizeControlRadius)
                           .attr("fill", namespace.Level.prototype.s_palette.minimize)
                           .attr("stroke", namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorLolight,
                                                                namespace.Level.prototype.s_palette.minimize))
                           .attr("stroke-width", 1);
        this.m_controlGroup.append("rect")
                           .attr("x", circleCenter.cx - namespace.Control.prototype.s_sizeControlRadius - (namespace.Control.prototype.s_sizeControlRadius >> 1))
                           .attr("y", circleCenter.cy - namespace.Control.prototype.s_sizeControlRadius - (namespace.Control.prototype.s_sizeControlRadius >> 1))
                           .attr("width", 3 * namespace.Control.prototype.s_sizeControlRadius)
                           .attr("height", 3 * namespace.Control.prototype.s_sizeControlRadius)
                           .style("opacity", 0)
                           .on(namespace.Interaction.click, function(){
                               this.m_panel.Minimize();
                           }.bind(this))
                           .on(namespace.Interaction.mouseover, function(){
                               this.HighlightPanelSizeControls(true);
                           }.bind(this))
                           .on(namespace.Interaction.mouseout, function(){
                               this.HighlightPanelSizeControls(false);
                           }.bind(this));

        this.DrawMinus({ x: this.m_nextControlWidgetPos.x + 4 + (4 * namespace.Control.prototype.s_sizeControlRadius),
                         y: this.m_nextControlWidgetPos.y - (namespace.Control.prototype.s_sizeControlRadius >> 1) - (namespace.Control.prototype.s_sizeControlRadius >> 1) });

        // Add the maximize button
        circleCenter = { cx: this.m_nextControlWidgetPos.x + 8 + (7 * namespace.Control.prototype.s_sizeControlRadius),
                         cy: this.m_nextControlWidgetPos.y - (namespace.Control.prototype.s_sizeControlRadius >> 1) - (namespace.Control.prototype.s_sizeControlRadius >> 1) };
        this.m_controlGroup.append("circle")
                           .attr("cx", circleCenter.cx)
                           .attr("cy", circleCenter.cy)
                           .attr("r", namespace.Control.prototype.s_sizeControlRadius)
                           .attr("fill", namespace.Level.prototype.s_palette.maximize)
                           .attr("stroke", namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorLolight,
                                                                namespace.Level.prototype.s_palette.maximize))
                           .attr("stroke-width", 1);
        this.m_controlGroup.append("rect")
                           .attr("x", circleCenter.cx - namespace.Control.prototype.s_sizeControlRadius - (namespace.Control.prototype.s_sizeControlRadius >> 1))
                           .attr("y", circleCenter.cy - namespace.Control.prototype.s_sizeControlRadius - (namespace.Control.prototype.s_sizeControlRadius >> 1))
                           .attr("width", 3 * namespace.Control.prototype.s_sizeControlRadius)
                           .attr("height", 3 * namespace.Control.prototype.s_sizeControlRadius)
                           .style("opacity", 0)
                           .on(namespace.Interaction.click, function(){
                               this.m_panel.Maximize();
                           }.bind(this))
                           .on(namespace.Interaction.mouseover, function(){
                               this.HighlightPanelSizeControls(true);
                           }.bind(this))
                           .on(namespace.Interaction.mouseout, function(){
                               this.HighlightPanelSizeControls(false);
                           }.bind(this));

        this.DrawPlus({ x: this.m_nextControlWidgetPos.x + 8 + (7 * namespace.Control.prototype.s_sizeControlRadius),
                        y: this.m_nextControlWidgetPos.y - (namespace.Control.prototype.s_sizeControlRadius >> 1) - (namespace.Control.prototype.s_sizeControlRadius >> 1) });

        // Set the position for the next control to be added
        this.SetNextWidgetPos({ x: this.m_nextControlWidgetPos.x + 8 + (9 * namespace.Control.prototype.s_sizeControlRadius),
                                y: this.GetNextWidgetPos().y });
    });

    namespace.Control.method("AddSearch", function(){

      /*

        <div id="search_section" class="control">
          <form id="search_form" action=""  method="post">
            <p class="search_title">Search <input type="text" class="text-input" id="search" value="" /></p>
          </form>
        </div>

      */

      this.m_searchDiv = this.m_div.append("div")
                                            .attr("class", "control")
                                            .attr("id", "searchbar_" + this.m_panel.m_name)
                                            .style("position", "absolute")
                                            .style("left", this.m_container.m_size.width - 150)
                                            .style("top", 10);
      this.m_searchForm = this.m_searchDiv.append("form")
                                          .attr("class", "control_form")
                                          .attr("id", "searchform_" + this.m_panel.m_name)
                                          .attr("action", "")
                                          .attr("method", "post");
      this.m_searchInput = this.m_searchForm.append("p")
                                            .attr("class", "control_title")
                                            .append("input")
                                            .attr("class", "control_input")
                                            .attr("id", "searchinput_" + this.m_panel.m_name)
                                            .attr("type", "text")
                                            .attr("value", "");
    });

    namespace.Control.method("AddText", function(p_addTextCallback){

        p_addTextCallback(this);
    });

    namespace.Control.method("DetermineDimensions", function(){

        // Determine the type of partially-rounded rectangle to draw
        switch ( this.m_orientation ){

            case 'top':
                this.m_size = {width: this.m_panel.m_size.width, height: this.m_barThickness};
                //this.m_coordinates = {x: this.m_container.m_coordinates.x, y: this.m_container.m_coordinates.y};
                break;
            case 'bottom':
                this.m_size = {width: this.m_panel.m_size.width, height: this.m_barThickness};
                //this.m_coordinates = {x: this.m_panel.m_coordinates.x, y: this.m_panel.m_coordinates.y + this.m_panel.m_size.height - this.m_size.height - namespace.Control.prototype.s_borderRadius};
                break;
            case 'left':
                this.m_size = {width: this.m_barThickness, height: this.m_panel.m_size.height};
                //this.m_coordinates = {x: 0, y: 0};
                break;
            case 'right':
                this.m_size = {width: this.m_barThickness, height: this.m_panel.m_size.height};
                //this.m_coordinates = {x: this.m_panel.m_size.width, y: 0};
                break;
        };
    });

    namespace.Control.method("DrawChevron", function(p_coordinates, p_direction){

        var barSize = namespace.Control.prototype.s_sizeControlRadius;

        switch ( p_direction ){

            case "up":

                // Left bar
                this.m_hideHighlightLU = this.m_controlGroup.append("line")
                                                           .attr("x1", p_coordinates.x - (barSize >> 1) - (barSize >> 3))
                                                           .attr("y1", p_coordinates.y + (barSize >> 1))
                                                           .attr("x2", p_coordinates.x)
                                                           .attr("y2", p_coordinates.y - (barSize >> 1))
                                                           .attr("stroke", namespace.Level.prototype.s_palette.hide_highlight)
                                                           .attr("stroke-width", 2)
                                                           .style("opacity", 0);
                // Right bar
                this.m_hideHighlightRU = this.m_controlGroup.append("line")
                                                           .attr("x1", p_coordinates.x)
                                                           .attr("y1", p_coordinates.y - (barSize >> 1))
                                                           .attr("x2", p_coordinates.x + (barSize >> 1) + (barSize >> 3))
                                                           .attr("y2", p_coordinates.y + (barSize >> 1))
                                                           .attr("stroke", namespace.Level.prototype.s_palette.hide_highlight)
                                                           .attr("stroke-width", 2)
                                                           .style("opacity", 0);
                break;


            case "down":

                // Left bar
                this.m_hideHighlightLD = this.m_controlGroup.append("line")
                                                           .attr("x1", p_coordinates.x - (barSize >> 1) - (barSize >> 3))
                                                           .attr("y1", p_coordinates.y - (barSize >> 2))
                                                           .attr("x2", p_coordinates.x)
                                                           .attr("y2", p_coordinates.y + (barSize >> 1) + (barSize >> 3))
                                                           .attr("stroke", namespace.Level.prototype.s_palette.hide_highlight)
                                                           .attr("stroke-width", 2)
                                                           .style("opacity", 0);

                // Right bar
                this.m_hideHighlightRD = this.m_controlGroup.append("line")
                                                           .attr("x1", p_coordinates.x)
                                                           .attr("y1", p_coordinates.y + (barSize >> 1) + (barSize >> 3))
                                                           .attr("x2", p_coordinates.x + (barSize >> 1) + (barSize >> 3))
                                                           .attr("y2", p_coordinates.y - (barSize >> 2))
                                                           .attr("stroke", namespace.Level.prototype.s_palette.hide_highlight)
                                                           .attr("stroke-width", 2)
                                                           .style("opacity", 0);

                break;
        }
    });

    namespace.Control.method("DrawMinus", function(p_coordinates){

        var barSize = namespace.Control.prototype.s_sizeControlRadius;

        // Horizontal bar
        this.m_minHighlight = this.m_controlGroup.append("line")
                                                 .attr("x1", p_coordinates.x - (barSize >> 1) - (barSize >> 2))
                                                 .attr("y1", p_coordinates.y)
                                                 .attr("x2", p_coordinates.x + (barSize >> 1) + (barSize >> 2))
                                                 .attr("y2", p_coordinates.y)
                                                 .attr("stroke", namespace.Level.prototype.s_palette.min_highlight)
                                                 .attr("stroke-width", 2)
                                                 .style("opacity", 0);
    });

    namespace.Control.method("DrawPlus", function(p_coordinates){

        var barSize = namespace.Control.prototype.s_sizeControlRadius;

        // Horizontal bar
        this.m_maxHighlightH = this.m_controlGroup.append("line")
                                                  .attr("x1", p_coordinates.x - (barSize >> 1) - (barSize >> 3))
                                                  .attr("y1", p_coordinates.y)
                                                  .attr("x2", p_coordinates.x + (barSize >> 1) + (barSize >> 3))
                                                  .attr("y2", p_coordinates.y)
                                                  .attr("stroke", namespace.Level.prototype.s_palette.max_highlight)
                                                  .attr("stroke-width", 2)
                                                  .style("opacity", 0);

        // Vertical bar
        this.m_maxHighlightV = this.m_controlGroup.append("line")
                                                  .attr("x1", p_coordinates.x)
                                                  .attr("y1", p_coordinates.y - (barSize >> 1) - (barSize >> 3))
                                                  .attr("x2", p_coordinates.x)
                                                  .attr("y2", p_coordinates.y + (barSize >> 1) + (barSize >> 3))
                                                  .attr("stroke", namespace.Level.prototype.s_palette.max_highlight)
                                                  .attr("stroke-width", 2)
                                                  .style("opacity", 0);
    });

    namespace.Control.method("GetRectPath", function(){

        // Determine the type of partially-rounded rectangle to draw
        switch ( this.m_orientation ){

            case 'top':
                var path = namespace.TopRoundedRect(this.m_coordinates.x, this.m_coordinates.y,
                                                    this.m_size.width, this.m_size.height,
                                                    namespace.Control.prototype.s_borderRadius);
                break;

            case 'bottom':
                var path = namespace.BottomRoundedRect(this.m_coordinates.x, this.m_coordinates.y,
                                                       this.m_size.width, this.m_size.height,
                                                       namespace.Control.prototype.s_borderRadius);
                break;

            case 'left':
                var path = namespace.LeftRoundedRect(this.m_coordinates.x, this.m_coordinates.y,
                                                     this.m_size.width, this.m_size.height,
                                                     namespace.Control.prototype.s_borderRadius);
                break;

            case 'right':
                var path = namespace.RightRoundedRect(this.m_coordinates.x, this.m_coordinates.y,
                                                      this.m_size.width, this.m_size.height,
                                                      namespace.Control.prototype.s_borderRadius);
                break;
        };

        return path;
    });

    namespace.Control.method("HighlightPanelSizeControls", function(p_highlight){

        // Highlight all
        if ( p_highlight ){

            // Hide control
            if ( this.m_panel.m_hidden ){

                this.m_hideHighlightLD.style("opacity", 1.0);
                this.m_hideHighlightRD.style("opacity", 1.0);
                this.m_hideHighlightLU.style("opacity", 0);
                this.m_hideHighlightRU.style("opacity", 0);
            } else {

                this.m_hideHighlightLU.style("opacity", 1.0);
                this.m_hideHighlightRU.style("opacity", 1.0);
                this.m_hideHighlightLD.style("opacity", 0);
                this.m_hideHighlightRD.style("opacity", 0);
            }

            // Minimize control
            this.m_minHighlight.style("opacity", 1.0);

            // Maximize control
            this.m_maxHighlightH.style("opacity", 1.0);
            this.m_maxHighlightV.style("opacity", 1.0);

          // Unhighlight all
        } else {

            // Hide control
            this.m_hideHighlightLD.style("opacity", 0);
            this.m_hideHighlightRD.style("opacity", 0);
            this.m_hideHighlightLU.style("opacity", 0);
            this.m_hideHighlightRU.style("opacity", 0);

            // Minimize control
            this.m_minHighlight.style("opacity", 0);

            // Maximize control
            this.m_maxHighlightH.style("opacity", 0);
            this.m_maxHighlightV.style("opacity", 0);
        }
    });

    namespace.Control.method("SetContainer", function(p_container){

        this.m_container = p_container;
        this.m_panel = this.m_container.m_panel;
    });

    namespace.Control.method("SetPosition", function(p_coordinates){

        this.m_coordinates.x = p_coordinates.x;
        this.m_coordinates.y = p_coordinates.y;
    });

    namespace.Control.method("SetSize", function(p_size){

        this.m_size.width = p_size.width;
        this.m_size.height = p_size.height;
    })

    namespace.Control.method("UpdateBarPath", function(p_pathString){

        // Add the path for the control bar shape (the panel/owner will determine the text/controls itself)
        this.m_barPath.attr("d", p_pathString);
    });

    namespace.Control.prototype.s_defaultThickness = 50;
    namespace.Control.prototype.s_borderRadius = 15;
    namespace.Control.prototype.s_sizeControlRadius = 9;

    return namespace;
}(TWiC || {}));