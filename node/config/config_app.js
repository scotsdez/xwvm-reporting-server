module.exports = {
	
	/*
	*	APP CONFIG SETTINGS
	*
	*	Settings controlling app behaviour for returned details to client, etc.
	*
    *   Also includes path details for HTTPS.
	*/
	
	announcementCount: 15,
    defaultPlatform: "WindowsPlayer",
    defaultVersion: "Unknown",
    useHTTPS: true,
    path_PrivateKey: "/etc/letsencrypt/live/YOUR_DOMAIN_HERE/privkey.pem",
    path_Certificate: "/etc/letsencrypt/live/YOUR_DOMAIN_HERE/fullchain.pem",
    path_CA: "/etc/letsencrypt/live/YOUR_DOMAIN_HERE/chain.pem"
};
