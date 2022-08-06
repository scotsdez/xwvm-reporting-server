const express = require('express');
const router = express.Router();

const servicesController = require('../controllers/services.controller');

/*
	Endpoint: Report player configuration and version
*/
router.post('/reportAccess', servicesController.reportAccess);

/*
	Endpoint: Report player configuration and version
*/
router.post('/reportConfig', servicesController.reportConfig);

/*
	Endpoint: Report issues (errors)
*/
router.post('/reportIssues', servicesController.reportIssues);

/*
	Endpoint: Report mission attempt
*/
router.post('/reportMission', servicesController.reportMission);

/*
	Endpoint: Available Platforms (mostly for performance testing)
*/
router.get('/getPlatforms', servicesController.getPlatforms);

module.exports = router;