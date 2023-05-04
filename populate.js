const fs = require('fs');
const readline = require('readline');
const {createClient, Graph} = require('redis');
require('dotenv').config();

const people = readline.createInterface({
    input: fs.createReadStream('./data/People.csv'),
    output: process.stdout,
    terminal: false
});

let peopleCount = 0;
let playerHeaders = [];
let playerMap = new Map();
let teamMap;

let teammates = {};
let ramGraph = {};
people.on('line', (line) => {
    peopleCount++;
    if (peopleCount == 1) {
        playerHeaders = line.trim().split(',');
        return;
    }

    const player = {};
    const values = line.trim().split(',');
    playerHeaders.forEach((attr, i) => player[attr] = values[i]);
    playerMap.set(player.playerID, `${player.nameFirst} ${player.nameLast} (${player.debut.split('-')[0]} - ${player.finalGame.split('-')[0]})`);
});

people.on('close', () => {
    console.log('done reading players');
    const teams = readline.createInterface({
        input: fs.createReadStream('./data/Teams.csv'),
        output: process.stdout,
        terminal: false
    });

    let teamsCount = 0;
    let teamHeaders = [];
    teamMap = new Map();
    teams.on('line', (line) => {
        teamsCount++;
        if (teamsCount == 1) {
            teamHeaders = line.trim().split(',');
            return;
        }

        const team = {};
        const values = line.trim().split(',');
        teamHeaders.forEach((attr, i) => team[attr] = values[i]);
        teamMap.set(team.teamID, team.name);
    });


    teams.on('close', () => {
        console.log('done reading teams');
        const appearanceFiles = ['./data/Appearances.csv', './data/Batting.csv', './data/BattingPost.csv', './data/Fielding.csv', './data/FieldingPost.csv', './data/Pitching.csv'];
        let done = appearanceFiles.map(_ => false);
        for (let i = 0; i < appearanceFiles.length; i++) {
            let headers = [];
            const file = readline.createInterface({
                input: fs.createReadStream(appearanceFiles[i]),
                output: process.stdout,
                terminal: false
            });

            let lineCount = 0;
            file.on('line', (line) => {
                lineCount++;
                if (lineCount == 1) {
                    headers = line.split(',');
                    return;
                }

                let appearance = {};
                const values = line.split(',');
                headers.forEach((attr, i) => appearance[attr] = values[i]);
                const {playerID, teamID, yearID} = appearance;
                const teamName = `${teamMap.get(teamID)} ${yearID}`;
                if (!teammates[teamName]) {
                    teammates[teamName] = new Set();
                }

                teammates[teamName].add(playerMap.get(playerID));
            });

            file.on('close', () => {
                done[i] = true;
                console.log(`done reading ${appearanceFiles[i]}`)
                if (done.every(n => n === true)) {
                    console.log('done reading all appearance files');
                    upload();
                }
            })
        }
    })

});

const upload = async () => {
    const client = createClient({
        username: process.env.REDIS_RW_USERNAME,
        password: process.env.REDIS_RW_PASSWORD,
        socket: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        }
    });

    client.on('error', err => console.log('Redis Client Error', err));

    await client.connect();

    console.log('redis client connected');
    const graph = new Graph(client, process.env.REDIS_GRAPH_NAME);

    console.log('deleting players')
    await graph.query(
        'MATCH (p:Player) DELETE p'
    );
    console.log('deleting teams')
    await graph.query(
        'MATCH (t:Team) DELETE t'
    );

    const createPlayerQueries = [...playerMap.values()].map((pName, i) => graph.query(`CREATE (:Player { name: "${pName}", id: ${i}})`).catch((err) => console.log(`error creating player: ${err}`)));
    
    console.log('creating player nodes')
    try {
        await Promise.all(createPlayerQueries);

    } catch (err) {
        console.log(`error creating player nodes ${err}`)
        return;
    }
    
    console.log('done');

    const createTeamQueries = [...Object.keys(teammates)].map(tName => graph.query(`CREATE (:Team {name: "${tName}"})`).catch((err) => console.log(`error creating team: ${err}`)));
    console.log('creating team nodes')

    try {
        await Promise.all(createTeamQueries);
    } catch (err) {
        console.log(`error creating team nodes ${err}`);
        return;
    }

    console.log('done');

    console.log('adding indexes');
    try {
        await graph.query(`CREATE INDEX FOR (p:Player) ON (p.name)`);
        await graph.query(`CREATE INDEX FOR (p:Player) ON (p.id)`);
        await graph.query(`CREATE INDEX FOR (t:Team) ON (t.name)`);
    } catch (err) {
        console.log(`error creating indexes: ${err}`);
        return;
    }


    let numTeamsProcessed = 0;
    let total = Object.keys(teammates).length;
    for (const teamName in teammates) {     
       
        const teamPlayers = [...teammates[teamName]];
        let teamPlayerQueries = teamPlayers.map(playerName => graph.query(`MATCH (p:Player), (t:Team) WHERE p.name = "${playerName}" and t.name = "${teamName}" CREATE (p)-[:playsOn]->(t)`).catch(err => console.log(`error adding team player ${err}`)));
        let teammateQueries = [];
        for (let i = 0; i < teamPlayers.length; i++) {
            for (let j = i + 1; j < teamPlayers.length; j++) {
                if (!ramGraph[teamPlayers[i]] || !ramGraph[teamPlayers[i]].neighbors.has(teamPlayers[j])) {
                    if (!ramGraph[teamPlayers[i]]) {
                        ramGraph[teamPlayers[i]] = {neighbors: new Set()};
                    }

                    if (!ramGraph[teamPlayers[j]]) {
                        ramGraph[teamPlayers[j]] = {neighbors: new Set()};
                    }

                    ramGraph[teamPlayers[i]].neighbors.add(teamPlayers[j]);
                    ramGraph[teamPlayers[j]].neighbors.add(teamPlayers[i]);
                    teammateQueries.push(graph.query(`MATCH (p1:Player), (p2:Player) WHERE p1.name = "${teamPlayers[i]}" and p2.name = "${teamPlayers[j]}" CREATE (p1)-[:playsWith]->(p2)`).catch((err) => console.log(`error creating teammate: ${err}`)));
                    teammateQueries.push(graph.query(`MATCH (p1:Player), (p2:Player) WHERE p1.name = "${teamPlayers[j]}" and p2.name = "${teamPlayers[i]}" CREATE (p1)-[:playsWith]->(p2)`).catch((err) => console.log(`error creating teammate: ${err}`)));
                }
            }
        }

        try {
            await Promise.all(teamPlayerQueries.concat(teammateQueries));
        } catch (err) {
            console.log(`error creating team players / teammate relationships ${err}`);
        }
        console.log(`team queries done for ${teamName}. (${++numTeamsProcessed} / ${total})`)
    }


    console.log('all data uploaded');
}