const logger = require('../util/logger.util');
const helpers = require('../util/helpers.util');
const loginService = require('../services/login.service');
const reportService = require('../services/report.service');
const appConfig = require('../../config/config_app');

/*
	Endpoint: Report player configuration and version
*/
async function reportAccess(req, res)
{
	var username = req.body.username;
	var platform = req.body.platform;
	if (helpers.stringIsEmpty(platform))
	{
		platform = appConfig.defaultPlatform;
	}
	if (!helpers.stringIsEmpty(username))
	{
		loginService.reportUserLogin(res, username, platform);
	}
	else
	{
		res.status(400).json({ result: "ERROR", message: "No username supplied, login aborted." });
		logger.logInfo("ERR-501A: Rejected login request as no username supplied.");
	}
}

/*
	Endpoint: Report player configuration and version
*/
async function reportConfig(req, res)
{
	var username = req.body.username;
	var configuration = req.body.configuration;
	var game = req.body.game;
	var gameType = req.body.gameType;
	var version = req.body.version;
	
	if (!helpers.stringIsEmpty(username))
	{
		reportService.reportConfiguration(res, username, configuration, game, gameType, version);
	}
	else
	{
	  logger.logInfo(req.body);
	  res.status(400).json({ result: "ERROR", message: "No username supplied, configuration report not submitted." });
	  logger.logInfo("ERR-501B: Rejected configuration submission request as no username supplied.");
	}
}

/*
	Endpoint: Report issues (errors)
*/
async function reportIssues(req, res)
{
	var username = req.body.username;
	var version = req.body.version;
	var issues = req.body.issues;

	if (!helpers.stringIsEmpty(username))
	{
	  reportService.reportIssues(res, username, version, issues);
	}
	else
	{
	  logger.logInfo(req.body);
	  res.status(400).json({ result: "ERROR", message: "No username supplied, issue report not submitted." });
	  logger.logInfo("ERR-501C: Rejected issue/error submission request as no username supplied.");
	}
}

/*
	Endpoint: Report mission attempt
*/
async function reportMission(req, res)
{
	var username = req.body.username;
	var mission = req.body.mission;
	var outcome = req.body.outcome;
	var gametype = req.body.gameType;
	var version = req.body.version;
	var extra = req.body.extra;
	
	if (version == null)
	{
	  version = appConfig.defaultVersion;
	}
	else if (helpers.stringIsEmpty(version))
	{
	  version = appConfig.defaultVersion;
	}
	
	if (!helpers.stringIsEmpty(username))
	{
		reportService.reportMission(res, username, mission, outcome, gametype, extra, version);
	}
	else
	{
	  res.status(400).json({ result: "ERROR", message: "No username supplied, mission report not submitted." });
	  logger.logInfo("ERR-501D: Rejected mission submission report as no username supplied.");
	}
}

/*
	Endpoint: Get Platforms
*/
async function getPlatforms(req, res)
{
	reportService.getPlatforms(res);
}

module.exports = {
	reportAccess,
	reportConfig,
	reportIssues,
	reportMission,
	getPlatforms
};