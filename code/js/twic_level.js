var TWiC = (function(namespace){

    namespace.s_domPrefix = "twic_";
    namespace.s_lastUsedID = -1;

    namespace.Interaction = {

        mouseover: "mouseover",
        mouseout: "mouseout",
        click: "click",
        dblclick: "dblclick"
    };

    // From http://haacked.com/archive/2009/12/29/convert-rgb-to-hex.aspx/
    namespace.ColorToHex = function(p_color) {

        if ( p_color.substr(0, 1) === '#' ) {
            return p_color;
        }
        var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(p_color);

        var red = parseInt(digits[2]);
        var green = parseInt(digits[3]);
        var blue = parseInt(digits[4]);

        var rgb = blue | (green << 8) | (red << 16);
        return digits[1] + '#' + rgb.toString(16);
    };

    namespace.GetAvailableScreenSpace = function(){

        //return { width: screen.availWidth, height: screen.availHeight };
        return { width: window.innerWidth, height: window.innerHeight };
    };

    namespace.GetUniqueID = function(){

        namespace.s_lastUsedID++;
        return namespace.s_domPrefix + namespace.s_lastUsedID.toString();
    };

    namespace.GetViewport = function(){

        var e = window, a = 'inner';

        if ( !('innerWidth' in window) ){

            a = 'client';
            e = document.documentElement || document.body;
        }

        return {width: e[a+'Width'] , height: e[a+'Height']}
    }

    // From http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
    namespace.ShadeBlend = function(p, c0, c1) {

        var n=p<0?p*-1:p,u=Math.round,w=parseInt;

        if ( null == c0.length ){
          var x = 0;
        }

        if ( c0.length > 7 ) {
            var f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
            return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")"
        }
        else {
            var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
            return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
        }
    };

    namespace.Container = function(p_coordinates, p_controlBar, p_panel){

        this.m_coordinates = {x: p_coordinates.x, y: p_coordinates.y};
        this.m_controlBar = p_controlBar;
        this.m_panel = p_panel;
        this.m_level = this.m_panel.m_level;
        this.m_name = namespace.GetUniqueID();
    };

    namespace.Container.method("Initialize", function(p_parentDiv){

        // Calculate the container size based on the panel/control bar dimensions and orientation
        if ( null != this.m_controlBar ){

            // Set the control bar dimensions based on its accompanying panel before proceeding
            this.m_controlBar.DetermineDimensions();

            switch ( this.m_controlBar.m_orientation ){

                case "top":
                case "bottom":
                    this.m_size = {width: this.m_panel.m_size.width,
                                  height: this.m_panel.m_size.height + this.m_controlBar.m_size.height};
                    break;
                case "left":
                case "right":
                    this.m_size = {width: this.m_panel.m_size.width + this.m_controlBar.m_size.width,
                                   height: this.m_panel.m_size.height};
                    break;
            }
        } else {
            this.m_size = {width: this.m_panel.m_size.width, height: this.m_panel.m_size.height};
        }

        // Add the container's div
        this.m_div = p_parentDiv.append("div")
                                //.attr("class", "div_twic_container ui-widget-content item")
                                .attr("class", "div_twic_container item")
                                .attr("id", "div_twic_container_" + this.m_name)
                                .style("position", "absolute")
                                .style("left", this.m_coordinates.x)
                                .style("top", this.m_coordinates.y)
                                .style("width", this.m_size.width)
                                .style("height", this.m_size.height)
                                .style("max-width", this.m_level.m_size.width)
                                .style("max-height", this.m_level.m_size.height)
                                .style("overflow", "auto")
                                .on("mouseup", function(){
                                    if ( this.m_level.m_resizeOccurred ){
                                        this.m_level.m_resizeOccurred = false;
                                        this.m_level.OrganizePanels();
                                    }
                                }.bind(this));

        // Initialize the panel and control bar
        if ( null != this.m_controlBar ) {
            this.m_controlBar.Initialize(this.m_div);
        }
        this.m_panel.Initialize(this.m_div);
    });

    namespace.Container.method("Update", function(p_data, p_updateType){

        // Update the panel and control bar
        this.m_panel.Update(p_data, p_updateType);
        if ( null != this.m_controlBar ) {
            this.m_controlBar.Update(p_data, p_updateType);
        }
    });

    namespace.Container.method("Start", function(){

        // Start the panel
        this.m_panel.Start();
    });

    namespace.Container.method("DeterminePosition", function(){

        if ( this.m_controlBar ){
            switch ( this.m_controlBar.m_orientation ){
                case "top":
                case "bottom":
                    this.m_coordinates.y -= this.m_controlBar.m_size.width;
                    break;
                case "left":
                    this.m_coordinates.x -= this.m_controlBar.m_size.width;
                    break;
                // If the orientation is "right" then the container size will be adjusted in Initialize()
                // to accomodate the added size of the control bar
            }
        }
    });

    namespace.Container.method("SetPosition", function(p_coordinates){

        // Changes the stored coordinates of the container
        // (no need to alter the coordinates of its components as they are relatively positioned)
        this.m_coordinates.x = p_coordinates.x;
        this.m_coordinates.y = p_coordinates.y;
    });

    namespace.Container.method("SetSize", function(p_size){

        // Panel dimensions do not include optional control bar
        if ( this.m_controlBar ){

            // Set the control bar dimensions based on its accompanying panel before proceeding
            this.m_controlBar.DetermineDimensions();

            // Calculate the container size based on the panel/control bar dimensions and orientation
            switch ( this.m_controlBar.m_orientation ){
                case "top":
                case "bottom":
                    this.m_panel.SetSize({width: p_size.width, height: p_size.height - this.m_controlBar.m_size.height});
                    this.m_size.width = this.m_panel.m_size.width;
                    this.m_size.height = this.m_panel.m_size.height + this.m_controlBar.m_size.height;
                    break;
                case "left":
                case "right":
                    this.m_panel.SetSize({width: p_size.width - this.m_controlBar.m_size.width, height: p_size.height});
                    this.m_size.width = this.m_panel.m_size.width + this.m_controlBar.m_size.width;
                    this.m_size.height = this.m_panel.m_size.height;
                    break;
            }
        } else {
            // Otherwise, panel and its container are the same size
            this.m_size = { width: p_size.width, height: p_size.height };
            this.m_panel.SetSize({ width: p_size.width, height: p_size.height });
        }
    });


    // Basic constructor (property initialization occurs later)
    namespace.Level = function(){

        // Queue for loading JSON
        this.m_queue = new queue();

        // Level attributes
        this.m_coordinates = { x: 0, y:0 };
        this.m_size = { width: 0, height: 0 };
        this.m_name = "";
        this.m_div = null;
        this.m_objectCount = 0;
        this.m_highlightedTopic = -1;

        // Arrays of TWiC.Container objects
        this.m_graphViews = [];
        this.m_infoViews = [];

        // Corpus JSON data
        this.m_corpusMap = {};
        this.m_corpusInfo = {};
        this.m_topicWordLists = {};
        this.m_topicColors = {};

        this.m_controlBar = null;

        // Keeps track of who the level is temporarily pausing/unpausing.
        // This way, panels can remain in charge of their own more permanent pause/unpause.
        this.m_graphPauseList = [];
        this.m_infoPauseList = [];

        this.m_resizeOccurred = false;

        // Reference to the level's data bar, if present
        this.m_dataBar = null;
    };

    namespace.Level.method("AddControlBar", function(p_barThickness, p_barOrientation){

        this.m_controlBar = new TWiC.Control(p_barThickness, p_barOrientation);
        this.m_controlBar.Initialize(this.m_div);
        this.AddBarText();
    });

    namespace.Level.method("AddBarText", function(){

        this.m_controlBar.AddText(function(p_controlBar){

            p_controlBar.m_barText = p_controlBar.m_controlGroup.append("text")
                                                    .attr("x", (p_controlBar.m_barThickness >> 1))
                                                    .attr("y", (p_controlBar.m_barThickness * 0.65));

            p_controlBar.m_barText.append("tspan")
                                  .html("T")
                                  .attr("fill", namespace.Level.prototype.s_palette.purple)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21)
                                  .style("font-weight", "bold");

            p_controlBar.m_barText.append("tspan")
                                  .html("opic&nbsp;")
                                  .attr("fill", namespace.Level.prototype.s_palette.purple)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            p_controlBar.m_barText.append("tspan")
                                  .html("W")
                                  .attr("fill", namespace.Level.prototype.s_palette.purple)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21)
                                  .style("font-weight", "bold");

            p_controlBar.m_barText.append("tspan")
                                  .html("ords&nbsp;in&nbsp;")
                                  .attr("fill", namespace.Level.prototype.s_palette.purple)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            p_controlBar.m_barText.append("tspan")
                                  .html("C")
                                  .attr("fill", namespace.Level.prototype.s_palette.purple)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21)
                                  .style("font-weight", "bold");

            p_controlBar.m_barText.append("tspan")
                                  .html("ontext&nbsp;")
                                  .attr("fill", namespace.Level.prototype.s_palette.purple)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            p_controlBar.m_barText.append("tspan")
                                  .html("Corpus:&nbsp;")
                                  .attr("fill", namespace.Level.prototype.s_palette.brown)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21);

            p_controlBar.m_barText.append("tspan")
                                  .html(this.m_corpusMap["name"])
                                  .attr("fill", namespace.Level.prototype.s_palette.lightblue)
                                  .style("font-family", namespace.Level.prototype.s_fontFamily)
                                  .style("font-size", 21)
                                  .style("font-weight", "bold");
        }.bind(this));
    });

    namespace.Level.method("AddDataToSpanBasedOnColor", function(p_tag){

        // Find the topic ID based on the span color
        var newTopicID = this.FindTopicIDByColor(p_tag.style.color);

        // Create a new data object
        var newData = {
            color: p_tag.style.color,
            topicID: newTopicID,
            locolor: this.m_topicColorsLoBlend[newTopicID],
            word: p_tag.innerText };

        // Add the data to the span
        d3.select(p_tag).datum(newData);

        // Return the new data object
        return newData;
    });

    namespace.Level.method("AddPanel", function(p_panel){

        // Some panels may not have control bars
        var controlBar = null;
        if ( p_panel instanceof namespace.GraphView || p_panel instanceof namespace.DataBar ) {
            // (NOTE: Currently all of these views use a 'top'-oriented control bar)
            controlBar = new namespace.Control(namespace.Control.prototype.s_defaultThickness, "top");
        }

        // Create a container for the panel and (possible) control bar
        var container = new namespace.Container({ x: p_panel.m_coordinates.x, y: p_panel.m_coordinates.y }, controlBar, p_panel);
        p_panel.SetContainer(container);
        if ( null != controlBar) {
            controlBar.SetContainer(container);
        }

        // Add a container with the panel and control bar to the appropriate view list
        if ( p_panel instanceof namespace.InformationView ) {
            this.m_infoViews.push(container);
        } else {
            this.m_graphViews.push(container);
        }
    });

    namespace.Level.method("FindTopicIDByColor", function(p_color){

        // Look for the topic ID of the given color
        var hexString = TWiC.ColorToHex(p_color);
        for ( var index = 0; index < this.m_topicColors.length; index++ ){
            if ( hexString == this.m_topicColors[index] ){
                return index;
            }
        }

        // No color matches in the topic color list
        return -1;
    });

    namespace.Level.method("GetDataBar", function(){

        return this.m_dataBar;
    });
    namespace.Level.method("SetDataBar", function(p_dataBar){

        this.m_dataBar = p_dataBar;
    });

    // Loads all JSON required for TWiC
    namespace.Level.method("LoadJSON", function(p_corpusInfoPath, p_corpusMapPath, p_corpusWordWeightsPath){

        // Load the corpus information JSON
        var corpusInfo = null;
        var level = this;
        this.m_queue.defer(function(callback) {
            d3.json(p_corpusInfoPath, function(error, data) {
                corpusInfo = data;
                this.m_corpusInfo = corpusInfo;
                this.m_topicWordLists = corpusInfo.topic_info[0];
                this.m_topicColors = corpusInfo.topic_info[1];
                this.PreblendTopicColors();
                callback(null, corpusInfo);
            }.bind(this));
        }.bind(this));

        // Load the corpus distance map JSON
        var corpusDistanceMap = null;
        this.m_queue.defer(function(callback) {
            d3.json(p_corpusMapPath, function(error, data) {
                corpusDistanceMap = data;
                this.m_corpusMap = corpusDistanceMap;
                callback(null, corpusDistanceMap);
            }.bind(this));
        }.bind(this));

        // Load the corpus word weight file
        var corpusWordWeights = null;
        this.m_queue.defer(function(callback){
            d3.json(p_corpusWordWeightsPath, function(error, data){
                corpusWordWeights = data;
                this.m_corpusWordWeights = corpusWordWeights;
                callback(null, corpusWordWeights);
            }.bind(this))
        }.bind(this));
    });

    namespace.Level.method("Initialize", function(p_coordinates, p_size, p_parentDiv){

        this.m_coordinates = p_coordinates;
        this.m_size = p_size;
        this.m_name = namespace.GetUniqueID();

        var screenSpace = TWiC.GetAvailableScreenSpace();
        var levelDimsPercent = {width: parseInt(100 * this.m_size.width / screenSpace.width).toString() + "%",
                                height: parseInt(100 * this.m_size.height / screenSpace.height).toString() + "%"};

        // Create the level container div and svg
        this.m_div = p_parentDiv.append("div")
                                .attr("class", "div_twic_level")
                                .attr("id", "twic_level_" + this.m_name)
                                .style("position", "relative")
                                .style("width", levelDimsPercent.width)
                                .style("height", levelDimsPercent.height)
                                .style("max-width", levelDimsPercent.width)
                                .style("max-height", levelDimsPercent.height);

        // Add level control bar
        //this.AddControlBar(50, "top", "Topic Words in Context - The Poems of Emily Dickinson");

        // Add and setup the graph div and svg elements
        for ( var index = 0; index < this.m_graphViews.length; index++ ){
            this.m_graphViews[index].Initialize(this.m_div);
        }

        // Add and setup the informational div and svg elements
        for ( var index = 0; index < this.m_infoViews.length; index++ ){
            this.m_infoViews[index].Initialize(this.m_div);

            // Save a reference to the data bar if it exists
            if ( this.m_infoViews[index].m_panel instanceof namespace.DataBar ){
                this.SetDataBar(this.m_infoViews[index].m_panel);
            }
        }

        // When browser resizes, level and its panels resize
        //$(this.m_div[0]).resizable({resize: function(){
        //}.bind(this)});

        /*window.addEventListener("resize", function(){
            $(this.m_div[0]).trigger("resize");
        }.bind(this));
        $(document).ready(function(){
            $(window).resize(function(){
                for ( var index = 0; index < this.m_graphViews.length; index++ ){
                    $(this.m_graphViews[index].m_div[0]).resize();
                }
                for ( var index = 0; index < this.m_infoViews.length; index++ ){
                    $(this.m_infoViews[index].m_div[0]).resize();
                }
               // $(this.m_div[0]).find(".div_twic_container").resize();
            }.bind(this));
        }.bind(this));*/

        // Initialize a Packery layout for this level
        this.Packery();
    });

    namespace.Level.method("Start", function(){

        // Ensure all initialization work is finished before starting up TWiC views
        this.m_queue.await(function(){

            for ( var index = 0; index < this.m_graphViews.length; index++ ){
                this.m_graphViews[index].Start();
            }
            for ( var index = 0; index < this.m_infoViews.length; index++ ){
                this.m_infoViews[index].Start();
            }
        }.bind(this));
    });

    namespace.Level.method("Pause", function(p_state){

        for ( var index = 0; index < this.m_graphViews.length; index++ ){

            if ( p_state && !this.m_graphViews[index].m_panel.IsPaused() ){
                this.m_graphPauseList.push(index);
                this.m_graphViews[index].m_panel.Pause(true);
            } else if ( !p_state ){
                for ( var index2 = 0; index2 < this.m_graphPauseList.length; index2++ ){
                    if ( index == this.m_graphPauseList[index2]){
                        this.m_graphPauseList.splice(index2, 1);
                        this.m_graphViews[index].m_panel.Pause(false);
                    }
                }
            }
        }
        for ( var index = 0; index < this.m_infoViews.length; index++ ){
            if ( p_state && !this.m_infoViews[index].m_panel.IsPaused() ){
                this.m_infoPauseList.push(index);
                this.m_infoViews[index].m_panel.Pause(true);
            } else if ( !p_state ){
                for ( var index2 = 0; index2 < this.m_infoPauseList.length; index2++ ){
                    if ( index == this.m_infoPauseList[index2]){
                        this.m_infoPauseList.splice(index2, 1);
                        this.m_infoViews[index].m_panel.Pause(false);
                    }
                }
            }
        }
    });

    namespace.Level.method("Update", function(p_data, p_updateType){

        if ( namespace.Interaction.dblclick == p_updateType ){

            // Pause the level
            this.Pause(true);

            // Assess the level state and make a panel arrangement decision

            // Determine the number of graph panels open (NOTE: Assumes m_infoViews[0] is the topic bar)
            switch ( this.m_graphViews.length ){

                case 1:

                    // Split the level in two evenly, current panel on left, new panel on right,
                    // topic bar centered beneath both

                    // Unhide any hidden panels
                    for ( var index = 0; index < this.m_graphViews.length; index++ ){
                        if ( this.m_graphViews[index].m_panel.IsHidden() ){
                            this.m_graphViews[index].m_panel.Hide(false);
                        }
                    }
                    for ( var index = 0; index < this.m_infoViews.length; index++ ){
                        if ( this.m_infoViews[index].m_panel.IsHidden() ){
                            this.m_infoViews[index].m_panel.Hide(false);
                        }
                    }

                    // New panel container width will be half the level width
                    var containerWidth = this.m_size.width >> 1;

                    // Panel container height is the level height minus the information view's height
                    var containerHeight = this.m_size.height >> 1;
                    if ( (this.m_size.height >> 1) <= this.m_infoViews[0].m_size.height ){
                        containerHeight = this.m_size.height - this.m_infoViews[0].m_size.height;
                    }

                    // Perform the move of the original panel container
                    transition = {
                        position: { x: 0, y: 0 },
                        size: { width: containerWidth, height: containerHeight },
                        duration: 2000
                    };

                    // Original panel is put to top left and halved, and animated over to this position/size
                    this.m_graphViews[0].m_panel.Move(transition, "start", function(p_containerWidth, p_containerHeight, p_data){

                        // The information view grows upward beneath the two panels
                        var transition = {
                            position: { x: 0, y: p_containerHeight },
                            size: { width: (this.m_size.width >> 1) + (this.m_size.width >> 2),
                                    height: this.m_size.height - p_containerHeight},
                            duration: 2000
                        };
                        this.m_infoViews[0].m_panel.Move(transition, "start", function(p_containerWidth, p_containerHeight, p_data){

                            // Move the data bar
                            transition = {
                                position: { x: (this.m_size.width >> 1) + (this.m_size.width >> 2),
                                            y: p_containerHeight },
                                size: { width: this.m_size.width >> 2,
                                        height: this.m_size.height - p_containerHeight },
                                duration: 2000
                            };

                            this.m_infoViews[1].m_panel.Move(transition, "end", function(p_containerWidth, p_containerHeight, p_data){

                                // New panel is created, loaded in the background
                                this.m_graphViews[0].m_panel.OpenUnderlyingPanel(p_data,
                                                                                 { x: p_containerWidth, y: 0 },
                                                                                 { width: p_containerWidth,
                                                                                   height: p_containerHeight - namespace.Control.prototype.s_defaultThickness });

                                // Update all panels as if they have had a datashape mouseover event, and then pause them
                                for ( var index = 0; index < this.m_graphViews.length; index++ ){
                                    this.m_graphViews[index].Update({ topicID: this.m_highlightedTopic,
                                                                      color: this.m_topicColors[this.m_highlightedTopic] },
                                                                    namespace.Interaction.mouseover);
                                    this.m_graphViews[index].m_panel.Pause(true);
                                }

                                for ( var index = 0; index < this.m_infoViews.length; index++ ){
                                   this.m_infoViews[index].Update({ topicID: this.m_highlightedTopic,
                                                                    color: this.m_topicColors[this.m_highlightedTopic] },
                                                                  namespace.Interaction.mouseover);
                                   this.m_infoViews[index].m_panel.Pause(true);
                                }

                                // Add this panel's container div to the packery list and reload the layout
                                var levelAsContainer = $(this.m_div[0]);
                                levelAsContainer.packery("appended", [$(this.m_graphViews[1].m_div[0])]);
                                var itemElems = levelAsContainer.find('.item');
                                levelAsContainer.packery('bindUIDraggableEvents', itemElems);
                                levelAsContainer.packery("reloadItems");

                                this.m_graphViews[1].m_panel.Pause(false);
                                this.m_graphViews[1].Update({ topicID: this.m_highlightedTopic,
                                                              color: this.m_topicColors[this.m_highlightedTopic] },
                                                             namespace.Interaction.mouseover);
                                this.m_graphViews[1].m_panel.Pause(true);

                            }.bind(this, p_containerWidth, p_containerHeight, p_data));
                        }.bind(this, p_containerWidth, p_containerHeight, p_data));
                    }.bind(this, containerWidth, containerHeight, p_data));

                    break;

                case 2:
                    // Split the level in quarters, current two panels on top, new panel at bottom left,
                    // topic bar at bottom right

                    // Unhide any hidden panels
                    for ( var index = 0; index < this.m_graphViews.length; index++ ){
                        if ( this.m_graphViews[index].m_panel.IsHidden() ){
                            this.m_graphViews[index].m_panel.Hide(false);
                        }
                    }
                    for ( var index = 0; index < this.m_infoViews.length; index++ ){
                        if ( this.m_infoViews[index].m_panel.IsHidden() ){
                            this.m_infoViews[index].m_panel.Hide(false);
                        }
                    }

                    // New panel container width will be half the level width
                    var containerWidth = this.m_size.width >> 1;

                    // Panel height is half the level height minus the information view's height
                    var containerHeight = this.m_size.height >> 1;

                    // Reposition corpus and corpus cluster views
                    var transition = {
                        position: { x: 0, y: 0 },
                        size: { width: containerWidth, height: containerHeight },
                        duration: 2000
                    };
                    this.m_graphViews[0].m_panel.Move(transition, "start", function(p_containerWidth, p_containerHeight, p_data){

                        transition = {
                            position: { x: containerWidth, y: 0 },
                            size: { width: containerWidth, height: containerHeight },
                            duration: 2000
                        };
                        this.m_graphViews[1].m_panel.Move(transition, "start", function(p_containerWidth, p_containerHeight, p_data){

                            // Move and hide the data bar
                            transition = {
                                position: { x: p_containerWidth, y: p_containerHeight },
                                size: { width: p_containerWidth, height: p_containerHeight >> 1 },
                                duration: 1500
                            };
                            this.m_infoViews[1].m_panel.Move(transition, "end", function(){ });

                            // Resize the topic bar to the bottom right
                            transition = {
                                position: { x: p_containerWidth, y: this.m_size.height - (p_containerHeight >> 1) },
                                size: { width: containerWidth, height: p_containerHeight >> 1 },
                                duration: 2000
                            };

                            this.m_infoViews[0].m_panel.Move(transition, "start", function(p_containerWidth, p_containerHeight, p_data){

                                // Open the text cluster view based on the double-clicked cluster
                                this.m_graphViews[1].m_panel.OpenUnderlyingPanel(p_data,
                                                                                 { x: 0, y: p_containerHeight },
                                                                                 { width: p_containerWidth,
                                                                                   height: p_containerHeight - namespace.Control.prototype.s_defaultThickness });

                                // Update all panels as if they have had a datashape mouseover event, and then pause them
                                for ( var index = 0; index < this.m_graphViews.length; index++ ){
                                    this.m_graphViews[index].m_panel.Pause(false);
                                    this.m_graphViews[index].Update({ topicID: this.m_highlightedTopic,
                                                                      color: this.m_topicColors[this.m_highlightedTopic] },
                                                                    namespace.Interaction.mouseover);
                                    this.m_graphViews[index].m_panel.Pause(true);
                                }

                                for ( var index = 0; index < this.m_infoViews.length; index++ ){
                                    this.m_infoViews[index].m_panel.Pause(false);
                                    this.m_infoViews[index].Update({ topicID: this.m_highlightedTopic,
                                                                     color: this.m_topicColors[this.m_highlightedTopic] },
                                                                   namespace.Interaction.mouseover);
                                    this.m_infoViews[index].m_panel.Pause(true);
                                }

                                // Add this panel's container div to the packery list and reload the layout
                                var levelAsContainer = $(this.m_div[0]);
                                levelAsContainer.packery("appended", [$(this.m_graphViews[2].m_div[0])]);
                                var itemElems = levelAsContainer.find('.item');
                                levelAsContainer.packery('bindUIDraggableEvents', itemElems);
                                levelAsContainer.packery("reloadItems");

                                this.m_graphViews[2].m_panel.Pause(false);
                                this.m_graphViews[2].Update({ topicID: this.m_highlightedTopic,
                                                              color: this.m_topicColors[this.m_highlightedTopic] },
                                                            namespace.Interaction.mouseover);
                                this.m_graphViews[2].m_panel.Pause(true);

                            }.bind(this, containerWidth, containerHeight, p_data));
                        }.bind(this, containerWidth, containerHeight, p_data));
                    }.bind(this, containerWidth, containerHeight, p_data));

                    break;

                case 3:

                    // Unhide any hidden panels
                    for ( var index = 0; index < this.m_graphViews.length; index++ ){
                        if ( this.m_graphViews[index].m_panel.IsHidden() ){
                            this.m_graphViews[index].m_panel.Hide(false);
                        }
                    }
                    for ( var index = 0; index < this.m_infoViews.length; index++ ){
                        if ( this.m_infoViews[index].m_panel.IsHidden() ){
                            this.m_infoViews[index].m_panel.Hide(false);
                        }
                    }

                    // Resize graphical panels 1-3 to a height of 1/2 level - 1/2 topic bar minimum size
                    var topicBarMinSize = namespace.TopicBar.prototype.s_minHeight;
                    var containerWidth = this.m_size.width >> 1;
                    var containerHeight = (this.m_size.height >> 1) - (topicBarMinSize >> 1);
                    var transition = {
                        position: { x: 0, y: 0 },
                        size: { width: containerWidth, height: containerHeight },
                        duration: 2000
                    };
                    this.m_graphViews[0].m_panel.Move(transition, "start", function(p_containerWidth, p_containerHeight){

                        transition = {
                            position: { x: p_containerWidth, y: 0 },
                            size: { width: p_containerWidth, height: p_containerHeight },
                            duration: 2000
                        };
                        this.m_graphViews[1].m_panel.Move(transition, "start", function(p_containerWidth, p_containerHeight){

                            transition = {
                                position: { x: 0, y: p_containerHeight + namespace.TopicBar.prototype.s_minHeight },
                                size: { width: p_containerWidth, height: p_containerHeight },
                                duration: 2000
                            };
                            this.m_graphViews[2].m_panel.Move(transition, "start", function(p_containerWidth, p_containerHeight){

                                // Nothing here, wait till all moves finish before proceeding

                            }.bind(this, p_containerWidth, p_containerHeight));
                        }.bind(this, p_containerWidth, p_containerHeight));
                    }.bind(this, containerWidth, containerHeight));

                    // Topic bar resizes to its minimum height and width of the level, moves to the center of the screen
                    transition = {
                        position: { x: containerWidth, y: this.m_size.height - namespace.TopicBar.prototype.s_minHeight },
                        size: { width: containerWidth, height: namespace.TopicBar.prototype.s_minHeight },
                        duration: 1500
                    };
                    this.m_infoViews[0].m_panel.Move(transition, "end", function(p_data, p_containerWidth, p_containerHeight){

                        transition = {
                            position: { x: 0, y: p_containerHeight },
                            size: { width: p_containerWidth, height: namespace.TopicBar.prototype.s_minHeight },
                            duration: 1500
                        };
                        this.m_infoViews[0].m_panel.Move(transition, "start", function(p_data, p_containerWidth, p_containerHeight){

                            transition = {
                                position: { x: p_containerWidth, y: p_containerHeight },
                                size: { width: p_containerWidth, height: namespace.TopicBar.prototype.s_minHeight },
                                duration: 1000
                            };
                            this.m_infoViews[1].m_panel.Move(transition, "end", function(p_data, p_containerWidth, p_containerHeight){

                                // New panel of size of panels 1-3 in bottom left (NOTE: height temporarily hacked to remove control bar height)
                                this.m_graphViews[2].m_panel.OpenUnderlyingPanel(p_data,
                                                                                { x: p_containerWidth, y: p_containerHeight + namespace.TopicBar.prototype.s_minHeight },
                                                                                { width: p_containerWidth, height: p_containerHeight - namespace.Control.prototype.s_defaultThickness });

                                // Update all panels as if they have had a datashape mouseover event, and then pause them
                                var topicForUpdate = ( -1 == this.m_highlightedTopic ) ? p_data.topicID : this.m_highlightedTopic;
                                var dataToViews = { json: p_data.json, clusterIndex: p_data.clusterIndex,
                                                    topicID: topicForUpdate, color: this.m_topicColors[topicForUpdate] };
                                for ( var index = 0; index < this.m_graphViews.length; index++ ){
                                    this.m_graphViews[index].Update(dataToViews, namespace.Interaction.mouseover);
                                    this.m_graphViews[index].m_panel.Pause(true);
                                }

                                for ( var index = 0; index < this.m_infoViews.length; index++ ){
                                   this.m_infoViews[index].Update(dataToViews, namespace.Interaction.mouseover);
                                   this.m_infoViews[index].m_panel.Pause(true);
                                }

                                // Add this panel's container div to the packery list and reload the layout
                                var levelAsContainer = $(this.m_div[0]);
                                levelAsContainer.packery("appended", [$(this.m_graphViews[3].m_div[0])]);
                                var itemElems = levelAsContainer.find('.item');
                                //itemElems.draggable();
                                levelAsContainer.packery('bindUIDraggableEvents', itemElems);
                                levelAsContainer.packery("reloadItems");
                            }.bind(this, p_data, p_containerWidth, p_containerHeight));
                        }.bind(this, p_data, p_containerWidth, p_containerHeight));
                    }.bind(this, p_data, containerWidth, containerHeight));

                    break;

                case 4:
                    // Top two at top, new panel in level center with topic bar beneath, bottom two on bottom
                    // Fifth panel is likely PublicationView currently
                    break;
            }

            // Unpause the level
            this.Pause(false);
        }
    });

    namespace.Level.method("OrganizePanels", function(){

        $(this.m_div[0]).packery();
    });

    namespace.Level.method("Packery", function(){

        // Initialize Packery layout for this level container div
        var levelContainer = $(this.m_div[0]);
        levelContainer.packery({columnWidth: 0, rowHeight: 0});
        //levelContainer.packery({ columnWidth: namespace.Panel.prototype.s_minimumPanelSize,
        //                         rowHeight: namespace.Panel.prototype.s_minimumPanelSize });

        // Bind draggable events to Packery
        var panelContainers = levelContainer.find(".div_twic_container");

        // NOTE: Panel containers will be made resizable and draggable in their own Start() calls
        //panelContainers.draggable();
        //panelContainers.resizable({autoHide: true, resize: function(){ levelContainer.packery(); }.bind(levelContainer)});

        levelContainer.packery("bindUIDraggableEvents", panelContainers);

        // Packery will reorganize panels when window is resized
        //levelContainer.packery("bindResize");
    });

    namespace.Level.method("PreblendTopicColors", function(){

        // Once the corpus topic color list has been loaded,
        // blend these colors with the data shape lolight filter for faster
        // datashape Draw() calls

        this.m_topicColorsLoBlend = [];
        for ( var index = 0; index < this.m_topicColors.length; index++ ){
            this.m_topicColorsLoBlend.push(namespace.ShadeBlend(TWiC.DataShape.prototype.s_colorLolight,
                                                           this.m_topicColors[index]));
        }
    });

    namespace.Level.prototype.s_fontFamily = "Inconsolata"; //"Archer";
    namespace.Level.prototype.s_fontFamilyAlt = "Fenwick";
    namespace.Level.prototype.s_fontSpacing = { "Inconsolata": "-3px" }
    namespace.Level.prototype.s_palette = { "darkblue": "#002240", "gold": "#FAFAD2", "purple": "#7F3463",
                                            "brown": "#4C2F2E", "green": "#17A31A", "lightblue": "#19A2AE",
                                            "beige": "#DFDAC4", "lightpurple": "#D8D8FF",
                                            "logold": namespace.ShadeBlend(-0.50, "#FAFAD2"),
                                            "deeppurple": "#15053C",
                                            "hide": "#FB4645", "minimize": "#FDB124", "maximize": "#28C231",
                                            "hide_highlight": "#3B0002", "min_highlight": "#864502", "max_highlight": "#0B5401",
                                            "tile": "#0A2D50", "link": "lightgray" };
    namespace.Level.prototype.s_twicLevels = [];
    namespace.Level.prototype.s_jsonDirectory = "data/dickinson/input/json/";
    //namespace.Level.prototype.s_jsonDirectory = "data/input/json/";

    // Creating a Level instance also adds it to the TWiC level list
    namespace.Level.prototype.Instance = function(){

        var new_level = new namespace.Level();
        namespace.Level.prototype.s_twicLevels.push(new_level);
        return new_level;
    };

    return namespace;
}(TWiC || {}));
