import java.io.*;
import java.net.*;
import java.util.Scanner;
import java.util.ArrayList;

/**
 * Attempt to read all mlb player names and team history from baseball-reference.com and write results to file "player_list_complete.txt"
 */
public class MLBListGetter
{
	public static void main(String[] args) throws MalformedURLException, ProtocolException, IOException
	{
		PrintWriter outFile = null;
		try
		{
			outFile = new PrintWriter("player_list_complete.txt");
		}
		catch (FileNotFoundException e)
		{
			System.out.println("Couldn't write to \"player_list_complete.txt\"");
			return;
		}

		ArrayList<String> playerUrls = new ArrayList<String>();

		getPlayerUrls(playerUrls);
		writePlayers(playerUrls, outFile);

		outFile.close();	
	}
	
	/**
	 * Read the team history from each profile page and write it to the file
	 * @param playerUrls the array of urls
	 * @param outFile the file to write to
	 */
	public static void writePlayers(ArrayList<String> playerUrls, PrintWriter outFile) throws MalformedURLException, IOException, ProtocolException
	{
		int countDown = playerUrls.size();
		for (String str : playerUrls)
		{
			System.out.println(countDown--);

			URL url = new URL(str);
			HttpURLConnection conn = (HttpURLConnection) url.openConnection();
			conn.setRequestMethod("GET");
			Scanner in = new Scanner(conn.getInputStream());
			String line;

			while ((line = in.nextLine()).indexOf("<title>") == -1)
				;
			
			// Extract player's name
			String name = line.substring(line.indexOf("<title>") + 7, line.indexOf(" Stats"));

			// Skip Exceptions
			if (name.equals("Mark Kiger"))
				continue;

			while ((line = in.nextLine()).indexOf("id=\"all_appearances") == -1)
				;
			while ((line = in.nextLine()).indexOf("csk") == -1)
				;

			ArrayList<String> teamList = new ArrayList<String>();
			String firstYear = "";
			String yearStr = "";

			// Read all teams the player appeared with. Keep track of years played
			while (line.indexOf("csk") != -1)
			{
				yearStr = line.substring(line.indexOf("csk") + 5, line.indexOf("csk") +9);
				if (firstYear.equals(""))
					firstYear = yearStr;

				String teamStr = yearStr + " " + line.substring(line.indexOf("title") + 7, line.indexOf("\">"));
				teamList.add(teamStr);
				line = in.nextLine();
			}

			// Print info to file
			outFile.println(name + " (" + firstYear + "-" + yearStr + ")");
			for (String team : teamList)
				outFile.println(team);
			outFile.println("**END**");
		}
	}

	/**
	 * Get all the player profile urls
	 * @param playerUrls the list to store the urls in
	 */
	public static void getPlayerUrls(ArrayList<String> playerUrls) throws MalformedURLException, IOException, ProtocolException
	{
		String baseUrl = "https://www.baseball-reference.com";
		String playerDir = baseUrl + "/players";
		char letter = 'a';
		while (letter <= 'z')
		{
			URL url = new URL(playerDir + "/" + letter);
			HttpURLConnection conn = (HttpURLConnection) url.openConnection();
			conn.setRequestMethod("GET");
			Scanner in = new Scanner(conn.getInputStream());
			String line;

			while ((line = in.nextLine()).indexOf("id=\"div_players") == -1)
				;
			
			while ((line = in.nextLine()).indexOf("href") != -1)
			{
				String link = line.substring(line.indexOf("\"") + 1, line.lastIndexOf("\""));
				playerUrls.add(baseUrl + link);
			}

			letter++;
		}
	}
}
