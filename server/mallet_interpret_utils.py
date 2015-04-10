from datetime import datetime
import string

class Mallet_InterpretUtils:

    @staticmethod
    def CleanWord(word):

        #Clean any other leading or trailing non-alphanumeric character
        cleanWord = ''
        for char in word:
            if char not in string.punctuation:
                cleanWord += char

        return cleanWord.strip()  

    @staticmethod
    def GetFilename(path):

        return path[path.rfind('/') + 1 : path.rfind('.')]      

    @staticmethod
    def TimeAndRun(function, *args):

        # Run begins here
        start_time = datetime.now()

        function(*args)

        # Run finishes here
        complete_time = datetime.now() - start_time
        print '{0} time to completion: {1}'.format(function.__name__, complete_time.total_seconds())

def func1(x, y, z):
    print '{0}\t{1}\t{2}'.format(x, y, z)

def main():

    Mallet_InterpretUtils.TimeAndRun(func1, 1, 2, 3)

if '__main__' == __name__:
    main()
