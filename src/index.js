const express = require('express');

const app = express();
const port = 3001;
const connection = require('./config/database');
const route = require('./routes/indexRouter');
const cors = require('cors');

app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
connection.connect();
route(app);
app.listen(port, () => console.log(`Listening on port ${port}`));
