module.exports = {
	
	/*
	*	DB CONFIG SETTINGS
	*
	*	Set username (user) and password details, as well as the
	*	connection string for the Oracle DB - this assumes node-oracledb
	*   has been installed and configured correctly in your environment.
	*
	*/
	
	user : process.env.NODE_ORACLEDB_USER || "",

	// if not using external auth
	password : process.env.NODE_ORACLEDB_PASSWORD || "",

	// For information on connection strings see:
	// https://oracle.github.io/node-oracledb/doc/api.html#connectionstrings
	connectString : process.env.NODE_ORACLEDB_CONNECTIONSTRING || "",

	// Optional, defaults to false
	// externalAuth : process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
};