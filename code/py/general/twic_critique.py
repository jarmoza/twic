import collections
import json
import os
import sys

from twic_malletscript import TWiC_MalletScript

def load_src(name, fpath):
    import os, imp
    return imp.load_source(name, os.path.join(os.path.dirname(__file__), fpath))

load_src("dickinson_twic_poem", "../dickinson/dickinson_twic_poem.py")
from dickinson_twic_poem import TWiC_Poem

from twic_malletinterpret import TWiC_MalletInterpret


colors = [u'#1c48ff', u'#48ff56', u'#ff7ae0', u'#540c8c', u'#9870ff',
          u'#ffb218', u'#44b0d4', u'#ff5460', u'#ff903c', u'#80ff60',
          u'#ffcc7c', u'#28ff42', u'#fff8ae', u'#a874ff', u'#ff448c',
          u'#ffec8c', u'#ff607c', u'#98ff24', u'#84c4e0', u'#7c38ff',
          u'#a8ff92', u'#ffe05e', u'#ff6c8e', u'#e0ff9e', u'#ffa444',
          u'#301034', u'#e07c84', u'#9490ff', u'#489cff', u'#6cffa8',
          u'#e088ff', u'#502c44', u'#d0ffa0', u'#ffc04e', u'#e048ff',
          u'#5cffb4', u'#c0ff5c', u'#b4ffd4', u'#a8e0ff', u'#8474ff',
          u'#e0e464', u'#5080ff', u'#9c88ff', u'#ecff56', u'#ff04c4',
          u'#e0bcd4', u'#c0d4a0', u'#44c4ff', u'#b0bcff', u'#cc0004',
          u'#9064a8', u'#c89430', u'#08ffb8', u'#a060c4', u'#9ca0ff',
          u'#04c8ff', u'#60c8ff', u'#9848ff', u'#b04494', u'#809448',
          u'#eca078', u'#4c68ff', u'#8044f0', u'#a4c4ff', u'#5c94ff',
          u'#8cffa6', u'#d0e05c', u'#c8b4f0', u'#4c54ff', u'#7078ff',
          u'#f084ff', u'#18ff86', u'#b454ff', u'#c06cff', u'#9084d4',
          u'#7cf0ff', u'#c0c4b4', u'#94b8f8', u'#b4d0b4', u'#bce454',
          u'#3cff70', u'#8cdcff', u'#48dc40', u'#c0a060', u'#ff2878',
          u'#f0ac5c', u'#b46090', u'#607cff', u'#403418', u'#70b4ff',
          u'#649cff', u'#d06ccc', u'#94d4f0', u'#7864ff', u'#c478ff',
          u'#88b0e0', u'#70e498', u'#d440ff', u'#40e4cc', u'#58d4e8']

def CreateMallet():

    # Create a TWiC_MalletScript object
    mallet_script = TWiC_MalletScript()

    # Set up variables necessary for script run
    mallet_script.TextClass = TWiC_Poem

    # Relative location of TWiC root directory
    twic_relative_root = "../../../"

    # For GatherTexts
    mallet_script.GatherTexts = TWiC_Poem.GatherPoems
    mallet_script.tei_source = twic_relative_root + "data/dickinson/input/tei/"
    mallet_script.corpus_source_dir = twic_relative_root + "data/dickinson/input/txt/"

    # For RunMallet
    mallet_script.corpus_name = "dickinson"
    mallet_script.output_dir = twic_relative_root + "data/dickinson/output/mallet/"
    mallet_script.stopwords_dir = twic_relative_root + "data/dickinson/output/stopwords/"
    mallet_script.lda_dir = twic_relative_root + "lib/mallet/"
    mallet_script.script_dir = os.getcwd()

    # Default topic and interval count
    mallet_script.num_topics = "100"
    mallet_script.num_intervals = "1000"

    # For InterpretMalletOutput()
    mallet_script.BuildOutputNames()
    mallet_script.corpus_title = "The Poems of Emily Dickinson"
    mallet_script.InterpretMalletOutput = TWiC_MalletInterpret.InterpretMalletOutput

    # Return the now-configured TWiC_MalletScript object
    return mallet_script


