(function(){

    var twicLevel = TWiC.Level.prototype.Instance();
    twicLevel.LoadJSON(TWiC.Level.prototype.s_jsonDirectory + "twic_corpusinfo.json",
                       TWiC.Level.prototype.s_jsonDirectory + "twic_corpusmap.json",
                       TWiC.Level.prototype.s_jsonDirectory + "twic_corpus_wordweights.json");

    // Once JSON has loaded, create and start the level
    twicLevel.m_queue.await(function(){

        // Dimensions
        var screenDims = TWiC.GetAvailableScreenSpace();
        var topicBarHeight = 2 * TWiC.TopicBar.prototype.s_minHeight;

        // Panels
        var publicationView = new TWiC.PublicationView({x: 0, y: 0}, // Panel position
                                             {width: screenDims.width >> 1, height: screenDims.height - topicBarHeight}, // Panel size
                                             twicLevel, // Level reference,
                                             "publication view",
                                             "twic_fascicle21.json");
        var textView = new TWiC.TextView({x: screenDims.width >> 1, y: 0}, // Panel position
                                         {width: screenDims.width >> 2, height: screenDims.height - topicBarHeight}, // Panel size
                                         twicLevel); // Level reference
        var topicBar = new TWiC.TopicBar({x: 0, y: screenDims.height - topicBarHeight}, // Panel position
                                         {width: screenDims.width, height: topicBarHeight}, // Panel size
                                         twicLevel); // Level reference

        var dataBar = new TWiC.DataBar({x: (screenDims.width >> 1) + (screenDims.width >> 2), y: 0}, // Panel position
                                       {width: screenDims.width >> 2, height: screenDims.height - topicBarHeight}, // Panel size
                                       twicLevel); // Level reference

        // Mouse behaviors

        // Publication view
        publicationView.AddLinkedView(topicBar, TWiC.Interaction.mouseover);
        publicationView.AddLinkedView(dataBar, TWiC.Interaction.mouseover);
        publicationView.AddLinkedView(textView, TWiC.Interaction.mouseover);
        publicationView.AddLinkedView(topicBar, TWiC.Interaction.click);
        publicationView.AddLinkedView(dataBar, TWiC.Interaction.click);
        publicationView.AddLinkedView(textView, TWiC.Interaction.click);
        publicationView.AddLinkedView(textView, TWiC.Interaction.dblclick);

        // Text view
        textView.AddLinkedView(topicBar, TWiC.Interaction.mouseover);
        textView.AddLinkedView(dataBar, TWiC.Interaction.mouseover);
        textView.AddLinkedView(publicationView, TWiC.Interaction.mouseover);
        textView.AddLinkedView(topicBar, TWiC.Interaction.click);
        textView.AddLinkedView(dataBar, TWiC.Interaction.click);
        textView.AddLinkedView(publicationView, TWiC.Interaction.click);

        // Topic bar
        topicBar.AddLinkedView(publicationView, TWiC.Interaction.mouseover);
        topicBar.AddLinkedView(textView, TWiC.Interaction.mouseover);
        topicBar.AddLinkedView(dataBar, TWiC.Interaction.mouseover);
        topicBar.AddLinkedView(publicationView, TWiC.Interaction.click);
        topicBar.AddLinkedView(textView, TWiC.Interaction.click);

        // Data bar
        dataBar.AddLinkedView(publicationView, TWiC.Interaction.mouseover);
        dataBar.AddLinkedView(textView, TWiC.Interaction.mouseover);
        dataBar.AddLinkedView(topicBar, TWiC.Interaction.mouseover);
        dataBar.AddLinkedView(publicationView, TWiC.Interaction.click);
        dataBar.AddLinkedView(textView, TWiC.Interaction.click);
        dataBar.AddLinkedView(topicBar, TWiC.Interaction.click);

        // Initialize the level
        twicLevel.Initialize({x: 0, y: 0}, // Position
                             TWiC.GetAvailableScreenSpace(),
                             d3.select("body")); // Size

        // Startup the level
        twicLevel.Start();

    }.bind(twicLevel));

})();
