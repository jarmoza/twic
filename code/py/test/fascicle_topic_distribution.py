import json
import plotly.plotly as py
import plotly.graph_objs as go


def MakePercentsFromWeights(p_topic_weights):

    tw_sum = 0
    tw_count = len(p_topic_weights)
    for index in range(tw_count):
        tw_sum += float(p_topic_weights[index])

    topic_percents = []
    for index in range(tw_count):
        topic_percents.append(p_topic_weights[index] / tw_sum)

    return topic_percents


def CompareTopicWeightsToTopicPercents(p_topic_weights):

    tw_sum = 0.0
    tw_count = len(p_topic_weights)
    for index in range(tw_count):
        tw_sum += float(p_topic_weights[index])

    topic_percents = []
    for index in range(tw_count):
        topic_percents.append(p_topic_weights[index] / tw_sum)

    for index in range(tw_count):
        if p_topic_weights[index] != topic_percents[index]:
            print "Different value for topic {0}: [TW: {1}, TP: {2}]".format(index, p_topic_weights[index], topic_percents[index])
            print "TW Type: {0} TP Type: {1}".format(type(p_topic_weights[index]), type(topic_percents[index]))


def GetTWiCPalette(p_twic_json_dir):

    with open(p_twic_json_dir + "twic_corpusinfo.json", "rU") as corpus_info_file:
        ci_json = json.load(corpus_info_file)

    return ci_json["topic_info"][1]


def GetTopicDistOfFile(p_twic_json_dir, p_file_id):

    corpus_info_filename = "twic_corpusinfo.json"

    with open(p_twic_json_dir + corpus_info_filename, "rU") as corpus_info_file:
        ci_json = json.load(corpus_info_file)

    file_info = ci_json["file_info"][p_file_id]
    title = file_info[1]
    topic_weights = file_info[2]
    topic_info = ci_json["topic_info"]

    # Needs dict
    topic_weights_tup = []
    for index in range(len(topic_weights)):
        topic_weights_tup.append((index, topic_weights[index]))
    topic_weights_tup = sorted(topic_weights_tup, key=lambda x:x[1], reverse=True)

    return topic_weights_tup


def ReadFascicleJSON(p_twic_json_dir, p_fascicle_filename):

    with open(p_twic_json_dir + p_fascicle_filename, "rU") as fascicle_json_file:
        fascicle_json = json.load(fascicle_json_file)

    return fascicle_json


def GetTopicDistribution(p_twic_json_dir, p_distribution_type, p_total_topic_count, p_distribution_id="NA"):

    if "corpus" == p_distribution_type:

        with open(p_twic_json_dir + "twic_corpusinfo.json", "rU") as corpus_info_file:
            ci_json = json.load(corpus_info_file)

        return MakePercentsFromWeights(ci_json["corpus_info"][1])

    elif "cluster" == p_distribution_type:

        with open(p_twic_json_dir + "twic_corpusmap.json", "rU") as corpus_map_file:
            cm_json = json.load(corpus_map_file)

        initial_topic_dist = cm_json["children"][str(p_distribution_id)]["topics"]
        final_topic_dist = [0 for index in range(p_total_topic_count)]
        for index in range(p_total_topic_count):
            final_topic_dist[index] = initial_topic_dist[str(index)][1]

        return MakePercentsFromWeights(final_topic_dist)

    else: # "text"
        initial_topic_dist = GetTopicDistOfFile(p_twic_json_dir, p_distribution_id)
        final_topic_dist = [0 for index in range(len(initial_topic_dist))]
        for index in range(len(initial_topic_dist)):
            final_topic_dist[int(initial_topic_dist[index][0])] = initial_topic_dist[index][1]

        return final_topic_dist


