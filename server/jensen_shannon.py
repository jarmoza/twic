import math
from datetime import datetime
import json
#from decimal import Decimal

# See here for description of Jensen-Shannon Divergence http://enterotype.embl.de/enterotypes.html
# Jensen-Shannon "Distance" may be further calculated as SQRT(Jensen-Shannon Divergence)
# NOTE: Functions assume len(prob_dist1) == len(prob_dist2), conditional removed for speed

# def entropy(prob_dist, base=math.e):
#     return -sum([p * math.log(p,base) for p in prob_dist if p != 0])

# def jsd(prob_dists, base=math.e):
#     weight = 1/float(len(prob_dists)) #all same weight
#     js_left = [0,0,0]
#     js_right = 0    
#     for pd in prob_dists:
#         js_left[0] += pd[0]*weight
#         js_left[1] += pd[1]*weight
#         js_left[2] += pd[2]*weight
#         js_right += weight*entropy(pd,base)
#     return entropy(js_left)-js_right

# "Newton" division c/o http://fredrik-j.blogspot.ca/2008/07/making-division-in-python-faster.html

from mpmath.mpmathparent.mpmath.libmp.libintmath import giant_steps, lshift, rshift
from mpmath.mpmathparent.mpmath.libmp.backend import gmpy, MPZ
#from math import log
from mallet_script import MalletScript
Mallet_FileTopicProportions = MalletScript.Mallet_FileTopicProportions


START_PREC = 15

def size(x):
    if isinstance(x, (int, long)):
        return int(math.log(x,2))
    # GMPY support
    #return gmpy.numdigits(x,2)
    return len("{0:f}".format(x))

def newdiv(p, q):
    szp = size(p)
    szq = size(q)
    print szp
    print szq    
    szr = szp - szq
    if min(szp, szq, szr) < 2*START_PREC:
        print 'Floor div'
        return p//q
    r = (1 << (2*START_PREC)) // (q >> (szq - START_PREC))
    last_prec = START_PREC
    for prec in giant_steps(START_PREC, szr):
        a = lshift(r, prec-last_prec+1)
        b = rshift(r**2 * rshift(q, szq-prec), 2*last_prec)
        r = a - b
        last_prec = prec
    return ((p >> szq) * r) >> szr

def kullback_leibler_divergence(prob_dist1, prob_dist2, base=math.e):

    # Calculate the Kullback-Leibler divergence

    kl_divergence = 0

    # To avoid zero in the numerator or denominator
    pseudo_count = 0.000001 

    for index in range(0, len(prob_dist1)):
        #print 'KL Divergence PD1[{0}]: {1} PD2[{0}]: {2}'.format(index, prob_dist1[index], prob_dist2[index])
        #print "newdiv == {0}".format(newdiv(float(prob_dist1[index]) + pseudo_count, float(prob_dist2[index]) + pseudo_count))
        #kl_divergence += prob_dist1[index] * math.log(newdiv(float(prob_dist1[index]) + pseudo_count, float(prob_dist2[index]) + pseudo_count), base)
        kl_divergence += prob_dist1[index] * math.log((float(prob_dist1[index]) + pseudo_count) / (float(prob_dist2[index]) + pseudo_count), base)

    return kl_divergence


def jensen_shannon_divergence(prob_dist1, prob_dist2, base=math.e):
    
    # Calculate "M" == (prob_dist1 + prob_dist2) / 2
    m = []
    for index in range(0, len(prob_dist1)):
        m.append(0.5 * (prob_dist1[index] + prob_dist2[index]))
    #print 'M: {0}'.format(m)

    # Return Jensen-Shannon Divergence
    jsd = 0.5 * (kullback_leibler_divergence(prob_dist1, m, base) + kullback_leibler_divergence(prob_dist2, m, base)) 
    
    #print 'Jensen-Shannon Divergence: {0}'.format(jsd)
    
    return jsd


def jensen_shannon_distance(prob_dist1, prob_dist2, base=math.e):
    return math.sqrt(jensen_shannon_divergence(prob_dist1, prob_dist2, base))

