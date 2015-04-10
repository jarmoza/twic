from bs4 import BeautifulSoup
import os
import re
import string


class Poem:

    def __init_soup(self):
        self.__m_soup = BeautifulSoup(open(self.__m_file_path, 'rU'))


    def __init__(self, filepath):
        self.__m_file_path = filepath
        self.__m_file_directory = os.path.dirname(self.__m_file_path)
        self.__m_file_name, self.__m_file_ext = os.path.splitext(self.__m_file_path)
        self.__m_file_name = os.path.basename(self.__m_file_name)
        self.__init_soup()
        self.__full_text = self.__get_full_text()
        self.__my_lines = None


    def PrintStats(self):
        print '=============================='
        print 'Title: {0}'.format(self.GetTitle())
        print 'Filename: {0}'.format(self.GetFilename())
        print '=============================='


    def GetFilePath(self):
        return self.__m_file_path


    def GetFileDirectory(self):
        return self.__m_file_directory


    def GetFilename(self):
        return self.__m_file_name


    def GetFileExtension(self):
        return self.__m_file_ext


    def ConvertToPlainText(self, output_directory, output_filename):

        plaintext_output_file = open(output_directory + output_filename, 'w')
        
        stanzas = self.GetStanzas()
        for stanza in stanzas:
        
            for line in stanza:
        
                # Clean tags
                output_line = re.sub('<[^>]*>', ' ', line.replace('\n', ''))
                plaintext_output_file.write(str(output_line + '\n').encode('utf-8'))
        
        plaintext_output_file.close()


    def GetCleanLine(self, line):

        #Lowercase
        clean_line = line.lower()

        #Clean remaining tags
        clean_line = re.sub('<[^>]*>', ' ', clean_line)

        #Clean any other non-alphanumeric character
        newline = ''
        for char in clean_line:
            if char not in string.punctuation:
                newline += char

        #Rebuild title
        line_words = newline.split(' ')
        clean_line = ''
        for word in line_words:
            clean_line += word + ' ' 

        return clean_line.strip()


    def GetTitle(self):
        return self.__m_soup.tei.titlestmt.title.string.strip()


    def GetCleanTitle(self):
        return self.GetCleanLine(self.GetTitle())


    def GetPublication(self):
        return self.__m_soup.tei.publicationstmt.p.string.strip()


    def GetPublicationDate(self):

        publication = self.GetPublication()
        last_comma = publication.rfind(',')
        if -1 != last_comma:
            return publication[last_comma + 1:].strip()
        else:
            return '1'


    def GetPreparedLines(self):
        return self.__my_lines


    def GetStanza(self, stanza_number, with_formatting = False, use_alternate_lines = False):

        poem_text_soupclass = '<class \'bs4.element.NavigableString\'>'

        # Account for zero-based requests
        if 0 == stanza_number:
            stanza_number = 1

        # Retrieve the stanza tags from soup
        data = self.__m_soup.tei.find_all('text')[0].div.find_all('lg')
        stanza_count = len(data)
        if stanza_number > stanza_count:
            stanza_number = stanza_count

        # Store requested stanza from the soup data
        stanza = []
        for index in range(0, stanza_count):

            if 'type' in tag.attrs and tag['type'] == 'stanza' and stanza_number == index + 1:

                l_tags = tag.find_all('l')
                for index in range(0, len(l_tags)):

                    current_line_text = ''
                    for line_subpart in l_tags[index].contents:
                        if poem_text_soupclass == str(type(line_subpart)):
                            current_line_text += line_subpart.strip() + ' '
                
                    stanzas[current_stanza_index].append(current_line_text.strip())
                    
                    #if with_formatting:
                    #    app_tags = l_tags[index].find_all('app')
                    #    if app_tags and app_tags[0]['type'] == 'division':
                    #        stanza.append('\n')

        return stanza


    def GetStanzas(self, with_formatting = False, use_alternate_lines = False):

        #global add_types
        #global del_types
        poem_text_soupclass = '<class \'bs4.element.NavigableString\'>'

        stanzas = []
        data = self.__m_soup.tei.find_all('text')[0].div.find_all('lg')
        for tag in data:
            if 'type' in tag.attrs and tag['type'] == 'stanza':
                stanzas.append([])
                current_stanza_index = len(stanzas) - 1
                l_tags = tag.find_all('l')
                for index in range(0, len(l_tags)):

                    current_line_text = ''
                    for line_subpart in l_tags[index].contents:
                        if poem_text_soupclass == str(type(line_subpart)):
                            current_line_text += line_subpart.strip() + ' '
                
                    stanzas[current_stanza_index].append(current_line_text.strip())
                    
                    #app_tags = l_tags[index].find_all('app')
                    #if l_tags[index].find_all('add'):
                    #    for add in l_tags[index].find_all('add'):
                    #        #print add
                    #        if add['type'] not in add_types:
                    #            add_types[add['type']] = ''
                    #if l_tags[index].find_all('del'):
                    #    for deltag in l_tags[index].find_all('del'):
                    #        #print deltag
                    #        if deltag['type'] not in del_types:
                    #            del_types[deltag['type']] = ''
                    #if with_formatting:
                    #    if app_tags and app_tags[0]['type'] == 'division':
                    #        stanzas[current_stanza_index].append('\n')
        return stanzas


    def __get_full_text(self):

        #print 'GetFullText'

        stanzas = self.GetStanzas()
        full_text = ''
        for stanza in stanzas:
            for line in stanza:
                full_text += line + '\n'
        return full_text


    def GetFullText(self):
        return self.__full_text


    def PrepareForComparison(self):

        self.__my_lines = [re.sub(r'[\n]+', '\n', self.GetFullText()).split('\n')]
        for index in range(0, len(self.__my_lines)):
            self.__my_lines[index].append(self.__my_lines[index][0].strip().split(' '))


    def IsPoemPreparedForComparision(self):
        return None != self.__my_lines


    # Static Poem threshholds for similarity testing
    line_match_threshhold = 0.75
    poem_match_threshhold = 0.75

    @staticmethod
    def PercentageLineMatch(original_line, compared_line, prepared_line = False):

        #print 'PercentageLineMatch'
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
        for index in range(0, line_word_count):
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


    @staticmethod
    def IsPoemSimilar(original_poem, compared_poem):

        #print 'IsPoemSimilar'

        my_lines = original_poem.GetPreparedLines()
        compared_lines = compared_poem.GetPreparedLines()

        my_lines_count = len(my_lines)
        compared_lines_count = len(compared_lines)

        # Look for the first highly similar match
        match_index = -1
        for index in range(0, my_lines_count):
            if index < compared_lines_count and Poem.PercentageLineMatch(my_lines[index], compared_lines[index], True) > Poem.line_match_threshhold:
                match_index = index
                break

        # No similar line match, poems are either different or very dissimilar
        if -1 == match_index:
            return False

        # Count the remaining matches
        matches = 0
        for index in range(match_index, my_lines_count):
            if index < compared_lines_count and Poem.PercentageLineMatch(my_lines[index], compared_lines[index], True) > Poem.line_match_threshhold:
                matches += 1

        # If there is a significant amount of similar lines, then the poems are considered similar
        return float(matches) / float(my_lines_count) > Poem.poem_match_threshhold

    @staticmethod
    def GatherPoems(tei_source_dir, corpus_source_dir):

        first_poem_number = 1
        last_poem_number = 4825

        input_directory = tei_source_dir
        output_directory = corpus_source_dir
        
        input_filename = '{0}.tei'
        output_filename = '{0}.txt'

        all_poem_collection = { }
        curated_poem_collection = { }
        poem_written_statuses = { }

        print 'Removing old plaintext files...'

        # Clear all files in the plain text directory
        for old_file in os.listdir(corpus_source_dir):
            file_path = os.path.join(corpus_source_dir, old_file)
            try:
                if file_path.endswith('.txt') and os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception, e:
                print e

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
           
        #def SavePoemTopics(self, topic_proportion_map, topic_word_map):

        #    self.
