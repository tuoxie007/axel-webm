#!/usr/bin/env python

import sqlite3

DB_FILE='Tasks.db'
SQL_CREATE="""create table tasks(
id int primary_key auto_increment,
url text not null,
output text not null,
`order` int,
total long,
done long,
state long,
current int,
average int,
left int,
used int,
thsize int,
thdone text,
maxspeed int,
headers text,
speed int,
update_time timestamp default current_timestamp on update current_timestamp,
errmsg text)
"""

def reset_database():
    dbc = sqlite3.connect(DB_FILE)
    cursor = dbc.cursor()
    cursor.execute("drop table if exists tasks")
    cursor.execute(SQ_CREATE)
    dbc.close()

def select_tasks(**kwargs):
    if not kwargs:
        return

    dbc = sqlite3.connect(DB_FILE)
    cursor = dbc.cursor()
    SQL = "select * from tasks"
    

    SQL += " where "
    for key, value in kwargs.items():
        if value is int:
            SQL += " `%s` = %s " % (key, value)
        else:
            SQL += " `%s` %s " % (key, value)
    
    SQL += " order by `order`, `id`"
    cursor.execute(SQL)
    tasks = []
    for row in cursor:
        dowloads.append({"id": row[0], 
                         "url": row[1], 
                         "output": row[2], 
                         "order": row[3], 
                         "total": row[4], 
                         "done": row[5], 
                         "state": row[6], 
                         "current": row[7], 
                         "average": row[8], 
                         "left": row[9], 
                         "used": row[10], 
                         "thsize": row[11], 
                         "thdone": row[12],
                         "maxspeed": row[13],
                         "headers": row[14],
                         "speed": row[15],
                         "update_time": row[16],
                         "errmsg": row[17]})
    dbc.close()
    return tasks

def insert_task(**kwargs):
    if not kwargs:
        return

    dbc = sqlite3.connect(DB_FILE)
    cursor = dbc.cursor()
    
    columns = list()
    values = list()
    for key, value in kwargs.items():
        columns.append("`%s`" % key)
        values.append("%s" % value if value is int else "'%s'" % value)
    columns = ", ".join(columns)
    values = ", ".join(values)
    SQL = "insert into tasks (%s) values (%s)" % (columns, values)
    cursor.execute(SQL)
    tid = cursor.lastrowid
    dbc.close()
    return tid

def delete_task(ids):
    if not ids:
        return

    dbc = sqlite3.connect(DB_FILE)
    cursor = dbc.cursor()
    
    SQL = "delete from tasks where "
    SQL += " id = %s " % ids if ids is int else \
        " id in (%s) " % ", ".join(ids)


def update_task(dids, **kwargs):
    if not dids or not kwargs:
        return

    dbc = sqlite3.connect(DB_FILE)
    cursor = dbc.cursor()

    SQL = "update tasks set "

    for key, value in kwargs.items():
        SQL += " `%s` = %s " % (key, value) if value is int else \
            " `%s` = '%s' " % (key, value)

    SQL += " where id = %s " % dids if dids is int else \
        " where id in (%s) " % ", ".join(dids)