def OutputTopicThreadsofFascicle(p_twic_json_dir, p_output_dir, p_fascicle_number, p_top_topic_count, p_topic_palette):

    # 1. Read in the fascicle's JSON data
    fascicle_filename = "twic_fascicle{0}.json".format(p_fascicle_number)
    fascicle_json = ReadFascicleJSON(p_twic_json_dir, fascicle_filename)

    # 2. Get the topic distributions for every text in the fascicle
    for text_json in fascicle_json["texts"]:
        text_json["topic_dist"] = GetTopicDistOfFile(p_twic_json_dir, text_json["file"])

    # 3. Topic count is retrieved from the length of the topic distribution of a text
    topic_count = len(fascicle_json["texts"][0]["topic_dist"])

    # 4. Calculate full fascicle and page topic distributions

    # Calculate total fascicle topic distribution
    total_topic_dist = [0.0 for index in range(topic_count)]
    for text_json in fascicle_json["texts"]:
        for topic_tuple in text_json["topic_dist"]:
            total_topic_dist[int(topic_tuple[0])] += float(topic_tuple[1])
    for index in range(topic_count):
        total_topic_dist[index] /= topic_count

    # Convert total fascicle topic distribution into percents
    total_fascicle_proportions = 0.0
    for index in range(topic_count):
        total_fascicle_proportions += total_topic_dist[index]
    for index in range(topic_count):
        total_topic_dist[index] = total_topic_dist[index] / total_fascicle_proportions

    # Topic distribution through each fascicle page
    page_topic_dists = []
    current_page = 0

    for text_json in fascicle_json["texts"]:
        if int(text_json["page"]) > current_page:
            page_topic_dists.append([float(0) for index in range(topic_count)])
            current_page += 1

    for text_json in fascicle_json["texts"]:
        current_page = int(text_json["page"])
        for topic_tuple in text_json["topic_dist"]:
            page_topic_dists[current_page - 1][int(topic_tuple[0])] += float(topic_tuple[1])

    for index in range(len(page_topic_dists)):
        for index2 in range(topic_count):
            page_topic_dists[index][index2] /= topic_count

    # Shift page topic distribution into percentages out of 100%
    page_topic_percents = []
    for index in range(len(page_topic_dists)):
        page_topic_sum = 0.0
        for index2 in range(topic_count):
            page_topic_sum += page_topic_dists[index][index2]
        for index2 in range(topic_count):
            page_topic_dists[index][index2] = page_topic_dists[index][index2] / page_topic_sum

    sorted_page_topic_dists = []
    for index in range(len(page_topic_dists)):
        sorted_topics = []
        for index2 in range(len(page_topic_dists[index])):
            sorted_topics.append((index2, float(page_topic_dists[index][index2])))
        sorted_topics = sorted(sorted_topics, key=lambda x:x[1], reverse=True)
        sorted_page_topic_dists.append(sorted_topics)

    top_page_topics = []
    for index in range(len(page_topic_dists)):
        top_page_topics.append(sorted_page_topic_dists[index][0:p_top_topic_count])

    # 5. Determine the introduction order of prevalent topics in the fascicle

    # Get list of top five topics of each fascicle text (list order reflects text's order in fascicle)
    top_topics_fortexts = []
    for text_json in fascicle_json["texts"]:
        top_topics = sorted(text_json["topic_dist"], key=lambda x:x[1], reverse=True)[0:p_top_topic_count]
        top_topics_fortexts.append(top_topics)

    # Construct an fascicle ordered list of topic introductions
    fascicle_topic_order = []
    for top_topics in top_topics_fortexts:
        for topic_tuple in top_topics:
            if topic_tuple[0] not in fascicle_topic_order:
                fascicle_topic_order.append(topic_tuple[0])

    # Construct a dictionary of lists of texts that reflect those top topics of the fascicle
    # (Texts are numbered in 1-based order in the fascicle json file, thus "index + 1")
    top_topic_text_dict = {}
    for topic in fascicle_topic_order:
        for index in range(len(top_topics_fortexts)):
            for topic_tuple in top_topics_fortexts[index]:
                if topic == topic_tuple[0]:
                    if topic not in top_topic_text_dict:
                        top_topic_text_dict[topic] = []
                    top_topic_text_dict[topic].append("{0} ({1:.3f}%)".format(index + 1,
                                                                             100 * float(topic_tuple[1])))

    # Small hack for darker colors
    dark_topics = [0, 3, 31]

    # 6. Output an HTML file reflecting both the topic introduction order
    # and the texts that contain those topics in their top N topics
    with open(p_output_dir + "fascicle_topics.html", "w") as output_file:

        # Output HTML header tags
        output_file.write("<html>")
        output_file.write("<head>")
        output_file.write("<link rel=\"stylesheet\" type=\"text/css\" href=\"http://fonts.googleapis.com/css?family=Podkova:400|Inconsolata:400,700\">")
        output_file.write("<style>")
        output_file.write("body { background-color: #3F3F3F; font-size:18px; font-family: \"Inconsolata\"; color: white; }")
        output_file.write("</style>")
        output_file.write("</head>")
        output_file.write("<body>")

        # Output section title information
        output_file.write("<h3>Fascicle {0} in Order</h3>".format(p_fascicle_number))
        output_file.write("<p>Text #. Title (Text Top Topic, Fascicle Topic Weight)</p>")

        # Output a numbered list of the fascicle's poems
        output_file.write("<p>")
        for index in range(len(fascicle_json["texts"])):
            top_topic = top_topics_fortexts[index][0][0]
            top_topic_weight = top_topics_fortexts[index][0][1]
            if int(top_topic) in dark_topics:
                background_color = "#BFBFBF"
            else:
                background_color = "#3F3F3F"
            output_file.write("<span style=\"background-color: {0}; color: {1};\">{2:2}. {3}</span>".format(background_color, p_topic_palette[int(top_topic)],
                                                                                                            index + 1, fascicle_json["texts"][index]["title"]))
            output_file.write("&nbsp;&nbsp;<span style=\"background-color: {0}; color: {1};\">({2} {3:.3f}%)</span><br>".format(background_color,
                p_topic_palette[int(top_topic)], top_topic, 100 * total_topic_dist[int(top_topic)]))
        output_file.write("</p>")

        # Output section title information
        output_file.write("<h3>The Weaving of the Top {0} Topics of Fascicle {1}</h3>".format(p_top_topic_count, p_fascicle_number))
        output_file.write("<p>Text #. Title (Text Top Topic, Fascicle Topic Weight)<br>")
        output_file.write("[(#1 Text Topic, Text Topic Weight) (#2 Text Topic, Text Topic Weight)...]</p>")

        # Output top topic "threads" of this fascicle
        for index in range(len(fascicle_json["texts"])):

            # Output title
            top_topic = top_topics_fortexts[index][0][0]
            top_topic_weight = top_topics_fortexts[index][0][1]
            if int(top_topic) in dark_topics:
                background_color = "#BFBFBF"
            else:
                background_color = "#3F3F3F"
            output_file.write("<p><span style=\"background-color: {0}; color: {1};\">{2:2}. {3}</span>".format(background_color, p_topic_palette[int(top_topic)],
                                                                                                            index + 1, fascicle_json["texts"][index]["title"]))
            output_file.write("&nbsp;&nbsp;<span style=\"background-color: {0}; color: {1};\">({2} {3:.3f}%)</span><br>".format(background_color,
                p_topic_palette[int(top_topic)], top_topic, 100 * total_topic_dist[int(top_topic)]))

            # Output top N topics of this text side by side
            index2 = 0
            output_file.write("[")
            for topic_tuple in top_topics_fortexts[index]:
                topic_id = topic_tuple[0]
                topic_weight = topic_tuple[1]
                if int(topic_id) in dark_topics:
                    background_color = "#BFBFBF"
                else:
                    background_color = "#3F3F3F"
                output_file.write("<span style=\"background-color: {1}; color:{0};\">({2} {3:.3f}%)</span>".format(background_color, p_topic_palette[int(topic_id)],
                                                                                                                   int(topic_id), 100 * float(topic_weight)))
                index2 += 1
                if index2 < len(top_topics):
                    output_file.write(",&nbsp;")
            output_file.write("]</p>")

        # Output section title information
        output_file.write("<h3>Top Topics by Introduction Order [Texts with that Topic in Their Top {0}]</h3>".format(p_top_topic_count))
        output_file.write("<p>Topic: (Topic, Fascicle Topic Weight)<br>")
        output_file.write("Text List: [Text Number (Text Topic Weight),...]</p>")

        # Output a list of topics in their fascicle introduction order
        # along with a list of each text that features that topic in their top N topics
        for topic in fascicle_topic_order:
            if int(topic) in dark_topics:
                background_color = "#BFBFBF"
            else:
                background_color = "#3F3F3F"
            output_file.write("<p>Topic: <span style=\"background-color: {0}; color:{1};\">({2} {3:.3f}%)</span><br>".format(background_color, p_topic_palette[int(topic)],
                                                                                                     topic, 100 * float(total_topic_dist[int(topic)])))
            output_file.write("Text List:&nbsp;[")
            index2 = 0
            for text_str in top_topic_text_dict[topic]:
                output_file.write("<span style=\"background-color: {0}; color:{1};\">{2}</span>".format(background_color, p_topic_palette[int(topic)], text_str))
                index2 += 1
                if index2 < len(top_topic_text_dict[topic]):
                    output_file.write(",&nbsp;")
            output_file.write("]</p>")

        # Output section title information
        output_file.write("<h3>Top {0} Topics in the Pages of Fascicle {1}</h3>".format(p_top_topic_count, p_fascicle_number))
        output_file.write("<p>Page #: [(#1 Page Topic, Page Topic Weight), (#2 Page Topic, Page Topic Weight),...]</p>")

        for index in range(len(top_page_topics)):
            output_file.write("<p>")
            output_file.write("Page&nbsp;{0}:&nbsp;[".format(index + 1))
            for index2 in range(len(top_page_topics[index])):
                topic_id = top_page_topics[index][index2][0]
                topic_weight = top_page_topics[index][index2][1]
                if int(topic_id) in dark_topics:
                    background_color = "#BFBFBF"
                else:
                    background_color = "#3F3F3F"
                output_file.write("<span style=\"background-color: {0}; color: {1};\">({2} {3:.3f}%)</span>".format(p_topic_palette[int(topic_id)],
                    background_color, topic_id, 100 * float(topic_weight)))
                if index2 + 1 < len(top_page_topics[index]):
                    output_file.write(",&nbsp;")
            output_file.write("]")
            output_file.write("</p>")

        # Output HTML footer tags
        output_file.write("</body>")

