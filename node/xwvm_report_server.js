/***
* XWVM Reporting Server
*
* Note that db config is configured in the separate dbconfig.js file,
* expected to be located in the same directory.
*
* The server runs on port 3000 by default.
*/
const VERSION_ID = "0.123"

const fs = require("fs");
const https = require('https');
const express = require('express');
const bodyParser = require("body-parser");
const helmet = require('helmet');
const app = express();
const port = 3000;

const logger = require('./src/util/logger.util');
const db = require('./src/services/db.service');
const servicesRouter = require('./src/routes/services.route');

const appConfig = require('./config/config_app');

logger.logInfo(`XWVM Alpha Reporting Services ${VERSION_ID} startup`);

// Certificate
var privateKey;
var certificate;
var ca;

// database closure and init
process
  .once('SIGTERM', db.closePoolAndExit)
  .once('SIGINT',  db.closePoolAndExit);

db.initDB();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(helmet());
app.disable('x-powered-by');

/*
	Default listen path, return version number
*/
app.get('/', (req, res) => {
  res.send(`XWVM Alpha Reporting Services - ${VERSION_ID}`);
});

app.use('/services', servicesRouter);

// Start express app
if (appConfig.useHTTPS)
{
  try {
    privateKey = fs.readFileSync(appConfig.path_PrivateKey, 'utf8');
    certificate = fs.readFileSync(appConfig.path_Certificate, 'utf8');
    ca = fs.readFileSync(appConfig.path_CA, 'utf8');
  }
  catch (e)
  {
    logger.logError("ERR-000H: Unable to start HTTPS server as certificate files not available.");
    process.exit(e ? 1 : 0);
  }

  https
    .createServer(
      {
        key: privateKey,
        cert: certificate,
      },
      app
    )
    .listen(port, ()=>{
    logger.logInfo(`XWVM Alpha Reporting Services ${VERSION_ID} listening at https://localhost:${port}`);
  });
}
else
{
  http
    .createServer(app)
    .listen(port, ()=>{
    logger.logInfo(`XWVM Alpha Reporting Services ${VERSION_ID} listening at https://localhost:${port}`);
  });
}

