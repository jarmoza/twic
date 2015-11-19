var TWiC = (function(namespace){

    // TWiC Base data shape
    namespace.DataShape = function(p_coordinates, p_size, p_name, p_level, p_panel){

        this.m_coordinates = p_coordinates;
        this.m_size = p_size;
        this.m_name = p_name;
        this.m_level = p_level;
        this.m_panel = p_panel;
    };

    namespace.DataShape.method("AllowInteractions", function(p_interactionType){

        var allow = false;
        switch ( p_interactionType ){
            case namespace.Interaction.dblclick:
                allow = this.m_allowDblclick;
                break;
            default:
                allow = true;
                break;
        }

        return allow;
    });

    namespace.DataShape.method("Draw", function(p_node){

        var x = 0;
    });

    namespace.DataShape.method("GenerateDataTiles", function(){

        return null;
    });

    namespace.DataShape.method("Load", function(){

        var x = 0;
    });

    namespace.DataShape.method("ReappendShape", function(){

        this.m_shapeGroup.node().parentNode.parentNode.appendChild(this.m_shapeGroup.node().parentNode);
    });

    namespace.DataShape.prototype.s_colorHighlight = 0.50;
    namespace.DataShape.prototype.s_colorMidlight = -0.25;
    namespace.DataShape.prototype.s_colorLolight = -0.50;
    namespace.DataShape.prototype.s_unhighlightedOpacity = 0.3;
    namespace.DataShape.prototype.s_semihighlightedOpacity = 0.3;

    // TWiC TopicBullseye (inherits from DataShape)
    namespace.TopicBullseye = function(p_coordinates, p_size, p_nodeIndex, p_level, p_panel, p_linkedViews, p_numberCircles, p_topics, p_title, p_corpusBullseye){

        // Apply the base class arguments
        namespace.DataShape.apply(this, arguments);

        // Save other TopicBullseye-specific parameters
        this.m_linkedViews = p_linkedViews;
        this.m_numberCircles = p_numberCircles;

        // Get the top N topics
        this.m_fullTopicListRef = p_topics;
        this.m_topTopics = [];
        this.m_topicProportionSum = 0;
        for ( var index = 0; index < this.m_numberCircles; index++ ){
            this.m_topTopics.push([]);
        }

        for ( index in p_topics ) {

            for ( var index2 = 0; index2 < this.m_numberCircles; index2++ ){

                if ( p_topics[index][0] == index2 + 1 ) {
                    this.m_topTopics[index2] = [index, p_topics[index][1]];
                }
            }
            this.m_topicProportionSum += p_topics[index][1];
        }

        // Other class members
        this.m_allowDblclick = true;
        this.m_radius = this.m_size;
        this.m_scaledRadius = false;
        this.m_shapeGroup = null;
        this.m_title = p_title;
        this.m_shapeChar = namespace.TopicBullseye.prototype.s_shapeChar;

        // Determine the number of texts this bullseye represents
        this.m_isCorpusBullseye = p_corpusBullseye;
        if ( this.m_isCorpusBullseye ){

            this.m_textCount = 0;
            var corpusTopicCount = this.m_level.m_corpusInfo.corpus_info[1].length;
            for ( var index = 0; index < corpusTopicCount; index++ ){
                this.m_textCount += this.m_level.m_corpusMap["children"][index]["children"].length;
            }
        } else {
            this.m_textCount = this.m_level.m_corpusMap["children"][parseInt(p_title)]["children"].length;
        }
    };
    namespace.TopicBullseye.inherits(namespace.DataShape);

    namespace.TopicBullseye.method("AddTextTag", function(p_text, p_fontSize, p_color, p_position, p_opacity, p_optionalGroup){

        // Add the text tag to the shape's svg group
        var parentGroup = ( undefined === p_optionalGroup ) ? this.m_shapeGroup : p_optionalGroup;

        this.m_textTag = parentGroup.append("text")
                                    //.attr("class", "topicbullseye_text")
                                    .attr("class", this.m_panel.s_datashapeTextClassName)
                                    .attr("dx", "0")
                                    .attr("dy", "0")
                                    .attr("fill", p_color)
                                    .style("font-family", namespace.Level.prototype.s_fontFamily)
                                    .style("font-size", p_fontSize)
                                    .style("position", "relative");

        // Generate the number of necessary tspans for the given text
        var dy = textFlow(p_text,
                          this.m_textTag[0][0],
                          this.m_panel.m_svg.attr("width"),
                          p_fontSize,
                          namespace.TopicBar.prototype.s_textInfo.yIncrement, false);

        // Position and style the generated tspans
        this.m_textTag.selectAll("tspan")
                      .attr("x", p_position.x)
                      .attr("y", p_position.y)
                      .style("opacity", p_opacity);
    });

    namespace.TopicBullseye.method("Draw", function(p_node, p_filenames){

        // Radii can optionally be scaled by top topic proportion and number of this TopicBullseye's siblings
        var currentRadius = this.m_size;
        if ( this.m_scaledRadius ){
            var textCountForCalculation = ( this.m_isCorpusBullseye ) ? 50 : this.m_textCount;
            currentRadius = Math.max(this.m_size,
                                     this.m_size + (textCountForCalculation * (this.m_level.m_corpusInfo.corpus_info[1][this.m_topTopics[0][0]])));
            this.m_size = this.m_radius = currentRadius;
        }
        var radiusReduction = currentRadius / this.m_numberCircles;

        // Modify the given node to be a twic cluster group (extra parent group for smooth zoom-behavior)
        this.m_shapeGroup = p_node.append("g")
                                  .attr("class", "group_twic_datashape_smoothzooming")
                                  .attr("id", "twic_clustercircle_" + this.m_level.m_objectCount);

        this.m_level.m_objectCount += 1;

        // Add each topic circle, binding data to it
        for ( var index = this.m_numberCircles - 1; index >= 0; index-- ){

            var data = {

                // Color
                color: this.m_level.m_topicColors[this.m_topTopics[index][0]],

                // Topic ID
                topicID: this.m_topTopics[index][0],

                // Topic proportion
                prop: this.m_topTopics[index][1],

                // Filename for linked views reference
                texts: p_filenames,

                // Reference to this shape
                shapeRef: this
            };

            // Lolight color
            if ( 1 == this.m_numberCircles ){
                data.locolor = this.m_level.m_topicColors[this.m_topTopics[index][0]];
            }
            else {
                //data.locolor = namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorLolight,
                //                                    this.m_level.m_topicColors[this.m_topTopics[index][0]]);
                data.locolor = this.m_level.m_topicColorsLoBlend[this.m_topTopics[index][0]];
            }

            if ( index > 0 ) {
                var arc = d3.svg.arc().innerRadius(currentRadius - radiusReduction)
                                      .outerRadius(currentRadius)
                                      .startAngle(0)
                                      .endAngle(2 * Math.PI);
                var ring = this.m_shapeGroup.append("path")
                                            .attr("d", arc)
                                            .attr("transform", "translate(" + this.m_coordinates.x.toString() + "," +
                                                                this.m_coordinates.y.toString() + ")");
            }
            else {
                var ring = this.m_shapeGroup.append("circle")
                                            .attr("cx", this.m_coordinates.x)
                                            .attr("cy", this.m_coordinates.y)
                                            .attr("r", currentRadius);
            }

            // Style the ring or circle
            ring.datum(data)
                .attr("class", this.m_panel.s_datashapeClassName)
                .attr("id", function(d){ return "topic-" + d.topicID; })
                .style("fill", function(d){ return d.color; })
                .style("opacity", 1.0)
                .on(namespace.Interaction.mouseover, function(d){

                    namespace.TopicBullseye.prototype.MouseBehavior(this, d, namespace.Interaction.mouseover);

                    // Re-add all cluster bullseyes here
                    this.m_panel.ReappendShapes();

                    // Re-append the cluster circle group to bump up its z-order to top
                    this.ReappendShape();
                    //this.m_shapeGroup.node().parentNode.parentNode.appendChild(this.m_shapeGroup.node().parentNode);

                    // Future animation - TBD
                    /*var ring = this.m_panel.m_svg.selectAll(this.m_panel.s_datashapeClassName).selectAll("#topic-" + d.topicID);
                    ring.transition()
                        .ease("bounce")
                        .duration(1000)
                        .attr("transform", "translate(-10,0)")
                        .each("end", function(){
                            ring.transition()
                                .ease("bounce")
                                .duration(1000)
                                .attr("transform", "translate(0,0)");
                        }.bind(this));*/

                }.bind(this))
                .on(namespace.Interaction.mouseout, function(d){
                    namespace.TopicBullseye.prototype.MouseBehavior(this, null, namespace.Interaction.mouseout);
                }.bind(this))
                .on(namespace.Interaction.click, function(d){

                    // Single click with timer to overcome on.click being fired before on.dblclick
                    if ( this.m_clickTimerID ){

                        clearTimeout(this.m_clickTimerID);
                        this.m_clickTimerID = null;

                        // Do double click code here
                        namespace.TopicBullseye.prototype.MouseBehavior(this, d, namespace.Interaction.dblclick);
                    } else {

                        this.m_clickTimerID = setTimeout(function(p_data){

                            this.m_clickTimerID = null;

                            // Do single click code here
                            namespace.TopicBullseye.prototype.MouseBehavior(this, p_data, namespace.Interaction.click);
                        }.bind(this, d), 250);
                    }
                }.bind(this));

            // Decrement the current radius to draw the next inner most ring
            currentRadius -= radiusReduction;
        }
    });

    namespace.TopicBullseye.method("GenerateDataTiles", function(){

        var dataBarInfo = {
            dataTileGroups: [],
            panelTitle: namespace.DataBar.prototype.s_defaultTitle,
            panelTitleID: "",
            dist2avg: 0
        };

        // Four possible data representations
        // 1. Corpus Avg Bullseye
        if ( this.m_level.m_corpusMap["name"] == this.m_name ){

            dataBarInfo.panelTitle = this.m_name;
        }
        // 2. Corpus Cluster Bullseye (m_name will just be the topic ID number)
        else if ( !isNaN(parseInt(this.m_name)) ){

            dataBarInfo.panelTitle = "Topic Cluster";
            dataBarInfo.panelTitleID = this.m_name;

            //dist2avg = p_data.shapeRef.m_panel.m_objectsJSON[parseInt(p_data.shapeRef.m_title)].dist2avg;
            dataBarInfo.dist2avg = this.m_panel.m_adjustedDistances[parseInt(this.m_title)] -
                                   (( this.m_panel.b_adjustDistances ) ? this.m_panel.m_linkDistLimits.min : 0);
            dataBarInfo.dist2avg = Math.abs(dataBarInfo.dist2avg);
        }
        // 3. Avg of Corpus Clusters Bullseye
        else if ( namespace.CorpusClusterView.prototype.s_infoFlavorText == this.m_name ){

            dataBarInfo.panelTitle = this.m_name;
        }
        // 4. Avg of Text Cluster Bullseye
        else if ( namespace.TextClusterView.prototype.s_infoFlavorText == this.m_name ){

            dataBarInfo.panelTitle = this.m_name;
            dataBarInfo.panelTitleID = this.m_panel.m_clusterIndex;
        }

        // Generate the tile groups for this shape



        return dataTiles;
    })

    namespace.TopicBullseye.method("SetPanelNodeIndex", function(p_panelNodeIndex){

        this.m_panelNodeIndex = p_panelNodeIndex;
    });

    namespace.TopicBullseye.method("SetScaledRadius", function(p_state){

        this.m_scaledRadius = p_state;
    });

    namespace.TopicBullseye.method("SetX", function(p_newX){

        this.m_coordinates.x = p_newX;

        this.m_shapeGroup.selectAll("path")
                         .attr("transform", "translate(" + this.m_coordinates.x.toString() + "," +
                                                           this.m_coordinates.y.toString() + ")");
        this.m_shapeGroup.selectAll("circle")
                         .attr("cx", this.m_coordinates.x);
    });

    namespace.TopicBullseye.method("SetY", function(p_newY){

        this.m_coordinates.y = p_newY;

        this.m_shapeGroup.selectAll("path")
                         .attr("transform", "translate(" + this.m_coordinates.x.toString() + "," +
                                                           this.m_coordinates.y.toString() + ")");
        this.m_shapeGroup.selectAll("circle")
                         .attr("cy", this.m_coordinates.y);
    });

    namespace.TopicBullseye.method("SetTextCount", function(p_textCount){

        this.m_textCount = p_textCount;
    });

    namespace.TopicBullseye.prototype.MouseBehavior = function(p_bullseye, p_data, p_mouseEventType){

        // Unhighlighted
        if ( -1 == p_bullseye.m_level.m_highlightedTopic ){

            // (1) Unhighlighted (Is Always Unpaused)
            //   (A) Mouseover --> Highlights topic ring and topic elsewhere in linked panels
            //   (B) Click --> Mimics mouseover when unhighlighted (a) --> Pauses state of panel and linked panels
            //   (C) Double-Click --> Mimics click when unhighlighted (b) --> Opens underlying panel if not already open
            //   (D) Mouseout --> Nothing

            switch ( p_mouseEventType ){

                // (A) Mouseover --> Highlights topic ring and topic elsewhere in linked panels
                case namespace.Interaction.mouseover:

                    p_bullseye.m_panel.Update(p_data, namespace.Interaction.mouseover);
                    for ( var index = 0; index < p_bullseye.m_panel.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == p_bullseye.m_panel.m_linkedViews[index].update ){
                            p_bullseye.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                    }

                    break;

                // (B) Click --> Mimics mouseover when unhighlighted (a) --> Pauses state of panel and linked panels
                case namespace.Interaction.click:

                    p_bullseye.m_panel.Update(p_data, namespace.Interaction.mouseover);
                    p_bullseye.m_panel.Pause(true);
                    for ( var index = 0; index < p_bullseye.m_panel.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == p_bullseye.m_panel.m_linkedViews[index].update ){

                            if ( p_bullseye.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                p_bullseye.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_bullseye }, namespace.Interaction.click);
                            }
                            p_bullseye.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                        p_bullseye.m_panel.m_linkedViews[index].panel.Pause(true);
                    }

                    break;

                // (C) Double-Click --> Mimics click when unhighlighted (b) --> Opens underlying panel if not already open
                case namespace.Interaction.dblclick:

                    p_bullseye.m_panel.Update(p_data, namespace.Interaction.mouseover);
                    p_bullseye.m_panel.Pause(true);
                    for ( var index = 0; index < p_bullseye.m_panel.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == p_bullseye.m_panel.m_linkedViews[index].update ){

                            if ( p_bullseye.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                p_bullseye.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_bullseye }, namespace.Interaction.click);
                            }
                            p_bullseye.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                        p_bullseye.m_panel.m_linkedViews[index].panel.Pause(true);
                    }

                    if ( p_bullseye.AllowInteractions(namespace.Interaction.dblclick) ){
                        p_bullseye.m_panel.Update(p_bullseye, namespace.Interaction.dblclick);
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
            //     (III) Double-Click --> Mimics Double-Click Unhighlighted (1.C)
            //     (IV) Mouseout --> Nothing
            //  (B) Unpaused
            //    (I) Mouseover --> Mimics Mouseover Unhighlighted (1.A)
            //    (II) Click - Any ring --> Pauses panel and linked panels
            //    (III) Double-Click --> Mimics Double-Click Unhighlighted (1.C)
            //    (IV) Mouseout --> Unhighlights current ring or entire bullseye

            // Paused
            if ( p_bullseye.m_panel.IsPaused() ){

                switch ( p_mouseEventType ){

                    // (I) Mouseover --> Nothing
                    case namespace.Interaction.mouseover:

                        break;

                    // (II) Click
                    case namespace.Interaction.click:

                        // (a) Same ring --> Unpauses panel and linked panels --> Unhighlights all shapes
                        if ( p_data.topicID == p_bullseye.m_level.m_highlightedTopic &&
                             p_bullseye == p_bullseye.m_level.GetDataBar().GetCurrentShape() ){

                            p_bullseye.m_panel.Pause(false);
                            p_bullseye.m_panel.Update(null, namespace.Interaction.mouseover);
                            for ( var index = 0; index < p_bullseye.m_panel.m_linkedViews.length; index++ ){

                                p_bullseye.m_panel.m_linkedViews[index].panel.Pause(false);
                                p_bullseye.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                            }
                        // (b) Different ring --> Mimics click when unhighlighted (1.B)
                        } else {

                            p_bullseye.m_panel.Pause(false);
                            p_bullseye.m_panel.Update(null, namespace.Interaction.mouseover);
                            p_bullseye.m_panel.Update(p_data, namespace.Interaction.mouseover);
                            p_bullseye.m_panel.Pause(true);
                            for ( var index = 0; index < p_bullseye.m_panel.m_linkedViews.length; index++ ){

                                if ( namespace.Interaction.mouseover == p_bullseye.m_panel.m_linkedViews[index].update ){

                                    p_bullseye.m_panel.m_linkedViews[index].panel.Pause(false);
                                    p_bullseye.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                                    if ( p_bullseye.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                        p_bullseye.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_bullseye }, namespace.Interaction.click);
                                    }
                                    p_bullseye.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                                }
                                p_bullseye.m_panel.m_linkedViews[index].panel.Pause(true);
                            }
                        }

                        break;

                    // (III) Double-Click --> Mimics Double-Click Unhighlighted (1.C)
                    case namespace.Interaction.dblclick:

                        // Update the data bar, if present
                        for ( var index = 0; index < p_bullseye.m_panel.m_linkedViews.length; index++ ){

                            if ( p_bullseye.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                p_bullseye.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_bullseye }, namespace.Interaction.click);
                                break;
                            }
                        }

                        /*if ( p_bullseye != p_bullseye.m_level.GetDataBar().GetCurrentShape() ){

                            p_bullseye.m_panel.Pause(false);
                            p_bullseye.m_panel.Update(null, namespace.Interaction.mouseover);
                            p_bullseye.m_panel.Update(p_data, namespace.Interaction.mouseover);
                            p_bullseye.m_panel.Pause(true);
                            for ( var index = 0; index < p_bullseye.m_panel.m_linkedViews.length; index++ ){

                                if ( namespace.Interaction.mouseover == p_bullseye.m_panel.m_linkedViews[index].update ){

                                    p_bullseye.m_panel.m_linkedViews[index].panel.Pause(false);
                                    p_bullseye.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                                    if ( p_bullseye.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                        p_bullseye.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_bullseye }, namespace.Interaction.click);
                                    }
                                    p_bullseye.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                                }
                                p_bullseye.m_panel.m_linkedViews[index].panel.Pause(true);
                            }
                        }*/

                        if ( p_bullseye.AllowInteractions(namespace.Interaction.dblclick) ){
                            // NOTE: p_data == p_bullseye??
                            p_bullseye.m_panel.Pause(false);
                            p_bullseye.m_panel.Update(p_bullseye, namespace.Interaction.dblclick);
                            p_bullseye.m_panel.Pause(true);
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

                        p_bullseye.m_panel.Update(p_data, namespace.Interaction.mouseover);
                        for ( var index = 0; index < p_bullseye.m_panel.m_linkedViews.length; index++ ){

                            if ( namespace.Interaction.mouseover == p_bullseye.m_panel.m_linkedViews[index].update ){
                                p_bullseye.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                            }
                        }

                        break;

                    // (II) Click - Any ring/circle --> Pauses panel and linked panels
                    case namespace.Interaction.click:

                        // Update the data bar, if present
                        for ( var index = 0; index < p_bullseye.m_panel.m_linkedViews.length; index++ ){

                            if ( p_bullseye.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                p_bullseye.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_bullseye }, namespace.Interaction.click);
                                break;
                            }
                        }

                        p_bullseye.m_panel.Pause(true);
                        for ( var index = 0; index < p_bullseye.m_panel.m_linkedViews.length; index++ ){
                            p_bullseye.m_panel.m_linkedViews[index].panel.Pause(true);
                        }

                        break;

                    // (III) Double-Click --> Mimics Double-Click Unhighlighted (1.C)
                    case namespace.Interaction.dblclick:

                        p_bullseye.m_panel.Update(p_data, namespace.Interaction.mouseover);
                        p_bullseye.m_panel.Pause(true);
                        for ( var index = 0; index < p_bullseye.m_panel.m_linkedViews.length; index++ ){

                            if ( namespace.Interaction.mouseover == p_bullseye.m_panel.m_linkedViews[index].update ){

                                if ( p_bullseye.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                    p_bullseye.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_bullseye }, namespace.Interaction.click);
                                }
                                p_bullseye.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                            }
                            p_bullseye.m_panel.m_linkedViews[index].panel.Pause(true);
                        }

                        if ( p_bullseye.AllowInteractions(namespace.Interaction.dblclick) ){
                            p_bullseye.m_panel.Update(p_bullseye, namespace.Interaction.dblclick);
                        }

                        break;

                    // (IV) Mouseout --> Unhighlights entire bullseye
                    case namespace.Interaction.mouseout:

                        p_bullseye.m_panel.Update(null, namespace.Interaction.mouseover);
                        for ( var index = 0; index < p_bullseye.m_panel.m_linkedViews.length; index++ ){
                            p_bullseye.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                        }

                        break;
                }
            }
        }
    };

    namespace.TopicBullseye.prototype.s_shapeChar == "b";


    // TWiC TopicRectangle (inherits from DataShape)
    namespace.TopicRectangle = function(p_coordinates, p_size, p_filenumber, p_level, p_panel, p_linkedViews, p_clusterIndex, p_numberTopics){

        namespace.DataShape.apply(this, arguments);

        this.m_data = null;
        this.m_tipLines = [];
        this.m_showingTip = false;
        this.m_tip = null;
        this.m_size.width = this.m_size.width * namespace.TopicRectangle.prototype.multiplier;
        this.m_size.height = this.m_size.height * namespace.TopicRectangle.prototype.multiplier;
        this.m_clusterIndex = p_clusterIndex;
        this.startingPosition = {x: this.m_coordinates.x, y: this.m_coordinates.y};
        this.m_clusterRectShapeGroup = null;
        this.m_shapeChar = namespace.TopicRectangle.prototype.s_shapeChar;
        this.m_allowDblclick = true;
        this.m_fileID = p_filenumber;

        var topicColorIndex = 0;
        for ( var index = 0; index < this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"].length; index++ ) {

            if ( this.m_name == this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][index].name ) {
                topicColorIndex = index;
                break;
            }
        }

        var p_topics = this.m_level.m_corpusMap["children"][this.m_clusterIndex]["children"][topicColorIndex]["topics"];
        this.m_fullTopicListRef = p_topics;
        this.m_topicProportionSum = 0;
        for ( index in p_topics ){
            this.m_topicProportionSum += p_topics[index][1];
        }
        this.m_numberRects = p_numberTopics;
        var topicsSorted = Object.keys(p_topics).sort(function(a, b) { return p_topics[a][1] - p_topics[b][1]; });

        // Should be topicsSorted.length - 2 since top topic rect will be represented by TopicRectangle stroke?
        this.m_topTopics = [];
        for ( var index = topicsSorted.length - 1, rectCount = 0; index >= 0 && rectCount < this.m_numberRects; index--, rectCount++ ) {
            this.m_topTopics.push([topicsSorted[index], p_topics[topicsSorted[index]][1]])
        }
    };
    namespace.TopicRectangle.inherits(namespace.DataShape);

    namespace.TopicRectangle.method("AddTextTag", function(p_text, p_fontSize, p_color, p_position, p_opacity){

        this.m_textTag = this.m_shapeGroup.append("text")
                                         .attr("class", this.m_panel.s_datashapeTextClassName)
                                         .attr("dx", "0")
                                         .attr("dy", "0")
                                         .attr("fill", p_color)
                                         .style("font-family", namespace.Level.prototype.s_fontFamily)
                                         .style("font-size", p_fontSize)
                                         .style("position", "relative");

        var dy = textFlow(p_text,
                          this.m_textTag[0][0],
                          this.m_panel.m_svg.attr("width"),
                          p_fontSize,
                          namespace.TopicBar.prototype.s_textInfo.yIncrement, false);

        this.m_textTag.selectAll("tspan")
               .attr("x", p_position.x)
               .attr("y", p_position.y)
               .style("opacity", p_opacity);
    });

    namespace.TopicRectangle.method("BuildTipLines", function(){

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

    namespace.TopicRectangle.method("CalculateSize", function(){

        var maxLineCount = this.m_data.lines_and_colors.length;
        if ( maxLineCount > namespace.TopicRectangle.prototype.s_maxLinesInRect ){
            maxLineCount = namespace.TopicRectangle.prototype.s_maxLinesInRect;
        }

        this.m_size = { width: 0,
                        height: (maxLineCount *
                                 (namespace.TopicRectangle.prototype.strokeWidth + namespace.TopicRectangle.prototype.spaceBetweenLines)) +
                                 (4 * namespace.TopicRectangle.prototype.borderWidth) - (2 * namespace.TopicRectangle.prototype.spaceBetweenLines) };

        for ( var index = 0; index < maxLineCount; index ++ ) {

            var wordCountPixels = Object.keys(this.m_data.lines_and_colors[index][0]).length * namespace.TopicRectangle.prototype.wordLength;
            if ( wordCountPixels > this.m_size["width"] ) {
                this.m_size.width = wordCountPixels;
            }
        }

        this.m_radius = Math.sqrt(((this.m_size.width >> 1) * (this.m_size.width >> 1)) + ((this.m_size.height >> 1) * (this.m_size.height >> 1)));

        this.m_size.width += (4 * namespace.TopicRectangle.prototype.spaceAroundText);

        // Set local coordinates of based on calculated width and height
        this.m_coordinates.x -= this.m_size.width >> 1;
        this.m_coordinates.y -= this.m_size.height >> 1;
    });

    namespace.TopicRectangle.method("CreateHighlightRectangles", function(p_node){

        // Modify the given node to be a twic cluster group (extra parent group for smooth zoom-behavior)
        this.m_clusterRectShapeGroup = p_node.append("g")
                                             .attr("class", "group_twic_datashape_smoothzooming")
                                             .attr("id", "twic_clusterrect_" + this.m_level.m_objectCount);

        this.m_level.m_objectCount += 1;

        // Add each topic rectangle, binding data to it (Index 0 will represent the TopicRectangle at the center)
        for ( var index = this.m_numberRects - 1, rectsDrawn = 0; index > 0; index--, rectsDrawn++ ){

            var data = {

                // Color
                "color" : this.m_level.m_topicColors[this.m_topTopics[index][0]],

                // Topic ID
                "topicID" : this.m_topTopics[index][0],

                // Topic proportion
                "prop" : this.m_topTopics[index][1],

                // Text filename
                "file_id": this.m_name,

                // Reference to TWiC datashape
                "shapeRef": this
            };

            // Determine the lolight color for this svg element
            if ( 1 == this.m_numberRects ){
                 data.locolor = this.m_level.m_topicColors[this.m_topTopics[index][0]];
            } else {
                //data.locolor = namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorLolight,
                //                                    this.m_level.m_topicColors[this.m_topTopics[index][0]]);
                data.locolor = this.m_level.m_topicColorsLoBlend[this.m_topTopics[index][0]];
            }

            var rectRadius = index * namespace.TopicRectangle.prototype.s_borderRadius;
            this.m_clusterRectShapeGroup.append("rect")
                                        .datum(data)
                                        .attr("class", this.m_panel.s_datashapeClassName)
                                        .attr("x", this.m_coordinates.x - (index * namespace.TopicRectangle.prototype.s_borderRadius))
                                        .attr("y", this.m_coordinates.y - (index * namespace.TopicRectangle.prototype.s_borderRadius))
                                        .attr("width", this.m_size.width + (index * 2 * namespace.TopicRectangle.prototype.borderWidth))
                                        .attr("height", this.m_size.height + (index * 2 * namespace.TopicRectangle.prototype.borderWidth))
                                        .attr("rx", rectRadius)
                                        .attr("ry", rectRadius)
                                        .attr("stroke", function(d){return d.locolor; })
                                        .attr("stroke-width", namespace.TopicRectangle.prototype.borderWidth)
                                        .attr("stroke-opacity", 1.0)
                                        .attr("stroke-join", "round")
                                        .attr("fill-opacity", 0.0)
                                        .on(namespace.Interaction.mouseover, function(d){

                                            if ( !this.m_panel.IsPaused() ){
                                                this.m_shapeGroup.style("opacity", 1.0);
                                            }

                                            namespace.TopicRectangle.prototype.MouseBehavior(this, d, namespace.Interaction.mouseover);

                                            // Re-append the cluster circle group to bump up its z-order to top
                                            this.m_clusterRectShapeGroup.node().parentNode.parentNode.parentNode.parentNode.appendChild(this.m_clusterRectShapeGroup.node().parentNode.parentNode.parentNode);
                                        }.bind(this))
                                        .on(namespace.Interaction.mouseout, function(d){
                                            namespace.TopicRectangle.prototype.MouseBehavior(this, null, namespace.Interaction.mouseout);
                                        }.bind(this))
                                        .on(namespace.Interaction.click, function(d){

                                            if ( this.m_clickTimerID ){

                                                clearTimeout(this.m_clickTimerID);
                                                this.m_clickTimerID = null;

                                                // Do double click code here
                                                namespace.TopicRectangle.prototype.MouseBehavior(this, d, namespace.Interaction.dblclick);
                                            } else {

                                                this.m_clickTimerID = setTimeout(function(p_data){

                                                    this.m_clickTimerID = null;

                                                    // Do single click code here
                                                    namespace.TopicRectangle.prototype.MouseBehavior(this, p_data, namespace.Interaction.click);
                                                }.bind(this, d), 250);
                                            }
                                        }.bind(this));
        }
    });

    namespace.TopicRectangle.method("Draw", function(){

        // Append a new group element to the svg, this will represent the TopicRectangle's overall "node"
        this.m_node = this.m_panel.m_clusterSvgGroup.append("g")
                                  .attr("class", "node")
                                  .attr("id", "textrect_node_" + this.m_name)
                                  .style("position", "absolute");

        // Bind the text data to a group element (children will access this via .parentNode.__data__)
        this.m_shapeGroup = this.m_node.append("g")
                                       .attr("class", this.m_panel.s_datashapeClassName)
                                       .style("position", "absolute")
                                       .datum(this.m_data)
                                       .style("opacity", 1.0);

        // Add a "cluster rectangle" around this text rectangle which reflect the top N topics of this text
        var clusterRectGroup = this.m_shapeGroup.append("g").attr("id", "g_clusterrectgroup_" + this.m_name);
        this.CreateHighlightRectangles(clusterRectGroup);

        // Data structure for the text/text's top topic (for mouseover)
        var rect_data = {

            // Color
            "color": this.m_level.m_topicColors[this.m_clusterIndex],

            // Topic ID
            "topicID": this.m_clusterIndex,

            // Reference to this shape
            "shapeRef": this
        };

        // Determine the lolight color for this svg element
        if ( 1 == this.m_numberRects ){
            rect_data.locolor = this.m_level.m_topicColors[this.m_clusterIndex];
        } else {
            //rect_data.locolor = namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorLolight,
            //                                         this.m_level.m_topicColors[this.m_clusterIndex]);
            rect_data.locolor = this.m_level.m_topicColorsLoBlend[this.m_clusterIndex];
        };

        // Create a rounded rectangle on the svg under the lines, sized to the max length of the lines (for now)
        var textRectGroup = this.m_shapeGroup.append("g")
                                             .attr("class", this.m_panel.s_datashapeClassName)
                                             .attr("id", "text_rect_group_" + this.m_clusterIndex)
                                             .datum(rect_data)
                                       .on(namespace.Interaction.mouseover, function(d){

                                           namespace.TopicRectangle.prototype.MouseBehavior(this, d, namespace.Interaction.mouseover);

                                           // Re-append the cluster circle group to bump up its z-order to top
                                           var myGroup = d3.select("#textrect_node_" + this.m_name);
                                           myGroup.node().parentNode.appendChild(myGroup.node());
                                       }.bind(this))
                                       .on(namespace.Interaction.mouseout, function(d){
                                           namespace.TopicRectangle.prototype.MouseBehavior(this, null, namespace.Interaction.mouseout);
                                       }.bind(this))
                                       .on(namespace.Interaction.click, function(d){

                                            console.log("Topic rectangle click event");

                                            if ( this.m_clickTimerID ){

                                                console.log("Clear time out");

                                                clearTimeout(this.m_clickTimerID);
                                                this.m_clickTimerID = null;

                                                // Do double click code here
                                                namespace.TopicRectangle.prototype.MouseBehavior(this, d, namespace.Interaction.dblclick);
                                            } else {

                                                console.log("setTimeout case");

                                                this.m_clickTimerID = setTimeout(function(p_data){

                                                    console.log("setTimeout callback");

                                                    this.m_clickTimerID = null;

                                                    // Do single click code here
                                                    namespace.TopicRectangle.prototype.MouseBehavior(this, p_data, namespace.Interaction.click);
                                                }.bind(this, d), 250);

                                            }
                                       }.bind(this));

        this.m_textRect = textRectGroup.append("rect")
                                       .attr("class", "text_info_rect")
                                       .datum(rect_data)
                                       .attr("x", this.m_coordinates.x)
                                       .attr("y", this.m_coordinates.y)
                                       .attr("width", this.m_size.width)
                                       .attr("height", this.m_size.height)
                                       .attr("rx", namespace.TopicRectangle.prototype.cornerRadius)
                                       .attr("ry", namespace.TopicRectangle.prototype.cornerRadius)
                                       .style("stroke-width", namespace.TopicRectangle.prototype.borderWidth)
                                       .style("stroke", this.m_level.m_topicColors[this.m_clusterIndex])
                                       .style("fill", namespace.TopicRectangle.prototype.fillColor)
                                       .style("position", "absolute");

        // Text lines starting point
        this.m_startingPosition = { x: this.m_coordinates.x + namespace.TopicRectangle.prototype.spaceAroundText,
                                    y: this.m_coordinates.y + namespace.TopicRectangle.prototype.spaceBetweenLines };

        // Create a path element for each word on each line (NOTE: We'll see how expensive this is)
        // New check for max lines allowable in rect
        for ( var index = 0; index < this.m_data.lines_and_colors.length &&
              index < namespace.TopicRectangle.prototype.s_maxLinesInRect; index++ ) {

            var lcArray = [];
            //var wordIndices = Object.keys(this.m_data.lines_and_colors[index][1]);
            var lineLength = this.m_data.lines_and_colors[index][0].length;
            for ( var index2 = 0; index2 < lineLength; index2++ ) {
                /*if ( undefined !== wordIndices[index2] ){
                    lcArray.push({ "l": index, "w": wordIndices[index2] });
                } else {
                    lcArray.push({"l": index, "w": index2 })
                }*/
                lcArray.push({"l": index, "w": index2});
            }

            textRectGroup.append("g")
                         .attr("class", "line" + index)
                         .style("position", "absolute")
                         .selectAll("path")
                         .data(lcArray)
                         .enter()
                         .append("path")
                         .attr("class", namespace.TopicRectangle.prototype.s_datashapeClassName)
                         .style("stroke", function(d) {

                             var topic_color_index = this.m_data.lines_and_colors[d.l][1][d.w];
                             //if ( -1 == topic_color_index ){
                             if ( undefined == topic_color_index ){
                                 return namespace.TopicRectangle.prototype.defaultFontColor;
                             }
                             else {
                                 return this.m_level.m_topicColors[topic_color_index];
                             }
                         }.bind(this))
                         .style("stroke-width", namespace.TopicRectangle.prototype.strokeWidth + "px")
                         .attr("d", function(d) {

                             if ( "0" == d.w ) {

                                 this.m_startingPosition.x = (2 * namespace.TopicRectangle.prototype.spaceAroundText) + this.m_coordinates.x;
                                 if ( d.l > 0 ) {
                                     this.m_startingPosition.y += namespace.TopicRectangle.prototype.spaceBetweenLines + namespace.TopicRectangle.prototype.strokeWidth;
                                 } else {
                                     this.m_startingPosition.y += namespace.TopicRectangle.prototype.spaceAroundText;
                                 }
                             }

                             var pathString = "M " + this.m_startingPosition.x + "," + this.m_startingPosition.y +
                                              " " + (this.m_startingPosition.x + namespace.TopicRectangle.prototype.wordLength) +
                                              "," + this.m_startingPosition.y;
                             this.m_startingPosition.x += namespace.TopicRectangle.prototype.wordLength;

                             return pathString;
                         }.bind(this))
                         .style("position", "absolute")
                         .style("opacity", function(d){

                             var topic_color_index = this.m_data.lines_and_colors[d.l][1][d.w];
                             //if ( -1 == topic_color_index ){
                             if ( undefined == topic_color_index ){
                                 return 1.0;
                             } else {
                                 return 1.0;
                             }
                         }.bind(this));
                         /*.on(namespace.Interaction.mouseover, function(d){

                             var d = { topicID: this.m_data.lines_and_colors[d.l][1][d.w],
                                       color: this.m_level.m_topicColors[this.m_data.lines_and_colors[d.l][1][d.w]] };

                             if ( -1 != d.topicID ) {

                                 for ( var index = 0; index < this.m_panel.m_linkedViews.length; index++ ){

                                     if ( namespace.Interaction.mouseover == this.m_panel.m_linkedViews[index].update ) {
                                         this.m_panel.m_linkedViews[index].panel.Update(d, namespace.Interaction.mouseover);
                                     }
                                 }
                             }
                         }.bind(this))
                         .on(namespace.Interaction.mouseout, function(d){

                             for ( var index = 0; index < this.m_panel.m_linkedViews.length; index++ ){

                                 if ( namespace.Interaction.mouseover == this.m_panel.m_linkedViews[index].update ) {
                                     this.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                                 }
                             }
                         }.bind(this));*/
        }
    });

    namespace.TopicRectangle.method("IsPointInRect", function(p_point){

        return ( p_point[0] > this.m_coordinates.x && p_point[0] < this.m_size.width &&
                 p_point[1] > this.m_coordinates.y && p_point[1] < this.m_size.height );
    });

    namespace.TopicRectangle.method("Load", function(){

        this.m_level.m_queue.defer(function(callback){

            // Queue up loading of the text
            d3.json(namespace.TopicRectangle.prototype.jsonDirectory + this.m_name + ".json", function(error, data){

                this.m_data = data.document;

                // Determine the rectangle dimensions now that the json is loaded
                this.CalculateSize();

                // Construct the tooltip highlights
                //this.BuildTipLines();

                callback(null, this.m_data);

            }.bind(this));
        }.bind(this));
    });

    namespace.TopicRectangle.method("LoadURL", function(p_url){

        this.m_level.m_queue.defer(function(callback){

            // Queue up loading of the text
            d3.json(p_url, function(error, data){

                this.m_data = data.document;

                // Determine the rectangle dimensions now that the json is loaded
                this.CalculateSize();

                // Construct the tooltip highlights
                //this.BuildTipLines();

                callback(null, this.m_data);

            }.bind(this));
        }.bind(this));
    });

    namespace.TopicRectangle.method("SetPanelNodeIndex", function(p_panelNodeIndex){

        this.m_panelNodeIndex = p_panelNodeIndex;
    });

    namespace.TopicRectangle.method("SetTitle", function(p_title){

        this.m_title = p_title;
    });

    // Static members of TopicRectangle
    namespace.TopicRectangle.prototype.MouseBehavior = function(p_rectangle, p_data, p_mouseEventType){

        console.log("Topic Rectangle MouseBehavior");

        // Unhighlighted
        if ( -1 == p_rectangle.m_level.m_highlightedTopic ){

            // (1) Unhighlighted (Is Always Unpaused)
            //   (A) Mouseover --> Highlights topic ring and topic elsewhere in linked panels
            //   (B) Click --> Mimics mouseover when unhighlighted (a) --> Pauses state of panel and linked panels
            //   (C) Double-Click --> Mimics click when unhighlighted (b) --> Opens underlying panel if not already open
            //   (D) Mouseout --> Nothing

            switch ( p_mouseEventType ){

                // (A) Mouseover --> Highlights topic ring and topic elsewhere in linked panels
                case namespace.Interaction.mouseover:

                    p_rectangle.m_panel.Update(p_data, namespace.Interaction.mouseover);
                    for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == p_rectangle.m_panel.m_linkedViews[index].update ){
                            p_rectangle.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                    }

                    break;

                // (B) Click --> Mimics mouseover when unhighlighted (a) --> Pauses state of panel and linked panels
                case namespace.Interaction.click:

                    p_rectangle.m_panel.Update(p_data, namespace.Interaction.mouseover);
                    p_rectangle.m_panel.Pause(true);
                    for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == p_rectangle.m_panel.m_linkedViews[index].update ){

                            if ( p_rectangle.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                p_rectangle.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_rectangle }, namespace.Interaction.click);
                            }
                            p_rectangle.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                        p_rectangle.m_panel.m_linkedViews[index].panel.Pause(true);
                    }

                    break;

                // (C) Double-Click --> Mimics click when unhighlighted (b) --> Opens underlying panel if not already open
                case namespace.Interaction.dblclick:

                    console.log("Unhighlighted doubleclick case");

                    p_rectangle.m_panel.Update(p_data, namespace.Interaction.mouseover);
                    p_rectangle.m_panel.Pause(true);
                    for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == p_rectangle.m_panel.m_linkedViews[index].update ){

                            if ( p_rectangle.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                p_rectangle.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_rectangle }, namespace.Interaction.click);
                            }
                            p_rectangle.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                        p_rectangle.m_panel.m_linkedViews[index].panel.Pause(true);
                    }

                    if ( p_rectangle.AllowInteractions(namespace.Interaction.dblclick) ){

                        // See if the underlying panel is open yet, and if not update the level
                        // (Level update will take care of updating linked views)
                        if ( !p_rectangle.m_panel.IsUnderlyingPanelOpen() ){

                            var ci = ( undefined === p_rectangle.m_panel.m_clusterIndex ) ? p_rectangle.m_topTopics[0][0] : p_rectangle.m_panel.m_clusterIndex;
                            p_rectangle.m_level.Update({ json: p_rectangle.m_data,
                                                         clusterIndex: ci,
                                                         topicID: p_data.topicID,
                                                         color: p_rectangle.m_level.m_topicColors[p_data.topicID] },
                                                       namespace.Interaction.dblclick);
                        } else {

                            // Trigger the double-click behavior of any linked views
                            for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){

                                if ( namespace.Interaction.dblclick == p_rectangle.m_panel.m_linkedViews[index].update ){

                                    p_rectangle.m_panel.m_linkedViews[index].panel.Pause(false);
                                    var ci = ( undefined === p_rectangle.m_panel.m_clusterIndex ) ? p_rectangle.m_topTopics[0][0] : p_rectangle.m_panel.m_clusterIndex;
                                    p_rectangle.m_panel.m_linkedViews[index].panel.Update({ json: p_rectangle.m_data,
                                                                                            clusterIndex: ci,
                                                                                            topicID: p_data.topicID,
                                                                                            color: p_rectangle.m_level.m_topicColors[p_data.topicID] },
                                                                                          namespace.Interaction.dblclick);
                                    p_rectangle.m_panel.m_linkedViews[index].panel.Pause(true);
                                }
                            }
                        }
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
            //     (III) Double-Click --> Mimics Double-Click Unhighlighted (1.C)
            //     (IV) Mouseout --> Nothing
            //  (B) Unpaused
            //    (I) Mouseover --> Mimics Mouseover Unhighlighted (1.A)
            //    (II) Click - Any ring --> Pauses panel and linked panels
            //    (III) Double-Click --> Mimics Double-Click Unhighlighted (1.C)
            //    (IV) Mouseout --> Unhighlights current ring or entire bullseye

            // Paused
            if ( p_rectangle.m_panel.IsPaused() ){

                switch ( p_mouseEventType ){

                    // (I) Mouseover --> Nothing
                    case namespace.Interaction.mouseover:

                        break;

                    // (II) Click
                    case namespace.Interaction.click:

                        // (a) Same ring --> Unpauses panel and linked panels --> Unhighlights all shapes
                        if ( p_data.topicID == p_rectangle.m_level.m_highlightedTopic &&
                             p_rectangle == p_rectangle.m_level.GetDataBar().GetCurrentShape() ){

                            p_rectangle.m_panel.Pause(false);
                            p_rectangle.m_panel.Update(null, namespace.Interaction.mouseover);
                            for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){

                                p_rectangle.m_panel.m_linkedViews[index].panel.Pause(false);
                                p_rectangle.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                            }
                        // (b) Different ring --> Mimics click when unhighlighted (1.B)
                        } else {

                            p_rectangle.m_panel.Pause(false);
                            p_rectangle.m_panel.Update(null, namespace.Interaction.mouseover);
                            p_rectangle.m_panel.Update(p_data, namespace.Interaction.mouseover);
                            p_rectangle.m_panel.Pause(true);
                            for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){

                                if ( namespace.Interaction.mouseover == p_rectangle.m_panel.m_linkedViews[index].update ){

                                    p_rectangle.m_panel.m_linkedViews[index].panel.Pause(false);
                                    p_rectangle.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                                    if ( p_rectangle.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                        p_rectangle.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_rectangle }, namespace.Interaction.click);
                                    }
                                    p_rectangle.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                                }
                                p_rectangle.m_panel.m_linkedViews[index].panel.Pause(true);
                            }
                        }

                        break;

                    // (III) Double-Click --> Mimics Double-Click Unhighlighted (1.C)
                    case namespace.Interaction.dblclick:

                        console.log("Highlighted doubleclick case");

                        // Update the data bar, if present
                        for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){

                            if ( p_rectangle.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                p_rectangle.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_rectangle }, namespace.Interaction.click);
                                break;
                            }
                        }

                        /*if ( p_rectangle != p_rectangle.m_level.GetDataBar().GetCurrentShape() ){

                            p_rectangle.m_panel.Pause(false);
                            p_rectangle.m_panel.Update(null, namespace.Interaction.mouseover);
                            p_rectangle.m_panel.Update(p_data, namespace.Interaction.mouseover);
                            p_rectangle.m_panel.Pause(true);
                            for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){

                                if ( namespace.Interaction.mouseover == p_rectangle.m_panel.m_linkedViews[index].update ){

                                    p_rectangle.m_panel.m_linkedViews[index].panel.Pause(false);
                                    p_rectangle.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                                    if ( p_rectangle.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                        p_rectangle.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_rectangle }, namespace.Interaction.click);
                                    }
                                    p_rectangle.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                                }
                                p_rectangle.m_panel.m_linkedViews[index].panel.Pause(true);
                            }
                        }*/

                        if ( p_rectangle.AllowInteractions(namespace.Interaction.dblclick) ){

                            // See if the underlying panel is open yet, and if not update the level
                            // (Level update will take care of updating linked views)
                            if ( !p_rectangle.m_panel.IsUnderlyingPanelOpen() ){

                                var ci = ( undefined === p_rectangle.m_panel.m_clusterIndex ) ? p_rectangle.m_topTopics[0][0] : p_rectangle.m_panel.m_clusterIndex;
                                p_rectangle.m_level.Update({ json: p_rectangle.m_data,
                                                             clusterIndex: ci,
                                                             topicID: p_rectangle.m_level.m_highlightedTopic,
                                                             color: p_rectangle.m_level.m_topicColors[p_rectangle.m_level.m_highlightedTopic] },
                                                           namespace.Interaction.dblclick);
                            } else {

                                // Trigger the double-click behavior of any linked views
                                for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){

                                    if ( namespace.Interaction.dblclick == p_rectangle.m_panel.m_linkedViews[index].update ){

                                        p_rectangle.m_panel.m_linkedViews[index].panel.Pause(false);
                                        var ci = ( undefined === p_rectangle.m_panel.m_clusterIndex ) ? p_rectangle.m_topTopics[0][0] : p_rectangle.m_panel.m_clusterIndex;
                                        p_rectangle.m_panel.m_linkedViews[index].panel.Update({ json: p_rectangle.m_data,
                                                                                                clusterIndex: ci,
                                                                                                topicID: p_rectangle.m_level.m_highlightedTopic,
                                                                                                color: p_rectangle.m_level.m_topicColors[p_rectangle.m_level.m_highlightedTopic] },
                                                                                              namespace.Interaction.dblclick);
                                        p_rectangle.m_panel.m_linkedViews[index].panel.Pause(true);
                                    }
                                }
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

                        p_rectangle.m_panel.Update(p_data, namespace.Interaction.mouseover);
                        for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){

                            if ( namespace.Interaction.mouseover == p_rectangle.m_panel.m_linkedViews[index].update ){
                                p_rectangle.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                            }
                        }

                        break;

                    // (II) Click - Any ring/circle --> Pauses panel and linked panels
                    case namespace.Interaction.click:

                        // Update the data bar, if present
                        for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){

                            if ( p_rectangle.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                p_rectangle.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_rectangle }, namespace.Interaction.click);
                                break;
                            }
                        }

                        p_rectangle.m_panel.Pause(true);
                        for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){
                            p_rectangle.m_panel.m_linkedViews[index].panel.Pause(true);
                        }

                        break;

                    // (III) Double-Click --> Mimics Double-Click Unhighlighted (1.C)
                    case namespace.Interaction.dblclick:

                        p_rectangle.m_panel.Update(p_data, namespace.Interaction.mouseover);
                        for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){

                            if ( namespace.Interaction.mouseover == p_rectangle.m_panel.m_linkedViews[index].update ){

                                if ( p_rectangle.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                    p_rectangle.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_rectangle }, namespace.Interaction.click);
                                }
                                p_rectangle.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                            }
                            p_rectangle.m_panel.m_linkedViews[index].panel.Pause(true);
                        }

                        if ( p_rectangle.AllowInteractions(namespace.Interaction.dblclick) ){

                            // See if the underlying panel is open yet, and if not update the level
                            // (Level update will take care of updating linked views)
                            if ( !p_rectangle.m_panel.IsUnderlyingPanelOpen() ){

                                var ci = ( undefined === p_rectangle.m_panel.m_clusterIndex ) ? p_rectangle.m_topTopics[0][0] : p_rectangle.m_panel.m_clusterIndex;
                                p_rectangle.m_level.Update({ json: p_rectangle.m_data,
                                                             clusterIndex: ci,
                                                             topicID: p_data.topicID },
                                                           namespace.Interaction.dblclick);
                            } else {

                                // Trigger the double-click behavior of any linked views
                                for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){

                                    if ( namespace.Interaction.dblclick == p_rectangle.m_panel.m_linkedViews[index].update ){

                                        p_rectangle.m_panel.m_linkedViews[index].panel.Pause(false);
                                        var ci = ( undefined === p_rectangle.m_panel.m_clusterIndex ) ? p_rectangle.m_topTopics[0][0] : p_rectangle.m_panel.m_clusterIndex;
                                        p_rectangle.m_panel.m_linkedViews[index].panel.Update({ json: p_rectangle.m_data,
                                                                                                clusterIndex: ci,
                                                                                                topicID: p_data.topicID },
                                                                                              namespace.Interaction.dblclick);
                                        p_rectangle.m_panel.m_linkedViews[index].panel.Pause(true);
                                    }
                                }
                            }
                        }
                        p_rectangle.m_panel.Pause(true);

                        break;

                    // (IV) Mouseout --> Unhighlights entire bullseye
                    case namespace.Interaction.mouseout:

                        p_rectangle.m_panel.Update(null, namespace.Interaction.mouseover);
                        for ( var index = 0; index < p_rectangle.m_panel.m_linkedViews.length; index++ ){
                            p_rectangle.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                        }

                        break;
                }
            }
        }
    };

    namespace.TopicRectangle.prototype.multiplier = 2;
    namespace.TopicRectangle.prototype.spaceAroundText = 2 * namespace.TopicRectangle.prototype.multiplier;
    namespace.TopicRectangle.prototype.borderWidth = 2 * namespace.TopicRectangle.prototype.multiplier;
    namespace.TopicRectangle.prototype.cornerRadius = 0.025;
    namespace.TopicRectangle.prototype.s_borderRadius = 4;

    namespace.TopicRectangle.prototype.fillColor = namespace.Level.prototype.s_palette.darkblue;
    namespace.TopicRectangle.prototype.strokeWidth = 2 * namespace.TopicRectangle.prototype.multiplier;
    namespace.TopicRectangle.prototype.wordLength = 2 * namespace.TopicRectangle.prototype.multiplier;
    namespace.TopicRectangle.prototype.spaceBetweenLines = 2 * namespace.TopicRectangle.prototype.multiplier;

    namespace.TopicRectangle.prototype.defaultFontColor = namespace.Level.prototype.s_palette.gold;
    namespace.TopicRectangle.prototype.jsonDirectory = TWiC.Level.prototype.s_jsonDirectory + "texts/";

    namespace.TopicRectangle.prototype.s_shapeChar = "r";

    // New static member for general corpus usage. Max lines in rectangle is 10 - 10-12-15 J.Armoza
    namespace.TopicRectangle.prototype.s_maxLinesInRect = 10;

    // TWiC TopicText (inherits from DataShape)
    namespace.TopicText = function(p_coordinates, p_size, p_filename, p_level, p_panel, p_linkedViews, p_data){

        // Apply the base class arguments
        namespace.DataShape.apply(this, arguments);

        // Save TopicText specific parameters
        this.m_linkedViews = p_linkedViews;
        this.m_data = p_data;

    };
    namespace.TopicText.inherits(namespace.DataShape);

    namespace.TopicText.method("Draw", function(p_node){

        // Vars for growing the panel div to the appropriate size for the text
        var currentY = this.m_coordinates.y;

        // Initialize size (initial panel height + space for rounded corners)
        var rectGrowth = this.m_size.height + namespace.Panel.prototype.s_borderRadius;

        // Pixel space per line
        var dy = namespace.TopicBar.prototype.s_textInfo.yIncrement;

        // Some calculations for extended div height for texts larger than the current panel size
        for ( var index = 0; index < this.m_data.json.line_count; index++ ){
            currentY += dy;
            if ( currentY > this.m_panel.m_size.height ){
                rectGrowth += dy;
            }
        }

        // Append the full text as a foreignObject (data for topic words to be added on the fly by TextView)
        var foreignObject = p_node.append("foreignObject")
                                  .attr("width", this.m_size.width)
                                  .attr("height", rectGrowth);
        /*foreignObject.append("xhtml:head")
                     .append("link")
                     .attr("rel", "stylesheet")
                     .attr("type", "text/css")
                     .attr("href", "css/twic.css");
        foreignObject.append("link")
                     .attr("rel", "stylesheet")
                     .attr("type", "text/css")
                     .attr("href", "http://fonts.googleapis.com/css?family=Podkova:400|Inconsolata:400,700");*/
        foreignObject.append("xhtml:body")
                     .style("background-color", namespace.Level.prototype.s_palette.darkblue)
                     .html(this.m_data.json.full_text);

        // Add mousover behavior for colored and non-colored words
        this.m_panel.m_div
                    .attr("height", rectGrowth)
                    .selectAll(".text_coloredword")
                    .on(namespace.Interaction.click, function(d){
                        namespace.TopicText.prototype.MouseBehavior(this, d, namespace.Interaction.click);
                        this.UnhighlightTilesInDataBar();
                        this.FindAndHighlightInDataBar(d);
                        var dataBarRef = this.GetDataBarRef();
                        dataBarRef.Pause(!dataBarRef.IsPaused());
                        d3.event.stopPropagation();
                    }.bind(this))
                    .on(namespace.Interaction.mouseover, function(d){
                        namespace.TopicText.prototype.MouseBehavior(this, d, namespace.Interaction.mouseover);
                        if ( !this.GetDataBarRef().IsPaused() ){
                            this.FindAndHighlightInDataBar(d);
                        }
                    }.bind(this))
                    .on(namespace.Interaction.mouseout, function(d){
                        namespace.TopicText.prototype.MouseBehavior(this, null, namespace.Interaction.mouseout);
                        if ( !this.GetDataBarRef().IsPaused() ){
                            this.UnhighlightTilesInDataBar();
                        }
                    }.bind(this));

        this.m_panel.m_div
                    .selectAll(".text_word")
                    .on(namespace.Interaction.click, function(d){
                        if ( -1 != this.m_level.m_highlightedTopic ){
                            namespace.TopicText.prototype.MouseBehavior(null, namespace.Interaction.click);
                            this.UnhighlightTilesInDataBar();
                            d3.event.stopPropagation();
                        }
                    }.bind(this));
    });


    namespace.TopicText.method("OldDraw", function(p_node){

        // Spacing between (optional) title bar and text
        p_node.append("p")
              .append("span")
              .style("font-family", namespace.Level.prototype.s_fontFamily)
              .style("font-size", 22)
              .html("&nbsp;")

        var currentY = this.m_coordinates.y;

        // Initialize size of the svg for the text (initial panel height + space for rounded corners)
        var rectGrowth = this.m_size.height + namespace.Panel.prototype.s_borderRadius;

        // Pixel space per line
        var dy = namespace.TopicBar.prototype.s_textInfo.yIncrement;

        for ( var index = 0; index < this.m_data.json.lines_and_colors.length; index++ ) {

            console.log("New novel line");

            // COST: Split per line - Had python split into array server-side
            words = this.m_data.json.lines_and_colors[index][0].split(" ");
            //words = this.m_data.json.lines_and_colors[index][0];


            var lineText = "";

            //var currentX = 50;
            var currentX = this.m_coordinates.x;
            var text;

            //var currentLine = p_node.append("p")
            //                        .style("word-spacing", namespace.Level.prototype.s_fontSpacing.Inconsolata22)
            //                        .style("display", "inline-block")
            //                        .style("line-height", "0px");
            var currentLine = p_node.append("p")
                                    .attr("class", "text_p");

            // Spacing between div edge and text
            currentLine.append("span")
                       .attr("class", "text_edgespan")
                       //.style("font-family", namespace.Level.prototype.s_fontFamily)
                       //.style("font-size", 22)
                       //.style("opacity", 1.0)
                       .html("&nbsp;&nbsp;&nbsp;&nbsp;");

            // COST: (O(n^2) territory)
            for ( var index2 = 0; index2 < words.length; index2++ ) {

                // NOTE: undefined HACK
                // COST: Double conditional check
                if ( "-1" == this.m_data.json.lines_and_colors[index][1][index2]
                    || undefined == this.m_data.json.lines_and_colors[index][1][index2] ){

                    // COST: Append uncolored word
                    text = currentLine.append("span")
                                      .attr("class", "text_word")
                                      //.style("color", namespace.Level.prototype.s_palette.gold)
                                      //.style("font-family", namespace.Level.prototype.s_fontFamily)
                                      //.style("font-size", 22)
                                      //.style("opacity", 1.0)
                                      .html(words[index2] + "&nbsp;");

                    currentX += text[0][0].offsetWidth * 0.66;
                }
                else {

                    //var dlocolor = namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorLolight,
                    //                             this.m_level.m_topicColors[this.m_data.json.lines_and_colors[index][1][index2]]);
                    var dlocolor = this.m_level.m_topicColorsLoBlend[this.m_data.json.lines_and_colors[index][1][index2]];

                    // COST: Dealing with quotes client-side
                    /*var quoteType = "";
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

                        // COST: Appending before-quote separately
                        text = currentLine.append("span")
                                          .attr("class", "text_word")
                                          .style("color", namespace.Level.prototype.s_palette.gold)
                                          .style("font-family", namespace.Level.prototype.s_fontFamily)
                                          .style("font-size", 22)
                                          .style("opacity", 1.0)
                                          .html(quoteType);

                        currentX += text[0][0].offsetWidth * 0.66;
                    }

                    // COST: Quote after determination
                    tempTempWord = ( quotePlace == "a" ) ? tempWord : tempWord + "&nbsp;";*/

                    // COST: Append colored word with datum (word count x 2 + (3 * strings))
                    text = currentLine.append("span")
                                      .attr("class", "text_coloredword")
                                      .datum({ topicID: this.m_data.json.lines_and_colors[index][1][index2],
                                               locolor: dlocolor,
                                               color:this.m_level.m_topicColors[this.m_data.json.lines_and_colors[index][1][index2]],
                                               //word: tempTempWord })
                                               word: words[index2]})
                                      .style("color", this.m_level.m_topicColors[this.m_data.json.lines_and_colors[index][1][index2]])
                                      //.style("font-family", namespace.Level.prototype.s_fontFamily)
                                      //.style("font-size", 22)
                                      //.style("opacity", 1.0)
                                      //.html(tempTempWord);
                                      .html(words[index2]  + "&nbsp;")

                    currentX += text[0][0].offsetWidth * 0.66;

                    /*if ( "a" == quotePlace ){

                        // COST: Appending after-quote separately
                        text = currentLine.append("span")
                                          .attr("class", "text_word")
                                          .style("color", namespace.Level.prototype.s_palette.gold)
                                          .style("font-family", namespace.Level.prototype.s_fontFamily)
                                          .style("font-size", 22)
                                          .style("opacity", 1.0)
                                          .html(quoteType + "&nbsp;");

                        currentX += text[0][0].offsetWidth * 0.66;
                    }*/
                }
            }

            currentY += dy;
            if ( currentY > this.m_panel.m_size.height ){
                rectGrowth += dy;
            }

            // Append a break so the next line is drawn beneath
            p_node.append("br");
        }

        // Add mousover behavior for colored and non-colored words
        this.m_panel.m_div
                    .selectAll(".text_coloredword")
                    .attr("height", rectGrowth)
                    .on(namespace.Interaction.click, function(d){
                        namespace.TopicText.prototype.MouseBehavior(this, d, namespace.Interaction.click);
                        d3.event.stopPropagation();
                    }.bind(this))
                    .on(namespace.Interaction.mouseover, function(d){
                        namespace.TopicText.prototype.MouseBehavior(this, d, namespace.Interaction.mouseover);
                    }.bind(this))
                    .on(namespace.Interaction.mouseout, function(d){
                        namespace.TopicText.prototype.MouseBehavior(this, null, namespace.Interaction.mouseout);
                    }.bind(this));

        this.m_panel.m_div
                    .selectAll(".text_word")
                    .on(namespace.Interaction.click, function(d){
                        if ( -1 != this.m_level.m_highlightedTopic ){
                            namespace.TopicText.prototype.MouseBehavior(null, namespace.Interaction.click);
                            d3.event.stopPropagation();
                        }
                    }.bind(this));
    });

    namespace.TopicText.method("GetDataBarRef", function(){

        // Get a reference to the data bar
        var dataBarRef = null;
        for ( var index = 0; index < this.m_panel.m_linkedViews.length; index++ ){
            if ( this.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                dataBarRef = this.m_panel.m_linkedViews[index].panel;
                break;
            }
        }
        return dataBarRef;
    });

    namespace.TopicText.method("FindAndHighlightInDataBar", function(p_data){

        // Get a reference to the data bar and word weight tiles
        var dataBarRef = this.GetDataBarRef();
        var dataTilesRef = dataBarRef.m_wordWeightDataTiles;

        // Normalize the word for comparison (strip ws, punctuation, and to lowercase)
        var clean_word = p_data.word.trim();
        clean_word = clean_word.replace(/\b\W/, "");
        clean_word = clean_word.replace(/\W\b/, "");
        clean_word = clean_word.trim();
        clean_word = clean_word.toLowerCase();

        // Find the word in the data bar and highlight it and scroll to it
        for ( var index = 0; index < dataTilesRef.length; index++ ){
            if ( clean_word == dataTilesRef[index].m_text ){
                dataBarRef.Pause();
                dataTilesRef[index].HighlightTile(true);
                $(dataBarRef.m_div[0][0]).scrollTop(dataTilesRef[index].m_coordinates.y);
                break;
            }
        }
    });

    namespace.TopicText.method("UnhighlightTilesInDataBar", function(p_data){

        // Get a reference to the data bar and word weight tiles
        var dataBarRef = this.GetDataBarRef();
        var dataTilesRef = dataBarRef.m_wordWeightDataTiles;

        // Unhighlight all tiles and scroll to the top of the data bar
        for ( var index = 0; index < dataTilesRef.length; index++ ){
            dataTilesRef[index].HighlightTile(false);
        }
        dataBarRef.m_highlightIndex = -1;
        $(dataBarRef.m_div[0][0]).scrollTop(0);
    });

    namespace.TopicText.prototype.MouseBehavior = function(p_text, p_data, p_mouseEventType){

        // Unhighlighted
        if ( -1 == p_text.m_level.m_highlightedTopic ){

            // (1) Unhighlighted (Is Always Unpaused)
            //   (A) Mouseover --> Highlights topic text and topic elsewhere in linked panels
            //   (B) Click --> Mimics mouseover when unhighlighted (A) --> Pauses state of panel and linked panels
            //   (C) Double-Click --> Mimics click when unhighlighted (B)
            //   (D) Mouseout --> Nothing

            switch ( p_mouseEventType ){

                // (A) Mouseover --> Highlights topic text and topic elsewhere in linked panels
                case namespace.Interaction.mouseover:

                    p_text.m_panel.Update(p_data, namespace.Interaction.mouseover);
                    for ( var index = 0; index < p_text.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == p_text.m_linkedViews[index].update ){
                            p_text.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                    }

                    break;

                // (B) Click --> Mimics mouseover when unhighlighted (A) --> Pauses state of panel and linked panels
                case namespace.Interaction.click:
                // (C) Double-Click --> Mimics click when unhighlighted (B)
                case namespace.Interaction.dblclick:

                    p_text.m_panel.Update(p_data, namespace.Interaction.mouseover);
                    p_text.m_panel.Pause(true);
                    for ( var index = 0; index < p_text.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == p_text.m_linkedViews[index].update ){

                            if ( p_text.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                p_text.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.click);
                            }
                            p_text.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                        p_text.m_linkedViews[index].panel.Pause(true);
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
            if ( p_text.m_panel.IsPaused() ){

                switch ( p_mouseEventType ){

                    // (I) Mouseover --> Nothing
                    case namespace.Interaction.mouseover:

                        break;

                    // (II) Click
                    case namespace.Interaction.click:
                    // (III) Double-Click --> Mimics Click (II)
                    case namespace.Interaction.dblclick:

                        // (a) Same topic text --> Unpauses panel and linked panels --> Unhighlights all shapes
                        if ( null == p_data || p_data.topicID == p_text.m_level.m_highlightedTopic ){

                            p_text.m_panel.Pause(false);
                            p_text.m_panel.Update(null, namespace.Interaction.mouseover);
                            for ( var index = 0; index < p_text.m_linkedViews.length; index++ ){

                                p_text.m_linkedViews[index].panel.Pause(false);
                                p_text.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                            }
                        // (b) Different topic text --> Mimics click when unhighlighted (1.B)
                        } else {

                            p_text.m_panel.Pause(false);
                            p_text.m_panel.Update(p_data, namespace.Interaction.mouseover);
                            p_text.m_panel.Pause(true);
                            for ( var index = 0; index < p_text.m_linkedViews.length; index++ ){

                                p_text.m_linkedViews[index].panel.Pause(false);
                                if ( namespace.Interaction.mouseover == p_text.m_linkedViews[index].update ){

                                    if ( p_text.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                        p_text.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.click);
                                    }
                                    p_text.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                                }
                                p_text.m_linkedViews[index].panel.Pause(true);
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

                        p_text.m_panel.Update(p_data, namespace.Interaction.mouseover);
                        for ( var index = 0; index < p_text.m_linkedViews.length; index++ ){

                            if ( namespace.Interaction.mouseover == p_text.m_linkedViews[index].update ){
                                p_text.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                            }
                        }

                        break;

                    // (II) Click - Any topic text --> Pauses panel and linked panels
                    case namespace.Interaction.click:
                    // (III) Double-Click --> Mimics Click (II)
                    case namespace.Interaction.dblclick:

                        p_text.m_panel.Update(p_data, namespace.Interaction.mouseover);
                        p_text.m_panel.Pause(true);
                        for ( var index = 0; index < p_text.m_linkedViews.length; index++ ){
                            if ( namespace.Interaction.mouseover == p_text.m_linkedViews[index].update ){

                                if ( p_text.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                    p_text.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.click);
                                }
                                p_text.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                            }
                            p_text.m_linkedViews[index].panel.Pause(true);
                        }

                        break;

                    // (IV) Mouseout --> Unhighlights all text
                    case namespace.Interaction.mouseout:

                        p_text.m_panel.Update(null, namespace.Interaction.mouseover);
                        for ( var index = 0; index < p_text.m_linkedViews.length; index++ ){
                            p_text.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                        }

                        break;
                }

            }
        }
    };

    // TWiC DataTile inherits from DataShape
    namespace.DataTile = function(p_coordinates, p_size, p_name, p_level, p_panel, p_dataShape){

        // Apply the base class arguments
        namespace.DataShape.apply(this, arguments);

        // DataTiles refer to another datashape to display its underlying information
        this.m_dataShape = p_dataShape;
    };
    namespace.DataTile.inherits(namespace.DataShape);

    namespace.DataTile.method("ResizeOverTime", function(p_transition){

        var x = 0;
    });


    // TWiC TopicTile inherits from DataTile
    namespace.TopicTile = function(p_coordinates, p_size, p_name, p_level, p_panel, p_dataShape, p_topicID){

        // Apply the base class arguments
        namespace.DataTile.apply(this, arguments);

        // Information about this topic
        this.m_topicID = p_topicID;
        for ( topicID in this.m_dataShape.m_fullTopicListRef ){
            if ( this.m_topicID == topicID ){
                this.m_topicProportion = this.m_dataShape.m_fullTopicListRef[topicID][1];
            }
        }

        this.m_topicProportion /= p_dataShape.m_topicProportionSum;
        this.m_topicColor = this.m_level.m_topicColors[this.m_topicID];
        this.m_topicWords = this.m_level.m_topicWordLists[this.m_topicID];
    };
    namespace.TopicTile.inherits(namespace.DataTile);

    namespace.TopicTile.method("Draw", function(p_percentProportion){

        // The basic group under which all drawn information objects will sit
        this.m_shapeGroup = this.m_panel.m_tileGroup.append("g")
                                              .attr("class", namespace.DataBar.prototype.s_datashapeClassName)
                                              .attr("id", namespace.DataBar.prototype.s_datashapeClassName + "_" + this.m_name)
                                              .datum({ "topicID": this.m_topicID,
                                                       "color": this.m_level.m_topicColors[this.m_topicID],
                                                       "tileRef": this })
                                              .on(namespace.Interaction.click, function(d){
                                                  if ( this.m_clickTimerID ){

                                                      clearTimeout(this.m_clickTimerID);
                                                      this.m_clickTimerID = null;

                                                      // Do double click code here
                                                      namespace.TopicTile.prototype.MouseBehavior(this, d, namespace.Interaction.dblclick);
                                                  } else {

                                                      this.m_clickTimerID = setTimeout(function(p_data){

                                                          this.m_clickTimerID = null;

                                                          // Do single click code here
                                                          namespace.TopicTile.prototype.MouseBehavior(this, p_data, namespace.Interaction.click);
                                                      }.bind(this, d), 250);

                                                  }
                                              }.bind(this))
                                              .on(namespace.Interaction.mouseover, function(d){
                                                  namespace.TopicTile.prototype.MouseBehavior(this, d, namespace.Interaction.mouseover);
                                              }.bind(this))
                                              .on(namespace.Interaction.mouseout, function(){
                                                  namespace.TopicTile.prototype.MouseBehavior(this, null, namespace.Interaction.mouseout);
                                              }.bind(this));

        // Transaprent rectangle to maintain mouseover seamlessness between tiles
        this.m_shapeGroup.append("rect")
                         .attr("x", this.m_coordinates.x)
                         .attr("y", this.m_coordinates.y + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("width", this.m_panel.m_size.width)
                         .attr("height", namespace.TopicTile.prototype.s_tileDims.height + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                         .style("opacity", 0);

        // Visible, underlying rectangle
        this.m_shapeGroup.append("rect")
                         .attr("x", this.m_coordinates.x + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("y", this.m_coordinates.y + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("width", this.m_panel.m_size.width - (2 * namespace.DataBar.prototype.s_elementSpacing))
                         .attr("height", namespace.TopicTile.prototype.s_tileDims.height)
                         .style("fill", namespace.Level.prototype.s_palette.tile);

        // Highlight rectangle
        this.m_highlightRect = this.m_shapeGroup.append("rect")
                                                .attr("x", this.m_coordinates.x + namespace.DataBar.prototype.s_elementSpacing)
                                                .attr("y", this.m_coordinates.y + namespace.DataBar.prototype.s_elementSpacing)
                                                .attr("width", this.m_panel.m_size.width - (2 * namespace.DataBar.prototype.s_elementSpacing))
                                                .attr("height", namespace.TopicTile.prototype.s_tileDims.height)
                                                .style("fill", namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorHighlight,
                                                                                    namespace.Level.prototype.s_palette.tile))
                                                .style("opacity", 0.0);

        // Topic name
        this.m_title = this.m_shapeGroup.append("text")
                                        .attr("x", this.m_coordinates.x + (2 * namespace.DataBar.prototype.s_elementSpacing))
                                        .attr("y", this.m_coordinates.y + (3 * namespace.DataBar.prototype.s_elementSpacing));
        this.m_title.append("tspan")
                    .html("Topic&nbsp;")
                    .attr("fill", namespace.Level.prototype.s_palette.gold)
                    .style("font-family", namespace.Level.prototype.s_fontFamily)
                    .style("font-size", 21);
        this.m_title.append("tspan")
                    .html(this.m_topicID)
                    .attr("fill", this.m_level.m_topicColors[this.m_topicID])
                    .style("font-family", namespace.Level.prototype.s_fontFamily)
                    .style("font-size", 21);

        // Topic proportion
        var proportionWidth = p_percentProportion * (namespace.TopicTile.prototype.s_tileDims.width - (2 * namespace.DataBar.prototype.s_elementSpacing));
        this.m_proportion = this.m_shapeGroup.append("rect")
                                             .attr("class", "topic_tile_proportion")
                                             .attr("x", this.m_coordinates.x + (3 * namespace.TopicTile.prototype.s_topicCircleRadius))
                                             .attr("y", this.m_coordinates.y + (4 * namespace.DataBar.prototype.s_elementSpacing))
                                             .attr("width", proportionWidth)
                                             .attr("height", (2 * namespace.DataBar.prototype.s_elementSpacing))
                                             .style("fill", this.m_level.m_topicColors[this.m_topicID]);

        // Topic proportion percentage
        this.m_proportionText = this.m_shapeGroup.append("text")
                                                 .attr("x", this.m_coordinates.x + proportionWidth + (4 * namespace.TopicTile.prototype.s_topicCircleRadius))
                                                 .attr("y", this.m_coordinates.y + (5.5 * namespace.DataBar.prototype.s_elementSpacing));
        this.m_proportionText.append("tspan")
                             .html(((this.m_topicProportion * 100).toFixed(3)) + "&nbsp;%")
                             .attr("fill", namespace.Level.prototype.s_palette.gold)
                             .style("font-family", namespace.Level.prototype.s_fontFamily)
                             .style("font-size", 21)
                             .style("font-weight", "bold");
    });

    namespace.TopicTile.method("HighlightTile", function(p_doHighlight){

        var opacity = ( p_doHighlight ) ? 1.0 : 0.0;
        this.m_highlightRect.style("opacity", opacity);
    });

    namespace.TopicTile.method("ResizeOverTime", function(p_transition){

        this.m_shapeGroup.selectAll("rect")
                         .filter(function(){ return "topic_tile_proportion" != d3.select(this).attr("class"); })
                         .transition()
                         .duration(p_transition.duration)
                         .attr("x", this.m_coordinates.x + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("y", this.m_coordinates.y + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("width", p_transition.size.width);
    });

    namespace.TopicTile.prototype.MouseBehavior = function(p_tile, p_data, p_mouseEventType){

        // Unhighlighted
        if ( -1 == p_tile.m_level.m_highlightedTopic ){

            // (1) Unhighlighted (Is Always Unpaused)
            //   (A) Mouseover --> Highlights topic tile and topic elsewhere in linked panels
            //   (B) Click --> Mimics mouseover when unhighlighted (a) --> Pauses state of panel and linked panels
            //   (C) Double-Click --> Mimics click when unhighlighted (b) --> Opens underlying panel if not already open
            //   (D) Mouseout --> Nothing

            switch ( p_mouseEventType ){

                // (A) Mouseover --> Highlights topic tile and topic elsewhere in linked panels
                case namespace.Interaction.mouseover:

                    p_tile.m_panel.Update(p_data, namespace.Interaction.mouseover, true);
                    for ( var index = 0; index < p_tile.m_panel.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == p_tile.m_panel.m_linkedViews[index].update ){
                            p_tile.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                    }

                    break;

                // (B) Click --> Mimics mouseover when unhighlighted (a) --> Pauses state of panel and linked panels
                case namespace.Interaction.click:
                // (C) Double-Click --> Mimics click when unhighlighted (b)
                case namespace.Interaction.dblclick:

                    p_tile.m_panel.Pause(false);
                    p_tile.m_panel.Update(p_data, namespace.Interaction.mouseover, true);
                    p_tile.m_panel.Pause(true);
                    for ( var index = 0; index < p_tile.m_panel.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == p_tile.m_panel.m_linkedViews[index].update ){
                            p_tile.m_panel.m_linkedViews[index].panel.Pause(false);
                            p_tile.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                        p_tile.m_panel.m_linkedViews[index].panel.Pause(true);
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
            //       (a) Same tile --> Unpauses panel and linked panels --> Unhighlights all shapes
            //       (b) Different tile --> Mimics click when unhighlighted (1.B)
            //     (III) Double-Click --> Mimics Click (II)
            //     (IV) Mouseout --> Nothing
            //  (B) Unpaused
            //    (I) Mouseover --> Mimics Mouseover Unhighlighted (1.A)
            //    (II) Click - Any tile --> Pauses panel and linked panels
            //    (III) Double-Click --> Mimics Double-Click Unhighlighted (1.C)
            //    (IV) Mouseout --> Unhighlights current tile or entire bullseye

            // Paused
            if ( p_tile.m_panel.IsPaused() ){

                switch ( p_mouseEventType ){

                    // (I) Mouseover --> Nothing
                    case namespace.Interaction.mouseover:

                        break;

                    // (II) Click
                    case namespace.Interaction.click:
                    // (III) Double-Click --> Mimics Click (II)
                    case namespace.Interaction.dblclick:

                        // (a) Same tile --> Unpauses panel and linked panels --> Unhighlights all shapes
                        if ( p_data.topicID == p_tile.m_level.m_highlightedTopic ){

                            p_tile.m_panel.Pause(false);
                            p_tile.m_panel.Update(null, namespace.Interaction.mouseover, true);
                            for ( var index = 0; index < p_tile.m_panel.m_linkedViews.length; index++ ){

                                p_tile.m_panel.m_linkedViews[index].panel.Pause(false);
                                p_tile.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                            }
                        // (b) Different tile --> Mimics click when unhighlighted (1.B)
                        } else {

                            p_tile.m_panel.Pause(false);
                            p_tile.m_panel.Update(null, namespace.Interaction.mouseover, true);
                            p_tile.m_panel.Update(p_data, namespace.Interaction.mouseover, true);
                            p_tile.m_panel.Pause(true);
                            for ( var index = 0; index < p_tile.m_panel.m_linkedViews.length; index++ ){

                                if ( namespace.Interaction.mouseover == p_tile.m_panel.m_linkedViews[index].update ){

                                    p_tile.m_panel.m_linkedViews[index].panel.Pause(false);
                                    p_tile.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                                    if ( p_tile.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                        p_tile.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_tile }, namespace.Interaction.click);
                                    }
                                    p_tile.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                                }
                                p_tile.m_panel.m_linkedViews[index].panel.Pause(true);
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

                    // (I) Mouseover --> Nothing
                    case namespace.Interaction.mouseover:

                        break;

                    // (II) Click - Any tile --> Pauses panel and linked panels
                    case namespace.Interaction.click:
                    // (III) Double-Click --> Mimics Click (II)
                    case namespace.Interaction.dblclick:

                        p_tile.m_panel.Pause(true);
                        for ( var index = 0; index < p_tile.m_panel.m_linkedViews.length; index++ ){
                            p_tile.m_panel.m_linkedViews[index].panel.Pause(true);
                        }

                        break;

                    // (IV) Mouseout --> Unhighlights entire bullseye
                    case namespace.Interaction.mouseout:

                        p_tile.m_panel.Update(null, namespace.Interaction.mouseover, true);
                        for ( var index = 0; index < p_tile.m_panel.m_linkedViews.length; index++ ){
                            p_tile.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                        }

                        break;
                }
            }
        }
    };

    namespace.TopicTile.prototype.s_tileDims = { width: 300, height: 100 };
    namespace.TopicTile.prototype.s_topicCircleRadius = 15;


    // TWiC MetaDataTile inherits from DataTile
    namespace.MetaDataTile = function(p_coordinates, p_size, p_name, p_level, p_panel, p_dataShape, p_text, p_value){

        // Apply the base class arguments
        namespace.DataTile.apply(this, arguments);

        this.m_text = p_text;
        this.m_value = p_value;
    };
    namespace.MetaDataTile.inherits(namespace.DataTile);

    namespace.MetaDataTile.method("Draw", function(p_isFloatValue){

        // The basic group under which all drawn information objects will sit
        this.m_shapeGroup = this.m_panel.m_tileGroup.append("g")
                                                    .attr("class", namespace.DataBar.prototype.s_datashapeClassName)
                                                    .attr("id", namespace.DataBar.prototype.s_datashapeClassName + "_" + this.m_name);

        // Underlying rectangle
        this.m_shapeGroup.append("rect")
                         .attr("x", this.m_coordinates.x + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("y", this.m_coordinates.y + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("width", this.m_panel.m_size.width - (2 * namespace.DataBar.prototype.s_elementSpacing))
                         .attr("height", namespace.MetaDataTile.prototype.s_tileDims.height)
                         .style("fill", namespace.Level.prototype.s_palette.tile);

        // Descriptive text and value
        this.m_title = this.m_shapeGroup.append("text")
                                        .attr("x", this.m_coordinates.x + (2 * namespace.DataBar.prototype.s_elementSpacing))
                                        .attr("y", this.m_coordinates.y + (3 * namespace.DataBar.prototype.s_elementSpacing));
        this.m_title.append("tspan")
                    .html(this.m_text + ":&nbsp;")
                    .attr("fill", namespace.Level.prototype.s_palette.gold)
                    .style("font-family", namespace.Level.prototype.s_fontFamily)
                    .style("font-size", 21);
        this.m_title.append("tspan")
                    .html(( p_isFloatValue ) ? this.m_value.toFixed(3) : this.m_value)
                    .attr("fill", namespace.Level.prototype.s_palette.lightpurple)
                    .style("font-family", namespace.Level.prototype.s_fontFamily)
                    .style("font-size", 21);
    });

    namespace.MetaDataTile.method("ResizeOverTime", function(p_transition){

        this.m_shapeGroup.selectAll("rect")
                         .transition()
                         .duration(p_transition.duration)
                         .attr("x", this.m_coordinates.x + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("y", this.m_coordinates.y + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("width", p_transition.size.width);
    });

    namespace.MetaDataTile.prototype.s_tileDims = { width: 300, height: 50 };


    // TWiC WordWeightTile inherits from DataTile
    namespace.WordWeightTile = function(p_coordinates, p_size, p_name, p_level, p_panel, p_dataShape, p_topicID, p_text, p_value){

        // Apply the base class arguments
        namespace.DataTile.apply(this, arguments);

        this.m_topicID = p_topicID;
        this.m_text = p_text;
        this.m_value = p_value;
    };
    namespace.WordWeightTile.inherits(namespace.DataTile);

    namespace.WordWeightTile.method("Draw", function(p_percentProportion){

        // The basic group under which all drawn information objects will sit
        this.m_shapeGroup = this.m_panel.m_tileGroup.append("g")
                                              .attr("class", namespace.DataBar.prototype.s_datashapeClassName)
                                              .attr("id", namespace.DataBar.prototype.s_datashapeClassName + "_" + this.m_name)
                                              .datum({ "topicID": this.m_topicID,
                                                       "color": this.m_level.m_topicColors[this.m_topicID],
                                                       "tileRef": this })
                                              .on(namespace.Interaction.click, function(d){
                                                  if ( this.m_clickTimerID ){

                                                      clearTimeout(this.m_clickTimerID);
                                                      this.m_clickTimerID = null;

                                                      // Do double click code here
                                                      namespace.WordWeightTile.prototype.MouseBehavior(this, d, namespace.Interaction.dblclick);
                                                  } else {

                                                      this.m_clickTimerID = setTimeout(function(p_data){

                                                          this.m_clickTimerID = null;

                                                          // Do single click code here
                                                          namespace.WordWeightTile.prototype.MouseBehavior(this, p_data, namespace.Interaction.click);
                                                      }.bind(this, d), 250);

                                                  }
                                              }.bind(this))
                                              .on(namespace.Interaction.mouseover, function(d){
                                                  namespace.WordWeightTile.prototype.MouseBehavior(this, d, namespace.Interaction.mouseover);
                                              }.bind(this))
                                              .on(namespace.Interaction.mouseout, function(){
                                                  namespace.WordWeightTile.prototype.MouseBehavior(this, null, namespace.Interaction.mouseout);
                                              }.bind(this));

        // Transaprent rectangle to maintain mouseover seamlessness between tiles
        this.m_shapeGroup.append("rect")
                         .attr("x", this.m_coordinates.x)
                         .attr("y", this.m_coordinates.y + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("width", this.m_panel.m_size.width)
                         .attr("height", namespace.WordWeightTile.prototype.s_tileDims.height + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("fill", namespace.Level.prototype.s_palette.darkblue)
                         .style("opacity", 0);

        // Visible, underlying rectangle
        this.m_shapeGroup.append("rect")
                         .attr("x", this.m_coordinates.x + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("y", this.m_coordinates.y + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("width", this.m_panel.m_size.width - (2 * namespace.DataBar.prototype.s_elementSpacing))
                         .attr("height", namespace.WordWeightTile.prototype.s_tileDims.height)
                         .style("fill", namespace.Level.prototype.s_palette.tile);

        // Highlight rectangle
        this.m_highlightRect = this.m_shapeGroup.append("rect")
                                                .attr("x", this.m_coordinates.x + namespace.DataBar.prototype.s_elementSpacing)
                                                .attr("y", this.m_coordinates.y + namespace.DataBar.prototype.s_elementSpacing)
                                                .attr("width", this.m_panel.m_size.width - (2 * namespace.DataBar.prototype.s_elementSpacing))
                                                .attr("height", namespace.WordWeightTile.prototype.s_tileDims.height)
                                                .style("fill", namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorHighlight,
                                                                                    namespace.Level.prototype.s_palette.tile))
                                                .style("opacity", 0.0);

        // Topic word
        this.m_title = this.m_shapeGroup.append("text")
                                        .attr("x", this.m_coordinates.x + (2 * namespace.DataBar.prototype.s_elementSpacing))
                                        .attr("y", this.m_coordinates.y + (3 * namespace.DataBar.prototype.s_elementSpacing));
        this.m_title.append("tspan")
                    .html(this.m_text)
                    .attr("fill", this.m_level.m_topicColors[this.m_topicID])
                    .style("font-family", namespace.Level.prototype.s_fontFamily)
                    .style("font-size", 21);

        // Topic word weight
        var proportionWidth = (this.m_value / p_percentProportion) * (namespace.WordWeightTile.prototype.s_tileDims.width - (2 * namespace.DataBar.prototype.s_elementSpacing));
        this.m_proportion = this.m_shapeGroup.append("rect")
                                             .attr("class", "wordweight_tile_proportion")
                                             .attr("x", this.m_coordinates.x + (3 * namespace.WordWeightTile.prototype.s_topicCircleRadius))
                                             .attr("y", this.m_coordinates.y + (4 * namespace.DataBar.prototype.s_elementSpacing))
                                             .attr("width", proportionWidth)
                                             .attr("height", (2 * namespace.DataBar.prototype.s_elementSpacing))
                                             .style("fill", this.m_level.m_topicColors[this.m_topicID]);

        // Topic proportion percentage
        this.m_proportionText = this.m_shapeGroup.append("text")
                                                 .attr("x", this.m_coordinates.x + proportionWidth + (4 * namespace.WordWeightTile.prototype.s_topicCircleRadius))
                                                 .attr("y", this.m_coordinates.y + (5.5 * namespace.DataBar.prototype.s_elementSpacing));
        this.m_proportionText.append("tspan")
                             .html(((this.m_value).toFixed(3)) + "&nbsp;%")
                             .attr("fill", namespace.Level.prototype.s_palette.gold)
                             .style("font-family", namespace.Level.prototype.s_fontFamily)
                             .style("font-size", 21)
                             .style("font-weight", "bold");
    });

    namespace.WordWeightTile.method("HighlightTile", function(p_doHighlight){

        var opacity = ( p_doHighlight ) ? 1.0 : 0.0;
        this.m_highlightRect.style("opacity", opacity);
    });

    namespace.WordWeightTile.method("ResizeOverTime", function(p_transition){

        this.m_shapeGroup.selectAll("rect")
                         .filter(function(){ return "wordweight_tile_proportion" != d3.select(this).attr("class"); })
                         .transition()
                         .duration(p_transition.duration)
                         .attr("x", this.m_coordinates.x + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("y", this.m_coordinates.y + namespace.DataBar.prototype.s_elementSpacing)
                         .attr("width", p_transition.size.width);
    });

    namespace.WordWeightTile.prototype.MouseBehavior = function(p_tile, p_data, p_mouseEventType){

        // Unhighlighted
        if ( -1 == p_tile.m_level.m_highlightedTopic ){

            // (1) Unhighlighted (Is Always Unpaused)
            //   (A) Mouseover --> Highlights wordweight tile and topic elsewhere in linked panels
            //   (B) Click --> Mimics mouseover when unhighlighted (a) --> Pauses state of panel and linked panels
            //   (C) Double-Click --> Mimics click when unhighlighted (b) --> Opens underlying panel if not already open
            //   (D) Mouseout --> Nothing

            switch ( p_mouseEventType ){

                // (A) Mouseover --> Highlights wordweight tile and topic elsewhere in linked panels
                case namespace.Interaction.mouseover:

                    p_tile.m_panel.Update(p_data, namespace.Interaction.mouseover, true);
                    for ( var index = 0; index < p_tile.m_panel.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == p_tile.m_panel.m_linkedViews[index].update ){
                            p_tile.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                    }

                    break;

                // (B) Click --> Mimics mouseover when unhighlighted (a) --> Pauses state of panel and linked panels
                case namespace.Interaction.click:
                // (C) Double-Click --> Mimics click when unhighlighted (b)
                case namespace.Interaction.dblclick:

                    p_tile.m_panel.Pause(false);
                    p_tile.m_panel.Update(p_data, namespace.Interaction.mouseover, true);
                    p_tile.m_panel.Pause(true);
                    for ( var index = 0; index < p_tile.m_panel.m_linkedViews.length; index++ ){

                        if ( namespace.Interaction.mouseover == p_tile.m_panel.m_linkedViews[index].update ){
                            p_tile.m_panel.m_linkedViews[index].panel.Pause(false);
                            p_tile.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                        }
                        p_tile.m_panel.m_linkedViews[index].panel.Pause(true);
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
            //       (a) Same tile --> Unpauses panel and linked panels --> Unhighlights all shapes
            //       (b) Different tile --> Mimics click when unhighlighted (1.B)
            //     (III) Double-Click --> Mimics Click (II)
            //     (IV) Mouseout --> Nothing
            //  (B) Unpaused
            //    (I) Mouseover --> Mimics Mouseover Unhighlighted (1.A)
            //    (II) Click - Any tile --> Pauses panel and linked panels
            //    (III) Double-Click --> Mimics Double-Click Unhighlighted (1.C)
            //    (IV) Mouseout --> Unhighlights current tile or entire bullseye

            // Paused
            if ( p_tile.m_panel.IsPaused() ){

                switch ( p_mouseEventType ){

                    // (I) Mouseover --> Nothing
                    case namespace.Interaction.mouseover:

                        break;

                    // (II) Click
                    case namespace.Interaction.click:
                    // (III) Double-Click --> Mimics Click (II)
                    case namespace.Interaction.dblclick:

                        // (a) Same tile --> Unpauses panel and linked panels --> Unhighlights all shapes
                        if ( p_data.topicID == p_tile.m_level.m_highlightedTopic ){

                            p_tile.m_panel.Pause(false);
                            p_tile.m_panel.Update(null, namespace.Interaction.mouseover, true);
                            for ( var index = 0; index < p_tile.m_panel.m_linkedViews.length; index++ ){

                                p_tile.m_panel.m_linkedViews[index].panel.Pause(false);
                                p_tile.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                            }
                        // (b) Different tile --> Mimics click when unhighlighted (1.B)
                        } else {

                            p_tile.m_panel.Pause(false);
                            p_tile.m_panel.Update(null, namespace.Interaction.mouseover, true);
                            p_tile.m_panel.Update(p_data, namespace.Interaction.mouseover, true);
                            p_tile.m_panel.Pause(true);
                            for ( var index = 0; index < p_tile.m_panel.m_linkedViews.length; index++ ){

                                if ( namespace.Interaction.mouseover == p_tile.m_panel.m_linkedViews[index].update ){

                                    p_tile.m_panel.m_linkedViews[index].panel.Pause(false);
                                    p_tile.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                                    if ( p_tile.m_panel.m_linkedViews[index].panel instanceof namespace.DataBar ){
                                        p_tile.m_panel.m_linkedViews[index].panel.Update({ shapeRef: p_tile }, namespace.Interaction.click);
                                    }
                                    p_tile.m_panel.m_linkedViews[index].panel.Update(p_data, namespace.Interaction.mouseover);
                                }
                                p_tile.m_panel.m_linkedViews[index].panel.Pause(true);
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

                    // (I) Mouseover --> Nothing
                    case namespace.Interaction.mouseover:

                        break;

                    // (II) Click - Any tile --> Pauses panel and linked panels
                    case namespace.Interaction.click:
                    // (III) Double-Click --> Mimics Click (II)
                    case namespace.Interaction.dblclick:

                        p_tile.m_panel.Pause(true);
                        for ( var index = 0; index < p_tile.m_panel.m_linkedViews.length; index++ ){
                            p_tile.m_panel.m_linkedViews[index].panel.Pause(true);
                        }

                        break;

                    // (IV) Mouseout --> Unhighlights entire bullseye
                    case namespace.Interaction.mouseout:

                        p_tile.m_panel.Update(null, namespace.Interaction.mouseover, true);
                        for ( var index = 0; index < p_tile.m_panel.m_linkedViews.length; index++ ){
                            p_tile.m_panel.m_linkedViews[index].panel.Update(null, namespace.Interaction.mouseover);
                        }

                        break;
                }
            }
        }
    };

    namespace.WordWeightTile.prototype.s_tileDims = { width: 300, height: 100 };
    namespace.WordWeightTile.prototype.s_topicCircleRadius = 15;


    return namespace;

}(TWiC || {}));