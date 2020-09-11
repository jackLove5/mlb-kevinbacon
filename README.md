# mlb-kevinbacon
Get the degrees of separation between MLB players from the years 1970-2020

I originally created this project for the PickHacks 2019 hackathon. The original project ran solely from the command line and built a graph from data scraped from baseball-reference.com. For this project, I created an SQL database using some of the data from the Baseball Databank found [here](https://github.com/chadwickbureau/baseballdatabank/). This program finds the shortest path between players by performing Breadth-First Search on the SQL database.

## Notes/specifics:
* Accepts names of any current mlb player or former player whose career ended on or after 1970

## Challenges:
Performing Breadth-First Search on an SQL database can be a very slow process since a query must be performed at each iteration of the search. Consequently, requests on the website can take anywhere from 2-60 seconds to be completed. The process could be sped up significantly by switching to a Graph Database.

To speed up the response time a little bit, I restricted the acceptable MLB members to those whose careers ended after 1970. This cut the input size in half and yielded a slight time improvement

I also experimented with changing the database schema slightly on the website. When retrieving a player's teammates, instead of performing a self join on the TeamPlayer table at each iteration of BFS, I tried retrieving teammates using a simple SELECT query to a large table that holds every pair of Teammates, though this did not improve the runtime very much.
