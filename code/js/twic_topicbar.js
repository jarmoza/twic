/*

TWiC_MasterScript - Loads all JSON files, displays GraphView, InformationView, TopicBar

TWiC_GraphView - Shows corpus cluster, document clusters, documents
TWiC_InformationView - Shows information about corpus cluster, document clusters, documents
TWiC_TopicBar - Shows the topic words of the current topic being highlighted

TWiC_Cluster (bullseye abstraction, contains TWiC_Rectangles)
TWiC_Rectangle (rectangle abstraction, contains TWiC_Documents)
TWiC_Document (topic words in context view, contains text/topic information)

*/

// TWiC_TopicBar

function TWiC_TopicBar(p_coordinates, topics, topicColors) {

	this.m_coordinates = p_coordinates;

	// Topic bar div
	var divWidth = 1280, divHeight = 300;
	var topicBarDiv = d3.select("body")
						.style("margin","0")
						.append("div")
						.attr("id", "twic_topicbar_div")
						.attr("width",divWidth)
						.attr("height",divHeight)						
						.style("border-radius", "15px")
						.style("background-color", "#002240")
						.style("overflow","auto");
						

	// Topic bar svg viewport
	var svgWidth = 1500, svgHeight = 300;
	//var svgWidth = 1280, svgHeight = 300;
	var topicBarSvg = topicBarDiv.append("svg")
								 .attr("x","0")
								 .attr("y","0")											 
								 .attr("width", svgWidth)
								 .attr("height", svgHeight)
								 .attr("viewBox","0 0 " + svgWidth + " " + svgHeight)
								 .attr("id","twic_topicbar_svg")
								 .style("background-color","#002240")
								 .style("overflow-x","scroll")
								 .style("overflow-y","scroll");

	// Topic bar topic group											 
	var topicBarGroup = topicBarSvg.append("g")
								   .attr("id","topicbar_group")
								   .style("overflow-x","scroll")
								   .style("overflow-y","scroll");;

    // Create topic array for svg text printing
    var topicStrArray = [];
    var topicStr;
    for ( var topicID in topics ){
    	topicStr = "Topic " + topicID + ": ";
    	for ( var index = 0; index < topics[topicID].length; index++ ){
    		topicStr += topics[topicID][index] + " ";
    	}
    	topicStrArray.push(topicStr.trim());
    }

    // Print svg text/tspans for each topic using the 'textFlow' library
    var yStart = -1325;
    var yIncrement = 30;
    var fontSize = 20;
    var rectGrowth = 0;
    for ( var index = 0, yPosition = yStart; index < topicStrArray.length; index++ ){

    	// Append opaque rectangle that will be used as highlight for each topic word list
        var highlightRect = topicBarGroup.append("rect")
        							   .attr("class", "topic_highlightrect")
        							   .attr("id", "topic_" + index)
        							   .attr("fill", topicColors[index.toString()]);

        // Add the topic text element
		var topicText = topicBarGroup.append("text")
							   .datum({"id":index.toString()})
							   .attr("x", "0")
							   .attr("y", yPosition)
							   .attr("fill", topicColors[index.toString()])
							   .attr("font-family", "Archer")
							   .attr("font-size", fontSize)
							   .attr("dy", "0")
							   .attr("dx", "0")
							   .attr("id", "topic_" + index)
							   .attr("class", "topic_wordlist");


        var dy = textFlow(topicStrArray[index], topicText[0][0], svgWidth, 20, 30, false);

        // More attributes added after svg text is added to the DOM 
        // (done this way for drawing order/later highlighting)
        highlightRect.attr("x", topicText.attr("x"))
        		     .attr("y", parseInt(topicText.attr("y")) - fontSize)
        			 .attr("width", svgWidth)
        			 .attr("height", dy)
        			 .attr("opacity", 0);
        yPosition += dy;
        rectGrowth += dy;

    }	

    // Alter the height of the svg and rect to match the printed topics
    topicBarSvg.attr("height", rectGrowth);
    svgHeight = rectGrowth;
    d3.select("body").attr("height", 920);

}
