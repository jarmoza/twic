import glob
import os
import re
import string
import urllib2

from utils.mallet_interpretutils import Mallet_InterpretUtils


class TWiC_Text:

    def __init__(self, filepath):

        self.__m_file_path = filepath
        self.__m_file_directory = os.path.dirname(self.__m_file_path)
        self.__m_file_name, self.__m_file_ext = os.path.splitext(self.__m_file_path)
        self.__m_file_name = os.path.basename(self.__m_file_name)
        self.__full_text = self.__get_full_text()
        self.PrepareForComparison()


    def __get_full_text(self):

        full_text = ""
        fullpath_cleanedspaces = urllib2.unquote(self.__m_file_path)
        lastSlash = fullpath_cleanedspaces.rfind("/")
        filepath = fullpath_cleanedspaces[0:lastSlash]
        filename = fullpath_cleanedspaces[lastSlash:]
        firstUnderscore = filename.find("_")
        filename = filename[firstUnderscore + 1:]

        with open(filepath + "/" + filename, "rU") as textfile_ptr:
            lines = textfile_ptr.readlines()
            for line in lines:
                full_text += line.strip() + "\n"
        return full_text


    def ConvertToPlainText(self, output_filepath):

        with open(output_filepath, 'w') as plaintext_output_file:

            output_lines = self.GetPreparedLines()[0]
            for output_line in output_lines:
                print "Output line: "
                print output_line
                plaintext_output_file.write(output_line + "\n")
                #plaintext_output_file.write(output_line + "\n").encode("utf-8")


    def GetCleanLine(self, line):

        # Lowercase
        clean_line = line.lower()

        # Clean remaining tags
        clean_line = re.sub('<[^>]*>', ' ', clean_line)

        # Clean any other non-alphanumeric character
        newline = "".join([char for char in clean_line if char not in string.punctuation])

        # Rebuild title
        line_words = newline.split(' ')
        clean_line = " ".join([word for word in line_words])

        return clean_line.strip()


    def GetCleanTitle(self):

        return self.GetCleanLine(self.GetTitle())


    def GetFileDirectory(self):

        return self.__m_file_directory


    def GetFileExtension(self):

        return self.__m_file_ext


    def GetFilename(self):

        return self.__m_file_name


    def GetFilePath(self):

        return self.__m_file_path


    def GetFullText(self):

        return self.__full_text


    def GetPreparedLines(self):

        return self.__my_lines


    def GetPublication(self):

        # In current implemenation for general texts, no publication data is listed
        return ""


    def GetPublicationDate(self):

        # In current implemenation for general texts, no publication data is listed
        return ""

    def GetTitle(self):

        return self.GetFilename().split("_")[1]


    def IsTextPreparedForComparision(self):

        return None != self.__my_lines


    def PrepareForComparison(self):

        self.__my_lines = [re.sub(r'[\n]+', '\n', self.GetFullText()).split('\n')]
        #for index in range(len(self.__my_lines)):
        #    self.__my_lines[index].append(self.__my_lines[index][0].strip().split(' '))


    def PrintStats(self):

        print "=============================="
        print "Title: {0}".format(self.GetTitle())
        print "Filename: {0}".format(self.GetFilename())
        print "=============================="


    # Static Text threshholds for similarity testing
    line_match_threshhold = 0.75
    text_match_threshhold = 0.75


    @staticmethod
    def GatherTexts(user_source_dir, corpus_source_dir, remove_old_plaintext = False):

        # Make sure passed in paths are formatted correctly
        user_source_dir = Mallet_InterpretUtils.FormatPath(user_source_dir)
        corpus_source_dir = Mallet_InterpretUtils.FormatPath(corpus_source_dir)

        # Copy files from user source directory to TWiC's corpus source directory
        source_file_counter = 1
        for user_filename in glob.glob(user_source_dir + "*.txt"):

            user_text = TWiC_Text(user_filename)
            user_text.ConvertToPlainText("{0}{1}_{2}{3}".format(corpus_source_dir,\
                                                                source_file_counter,\
                                                                user_text.GetFilename(),\
                                                                user_text.GetFileExtension()))
            source_file_counter += 1


    @staticmethod
    def IsTextSimilar(original_text, compared_text):

        my_lines = original_text.GetPreparedLines()
        compared_lines = compared_text.GetPreparedLines()

        my_lines_count = len(my_lines)
        compared_lines_count = len(compared_lines)

        # Look for the first highly similar match
        match_index = -1
        for index in range(my_lines_count):
            if index < compared_lines_count and TWiC_Text.PercentageLineMatch(my_lines[index], compared_lines[index], True) > TWiC_Text.line_match_threshhold:
                match_index = index
                break

        # No similar line match, texts are either different or very dissimilar
        if -1 == match_index:
            return False

        # Count the remaining matches
        matches = 0
        for index in range(match_index, my_lines_count):
            if index < compared_lines_count and TWiC_Text.PercentageLineMatch(my_lines[index], compared_lines[index], True) > TWiC_Text.line_match_threshhold:
                matches += 1

        # If there is a significant amount of similar lines, then the texts are considered similar
        return float(matches) / float(my_lines_count) > TWiC_Text.text_match_threshhold


    @staticmethod
    def PercentageLineMatch(original_line, compared_line, prepared_line = False):

        line_words = None
        compared_line_words = None

        # If this is a prepared line it is an array[2],
        # array[0] is the line, array[1] is the array of the line's words
        if prepared_line:
            line_words = original_line[1]
            compared_line_words = compared_line[1]
        else:
            line_words = original_line.strip().split(' ')
            compared_line_words = compared_line.strip().split(' ')

        line_word_count = len(line_words)
        compared_line_word_count = len(compared_line_words)

        # Try to find an initial match
        match_index = -1
        for index in range(line_word_count):
            if index < compared_line_word_count and line_words[index] == compared_line_words[index]:
                match_index = index
                break

        # No beginning to matching sequence found, return 0% similarity
        if -1 == match_index:
            return 0

        # Count the remaining matches
        matches = 0
        for index in range(match_index, line_word_count):
            if index < compared_line_word_count and line_words[index] == compared_line_words[index]:
                matches += 1

        # Return percentage match
        return float(matches) / float(line_word_count)