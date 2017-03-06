from datetime import datetime
import string
import os

def load_src(name, fpath):
    import os, imp
    return imp.load_source(name, os.path.join(os.path.dirname(__file__), fpath))

load_src("unidecode", os.path.join("..", "lib", "unidecode.py"))
from unidecode import unidecode

class Utils_MalletInterpret:

    @staticmethod
    def CleanWord_Orig(word):

        #Clean any other leading or trailing non-alphanumeric character
        cleanWord = ''
        for char in word:
            if char not in string.punctuation:
                cleanWord += char

        return cleanWord.strip()


    @staticmethod
    def CleanWord(word):

        return "".join([c for c in word if c not in string.punctuation]).strip()


    @staticmethod
    def FormatPath(path):

        if len(path) and os.sep != path[len(path) - 1]:
            return path + os.sep
        else:
            return path


    @staticmethod
    def GetChunkedLines(p_lines, p_chunk_size):

        chunk_word_count = 0
        chunks = []
        current_lines = []
        line_skip = False
        skip_till = 0
        good_end_spot_found = False

        look_ahead_lines = 5 # Number of lines to look for logical chunk ending

        for line_index in range(len(p_lines)):

            # Skips lines if they were included in the previous chunk by look-ahead code below
            if line_skip:
                if line_index < skip_till:
                    continue
                else:
                    line_skip = False

            # print "Line: {0}".format(p_lines[line_index])

            # Get the word count of the current line
            word_count = Utils_MalletInterpret.GetWordCount(p_lines[line_index])

            # print "Word Count: {0}".format(word_count)

            # If adding this line to the chunk will mean that chunk size has been exceeded
            if word_count + chunk_word_count > p_chunk_size:

                # Find the most logical end place for the chunk if possible
                good_end_spot_found = False
                for line_index2 in reversed(range(len(current_lines))):

                    # A line contains multiple newlines or is just pure whitespace/newlines (more likely)
                    if "\n\n" in current_lines[line_index2] or 0 == len(current_lines[line_index2].strip()):
                        good_end_spot_found = True
                        if line_index2 < len(current_lines) - 1:
                            chunks.append(current_lines[0:line_index2])
                            current_lines = current_lines[line_index2 + 1:]
                            chunk_word_count = 0
                            for line in current_lines:
                                chunk_word_count += Utils_MalletInterpret.GetWordCount(line)
                        else:
                            chunks.append(current_lines)
                            current_lines = []
                            chunk_word_count = 0
                        break

                    # A line starts with a tab character (This may be the start of a new paragraph)
                    elif "\t" == current_lines[line_index2][0]:
                        good_end_spot_found = True
                        chunks.append(current_lines[0:line_index2 - 1])
                        current_lines = current_lines[line_index2:]
                        chunk_word_count = 0
                        for line in current_lines:
                            chunk_word_count += Utils_MalletInterpret.GetWordCount(line)
                        break

                # If no logical semantic end could be found for the chunk, look ahead n lines for one
                if not good_end_spot_found:

                    # Add the current line by default (since it's not an immediately logical end spot)
                    current_lines.append(p_lines[line_index])

                    # Determine how many lines we can actually look ahead
                    lines_left = len(p_lines) - line_index - 1
                    look_ahead_actual = lines_left if lines_left < look_ahead_lines else look_ahead_lines

                    start_index = line_index + 1
                    end_index = line_index + look_ahead_actual

                    # print "START INDEX: {0}\nEND INDEX: {1}\nLINE COUNT: {2}".format(start_index, end_index, len(p_lines))
                    # print "RANGE: {0}".format(range(start_index, end_index + 1))
                    # print "LINES LEFT: {0} LOOK AHEAD ACTUAL: {1}".format(lines_left, look_ahead_actual)

                    for line_index2 in range(start_index, end_index + 1):

                        #print "LINE INDEX2: {0}".format(line_index2)

                        # A line contains multiple newlines or is just pure whitespace/newlines (more likely)
                        if "\n\n" in p_lines[line_index2] or 0 == len(p_lines[line_index2].strip()):

                            current_lines.extend(p_lines[start_index:line_index2 + 1])
                            line_skip = True
                            chunks.append(current_lines)
                            chunk_word_count = 0
                            current_lines = []
                            skip_till = line_index2 + 1

                        # A line starts with a tab character (This may be the start of a new paragraph)
                        elif 0 != len(p_lines[line_index2]) and "\t" == p_lines[line_index2][0]:
                            current_lines.extend(p_lines[start_index:line_index2])
                            line_skip = True
                            chunks.append(current_lines)
                            chunk_word_count = 0
                            current_lines = []
                            skip_till = line_index2

                    # If a logical look ahead chunk ending could not be found, just end the chunk here
                    if not line_skip:
                        chunks.append(current_lines)
                        chunk_word_count = 0
                        current_lines = []

            # Otherwise add the line to the chunk and continue (for now)
            else:
                current_lines.append(p_lines[line_index])
                chunk_word_count += word_count

        # For leftovers or small texts less than maximum chunk size
        if len(current_lines):
            chunks.append(current_lines)

        return chunks


    @staticmethod
    def GetFilename_Orig(path):

        return path[path.rfind(os.sep) + 1 : path.rfind('.')]

    @staticmethod
    def GetFilename(path):

        rf = path.rfind
        return path[rf(os.sep) + 1 : rf('.')]


    @staticmethod
    def GetFilenameWithUnderscore(path):

        lastSlash = path.rfind(os.sep) + 1
        nextUnderscore = path.find("_", lastSlash)
        return path[lastSlash : nextUnderscore]


    @staticmethod
    def GetWordCount(p_line, p_sep=" "):

        return len(p_line.strip().split(p_sep))



    @staticmethod
    def TimeAndRun(function, *args):

        # Run begins here
        start_time = datetime.now()

        function(*args)

        # Run finishes here
        complete_time = datetime.now() - start_time
        print '{0} time to completion: {1:.10f}'.format(function.__name__, complete_time.total_seconds())


    @staticmethod
    def Translate_With_Unidecode(p_text):

        new_text = ""
        for ch in p_text:
            try:
                ch.decode('utf-8')
                new_text += ch
            except UnicodeDecodeError:
                new_text += unidecode(unichr(ord(ch)))
        return new_text
