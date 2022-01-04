# XWVM Reporting Server

A reporting server comprised of several components:

* Oracle Database - backend storage and APEX hosting
* node.js server - User-facing public APIs for data collection and receipt

## Disclaimer

This is at an early stage of development and may require additional setup not currently documented.

## Installation

### Database
Steps TBC

### nodejs / API server
Move the nodejs folder contents to an accessible directory on your server. When inside the directory, run:

```bash
npm install
```
to install the dependencies, and ensure you configure `dbconfig.js` with the appropriate settings for your (accessible) database.

## Usage

node.js server:
```
node xwvm_report_server.js
```

Alternatively, consider using an application manager such as pm2 to enable easier management and monitoring of the application, with conveniences such as autoscaling, enhanced monitoring and logging, and running as a service.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
