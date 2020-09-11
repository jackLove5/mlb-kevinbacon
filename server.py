from flask import Flask, Response, request
from db_func import get_shortest_path, get_player_id, get_all_players
import mysql.connector as mysql

USER = ''
PASSWORD = ''
DATABASE = 'mlb'

app = Flask(__name__)
app.config['SECRET_KEY'] = 'changeme'

@app.route('/')
def index():
  with open('front/index.html') as f:
    return Response(response=f.read(), mimetype='text/html')

@app.route('/script.js')
def script():
  with open('front/script.js') as f:
    return Response(response=f.read(), mimetype='text/javascript')

@app.route('/jquery-3.5.1.min.js')
def jquery():
  with open('front/jquery-3.5.1.min.js') as f:
    return Response(response=f.read(), mimetype='text/javascript')

@app.route('/styles.css')
def style():
  with open('front/styles.css') as f:
    return Response(response=f.read(), mimetype='text/css')

@app.route('/players/')
def get_players():
  connection = mysql.connect(host='localhost', database=DATABASE, user=USER, password=PASSWORD)
  resp = get_all_players(connection)
  connection.close()
  return Response(response=resp, mimetype='application/json')

@app.route('/connection/')
def get_player_connection():
  player1 = request.args['player1']
  player2 = request.args['player2']
  db_connection = mysql.connect(host='localhost', database=DATABASE, user=USER, password=PASSWORD)
  
  try: 
    player1 = get_player_id(db_connection.cursor(), player1)
    player2 = get_player_id(db_connection.cursor(), player2)
    ret = Response(response=get_shortest_path(db_connection, player1, player2), mimetype='application/json')
  except ValueError:
    return '{"message": "Error. Bad Request"}', 400
  finally:
    db_connection.close()
  
  return ret
  

if __name__ == '__main__':
  app.run()
