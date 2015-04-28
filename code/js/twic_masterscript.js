/*

TWiC_MasterScript - Loads all JSON files, displays GraphView, InformationView, TopicBar

TWiC_GraphView - Shows corpus cluster, document clusters, documents
TWiC_InformationView - Shows information about corpus cluster, document clusters, documents
TWiC_TopicBar - Shows the topic words of the current topic being highlighted

TWiC_Cluster (bullseye abstraction, contains TWiC_Rectangles)
TWiC_Rectangle (rectangle abstraction, contains TWiC_Documents)
TWiC_Document (topic words in context view, contains text/topic information)

*/

// TWiC_MasterScript


// Construct the queue for ordering the script functionality
var q = queue();

// Load topic colors JSON
var topicColors = { };
q.defer(function(callback) {
    d3.json("data/input/json/topic_colors.json", function(error, data) {
        topicColors = data.topics;
        TWIC.TWiC_Object.prototype.s_topicColors = data.topics;
        callback(null, topicColors);
    });
});

// Load the corpus info JSON
/*var corpusInfo = null;
q.defer(function(callback) {
    d3.json(".data/input/json/twic_corpusinfo.json", function(error, data) {
    	corpusInfo = data;
    	TWiC_Level.prototype.s_corpusInfo = corpusInfo;
    	callback(null, corpusInfo);
    });
});*/

// Load the corpus distance map JSON
var corpusMap = null;
q.defer(function(callback) {
	d3.json("data/input/json/twic_corpusmap.json", function(error, data) {
		corpusMap = data;
		TWIC.TWiC_Level.prototype.s_corpusMap = corpusMap;
		callback(null, corpusMap);
	});
});

// Load topics JSON
var topics = { };
q.defer(function(callback) {
    d3.json("data/input/json/topics.json", function(error, data) {
        topics = data;
        callback(null, topics);
    });
});

// Load titles to file ID map JSON
var titles = { };
q.defer(function(callback) {
	d3.json("data/input/json/titles.json", function(error, data) {
		titles = data;
		callback(null, titles);
	});
});

