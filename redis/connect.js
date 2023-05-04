const {createClient} = require('redis');

const connectRedis = async (host, port, username, password) => {
    const client =  createClient({
        username,
        password,
        socket: { host, port }
    });

    client.on('error', err => console.log('Redis Client Error', err));
    await client.connect();
    console.log('redis connected');
    return client;
}

module.exports = {connectRedis};