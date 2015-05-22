var TWiC = (function(namespace){

    namespace.Transition = function(p_object, p_timeMS){

        this.m_object = p_object;
        this.m_timeMS = p_timeMS;
    };


    namespace.FadeInOut = function(p_object, p_timeMS, p_opacity){

        namespace.Transition.apply(this, arguments);

        this.m_opacity = p_opacity;
    };
    namespace.FadeInOut.inherits(namespace.Transition);

    namespace.FadeInOut.method("Start", function(p_linkedTransition){

        if ( p_linkedTransition ) {

            this.m_object.transition()
                         .duration(this.m_timeMS)
                         .style("opacity", this.m_opacity)
                         .each("start", function(){
                             p_linkedTransition.Start();
                         });
        } else {

            this.m_object.transition()
                         .duration(this.m_timeMS)
                         .style("opacity", this.m_opacity);
        }
    });


    namespace.ZoomIn = function(p_object, p_timeMS, p_center, p_scaleFactor){

        namespace.Transition.apply(this, arguments);

        this.m_center = p_center;
        this.m_scaleFactor = p_scaleFactor;
    };
    namespace.ZoomIn.inherits(namespace.Transition);

    namespace.ZoomIn.method("Start", function(p_linkedTransition){

        if ( p_linkedTransition ) {
            this.m_object.transition()
                         .duration(this.m_timeMS)
                         .attr("transform", "translate(" + parseInt(-this.m_center.x * (this.m_scaleFactor - 1)) + ","
                                            + parseInt(-this.m_center.y * (this.m_scaleFactor - 1)) + ") scale("
                                            + this.m_scaleFactor + ")")
                         .each("start", function(){
                            p_linkedTransition.Start();
                         });
        } else {
            this.m_object.transition()
                         .duration(this.m_timeMS)
                         .attr("transform", "translate(" + parseInt(-this.m_center.x * (this.m_scaleFactor - 1)) + ","
                                            + parseInt(-this.m_center.y * (this.m_scaleFactor - 1)) + ") scale("
                                            + this.m_scaleFactor + ")");
        }
    });


    namespace.ZoomOut = function(p_object, p_timeMS){

        namespace.Transition.apply(this, arguments);
    };
    namespace.ZoomOut.inherits(namespace.Transition);

    namespace.ZoomOut.method("Start", function(p_linkedTransition){

        if ( p_linkedTransition ) {
            this.m_object.transition()
                         .duration(this.m_timeMS)
                         .attr("transform", "scale(1) translate(0,0)")
                         .each("start", function(){
                             p_linkedTransition.Start();
                         });
        } else {
            this.m_object.transition()
                         .duration(this.m_timeMS)
                         .attr("transform", "scale(1) translate(0,0)");
        }

    });


    namespace.LinkedTransition = function(p_firstTransition, p_secondTransition){

        this.m_firstTransition = p_firstTransition;
        this.m_secondTransition = p_secondTransition;
    };

    namespace.LinkedTransition.method("Start", function(){

        this.m_firstTransition.Start(this.m_secondTransition);
    });

    return namespace;
}(TWiC || {}));