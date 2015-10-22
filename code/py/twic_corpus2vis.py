import os
import sys

from utils.mallet_interpretutils import Mallet_InterpretUtils
from twic_malletscript import TWiC_MalletScript
from twic_malletinterpret import TWiC_MalletInterpret
from twic_text import TWiC_Text

def CreateMallet():

    # Create a TWiC_MalletScript object
    mallet_script = TWiC_MalletScript()

    # Set up variables necessary for script run
    mallet_script.TextClass = TWiC_Text

    # For GatherTexts
    mallet_script.GatherTexts = TWiC_Text.GatherTexts
    mallet_script.user_source_dir = ""
    mallet_script.corpus_source_dir = "../../data/input/txt/"

    # For RunMallet
    mallet_script.corpus_name = "default corpus name"
    mallet_script.output_dir = "../../data/output/mallet/"
    mallet_script.stopwords_dir = "../../data/output/stopwords/"
    mallet_script.lda_dir = "../../lib/mallet-2.0.7/"
    mallet_script.script_dir = os.getcwd()
    mallet_script.num_topics = "100"
    mallet_script.num_intervals = "100"

    # For InterpretMalletOutput
    mallet_script.BuildOutputNames()
    mallet_script.corpus_title = "Default Corpus Title"
    mallet_script.InterpretMalletOutput = TWiC_MalletInterpret.InterpretMalletOutput

    # Return the now-configured TWiC_MalletScript object
    return mallet_script


def Model2Vis(args):

    if (len(args) < 2) or (len(args) and "--help" in args):
        print "Usage: python twic_model2vis.py [gmci] [user_text_source_directory] [short_corpus_title] [full_corpus_title]"
        return

    # Options: g - Gather texts, m - Run MALLET, i - Interpret MALLET's output
    options_gather_texts = "g"
    options_clear_oldoutput = "c"
    options_run_mallet = "m"
    options_interpret_output = "i"

    # Create a TWiC_MalletScript object
    mallet_script = CreateMallet()

    #options = [options_gather_texts, options_clear_oldoutput, options_run_mallet, options_interpret_output]
    #options = [options_run_mallet, options_interpret_output]
    options = [options_interpret_output]
    if len(args):
        options = args[0]
        user_source_dir = args[1]
        if len(args) >= 2:
            mallet_script.corpus_name = args[2]
            if len(args) >= 3:
                mallet_script.corpus_title = args[3]
        mallet_script.user_source_dir = user_source_dir
        mallet_script.BuildOutputNames()

    # Run parts of the corpus 2 visualization workflow
    if options_gather_texts in options:
        mallet_script.GatherTexts(mallet_script.user_source_dir, mallet_script.corpus_source_dir, True)
    if options_clear_oldoutput in options:
        mallet_script.ClearOutputFiles()
    if options_run_mallet in options:
        mallet_script.RunMallet()
    if options_interpret_output in options:
        mallet_script.InterpretMalletOutput(mallet_script)

    return "Finished Model2Vis"


def main(args):

    Mallet_InterpretUtils.TimeAndRun(Model2Vis, args)


if '__main__' == __name__:
    main(sys.argv[1:])