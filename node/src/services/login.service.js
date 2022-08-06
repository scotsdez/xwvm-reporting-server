const logger = require('../util/logger.util');
const helpers = require('../util/helpers.util');
const db = require('../services/db.service');
const appConfig = require('../../config/config_app');

/*
	Report login/access for given user
*/
async function reportUserLogin(res, username, platform)
{
  var userExists = await helpers.checkUserExists(username);
  if (userExists)
  {
	  try
	  {
		const raSQL = "INSERT INTO "+db.getSchemaName()+".BUILD_REPORTING_ACCESS_LOG (USERNAME, ACCESS_DATE) VALUES (:username, SYSDATE)";
		var reportAccess = await db.executeQuery(raSQL, {username});  
		
		logger.logInfo(`Reported successful login attempt for ${username} | ${userExists.FULLNAME}`);
		
		var releaseQuery = "select RELEASE.RELEASE_DATE as RELEASE_DATE, RELEASE.NAME as NAME, RELEASE.DOWNLOAD_URL as DOWNLOAD_URL, SYS_PLATFORMS.PLATFORM_NAME as PLATFORM_NAME from "+db.getSchemaName()+".RELEASE LEFT JOIN "+db.getSchemaName()+".SYS_PLATFORMS ON RELEASE.PLATFORM = SYS_PLATFORMS.ID WHERE SYS_PLATFORMS.PLATFORM_NAME = '"+platform+"' ORDER BY RELEASE.RELEASE_DATE DESC FETCH NEXT 1 ROWS ONLY";
			
		var latestRelease = await db.executeQuery(releaseQuery);
		var announcementsRes = await db.executeQuery("SELECT * FROM "+db.getSchemaName()+".ANNOUNCEMENTS ORDER BY PUBLISH_DATE DESC FETCH NEXT "+ appConfig.announcementCount +" ROWS ONLY");
		
		var anNew = [];
		for (var i=0; i<announcementsRes.rows.length; i++)
		{
		  anNew.push(helpers.lowercaseObjectKeys(announcementsRes.rows[i]));
		}
		
		// if no results or empty, standardise object to prevent errors.
		var releaseToStandardise = false;
		
		if (!latestRelease)
		{
			releaseToStandardise = true;
			
		}
		else if (latestRelease.rows.length <= 0) 
		{
			releaseToStandardise = true;
		}
		
		if (releaseToStandardise)
		{
			var lr = [];
			lr[0] = { release_date: new Date(2000,12,31), name:	"", download_url: "" };
			
			latestRelease = { rows: lr };
		}
		
		res.status(200).json(
		  { 
			result: "OK", 
			payload: 
			{ 
				fullname : userExists.FULLNAME, 
				is_validated : false, 
				latest_release : helpers.lowercaseObjectKeys(latestRelease.rows[0]), 
				announcements: anNew
			}
		  }
		);
	  }
	catch (e)
	{
		console.log("Error: " + e);
		res.status(500);
	}
    return;
  }
  else
  {
    logger.logInfo(`User not found: ${username}`);
    res.status(200).json({ result: "REJECTED", message: "User not found" });
  }
}


module.exports = {
	reportUserLogin
};
