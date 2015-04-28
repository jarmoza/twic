var TWIC = (function(twic_namespace){

    // TWiC Base Object
    // Purpose:
    // (1) Interface for basic TWiC_Object functions
    // (2) Static vars (in prototype) for unique object ID (via count) and topic color map

    twic_namespace.TWiC_Object = function (){ };

    twic_namespace.TWiC_Object.method("BindDataToNode", function(p_node){ });
    twic_namespace.TWiC_Object.method("AppendSVGandBindData", function(p_node){ });
    twic_namespace.TWiC_Object.prototype.s_objectCount = 0;
    twic_namespace.TWiC_Object.prototype.s_topicColors = null;

    // TWiC_Cluster (inherits from TWiC_Object)
    twic_namespace.TWiC_Cluster = function(svgContainer, center, radius, numberCircles, topicColors, topics, ideal_text, nodeIndex){

        this.svgContainer = svgContainer;
        this.center = [center[0],center[1]];
        this.radius = radius;
        this.numberCircles = numberCircles;
        this.ideal_text = ideal_text;
        this.nodeIndex = nodeIndex;

        // Draw circles from largest to smallest
        this.topTopics = [];
        for ( var index = 0; index < numberCircles; index++ )
            this.topTopics.push([topics[index][0], topics[index][1]]);

    };
    twic_namespace.TWiC_Cluster.inherits(twic_namespace.TWiC_Object);

    twic_namespace.TWiC_Cluster.prototype.colorHighlight = 0.50;
    twic_namespace.TWiC_Cluster.prototype.colorLolight = -0.50;


    twic_namespace.TWiC_Cluster.method("Load", function(){ });

    twic_namespace.TWiC_Cluster.method("BindDataToNode", function(p_node){

        p_node.center = this.center;
        p_node.radius = this.radius;
        p_node.parentDims = [parseInt(d3.select("svg").attr("width")),parseInt(d3.select("svg").attr("height"))];
    });

    twic_namespace.TWiC_Cluster.method("AppendSVGandBindData", function(p_node, pb_isRoot){

        var currentRadius = this.radius;
        var radiusReduction = this.radius / this.numberCircles;

        // Modify the given node to be a twic cluster group (extra parent group for smooth zoom-behavior)
        this.cluster_group = p_node.append("g")
                                   .attr("class", "twic_object_smoothzooming_group")
                                   .attr("id", "twic_cluster_" + TWIC.TWiC_Object.prototype.s_objectCount)
                                   ////.on("mouseenter", function(d) { TWiC_Cluster.prototype.DarkenClusterColors(d); })
                                   .on("mouseout", function(d){
                                      TWIC.TWiC_Cluster.prototype.ResetClusterColors(d);
                                      TWIC.TWiC_Cluster.prototype.HighlightTopicinPanel(d, false);
                                   });
                                   //.on("click", this.ClickToZoom(this));
        TWIC.TWiC_Object.prototype.s_objectCount += 1;

        // Add each topic circle, binding data to it
        for ( var index = 0; index < this.numberCircles; index++ ){

            var data = null;
            if ( 1 == this.numberCircles ){
                 data = {
                    // Color
                    "color" : topicColors[this.topTopics[index][0]],
                    // Highlight color
                    "hicolor" : topicColors[this.topTopics[index][0]],

                    // Lolight color
                    "locolor" : topicColors[this.topTopics[index][0]],

                    // Topic ID
                    "topicID" : this.topTopics[index][0],

                    // Topic proportion
                    "prop" : this.topTopics[index][1]
                };
            }
            else {
                data = {
                    // Color
                    "color" : topicColors[this.topTopics[index][0]],
                    // Highlight color
                    "hicolor" : TWIC.TWiC_Cluster.prototype.shadeBlend(TWIC.TWiC_Cluster.prototype.colorHighlight,
                                                                  TWIC.TWiC_Object.prototype.s_topicColors[this.topTopics[index][0]]),
                    //"hicolor" : "white",
                    // Lolight color
                    "locolor" : TWIC.TWiC_Cluster.prototype.shadeBlend(TWIC.TWiC_Cluster.prototype.colorLolight,
                                                                  TWIC.TWiC_Object.prototype.s_topicColors[this.topTopics[index][0]]),
                    //"locolor" : "black",
                    // Topic ID
                    "topicID" : this.topTopics[index][0],
                    // Topic proportion
                    "prop" : this.topTopics[index][1]
                };
            }

            this.cluster_group.append("circle")
                              .datum(data)
                              .attr("class","topic_circle")
                              .attr("id", function(d){ return "topic-" + d.topicID; })
                              .attr("cx", this.center[0])
                              .attr("cy", this.center[1])
                              .attr("r", currentRadius)
                              //.style("fill", topicColors[this.topTopics[index][0]])
                              .style("fill", function(d){ return d.locolor; })
                              .on("mouseover", function(d){
                                TWIC.TWiC_Cluster.prototype.HighlightTopicShapes(d, true);
                                TWIC.TWiC_Cluster.prototype.HighlightTopicinPanel(d, true);
                              })
                              .on("mouseout", function(d){ TWIC.TWiC_Cluster.prototype.HighlightTopicinPanel(d, false); });
                              //.on("mouseout",  function(d){ TWiC_Cluster.prototype.HighlightTopicShapes(d, false); });


            currentRadius -= radiusReduction;
        }
    });

    twic_namespace.TWiC_Cluster.method("ResetClusterColors", function(d){

        //d3.selectAll(".topic_circle").style("fill", function(d){ return d.color; });
        d3.selectAll(".topic_circle").style("fill", function(d){ return d.locolor; });
    });

    twic_namespace.TWiC_Cluster.method("DarkenClusterColors", function(d){

        d3.selectAll(".topic_circle").style("fill", function(d){ return d.locolor; });
    });

    twic_namespace.TWiC_Cluster.method("HighlightTopicShapes", function (data, highlight){

      // selectAll() yields multi-cluster coloring!!!
        d3.selectAll(".topic_circle")
          .filter(function(d){ return d.topicID == data.topicID; })
          .style("fill", data.color);
        d3.selectAll(".topic_circle")
          .filter(function(d){ return d.topicID != data.topicID; })
          .style("fill", function(d){ return d.locolor; });
    });

    twic_namespace.TWiC_Cluster.method("HighlightTopicinPanel", function(data, highlight){

        if ( highlight ) {
              // Highlight the topic word list and scroll to it
              d3.select(".topic_wordlist#topic_" + data.topicID).attr("fill", "#002240");
              d3.select(".topic_highlightrect#topic_" + data.topicID).attr("fill", data.color).attr("opacity", "1");
              d3.select("#twic_topicbar_svg").attr("viewBox","0 " + (parseInt(data.topicID) * 30) + " 1500 300");
              //d3.select("#twic_topicbar_svg").attr("scrollTop",parseInt(data.topicID) * 50);
        }
        else {
            // De-highlight all topic words lists and scroll back to the top of the topic bar
            d3.selectAll(".topic_wordlist").attr("fill", function(d){ return topicColors[d.id]; });
            d3.selectAll(".topic_highlightrect").attr("fill", "#002240").attr("opacity","0");
            d3.select("#twic_topicbar_svg").attr("viewBox","0 0 1500 300");
            //d3.select("#twic_topicbar_svg").attr("scrollTop","0");
        }
    });

    // From http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
    twic_namespace.TWiC_Cluster.method("shadeBlend", function(p,c0,c1) {
        var n=p<0?p*-1:p,u=Math.round,w=parseInt;
        if(c0.length>7){
            var f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
            return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")"
        }else{
            var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
            return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
        }
    });


    // TWiC_Rectangle constructor
    twic_namespace.TWiC_Rectangle = function(){

    };
    twic_namespace.TWiC_Rectangle.inherits(twic_namespace.TWiC_Object);

    return twic_namespace;

}(TWIC || {}));