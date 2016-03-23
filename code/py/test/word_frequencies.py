import operator
import os
import string

mydir = "/Users/PeregrinePickle/Documents/Programming/D3Playground/projects/twic/data/dickinson/input/txt/"
output_dir = "/Users/PeregrinePickle/Desktop/"

def CleanWord(p_original_word):

    return p_original_word.strip().strip(string.punctuation).lower()

def main():

    words = {}
    for filename in os.listdir(mydir):
        if filename.endswith(".txt"):
            with open(mydir + filename, "rU") as txt_file:
                data = txt_file.readlines()
                for line in data:
                    line_parts = line.split(" ")
                    for part in line_parts:
                        cleaned = CleanWord(part)
                        if len(cleaned) > 0:
                            if cleaned not in words:
                                words[cleaned] = 1
                            else:
                                words[cleaned] += 1



    sorted_words = sorted(words.items(), key=operator.itemgetter(1), reverse=True)

    with open(output_dir + "dickinson_stopwords.txt", "w") as output_file:
        for word_tuple in sorted_words:
            output_file.write("{0}:{1}\n".format(word_tuple[0], word_tuple[1]))



if "__main__" == __name__:
    main()