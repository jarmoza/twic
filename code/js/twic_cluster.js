/*

TWiC_MasterScript - Loads all JSON files, displays GraphView, InformationView, TopicBar

TWiC_GraphView - Shows corpus cluster, document clusters, documents
TWiC_InformationView - Shows information about corpus cluster, document clusters, documents
TWiC_TopicBar - Shows the topic words of the current topic being highlighted

TWiC_Cluster (bullseye abstraction, contains TWiC_Rectangles)
TWiC_Rectangle (rectangle abstraction, contains TWiC_Documents)
TWiC_Document (topic words in context view, contains text/topic information)

*/

// TWiC_Cluster constructor
function TWiC_Cluster(svgContainer, center, radius, numberCircles, topicColors, topics){

    this.svgContainer = svgContainer;
    this.center = [center[0],center[1]];
    this.radius = radius;
    //this.draggedCenter = [center[0],center[1]];
    this.active = d3.select(null);
    this.lastZoomScale = 1;
    //this.zoomBehavior = d3.behavior().zoom();

    // Draw circles from largest to smallest
    this.topTopics = [];
    for ( var index = 0; index < numberCircles; index++ )
        this.topTopics.push([topics[index][0], topics[index][1]]);
    this.circles = [];
    var currentRadius = radius;
    var radiusReduction = radius / numberCircles;

    // Insert the twic cluster group into the DOM (extra parent group for smooth zoom-behavior)
    // NOTE (3/18/15): Do mouseenter, mouseout, and click event handlers get called under this group tag configuration?
    this.cluster_group = svgContainer.append("g")
                                     .attr("class","twic_cluster")
                                     .attr("id", TWiC_Cluster.prototype.clusterCount)
                                     .append("g")
                                     .on("mouseenter", function(d) { TWiC_Cluster.prototype.DarkenClusterColors(d); })
                                     .on("mouseout", function(d){ TWiC_Cluster.prototype.ResetClusterColors(d); })
                                     .on("click", this.ClickToZoom(this));
                                     //.call(this.zoomBehavior.scaleExtent(TWiC_Cluster.prototype.scaleExtentLimits).on("zoom", this.ScrollToZoom(this)));
    TWiC_Cluster.prototype.clusterCount += 1;


    for ( var index = 0; index < numberCircles; index++ ){

      var data = {
        // Color
        "color" : topicColors[this.topTopics[index][0]],
        // Highlight color
        "hicolor" : TWiC_Cluster.prototype.shadeBlend(TWiC_Cluster.prototype.colorHighlight,
                                                      topicColors[this.topTopics[index][0]]),
        //"hicolor" : "white",
        // Lolight color
        "locolor" : TWiC_Cluster.prototype.shadeBlend(TWiC_Cluster.prototype.colorLolight,
                                                      topicColors[this.topTopics[index][0]]),
        //"locolor" : "black",
        // Topic ID
        "topicID" : this.topTopics[index][0],
        // Topic proportion
        "prop" : this.topTopics[index][1]
      };

		  this.cluster_group.append("circle")
                        .datum(data)
                        .attr("class","topic_circle")
                        .attr("id", function(d){ return "topic-" + d.topicID; })
                     	  .attr("cx", center[0])
                     	  .attr("cy", center[1])
                     	  .attr("r", currentRadius)
                     	  .style("fill", topicColors[this.topTopics[index][0]])
                        .on("mouseover", function(d){ TWiC_Cluster.prototype.HighlightTopicShapes(d, true); });
                        //.on("mouseout",  function(d){ TWiC_Cluster.prototype.HighlightTopicShapes(d, false); });

      currentRadius -= radiusReduction;
    }
}

// Static TWiC_Cluster members
TWiC_Cluster.prototype.scaleExtentLimits = [1, 16]
TWiC_Cluster.prototype.minOpacity = 0.1;
TWiC_Cluster.prototype.maxOpacity = 1;
TWiC_Cluster.prototype.opacityRatio = TWiC_Cluster.prototype.maxOpacity / TWiC_Cluster.prototype.scaleExtentLimits[1];
TWiC_Cluster.prototype.opacityChangeFactor = 1;
TWiC_Cluster.prototype.colorHighlight = 0.50;
TWiC_Cluster.prototype.colorLolight = -0.65;

TWiC_Cluster.prototype.clusterCount = 0;

TWiC_Cluster.prototype.ResetClusterColors = function(d){
    d3.selectAll(".topic_circle").style("fill", function(d){ return d.color; });
}

TWiC_Cluster.prototype.DarkenClusterColors = function(d){
    d3.selectAll(".topic_circle").style("fill", function(d){ return d.locolor; });
}

TWiC_Cluster.prototype.HighlightTopicShapes = function (data, highlight){

    d3.selectAll(".topic_circle")
      .filter(function(d){ return d.topicID == data.topicID; })
      .style("fill", data.color);
    d3.selectAll(".topic_circle")
      .filter(function(d){ return d.topicID != data.topicID; })
      .style("fill", function(d){ return d.locolor; });
}


// From http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
TWiC_Cluster.prototype.shadeBlend = function(p,c0,c1) {
    var n=p<0?p*-1:p,u=Math.round,w=parseInt;
    if(c0.length>7){
        var f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
        return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")"
    }else{
        var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
        return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
    }
}


// Active change
// Determine information for transition
// Opacity change
// Save current zoom level