def PlotTopicDistribution(p_topic_dist, p_num_plot_topics, p_topic_palette, p_plot_type, p_chart_title):

    # Note: p_topic_dist is assumed to be ordered by topic ID only

    # 1. Create ordered tuple lists for topic IDs and topic weights depending on desired plot type
    topic_ids = []
    topic_weights = []
    color_list = [] #"elements are hex(#hexcolor)"
    if p_plot_type == "descending":

        sorted_topic_dist = []
        for index in range(len(p_topic_dist)):
            sorted_topic_dist.append((index, p_topic_dist[index]))
        sorted_topic_dist = sorted(sorted_topic_dist, key=lambda x:x[1], reverse=True)
        for index in range(len(sorted_topic_dist)):
            topic_ids.append("Topic " + str(sorted_topic_dist[index][0]))
            topic_weights.append(sorted_topic_dist[index][1])

        # Plot is limited by the suggested amount of topics
        full_topic_count = len(p_topic_dist)
        if p_num_plot_topics > full_topic_count:
            p_num_plot_topics = full_topic_count
        if p_num_plot_topics != full_topic_count:
            topic_ids = topic_ids[0:p_num_plot_topics]
            topic_weights = topic_weights[0:p_num_plot_topics]

    else: # bullseye plot

        sorted_topic_dist = []
        for index in range(len(p_topic_dist)):
            sorted_topic_dist.append((index, p_topic_dist[index]))
        sorted_topic_dist = sorted(sorted_topic_dist, key=lambda x:x[1], reverse=True)

        # Bullseye distribution
        topic_ids.append("Topic " + str(sorted_topic_dist[0][0]))
        topic_weights.append(sorted_topic_dist[0][1])
        full_topic_count = len(p_topic_dist)
        plot_limit = full_topic_count
        if p_num_plot_topics < full_topic_count:
            plot_limit = p_num_plot_topics
        for index in range(1, plot_limit):
            topic_ids.insert(0, "Topic " + str(sorted_topic_dist[index][0]) + "_L")
            topic_weights.insert(0, sorted_topic_dist[index][1])
            topic_ids.append("Topic " + str(sorted_topic_dist[index][0]) + "_R")
            topic_weights.append(sorted_topic_dist[index][1])

    # 2. Create a marker list based on the topic IDs in the distribution
    for index in range(len(topic_ids)):

        topic_id_num = topic_ids[index][6:]

        if "bullseye" == p_plot_type and "_" in topic_id_num:
            topic_id_num = topic_id_num[0:topic_id_num.find("_")]

        color_list.append(p_topic_palette[int(topic_id_num)])

    # 3. Create Plotly data structures
    trace0 = go.Bar(x=topic_ids, y=topic_weights, marker=dict(color=color_list,),)
    data = [trace0]
    layout = go.Layout(
        title=p_chart_title,
    )
    fig = go.Figure(data=data, layout=layout)

    # 4. Plot the distribution
    plot_url = py.plot(fig, filename=p_chart_title.replace(" ", "-") + "-" + p_plot_type)

