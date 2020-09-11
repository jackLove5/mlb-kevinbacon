import mysql.connector as mysql
import json

USER = ''
PASSWORD = ''
DATABASE = 'mlb'
PLAYER_COUNT = 20005

"""
Given a player, return all their teammates.
Returns a list of player_ids
"""
def get_all_teammates(cursor, player_id):
  cursor.execute(f"""select distinct t2.PlayerID from TeamPlayer as t1
    inner join TeamPlayer as t2 on 
    t1.PlayerID = '{player_id}'
    and t1.Year = t2.Year and t1.TeamID = t2.TeamID;
    """)

  res = cursor.fetchall()
  cursor.close()
  return res

"""
Given a playerID, return the player's name
"""
def get_player_name(cursor, player_id):
  cursor.execute(f"""select FirstName, LastName from Player
    where ID = '{player_id}';
    """)

  tup = cursor.fetchall()[0]
  cursor.close()
  return str(tup[0]) + ' ' + str(tup[1])

"""
Given a teamID and year, return the team's name
"""
def get_team_name(cursor, teamID, year):
  cursor.execute(f"""select Name from Team
    where TeamID = '{teamID}' and Year = '{year}';
    """)
  
  ret = cursor.fetchall()[0][0]
  cursor.close()
  return ret

"""
Given two playerIDs, return a team that they played on together
Return a 2 tuple in the form (teamName, teamYear)
"""
def get_team_connection(cursor, player_1, player_2):
  cursor.execute(f"""select t1.TeamID, t1.Year from TeamPlayer as t1
    inner join TeamPlayer as t2 on
    t1.PlayerID = '{player_1}'
    and t2.PlayerID = '{player_2}'
    and t1.TeamID = t2.TeamID and t1.Year = t2.Year limit 1;
    """)
  
  ret = cursor.fetchall()[0]
  ret = (get_team_name(cursor, ret[0], ret[1]), ret[1])
  return ret


"""
Given a player's frontID, validate it and return its playerID
"""
def get_player_id(cursor, frontID):
  frontID = int(frontID)
  if frontID < 1 or frontID > PLAYER_COUNT:
    raise ValueError

  cursor.execute(f"""select ID from Player where frontID = {frontID}""")
  res = cursor.fetchall()[0][0]
  cursor.close()
  return res

"""
Return all players in the database as JSON strings
"""
def get_all_players(connection):
  cursor = connection.cursor()

  cursor.execute(f"""select * from Player""")
  player_list = cursor.fetchall()
  cursor.close()

  res = []
  for row in player_list:
    frontID = row[1]
    player_str = f"""{row[2]} {row[3]}"""
    if row[4] is not None:
      player_str += f""" ({row[4]}-{row[5]})"""

    res.append({
      'id': frontID,
      'str': player_str
    })

  return json.dumps(res)

"""
Given two playerIDs, return a JSON object representing the shortest path
between them.
"""
def get_shortest_path(connection, player_src, player_dst):
  seen = set([player_dst])
  parent = {player_dst: None}
  queue = [player_dst]

  done = False
  # BFS
  while queue and not done:
    front = queue.pop(0)
    teammates = get_all_teammates(connection.cursor(), front)
    for teammate in teammates:
      teammate = teammate[0]
      if teammate not in seen:
        queue.append(teammate)
        parent[teammate] = front
        seen.add(teammate)
        if teammate == player_src:
          done = True
          break

  # Traceback the path
  next_player_id = player_src
  result = []
  while parent[next_player_id] is not None:
    teammate = parent[next_player_id]
    team_name, year = get_team_connection(connection.cursor(), next_player_id, teammate)
    result.append({
      'playerName': get_player_name(connection.cursor(), teammate),
      'teamName': team_name,
      'year': year}
      )
    
    next_player_id = teammate

  to_json = {
    'pathLength': len(result),
    'startPlayer': get_player_name(connection.cursor(), player_src),
    'endPlayer': get_player_name(connection.cursor(), player_dst),
    'connections': result
  }

  return json.dumps(to_json)