// Zoom behavior when clicking on a TWiC_Cluster
TWiC_Cluster.prototype.ClickToZoom = function(twic_cluster){

  var cb = function(error, data) {

    if ( d3.event.defaultPrevented ){
        return;
    }

    // Clear active status
    twic_cluster.active.classed("active", false);

    // Get current svg origin and dimensions
    var svg = d3.select("svg");
    var parentOrigin = [svg.attr("x") * 1, svg.attr("y") * 1];
    var parentDims = [svg.attr("width") * 1, svg.attr("height") * 1];

    if ( twic_cluster.active.node() === twic_cluster.cluster_group.node() ){

        // Now nothing selected
        twic_cluster.active = d3.select(null);

        // Translate, scale, and opacity transition
        var translateDelta = [-1 * (parentOrigin[0] + (parentDims[0] >> 1) - twic_cluster.center[0]),
                              -1 * (parentOrigin[1] + (parentDims[1] >> 1) - twic_cluster.center[1])];
        //var translateDelta = [-1 * (parentOrigin[0] + (parentDims[0] >> 1) - twic_cluster.draggedCenter[0]),
        //                      -1 * (parentOrigin[1] + (parentDims[1] >> 1) - twic_cluster.draggedCenter[1])];


        twic_cluster.cluster_group.transition()
                                  .duration(1000)
                                  .attr("transform", "scale(1)translate(" + translateDelta + ")")
                                  .style("opacity", TWiC_Cluster.prototype.maxOpacity);

        // Save final zoom level after transition
        twic_cluster.SaveZoomScale(TWiC_Cluster.prototype.scaleExtentLimits[0]);
    }
    else {

        // Set this cluster as selected
        twic_cluster.active = twic_cluster.cluster_group.classed("active", true);

        // Calculate the largest diameter and new position of a circle zoomed to center/fit inside of a parent rectangle
        var circleZoomData = twic_cluster.FitCircleToParentRect(twic_cluster.center,
                                                                twic_cluster.radius,
                                                                parentOrigin,
                                                                parentDims);

        var transformString = "translate(" + circleZoomData[0][0] + "," +
            circleZoomData[0][1] + ")scale(" + circleZoomData[1] + ")";

        // Perform the zoom-in transformation
        twic_cluster.cluster_group.transition()
                                  .duration(1000)
                                  .attr("transform", transformString)
                                  .style("opacity", TWiC_Cluster.prototype.minOpacity);

        // Save final zoom level after transition
        twic_cluster.SaveZoomScale(TWiC_Cluster.prototype.scaleExtentLimits[1]);
    }
  }

  return cb;
}


// Returns translation coordinates and max allowable scale
TWiC_Cluster.prototype.FitCircleToParentRect = function (currentCenter, currentRadius, parentOrigin, parentDimensions){

    // What is the largest diameter for this circle?
    var smallestBound = ( parentDimensions[0] > parentDimensions[1] ) ? 1 : 0;
    var scaleToDiameter = Math.floor(parentDimensions[smallestBound] / (2 * currentRadius));

    // If the rectangle is smaller than the circle, then change nothing
    if ( 0 == scaleToDiameter ){
    	return [currentCenter, 1];
    }
    // Else, determine the amount to translate and scale the circle to zoom-center it inside the parent rectangle
    else {

        return [[(parentOrigin[0] + (parentDimensions[0] >> 1)) - (currentCenter[0] * scaleToDiameter),
                 (parentOrigin[1] + (parentDimensions[1] >> 1)) - (currentCenter[1] * scaleToDiameter)],
                scaleToDiameter];
    }
}


TWiC_Cluster.prototype.GetOpacityForZoom = function(givenZoom) {

    // Determine difference from previous zoom
    var zoomDelta = this.lastZoomScale - givenZoom;

    // Opacity calculations
    var currentOpacity = this.cluster_group.style("opacity") * 1;
    var nextOpacity = currentOpacity;

    // The opacity is inverse to zoom scale
    nextOpacity = currentOpacity + (zoomDelta * TWiC_Cluster.prototype.opacityRatio * TWiC_Cluster.prototype.opacityChangeFactor);
    if ( nextOpacity < TWiC_Cluster.prototype.minOpacity )
        nextOpacity = TWiC_Cluster.prototype.minOpacity;
    else if ( nextOpacity > TWiC_Cluster.prototype.maxOpacity )
        nextOpacity = TWiC_Cluster.prototype.maxOpacity;

    return nextOpacity;
}

// Save previous scale factor
TWiC_Cluster.prototype.SaveZoomScale = function(givenZoom){

    this.lastZoomScale = givenZoom;
}


TWiC_Cluster.prototype.ScrollToZoom = function(twic_cluster){

  var cb = function(error, data){

    // Scale the svg container
    twic_cluster.cluster_group.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");

    // Zoom between levels of TWiC is stratified across the scale extent limits
    twic_cluster.SetOpacityForZoom(d3.event.scale);

    // Save previous scale factor
    twic_cluster.SaveZoomScale(d3.event.scale);
  }

  return cb;
}


// Determines opacity based on current zoom
TWiC_Cluster.prototype.SetOpacityForZoom = function(givenZoom) {

    this.cluster_group.style("opacity", this.GetOpacityForZoom(givenZoom));
}


TWiC_Cluster.prototype.dragstarted = function(twic_cluster) {

    var cb = function(error, data){

        d3.event.sourceEvent.stopPropagation();
        twic_cluster.cluster_group.classed("dragging", true);
    }
    return cb;
}


TWiC_Cluster.prototype.dragged = function(twic_cluster) {

  var cb = function(error, data){

      twic_cluster.draggedCenter[0] = d3.event.x;
      twic_cluster.draggedCenter[1] = d3.event.y;
      twic_cluster.cluster_group.attr("x", d3.event.x)
                                .attr("y", d3.event.y);
  }
  return cb;
}

TWiC_Cluster.prototype.dragended = function(twic_cluster) {

  var cb = function(error, data){

      twic_cluster.cluster_group.classed("dragging", false);
  }
  return cb;
}