import json
import sys

topicmodel_json_dir = "/Users/PeregrinePickle/Documents/Programming/D3Playground/projects/twic/data/dickinson/input/json/"

def main(args):

    file_id = args[1]
    corpus_info_filename = "twic_corpusinfo.json"

    with open(topicmodel_json_dir + corpus_info_filename, "rU") as corpus_info_file:
        ci_json = json.load(corpus_info_file)

    file_info = ci_json["file_info"][file_id]
    title = file_info[1]
    topic_weights = file_info[2]
    topic_info = ci_json["topic_info"]

    # Needs dict
    topic_weights_tup = []
    for index in range(len(topic_weights)):
        topic_weights_tup.append((index, topic_weights[index]))
    topic_weights_tup = sorted(topic_weights_tup, key=lambda x:x[1], reverse=True)

    print "Text: {0}".format(title)
    print "Topics: "
    for index in range(len(topic_weights_tup)):
        print "{0}: {1}".format(topic_weights_tup[index][0], topic_weights_tup[index][1])


if __name__ == "__main__":
    main(sys.argv)