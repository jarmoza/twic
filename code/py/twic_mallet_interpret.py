import json
import time

import jensen_shannon

from color_utils import Color_Utils
from mallet_script import MalletScript
from dickinson_poem import Poem
from mallet_interpret_utils import Mallet_InterpretUtils
clean_word = Mallet_InterpretUtils.CleanWord


class TWiC_MalletInterpret:

    @staticmethod
    def Build_TextObjects(TextClass, mallet_script, tp_collection):

        textobj_collection = []
        for current_tp in tp_collection:

            filename = Mallet_InterpretUtils.GetFilename(current_tp.filename)
            textobj_collection.append(TextClass('{0}{1}.tei'.format(mallet_script.tei_source, filename)))

        return textobj_collection

    @staticmethod
    def Build_TextObjects_Opt(TextClass, mallet_script, tp_collection):

        getfilename = Mallet_InterpretUtils.GetFilename
        tei_name_format = '{0}{1}.tei'.format
        tei_source = mallet_script.tei_source

        return [TextClass(tei_name_format(tei_source, getfilename(tp.filename))) for tp in tp_collection]

    @staticmethod
    def Build_WordTopicFileIndices(filename, current_fwt):

        input_file = open(filename, 'r')
        data = input_file.readlines()
        input_file.close()

        statefile_word_index = 0

        # This function builds two lists:
        #    (1) List of indices that map a word's index in the given file to its topic number (or none)
        #    (2) List of indices that map a word's index in a line in the given file to its topic number (or none)

        # Maps number index to its topic or non-topic
        file_wordtopic_map = []

        # Maps number index to lines, each of which contain another list/map of word-by-index to topic number
        line_wordtopic_map = []

        # An array of arrays (each of which have two entries: a string and another array of topic ids)
        for line in data:

            words = line.split(' ')

            # Add an entry to the line map
            line_wordtopic_map.append([line, []])

            if statefile_word_index < len(current_fwt.word_info):
                lowercase_state_word = clean_word(current_fwt.word_info[statefile_word_index].word.lower())

            # Go through each word in the line
            for actual_word_index in range(len(words)):

                # Lowercase only for comparison
                lowercase_word = clean_word(words[actual_word_index].lower())

                if statefile_word_index < len(current_fwt.word_info) and \
                   lowercase_word == lowercase_state_word:

                    statefile_word_index += 1

                    if statefile_word_index < len(current_fwt.word_info):
                        lowercase_state_word = clean_word(current_fwt.word_info[statefile_word_index].word.lower())

                        # Add an entry for this word in the file and line maps for this topic
                        line_wordtopic_map[len(line_wordtopic_map) - 1][1].append(current_fwt.word_info[statefile_word_index].topic)
                        file_wordtopic_map.append(current_fwt.word_info[statefile_word_index].topic)

                else:

                    # Add a blank entry (-1) for this word in the file and line maps for this word
                    line_wordtopic_map[len(line_wordtopic_map) - 1][1].append(-1)
                    file_wordtopic_map.append(-1)


        return file_wordtopic_map, line_wordtopic_map

    @staticmethod
    def ConvertTextToJSON(text, json_output_directory, state_file_data=None):

        json_data = { "document" : {} }

        # Store filename
        json_data["document"]["filename"] = text.GetFilename()

        # Store the text's title
        json_data["document"]["title"] = text.GetTitle()

        # Store the publication name
        json_data["document"]["publication"] = text.GetPublication()

        # Store the publication date
        json_data["document"]["publication_date"] = text.GetPublicationDate()

        # Store each line and its associated topic-word info
        json_data["document"]["lines_and_colors"] = []

        # No state file data given
        if None == state_file_data:

            # Write out the data to a JSON file (format as seen in output/viz_input_docformat.json)
            with open(json_output_directory + text.GetFilename() + ".json", 'w') as fileptr:
                fileptr.write(json.dumps(json_data))
            return

        # Get topic word indexes for this text
        filepath = '/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/source/plaintext/' + text.GetFilename() + ".txt"
        file_wordtopic_map, line_wordtopic_map = TWiC_MalletInterpret.Build_WordTopicFileIndices(filepath, state_file_data)

        line_index = 0

        #print '=============== Line word topic map ==============='
        #print line_wordtopic_map
        #print '==================================================='

        for line in line_wordtopic_map:

            line_entry = [line[0].strip(), {}]

            for index in range(0,len(line_wordtopic_map[line_index][1])):
                line_entry[1][str(index)] = str(line_wordtopic_map[line_index][1][index])

            json_data["document"]["lines_and_colors"].append(line_entry)

            line_index += 1
            # TO BE CONTINUED HERE

        # Write out the data to a JSON file (format as seen in output/viz_input_docformat.json)
        with open(json_output_directory + text.GetFilename() + ".json", 'w') as fileptr:
            fileptr.write(json.dumps(json_data))

    @staticmethod
    def DetermineCorpusClusters(file_topic_proportions, corpus_topic_proportions):

        # Clustering task

        # 1. Determine which files contain the top proportion of a topic
        #    a. Those files' overall topic proportion composition become a standard around which we can
        #       base probability distribution (topic proportion composition of other texts) comparisons
        # 2. So now we have N distributions representative of N topics.
        #    a. For each file/topic proportion composition we want to compare each other file's topic proportion
        #       composition.  This renders a comparison of N files * N files, a guaranteed O(n^2) comparison -
        #       really O(n^2) - n.
        #    b. Optimization question - Can we trim further than O(n^2) - n?
        #    c. Once all comparisons are done we have an N * N array of probability distribution distances.
        # 3. Clustering parametrization becomes a question.
        #    a. How many documents should cluster toward the a topic proportion composition standard?
        #       But is this really a question?  Let's look at clustering algorithms...
        #    b. Take the smallest distance for each file and assign it to a list of size N, representing the list
        #       of potential clusters (and also, it happens topics).

        # What we have - A list of file-topic proportion objects (for each file) which contain:
        #    a. MALLET-assigned ID
        #    b. File ID sans path and sans extension
        #    c. Full filepath
        #    d. Topic guide which matches topic id to proportion
        #    e. A list of (topic,topic proportion) pairs sorted by proportion in descending order

        # 1.

        # Index of list will match topic IDs
        top_proportions = {}
        for doc in file_topic_proportions:
            for topic_id in doc.topic_guide.keys():
                int_topic_id = int(topic_id)
                topic_proportion = doc.topic_guide[topic_id]
                if int_topic_id not in top_proportions.keys():
                    top_proportions[int_topic_id] = [doc.id, topic_proportion]
                else:
                    if top_proportions[int_topic_id][1] < topic_proportion:
                        top_proportions[int_topic_id][0] = doc.id
                        top_proportions[int_topic_id][1] = topic_proportion

        # 2.

        # Build a list of lists of Jensen-Shannon distances for each ideal distribution
        jsd_buckets = { key : {} for key in top_proportions.keys() }
        # for key in top_proportions.keys():
        #    jsd_buckets[key] = {}

        # Get a list of distributions for all files (Mallet file ID mapped to the full distribution)
        prob_distributions = {}
        for doc in file_topic_proportions:
            distribution = [doc.topic_guide[str(index)] for index in range(len(top_proportions))]
            # for index in range(0, len(top_proportions)):
            #    distribution.append(doc.topic_guide[str(index)])
            prob_distributions[doc.id] = distribution

        #for mfid in prob_distributions.keys():
        #    print 'File ID: {0} Distribution: {1}'.format(mfid, prob_distributions[mfid])

        # Build a list of JSD distances compared to that distribution for every other file
        for key in top_proportions.keys():

            top_file_probdistr = prob_distributions[top_proportions[key][0]]
            #print 'Topic {0} File ID: {1} Top Distribution: {2}'.format(key, top_proportions[key][0], prob_distributions[top_proportions[key][0]])

            for doc in file_topic_proportions:
                if doc.id == top_proportions[key][0]:
                    jsd_buckets[key][doc.id] = 0
                else:
                    jsd_buckets[key][doc.id] = jensen_shannon.jensen_shannon_distance(top_file_probdistr, prob_distributions[doc.id])

        # 3.

        # MALLET file ids will be assigned to the cluster buckets, keyed by topic id

        # Create a smallest distance list
        smallest_distances = {}
        for doc in file_topic_proportions:
            distances = []
            for topic_id in jsd_buckets.keys():
                #if ftp.id in jsd_buckets[topic_id].keys():
                distances.append([topic_id, jsd_buckets[topic_id][doc.id]])
            distances = sorted(distances, key=lambda x:x[1], reverse=False)
            #print 'Distances for {0}: {1}'.format(ftp.id, distances)
            smallest_distances[doc.id] = distances[0][0]

        topic_clusters = {}
        for topic_id in jsd_buckets.keys():
            topic_clusters[topic_id] = []
            for doc in file_topic_proportions:
                if topic_id == smallest_distances[doc.id]:
                    topic_clusters[topic_id].append(doc.id)

        file_count = 0
        for key in topic_clusters.keys():
            file_count += len(topic_clusters[key])
            #print 'Topic {0}, Corpus Proportion: {1} Length of Cluster list: {2}'.format(key, ctp_index[key], len(topic_clusters[key]))

        #print 'File count in cluster map: {0}'.format(file_count)

        distance2cdist_map = {}
        for topic_id in top_proportions.keys():
            file_id = top_proportions[int(topic_id)][0]
            doc_distribution = prob_distributions[file_id]
            #print 'Doc Dist Len: {0}\nDoc Dist: {1}'.format(len(doc_distribution), doc_distribution)
            distance = jensen_shannon.jensen_shannon_distance(corpus_topic_proportions, doc_distribution)
            distance2cdist_map[file_id] = distance

        # Create a JSON file for document clusters with the following format:
        #{
        #    clusters : {
        #
        #        <cluster_id> : {
        #        primary_topic : <topic_id>,
        #        primary_doc : <primary_doc_mallet_id>,
        #        distance2cdist : <distance to corpus topic distribution>
        #        linked_docs : [
        #            [<mallet_id>, <file_name>, <js_distance>]
        #            ...
        #        ]
        #
        #    }
        #}
        clusters_json = { }
        #print "Creating clusters_json\n==================="
        for topic_id in topic_clusters.keys():
            clusters_json[topic_id] = { "primary_topic" : topic_id,
                                        "primary_doc" : top_proportions[topic_id][0],
                                        "distance2cdist" : distance2cdist_map[top_proportions[topic_id][0]],
                                        "linked_docs" : [] }
            for mallet_file_id in topic_clusters[topic_id]:
                int_mfi = int(mallet_file_id)
                clusters_json[topic_id]["linked_docs"].append([int_mfi,
                                                              file_topic_proportions[int_mfi].fileid,
                                                              jsd_buckets[topic_id][mallet_file_id]])
            #print "clusters_json[{0}]:\n{1}\n===================".format(topic_id, clusters_json[topic_id])

        return clusters_json

    @staticmethod
    def Build_CorpusMapJSON(corpus_name, corpus_topics, file_topic_proportions, output_dir, cluster_distance_filename):

        '''
          TWiC JSON Hierarchy: Corpus -> Clusters -> Texts
          // Corpus
          {
              "name": <corpus_name>,
              "ideal_text":<file_id>, - Text with average topic distribution
              "distance2ideal":"NA",
              "topics" : {
                  <topic_id> : [<rank>, <topic_proportion>],...
              },
              // Clusters
              "children" : [
                  {
                    "name":<cluster_name>, - Topic number
                    "ideal_text":<file_id>, - Text where topic is strongest
                    "distance2ideal":<jd distance from cluster ideal text to corpus ideal text>
                    "topics" : {
                        <topic_id> : [<rank>, <topic_proportion>],...
                    },
                    // Texts
                    "children":[
                        {
                            "name":<text_name>,
                            "ideal_text":<file_id> - Self
                            "distance2ideal":<jd distance from this text to cluster ideal text>
                            "topics": {
                                <topic_id> : [<rank>, <topic_proportion>],...
                            },
                            "children":[]
                        },...
                    ]
                  },...
              ]
          }
        '''

        # 1. Define corpus level JSON
        twic_corpus_map = {
            "name" : corpus_name,
            "ideal_text" : "",
            "distance2ideal" : "",
            "topics" : {},
            "children" : []
        }

        # Build a ranked map of corpus-level topics for the JSON
        corpus_topic_pairs = [[topic, corpus_topics[topic]] for topic in corpus_topics.keys()]
        sorted_corpus_topic_pairs = sorted(corpus_topic_pairs, key=lambda x:x[1], reverse=True)
        ranked_corpus_topic_map = {}
        # for index in range(0, len(sorted_corpus_topic_pairs)):
        #     ranked_corpus_topic_map[sorted_corpus_topic_pairs[index][0]] = [index + 1, sorted_corpus_topic_pairs[index][1]]
        ranked_corpus_topic_map = { sorted_corpus_topic_pairs[index][0]:
                                    [index + 1, sorted_corpus_topic_pairs[index][1]]
                                    for index in range(len(sorted_corpus_topic_pairs))}
        twic_corpus_map["topics"] = ranked_corpus_topic_map

        '''# Determine average topic distribution for corpus
        doc_count = float(len(file_topic_proportions))
        topic_count = len(corpus_topic_proportions.keys())
        corpus_proportion_sums = {}
        avg_corpus_distribution = {}
        for doc in file_topic_proportions:
            for topic_id in topic_guide.keys():
                if topic_id not in corpus_proportion_sums.keys():
                    corpus_proportion_sums[topic_id] = 0.0
                corpus_proportion_sums[topic_id] += doc.topic_guide[topic_id]
        for topic_id in corpus_proportion_sums.keys():
            avg_corpus_distribution[topic_id] = corpus_proportion_sums[topic_id] / doc_count
        '''

        # Get corpus topic distribution sorted by topic id
        # corpus_topic_proportions = []
        # for index in range(0, len(corpus_topics.keys())):
        #    corpus_topic_proportions.append(corpus_topics[str(index)])
        corpus_topic_proportions = [corpus_topics[str(index)] for index in range(len(corpus_topics.keys()))]

        # Find the document whose distribution is closest to that corpus topic distribution for the corpus
        distances_to_ideal = []
        for doc in file_topic_proportions:
            doc_topics = sorted(doc.sorted_topic_list, key=lambda x:x[0], reverse=False)
            doc_distribution = []
            for index in range(0, len(doc_topics)):
                doc_distribution.append(0.0)
            for index in range(0, len(doc_topics)):
                int_topic_id = int(doc_topics[index][0])
                doc_distribution[int_topic_id] = doc_topics[index][1]
            #print 'Doc distr:{0}\nCorp distr:{1}'.format(doc_distribution, corpus_topic_proportions)
            distances_to_ideal.append([doc.id, jensen_shannon.jensen_shannon_distance(corpus_topic_proportions, doc_distribution)])
        distances_to_ideal = sorted(distances_to_ideal, key=lambda x:x[1], reverse=False)

        # Save the text closest to that average distribution and its distance from that average
        twic_corpus_map["ideal_text"] = distances_to_ideal[0][0]
        twic_corpus_map["distance2ideal"] = distances_to_ideal[0][1]

        # 2. Now work on defining the cluster level JSON
        cluster_distance_file = open(output_dir + cluster_distance_filename, 'r')
        cluster_distance_data = json.load(cluster_distance_file)

        # Determine topic clusters of the corpus
        clusters_json = TWiC_MalletInterpret.DetermineCorpusClusters(file_topic_proportions, corpus_topic_proportions)
        for cluster_topic_id in clusters_json.keys():

            # Define a new cluster child of the corpus map
            current_cluster_index = len(twic_corpus_map["children"])

            # Find the ideal file in the file topic proportion collection
            file_index = -1
            for index in range(len(file_topic_proportions)):
                if file_topic_proportions[index].id == clusters_json[cluster_topic_id]["primary_doc"]:
                    file_index = index
                    break
            if -1 == file_index:
                print 'Could not find primary doc {0} for cluster {1} in ftp collection. Skipping cluster.'.format(clusters_json[cluster_topic_id]["primary_doc"],
                                                                                                                   cluster_topic_id)
                continue

            # Build a ranked list of the cluster topics for the ideal text of this cluster
            # cluster_topic_pairs = []
            # for topic in file_topic_proportions[file_index].topic_guide:
            #     cluster_topic_pairs.append([topic,file_topic_proportions[file_index].topic_guide[topic]])
            cluster_topic_pairs = [[topic, file_topic_proportions[file_index].topic_guide[topic]]
                                   for topic in file_topic_proportions[file_index].topic_guide]
            sorted_cluster_topic_pairs = sorted(cluster_topic_pairs, key=lambda x:x[1], reverse=True)
            # ranked_cluster_topic_map = {}
            # for index in range(0, len(sorted_cluster_topic_pairs)):
            #     ranked_cluster_topic_map[sorted_cluster_topic_pairs[index][0]] = [index + 1, sorted_cluster_topic_pairs[index][1]]
            ranked_cluster_topic_map = { sorted_cluster_topic_pairs[index][0]:
                                         [index + 1, sorted_cluster_topic_pairs[index][1]]
                                         for index in range(len(sorted_cluster_topic_pairs))}

            # Define each cluster level JSON entry
            twic_corpus_map["children"].append({
                "name" : cluster_topic_id,
                "ideal_text" : clusters_json[cluster_topic_id]["primary_doc"],
                "distance2ideal" : clusters_json[cluster_topic_id]["distance2cdist"],
                "topics" : ranked_cluster_topic_map,
                "children" : []
            })

            # 3. Work on the text level JSON
            for entry in clusters_json[cluster_topic_id]["linked_docs"]:
                twic_corpus_map["children"][current_cluster_index]["children"].append({
                        "name" : entry[1],
                        "ideal_text" : entry[0],
                        "distance2ideal" : entry[2],
                        "topics" : file_topic_proportions[file_index].topic_guide,
                        "children" : []
                    })

        # 4. Write out corpus map to JSON
        with open(output_dir + 'twic_corpusmap.json','w') as output_file:
            output_file.write(json.dumps(twic_corpus_map))

    @staticmethod
    def Build_HTMLandJSONForText(text, output_dir, css_filename, current_tp, fwt_collection, topic_keys, color_list):

        file_id = text.GetFilename()
        output_html = open(output_dir + file_id + '.html', 'w')
        output_html.write('<html>\n')
        output_html.write('\t<head>\n')
        output_html.write('\t\t<link rel="stylesheet" type="text/css" href="{0}">\n'.format(css_filename))
        output_html.write('\t</head>\n')
        output_html.write('\t<body>\n')
        output_html.write('\t\t<div class="left">\n')
        output_html.write('\t\t\t<div class="title">\n')
        output_html.write('\t\t\t\t{0}<br>\n'.format(text.GetTitle()))
        output_html.write('\t\t\t</div>\n')
        output_html.write('\t\t\t{0}<br>\n'.format(text.GetPublication()))
        output_html.write('\t\t</div>\n')
        output_html.write('\t\t<div class="center">\n')

        # Create a JSON for each text (for mid-level twic, text tile)

        # Figure out the possible topics for each word based on the topic state file
        current_fwt = None
        for fwt in fwt_collection:
            fwt_file_id = Mallet_InterpretUtils.GetFilename(fwt.GetFilename())
            if fwt_file_id == file_id:
                current_fwt = fwt
                break

        # Convert text to JSON readable by the high-level TWiC visualization
        TWiC_MalletInterpret.ConvertTextToJSON(text, output_dir, current_fwt)

        # Read in the plain text file
        input_file = open(current_tp.filename, 'r')
        data = input_file.readlines()
        input_file.close()

        # If there was no state file entry, output HTML lines without topics
        used_topics_list = []
        if None == current_fwt:
            for line in data:
                output_line = ''
                words = line.split(' ')
                for actual_word_index in range(0, len(words)):
                    output_line += words[actual_word_index] + ' '
                output_line = output_line.strip()
                output_html.write('\t\t\t' + output_line + '<br>\n')
        else:
            statefile_word_index = 0
            for line in data:

                output_line = ''
                words = line.split(' ')
                if statefile_word_index < len(current_fwt.word_info):
                    lowercase_state_word = clean_word(current_fwt.word_info[statefile_word_index].word.lower())

                # Go through each word in the line
                for actual_word_index in range(0, len(words)):

                    # Lowercase only for comparison
                    lowercase_word = clean_word(words[actual_word_index].lower())

                    if statefile_word_index < len(current_fwt.word_info) and \
                       lowercase_word == lowercase_state_word:

                        output_line += '<span title="Topic {0}"><font color="{1}"><b>{2}</b></font></span>'.format(current_fwt.word_info[statefile_word_index].topic,
                            color_list[int(current_fwt.word_info[statefile_word_index].topic)], words[actual_word_index])

                        if current_fwt.word_info[statefile_word_index].topic not in used_topics_list:
                            used_topics_list.append(current_fwt.word_info[statefile_word_index].topic)

                        statefile_word_index += 1
                        if statefile_word_index < len(current_fwt.word_info):
                            lowercase_state_word = clean_word(current_fwt.word_info[statefile_word_index].word.lower())
                    else:
                        output_line += words[actual_word_index]

                    output_line += ' '

                output_line = output_line.strip()
                output_html.write('\t\t\t' + output_line + '<br>\n')

        output_html.write('\t\t</div><br><br>\n')
        output_html.write('\t\t<div class="topics">\n')
        for used_topic in used_topics_list:
            output_html.write('\t\t\t<font color="{0}">Topic {1}: {2}</font><br>\n'.format(color_list[int(used_topic)], used_topic, topic_keys.corpus_topic_words[used_topic]))
        output_html.write('\t\t</div>\n')
        output_html.write('\t</body>\n')
        output_html.write('</html>')
        output_html.close()

    @staticmethod
    def Build_TopicColorMapJSON(color_list, output_dir):

        # Construct a topic color map object
        # json_data = { "topics" : {} }
        # for index in range(0, len(color_list)):
        #     json_data["topics"][str(index)] = color_list[index]
        json_data = { }
        json_data["topics"] = { str(index): color_list[index] for index in range(len(color_list)) }

        # Output the JSON data to file
        with open(output_dir + 'topic_colors.json', 'w') as output_file:
            output_file.write(json.dumps(json_data))

    @staticmethod
    def Build_TopicWordsJSON(topic_keys, myoutput_dir):

        topics_json = { str(topic_id): topic_keys.corpus_topic_words[str(topic_id)]
                        for topic_id in range(len(topic_keys.corpus_topic_words)) }
        # for topic_id in range(0, len(topic_keys.corpus_topic_words)):
        #     topics_json[str(topic_id)] = topic_keys.corpus_topic_words[str(topic_id)]
        with open(myoutput_dir + 'topics.json','w') as topics_file:
            topics_file.write(json.dumps(topics_json))

    @staticmethod
    def Build_NewMalletJSONForClient(corpus_title, text_collection, tp_collection, topic_keys, color_list, output_dir):

        # Output JSON format
        # {
        #     "topic_info" : [ # indexed by int topic ID number
        #        [
        #            ["habit", "dash", "torn",...], # topic words
        #            022440" # hex color
        #        ],...
        #     ],
        #     "corpus_info" : [
        #        "Corpus Title",
        #        [0.5, 0.2, ...] # topic proportions [topic0,...topicN]
        #     ],
        #     "file_info" : {
        #       "0" : [ # indexed by str file ID number
        #           "Filename",
        #           "Text Title",
        #           [0.5, 0.2, ...], # topic proportions [topic0,...topicN]
        #           3, # stanza count
        #           65, # line count
        #           400 # word count
        #       ],...
        #     }
        # }

        # Indexers Info

        # "topic_info" (indexed by int topic ID)
        topic_info = "topic_info"
        TI_TopicWords = 0
        TI_Color = 1

        # "corpus_info"
        corpus_info = "corpus_info"
        CI_CorpusTitle = 0
        CI_TopicProportions = 1

        # "file_info" (indexed by str numeric file ID)
        file_info = "file_info"
        FI_Filename = 0
        FI_TextTitle = 1
        FI_TopicProportions = 2
        FI_StanzaCount = 3
        FI_LineCount = 4
        FI_WordCount = 5
        FI_FieldCount = 6

        json_output = { topic_info : [ ], corpus_info : ["", []], file_info : { } }
        topic_count = len(topic_keys.corpus_topic_proportions.keys())

        # Fill out topic_info and corpus_info
        json_output[corpus_info][CI_CorpusTitle] = corpus_title
        json_output[corpus_info][CI_TopicProportions] = [topic_keys.corpus_topic_proportions[str(topic_index)]
                                                         for topic_index in range(topic_count)]
        json_output[topic_info] = [[topic_keys.corpus_topic_words[str(topic_index)], color_list[topic_index]]
                                   for topic_index in range(topic_count)]

        # Fill out file_info
        for tp in tp_collection:
            json_output[file_info][tp.fileid] = []
            json_output[file_info][tp.fileid] = [0 for index in range(FI_FieldCount)]
            json_output[file_info][tp.fileid][FI_Filename] = tp.filename
            json_output[file_info][tp.fileid][FI_TopicProportions] = []
            for topic_index in range(0, topic_count):
                json_output[file_info][tp.fileid][FI_TopicProportions].append(tp.topic_guide[str(topic_index)])
        for text in text_collection:
            text_filename = text.GetFilename()
            for fileid in json_output[file_info].keys():
                if text_filename == json_output[file_info][fileid][FI_Filename]:
                    json_output[file_info][fileid][FI_TextTitle] = text.GetTitle()

        # Still have to fill out
        # FI_StanzaCount = 3
        # FI_LineCount = 4
        # FI_WordCount = 5

        # Output JSON
        with open(output_dir + "malletcorpus_info_forvizclient.json", "w") as output_file:
            output_file.write(json.dumps(json_output))

    @staticmethod
    def InterpretMalletOutput(mallet_script):

        print 'Interpreting MALLET output for visualization...'

        myoutput_dir = '/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/output/myviz-output/'

        print '\tReading in MALLET output...'

        ####### 1. Reading dickinson.topics.tsv

        tp_collection = mallet_script.GetTopicsFileData()

        ###### 2. Reading dickinson.keys.tsv

        topic_keys = mallet_script.GetKeysFileData()

        ###### 3. Reading dickinson.topic-state.tsv

        fwt_collection = mallet_script.GetStateFileData()

        ###### 4. Build a text object for each text

        print '\tBuilding text objects...'

        # start_time = int(round(time.time() * 1000))
        # textobj_collection = TWiC_MalletInterpret.Build_TextObjects(Poem, mallet_script, tp_collection)
        # end_time = int(round(time.time() * 1000))
        # print 'Unoptimized: {0}ms'.format(end_time - start_time)

        # start_time = int(round(time.time() * 1000))
        # text_obj_collection_opt = TWiC_MalletInterpret.Build_TextObjects_Opt(Poem, mallet_script, tp_collection)
        textobj_collection = TWiC_MalletInterpret.Build_TextObjects_Opt(Poem, mallet_script, tp_collection)
        # end_time = int(round(time.time() * 1000))
        # print 'Optimized: {0}ms'.format(end_time - start_time)

        ###### 5. Generate a list of unique colors for each topic

        print '\tCreating color list...'

        color_list = Color_Utils.Get_UniqueColorList(len(topic_keys.corpus_topic_proportions.keys()))

        ###### 6. Build HTML and JSON files for each text for low and mid level TWiC representations

        print '\tCreating HTML and JSON files for TWiC views of texts...'

        for text in textobj_collection:
            current_tp = None
            for tp in tp_collection:
                if text.GetFilename() == Mallet_InterpretUtils.GetFilename(tp.filename):
                    current_tp = tp
                    break
            TWiC_MalletInterpret.Build_HTMLandJSONForText(text, myoutput_dir, '{0}.css'.format(mallet_script.corpus_name), \
                                     current_tp, fwt_collection, topic_keys, color_list)

        ###### 7. Build JSON files for visualization

        print '\tBuilding JSON map files for TWiC visualization...'

        # Build a json that shows the hierarchy of Corpus -> Text clusters -> Texts based on Jensen-Shannon Distance
        TWiC_MalletInterpret.Build_CorpusMapJSON(mallet_script.corpus_title, topic_keys.corpus_topic_proportions, tp_collection, myoutput_dir, 'clusters.json')

        # Output a JSON of the topic-color list
        TWiC_MalletInterpret.Build_TopicColorMapJSON(color_list, myoutput_dir)

        # Generate topic list JSON based on the used_topics_list
        TWiC_MalletInterpret.Build_TopicWordsJSON(topic_keys, myoutput_dir)

        # New JSON format for client side
        TWiC_MalletInterpret.Build_NewMalletJSONForClient(mallet_script.corpus_title, textobj_collection, tp_collection, topic_keys, color_list, myoutput_dir)


