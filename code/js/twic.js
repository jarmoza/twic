(function(){

    var twicLevel = TWiC.Level.prototype.Instance();
    twicLevel.LoadJSON("data/input/json/twic_corpusinfo.json",
                       "data/input/json/twic_corpusmap.json");

    // Once JSON has loaded, create and start the level
    twicLevel.m_queue.await(function(){

        // Create components
        var graphViews = [];
        var infoViews = [];
        var divName = "dickinson"; // NOTE: This needs to be added to twic_corpusinfo.json from serverside

        // Topic bar setup
        var topicBar1 = new TWiC.TopicBar({x:0, y:635}, // Position
                                         {width:1055, height:165}, // Size
                                         divName + "1", // Name
                                         twicLevel, []); // Level and linked view(s)
        infoViews.push(topicBar1);

        // Document info bar setup
        /*var docBar = new TWiC.DocumentBar({"x":1055, "y":0}, // Position
                                          {"width":225, "height":635}, // Size
                                          divName,  // Name
                                          twicLevel, []); // Level and linked view(s)
        infoViews.push(docBar);*/

        // Graph setup
        var corpusClusterView = new TWiC.CorpusClusterView({ "x":0, "y":0 }, // Position
                                                           { "width":1055, "height":635}, // Size
                                                           divName, // Name
                                                           twicLevel, [{panel:topicBar1, update:"mouseover"}]); // Level and linked view(s)
        graphViews.push(corpusClusterView);

        // Link the corpus cluster view to the topic bar as well
        topicBar1.m_linkedViews.push({panel:corpusClusterView, update:"click"});


        var topicBar2 = new TWiC.TopicBar({x:1056, y:635}, // Position
                                         {width:1055, height:165}, // Size
                                         divName + "2", // Name
                                         twicLevel, []); // Level and linked view(s)
        infoViews.push(topicBar2);


        var textClusterView = new TWiC.TextClusterView({ "x":1056, "y":0 }, // Position
                                                       { "width":1055, "height":635}, // Size
                                                       divName, // Name
                                                       twicLevel, [{panel:topicBar2, update:"mouseover"}], // Level and linked view(s)
                                                       0); // Cluster index
        //corpusClusterView.m_linkedViews.push(textClusterView);
        graphViews.push(textClusterView);

        corpusClusterView.m_linkedViews.push({panel:textClusterView, update:"click"});


        var topicBar3 = new TWiC.TopicBar({x:2112, y:635}, // Position
                                         {width:1055, height:165}, // Size
                                         divName + "3", // Name
                                         twicLevel, []); // Level and linked view(s)
        infoViews.push(topicBar3);


        var textView = new TWiC.TextView({x:2112, y:0}, // Position
                                         {width:1055, height:635}, // Size
                                         divName, // Name
                                         twicLevel, [{panel:topicBar3, update:"mouseover"}], // Level and linked views
                                         "665"); // Individual text name
        graphViews.push(textView);

        textClusterView.m_linkedViews.push({panel:textView, update:"click"});


        // Initialize the level
        twicLevel.Initialize([0,0], // Position
                             //TWiC.GetViewport(), // Size
                             {width:3400,height:800},
                             divName, // Name
                             graphViews, infoViews); // TWiC graph and information panels

        // jQuery section
        /*$("#div_twic_graph_corpusclusterview_" + divName).resizable();
        $("#div_twic_info_topicbar_" + divName).resizable();
        $("#div_twic_info_docbar_" + divName).resizable();
        $("#div_twic_graph_corpusclusterview_" + divName).draggable();
        $("#div_twic_info_topicbar_" + divName).draggable();
        $("#div_twic_info_docbar_" + divName).draggable();*/

        // Startup the level
        twicLevel.Start();
    }.bind(twicLevel));
})();
