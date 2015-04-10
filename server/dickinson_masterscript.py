from datetime import datetime
import os
import re
import sys
import string
import subprocess

from dickinson_poem import Poem


# Command line options
options_gather_poems = 'g'
options_run_mallet = 'm'
options_interpret_output = 'i'

# General variables
corpus_name = "dickinson"
corpus_source_dir = "/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/source/plaintext/"
output_dir = "/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/mallet-output/"
lda_dir = "/Users/PeregrinePickle/mallet-2.0.7/"
script_dir = "/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/scripts/"
tei_source_dir = "/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/source/tei/"

# MALLET specific variables
num_topics = '20'
num_intervals = '100'


def GatherPoems():

    global corpus_source_dir
    global tei_source_dir

    first_poem_number = 1
    last_poem_number = 4825

    input_directory = tei_source_dir
    output_directory = corpus_source_dir
    
    input_filename = '{0}.tei'
    output_filename = '{0}.txt'

    all_poem_collection = { }
    curated_poem_collection = { }
    poem_written_statuses = { }

    # Clear all files in the plain text directory


    print 'Gathering poems into memory...'

    # Gather all poems into memory
    for index in range(first_poem_number, last_poem_number + 1):
        all_poem_collection[index] = Poem(input_directory + input_filename.format(index))
        all_poem_collection[index].PrepareForComparison()
        poem_written_statuses[index] = False

    print 'Comparing poems...'

    # Compare all poems to determine similarity matches and filter them out of final corpus
    for index in range(first_poem_number, last_poem_number + 1):

        if poem_written_statuses[index]:
            continue

        #print 'Gathering poems similar to {0}'.format(index)

        # Gather all similar poems
        similar_poems = [index]
        for index2 in range(first_poem_number, last_poem_number + 1):
            
            if index == index2 or poem_written_statuses[index2]:
                continue
 
            if Poem.IsPoemSimilar(all_poem_collection[index], all_poem_collection[index2]):
                similar_poems.append(index2)

        #print 'Determining which poem to write out...'

        # If poems bear similarity then determine which one to write out
        if len(similar_poems) > 1:
            # found_alone = False
            # for p in similar_poems:
            #     if 'circumstance' in all_poem_collection[p].GetTitle():
            #         found_alone = True
            # if found_alone:
            #     for p in similar_poems:
            #         print '======== SIMILAR POEM {0} ========'.format(p)
            #         print 'Publication date: {0}'.format(all_poem_collection[p].GetPublicationDate())                

            publication_date = 0
            latest_poem_index = 0
            for poem_index in similar_poems:
                if int(all_poem_collection[poem_index].GetPublicationDate()) > publication_date:
                    latest_poem_index = poem_index
                    publication_date = all_poem_collection[latest_poem_index].GetPublicationDate()
            # if found_alone:
            #     print all_poem_collection[latest_poem_index].GetPublicationDate()
            #     print '================================'

            # Write out the latest poem and skip the others
            all_poem_collection[latest_poem_index].ConvertToPlainText(output_directory, output_filename.format(latest_poem_index))
            for poem_index in similar_poems:
                poem_written_statuses[poem_index] = True
        # Else, just write out the poem                
        else:
            if all_poem_collection[similar_poems[0]].GetTitle() == 'Alone and in a circumstance':
                print '======== SOLE POEM ADDED ========'
            all_poem_collection[similar_poems[0]].ConvertToPlainText(output_directory, output_filename.format(index))
            poem_written_statuses[similar_poems[0]] = True


def RunMallet():


def InterpretMalletOutput():

    
def main(args):

	# Run begins here
    start_time = datetime.now()

	# Options: g - Gather poems, m - Run MALLET, i - Interpret MALLET's output
	options = args[0]
	if options_gather_poems in options:
		GatherPoems()
	if options_run_mallet in options:
		RunMallet()
	if options_interpret_output in options:
		InterpretMalletOutput()

    # Run finishes here
    complete_time = datetime.now() - start_time
    print 'Time to completion: {0}'.format(complete_time.total_seconds())


if '__main__' == __name__:
	main(sys.argv[1:])