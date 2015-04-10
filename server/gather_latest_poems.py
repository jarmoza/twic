import re
import string

from dickinson_poem import Poem


def clean_title(title):

    #Lowercase
    title = title.lower()

    #Clean remaining tags
    title = re.sub('<[^>]*>', ' ', title)

    #Clean any other non-alphanumeric character
    newtitle = ''
    for char in title:
        if char not in string.punctuation:
            newtitle += char

    #Rebuild title
    title_words = newtitle.split(' ')
    title = ''
    for word in title_words:
        title += word + ' ' 

    return title.strip()


def compare_titles():

    first_poem_number = 1
    last_poem_number = 4825

    input_directory = '/Users/PeregrinePickle/Documents/Programming/PythonPlayground/emily_output/'
    output_directory = '/Users/PeregrinePickle/Documents/Programming/PythonPlayground/latest_poems/'
    
    input_filename = '{0}.tei'
    output_filename = '{0}.txt'

    title_collection = { }
    for index in range(first_poem_number, last_poem_number + 1):

        poem = Poem(input_directory + input_filename.format(index))
        title = poem.GetCleanTitle()
        publication_date = int(poem.GetPublicationDate())

        # if poem.GetTitle() == 'Because I could not stop for Death --':
        #     print 'Publication date: {0}'.format(publication_date)
        #     print 'It is listed as {0}, {1}'.format(title_collection[title][0], title_collection[title][1])
        #     print 'My publication date is {0} than the current one'.format('greater than' if publication_date > title_collection[title][1] else 'less than or equal to')

        if title not in title_collection:
            title_collection[title] = [index, publication_date]
        else:
            if publication_date > title_collection[title][1]:
                title_collection[title] = [index, publication_date]

    for title in title_collection:

        poem = Poem(input_directory + input_filename.format(title_collection[title][0]))
        poem.ConvertToPlainText(output_directory, output_filename.format(title_collection[title][0]))


def compare_poems():

    first_poem_number = 1
    last_poem_number = 4825

    input_directory = '/Users/PeregrinePickle/Documents/Programming/PythonPlayground/emily_output/'
    output_directory = '/Users/PeregrinePickle/Documents/Programming/PythonPlayground/latest_poems/'
    
    input_filename = '{0}.tei'
    output_filename = '{0}.txt'

    all_poem_collection = { }
    curated_poem_collection = { }
    poem_written_statuses = { }

    print 'Gathering poems into memory...'

    # Gather all poems into memory
    for index in range(first_poem_number, last_poem_number + 1):
        all_poem_collection[index] = Poem(input_directory + input_filename.format(index))
        all_poem_collection[index].PrepareForComparison()
        poem_written_statuses[index] = False

    print 'Comparing poems...'

    # Compare all poems to determine similarity matches and filter them out of final corpus
    for index in range(first_poem_number, last_poem_number + 1):

        if poem_written_statuses[index]:
            continue

        #print 'Gathering poems similar to {0}'.format(index)

        # Gather all similar poems
        similar_poems = [index]
        for index2 in range(first_poem_number, last_poem_number + 1):
            
            if index == index2 or poem_written_statuses[index2]:
                continue
 
            if Poem.IsPoemSimilar(all_poem_collection[index], all_poem_collection[index2]):
                similar_poems.append(index2)

        #print 'Determining which poem to write out...'

        # If poems bear similarity then determine which one to write out
        if len(similar_poems) > 1:
            # found_alone = False
            # for p in similar_poems:
            #     if 'circumstance' in all_poem_collection[p].GetTitle():
            #         found_alone = True
            # if found_alone:
            #     for p in similar_poems:
            #         print '======== SIMILAR POEM {0} ========'.format(p)
            #         print 'Publication date: {0}'.format(all_poem_collection[p].GetPublicationDate())                

            publication_date = 0
            latest_poem_index = 0
            for poem_index in similar_poems:
                if int(all_poem_collection[poem_index].GetPublicationDate()) > publication_date:
                    latest_poem_index = poem_index
                    publication_date = all_poem_collection[latest_poem_index].GetPublicationDate()
            # if found_alone:
            #     print all_poem_collection[latest_poem_index].GetPublicationDate()
            #     print '================================'

            # Write out the latest poem and skip the others
            all_poem_collection[latest_poem_index].ConvertToPlainText(output_directory, output_filename.format(latest_poem_index))
            for poem_index in similar_poems:
                poem_written_statuses[poem_index] = True
        # Else, just write out the poem                
        else:
            if all_poem_collection[similar_poems[0]].GetTitle() == 'Alone and in a circumstance':
                print '======== SOLE POEM ADDED ========'
            all_poem_collection[similar_poems[0]].ConvertToPlainText(output_directory, output_filename.format(index))
            poem_written_statuses[similar_poems[0]] = True


def main():

    # compare_titles()
    compare_poems()

if '__main__' == __name__:
    main()