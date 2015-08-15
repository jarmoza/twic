(function(){
  
    var twicLevel = TWiC.Level.prototype.Instance();
    twicLevel.LoadJSON("data/input/json/twic_corpusinfo.json",
                       "data/input/json/twic_corpusmap.json");

    // Once JSON has loaded, create and start the level
    twicLevel.m_queue.await(function(){

        // Create TWiC panels and link them together (panels add themselves to their given level)
        /*var topicBar = new TWiC.TopicBar({x: 2551 >> 2, y: 685}, // Panel position
                                         {width: 2551 >> 1, height: 200}, // Panel size
                                         twicLevel); // Level reference*/

        var screenDims = TWiC.GetAvailableScreenSpace();
        var topicBarDims = { width: screenDims.width, height: (2 * TWiC.TopicBar.prototype.s_minHeight) };

        /*var corpusView = new TWiC.CorpusView({x: 0, y: 0}, // Panel position
                                             {width: 1275, height: 635}, // Panel size
                                             twicLevel, // Level reference 
                                             225, // Bullseye radius
                                             10); // Number of topics to display*/

        var corpusView = new TWiC.CorpusView({ x: 0, y: 0 }, // Panel position
                                             { width: (screenDims.width >> 1) + (screenDims.width >> 2),
                                               height: screenDims.height - topicBarDims.height }, // Panel size
                                             twicLevel, // Reference to Level instance 
                                             (screenDims.height - topicBarDims.height) / 3.0, // Bullseye radius
                                             10); // Number of topics to display

        var topicBar = new TWiC.TopicBar({ x: 0, y: screenDims.height - topicBarDims.height }, // Panel position
                                         { width: topicBarDims.width, height: topicBarDims.height }, // Panel size
                                         twicLevel); // Reference to Level instance

        var dataBar = new TWiC.DataBar({ x: corpusView.m_size.width, y: 0 }, // Panel position
                                           { width: screenDims.width >> 2, height: screenDims.height - topicBarDims.height }, // Panel size
                                           twicLevel); // Reference to Level instance        


        /*var corpusClusterView = new TWiC.CorpusClusterView({x: 1276, y: 0}, // Position
                                                           {width: 1275, height: 635}, // Size
                                                           twicLevel); // Level

        var textClusterView = new TWiC.TextClusterView({x: 0, y: 886}, // Position
                                                       {width: 1275, height: 635}, // Size
                                                       twicLevel, // Level
                                                       0); // Cluster index

        var textView = new TWiC.TextView({x: 1276, y: 886}, // Position
                                         {width: 1275, height: 635}, // Size
                                         twicLevel, // Level
                                         "665"); // Individual text name*/

        // View links

        // All views are linked to the topic bar
        corpusView.AddLinkedView(topicBar, TWiC.Interaction.mouseover);
        corpusView.AddLinkedView(dataBar, TWiC.Interaction.mouseover);
        //corpusView.AddLinkedView(dataBar, TWiC.Interaction.click);
        //corpusClusterView.AddLinkedView(topicBar, TWiC.Interaction.mouseover);
        //textClusterView.AddLinkedView(topicBar, TWiC.Interaction.mouseover);
        //textView.AddLinkedView(topicBar, TWiC.Interaction.mouseover);

        // Corpus view
        //corpusView.AddLinkedView(corpusClusterView, TWiC.Interaction.mouseover);
        //corpusView.AddLinkedView(textClusterView, TWiC.Interaction.mouseover);
        //corpusView.AddLinkedView(textView, TWiC.Interaction.mouseover);

        // Corpus cluster view
        /*corpusClusterView.AddLinkedView(corpusView, TWiC.Interaction.mouseover);
        corpusClusterView.AddLinkedView(textClusterView, TWiC.Interaction.mouseover)
        corpusClusterView.AddLinkedView(textClusterView, TWiC.Interaction.dblclick);

        // Text cluster view
        textClusterView.AddLinkedView(corpusView, TWiC.Interaction.mouseover);
        textClusterView.AddLinkedView(corpusClusterView, TWiC.Interaction.mouseover);
        textClusterView.AddLinkedView(textView, TWiC.Interaction.dblclick);
        textClusterView.AddLinkedView(textView, TWiC.Interaction.mouseover);

        // Text view
        textView.AddLinkedView(corpusView, TWiC.Interaction.mouseover);
        textView.AddLinkedView(corpusClusterView, TWiC.Interaction.mouseover);
        textView.AddLinkedView(textClusterView, TWiC.Interaction.mouseover);*/

        // Publication view
        /*var publicationView = new TWiC.PublicationView({x:0,y:0},
                                                       {width:1275,height:635},
                                                       twicLevel,
                                                       "Publication Name",
                                                       "publication.json");*/

        // Topic bar
        topicBar.AddLinkedView(corpusView, TWiC.Interaction.click);
        topicBar.AddLinkedView(dataBar, TWiC.Interaction.click);

        // Document bar
        dataBar.AddLinkedView(corpusView, TWiC.Interaction.click);
        dataBar.AddLinkedView(corpusView, TWiC.Interaction.mouseover);
        dataBar.AddLinkedView(topicBar, TWiC.Interaction.mouseover);

        // Initialize the level
        twicLevel.Initialize({x: 0, y: 0}, // Position
                             //{width:2551,height:1571},
                             TWiC.GetAvailableScreenSpace(),
                             d3.select("body")); // Size

        // Startup the level
        twicLevel.Start();

    }.bind(twicLevel));

})();
