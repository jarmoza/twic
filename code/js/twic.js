(function(){

    var twicLevel = TWiC.Level.prototype.Instance();
    twicLevel.LoadJSON(TWiC.Level.prototype.s_jsonDirectory + "twic_corpusinfo.json",
                       TWiC.Level.prototype.s_jsonDirectory + "twic_corpusmap.json",
                       TWiC.Level.prototype.s_jsonDirectory + "twic_corpus_wordweights.json");

    // Once JSON has loaded, create and start the level
    twicLevel.m_queue.await(function(){

        // Create TWiC panels and link them together (panels add themselves to their given level)
        var screenDims = TWiC.GetAvailableScreenSpace();
        var topicBarDims = { width: screenDims.width, height: (2 * TWiC.TopicBar.prototype.s_minHeight) };

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

        // View links

        // All views are linked to the topic bar
        corpusView.AddLinkedView(topicBar, TWiC.Interaction.mouseover);
        corpusView.AddLinkedView(dataBar, TWiC.Interaction.mouseover);

        // Topic bar
        topicBar.AddLinkedView(corpusView, TWiC.Interaction.click);
        topicBar.AddLinkedView(dataBar, TWiC.Interaction.click);

        // Data bar
        dataBar.AddLinkedView(corpusView, TWiC.Interaction.click);
        dataBar.AddLinkedView(corpusView, TWiC.Interaction.mouseover);
        dataBar.AddLinkedView(topicBar, TWiC.Interaction.mouseover);

        // Initialize the level
        twicLevel.Initialize({ x: 0, y: 0 }, // Position
                             TWiC.GetAvailableScreenSpace(), // Size
                             d3.select("body")); // Parent tag

        // Startup the level
        twicLevel.Start();

    }.bind(twicLevel));

})();
