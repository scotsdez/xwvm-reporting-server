/***
* XWVM Reporting Server
*
* Note that db config is configured in the separate dbconfig.js file,
* expected to be located in the same directory.
*
* The server runs on port 3000 by default.
*/
const VERSION_ID = "0.118"

const oracledb = require('oracledb');
const express = require('express');
const bodyParser = require("body-parser");
const winston = require('winston');
const dbConfig = require('./dbconfig.js');
var helmet = require('helmet');
const app = express();
const port = 3000;

const schema_name = "APEX_USER";

const consoleTransport = new winston.transports.Console();
const myWinstonOptions = {
    transports: [consoleTransport]
};
const logger = new winston.createLogger(myWinstonOptions);

/* 
	Init database connection pool 
*/
async function init() {
	var poolMax = 5;
	var poolMin = 0;
	var poolPingInterval = 30;
	var poolTimeout = 60;
	var queueTimeout = 10000;
	
  try {
    await oracledb.createPool({
      user: dbConfig.user,
      password: dbConfig.password,
      connectString: dbConfig.connectString,
      poolMax: poolMax, // maximum size of the pool. Increase UV_THREADPOOL_SIZE if you increase poolMax
      poolMin: poolMin, // start with no connections; let the pool shrink completely
      poolPingInterval: poolPingInterval, // check aliveness of connection if idle in the pool for 30 seconds
      poolTimeout: poolTimeout, // terminate connections that are idle in the pool for 60 seconds
      queueTimeout: queueTimeout, // terminate getConnection() calls queued for longer than 10000 milliseconds
    });

	logger.info(`Database pool created, pool max ${poolMax} min ${poolMin} interval ${poolPingInterval} timeout ${poolTimeout} queue timeout ${queueTimeout}`);

  } catch (err) {
    logger.error("init() error: " + err.message);
  }
}

/*
	Report mission attempt
*/
async function func_ReportMission(res, username, mission, outcome, gametype, extra, version)
{
  var userExists = await checkUserExists(username);
  if (userExists)
  {
    const missionSQL = "INSERT INTO "+schema_name+".BUILD_REPORTING_MISSIONS (USER_ID, MISSION, OUTCOME, GAME_TYPE, EXTRA, VERSION, SUBMITTED) VALUES (:userID, :mission, :outcome, :gametype, :c, :version, SYSDATE)";
    const missionExtraJSON = JSON.stringify(extra);

    var reportMission = await func_CallDB(missionSQL, {userID : userExists.ID, mission: mission, outcome: outcome, gametype: gametype, c: missionExtraJSON, version: version});  
    
    logger.info(`Reported mission for ${username} (${userExists.ID}) | ${mission}`);
    
    res.status(200).json(
      { 
        result: "OK"
      }
    );
    return;
  }
  else
  {
    logger.info(`ERR-503: User not found: ${username}`);
    res.status(200).json({ result: "REJECTED", message: "User not found" });
  }
}

/*
	Report issues/errors for given user
*/
async function func_ReportIssues(res, username, version, issues)
{
  var userExists = await checkUserExists(username);
  if (userExists)
  {
    const issueSQL = "INSERT INTO "+schema_name+".BUILD_REPORTING_ISSUES (USER_ID, VERSION, ISSUES, SUBMITTED) VALUES (:userID, :version, :c, SYSDATE)";
    const issueJSON = JSON.stringify(issues);

    var reportConfig = await func_CallDB(issueSQL, {userID : userExists.ID, version: version, c: issueJSON});  
    
    logger.info(`Reported errors/issues for ${username} (${userExists.ID})`);
    
    res.status(200).json(
      { 
        result: "OK"
      }
    );
    return;
  }
  else
  {
    logger.info(`ERR-503: User not found: ${username}`);
    res.status(200).json({ result: "REJECTED", message: "User not found" });
  }
}

