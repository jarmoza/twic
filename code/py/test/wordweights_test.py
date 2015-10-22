import operator
import json

def GetTopicWordWeights(filepath, normalize=True, precision=4):

    # Create a table of all wordweights from the topic model
    full_wordweights_table = {}
    wordweight_filehandle = open(filepath, "r")
    wordweight_filelines = wordweight_filehandle.readlines()
    wordweight_filehandle.close()
    for line in wordweight_filelines:
        parts = line.split("\t")
        if parts[0] not in full_wordweights_table:
            full_wordweights_table[parts[0]] = {}
        full_wordweights_table[parts[0]][parts[1]] = float(parts[2].strip())

    # Filter wordweights by removing most present weight
    # (these will be words next to zero probability of appearing in the topic)
    for topic_id in full_wordweights_table:

        weight_buckets = {}
        for word in full_wordweights_table[topic_id]:
            if full_wordweights_table[topic_id][word] not in weight_buckets:
                weight_buckets[full_wordweights_table[topic_id][word]] = 0
            else:
                weight_buckets[full_wordweights_table[topic_id][word]] += 1

        mostfreq_weight = max(weight_buckets.iteritems(), key=operator.itemgetter(1))[0]
        remove_list = [word for word in full_wordweights_table[topic_id] if mostfreq_weight == full_wordweights_table[topic_id][word]]
        for word in remove_list:
            del full_wordweights_table[topic_id][word]

    # Normalize (and turn into proportion / 100%) the word weights if requested
    if normalize:
        for topic_id in full_wordweights_table:
            weightsum = 0
            for word in full_wordweights_table[topic_id]:
                weightsum += full_wordweights_table[topic_id][word]
            for word in full_wordweights_table[topic_id]:
                full_wordweights_table[topic_id][word] = 100 * (full_wordweights_table[topic_id][word] / weightsum)
                if None != precision:
                    full_wordweights_table[topic_id][word] = float(("{0:." + str(precision) + "}").format(full_wordweights_table[topic_id][word]))

    # Return word weights table that has eliminated words not "in" each topic
    return full_wordweights_table


filedir = "/Users/PeregrinePickle/Documents/Programming/D3Playground/projects/twic/data/output/mallet/"
filename = "dickinson.wordweights.tsv"

ww_table = GetTopicWordWeights(filedir + filename, True, 2)

# with open(filedir + 'result.json', 'w') as fp:
#     json.dump(ww_table, fp)


# keycount = 0
# for topic_id in ww_table:
#     keycount += len(ww_table[topic_id].keys())
# print "Number of keys: " + str(keycount)

sorted_t0_table = sorted(ww_table["0"].items(), key=operator.itemgetter(1), reverse=True)
for index in range(len(sorted_t0_table)):
    print "{0}: {1}".format(sorted_t0_table[index][0], sorted_t0_table[index][1])