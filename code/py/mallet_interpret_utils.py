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
    def CreateParticleStopwordList(input_path, output_path, min_particle_length=5, output_filename="particle_stopwords.txt"):

        words_with_punct = []
        all_particles = []

        for input_filename in glob.glob(input_path + "*.txt"):

            input_file = open(input_filename, "r")
            input_data = input_file.readlines()

            # Gather all words in this file with punctuation inside of them
            for line in input_data:

                words = line.lower().strip().split(" ")
                for word in words:

                    if len(word):

                        stripped_word = word.strip().strip(string.punctuation)
                        if any((c in string.punctuation) for c in stripped_word):
                            if stripped_word not in words_with_punct:
                                words_with_punct.append(stripped_word)

            # Determine all unique particles (split by punctuation) in this file
            for word in words_with_punct:

                current_particles = []
                for c in word:
                    if c not in string.punctuation:
                        current_particles.append(c)
                    else:
                        if len(current_particles):
                            current_str = "".join(current_particles)
                            if current_str not in all_particles:
                                all_particles.append(current_str)
                            current_particles = []

        # Output file a stopwords file containing particles under the given minimum length
        with open(output_path + output_filename, "w") as output_file:
            interim_list = []
            for particle in all_particles:
                if len(particle) < min_particle_length:
                    interim_list.append(particle)
            interim_list.sort()
            for particle in interim_list:
                output_file.write(particle + "\n")

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
