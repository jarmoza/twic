from datetime import datetime
import subprocess
import os
import sys
import string
import glob
import operator
from numpy.linalg import norm
from mallet_interpret_utils import Mallet_InterpretUtils
clean_word = Mallet_InterpretUtils.CleanWord


class MalletScript:

    def __init__(self):

        self.corpus_name = ''
        self.corpus_source_dir = ''
        self.tei_source = ''
        self.output_dir = ''
        self.stopwords_dir = ''
        self.extra_stopwords_file = ''
        self.lda_dir = ''
        self.script_dir = ''
        self.num_topics = ''
        self.num_intervals = ''
        self.mallet_file = ''
        self.compressed_state_file = ''
        self.state_file = ''
        self.topics_file = ''
        self.keys_file = ''

        self.GatherTexts = None
        self.InterpretMalletOutput = None

    def BuildOutputNames(self):

        self.mallet_file = '{0}{1}.mallet'.format(self.output_dir, self.corpus_name)
        self.compressed_state_file = '{0}{1}.topic-state.tsv.gz'.format(self.output_dir, self.corpus_name)
        self.state_file = self.compressed_state_file[0 : self.compressed_state_file.rfind('.')]
        self.topics_file = '{0}{1}.topics.tsv'.format(self.output_dir, self.corpus_name)
        self.keys_file = '{0}{1}.keys.tsv'.format(self.output_dir, self.corpus_name)
        self.wordweights_file = '{0}{1}.wordweights.tsv'.format(self.output_dir, self.corpus_name)

    def ClearOutputFiles(self):

        print 'Clearing old MALLET output files...'

        if os.path.isfile(self.compressed_state_file):
            os.unlink(self.compressed_state_file)
        if os.path.isfile(self.state_file):
            os.unlink(self.state_file)
        if os.path.isfile(self.topics_file):
            os.unlink(self.topics_file)
        if os.path.isfile(self.keys_file):
            os.unlink(self.keys_file)

    def CreateParticleStopwordList(self, input_path, output_path, min_particle_length=10, output_filename="particle_stopwords.txt"):

        # Save the extra stopwords filename
        self.extra_stopwords_file = output_filename

        words_with_punct = []
        all_particles = []

        for input_filename in glob.glob(input_path + "*.txt"):

            input_file = open(input_filename, "r")
            input_data = input_file.readlines()

            # Gather all words in this file with punctuation inside of them
            for line in input_data:

                words = line.lower().strip().split(" ")
                for word in words:

                    if len(word):

                        stripped_word = word.strip().strip(string.punctuation)
                        if any((c in string.punctuation) for c in stripped_word):
                            if stripped_word not in words_with_punct:
                                words_with_punct.append(stripped_word)

            # Determine all unique particles (split by punctuation) in this file
            for word in words_with_punct:

                current_particles = []
                for c in word:
                    if c not in string.punctuation:
                        current_particles.append(c)
                    else:
                        if len(current_particles):
                            current_str = "".join(current_particles)
                            if current_str not in all_particles:
                                all_particles.append(current_str)
                            current_particles = []

        # Output file a stopwords file containing particles under the given minimum length
        with open(output_path + output_filename, "w") as output_file:
            interim_list = []
            for particle in all_particles:
                if len(particle) < min_particle_length:
                    interim_list.append(particle)
            interim_list.sort()
            for particle in interim_list:
                output_file.write(particle + "\n")

    def ImportDir(self):

        print '\tImporting files...'

        # bin/mallet import-dir --input ~/Documents/Programming/PythonPlayground/latest_poems/ --output ~/Documents/Programming/PythonPlayground/dickinson_mallet_output/dickinson.mallet --keep-sequence --remove-stopwords

        args = [
            '{0}bin/mallet'.format(self.lda_dir),
            'import-dir',
            '--input',
            '{0}'.format(self.corpus_source_dir),
            '--output',
            self.mallet_file,
            #'--token-regex [\p{L}\p{P}]*\p{L}',
            '--token-regex \p{L}+\p{P}*\p{L}+',
            #'--token-regex \p{L}+\p{P}*([[a-r][t-z][A-Z]]+|[s]{2,})',
            '--keep-sequence',
            '--remove-stopwords',
            '--extra-stopwords {0}'.format(self.stopwords_dir + self.extra_stopwords_file)
        ]
        subprocess.check_call(args, stdout=sys.stdout)

    def TrainTopics(self):

        print '\tTraining topics...'

        # bin/mallet train-topics --input ~/Documents/Programming/PythonPlayground/dickinson_mallet_output/dickinson.mallet --num-topics 100 --output-state ~/Documents/Programming/PythonPlayground/dickinson_mallet_output/dickinson.topic-state.tsv.gz --output-doc-topics ~/Documents/Programming/PythonPlayground/dickinson_mallet_output/dickinson.topics.tsv --output-topic-keys ~/Documents/Programming/PythonPlayground/dickinson_mallet_output/dickinson.keys.tsv --optimize-interval 100

        args = [
            '{0}bin/mallet'.format(self.lda_dir),
            'train-topics',
            '--input',
            self.mallet_file,
            '--num-topics',
            '{0}'.format(self.num_topics),
            '--output-state',
            self.compressed_state_file,
            '--output-doc-topics',
            self.topics_file,
            '--output-topic-keys',
            self.keys_file,
            '--topic-word-weights-file',
            self.wordweights_file,
            '--optimize-interval',
            '{0}'.format(self.num_intervals)
        ]
        subprocess.check_call(args, stdout=sys.stdout)

    def DecompressStateFile(self):

        print '\tDecompressing state file...'

        # gzip -d output_dir/corpus_name.topic-state.tsv.gz

        args = [
            'gzip',
            '-d',
            self.compressed_state_file
        ]
        subprocess.check_call(args, stdout=sys.stdout)

    def RunMallet(self, decompress_state_file=True):

        print 'Running MALLET...'

        self.CreateParticleStopwordList(self.corpus_source_dir, self.stopwords_dir)
        self.ImportDir()
        self.TrainTopics()
        if decompress_state_file:
            self.DecompressStateFile()

    def GetKeysFileData(self):

        # Read in topics (dickinson.keys.tsv)

        with open(self.keys_file, 'r') as input_file:
            data = input_file.readlines()

        topic_keys = MalletScript.Mallet_TopicKeys()
        for line in data:

            line_pieces = line.split('\t')
            topic_keys.corpus_topic_proportions[line_pieces[0]] = float(line_pieces[1])
            topic_keys.corpus_topic_words[line_pieces[0]] = line_pieces[2].strip().split(' ')

        return topic_keys

    def GetStateFileData(self):

        # Get MALLET state file data
        with open(self.state_file, 'r') as statefile:

            # Skip column header, alpha, and beta lines
            statefile.readline()
            statefile.readline()
            statefile.readline()

            # Save remaining word topic lines
            statefile_data = statefile.readlines()

        # Build file word topics collection from state file
        current_filenumber = 'NaN'
        current_filewordtopics = None
        fwt_collection = []
        for line in statefile_data:
            if not line.startswith(current_filenumber):
                if current_filewordtopics:
                    fwt_collection.append(current_filewordtopics)
                current_filewordtopics = MalletScript.Mallet_FileWordTopics.Create(line)
                current_filenumber = current_filewordtopics.GetFilenumber()
                current_filewordtopics.AddNextWord(line)
            else:
                current_filewordtopics.AddNextWord(line)

        return fwt_collection

    def GetTopicsFileData(self):

        tp_collection = []
        with open(self.topics_file, 'r') as input_file:

            # Skip header
            input_file.readline()

            # Read in topic proportions per document (dickinson.topics.tsv)
            data = input_file.readlines()

            for line in data:

                line_pieces = line.split('\t')

                tp = MalletScript.Mallet_FileTopicProportions()
                tp.id = line_pieces[0]
                tp.filename = line_pieces[1][5:]
                print "TP FILE NAME TP FILE NAME: {0}".format(tp.filename)
                tp.fileid = tp.filename[tp.filename.rfind('/') + 1:tp.filename.rfind('.')]
                for index in range(2, len(line_pieces) - 2):
                    if index % 2 == 1:
                        continue
                    topic_id = line_pieces[index]
                    topic_proportion = float(line_pieces[index + 1])
                    tp.topic_guide[topic_id] = topic_proportion
                    tp.sorted_topic_list.append([topic_id, topic_proportion])
                tp.sorted_topic_list = sorted(tp.sorted_topic_list, key=lambda x:x[1], reverse=True)

                tp_collection.append(tp)

        return tp_collection

    def GetTopicWordWeights(self, normalize=True, precision=4):

        # NOTE: If given precision is 'None' then full weight values will be returned

        # Create a table of all wordweights from the topic model
        full_wordweights_table = {}
        wordweight_filehandle = open(self.wordweights_file, 'r')
        wordweight_filelines = wordweight_filehandle.readlines()
        wordweight_filehandle.close()
        for line in wordweight_filelines:
            parts = line.split('\t')
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


    class Mallet_FileTopicProportions:

        def __init__(self):
            self.id = ''
            self.filename = ''
            self.fileid = ''
            self.topic_guide = {}
            self.sorted_topic_list = []

        def build_vector(self):

            self.vector = range(len(self.sorted_topic_list))
            for index in range(len(self.sorted_topic_list)):
                self.vector[int(self.sorted_topic_list[index][0])] = self.sorted_topic_list[index][1]

        def get_vector(self):
            return self.vector

        def distance(self, other_mftp):
            return norm(self.vector - other_mftp.vector)

    class Mallet_TopicKeys:

        def __init__(self):
            self.corpus_topic_proportions = {}
            self.corpus_topic_words = {}

    class Mallet_FileWordTopics:

        def __init__(self, filenumber, filename):

            self.filenumber = filenumber
            self.filename = filename
            self.word_info = []

        def AddNextWord(self, statefile_line, save_type_index=None, save_word_index=None):

            line_pieces = statefile_line.strip().split(' ')
            self.word_info.append(MalletScript.Mallet_WordInfo(line_pieces[4], line_pieces[5]))
            if save_type_index:
                self.word_info[len(self.word_info) - 1].type_index = line_pieces[3]
            if save_word_index:
                self.word_info[len(self.word_info) - 1].word_index = line_pieces[2]

        def GetFilename(self):
            return self.filename

        def GetFilenumber(self):
            return self.filenumber

        @staticmethod
        def Create(statefile_line):

            line_pieces = statefile_line.strip().split(' ')
            return MalletScript.Mallet_FileWordTopics(line_pieces[0], line_pieces[1])

    class Mallet_WordInfo:

        def __init__(self, word, topic):

            self.word = clean_word(word)
            self.topic = topic

        def GetWord(self):
            return self.word

        def GetTopic(self):
            return self.topic
