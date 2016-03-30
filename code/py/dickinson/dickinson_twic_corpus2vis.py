import os
import sys
import yaml


def load_src(name, fpath):
    import os, imp
    return imp.load_source(name, os.path.join(os.path.dirname(__file__), fpath))

load_src("utils_malletinterpret", "../utils/utils_malletinterpret.py")
from utils_malletinterpret import Utils_MalletInterpret

load_src("twic_malletscript", "../general/twic_malletscript.py")
from twic_malletscript import TWiC_MalletScript

from dickinson_twic_poem import TWiC_Poem

from dickinson_twic_malletinterpret import TWiC_MalletInterpret


def CreateMallet(p_mallet_yaml_parameters):

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
    mallet_script.corpus_name = p_mallet_yaml_parameters["corpus_short_name"]
    mallet_script.output_dir = twic_relative_root + "data/dickinson/output/mallet/"
    mallet_script.stopwords_dir = twic_relative_root + "data/dickinson/output/stopwords/"
    mallet_script.lda_dir = twic_relative_root + "lib/mallet/"
    mallet_script.script_dir = os.getcwd()

    # Default topic and interval count
    mallet_script.num_topics = str(p_mallet_yaml_parameters["num_topics"])
    mallet_script.num_intervals = str(p_mallet_yaml_parameters["num_intervals"])
    #mallet_script.text_chunk_size_words = int(p_mallet_yaml_parameters["text_chunk_size_words"])

    # For InterpretMalletOutput()
    mallet_script.BuildOutputNames()
    mallet_script.corpus_title = p_mallet_yaml_parameters["corpus_full_name"]
    mallet_script.InterpretMalletOutput = TWiC_MalletInterpret.InterpretMalletOutput

    # Return the now-configured TWiC_MalletScript object
    return mallet_script


def ReadTWiCYAML():

    twic_relative_root = "../../../"
    twic_config_filename = "dickinson_twic_config.yaml"
    twic_config_path = os.getcwd() + "/" + twic_relative_root + "data/dickinson/input/yaml/"
    print twic_config_filename
    print twic_config_path


    # Make sure YAML config file exists
    if not os.path.isfile(twic_config_path + twic_config_filename):
        return None

    with open(twic_config_path + twic_config_filename, "rU") as yaml_file:
        mallet_yaml_parameters = yaml.safe_load(yaml_file)

    return mallet_yaml_parameters


def Corpus2Vis(p_args):

    # Check for proper arguments or "help" argument (p_args[0]: script name, p_args[1]: twic options)
    if len(p_args) != 2 or (len(p_args) and "--help" in p_args):
        print "Usage: python dickinson_twic_corpus2vis.py [gkcmi]"
        print "Options: {0}".format("\n\tg - Gather texts from user source directory\n" +\
                                    "\tk - Keep current txt files in corpus source directory\n" +
                                    "\t\t(only used if 'g' option is also used)\n" +\
                                    "\tc - Clear recent MALLET output files\n" +\
                                    "\tm - Run MALLET\n" +\
                                    "\ti - Interpret MALLET's output\n")
        return

    # Look for YAML configuration file
    mallet_yaml_parameters = ReadTWiCYAML()
    if None == mallet_yaml_parameters:
        print "YAML file 'dickinson_twic_config.yaml' not found in TWiC's 'data/dickinson/input/yaml' directory."
        print "Please see README.md or github.com/jarmoza/twic/README.md for config file setup instructions."
        return

    # Create a TWiC_MalletScript object
    mallet_script = CreateMallet(mallet_yaml_parameters)

    # Build output file names based on the YAML parameters
    mallet_script.BuildOutputNames()

    # Save the supplied TWiC parameters
    twic_options = p_args[1]

    # Options dictionary
    options_dict = { "gather_texts" : "g",
                     "keep_corpus_source" : "k",
                     "clear_oldoutput" : "c",
                     "run_mallet" : "m",
                     "interpret_output" : "i" }

    # Run parts of the corpus 2 visualization workflow
    if options_dict["gather_texts"] in twic_options:
        # Clears previous files in the corpus source directory if not directed otherwise
        if options_dict["keep_corpus_source"] not in twic_options:
            mallet_script.ClearCorpusSourceDirectory()
        mallet_script.GatherTexts(mallet_script.tei_source, mallet_script.corpus_source_dir, True)

    # Clear MALLET's old output files
    if options_dict["clear_oldoutput"] in twic_options:
        mallet_script.ClearOutputFiles()

    # Run MALLET
    if options_dict["run_mallet"] in twic_options:
        mallet_script.RunMallet()

    # Interpret MALLET's output into TWiC's custom JSON files for its D3 visualization
    if options_dict["interpret_output"] in twic_options:
        mallet_script.InterpretMalletOutput(mallet_script)


def main(args):

    Utils_MalletInterpret.TimeAndRun(Corpus2Vis, args)


if '__main__' == __name__:
    main(sys.argv)
