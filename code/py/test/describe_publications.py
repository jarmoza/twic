import glob
import os

def main():

    publications = {}
    tei_dir = "/Users/PeregrinePickle/Documents/Programming/D3Playground/projects/twic/data/dickinson/input/tei/"
    for filename in glob.glob(tei_dir + "*.tei"):
        with open(filename, "rU") as input_file:
            data = input_file.readlines()
            prev_line = ""
            for line in data:
                if prev_line == "<publicationStmt>":
                    if line not in publications:
                        publications[line] = []
                    publications[line].append(os.path.basename(filename))
                    break
                prev_line = line.strip()
    for key in publications:
        print key
        print len(publications[key])
        print "================================"

if "__main__" == __name__:
    main()