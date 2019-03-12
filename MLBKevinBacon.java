import java.util.*;
import java.io.FileReader;
import java.io.IOException;

import com.github.jacklove5.mlbkevinbacon.*;

/**
 * Prompts user from two mlb players, displays the degrees of separation between them
 */
public class MLBKevinBacon
{
	public static void main(String args[])
	{
		FileReader inFile = null;
		
		try
		{
			inFile = new FileReader("player_list_complete.txt");
		}
		catch (IOException e)
		{
			System.out.println("Couldn't open file \"player_list_complete.txt\"");
			return;
		}

		// Key: team name
		// Value: list of team member names
		HashMap<String, ArrayList<String>> teamMap = new HashMap<String, ArrayList<String>>();

		ArrayList<String> playerList = new ArrayList<String>();
		MLBGraph graph = new MLBGraph();

		System.out.println("Reading file");
		readFile(inFile, playerList, teamMap);

		System.out.println("Building Graph");
		buildGraph(graph, teamMap);

		// Get players
		String player1 = getPlayerFromUser(playerList);
		String player2 = getPlayerFromUser(playerList);

		// Print connection
		System.out.println();
		System.out.println(graph.getShortestPathStr(player1, player2));	
	}
	public static String getPlayerFromUser(ArrayList<String> playerList)
	{
		ArrayList<String> matches = null;
		Scanner userIn = null;

		do
		{
			userIn = new Scanner(System.in);
			System.out.print("Enter the name of any MLB player: ");
			String player = userIn.nextLine();

			matches = getMatchingNames(playerList, player);
			if (matches.isEmpty())
				System.out.println("Player \"" + player + "\" does not exist");
	
		} while (matches.isEmpty());
		
		if (matches.size() == 1)
		{
			System.out.println("Found player: " + matches.get(0));
			return matches.get(0);
		}
		else
		{
			System.out.println("Multiple matches found. Specify (enter number): ");
			for (int i = 0; i < matches.size(); i++)
				System.out.println(i+1 + ". " + matches.get(i));

			int response = -1;
			do
			{
				String line = userIn.nextLine();
				Scanner strScan = new Scanner(line);
				if (strScan.hasNextInt())
					response = strScan.nextInt();
			} while (!(response >= 1 && response <= matches.size()));

			return matches.get(response-1);
		}

	}

	public static ArrayList<String> getMatchingNames(ArrayList<String> playerList, String toFind)
	{
		toFind = toFind.toLowerCase();
		ArrayList<String> matches = new ArrayList<String>();		
		for (String s : playerList)
		{
			String name = s.substring(0, s.indexOf(" ("));
			name = name.toLowerCase();
			if (name.equals(toFind))
			{
				matches.add(s);
			}
		}

		return matches;
	}

	public static void buildGraph(MLBGraph graph, HashMap<String, ArrayList<String>> teamMap)
	{
		Iterator teamIt = teamMap.entrySet().iterator();
		// For each team in the mlb
		while (teamIt.hasNext())
		{
			Map.Entry pair = (Map.Entry) teamIt.next();
			ArrayList<String> playerList = (ArrayList<String>) pair.getValue();
			String teamName = (String) pair.getKey();

			// Add edges between all pairs of teammates
			for (int i = 0; i < playerList.size(); i++)
			{
				for (int j = i+1; j < playerList.size(); j++)
				{
					graph.addEdge(playerList.get(i), playerList.get(j), teamName);
				}
			}
		}
	}

	public static void readFile(FileReader inFile, ArrayList<String> playerList, HashMap<String, ArrayList<String>> teamMap)
	{
		Scanner in = new Scanner(inFile);
		while (in.hasNextLine())
		{
			// Read player name
			String name = in.nextLine();
			playerList.add(name);

			String teamName;
			
			// Read player's team history
			while (!(teamName = in.nextLine()).equals("**END**"))
			{
			
				if (!teamMap.containsKey(teamName))
				{
					ArrayList<String> newPlayerList = new ArrayList<String>();
					newPlayerList.add(name);
					teamMap.put(teamName, newPlayerList);
				}
				else
				{
					ArrayList<String> pList = teamMap.get(teamName);
					pList.add(name);
				}
			}
		}

		in = null;
		try
		{
			inFile.close();
		}
		catch (IOException e)
		{
			System.out.println("Couldn't close input file");
			return;
		}
	}
}
