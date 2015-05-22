var TWiC = (function(namespace){

    // From http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
    namespace.ShadeBlend = function(p,c0,c1) {

        var n=p<0?p*-1:p,u=Math.round,w=parseInt;

        if ( c0.length > 7 ) {
            var f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
            return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")"
        }
        else {
            var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
            return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
        }
    };

    // TWiC Base data shape
    namespace.DataShape = function (p_coordinates, p_size, p_name, p_level, p_panel){

        this.m_coordinates = p_coordinates;
        this.m_size = p_size;
        this.m_name = p_name;
        this.m_level = p_level;
        this.m_panel = p_panel;
    };
    namespace.DataShape.method("BindDataToNode", function(p_node){ });
    namespace.DataShape.method("AppendSVGandBindData", function(p_node){ });


    // ClusterCircle (inherits from DataShape)
    namespace.ClusterCircle = function(p_coordinates, p_size, p_nodeIndex, p_level, p_panel, p_linkedViews, p_numberCircles, p_topics, p_ideal_text, p_title){

        namespace.DataShape.apply(this, arguments);

        this.m_numberCircles = p_numberCircles;
        this.m_ideal_text = p_ideal_text;
        this.m_topTopics = [];
        this.m_title = p_title;
        this.m_radius = this.m_size;
        for ( var index = 0; index < this.m_numberCircles; index++ ){
            this.m_topTopics.push([]);
        }
        for ( index in p_topics ) {

            for ( var index2 = 0; index2 < this.m_numberCircles; index2++ ){

                if ( p_topics[index][0] == index2 + 1 ) {
                    this.m_topTopics[index2] = [index, p_topics[index][1]];
                }
            }
        }
        //for ( var index = 0; index < this.m_numberCircles; index++ )
        //   this.m_topTopics.push([p_topics[index][0], p_topics[index][1]]);
        this.m_clusterGroup = null;
        this.m_linkedViews = p_linkedViews;

    };
    namespace.ClusterCircle.inherits(namespace.DataShape);

    namespace.ClusterCircle.prototype.s_colorHighlight = 0.50;
    namespace.ClusterCircle.prototype.s_colorMidlight = -0.25;
    namespace.ClusterCircle.prototype.s_colorLolight = -0.50;
    namespace.ClusterCircle.prototype.s_unhighlightedOpacity = 0.3;
    namespace.ClusterCircle.prototype.s_semihighlightedOpacity = 0.6;


    namespace.ClusterCircle.method("Load", function(){ });

    namespace.ClusterCircle.method("BindDataToNode", function(p_node){

        p_node.center = [this.m_coordinates.x, this.m_coordinates.y];
        p_node.radius = this.m_size;
        p_node.parentDims = [parseInt(this.m_panel.m_svg.attr("width")), parseInt(this.m_panel.m_svg.attr("height"))];
    });

    namespace.ClusterCircle.method("AppendSVGandBindData", function(p_node, p_filenames){

        var currentRadius = this.m_size;
        var radiusReduction = this.m_size / this.m_numberCircles;

        // Modify the given node to be a twic cluster group (extra parent group for smooth zoom-behavior)
        this.m_clusterGroup = p_node.append("g")
                                    .attr("class", "group_twic_datashape_smoothzooming")
                                    .attr("id", "twic_clustercircle_" + this.m_level.m_objectCount)
                                    //.attr("transform", "translate(-100 -100)")
                                    //.on("mouseenter", function(d) { ClusterCircle.prototype.DarkenCluster(d); })
                                    .on("mouseout", function(){
                                        //this.m_panel.Update(null);
                                    }.bind(this))
                                    //.on("click", this.ClickToZoom(this));
                                    .on("click", function(){
                                        // Pause/unpause my panel's Update() to keep
                                        // highlighting frozen or allow it to resume
                                        var initialPauseState = this.m_panel.IsPaused();
                                        this.m_panel.Pause(!initialPauseState);

                                        // Pause/unpause all of my panel's linked views as well
                                        for ( var index = 0; index < this.m_panel.m_linkedViews.length;
                                              index++ ) {
                                            this.m_panel.m_linkedViews[index].panel.Pause(!initialPauseState);
                                        }
                                    }.bind(this))
                                    .on("dblclick", function(){
                                        this.m_panel.ClickedClusterCircle(this);
                                        //this.m_panel..m_exitTransition.Start();
                                        //console.log("Clicked on cluster " + this.m_name +
                                        //    " with color " + this.m_level.m_topicColors[this.m_name]);
                                    }.bind(this));
        this.m_level.m_objectCount += 1;

        // Add each topic circle, binding data to it
        for ( var index = this.m_numberCircles - 1; index >= 0; index-- ){

            var data = {
                // Color
                "color" : this.m_level.m_topicColors[this.m_topTopics[index][0]],
                // Topic ID
                "topicID" : this.m_topTopics[index][0],
                // Topic proportion
                "prop" : this.m_topTopics[index][1],
                // Filename for linked views reference
                "texts" : p_filenames

            };
            if ( 1 == this.m_numberCircles ){
                 // Highlight color
                 data["hicolor"] = this.m_level.m_topicColors[this.m_topTopics[index][0]];
                 // Lolight color
                 data["locolor"] = this.m_level.m_topicColors[this.m_topTopics[index][0]];
            }
            else {
                // Highlight color
                data["hicolor"] = namespace.ShadeBlend(TWiC.ClusterCircle.prototype.s_colorHighlight,
                                                 this.m_level.m_topicColors[this.m_topTopics[index][0]]);

                // Midlight color
                data["midcolor"] = namespace.ShadeBlend(TWiC.ClusterCircle.prototype.s_colorMidlight,
                                                 this.m_level.m_topicColors[this.m_topTopics[index][0]]);

                // Lolight color
                data["locolor"] = namespace.ShadeBlend(TWiC.ClusterCircle.prototype.s_colorLolight,
                                                 this.m_level.m_topicColors[this.m_topTopics[index][0]]);
            }

            if ( index > 0) {
                var arc = d3.svg.arc().innerRadius(currentRadius - radiusReduction)
                                      .outerRadius(currentRadius)
                                      .startAngle(0)
                                      .endAngle(2 * Math.PI);
                var ring = this.m_clusterGroup.append("path")
                                              .attr("d", arc)
                                              .attr("transform", "translate(" + this.m_coordinates.x.toString() + "," + this.m_coordinates.y.toString() + ")");
            }
            else {
                var ring = this.m_clusterGroup.append("circle")
                                              .attr("cx", this.m_coordinates.x)
                                              .attr("cy", this.m_coordinates.y)
                                              .attr("r", currentRadius);
            }

                               ring.datum(data)
                               .attr("class","topic_circle")
                               .attr("id", function(d){ return "topic-" + d.topicID; })

                               //.style("fill", topicColors[this.topTopics[index][0]])
                               //.style("fill", function(d){ return d.locolor; }) - Original
                               .style("fill", function(d){return d.color; })
                               .style("opacity", TWiC.ClusterCircle.prototype.s_unhighlightedOpacity)
                               .on("mouseover", function(d){
                                   this.m_panel.Update(d);
                                   for ( var index = 0; index < this.m_panel.m_linkedViews.length; index++ ){
                                       if ( "mouseover" == this.m_panel.m_linkedViews[index].update ) {
                                           this.m_panel.m_linkedViews[index].panel.Update(d);
                                       }
                                   }
                               }.bind(this))
                               .on("mouseout", function(d){
                                   this.m_panel.Update(null);
                                   for ( var index = 0; index < this.m_panel.m_linkedViews.length; index++ ){
                                       if ( "mouseover" == this.m_panel.m_linkedViews[index].update ) {
                                           this.m_panel.m_linkedViews[index].panel.Update(null);
                                       }
                                   }
                               }.bind(this));
                               /*.on("click", function(d){
                                   this.m_panel.Update(d);
                                   for ( var index = 0; index < this.m_panel.m_linkedViews.length; index++ ){
                                       if ( "click" == this.m_panel.m_linkedViews[index].update ) {
                                           this.m_panel.m_linkedViews[index].panel.Update(d);
                                       }
                                   }
                               }.bind(this));*/

            currentRadius -= radiusReduction;
        }

        /*var fontSize = 14 + (0.2 * this.m_radius);

        if ( this.m_title ){

            var textTag = this.m_clusterGroup.append("text")
                                           .attr("dx", "0")
                                           .attr("dy", "0")
                                           //.attr("fill", "#FAFAD2")
                                           .attr("fill", this.m_level.m_topicColors[this.m_topTopics[0][0]])
                                           .style("font-family", "Archer")
                                           .style("font-size", fontSize)
                                           .style("position", "relative");

            var dy = textFlow(this.m_title,
                              textTag[0][0],
                              this.m_panel.m_svg.attr("width"),
                              fontSize,
                              namespace.TopicBar.prototype.s_textInfo.yIncrement, false);

            textTag.selectAll("tspan")
                   //.attr("x", this.m_coordinates.x - (1.75 * this.m_radius))
                   //.attr("y", this.m_coordinates.y + this.m_radius + (0.25 * this.m_radius));
                   .attr("x", this.m_coordinates.x)
                   .attr("y", this.m_coordinates.y)
                   .style("opacity", namespace.ClusterCircle.prototype.s_unhighlightedOpacity);
        }*/

       /*this.m_tip = d3.tip().attr("class", "d3-tip")
                            .direction("s")
                            .offset(-this.m_radius, this.m_radius + (0.2 * this.m_radius))
                            .html("<font color=\"white\">" + this.m_title + "</font")
                            .style("font-family", "Archer")
                            .style("font-size", 14 + (0.2 * this.m_radius))
                            .style("color", "#FAFAD2");
       this.m_panel.m_svg.call(this.m_tip);
       this.m_tip.show();*/

    });

    namespace.ClusterCircle.method("HighlightCluster", function(p_topicID){

        this.m_clusterGroup.selectAll(".topic_circle")
                           .filter(function(d){ return p_topicID == d.topicID; })
                           .style("fill", function(d){ return d.color; })
                           .style("opacity", 1.0);
        this.m_clusterGroup.selectAll(".topic_circle")
                           .filter(function(d){ return p_topicID != d.topicID; })
                           //.style("fill", function(d){ return d.locolor; }) - Original
                           .style("opacity", TWiC.ClusterCircle.prototype.s_unhighlightedOpacity);
    });

    namespace.ClusterCircle.method("DarkenCluster", function(){

        this.m_clusterGroup.selectAll(".topic_circle")
                           //.style("fill", function(d){ return d.locolor; }) - Original
                           .style("opacity", TWiC.ClusterCircle.prototype.s_unhighlightedOpacity);
    });

    namespace.ClusterCircle.method("AddTextTag", function(p_text, p_fontSize, p_color, p_position, p_opacity){

        var textTag = this.m_clusterGroup.append("text")
                                         .attr("dx", "0")
                                         .attr("dy", "0")
                                         .attr("fill", p_color)
                                         .style("font-family", "Archer")
                                         .style("font-size", p_fontSize)
                                         .style("position", "relative");

        var dy = textFlow(p_text,
                          textTag[0][0],
                          this.m_panel.m_svg.attr("width"),
                          p_fontSize,
                          namespace.TopicBar.prototype.s_textInfo.yIncrement, false);

        textTag.selectAll("tspan")
               .attr("x", p_position.x)
               .attr("y", p_position.y)
               .style("opacity", p_opacity);

       /*this.m_tip = d3.tip().attr("class", "d3-tip")
                            .direction("s")
                            .offset(-this.m_radius, this.m_radius + (0.2 * this.m_radius))
                            .html("<font color=\"white\">" + this.m_title + "</font")
                            .style("font-family", "Archer")
                            .style("font-size", 14 + (0.2 * this.m_radius))
                            .style("color", "#FAFAD2");
       this.m_panel.m_svg.call(this.m_tip);
       this.m_tip.show();*/
    });

    // ClusterRect (inherits from DataShape)
    namespace.ClusterRectangle = function(p_coordinates, p_size, p_nodeIndex, p_level, p_panel, p_linkedViews, p_numberRects, p_topics, p_title){

        namespace.DataShape.apply(this, arguments);

        this.m_numberRects = p_numberRects;
        this.m_topTopics = [];
        this.m_title = p_title;

        var topicsSorted = Object.keys(p_topics).sort(function(a, b) { return p_topics[a] - p_topics[b]; });
        for ( var index = topicsSorted.length - 1, rectCount = 0; index >= 0 && rectCount < p_numberRects; index--, rectCount++ ) {
            this.m_topTopics.push([topicsSorted[index], p_topics[topicsSorted[index]]])
        }

        this.m_clusterGroup = null;
        this.m_linkedViews = p_linkedViews;
    };
    namespace.ClusterRectangle.inherits(namespace.DataShape);

    namespace.ClusterRectangle.prototype.s_colorHighlight = 0.50;
    namespace.ClusterRectangle.prototype.s_colorMidlight = -0.25;
    namespace.ClusterRectangle.prototype.s_colorLolight = -0.50;
    namespace.ClusterRectangle.prototype.s_unhighlightedOpacity = 0.3;
    namespace.ClusterRectangle.prototype.s_semihighlightedOpacity = 0.6;
    namespace.ClusterRectangle.prototype.s_borderRadius = 4;

    namespace.ClusterRectangle.method("Load", function(){ });

    namespace.ClusterRectangle.method("BindDataToNode", function(p_node){

        p_node.center = [this.m_coordinates.x + (this.m_size.width >> 1), this.m_coordinates.y + (this.m_size.height >> 1)];
        p_node.radius = Math.sqrt(((this.m_size.width >> 1) * (this.m_size.width >> 1)) + ((this.m_size.height >> 1) * (this.m_size.height >> 1)));
        p_node.size = {width:this.m_size.width, height: this.m_size.height};
        p_node.parentDims = [parseInt(this.m_panel.m_svg.attr("width")), parseInt(this.m_panel.m_svg.attr("height"))];
    });

    namespace.ClusterRectangle.method("AppendSVGandBindData", function(p_node, p_size, p_sizeReduction){

        var currentSize = p_size;
        var sizeReduction = p_sizeReduction;

        // Modify the given node to be a twic cluster group (extra parent group for smooth zoom-behavior)
        this.m_clusterGroup = p_node.append("g")
                                    .attr("class", "group_twic_datashape_smoothzooming")
                                    .attr("id", "twic_clusterrect_" + this.m_level.m_objectCount)
                                    .on("click", function(){
                                        // Pause/unpause my panel's Update() to keep
                                        // highlighting frozen or allow it to resume
                                        var initialPauseState = this.m_panel.IsPaused();
                                        this.m_panel.Pause(!initialPauseState);

                                        // Pause/unpause all of my panel's linked views as well
                                        for ( var index = 0; index < this.m_panel.m_linkedViews.length;
                                              index++ ) {
                                            this.m_panel.m_linkedViews[index].panel.Pause(!initialPauseState);
                                        }
                                    }.bind(this));
        this.m_level.m_objectCount += 1;

        // Add each topic rectangle, binding data to it (Index 0 will represent the TextRectangle at the center)
        for ( var index = this.m_numberRects - 1, rectsDrawn = 0; index > 0; index--, rectsDrawn++ ){

            var data = {
                // Color
                "color" : this.m_level.m_topicColors[this.m_topTopics[index][0]],
                // Topic ID
                "topicID" : this.m_topTopics[index][0],
                // Topic proportion
                "prop" : this.m_topTopics[index][1],
            };
            if ( 1 == this.m_numberRects ){
                 // Highlight color
                 data["hicolor"] = this.m_level.m_topicColors[this.m_topTopics[index][0]];
                 // Lolight color
                 data["locolor"] = this.m_level.m_topicColors[this.m_topTopics[index][0]];
            }
            else {
                // Highlight color
                data["hicolor"] = namespace.ShadeBlend(TWiC.ClusterRectangle.prototype.s_colorHighlight,
                                                 this.m_level.m_topicColors[this.m_topTopics[index][0]]);

                // Midlight color
                data["midcolor"] = namespace.ShadeBlend(TWiC.ClusterRectangle.prototype.s_colorMidlight,
                                                 this.m_level.m_topicColors[this.m_topTopics[index][0]]);

                // Lolight color
                data["locolor"] = namespace.ShadeBlend(TWiC.ClusterRectangle.prototype.s_colorLolight,
                                                 this.m_level.m_topicColors[this.m_topTopics[index][0]]);
            }

            this.m_clusterGroup.append("svg:rect")
                .datum(data)
                .attr("x", this.m_coordinates.x + (((sizeReduction.width >> 1) * rectsDrawn)))
                .attr("y", this.m_coordinates.y + (((sizeReduction.height >> 1) * rectsDrawn)))
                .attr("rx", TWiC.ClusterRectangle.prototype.s_borderRadius)
                .attr("ry", TWiC.ClusterRectangle.prototype.s_borderRadius)
                .attr("width", currentSize.width)
                .attr("height", currentSize.height)
                .attr("class","topic_rectangle")
                .attr("id", function(d){ return "topic-" + d.topicID; })
                .style("fill", function(d){return d.color; })
                .style("opacity", TWiC.ClusterRectangle.prototype.s_unhighlightedOpacity)
                .on("mouseover", function(d){
                    this.HighlightCluster(d);
                    for ( var index = 0; index < this.m_panel.m_linkedViews.length; index++ ){
                        if ( "mouseover" == this.m_panel.m_linkedViews[index].update ) {
                            this.m_panel.m_linkedViews[index].panel.Update(d);
                        }
                    }
                }.bind(this))
                .on("mouseout", function(d){
                    this.DarkenCluster();
                    for ( var index = 0; index < this.m_panel.m_linkedViews.length; index++ ){
                        if ( "mouseover" == this.m_panel.m_linkedViews[index].update ) {
                            this.m_panel.m_linkedViews[index].panel.Update(null);
                        }
                    }
                }.bind(this));

            currentSize.width -= sizeReduction.width;
            currentSize.height -= sizeReduction.height;
        }
    });

    namespace.ClusterRectangle.method("HighlightCluster", function(p_data){

        var filteredRects = this.m_panel.m_svg.selectAll(".topic_rectangle")
                                               .filter(function(d){ return p_data.topicID == d.topicID; })
                                               .style("opacity", 1.0);

        this.m_panel.m_svg.selectAll(".topic_rectangle")
                           .filter(function(d){ return p_data.topicID != d.topicID; })
                           .style("opacity", TWiC.ClusterRectangle.prototype.s_unhighlightedOpacity);

        filteredRects.each(function(d){
            d3.select(this.parentNode)
              .selectAll(".topic_rectangle")
              .filter(function(d){return d.topicID != p_data.topicID; })
              .style("opacity", 1.0);

        });
    });



    namespace.ClusterRectangle.method("DarkenCluster", function(){

        this.m_panel.m_svg.selectAll(".topic_rectangle")
                           .style("opacity", TWiC.ClusterRectangle.prototype.s_unhighlightedOpacity);

    });

    namespace.ClusterRectangle.method("AddTextTag", function(p_text, p_fontSize, p_color, p_position, p_opacity){

        var textTag = this.m_clusterGroup.append("text")
                                         .attr("dx", "0")
                                         .attr("dy", "0")
                                         .attr("fill", p_color)
                                         .style("font-family", "Archer")
                                         .style("font-size", p_fontSize)
                                         .style("position", "relative");

        var dy = textFlow(p_text,
                          textTag[0][0],
                          this.m_panel.m_svg.attr("width"),
                          p_fontSize,
                          namespace.TopicBar.prototype.s_textInfo.yIncrement, false);

        textTag.selectAll("tspan")
               .attr("x", p_position.x)
               .attr("y", p_position.y)
               .style("opacity", p_opacity);
    });


    // TextRectangle constructor
    namespace.TextRectangle = function(p_coordinates, p_size, p_filenumber, p_level, p_panel, p_linkedViews, p_clusterIndex){

        namespace.DataShape.apply(this, arguments);

        this.m_data = null;
        this.m_tipLines = [];
        this.m_showingTip = false;
        this.m_tip = null;
        this.m_size.width = this.m_size.width * namespace.TextRectangle.prototype.multiplier;
        this.m_size.height = this.m_size.height * namespace.TextRectangle.prototype.multiplier;
        this.m_clusterIndex = p_clusterIndex;
    };
    namespace.TextRectangle.inherits(namespace.DataShape);

    // Static members of TextRectangle
    namespace.TextRectangle.prototype.multiplier = 2;
    namespace.TextRectangle.prototype.spaceAroundText = 2 * namespace.TextRectangle.prototype.multiplier;
    namespace.TextRectangle.prototype.borderWidth = 2 * namespace.TextRectangle.prototype.multiplier;
    namespace.TextRectangle.prototype.cornerRadius = 2 * namespace.TextRectangle.prototype.multiplier;

    namespace.TextRectangle.prototype.fillColor = "#002240";
    namespace.TextRectangle.prototype.strokeWidth = 2 * namespace.TextRectangle.prototype.multiplier;
    namespace.TextRectangle.prototype.wordLength = 2 * namespace.TextRectangle.prototype.multiplier;
    namespace.TextRectangle.prototype.spaceBetweenLines = 2 * namespace.TextRectangle.prototype.multiplier;

    //namespace.TextRectangle.prototype.defaultFontColor = "lightgoldenrodyellow";
    namespace.TextRectangle.prototype.defaultFontColor = "#FAFAD2";
    namespace.TextRectangle.prototype.jsonDirectory = "data/input/json/texts/";
    namespace.TextRectangle.prototype.tipYOffset = 10;

    namespace.TextRectangle.method("Load", function() {

        this.m_level.m_queue.defer(function(callback) {

            // Queue up loading of the text
            d3.json(namespace.TextRectangle.prototype.jsonDirectory + this.m_name + ".json", function(error, data) {

                this.m_data = data.document;

                // Determine the rectangle dimensions now that the json is loaded
                this.CalculateSize();

                // Construct the tooltip highlights
                //this.BuildTipLines();

                callback(null, this.m_data);

            }.bind(this));
        }.bind(this));
    });

    namespace.TextRectangle.method("CalculateSize", function () {

        this.m_size = { "width": 0,
                        "height": (this.m_data.lines_and_colors.length *
                                   (namespace.TextRectangle.prototype.strokeWidth + namespace.TextRectangle.prototype.spaceBetweenLines)) +
                                    (4 * namespace.TextRectangle.prototype.borderWidth) - (2 * namespace.TextRectangle.prototype.spaceBetweenLines) };

        for ( var index = 0; index < this.m_data.lines_and_colors.length; index ++ ) {

            var wordCountPixels = Object.keys(this.m_data.lines_and_colors[index][1]).length * namespace.TextRectangle.prototype.wordLength;
            if ( wordCountPixels > this.m_size["width"] ) {
                this.m_size["width"] = wordCountPixels;
            }
        }

        this.m_radius = Math.sqrt(((this.m_size.width >> 1) * (this.m_size.width >> 1)) + ((this.m_size.height >> 1) * (this.m_size.height >> 1)));

        this.m_size["width"] += (4 * namespace.TextRectangle.prototype.spaceAroundText);
    });

    namespace.TextRectangle.method("BuildTipLines", function () {

        // Extract the lines of text
        var textLines = [];
        text_line_index = 0;
        this.m_data.lines_and_colors.forEach(function(entry) {
            textLines.push([text_line_index, entry[0].trim()]);
            text_line_index += 1;
        });

        // Build tip text lines
        for ( line_index = 0; line_index < textLines.length; line_index++ ) {
            var tipString = "";
            var words = this.m_data.lines_and_colors[line_index][0].trim().split(' ');
            var wordmap_length = Object.keys(this.m_data.lines_and_colors[line_index][1]).length;
            for ( word_index = 0; word_index < wordmap_length; word_index++ ) {
                if ( -1 == this.m_data.lines_and_colors[line_index][1][word_index] ) {
                    tipString = tipString + " " + words[word_index];
                }
                else {
                    tipString = tipString + " " + "<font color=\"" +
                    this.m_level.m_topicColors[this.m_data.lines_and_colors[line_index][1][word_index]] + "\">" + words[word_index] + "</font>";
                }
            }
            this.m_tipLines.push(tipString);
        }
    });

    namespace.TextRectangle.method("Draw", function () {

        //console.log("Drawing text rectangle with panel cluster index " + this.m_panel.m_clusterIndex +
        //    " and color " + this.m_level.m_topicColors[this.m_panel.m_clusterIndex]);

        // Version of member variables for closure binding
        topicColors = this.m_level.m_topicColors;
        lines_and_colors = this.m_data.lines_and_colors;
        this.startingPosition = {x:this.m_coordinates.x,y:this.m_coordinates.y};

        // Tip lines Part 1

        // Add mouseover tips to each line showing the full colored line
        /*current_line_index = 0
        tipLines = this.m_tipLines
        var tip = d3.tip()
         .attr('class', 'd3-tip')
         .offset([-10, 0])
         .direction('e')
         .html(function(d) {
            var tipString = tipLines[current_line_index];
            current_line_index += 1;
            return tipString;
         }.bind(tipLines));
        var svg = d3.select("svg");
        svg.call(tip);*/

        // Title tip line
        this.m_tip = d3.tip().attr("class", "d3-tip")
                          .offset([-10,0])
                          .direction("e")
                          .html("<font color=\"black\">" + this.m_data.title + "</font");
        this.m_panel.m_svg.call(this.m_tip);


        // Append a new group element to the svg, this will represent the TextRectangle's overall "node"
        //file_id = "text" + this.m_filename.split('.')[0]
        file_id = "textrect_node_" + this.m_name;
        node = this.m_panel.m_clusterSvgGroup.append("g")
                                 .attr("class", "node")
                                 .attr("id", file_id)
                                 .attr("filter", "url(#lightMe" + file_id + ")")
                                 .style("position", "absolute")
                                 .on("click", function(){
                                     for ( var index = 0; index < this.m_panel.m_linkedViews.length; index++ ) {
                                         if ( "click" == this.m_panel.m_linkedViews[index].update ) {

                                             this.m_panel.m_linkedViews[index].panel.Update({json:this.m_data, clusterIndex: this.m_panel.m_clusterIndex});
                                         }
                                     }
                                 }.bind(this));
                                 /*.on("mouseover", function(){
                                     if ( !this.m_showingTip ) {

                                         var mouseCoords = d3.mouse(this.m_panel.m_svg.select("#textrect_node_" + this.m_name).node());
                                         this.m_tip.offset([mouseCoords[0] - (mouseCoords[0] - this.m_coordinates.x) + (this.m_size.width >> 1),
                                                            mouseCoords[1] - (mouseCoords[1] - this.m_coordinates.y) - namespace.TextRectangle.prototype.tipYOffset])
                                         this.m_tip.show();
                                         this.m_showingTip = true;


                                         //this.m_panel.m_svg.select("#" + "textrect_node_" + this.m_name).attr("filter", "url(#lightMe" + this.m_name + ")");
                                     }
                                 }.bind(this))
                                 .on("mouseout", function(){

                                     if ( !this.IsPointInRect(d3.mouse(this.m_panel.m_svg.select("#textrect_node_" + this.m_name).node())) ) {

                                         this.m_tip.hide();
                                         this.m_showingTip = false;
                                         //this.m_panel.m_svg.select("#" + "textrect_node_" + this.m_name).attr("filter", "url(#dontlightMe" + this.m_name + ")");
                                     }
                                 }.bind(this));*/

        //var node_lightChild = node.append("g").attr("id", file_id + "_child");

        var filter = this.m_panel.m_clusterSvgGroup.append("svg:filter")
                               .attr("id", "lightMe" + file_id);
        filter.append("svg:feDiffuseLighting")
              .attr("in", "SourceGraphic")
              .attr("result", "light" + file_id)
              .attr("lighting-color", "white")
              .append("svg:fePointLight")
              .attr("x", this.m_coordinates.x)
              .attr("y", this.m_coordinates.y)
              .attr("z", "30");
        filter.append("svg:feComposite")
              .attr("in", "SourceGraphic")
              .attr("in2", "light")
              .attr("operator", "arithmetic")
              .attr("k1", "1")
              .attr("k2", "0")
              .attr("k3", "0")
              .attr("k4", "0");

        var nofilter = this.m_panel.m_clusterSvgGroup.append("svg:filter")
                               .attr("id", "dontlightMe" + file_id);
        nofilter.append("svg:feDiffuseLighting")
              .attr("in", "SourceGraphic")
              .attr("result", "dontlight" + file_id)
              .attr("lighting-color", "white")
              .append("svg:fePointLight")
              .attr("x", this.m_coordinates.x)
              .attr("y", this.m_coordinates.y)
              .attr("z", "10");
        nofilter.append("svg:feComposite")
              .attr("in", "SourceGraphic")
              .attr("in2", "light")
              .attr("operator", "arithmetic")
              .attr("k1", "1")
              .attr("k2", "0")
              .attr("k3", "0")
              .attr("k4", "0");

        // Bind the text data to a group element (children will access this via .parentNode.__data__)
        textInfoSelection = node.append("g")
                                .attr("class", "text_info")
                                .style("position", "absolute")
                                //.attr("filter", "url(#lightMe" + file_id + ")")
                                .datum(this.m_data);

        /*var numTopTopics = 5;
        var totalBorderWidth = numTopTopics * namespace.TextRectangle.prototype.borderWidth;

        var clusterRectStart = {x: this.m_coordinates.x - totalBorderWidth - (namespace.TextRectangle.prototype.borderWidth >> 1),
                                y: this.m_coordinates.y - totalBorderWidth - (namespace.TextRectangle.prototype.borderWidth >> 1)};
        var clusterRectBounds ={width: this.m_size.width + (2 * totalBorderWidth) - namespace.TextRectangle.prototype.borderWidth,
                                height: this.m_size.height + (2 * totalBorderWidth) - namespace.TextRectangle.prototype.borderWidth};
        var topicColorIndex = 0;
        for ( var index = 0; index < this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"].length; index++ ) {
            if ( this.m_name == this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index].name ) {
                topicColorIndex = index;
                break;
            }
        }
        var clusterRect = new TWiC.ClusterRectangle(clusterRectStart, clusterRectBounds,
        this.m_name, this.m_level, this.m_panel, this.m_linkedViews, numTopTopics, this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][topicColorIndex]["topics"], this.m_name);
        // p_coordinates, p_size, p_nodeIndex, p_level, p_panel, p_linkedViews, p_numberRects, p_topics, p_title
        var clusterRectGroup = textInfoSelection.append("g").attr("id", "g_clusterrectgroup_" + this.m_name);
        clusterRect.BindDataToNode(clusterRectGroup);
        clusterRect.AppendSVGandBindData(clusterRectGroup, clusterRectBounds, {width: (2 * namespace.TextRectangle.prototype.borderWidth), height:(2 * namespace.TextRectangle.prototype.borderWidth)});*/


        // Create a rounded rectangle on the svg under the lines, sized to the max length of the lines (for now)
        var textRect = textInfoSelection.append("svg:rect")
                         .attr("class", "text_info_rect")
                         //.attr("filter", "url(#lightMe" + file_id + ")")
                         .attr("x", this.m_coordinates.x - namespace.TextRectangle.prototype.borderWidth)
                         .attr("y", this.m_coordinates.y - namespace.TextRectangle.prototype.borderWidth)
                         .attr("width", this.m_size["width"])
                         .attr("height", this.m_size["height"])
                         .attr("rx", namespace.TextRectangle.prototype.cornerRadius)
                         .attr("ry", namespace.TextRectangle.prototype.cornerRadius)
                         .style("stroke-width", namespace.TextRectangle.prototype.borderWidth)
                         //.style("border-style", "solid")
                         .style("stroke", this.m_level.m_topicColors[this.m_panel.m_clusterIndex])
                         .style("fill", namespace.TextRectangle.prototype.fillColor)
                         .style("position", "absolute");


        // Tip lines Part 2

        /*current_line_index = 0
        textInfoSelection.selectAll("g")
          .data(this.m_tipLines)
          .enter()
          .append("g")
          .attr("class", function(d) {
            retval = "line" + current_line_index + " d3-tip";
            current_line_index += 1;
            return retval;
          })
          .on('mouseover', tip.show)
          .on('mouseout', tip.hide);*/


        // Create a path element for each word on each line (NOTE: We'll see how expensive this is)

        for ( var index = 0; index < this.m_data.lines_and_colors.length; index++ ) {

            var lcArray = [];
            var wordIndices = Object.keys(this.m_data.lines_and_colors[index][1]);
            for ( var index2 = 0; index2 < wordIndices.length; index2++ ) {
                lcArray.push({"l":index, "w":wordIndices[index2]});
            }

            //textInfoSelection.select("g.line" + index)
            textInfoSelection.append("g")
                             .attr("class", "line" + index)
                             //.attr("filter", "url(#lightMe" + file_id + ")")
                             .style("position", "absolute")
                             .selectAll("path")
                             .data(lcArray)
                             .enter()
                             .append("path")
                             //.attr("filter", "url(#lightMe" + file_id + ")")
                             .style("stroke", function(d) {

                                 var topic_color_index = this.m_data.lines_and_colors[d.l][1][d.w];
                                 if ( -1 == topic_color_index ){
                                     return namespace.TextRectangle.prototype.defaultFontColor;
                                 }
                                 else {
                                     return this.m_level.m_topicColors[topic_color_index];
                                 }

                             }.bind(this))
                             .style("stroke-width", namespace.TextRectangle.prototype.strokeWidth + "px")
                             .attr("d", function(d) {

                                 if ( "0" == d.w ) {
                                     this.startingPosition["x"] = namespace.TextRectangle.prototype.spaceAroundText + this.m_coordinates.x;
                                     if ( d.l > 0 ) {
                                         this.startingPosition["y"] += namespace.TextRectangle.prototype.spaceBetweenLines + namespace.TextRectangle.prototype.strokeWidth;
                                     }
                                     else {
                                         this.startingPosition["y"] += namespace.TextRectangle.prototype.spaceAroundText;
                                     }
                                 }
                                 var pathString = "M " + this.startingPosition["x"] + "," + this.startingPosition["y"] + " " + (this.startingPosition["x"] + namespace.TextRectangle.prototype.wordLength) + "," + this.startingPosition["y"];
                                 this.startingPosition["x"] += namespace.TextRectangle.prototype.wordLength;

                                 return pathString;
                             }.bind(this))
                             .style("position", "absolute")
                             .style("opacity", function(d){
                                 var topic_color_index = this.m_data.lines_and_colors[d.l][1][d.w];
                                 if ( -1 == topic_color_index ){
                                     return 1.0;
                                 }
                                 else {
                                     return 1.0;
                                 }
                             }.bind(this))
                             .on("mouseover", function(d){

                                 var d = { topicID: this.m_data.lines_and_colors[d.l][1][d.w],
                                           color: this.m_level.m_topicColors[this.m_data.lines_and_colors[d.l][1][d.w]]};
                                 if ( -1 != d.topicID ) {
                                     for ( var index = 0; index < this.m_panel.m_linkedViews.length; index++ ){
                                         if ( "mouseover" == this.m_panel.m_linkedViews[index].update ) {
                                             this.m_panel.m_linkedViews[index].panel.Update(d);
                                         }
                                     }
                                 }
                             }.bind(this))
                             .on("mouseout", function(d){
                                 for ( var index = 0; index < this.m_panel.m_linkedViews.length; index++ ){
                                     if ( "mouseover" == this.m_panel.m_linkedViews[index].update ) {
                                         this.m_panel.m_linkedViews[index].panel.Update(null);
                                     }
                                 }
                             }.bind(this));
        }
    });

    namespace.TextRectangle.method("BindDataToNode", function(p_node){

        p_node.center = [this.m_coordinates.x + (this.m_size.width >> 1), this.m_coordinates.y + (this.m_size.height >> 1)];
        p_node.radius = Math.sqrt(((this.m_size.width >> 1) * (this.m_size.width >> 1)) + ((this.m_size.height >> 1) * (this.m_size.height >> 1)));
        p_node.parentDims = [parseInt(this.m_panel.m_svg.attr("width")), parseInt(this.m_panel.m_svg.attr("height"))];
    });

    namespace.TextRectangle.method("IsPointInRect", function(p_point) {

        return ( p_point[0] > this.m_coordinates.x && p_point[0] < this.m_size.width &&
                 p_point[1] > this.m_coordinates.y && p_point[1] < this.m_size.height );

    });

    return namespace;

}(TWiC || {}));