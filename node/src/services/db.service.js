const oracledb = require('oracledb');
const dbConfig = require('../../config/config_db');

const logger = require('../util/logger.util');

// track whether the pool has been initialised to avoid NJS-047 errors in DB driver.
var poolCreated = false;

/* 
	Init database connection pool 
*/
async function initDB() 
{
	var poolMax = 5;
	var poolMin = 0;
	var poolPingInterval = 30;
	var poolTimeout = 60;
	var queueTimeout = 10000;
	
	logger.logInfo("Init DB connection pool.");

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

		logger.logInfo(`Database pool created, pool size ${poolMin}-${poolMax}, interval ${poolPingInterval}, timeout ${poolTimeout}, queue timeout ${queueTimeout}`);

		poolCreated = true;

	} catch (err) {
		logger.logError("init() error: " + err.message);
	}
}

/*
	Function to call DB with given query and bindParams (optional)
*/
async function executeQuery(query, bindParams)
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
			console.info(`Connection retry count: ${retryCount}`);
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

/**
 * Handle termination of DB connection pool (e.g. on application close)
 */
async function closePoolAndExit() 
{
	if (!poolCreated)
	{
		logger.logInfo("\nRequest to close pool received, but pool not opened, ignoring.");
		return;
	}

	logger.logInfo("\nTerminating connections.");
	try 
	{
		await oracledb.getPool().close(10);
		logger.logInfo("Shutdown: DB connection pool closed.");
		process.exit(0);
	} 
	catch (err) 
	{
		logger.logError(err.message);
		process.exit(1);
	}
}

function getSchemaName()
{
	return dbConfig.schema_name;
}

module.exports = {
	initDB,
	executeQuery,
	closePoolAndExit,
	getSchemaName
};