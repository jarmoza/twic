from datetime import datetime
import string

class Mallet_InterpretUtils:

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
    def GetFilename_Orig(path):

        return path[path.rfind('/') + 1 : path.rfind('.')]

    @staticmethod
    def GetFilename(path):

        rf=path.rfind
        return path[rf('/') + 1 : rf('.')]

    @staticmethod
    def TimeAndRun(function, *args):

        # Run begins here
        start_time = datetime.now()

        function(*args)

        # Run finishes here
        complete_time = datetime.now() - start_time
        print '{0} time to completion: {1:.10f}'.format(function.__name__, complete_time.total_seconds())
