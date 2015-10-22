import pymysql.cursors

class TWiC_SQL:

    # ConnectToDB('localhost', 'root', '', 'twic')
    def ConnectToDB(p_hostname, p_username, p_password, p_dbname, p_charset='utf8mb4'):

        # Connect to the database
        return pymysql.connect(host=p_hostname,
                               user=p_username,
                               passwd=p_password,
                               db=p_dbname,
                               charset=p_charset,
                               cursorclass=pymysql.cursors.DictCursor)
   
    def InsertJSONAsTable(p_dbconnection, p_json):

        try:
            with connection.cursor() as cursor:
                # Create a new record
                sql = "INSERT INTO `users` (`email`, `password`) VALUES (%s, %s)"
                cursor.execute(sql, ('webmaster@python.org', 'very-secret'))

            # connection is not autocommit by default. So you must commit to save
            # your changes.
            connection.commit()
        
    def UpdateJSONInTable(p_dbconnection, p_jsonupdate, )
try:
    with connection.cursor() as cursor:
        # Create a new record
        sql = "INSERT INTO `users` (`email`, `password`) VALUES (%s, %s)"
        cursor.execute(sql, ('webmaster@python.org', 'very-secret'))

    # connection is not autocommit by default. So you must commit to save
    # your changes.
    connection.commit()

    with connection.cursor() as cursor:
        # Read a single record
        sql = "SELECT `id`, `password` FROM `users` WHERE `email`=%s"
        cursor.execute(sql, ('webmaster@python.org',))
        result = cursor.fetchone()
        print(result)
finally:
    connection.close()
