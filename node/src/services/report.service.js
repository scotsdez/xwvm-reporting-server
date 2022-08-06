const logger = require('../util/logger.util');
const helpers = require('../util/helpers.util');
const db = require('../services/db.service');

/*
	Report mission attempt
*/
async function reportMission(res, username, mission, outcome, gametype, extra, version)
{
  var userExists = await helpers.checkUserExists(username);
  if (userExists)
  {
    const missionSQL = "INSERT INTO "+db.getSchemaName()+".BUILD_REPORTING_MISSIONS (USER_ID, MISSION, OUTCOME, GAME_TYPE, EXTRA, VERSION, SUBMITTED) VALUES (:userID, :mission, :outcome, :gametype, :c, :version, SYSDATE)";
    const missionExtraJSON = JSON.stringify(extra);

    var reportMission = await db.executeQuery(missionSQL, {userID : userExists.ID, mission: mission, outcome: outcome, gametype: gametype, c: missionExtraJSON, version: version});  
    
    logger.logInfo(`Reported mission for ${username} (${userExists.ID}) | ${mission}`);
    
    res.status(200).json(
      { 
        result: "OK"
      }
    );
    return;
  }
  else
  {
    logger.logInfo(`ERR-503: User not found: ${username}`);
    res.status(200).json({ result: "REJECTED", message: "User not found" });
  }
}

/*
	Report issues/errors for given user
*/
async function reportIssues(res, username, version, issues)
{
  var userExists = await helpers.checkUserExists(username);
  if (userExists)
  {
    const issueSQL = "INSERT INTO "+db.getSchemaName()+".BUILD_REPORTING_ISSUES (USER_ID, VERSION, ISSUES, SUBMITTED) VALUES (:userID, :version, :c, SYSDATE)";
    const issueJSON = JSON.stringify(issues);

    var reportConfig = await db.executeQuery(issueSQL, {userID : userExists.ID, version: version, c: issueJSON});  
    
    logger.logInfo(`Reported errors/issues for ${username} (${userExists.ID})`);
    
    res.status(200).json(
      { 
        result: "OK"
      }
    );
    return;
  }
  else
  {
    logger.logInfo(`ERR-503: User not found: ${username}`);
    res.status(200).json({ result: "REJECTED", message: "User not found" });
  }
}

/*
	Report configuration for given user setup
*/
async function reportConfiguration(res, username, configuration, game, gameType, version)
{
  var userExists = await helpers.checkUserExists(username);
  if (userExists)
  {
    const configSQL = "INSERT INTO "+db.getSchemaName()+".BUILD_REPORTING_USER_CONFIGS (USER_ID, CONFIGURATION, GAME, GAME_TYPE, VERSION, SUBMITTED) VALUES (:userID, :c,:game, :gameType, :version, SYSDATE)";
    const configJSON = JSON.stringify(configuration);
    var reportConfig = await db.executeQuery(configSQL, {userID : userExists.ID, c: configJSON, game: game, gameType: gameType, version: version});  
    
    logger.logInfo(`Reported configuration for ${username} (${userExists.ID})`);
    
    res.status(200).json(
      { 
        result: "OK"
      }
    );
    return;
  }
  else
  {
    logger.logInfo(`ERR-504: User not found: ${username}`);
    res.status(200).json({ result: "REJECTED", message: "User not found" });
  }
}

/*
	Get Platforms
*/
async function getPlatforms(res)
{
    const configSQL = "SELECT * FROM "+db.getSchemaName()+".SYS_PLATFORMS";
    var returnedPlatforms = await db.executeQuery(configSQL);  
    
    res.status(200).json(
      { 
        result: "OK",
		payload: {
			platforms: returnedPlatforms.rows
		}
      }
    );
    return;
}

module.exports = {
	reportMission,
	reportIssues,
	reportConfiguration,
	getPlatforms
};
