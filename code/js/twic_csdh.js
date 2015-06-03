(function(){

    // jQuery draggability for panels
    (function($) {
        $.fn.drags = function(opt) {

            opt = $.extend({handle:"",cursor:"move"}, opt);

            if(opt.handle === "") {
                var $el = this;
            } else {
                var $el = this.find(opt.handle);
            }

            return $el.css('cursor', opt.cursor).on("mousedown", function(e) {
                d3.select(this).style("z-index", "999");
                //TWiC.Level.prototype.s_twicLevels[0].Pause(true);
                if(opt.handle === "") {
                    var $drag = $(this).addClass('draggable');
                } else {
                    var $drag = $(this).addClass('active-handle').parent().addClass('draggable');
                }
                var z_idx = $drag.css('z-index'),
                    drg_h = $drag.outerHeight(),
                    drg_w = $drag.outerWidth(),
                    pos_y = $drag.offset().top + drg_h - e.pageY,
                    pos_x = $drag.offset().left + drg_w - e.pageX;
                $drag.css('z-index', 1000).parents().on("mousemove", function(e) {
                    $('.draggable').offset({
                        top:e.pageY + pos_y - drg_h,
                        left:e.pageX + pos_x - drg_w
                    }).on("mouseup", function() {
                        $(this).removeClass('draggable').css('z-index', z_idx);
                    });
                });
                e.preventDefault(); // disable selection
            }).on("mouseup", function() {
                if(opt.handle === "") {
                    $(this).removeClass('draggable');
                } else {
                    $(this).removeClass('active-handle').parent().removeClass('draggable');
                }
                d3.select(this).style("z-index", "auto");
                //TWiC.Level.prototype.s_twicLevels[0].Pause(false);
            });

        }
    })(jQuery);


    var twicLevel = TWiC.Level.prototype.Instance();
    twicLevel.LoadJSON("data/input/json/twic_corpusinfo.json",
                       "data/input/json/twic_corpusmap.json");

    // Once JSON has loaded, create and start the level
    twicLevel.m_queue.await(function(){

        // Create TWiC panels and link them together (panels add themselves to their given level)
        var topicBar0 = new TWiC.TopicBar({x: 2551 >> 2, y: 685}, // Position
                                         {width: 2551 >> 1, height: 200}, // Size
                                         twicLevel); // Level

        var corpusView = new TWiC.CorpusView({x: 0, y: 0}, // Position
                                             {width: 1275, height: 635}, // Size
                                             twicLevel); // Level

        var corpusClusterView = new TWiC.CorpusClusterView({x: 1276, y: 0}, // Position
                                                           {width: 1275, height: 635}, // Size
                                                           twicLevel); // Level

        var textClusterView = new TWiC.TextClusterView({x: 0, y: 886}, // Position
                                                       {width: 1275, height: 635}, // Size
                                                       twicLevel, // Level
                                                       0); // Cluster index

        var textView = new TWiC.TextView({x: 1276, y: 886}, // Position
                                         {width: 1275, height: 635}, // Size
                                         twicLevel, // Level
                                         "665"); // Individual text name

        // View links

        // All views are linked to the topic bar
        corpusView.AddLinkedView(topicBar0, "mouseover");
        corpusClusterView.AddLinkedView(topicBar0, "mouseover");
        textClusterView.AddLinkedView(topicBar0, "mouseover");
        textView.AddLinkedView(topicBar0, "mouseover");

        // Corpus view
        corpusView.AddLinkedView(corpusClusterView, "mouseover");
        corpusView.AddLinkedView(textClusterView, "mouseover");
        corpusView.AddLinkedView(textView, "mouseover");

        // Corpus cluster view
        corpusClusterView.AddLinkedView(corpusView, "mouseover");
        corpusClusterView.AddLinkedView(textClusterView, "mouseover")
        corpusClusterView.AddLinkedView(textClusterView, "dblclick");

        // Text cluster view
        textClusterView.AddLinkedView(corpusView, "mouseover");
        textClusterView.AddLinkedView(corpusClusterView, "mouseover");
        textClusterView.AddLinkedView(textView, "dblclick");
        textClusterView.AddLinkedView(textView, "mouseover");

        // Text view
        textView.AddLinkedView(corpusView, "mouseover");
        textView.AddLinkedView(corpusClusterView, "mouseover");
        textView.AddLinkedView(textClusterView, "mouseover");


        // Initialize the level
        twicLevel.Initialize({x: 0, y: 0}, // Position
                             {width:2551,height:1571},
                             d3.select("body")); // Size

        // Startup the level
        twicLevel.Start();
    }.bind(twicLevel));
})();