/*
	Report configuration for given user setup
*/
async function func_ReportConfiguration(res, username, configuration, game, gameType, version)
{
  var userExists = await checkUserExists(username);
  if (userExists)
  {
    const configSQL = "INSERT INTO "+schema_name+".BUILD_REPORTING_USER_CONFIGS (USER_ID, CONFIGURATION, GAME, GAME_TYPE, VERSION, SUBMITTED) VALUES (:userID, :c,:game, :gameType, :version, SYSDATE)";
    const configJSON = JSON.stringify(configuration);
    var reportConfig = await func_CallDB(configSQL, {userID : userExists.ID, c: configJSON, game: game, gameType: gameType, version: version});  
    
    logger.info(`Reported configuration for ${username} (${userExists.ID})`);
    
    res.status(200).json(
      { 
        result: "OK"
      }
    );
    return;
  }
  else
  {
    logger.info(`ERR-504: User not found: ${username}`);
    res.status(200).json({ result: "REJECTED", message: "User not found" });
  }
}

/*
	Report login/access for given user
*/
async function func_ReportUserLogin(res, username)
{
  var userExists = await checkUserExists(username);
  if (userExists)
  {
    const raSQL = "INSERT INTO "+schema_name+".BUILD_REPORTING_ACCESS_LOG (USERNAME, ACCESS_DATE) VALUES (:username, SYSDATE)";
    var reportAccess = await func_CallDB(raSQL, {username});  
    
    logger.info(`Reported successful login attempt for ${username} | ${userExists.FULLNAME}`);
    
    var latestRelease = await func_CallDB("SELECT release_date, name, download_url FROM "+schema_name+".RELEASE ORDER BY release_date DESC FETCH NEXT 1 ROWS ONLY");
    var announcementsRes = await func_CallDB("SELECT * FROM "+schema_name+".ANNOUNCEMENTS ORDER BY PUBLISH_DATE DESC FETCH NEXT 15 ROWS ONLY");
    
    var anNew = [];
    for (var i=0; i<announcementsRes.rows.length; i++)
    {
      anNew.push(util_LowercaseObjectKeys(announcementsRes.rows[i]));
    }
    
    res.status(200).json(
      { 
        result: "OK", 
        payload: 
          { 
          fullname : userExists.FULLNAME, 
          is_validated : false, 
          latest_release : util_LowercaseObjectKeys(latestRelease.rows[0]), 
          announcements: anNew
          }
      }
    );
    return;
  }
  else
  {
    logger.info(`User not found: ${username}`);
    res.status(200).json({ result: "REJECTED", message: "User not found" });
  }
}

/*
	Check if the given user exists and is active. Returns user data if valid, otherwise false.
	User data returned includes id, username and fullname.
*/
async function checkUserExists(username)
{
  const usrSQL = "SELECT * FROM "+schema_name+".USERS WHERE USERNAME = :username AND ACTIVE = 'Y'";
  var result = await func_CallDB(usrSQL, { username });
  
  if (result != null)
  {
    if (result.rows.length >= 1)
    {
      return result.rows[0];
    }
  }
  return false;
}

/*
	Utility function to call DB with given query and bindParams (optional)
*/
async function func_CallDB(query, bindParams)
{
  let connection;
  var result;
  if (bindParams == null)
  {
    bindParams = []
  }
  
  var retryCount = 2;
  while (retryCount > 0)
  {
	    try {
		 // Checkout a connection from the default pool
		connection = await oracledb.getConnection();

		result = await connection.execute(query, bindParams, {outFormat: oracledb.OUT_FORMAT_OBJECT});
		
		// commit if there are any rows affected.
		if (result != null)
		{
		  if (result.rowsAffected >= 1)
		  {
			connection.commit();
		  }
		}
	  } catch (err) {
		console.error(err);
		// decrement retry counter and try again if applicable
		retryCount -= 1;
		console.info("Connection retry count: ${retryCount}");
	  } finally {
		if (connection) {
		  try {
			await connection.close();
		  } catch (err) {
			console.error(err);
		  }  
		}
		// successful connection, flag no retry required.
		retryCount = 0;
	  }  
	  
  }
  

  return result;
}