// Create the TWiC graph and topic bar
q.await(function(){

    var ci_key = "corpus_info";
    var ti_key = "topic_info";
	var fi_key = "file_info";

    /*
        # Indexers Info (will be replicated on JS side)

        # "topic_info" (indexed by int topic ID)
        topic_info = "topic_info"
        TI_Words = 0
        TI_Colors = 1

        # "corpus_info"
        corpus_info = "corpus_info"
        CI_CorpusTitle = 0
        CI_TopicProportions = 1

        # "file_info" (indexed by str numeric file ID)
        file_info = "file_info"
        FI_TextTitle = 0
        FI_TopicProportions = 1
        FI_StanzaCount = 2
        FI_LineCount = 3
        FI_WordCount = 4
        # Fascicle IDs here (?)
        FI_FieldCount = 5
    */

	// Build topics, topic colors, and titles sub maps from corpus info map
	/*for ( text_title in corpusInfo[fi_key] ) {
        titles[text_title] = corpusInfo[text_title]
	}*/

	// Create the SVG parent tag
	var level_location = [190,0];
	var dimensions = [900,600];
	var svg = d3.select("body").append("div")
	                           .attr("id", "graph_dcv_container")
	                           .style("width","1280px")
	                           .append("div")
	                           .attr("id","twic_graph_div")
							   .style("border-radius","15px")
							   .style("margin-left","auto")
							   .style("margin-right","auto")
							   .style("width",dimensions[0])
							   .style("max-width","100%")
							   .style("overflow","hidden")
							   .style("float","left")
							   .attr("width",dimensions[0])
							   .attr("height",dimensions[1])
							   //.style("display","inline-block")
	                           .append("svg")
	                           .attr("id","twic_graph_svg")
							   .attr("x",level_location[0])
							   .attr("y",level_location[1])
							   .attr("width",dimensions[0])
							   .attr("height",dimensions[1]);
	                           //.append("g")
	                           //.attr("id","twic_graph_group")
	                           //.attr("class","overlay");


	// Create the TWiC topic bar
	var topicBar = new TWIC.TWiC_TopicBar([0,620], topics, topicColors);

	// Create the Document Cluster viewbox
	var dcv = new TWIC.TWiC_InformationView([904,0], titles, topics, topicColors);

	/*var pos = getElementAbsolutePos(dcv);
    window.alert("Element's left: " + pos.x + " and top: " + pos.y);*/


	/*
	// Corpus test

	// Create and load the level
    var levelName = "CorpusTestLevel";
	var twic_level = new TWiC_Level(svg, level_location, dimensions, levelName);
	twic_level.LoadLevel();
	var levelGroup = d3.select(".twic_level_group#twic_level_" + levelName);

	// Create the test cluster
	var cluster_location = [level_location[0] + (dimensions[0] >> 1),
							level_location[1] + (dimensions[1] >> 1)];
	//var cluster_location = [0,0];
	var twic_cluster = new TWiC_Cluster(levelGroup, cluster_location, 100, 5, topicColors, topics);
	var twic_cluster_json = {
		"name":"Test Cluster",
		"ideal_text":"1880",
		"distance2ideal":"1.0",
		"topics":{
			"1":[1,0.5],
			"2":[2,0.5],
			"3":[3,0.5],
			"4":[4,0.5],
			"5":[5,0.5],
		},
		"children":[]
	};
	var twic_objects = [twic_cluster];

	// Add the cluster to the level and load the level's graph
	twic_level.AddObjects(twic_objects, twic_cluster_json);
	twic_level.LoadGraph();
	twic_level.Start();
	*/

	/*
	// Actual corpus test

	// Create and load the level
    var levelName = corpusMap["name"];
	var twic_level = new TWiC_Level(svg, level_location, dimensions, levelName);
	twic_level.LoadLevel();
	var levelGroup = d3.select(".twic_level_group#twic_level_" + levelName);

	// Create the test cluster
	//var cluster_location = [level_location[0] + (dimensions[0] >> 1),
	//						level_location[1] + (dimensions[1] >> 1)];
    var cluster_location = [0,0];
	var twic_cluster = new TWiC_Cluster(levelGroup, cluster_location, 100, 10, topicColors,
									    corpusMap["topics"], corpusMap["ideal_text"]);
	var twic_cluster_json = {
		"name":corpusMap["name"],
		"ideal_text":corpusMap["ideal_text"],
		"distance2ideal":corpusMap["distance2ideal"],
		"topics":corpusMap["topics"],
		"children":[]
	};
	var twic_objects = [twic_cluster];

	// Add the cluster to the level and load the level's graph
	twic_level.AddObjects(twic_objects, twic_cluster_json);
	twic_level.LoadGraph();
	twic_level.Start();
	*/

	// Actual cluster test

	// Create and load the level
    var levelName = "CorpusClusters";
	var twic_level = new TWIC.TWiC_Level(svg, level_location, dimensions, levelName,
									corpusMap["ideal_text"]);
	twic_level.LoadLevel();
	var levelGroup = d3.select("#twic_level_" + levelName);

	// Create the clusters
	var twic_objects = [];
	var twic_cluster_json_list = [];

	// Distance to ideal normalization via corpus map JSON data
	var avg = 0.0;
	for ( var index = 0; index < corpusMap["children"].length; index++ )
		avg += corpusMap["children"][index]["distance2ideal"];
	avg /= corpusMap["children"].length;

	// Build all clusters
	var linkDilation = 80;
	//for ( var index = 0; index < corpusMap["children"].length; index ++ ){
	for ( var index = 0; index < 100; index ++ ){
        var cluster_location = [0,0];
        //console.log(corpusMap["children"][index]["topics"]);
		var twic_cluster = new TWIC.TWiC_Cluster(levelGroup, cluster_location, 20, 10, topicColors,
										    corpusMap["children"][index]["topics"],
										    corpusMap["children"][index]["ideal_text"], index);
		twic_cluster_json_list.push({
			"name":corpusMap["children"][index]["name"],
			"ideal_text":corpusMap["children"][index]["ideal_text"],
			//"distance2ideal":corpusMap["children"][index]["distance2ideal"],
			"distance2ideal":2 + Math.abs((corpusMap["children"][index]["distance2ideal"] - avg) * linkDilation),
			"topics":corpusMap["children"][index]["topics"],
			"children":[]
		});
		twic_objects.push(twic_cluster);
	}


	// Add the cluster to the level and load the level's graph
	twic_level.AddObjects(twic_objects, twic_cluster_json_list);

	twic_level.LoadGraph();

	twic_level.Start();
});
