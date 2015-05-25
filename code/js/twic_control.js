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
           + "v" + p_height
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


    namespace.Control = function(p_parent, p_barThickness, p_orientation, p_text){

        this.m_parent = p_parent;
        this.m_barThickness = p_barThickness;
        this.m_orientation = p_orientation;
        this.m_text = p_text;

        // To be determined upon initialization
        this.m_barSize = {};
        this.m_controlSize = {};
    };

    namespace.Control.method("Initialize", function(){

        // Make a group to hold the control bar and panel
        this.m_controlGroup = this.m_parent.m_svg.append("g")
                                                .attr("class", "group_control")
                                                .attr("id", "group_control_" + this.m_parent.m_name);

        switch ( this.m_orientation ){

            case 'top':
                this.m_barSize = {width: this.m_parent.m_size.width, height:this.m_barThickness};
                this.m_controlSize = {width: this.m_parent.m_size.width, height: this.m_parent.m_size.height + this.m_barSize.height};
                var path = namespace.TopRoundedRect(this.m_parent.m_coordinates.x, this.m_parent.m_coordinates.y,
                                                    this.m_barSize.width, this.m_barSize.height,
                                                    parseInt(this.m_parent.m_div.style("border-radius")));
                break;
            case 'bottom':
                this.m_barSize = {width: this.m_parent.m_size.width, height: this.m_barThickness};
                this.m_controlSize = {width: this.m_parent.m_size.width, height: this.m_parent.m_size.height + this.m_barSize.height};
                var path = namespace.BottomRoundedRect(this.m_parent.m_coordinates.x,
                                                       this.m_parent.m_size.height - this.m_barHeight - this.m_parent.m_div.style("border-radius"),
                                                       this.m_barWidth, this.m_barHeight,
                                                       parseInt(this.m_parent.m_div.style("border-radius")));
                break;
            case 'left':
                this.m_barSize = {width: this.m_barThickness, height: this.m_parent.m_size.height};
                this.m_controlSize = {width: this.m_parent.m_size.width + this.m_barSize.width,
                                      height: this.m_parent.m_size.height};
                var path = namespace.LeftRoundedRect(this.m_parent.m_coordinates.x, this.m_parent.m_coordinates.y,
                                                     this.m_barSize.width, this.m_barSize.height,
                                                     parseInt(this.m_parent.m_div.style("border-radius")));
                break;
            case 'right':
                this.m_barSize = {width: this.m_barThickness, height: this.m_parent.m_size.height};
                this.m_controlSize = {width: this.m_parent.m_size.width + this.m_barSize, height: this.m_parent.m_size.height};
                var path = namespace.RightRoundedRect(this.m_parent.m_coordinates.x + this.m_parent.m_size.width,
                                                      this.m_parent.m_coordinates.y,
                                                      this.m_barSize.width, this.m_barSize.height,
                                                      parseInt(this.m_parent.m_div.style("border-radius")));
                break;
        };

        // Add the path for the control bar shape
        this.m_barPath = this.m_controlGroup.append("path")
                                            .attr("d", path)
                                            .attr("fill", namespace.Level.prototype.s_palette.beige)
                                            .attr("stroke", namespace.Level.prototype.s_palette.purple)
                                            .attr("stroke-width", 4.5);

        // Add the text for the control bar
        /*this.m_barTspan = this.m_controlGroup.append("text")
                                             .append("tspan")
                                             .attr("x", this.m_barSize.width >> 1)
                                             .attr("y", this.m_barSize.width * 0.65)
                                             .html(this.m_text)
                                             .attr("fill", namespace.Level.prototype.s_palette.gold)
                                             .style("font-family", namespace.Level.prototype.s_fontFamily)
                                             .style("font-size", 21);*/
    });

    namespace.Control.method("AddText", function(p_addTextCallback){

        p_addTextCallback(this);
    });


    return namespace;
}(TWiC || {}));