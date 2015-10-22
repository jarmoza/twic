import json
import copy

# JSON file handling
json_filepath = "/Users/PeregrinePickle/Documents/Programming/D3Playground/projects/twic/data/input/json/"
json_filename = "twic_corpusmap.json"
json_file = open(json_filepath + json_filename, "r")
json_data = json.load(json_file)
json_file.close()


# Load the topic maps for the corpus, text clusters, and texts
topic_count = len(json_data["topics"].keys())

corpus_topic_map = {}
for topic_key in json_data["topics"]:
    corpus_topic_map[topic_key] = json_data["topics"][topic_key][1]

clusters_topic_mapmap = {}
for cluster_key in json_data["children"].keys():
    clusters_topic_mapmap[cluster_key] = {}
    for topic_key in json_data["children"][cluster_key]["topics"]:
        clusters_topic_mapmap[cluster_key][topic_key] = json_data["children"][cluster_key]["topics"][topic_key][1]

texts_by_cluster_mapmap = {}
for cluster_key in json_data["children"].keys():
    texts_by_cluster_mapmap[cluster_key] = {}
    for file_index in range(len(json_data["children"][cluster_key]["children"])):
        texts_by_cluster_mapmap[cluster_key][file_index] = copy.deepcopy(json_data["children"][cluster_key]["children"][file_index]["topics"])

texts_topic_mapmap = {}
for cluster_key in json_data["children"].keys():
    for text_index in range(len(json_data["children"][cluster_key]["children"])):
        texts_topic_mapmap[json_data["children"][cluster_key]["children"][text_index]["name"]] = copy.deepcopy(json_data["children"][cluster_key]["children"][text_index]["topics"])


# (1) Average corpus topic distribution
#  (a) How does this compare to the average topic distribution of all corpus cluster average topic distributions?

print "==========================="
print "Average corpus topic distribution comparisons"

corpus_avg_topic_distribution_precalc = []
corpus_cluster_avg_topic_distribution = []
for index in range(topic_count):
    corpus_avg_topic_distribution_precalc.append(json_data["topics"][str(index)][1])
    corpus_cluster_avg_topic_distribution.append(0)
for cluster_key in clusters_topic_mapmap.keys():
    for topic_id in range(topic_count):
        corpus_cluster_avg_topic_distribution[topic_id] += clusters_topic_mapmap[cluster_key][str(topic_id)]
for topic_id in range(topic_count):
    corpus_cluster_avg_topic_distribution[topic_id] /= topic_count

corpus_topic_proportion_sum_precalc = 0
corpus_cluster_topic_proportion_sum = 0
for topic_id in range(topic_count):
    print "Topic {0} =================".format(topic_id)
    print "Corpus precalc: {0}".format(corpus_topic_map[str(topic_id)])
    print "Corpus cluster: {0}".format(corpus_cluster_avg_topic_distribution[topic_id])
    corpus_topic_proportion_sum_precalc += corpus_topic_map[str(topic_id)]
    corpus_cluster_topic_proportion_sum += corpus_cluster_avg_topic_distribution[topic_id]

print "Corpus topic proportion sum precalc: {0}".format(corpus_topic_proportion_sum_precalc)
print "Corpus cluster topic proportion sum: {0}".format(corpus_cluster_topic_proportion_sum)

print "==============================="
print "Percents"

corpus_avg_topic_dist_percent = [0 for index in range(topic_count)]
corpus_cluster_avg_topic_dist_percent = [0 for index in range(topic_count)]
corpus_percent_sum_check = 0
corpus_cluster_percent_sum_check = 0
c2cc_delta_avg = 0
for topic_id in range(topic_count):
    corpus_avg_topic_dist_percent[topic_id] = (corpus_avg_topic_distribution_precalc[topic_id] * 100) / corpus_topic_proportion_sum_precalc
    corpus_cluster_avg_topic_dist_percent[topic_id] = (corpus_cluster_avg_topic_distribution[topic_id] * 100) / corpus_cluster_topic_proportion_sum
    print "Topic {0} =================".format(topic_id)    
    print "Corpus precalc: {0}".format(corpus_avg_topic_dist_percent[topic_id])
    print "Corpus cluster: {0}".format(corpus_cluster_avg_topic_dist_percent[topic_id])
    print "Corpus to Corpus cluster topic delta: {0}".format(abs(corpus_avg_topic_dist_percent[topic_id] - corpus_cluster_avg_topic_dist_percent[topic_id]))    
    corpus_percent_sum_check += corpus_avg_topic_dist_percent[topic_id]
    corpus_cluster_percent_sum_check += corpus_cluster_avg_topic_dist_percent[topic_id]
    c2cc_delta_avg += abs(corpus_avg_topic_dist_percent[topic_id] - corpus_cluster_avg_topic_dist_percent[topic_id])

print "Corpus percent sum check: {0}".format(corpus_percent_sum_check)
print "Corpus cluster percent sum check: {0}".format(corpus_cluster_percent_sum_check)
print "Average delta: {0}".format(c2cc_delta_avg / topic_count)

# ANSWERS: (a) They differ (by an average of 0.0771829509948% in the current model).


# (2) Average corpus cluster topic distribution
#   (a) How does this compare to the average topic distribution of recalculated average topic distribution
#       of the texts listed underneath of it?
# Comparing: json_data["children"][cluster_key]["topics"]
# to recalc topic dist of each json_data["children"][cluster_key]["children"][file_index]["topics"]

print "==========================="
print "Average corpus cluster topic distribution comparisons"

