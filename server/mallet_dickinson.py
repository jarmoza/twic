from datetime import datetime
import subprocess
import sys

# General variables
corpus_name = "dickinson"
corpus_source_dir = "/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/source/plaintext"
output_dir = "/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/output/mallet-output/"
lda_dir = "/Users/PeregrinePickle/mallet-2.0.7/"

# MALLET specific variables
num_topics = '100'
num_intervals = '1000'


def ImportDir():

    # bin/mallet import-dir --input ~/Documents/Programming/PythonPlayground/latest_poems/ --output ~/Documents/Programming/PythonPlayground/dickinson_mallet_output/dickinson.mallet --keep-sequence --remove-stopwords

    global corpus_name
    global corpus_source_dir
    global output_dir
    global lda_dir

    args = [
        '{0}bin/mallet'.format(lda_dir),
        'import-dir',
        '--input',
        '{0}'.format(corpus_source_dir),
        '--output',
        '{0}{1}.mallet'.format(output_dir, corpus_name),
        '--keep-sequence',
        '--remove-stopwords'
    ]
    subprocess.check_call(args, stdout=sys.stdout)


def TrainTopics():

    # bin/mallet train-topics --input ~/Documents/Programming/PythonPlayground/dickinson_mallet_output/dickinson.mallet --num-topics 100 --output-state ~/Documents/Programming/PythonPlayground/dickinson_mallet_output/dickinson.topic-state.tsv.gz --output-doc-topics ~/Documents/Programming/PythonPlayground/dickinson_mallet_output/dickinson.topics.tsv --output-topic-keys ~/Documents/Programming/PythonPlayground/dickinson_mallet_output/dickinson.keys.tsv --optimize-interval 100

    global corpus_name
    global output_dir
    global lda_dir
    global num_topics
    global num_intervals

    args = [
        '{0}bin/mallet'.format(lda_dir),
        'train-topics',
        '--input',
        '{0}{1}.mallet'.format(output_dir, corpus_name),
        '--num-topics',
        '{0}'.format(num_topics),
        '--output-state',
        '{0}{1}.topic-state.tsv.gz'.format(output_dir, corpus_name),
        '--output-doc-topics',
        '{0}{1}.topics.tsv'.format(output_dir, corpus_name),
        '--output-topic-keys',
        '{0}{1}.keys.tsv'.format(output_dir, corpus_name),
        '--optimize-interval',
        '{0}'.format(num_intervals)
    ]
    subprocess.check_call(args, stdout=sys.stdout)


def main():

    # Run begins here
    start_time = datetime.now()

    # Import the corpus source for MALLET to handle
    ImportDir()

    # Perform the topic modeling over the corpus
    TrainTopics()

    # Run finishes here
    complete_time = datetime.now() - start_time
    print 'Time to completion: {0}'.format(complete_time.total_seconds())



if '__main__' == __name__:
    main()