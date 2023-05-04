const express = require('express');
const playerRouter = require('./routes/players');
const {getAllPlayers} = require('./controller/players')
require('dotenv').config();

const app = express();
app.use(express.json());
app.use('/players/', playerRouter);

app.use(express.static('./public'));

app.listen(process.env.PORT, console.log(`Server is listening on port ${process.env.PORT}`));