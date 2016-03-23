import os
import sys
import yaml

def load_src(name, fpath):
    import os, imp
    return imp.load_source(name, os.path.join(os.path.dirname(__file__), fpath))

load_src("utils_malletinterpret", "../utils/utils_malletinterpret.py")
from utils_malletinterpret import Utils_MalletInterpret

from twic_malletscript import TWiC_MalletScript
from twic_malletinterpret import TWiC_MalletInterpret
from twic_text import TWiC_Text

def CreateMallet():

    # Create a TWiC_MalletScript object
    mallet_script = TWiC_MalletScript()

    # Set up variables necessary for script run
    mallet_script.TextClass = TWiC_Text

    twic_relative_root = "../../../"

    # For GatherTexts
    mallet_script.GatherTexts = TWiC_Text.GatherTexts
    mallet_script.user_source_dir = ""
    mallet_script.corpus_source_dir = twic_relative_root + "data/input/txt/"

    # For RunMallet
    mallet_script.corpus_name = "default corpus name"
    mallet_script.output_dir = twic_relative_root + "data/output/mallet/"
    mallet_script.stopwords_dir = twic_relative_root + "data/output/stopwords/"
    #mallet_script.lda_dir = twic_relative_root + "lib/mallet-2.0.7/"
    mallet_script.lda_dir = twic_relative_root + "lib/mallet/"
    mallet_script.script_dir = os.getcwd()
    mallet_script.num_topics = "100"
    mallet_script.num_intervals = "100"
    mallet_script.text_chunk_size_words = 5000

    # For InterpretMalletOutput
    mallet_script.BuildOutputNames()
    mallet_script.corpus_title = "Default Corpus Title"
    mallet_script.InterpretMalletOutput = TWiC_MalletInterpret.InterpretMalletOutput

    # Return the now-configured TWiC_MalletScript object
    return mallet_script


def ReadTWiCYAML(p_script_filename):

    twic_config_filename = "twic_config.yaml"
    twic_config_path = p_os.path.abspath(os.path.dirname(p_script_filename))


def Corpus2Vis(args):

    if (len(args) < 2) or (len(args) and "--help" in args):
        print "Usage: python twic_model2vis.py [gkcmi] [user_text_source_directory] [short_corpus_title] [full_corpus_title]"
        print "Options: {0}".format("\ng - Gather texts from user source directory\n" +\
                                    "k - Keep current txt files in corpus source directory" +\
                                    "c - Clear recent MALLET output files\n" +\
                                    "m - Run MALLET\n" +\
                                    "i - Interpret MALLET's output\n")
        return

    # Options: g - Gather texts, c - Clear recent MALLET output, m - Run MALLET, i - Interpret MALLET's output,
    # k - Keep current txt files in corpus source directory
    options_gather_texts = "g"
    options_clear_oldoutput = "c"
    options_run_mallet = "m"
    options_interpret_output = "i"
    options_keep_corpus_source = "k"

    # Create a TWiC_MalletScript object
    mallet_script = CreateMallet()

    #options = [options_gather_texts, options_clear_oldoutput, options_run_mallet, options_interpret_output]
    #options = [options_run_mallet, options_interpret_output]
    options = [options_interpret_output]
    if len(args):
        options = args[0]
        user_source_dir = args[1]
        if len(args) > 2:
            mallet_script.corpus_name = args[2]
            if len(args) >= 3:
                mallet_script.corpus_title = args[3]
        mallet_script.user_source_dir = user_source_dir
        mallet_script.BuildOutputNames()

    # Run parts of the corpus 2 visualization workflow
    if options_gather_texts in options:
        # Clears previous files in the corpus source directory if not directed otherwise
        if options_keep_corpus_source not in options:
            mallet_script.ClearCorpusSourceDirectory()
        mallet_script.GatherTexts(mallet_script.user_source_dir, mallet_script.corpus_source_dir, True)

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
