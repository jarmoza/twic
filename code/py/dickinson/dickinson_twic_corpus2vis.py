import os
import sys

import pico

def load_src(name, fpath):
    import os, imp
    return imp.load_source(name, os.path.join(os.path.dirname(__file__), fpath))

load_src("utils_malletinterpret", "../utils/utils_malletinterpret.py")
from utils_malletinterpret import Utils_MalletInterpret

load_src("twic_malletscript", "../general/twic_malletscript.py")
from twic_malletscript import TWiC_MalletScript

from dickinson_twic_poem import TWiC_Poem

from dickinson_twic_malletinterpret import TWiC_MalletInterpret

# from utils.utils_malletinterpret import Utils_MalletInterpret
# from general.twic_malletscript import TWiC_MalletScript
# from dickinson.dickinson_twic_poem import TWiC_Poem
# from dickinson.dickinson_twic_malletinterpret import TWiC_MalletInterpret


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
    mallet_script.lda_dir = twic_relative_root + "lib/mallet-2.0.7/"
    mallet_script.script_dir = os.getcwd()

    # Default topic and interval count
    mallet_script.num_topics = "100"
    mallet_script.num_intervals = "100"

    # For InterpretMalletOutput()
    mallet_script.BuildOutputNames()
    mallet_script.corpus_title = "The Poems of Emily Dickinson"
    mallet_script.InterpretMalletOutput = TWiC_MalletInterpret.InterpretMalletOutput

    # Return the now-configured TWiC_MalletScript object
    return mallet_script


def Corpus2Vis(args):

    # Create a TWiC_MalletScript object
    mallet_script = CreateMallet()

    if len(args) and "--help" in args:
        print "Usage: python dickinson_twic_corpus2vis.py [gcmi] [short_corpus_title] [full_corpus_title]"
        return

    # Options: g - Gather texts, c - Clear recent MALLET output, m - Run MALLET, i - Interpret MALLET's output
    options_gather_poems = 'g'
    options_clear_oldoutput = 'c'
    options_run_mallet = 'm'
    options_interpret_output = 'i'

    # Default options
    #options = [options_gather_poems, options_clear_oldoutput, options_run_mallet, options_interpret_output]
    #options = [options_run_mallet, options_interpret_output]
    options = [options_interpret_output]

    # Parse given options (Dickinson TWiC run presumes tei data sits in mallet_script.tei_source)
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


def main(args):

    Utils_MalletInterpret.TimeAndRun(Corpus2Vis, args)


if '__main__' == __name__:
    main(sys.argv[1:])