def main():

    twic_json_dir = "/Users/PeregrinePickle/Documents/Programming/D3Playground/projects/twic/data/dickinson/input/json/"
    output_dir = "/Users/PeregrinePickle/Documents/Programming/D3Playground/projects/twic/data/dickinson/output/twic/"
    top_topic_count = 5
    fascicle_number = 21
    topic_palette = GetTWiCPalette(twic_json_dir)
    fascicle_filename = "twic_fascicle21.json"
    topic_count = 100

    # OutputTopicThreadsofFascicle(twic_json_dir, output_dir, fascicle_number, top_topic_count, topic_palette)

    # Plot corpus distribution (descending)
    # corpus_distribution = GetTopicDistribution(twic_json_dir, "corpus", topic_count,)
    # PlotTopicDistribution(corpus_distribution, 100, topic_palette, "descending", "Corpus Topics in Order")

    # Plot corpus distribution (bullseye)
    # corpus_distribution = GetTopicDistribution(twic_json_dir, "corpus", topic_count,)
    # PlotTopicDistribution(corpus_distribution, 10, topic_palette, "bullseye", "Corpus Topic Bullseye")

    # Plot text cluster distribution (descending)
    # cluster_id = 41
    # text_cluster_distribution = GetTopicDistribution(twic_json_dir, "cluster", topic_count, cluster_id)
    # PlotTopicDistribution(text_cluster_distribution, 100, topic_palette, "descending", "Text Cluster {0} Topics in Order".format(cluster_id))

    # Plot text cluster distribution (bullseye)
    cluster_id = 41
    text_cluster_distribution = GetTopicDistribution(twic_json_dir, "cluster", topic_count, cluster_id)
    PlotTopicDistribution(text_cluster_distribution, 10, topic_palette, "bullseye", "Text Cluster {0} Bullseye".format(cluster_id))

    # Plot text distribution (descending)
    # text_file_id = "627"
    # text_distribution = GetTopicDistribution(twic_json_dir, "text", topic_count, text_file_id)
    # PlotTopicDistribution(text_distribution, 100, topic_palette, "descending", "Text {0} Topics in Order".format(text_file_id))

    # Plot text distribution (bullseye)
    # text_file_id = "627"
    # text_distribution = GetTopicDistribution(twic_json_dir, "text", topic_count, text_file_id)
    # PlotTopicDistribution(text_distribution, 10, topic_palette, "bullseye", "Text {0} Bullseye".format(text_file_id))


