import os
import sys

import pico

from mallet_script import MalletScript
from dickinson_poem import Poem
#from interpret_mallet_output import InterpretMalletOutput
from twic_mallet_interpret import TWiC_MalletInterpret
from mallet_interpret_utils import Mallet_InterpretUtils


def CreateMallet():

    # Create a MalletScript object
    mallet_script = MalletScript()

    # Set up variables necessary for script run
    mallet_script.TextClass = Poem

    # For GatherTexts
    mallet_script.GatherTexts = Poem.GatherPoems
    # mallet_script.tei_source = '/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/source/tei/'
    mallet_script.tei_source = '../../data/input/tei/'
    # mallet_script.corpus_source_dir = '/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/source/plaintext/'
    mallet_script.corpus_source_dir = '../../data/input/txt/'

    # For RunMallet
    mallet_script.corpus_name = 'dickinson'
    # mallet_script.output_dir = '/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/output/mallet-output/'
    mallet_script.output_dir = '../../data/output/mallet/'
    mallet_script.stopwords_dir = '../../data/output/stopwords/'
    mallet_script.lda_dir = '../../lib/mallet-2.0.7/'
    #mallet_script.script_dir = '/Users/PeregrinePickle/Documents/Programming/Corpora/Dickinson/scripts/'
    mallet_script.script_dir = os.getcwd()
    mallet_script.num_topics = '100'
    mallet_script.num_intervals = '100'

    # For InterpretMalletOutput
    mallet_script.BuildOutputNames()
    mallet_script.corpus_title = 'The Poems of Emily Dickinson'
    mallet_script.InterpretMalletOutput = TWiC_MalletInterpret.InterpretMalletOutput

    # Return the now-configured MalletScript object
    return mallet_script


def Corpus2Vis(args):

    # Create a MalletScript object
    mallet_script = CreateMallet()

    if len(args) and "--help" in args:
        print "Usage: python corpus2vis_tm_workflow.py [gmci] [short_corpus_title] [full_corpus_title]"
        return

    # Options: g - Gather texts, m - Run MALLET, i - Interpret MALLET's output
    options_gather_poems = 'g'
    options_clear_oldoutput = 'c'
    options_run_mallet = 'm'
    options_interpret_output = 'i'
    #options = [options_gather_poems, options_clear_oldoutput, options_run_mallet, options_interpret_output]
    #options = [options_run_mallet, options_interpret_output]
    options = [options_interpret_output]
    if len(args):
        options = args[0]
        if len(args) >= 2:
            mallet_script.corpus_name = args[1]
            if len(args >= 3):
                mallet_script.corpus_title = args[2]

    # Run parts of the corpus 2 visualization workflow
    if options_gather_poems in options:
        mallet_script.GatherTexts(mallet_script.tei_source, mallet_script.corpus_source_dir, True)
    if options_clear_oldoutput in options:
        mallet_script.ClearOutputFiles()
    if options_run_mallet in options:
        mallet_script.RunMallet()
    if options_interpret_output in options:
        mallet_script.InterpretMalletOutput(mallet_script)

    return "Finished Corpus2Vis"

def main(args):

    Mallet_InterpretUtils.TimeAndRun(Corpus2Vis, args)


if '__main__' == __name__:
    main(sys.argv[1:])
