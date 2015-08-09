(function(){
  
    var twicLevel = TWiC.Level.prototype.Instance();
    twicLevel.LoadJSON("data/input/json/twic_corpusinfo.json",
                       "data/input/json/twic_corpusmap.json");

    // Once JSON has loaded, create and start the level
    twicLevel.m_queue.await(function(){

        var screenDims = TWiC.GetAvailableScreenSpace();


        var publicationView = new TWiC.PublicationView({x: 0, y: 0}, // Panel position
                                             {width: screenDims.width, height: screenDims.height - (2 * TWiC.TopicBar.prototype.s_minHeight)}, // Panel size
                                             twicLevel, // Level reference,
                                             "publication view",
                                             "twic_fascicle21.json");
        var topicBar = new TWiC.TopicBar({x: 0, y: screenDims.height - (2 * TWiC.TopicBar.prototype.s_minHeight)}, // Panel position
                                         {width: screenDims.width, height: (2 * TWiC.TopicBar.prototype.s_minHeight)}, // Panel size
                                         twicLevel); // Level reference

        publicationView.AddLinkedView(topicBar, TWiC.Interaction.mouseover);
        topicBar.AddLinkedView(publicationView, TWiC.Interaction.click);                                        

        // Initialize the level
        twicLevel.Initialize({x: 0, y: 0}, // Position
                             TWiC.GetAvailableScreenSpace(),
                             d3.select("body")); // Size

        // Startup the level
        twicLevel.Start();

    }.bind(twicLevel));

})();