#add_types = {}
#del_types = {}


def main():

    first_poem_number = 1
    last_poem_number = 4825

    input_directory = '/Users/PeregrinePickle/Documents/Programming/PythonPlayground/emily_output/'
    output_directory = '/Users/PeregrinePickle/Documents/Programming/PythonPlayground/emily_plaintext/'
    
    input_filename = '{0}.tei'
    output_filename = '{0}.txt'

    last_poem_collection = { }
    for index in range(first_poem_number, last_poem_number + 1):

        poem = Poem(input_directory + input_filename.format(index))
        title = poem.GetTitle()
        publication = poem.GetPublication()

        if title not in title_collection:
            title_collection[title] = [[index, poem.GetPublication()]]
        else:
            title_collection[title].append([index, poem.GetPublication()])

    #for title in title_collection:
    #    if len(title_collection[title]) > 1 :
    #        print '{0}: {1}'.format(title, title_collection[title])

    # for index in range(first_poem_number, last_poem_number + 1):

    #     poem = Poem(input_directory + input_filename.format(index))
    #     stanzas = poem.GetStanzas(with_formatting = True)
        
    #     #print 'Writing plain text file \'{0}\'...'.format(output_directory + output_filename.format(index))
        
    #     plaintext_output_file = open(output_directory + output_filename.format(index), 'w')
    #     for stanza in stanzas:
    #         for line in stanza:
    #             plaintext_output_file.write(str(line + '\n').encode('utf-8'))
    #     plaintext_output_file.close()


if '__main__' == __name__:
    main()
