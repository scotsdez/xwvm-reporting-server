/**
* Generic helpers
**/
const db = require('../services/db.service');

// Utility string for empty check
function stringIsEmpty(str) {
    return (!str || /^\s*$/.test(str));
}

// Convert given object key names to lower case. 
// Includes polyfill for older ES runtimes
function lowercaseObjectKeys(obj) {
  // polyfill for < ES10
  if (!Object.fromEntries)
  {
    Object.fromEntries = arr => Object.assign({}, ...Array.from(arr, ([k, v]) => ({[k]: v}) ));
  }

  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));
}

/*
	Check if the given user exists and is active. Returns user data if valid, otherwise false.
	User data returned includes id, username and fullname.
*/
async function checkUserExists(username)
{
	const usrSQL = "SELECT * FROM "+db.getSchemaName()+".USERS WHERE USERNAME = :username AND ACTIVE = 'Y'";
	var result = await db.executeQuery(usrSQL, { username });

	if (result != null)
	{
		if (result.rows.length >= 1)
		{
			return result.rows[0];
		}
	}
	return false;
}

module.exports = {
  stringIsEmpty,
  lowercaseObjectKeys,
  checkUserExists
}