cluster_avg_topic_dist_bytext_recalc = {}
for cluster_key in clusters_topic_mapmap.keys():
    cluster_avg_topic_dist_bytext_recalc[cluster_key] = [0 for index in range(topic_count)]
    for file_index in range(len(texts_by_cluster_mapmap[cluster_key].keys())):
        for topic_id in range(topic_count):
            cluster_avg_topic_dist_bytext_recalc[cluster_key][topic_id] += texts_by_cluster_mapmap[cluster_key][file_index][str(topic_id)][1]
    for topic_id in range(topic_count):
        cluster_avg_topic_dist_bytext_recalc[cluster_key][topic_id] /= topic_count

for cluster_key in clusters_topic_mapmap.keys():
    print "Cluster {0} =================".format(cluster_key)
    for topic_id in range(topic_count):
        print "Topic {0} =================".format(cluster_key)
        print "Corpus cluster precalc: {0}".format(json_data["children"][cluster_key]["topics"][str(topic_id)][1])
        print "Corpus cluster recalc: {0}".format(cluster_avg_topic_dist_bytext_recalc[cluster_key][topic_id])

# ANSWERS: (a) They match. This is because this average stored in the JSON is precalculated 
#              in TWiC_MalletInterpret.DetermineCorpusClusters_Avg().


# (3) Average text cluster topic distribution
#   (a) Is this precalculated?
#   (b) If so/not, how does this compare to the precalculated average corpus cluster topic distribution?
#   (c) If so/not, how does this compare to the recalculated average topic distribution of the texts within it?

# ANSWERS: (a) and (b) Yes, the TWiC bullseye for the text cluster is the corpus cluster averaged topic distribution
#          (c) They are the same, as shown above in part 2


# (4) Average text topic distribution
#   (a) How does this value, recalculated, compare to the average corpus topic distribution?

print "==========================="
print "Text topic distribution comparisons"

text_avg_topic_distribution = [0 for index in range(topic_count)]
text_percent_sum = 0
for topic_id in range(topic_count):
    for text_key in texts_topic_mapmap.keys():
        text_avg_topic_distribution[topic_id] += texts_topic_mapmap[text_key][str(topic_id)][1]
    text_avg_topic_distribution[topic_id] /= len(texts_topic_mapmap.keys())
    text_percent_sum += text_avg_topic_distribution[topic_id]

c2t_delta_avg = 0
for topic_id in range(topic_count):
    print "Topic {0} =================".format(topic_id)    
    print "Corpus precalc percent: {0}".format(corpus_avg_topic_dist_percent[topic_id] )
    text_percent = (text_avg_topic_distribution[topic_id] * 100) / text_percent_sum
    print "Text recalc percent: {0}".format(text_percent)
    print "Corpus to text topic delta: {0}".format(abs(corpus_avg_topic_dist_percent[topic_id] - text_percent))
    c2t_delta_avg += abs(corpus_avg_topic_dist_percent[topic_id] - text_percent) 
c2t_delta_avg /= topic_count
print "Average Corpus to Text Topic Delta: {0}".format(c2t_delta_avg)

# ANSWERS: (a) They differ (by an average of 0.0771829509948% in the current model).
#              And they differ by the precise amount (0.0771829509948%) the corpus clusters differ from
#              the average corpus topic distribution. This is expected as the corpus cluster topic
#              distribution is garnered from the text topic distributions.

# CONCLUSION: Text-level and Corpus-level topic distributions differ very slightly - in the case of this
#             model, the topics differ by an average of ~0.077%, so less than 1%

# (5) What is the top topic of each corpus/text cluster?
clusters_top_topic_map = {}
for cluster_key in clusters_topic_mapmap.keys():
    clusters_top_topic_map[cluster_key] = [0, cluster_avg_topic_dist_bytext_recalc[cluster_key][0]]
    for topic_id in range(topic_count):
        if cluster_avg_topic_dist_bytext_recalc[cluster_key][topic_id] > clusters_top_topic_map[cluster_key][1]:
            clusters_top_topic_map[cluster_key] = [topic_id, cluster_avg_topic_dist_bytext_recalc[cluster_key][topic_id]]

for cluster_key in clusters_top_topic_map.keys():
    if cluster_key != str(clusters_top_topic_map[cluster_key][0]):
        print "Cluster {0}, Top Topic: {1}".format(cluster_key, clusters_top_topic_map[cluster_key][0])

# ANSWERS: They are identical as per the JSON. If they are different, the error is in the client-side JS.


# # Determine the average of topic distributions
# corpus_avg_topic_distribution = []
# cluster_avg_topic_distribution = []
# text_avg_topic_distribution = []

# for index in range(topic_count):

#     # Corpus average for this topic
#     corpus_avg_topic_distribution.append(corpus_topic_map[str(index)])

#     # Text clusters average for this topic
#     cluster_avg_topic_distribution.append(0)
#     for cluster_key in clusters_topic_mapmap.keys():
#         cluster_avg_topic_distribution[index] += clusters_topic_mapmap[cluster_key][str(index)]
#     cluster_avg_topic_distribution[index] /= len(clusters_topic_mapmap.keys())

#     # Texts average for this topic
#     text_avg_topic_distribution.append(0)
#     for text_key in texts_topic_mapmap.keys():
#         text_avg_topic_distribution[index] += texts_topic_mapmap[text_key][str(index)][1]
#     text_avg_topic_distribution[index] /= len(texts_topic_mapmap.keys())

# for index in range(topic_count):

#     print "================================"
#     print "Topic {0}".format(index)
#     print "Corpus: {0}".format(corpus_avg_topic_distribution[index])
#     if cluster_avg_topic_distribution[index] != corpus_avg_topic_distribution[index]:
#         print "Clusters: {0}".format(cluster_avg_topic_distribution[index])
#     if text_avg_topic_distribution[index] != corpus_avg_topic_distribution[index]:
#         print "Texts: {0}".format(text_avg_topic_distribution[index])