if "__main__" == __name__:
    main()

# Scrap

    # # Read in the fascicle's JSON data
    # fascicle_json = ReadFascicleJSON(twic_json_dir, fascicle_filename)

    # # Get the topic distributions for every text in the fascicle
    # for text_json in fascicle_json["texts"]:
    #     text_json["topic_dist"] = GetTopicDistOfFile(twic_json_dir, text_json["file"])

    # # Full fascicle distribution

    # # Calculate total fascicle topic distribution and make a sorted version of it (descending)
    # total_topic_dist = [0.0 for index in range(topic_count)]
    # topic_sum_counts = [0 for index in range(topic_count)]
    # for text_json in fascicle_json["texts"]:
    #     #print "Text {0}\nTopic Dist: {1}\n".format(text_json["file"], text_json["topic_dist"])
    #     for topic_tuple in text_json["topic_dist"]:
    #         #if float(topic_tuple[1]) * 100 >= 1:
    #         #    print "{0}".format(float(topic_tuple[1]) * 100)
    #         total_topic_dist[int(topic_tuple[0])] += float(topic_tuple[1])
    #         topic_sum_counts[int(topic_tuple[0])] += 1
    # # Only averaging by number of actual summed values (see case above for reason)
    # for index in range(topic_count):
    #     #if topic_sum_counts[index] > 0:
    #     total_topic_dist[index] /= topic_sum_counts[index]
    # print total_topic_dist
    # sorted_topic_dist = []
    # for index in range(len(total_topic_dist)):
    #     sorted_topic_dist.append((index, total_topic_dist[index]))
    # sorted_topic_dist = sorted(sorted_topic_dist, key=lambda x:x[1], reverse=True)

    # # Calculate total fascicle topic distribution
    # total_topic_dist = [0.0 for index in range(topic_count)]
    # for text_json in fascicle_json["texts"]:
    #     for topic_tuple in text_json["topic_dist"]:
    #         total_topic_dist[int(topic_tuple[0])] += float(topic_tuple[1])
    # for index in range(topic_count):
    #     total_topic_dist[index] /= topic_sum_counts[index]

    # # Make a sorted version of the total fascicle topic distribution (descending)
    # sorted_topic_dist = []
    # for index in range(len(total_topic_dist)):
    #     sorted_topic_dist.append((index, total_topic_dist[index]))
    # sorted_topic_dist = sorted(sorted_topic_dist, key=lambda x:x[1], reverse=True)

    # # Make topic-ranked, text collated list
    # top_topic_texts = [[] for index in range(topic_count)]
    # for index in range(len(fascicle_json["texts"])):
    #     #print "Text: \"{0}\", Top Topic: {1}".format(fascicle_json["texts"][index]["title"], int(fascicle_json["texts"][index]["topic_dist"][0][0]))
    #     top_topic_id = int(fascicle_json["texts"][index]["topic_dist"][0][0])
    #     top_topic_texts[top_topic_id].append((index, fascicle_json["texts"][index]))

    # # Output HTML page with this topic-ranked, text collated list
    # with open(output_dir + "fascicle_topics.html", "w") as output_file:

    #     output_file.write("<html>")
    #     output_file.write("<head>")
    #     output_file.write("</head>")
    #     output_file.write("<body>")

    #     for index in range(len(sorted_topic_dist)):

    #         text_list = []
    #         for index2 in range(len(top_topic_texts[sorted_topic_dist[index][0]])):
    #             text_list.append(top_topic_texts[sorted_topic_dist[index][0]][index2][1]["title"])
    #         if len(text_list) > 0:

    #             output_file.write("<p>")
    #             output_file.write("Topic: {0} ({1})<br>".format(sorted_topic_dist[index][0], 100 * float(sorted_topic_dist[index][1])))
    #             output_file.write("Text List:<br>")
    #             output_file.write("{0}".format(text_list))
    #             output_file.write("</p><br>")

    #     output_file.write("</body>")

    # Pages

    # Topic distribution through each fascicle page
    # page_topic_dists = []
    # for text_json in fascicle_json["texts"]:
    #     if int(text_json["page"]) > len(page_topic_dists):
    #         page_topic_dists.append([0.0 for index in range(topic_count)])
    # for text_json in fascicle_json["texts"]:
    #     for topic_tuple in text_json["topic_dist"]:
    #         page_topic_dists[int(text_json["page"]) - 1][int(topic_tuple[0])] += float(topic_tuple[1])
    # for index in page_topic_dists:
    #     for index2 in range(topic_count):
    #         page_topic_dists[index][index2] /= topic_count

    # Find shared prominent topics throughout the fascicle page

    # Topic distribution by text throughout the fascicle
