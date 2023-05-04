const { Graph } = require('redis');
const { connectRedis } = require('../redis/connect');
require('dotenv').config();

let client, graph;
const connect = async () => {
    try {
        client = await connectRedis(process.env.REDIS_HOST, process.env.REDIS_PORT, process.env.REDIS_RO_USERNAME, process.env.REDIS_RO_PASSWORD);
        graph = new Graph(client, process.env.REDIS_GRAPH_NAME);
    } catch (err) {
        console.log(`error connecting to redis`);
        throw err;
    }
}

connect();


const getAllPlayers = async (req, res) => {

    let batch1, batch2, batch3;
    try {
        batch1 = await graph.roQuery(`MATCH (p:Player) WHERE p.id < 10000 RETURN p ORDER BY p.id ASC`);
        batch2 = await graph.roQuery(`MATCH (p:Player) WHERE p.id >= 10000 and p.id < 20000 RETURN p ORDER BY p.id ASC`);
        batch3 = await graph.roQuery(`MATCH (p:Player) WHERE p.id >= 20000 RETURN p ORDER BY p.id ASC`);
    } catch (err) {
        console.log(`error getting all players ${err}`);
        res.status(500).send('');
        return;
    }

    const players = batch1.data.concat(batch2.data).concat(batch3.data).map(e => e.p.properties);

    res.status(200).json({players});
}

const getShortestPath = async (req, res) => {
    let {player1, player2} = req.query;
    player1 = parseInt(player1);
    player2 = parseInt(player2);

    if (isNaN(player1) || isNaN(player2)) {
        res.status(400).send('');
        return;
    }

    if (player1 < 0 || player1 > process.env.MAX_PID) {
        res.status(400).send('');
        return;
    }

    if (player2 < 0 || player2 > process.env.MAX_PID) {
        res.status(400).send('');
        return;
    }


    let result;
    try {
        result = await graph.roQuery(
            `MATCH (a:Player {id: ${player1}}), (b:Player {id: ${player2}}) RETURN shortestPath((a)-[:playsWith*]->(b)) as res`);
    } catch (err) {
        console.log(`error getting shortest path. ${err}`);
        res.status(500).send('');
        return;
    }
    
    
    const names = result.data[0].res ? result.data[0].res.nodes.map(n => n.properties.name) : [];
    let pairs = [];
    for (let i = 1; i < names.length; i++) {

        let teams1, teams2;
        try {
            teams1 = await graph.roQuery(`MATCH (t:Team)<-[:playsOn]-(:Player {name: "${names[i-1]}"}) RETURN t as res `);
            teams2 = await graph.roQuery(`MATCH (t:Team)<-[:playsOn]-(:Player {name: "${names[i]}"}) RETURN t as res`);
        } catch (err) {
            console.log(`error getting teammates. ${err}`);
            res.status(500).send('');
            return;
        }
       
    
        teams1 = teams1.data.map(e => e.res.properties.name);
        teams2 = teams2.data.map(e => e.res.properties.name);
    
    
        const commonTeam = teams1.filter(t => teams2.includes(t))[0];
        pairs.push({name1: names[i-1], name2: names[i], team: commonTeam});
    }

    res.status(200).json(pairs);
}

module.exports = {getAllPlayers, getShortestPath};