def main(args):

    # Create a TWiC_MalletScript object
    mallet_script = CreateMallet()

    # Get keys file
    topic_keys = mallet_script.GetKeysFileData()

    # Get text level topic data
    file_topics_data = mallet_script.GetTopicsFileData("2.0.8")

    # Get topic word weights
    topic_word_weights = mallet_script.GetTopicWordWeights()

    # Create critique json
    poem_fileid = args[1]

    # Get critique input data from individual text
    twic_relative_root = "../../../"
    critique_dir = twic_relative_root + "data/output/twic/"
    #critique_filename = "627_critique.json"
    critique_filename = "{0}_critique.json".format(poem_fileid)
    with open(critique_dir + critique_filename, "rU") as crit_json:
        critique_data = json.load(crit_json)
    topic_words = critique_data[0]["topic_words"]
    topic_ids = critique_data[0]["topic_ids"]

    # Output various formats of the data in stylized HTML
    with open(critique_dir + (critique_filename.split(".")[0]) + ".html", "w") as output_file:

        output_file.write("<html>")
        output_file.write("<head></head>")
        output_file.write("<body style=\"background-color:#505050; font-family: Inconsolata;\">")

        # Output topics in the order they are introduced
        topics_seen = []
        output_file.write("<h2 style=\"color:white\">Topics by Order of Introduction</h2><br><br>")
        for index in range(len(topic_ids)):
            for index2 in range(len(topic_ids[index])):
                if topic_ids[index][index2] not in topics_seen:
                    topics_seen.append(topic_ids[index][index2])
                    topic_key_str = ""
                    for word in topic_keys.corpus_topic_words[str(topic_ids[index][index2])]:
                        topic_key_str += word + " "
                    if index > 0 or index2 > 0:
                        output_file.write("<span style=\"display:block; color:{0}; width:50%;\">Topic {1}: {2}</span><br>".format(colors[topic_ids[index][index2]],
                                                                                                    topic_ids[index][index2],
                                                                                                    topic_key_str))
                    else:
                        output_file.write("<span style=\"display:block; color:{0}; width:50%; background-color:#6E6E6E;\">Topic {1}: {2}</span><br>".format(colors[topic_ids[index][index2]],
                                                                                                    topic_ids[index][index2],
                                                                                                    topic_key_str))

        output_file.write("<br><br><br>")

        # Output actual topic words in the text in order
        output_file.write("<h2 style=\"color:white\">Topic Words in Order</h2><br>")
        for index in range(len(topic_words)):
            words_str = ""
            if 0 == len(topic_words[index]):
                words_str = "<span style=\"color:white;\">no topic words</span>"
            for index2 in range(len(topic_words[index])):
                words_str += "<span style=\"color:{0};\">{1}</span>".format(colors[topic_ids[index][index2]], topic_words[index][index2]) + " "
            output_file.write(words_str.strip() + "<br>")
        output_file.write("<br><br><br>")

        # Output text level topic weights of the topic (words) in the text
        output_file.write("<h2 style=\"color:white\">Topic Weights of Topics in the Text</h2><p><br>")
        total_proportions = 0
        topic_percent_dict = {}
        top_topic_percents = []
        for ftp in file_topics_data:
            #if "627" == ftp.fileid:
            if poem_fileid == ftp.fileid:
                for index in range(len(ftp.sorted_topic_list)):
                    total_proportions += ftp.sorted_topic_list[index][1]
        for ftp in file_topics_data:
            #if "627" == ftp.fileid:
            if poem_fileid == ftp.fileid:
                for index in range(len(ftp.sorted_topic_list)):
                    topic_percent_dict[ftp.sorted_topic_list[index][0]] = (ftp.sorted_topic_list[index][1] * 100) / total_proportions
        all_topic_ids = []
        for index in range(len(topic_ids)):
            for index2 in range(len(topic_ids[index])):
                if topic_ids[index][index2] not in all_topic_ids:
                    all_topic_ids.append(topic_ids[index][index2])
        current_percent_index = 0
        top_topics_sorted_longlist = []
        for index in range(len(ftp.sorted_topic_list)):
            if int(ftp.sorted_topic_list[index][0]) in all_topic_ids:
                top_topics_sorted_longlist.append([ftp.sorted_topic_list[index][0], topic_percent_dict[ftp.sorted_topic_list[index][0]]])
                top_topic_percents.append(["<span style=\"color:{0};\">Topic {1}: {2:.3f}%</span>".format(
                                                                   colors[int(ftp.sorted_topic_list[index][0])],
                                                                   ftp.sorted_topic_list[index][0],
                                                                   topic_percent_dict[ftp.sorted_topic_list[index][0]]),
                                                                   topic_percent_dict[ftp.sorted_topic_list[index][0]]])
                current_percent_index += 1
        top_topic_percents = sorted(top_topic_percents, key=lambda x:x[1], reverse=True)
        top_topics_sorted_longlist = sorted(top_topics_sorted_longlist, key=lambda x:x[1], reverse=True)
        for index in range(current_percent_index):
            output_file.write(top_topic_percents[index][0] + "<br>")
        output_file.write("<br><br><br>")

        # Output topics in order of words and arrangement of original text
        output_file.write("<h2 style=\"color:white\">Topic IDs in Order of the Original Text</h2><br>")
        for index in range(len(topic_ids)):
            if 0 == len(topic_ids[index]):
                output_file.write("<span style=\"color:white;\">no topic IDs</span>")
            for index2 in range(len(topic_ids[index])):
                output_file.write("<span style=\"color:{0};\">{1}</span>".format(colors[topic_ids[index][index2]], topic_ids[index][index2]))
                if index2 < (len(topic_ids[index]) - 1):
                    output_file.write("<span style=\"color:white;\">,&nbsp;</span>")
            output_file.write("<br>")
        output_file.write("<br><br><br>")

        # Output topics words in order and by size relative to topic-text importance
        text_topic_proportions = {}
        for ftp in file_topics_data:
            #if "627" == ftp.fileid:
            if poem_fileid == ftp.fileid:
                for index in range(len(ftp.sorted_topic_list)):
                    if int(ftp.sorted_topic_list[index][0]) in all_topic_ids:
                        text_topic_proportions[ftp.sorted_topic_list[index][0]] = ftp.sorted_topic_list[index][1]

        output_file.write("<h2 style=\"color:white\">Topic Words in Order of the Original Text and Sized by Their Topic's Importance to the Text</h2><br>")
        for index in range(len(topic_words)):
            words_str = ""
            if 0 == len(topic_words[index]):
                words_str = "<span style=\"color:white; font-size:12;\">no topic words</span>"
            for index2 in range(len(topic_words[index])):
                font_size = max(12, 24 * 10 * float(text_topic_proportions[str(topic_ids[index][index2])]))
                words_str += "<span style=\"color:{0}; font-size:{1};\">{2}&nbsp;</span>".format(colors[topic_ids[index][index2]],
                                                                                           font_size,
                                                                                           topic_words[index][index2].strip())
            output_file.write(words_str + "<br>")
        output_file.write("<br><br><br>")

        # Output topics words in order and by size relative to topic-topic word importance
        output_file.write("<h2 style=\"color:white\">Topic Words in Order of the Original Text and Sized by Importance to their Topic</h2><br>")
        for index in range(len(topic_words)):
            words_str = ""
            for index2 in range(len(topic_words[index])):
                #font_size = max(12, 8 * topic_word_weights[str(topic_ids[index][index2])][topic_words[index][index2].lower()])
                font_size = max(6, 8 * topic_word_weights[str(topic_ids[index][index2])][topic_words[index][index2].lower()])
                words_str += "<span style=\"color:{0}; font-size:{1};\">{2}</span> ".format(colors[topic_ids[index][index2]],
                                                                                           font_size,
                                                                                           topic_words[index][index2].strip())
            output_file.write(words_str + "<br>")
        output_file.write("<br><br><br>")


        # Output topics words in order and by size relative to topic importance
        output_file.write("<h2 style=\"color:white\">Topic Words in Order of the Original Text and Sized by Both Importance to their Topic</h2>")
        output_file.write("<h2 style=\"color:white\">and by Their Topic's Importance to the Text</h2><br>")
        for index in range(len(topic_words)):
            words_str = ""
            for index2 in range(len(topic_words[index])):
                font_size = max(8, 24 * (10*topic_keys.corpus_topic_proportions[str(topic_ids[index][index2])]) * topic_word_weights[str(topic_ids[index][index2])][topic_words[index][index2].lower()])
                words_str += "<span style=\"color:{0}; font-size:{1};\">({2}: {3:.2f})</span> ".format(colors[topic_ids[index][index2]],
                                                                                           font_size,
                                                                                           topic_words[index][index2].strip(),
                                                                                           100 * topic_keys.corpus_topic_proportions[str(topic_ids[index][index2])] * topic_word_weights[str(topic_ids[index][index2])][topic_words[index][index2].lower()])

            output_file.write(words_str + "<br>")
        output_file.write("<br><br><br>")


        # Output topic word weights in order of the words in the original text
        output_file.write("<h2 style=\"color:white;\">Topic Word Weights in Order of the Original Text</h2><br>")
        for index in range(len(topic_words)):
            weights_str = ""
            for index2 in range(len(topic_words[index])):
                weights_str += "<span style=\"color:{0};\">({1}: {2:.3f})</span> ".format(colors[topic_ids[index][index2]],
                                                                               topic_ids[index][index2], topic_word_weights[str(topic_ids[index][index2])][topic_words[index][index2].lower()])
            output_file.write(weights_str + "<br>")
        output_file.write("<br><br><br>")

        # Output topic words with composite weighting but ordered by text level topic prominence
        output_file.write("<h2 style=\"color:white;\">Topic Words under Composite Weighting ordered by Text Topic Weight</h2>")

        # Build a word dict to properly order the topic words
        composite_word_dict = {}
        for index in range(len(topic_words)):
            for index2 in range(len(topic_words[index])):
                if topic_ids[index][index2] not in composite_word_dict:
                    composite_word_dict[topic_ids[index][index2]] = []
                composite_word_dict[topic_ids[index][index2]].append([topic_words[index][index2], 100 * topic_keys.corpus_topic_proportions[str(topic_ids[index][index2])] * topic_word_weights[str(topic_ids[index][index2])][topic_words[index][index2].lower()]])

        # Sort each list in the composite dictionary by their composite weights
        for key in composite_word_dict.keys():
            composite_word_dict[key] = sorted(composite_word_dict[key], key=lambda x:x[1], reverse=True)

        # Create an ordered list of topics based not on the text level weight but instead on composite weight sum for each topic
        composite_list_weightordered = []
        for index in range(len(top_topics_sorted_longlist)):
            current_topic_id = int(top_topics_sorted_longlist[index][0])
            weight_sum = 0
            for index2 in range(len(composite_word_dict[current_topic_id])):
                weight_sum += composite_word_dict[current_topic_id][index2][1]
            composite_list_weightordered.append((current_topic_id, weight_sum))
        composite_list_weightordered = sorted(composite_list_weightordered, key=lambda x:x[1], reverse=True)

        # Output the entries of the composite word dict by order of text-level topic weights
        for index in range(len(composite_list_weightordered)):
            current_topic_id = int(composite_list_weightordered[index][0])
            if current_topic_id == 3:
                topic_word_str = "<span style=\"color:{0}; background-color:#6E6E6E;\">Topic {1}: </span>".format(colors[current_topic_id], current_topic_id)
            else:
                topic_word_str = "<span style=\"color:{0};\">Topic {1}: </span>".format(colors[current_topic_id], current_topic_id)
            for index2 in range(len(composite_word_dict[current_topic_id])):
                if current_topic_id == 3:
                    topic_word_str += "<span style=\"color:{0}; background-color:#6E6E6E;\">{1} ({2:.2f})&nbsp;</span>".format(colors[current_topic_id], composite_word_dict[current_topic_id][index2][0], composite_word_dict[current_topic_id][index2][1])
                else:
                    topic_word_str += "<span style=\"color:{0};\">{1} ({2:.2f})&nbsp;</span>".format(colors[current_topic_id], composite_word_dict[current_topic_id][index2][0], composite_word_dict[current_topic_id][index2][1])
            output_file.write(topic_word_str + "<br>")
        output_file.write("<br><br><br>")

        output_file.write("</body>")
        output_file.write("</html>")


if "__main__" == __name__:
    main(sys.argv)