// Utility string for empty check
function util_StringIsEmpty(str) {
    return (!str || /^\s*$/.test(str));
}

// Convert given object key names to lower case. 
// Includes polyfill for older ES runtimes
function util_LowercaseObjectKeys(obj) {
  // polyfill for < ES10
  if (!Object.fromEntries)
  {
    Object.fromEntries = arr => Object.assign({}, ...Array.from(arr, ([k, v]) => ({[k]: v}) ));
  }

  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));
}

// Report an error
function handleError(res, text, err) 
{
  if (err) 
  {
    text += ": " + err.message;
  }
  console.error(text);
  res.status(500).send(text);
}

async function closePoolAndExit() 
{
  logger.info("\nTerminating connections.");
  try 
  {
    await oracledb.getPool().close(10);
    logger.info("Shutdown: DB connection pool closed.");
    process.exit(0);
  } 
  catch (err) 
  {
    logger.error(err.message);
    process.exit(1);
  }
}

process
  .once('SIGTERM', closePoolAndExit)
  .once('SIGINT',  closePoolAndExit);

init();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(helmet());

/* 
*******************************
*	Express endpoint handling
*******************************
*/

/*
	Default listen path, return version number
*/
app.get('/', (req, res) => {
  res.send(`XWVM Alpha Reporting Services - ${VERSION_ID}`);
});


/*
	Endpoint: Report player configuration and version
*/
app.post('/services/reportAccess', (req,res) => {
  var username = req.body.username;
  if (!util_StringIsEmpty(username))
  {
    func_ReportUserLogin(res, username);
  }
  else
  {
    res.status(400).json({ result: "ERROR", message: "No username supplied, login aborted." });
    logger.info("ERR-501A: Rejected login request as no username supplied.");
  }
});

/*
	Endpoint: Report player configuration and version
*/
app.post('/services/reportConfig', (req,res) => {
  var username = req.body.username;
  var configuration = req.body.configuration;
  var game = req.body.game;
  var gameType = req.body.gameType;
  var version = req.body.version;
  
  if (!util_StringIsEmpty(username))
  {
    func_ReportConfiguration(res, username, configuration, game, gameType, version);
  }
  else
  {
    logger.info(req.body);
    res.status(400).json({ result: "ERROR", message: "No username supplied, configuration report not submitted." });
    logger.info("ERR-501B: Rejected configuration submission request as no username supplied.");
  }
});

/*
	Endpoint: Report issues (errors)
*/
app.post('/services/reportIssues', (req,res) => {
  var username = req.body.username;
  var version = req.body.version;
  var issues = req.body.issues;
  if (!util_StringIsEmpty(username))
  {
    func_ReportIssues(res, username, version, issues);
  }
  else
  {
    logger.info(req.body);
    res.status(400).json({ result: "ERROR", message: "No username supplied, issue report not submitted." });
    logger.info("ERR-501C: Rejected issue/error submission request as no username supplied.");
  }
});

/*
	Endpoint: Report mission attempt
*/
app.post('/services/reportMission', (req,res) => {
  var username = req.body.username;
  var mission = req.body.mission;
  var outcome = req.body.outcome;
  var gametype = req.body.gameType;
  var version = req.body.version;
  var extra = req.body.extra;
  
  if (version == null)
  {
    version = "Unknown";
  }
  else if (util_StringIsEmpty(version))
  {
    version = "Unknown";
  }
  
  if (!util_StringIsEmpty(username))
  {
    func_ReportMission(res, username, mission, outcome, gametype, extra, version);
  }
  else
  {
    res.status(400).json({ result: "ERROR", message: "No username supplied, mission report not submitted." });
    logger.info("ERR-501D: Rejected mission submission report as no username supplied.");
  }
});

// Start express app
app.listen(port, () => {
  logger.info(`XWVM Alpha Reporting Services ${VERSION_ID} listening at http://localhost:${port}`)
});