def main():

    # Run begins here
    start_time = datetime.now()    

    # Mallet and VizData directories
    mallet_output_dir = '/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/output/mallet-output/'
    viz_output_dir = '/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/output/myviz-output/'
    
    # ftp == 'File Topic Proportions'
    ftp_filename = 'dickinson.topics.tsv'
    ftp_collection = []

    # Open file topic proportions file and skip header
    input_file = open(mallet_output_dir + ftp_filename, 'r')
    input_file.readline()

    top_proportions = {}

    # Read in topic proportions per document (dickinson.topics.tsv)
    data = input_file.readlines()
    for line in data:
        
        # Split fields by tabs
        line_pieces = line.split('\t')

        # Create a new ftp object for each listed text in the ftp file
        # 0:mallet-listed file ID, 1:filepath, (2,3)+:(topic ID, topic proportion) pairs
        ftp = Mallet_FileTopicProportions()
        ftp.id = line_pieces[0]
        ftp.filename = line_pieces[1][5:]
        ftp.fileid = ftp.filename[ftp.filename.rfind('/') + 1:ftp.filename.rfind('.')]
        for index in range(2, len(line_pieces) - 2):
          
            if index % 2 == 1:
                continue
            topic_id = line_pieces[index]
            
            topic_proportion = float(line_pieces[index + 1])

            # 1. 

            # Index of list will match topic IDs
            int_topic_id = int(topic_id)
            if int_topic_id not in top_proportions.keys():
                top_proportions[int_topic_id] = [ftp.id, topic_proportion]
            else:
                if top_proportions[int_topic_id][1] < topic_proportion:
                    top_proportions[int_topic_id][0] = ftp.id
                    top_proportions[int_topic_id][1] = topic_proportion

            ftp.topic_guide[topic_id] = topic_proportion
            ftp.sorted_topic_list.append([topic_id, topic_proportion])

        # Create a list of topics in this text sorted by highest to lowest topic proportion
        ftp.sorted_topic_list = sorted(ftp.sorted_topic_list, key=lambda x:x[1], reverse=True)

        # Add this object to the ftp collection       
        ftp_collection.append(ftp)

    # Close the file topic proportions file
    input_file.close()

    #for key in top_proportions.keys():
    #    print 'Topic {0}: [File ID: {1}, Proportion: {2}]'.format(key, top_proportions[key][0], top_proportions[key][1])

    # Read in corpus topic proportion file
    ctp_filename = 'dickinson.keys.tsv'
    input_file = open(mallet_output_dir + ctp_filename, 'r')
    ctp_index = {}
    ctp_data = input_file.readlines()
    for line in ctp_data:
        line_pieces = line.split('\t')
        ctp_index[int(line_pieces[0])] = float(line_pieces[1])


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

    
    # 2. 

    # Build a list of lists of Jensen-Shannon distances for each ideal distribution
    jsd_buckets = {}
    for key in top_proportions.keys():
        jsd_buckets[key] = {}

    # Get a list of distributions for all files (Mallet file ID mapped to the full distribution)
    prob_distributions = {}
    for ftp in ftp_collection:
        distribution = []
        for index in range(0, len(top_proportions)):
            distribution.append(ftp.topic_guide[str(index)])
        prob_distributions[ftp.id] = distribution

    #for mfid in prob_distributions.keys():
    #    print 'File ID: {0} Distribution: {1}'.format(mfid, prob_distributions[mfid])

    # Build a list of JSD distances compared to that distribution for every other file
    for key in top_proportions.keys():

        top_file_probdistr = prob_distributions[top_proportions[key][0]]
        #print 'Topic {0} File ID: {1} Top Distribution: {2}'.format(key, top_proportions[key][0], prob_distributions[top_proportions[key][0]])
                
        for ftp in ftp_collection:
            if ftp.id == top_proportions[key][0]:
                jsd_buckets[key][ftp.id] = 0
            else:
                jsd_buckets[key][ftp.id] = jensen_shannon_distance(top_file_probdistr, prob_distributions[ftp.id])

    # 3. 

    # MALLET file ids will be assigned to the cluster buckets, keyed by topic id

    # Create a smallest distance list
    smallest_distances = {}
    for ftp in ftp_collection:
        distances = []
        for topic_id in jsd_buckets.keys():
            #if ftp.id in jsd_buckets[topic_id].keys():
            distances.append([topic_id, jsd_buckets[topic_id][ftp.id]])
        distances = sorted(distances, key=lambda x:x[1], reverse=False)
        #print 'Distances for {0}: {1}'.format(ftp.id, distances)
        smallest_distances[ftp.id] = distances[0][0]

    topic_clusters = {}
    for topic_id in jsd_buckets.keys():
        topic_clusters[topic_id] = []
        for ftp in ftp_collection:
            if topic_id == smallest_distances[ftp.id]:
                topic_clusters[topic_id].append(ftp.id)

    file_count = 0
    for key in topic_clusters.keys():
        file_count += len(topic_clusters[key])
        print 'Topic {0}, Corpus Proportion: {1} Length of Cluster list: {2}'.format(key, ctp_index[key], len(topic_clusters[key]))

    print 'File count in cluster map: {0}'.format(file_count)

    # Using the corpus distribution as an ideal, 
    # what are the distances between that ideal and each of the primary docs (which represent the clusters)

    # Corpus topic distribution
    '''corpus_topic_distribution = []
    for topic_id in ctp_index.keys():
        corpus_topic_distribution.append([topic_id, ctp_index[topic_id]])
    #print 'CORPUS TOPIC DIST: {0}'.format(corpus_topic_distribution)
    corpus_topic_distribution = sorted(corpus_topic_distribution, key=lambda x:x[0], reverse=False)
    ctd_proportions = []
    for index in range(0, len(corpus_topic_distribution)):
        ctd_proportions.append(corpus_topic_distribution[index][1])
    #print 'CTD Dist Len: {0}\nCTD Dist: {1}'.format(len(ctd_proportions), ctd_proportions)        
'''
    distance2cdist_map = {}
    for topic_id in top_proportions.keys():
        file_id = top_proportions[int(topic_id)][0]
        doc_distribution = prob_distributions[file_id]        
        #print 'Doc Dist Len: {0}\nDoc Dist: {1}'.format(len(doc_distribution), doc_distribution)
        distance = jensen_shannon_distance(ctd_proportions, doc_distribution)
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
    output_file = open(viz_output_dir + 'clusters.json', 'w')
    cluster_json = { "clusters": {}, 
                     #"corpus_average_text":"",
                     #"corpus_ideal_distribution":ctd_proportions,
                     #"distance_avg2ideal":0.0,
                     #"distance_clusters2ideal":[] 
                     }
    for topic_id in topic_clusters.keys():
        cluster_json["clusters"][topic_id] = { "primary_topic" : topic_id, 
                                               "primary_doc" : top_proportions[topic_id][0],
                                               "distance2cdist" : distance2cdist_map[top_proportions[topic_id][0]],
                                               "linked_docs" : [] }
        for mallet_file_id in topic_clusters[topic_id]:
            int_mfi = int(mallet_file_id)
            
            cluster_json["clusters"][topic_id]["linked_docs"].append([int_mfi, 
                ftp_collection[int_mfi].fileid, jsd_buckets[topic_id][mallet_file_id]])
    output_file.write(json.dumps(cluster_json))
    output_file.close()





    #print 'Topic Collection Size After Building It: {0}'.format(len(ftp_collection))

    #print jsd([[0.5,0.5,0],[0,0.1,0.9],[1/float(3),1/float(3),1/float(3)]])
    
    #prob_dist1 = [0.5,0.5,0]
    #prob_dist2 = [0,0.1,0.9]
    #print 'Kullback-Leibler Divergence: {0}'.format(kullback_leibler_divergence(prob_dist1, prob_dist2))
    #print 'Jensen-Shannon Divergence: {0}'.format(jensen_shannon_divergence(prob_dist1, prob_dist2))
    #print 'Jensen-Shannon Distance: {0}'.format(jensen_shannon_distance(prob_dist1, prob_dist2))

if __name__ == '__main__':
    main()
