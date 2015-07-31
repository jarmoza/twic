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
    };

    namespace.Control.method("Initialize", function(p_parentDiv, p_fadeInControlBar){

        // Get string for control bar path rect
        var path = this.GetRectPath();

        // Add the control bar's div and svg tags
        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_control")
                                .attr("id", "div_twic_control_" + this.m_name)
                                //.style("left", this.m_coordinates.x)
                                //.style("top", this.m_coordinates.y)
                                .style("max-width", this.m_size.width)
                                .style("max-height", this.m_size.height)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height)
                                .style("background", "transparent")
                                //.style("float", "left")
                                .style("margin", 0);
                                /*.on("mousedown", function(d) {

                                    $(this).parent().addClass('draggable').parents().on('mousemove', function(e) {

                                        //console.log("Coords: " + coords[0] + "," + coords[1]);
                                        console.log("PageX: " + e.pageX + " PageY: " + e.pageY);
                                        console.log("================================");

                                        $('.draggable').offset({
                                            top: e.pageY - ($('.draggable').outerHeight() / 2),
                                            //top: coords[1] - $('.draggable').position().top,
                                            left: e.pageX - ($('.draggable').outerWidth() / 2)
                                            //left: coords[0] - $('.draggable').position().left
                                        })
                                        .on('mouseup', function() {
                                            $(this).removeClass('draggable');
                                        });
                                    });
                                    //e.preventDefault();
                                }).on('mouseup', function() {
                                    $('.draggable').removeClass('draggable');
                                });*/

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

        // Explanation '?' for demo
        /*var helpBoxOffset = {x:this.m_size.width - 50, y:this.m_coordinates.y + 10};
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
                           .style("font-size", 23);*/
    });

    namespace.Control.method("Update", function(p_data, p_updateType){});

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

    namespace.Control.method("GetRectPath", function(){
      
        // Determine the type of partially-rounded rectangle to draw
        switch ( this.m_orientation ){

            case 'top':
                var path = namespace.TopRoundedRect(this.m_coordinates.x, this.m_coordinates.x,
                                                    this.m_size.width, this.m_size.height,
                                                    namespace.Control.prototype.s_borderRadius);
                //this.m_panel.m_coordinates.y += this.m_size.height;
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
                //this.m_panel.m_coordinates.x += this.m_size.width;
                break;
            case 'right':
                var path = namespace.RightRoundedRect(this.m_coordinates.x, this.m_coordinates.y,
                                                      this.m_size.width, this.m_size.height,
                                                      namespace.Control.prototype.s_borderRadius);
                break;
        };

        return path;
    });

    namespace.Control.method("SetContainer", function(p_container){

        this.m_container = p_container;
        this.m_panel = this.m_container.m_panel;
    });

    namespace.Control.method("SetPosition", function(p_coordinates){

        this.m_coordinates.x = p_coordinates.x;
        this.m_coordinates.y = p_coordinates.y;
    });

    namespace.Control.method("SetSize", function(p_size) {
        
        this.m_size.width = p_size.width;
        this.m_size.height = p_size.height;
    })    

    namespace.Control.method("UpdateBarPath", function(p_pathString){

        // Add the path for the control bar shape (the panel/owner will determine the text/controls itself)
        this.m_barPath.attr("d", p_pathString);
    });    

    namespace.Control.prototype.s_defaultThickness = 50;
    namespace.Control.prototype.s_borderRadius = 15;

    return namespace;
}(TWiC || {}));