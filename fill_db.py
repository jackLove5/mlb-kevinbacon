import mysql.connector as mysql

USER = ''
PASSWORD = ''
DATABASE = 'mlb'

MIN_YEAR = 1970
db_connection = mysql.connect(host='localhost', database='', user=USER, password=PASSWORD)
cursor = db_connection.cursor()
cursor.execute('create database if not exists mlb')
cursor.execute('use mlb')

cursor.execute(f"""create table if not exists Player (
  ID varchar(255) not null primary key,
  frontID integer not null unique auto_increment,
  FirstName varchar(255) not null,
  LastName varchar(255) not null,
  StartYear integer not null,
  EndYear integer not null,
  check (EndYear >= {MIN_YEAR})
  )""")

cursor.execute(f"""create table if not exists Team (
  TeamID varchar(255) not null,
  Name varchar(255) not null,
  Year integer not null,
  primary key (TeamID, Year),
  check (Year >= {MIN_YEAR})
  )""")

cursor.execute(f"""create table if not exists TeamPlayer (
  PlayerID varchar(255) not null,
  TeamID varchar(255) not null,
  Year integer not null,
  primary key (PlayerID, TeamID, Year),
  foreign key (TeamID, Year) references Team(TeamID, Year),
  foreign key (PlayerID) references Player(ID),
  check (Year >= {MIN_YEAR})
  )""")

with open("data/people.txt") as ifile:
  for line in ifile:
    p_id, fname, lname, start_year, end_year = [x.lstrip().rstrip() for x in line.split(',')]
    if p_id and fname and lname and start_year and end_year:
      start_year = start_year.split('-')[0] if start_year else ''
      end_year = end_year.split('-')[0] if end_year else ''
      if int(end_year) >= MIN_YEAR:
        cursor.execute("""insert into Player (ID, FirstName, LastName, StartYear, EndYear) values (
          %s, %s, %s, %s, %s
        )
        """, params=(p_id, fname, lname, start_year, end_year))
  
  ifile.close()

with open("data/teams.txt") as ifile:
  for line in ifile:
    line = line.rstrip()
    year, team, name = [x.lstrip().rstrip() for x in line.split(',')]
    if year and team and name and int(year) >= MIN_YEAR:
      cursor.execute("""insert into Team (TeamID, Name, Year) values (
        %s, %s, %s
      )
      """, params=(team, name, year))
  ifile.close()

files = ['appearances.txt', 'batting.txt', 'batting_post.txt', 'fielding.txt', 'fielding_post.txt', 'pitching.txt']
for f in files:
  with open('data/' + f) as ifile:
    for line in ifile:
      toks = [x.rstrip().lstrip() for x in line.split(',')]
      for tok in toks:
        if len(tok) == 3:
          team_id = tok
        elif len(tok) == 4:
          year_id = tok
        else:
          player_id = tok
      
      if int(year_id) < MIN_YEAR:
          continue
     
      try:
        cursor.execute("""insert into TeamPlayer (PlayerID, TeamID, Year) values (
          %s, %s, %s
        )
        """, params=(player_id, team_id, year_id))
      except mysql.errors.IntegrityError:
        pass

  ifile.close()

db_connection.commit()
cursor.close()
db_connection.close()
