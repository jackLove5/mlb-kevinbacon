package com.github.jacklove5.mlbkevinbacon;

import java.util.*;
/**
 * Implements a graph of Major League Baseball player relations
 * Vertices: mlb players
 * Edges: played on the same team during the same year
 */
public class MLBGraph
{
	private class Edge
	{
		public Edge(String sVName, String dVName, String lName)
		{
			srcVName = sVName;
			dstVName = dVName;
			label = lName;
		}

		public String srcVName;
		public String dstVName;
		public String label;
	}

	// Key: player name
	// Value: list of edges
	private HashMap<String, LinkedList<Edge>> adjList;

	public MLBGraph()
	{
		adjList = new HashMap<String, LinkedList<Edge>>();
	}

	/**
	 * Adds an edge beetween two players
	 * @param plaer1 the first player
	 * @param player2 the second player
	 * @param teamName the name and year of the team the players were both on
	 */
	public void addEdge(String player1, String player2, String teamName)
	{
		if (!adjList.containsKey(player1))
			adjList.put(player1, new LinkedList<Edge>());
		if (!adjList.containsKey(player2))
			adjList.put(player2, new LinkedList<Edge>());

		LinkedList<Edge> edgeList = adjList.get(player1);
		edgeList.addFirst(new Edge(player1, player2, teamName));

		// add edge in both directions for an undirected graph
		edgeList = adjList.get(player2);
		edgeList.addFirst(new Edge(player2, player1, teamName));
	}

	/**
	 * Calculates the shortest path between two specified players
	 * @param player1 the first player
	 * @param player2 the second player
	 * @return a String detailing the degrees of separation between the two players
	 */
	public String getShortestPathStr(String player1, String player2)
	{
		HashSet<String> seen = new HashSet<String>();	
		HashMap<String, Edge> parent = new HashMap<String, Edge>();
		
		Queue<String> aQueue = new LinkedList<String>();
		aQueue.add(player2);
		parent.put(player2, null);
		seen.add(player2);
	
		boolean done = false;
		// bfs
		while (!aQueue.isEmpty() && !done)
		{
			String front = aQueue.remove();
			LinkedList<Edge> list = adjList.get(front);
			for (Edge e : list)
			{
				String vertexName = e.dstVName;
				if (!seen.contains(vertexName))
				{
					aQueue.add(vertexName);
					parent.put(vertexName, e);
					seen.add(vertexName);
					if (vertexName.equals(player1))
					{
						done = true;
						break;
					}
				}
			}
		}

		if (!done)
			return "There is no connection between players " + player1 + " and " + player2 + "\n";
		
		String nextConnection = player1;
		String result = "";
		while (parent.get(nextConnection) != null)
		{
			Edge parentEdge = parent.get(nextConnection);
			result += nextConnection + " played with " + parentEdge.srcVName + " on " + parentEdge.label + "\n";
			nextConnection = parentEdge.srcVName;
		}

		return result;
	}
}
