(function(){

    var twicLevel = TWiC.Level.prototype.Instance();
    twicLevel.LoadJSON("data/input/json/twic_corpusinfo.json",
                       "data/input/json/twic_corpusmap.json");

    // Once JSON has loaded, create and start the level
    twicLevel.m_queue.await(function(){

        // Create TWiC panels and link them together (panels add themselves to their given level)
        var topicBar0 = new TWiC.TopicBar({x: 0, y: 685}, // Position
                                         {width: 1275, height: 165}, // Size
                                         twicLevel); // Level

        var corpusView = new TWiC.CorpusView({x: 0, y: 0}, // Position
                                             {width: 1275, height: 635}, // Size
                                             twicLevel); // Level
        corpusView.AddLinkedView(topicBar0, "mouseover");


        var topicBar1 = new TWiC.TopicBar({x: 1276, y: 685}, // Position
                                         {width: 1275, height: 165}, // Size
                                         twicLevel); // Level

        var corpusClusterView = new TWiC.CorpusClusterView({x: 1276, y: 0}, // Position
                                                           {width: 1275, height: 635}, // Size
                                                           twicLevel); // Level
        corpusClusterView.AddLinkedView(topicBar1, "mouseover");
        corpusView.AddLinkedView(corpusClusterView, "mouseover");

        // Link the corpus cluster view to the topic bar as well
        topicBar1.AddLinkedView(corpusClusterView, "click");


        var topicBar2 = new TWiC.TopicBar({x: 2552, y: 685}, // Position
                                         {width: 1275, height: 165}, // Size
                                         twicLevel); // Level

        var textClusterView = new TWiC.TextClusterView({x: 2552, y: 0}, // Position
                                                       {width: 1275, height: 635}, // Size
                                                       twicLevel, // Level
                                                       0); // Cluster index
        textClusterView.AddLinkedView(topicBar2, "mouseover")
        corpusClusterView.AddLinkedView(textClusterView, "click");


        var topicBar3 = new TWiC.TopicBar({x: 3828, y: 685}, // Position
                                         {width: 1275, height: 165}, // Size
                                         twicLevel); // Level

        var textView = new TWiC.TextView({x: 3828, y: 0}, // Position
                                         {width: 1275, height: 635}, // Size
                                         twicLevel, // Level
                                         "665"); // Individual text name
        textView.AddLinkedView(topicBar3, "mouseover")
        textClusterView.AddLinkedView(textView, "click");


        // Initialize the level
        twicLevel.Initialize({x: 0, y: 0}, // Position
                             {width:5104,height:850},
                             d3.select("body")); // Size

        // Startup the level
        twicLevel.Start();
    }.bind(twicLevel));
})();
