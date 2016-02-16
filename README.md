# loopback-sandbox

A repository for reproducing [LoopBack community issues][wiki-issues].

[wiki-issues]: https://github.com/strongloop/loopback/wiki/Reporting-issues

# Error Description

When calling the REST API operation PUT /Test/{id}, the beforeRemote remote hook is triggered after the datasource is accessed to verifiy if the object with this id exists in the datasource. But according to the definition of the beforeRmote hook, it should be executed before anything else.

To call the functions I use the explorer on 0.0.0.0:3000/explorer. I added a simple Test model, and added a beforeRemote hook, an afterRemote hook, and an overridden getDataSource to the test.js (with console logs).

Note: In this example I use the memory db. But the same applies for mysql or mongodb database. If you want to check an example with the mysql, then check the branch mysql-test.

# Examples

1. Showing a correct case, using GET /Tests I try to get the list of Test objects, which should return an empty list, since nothing has been added.

	`curl -X GET --header "Accept: application/json" "http://0.0.0.0:3000/api/Tests"`

    Console Output:

    	model.beforeRemote: find
    	model.getDataSource
    	model.getDataSource
    	model.getDataSource
    	model.afterRemote: find

    Explorer Response Body:

    	[]

    Explorer Response Code

    	200

    In this case, first the beforeRemote hook triggers, then the data source is accessed, then the afterRemote triggers.

2. Showing the error case, using PUT /Tests{id} I try to update a Test object with id 1, which does not exist

	`curl -X PUT --header "Content-Type: application/json" --header "Accept: application/json" -d "{\"id\": 1}" "http://0.0.0.0:3000/api/Tests/1"`

    Console Output:

    	model.getDataSource
    	model.getDataSource
    	model.getDataSource
    	model.getDataSource
    	model.getDataSource

    Explorer Response Body:

    	{
    	  "error": {
    	    "name": "Error",
    	    "status": 404,
    	    "message": "could not find a model with id 1",
    	    "statusCode": 404,
    	    "code": "MODEL_NOT_FOUND",
    	    "stack": "Error: could not find a model with id 1\n    at /data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback/lib/model.js:166:19\n    at /data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-datasource-juggler/lib/dao.js:1629:62\n    at /data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-datasource-juggler/lib/dao.js:1561:9\n    at Object.async.each (/data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-datasource-juggler/node_modules/async/lib/async.js:153:20)\n    at allCb (/data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-datasource-juggler/lib/dao.js:1497:13)\n    at /data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-datasource-juggler/lib/connectors/memory.js:435:7\n    at /data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/async-listener/glue.js:188:31\n    at doNTCallback0 (node.js:428:9)\n    at process._tickDomainCallback (node.js:398:13)\n    at process.<anonymous> (/data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/async-listener/index.js:19:15)"
    	  }
    	}

    Explorer Response Code

    	404

    In this case, the datasource is accessed to check if the object with this id exists, but no beforeRemote hook has been triggered, and because the check for id fails, no beforeRemote hook is triggered at all.

3. Showing error case, using PUT /Tests{id} to update, but first adding an object with the given id using POST /Tests

    1. `curl -X POST --header "Content-Type: application/json" --header "Accept: application/json" -d "{\"id\": 1}" "http://0.0.0.0:3000/api/Tests"`

        Console Output:

        	model.beforeRemote: create
        	model.getDataSource
        	model.getDataSource
        	model.getDataSource
        	model.getDataSource
        	model.afterRemote: create

        Explorer Response Body:

        	{
        	  "id": 1
        	}

        Explorer Response Code

        	200

    2. `curl -X PUT --header "Content-Type: application/json" --header "Accept: application/json" -d "{\"id\": 1}" "http://0.0.0.0:3000/api/Tests/1"`

        Console Output:

            	model.getDataSource
            	model.getDataSource
            	model.getDataSource
            	model.getDataSource
            	model.getDataSource
            	model.beforeRemote: updateAttributes
            	model.getDataSource
            	model.getDataSource
            	model.afterRemote: updateAttributes

        Explorer Response Body:

            	{
            	  "id": 1
            	}

        Explorer Response Code

            	200

    This time, the call succeeds, since I have added the object before, but again the datasource is accessed before the beforeRemote hook triggers.

    I can also give a more verbose Console Debug where I print the names of the functions which are executed in the loopback-datasource-juggler dao.js:

    Verbose Console Output:

        	findById
        	findOne
        	find
        	getConnector
        	_getSetting
        	findById
        	model.getDataSource
        	findOne
        	model.getDataSource
        	find
        	model.getDataSource
        	getConnector
        	model.getDataSource
        	_getSetting
        	model.getDataSource
        	find
        	getConnector
        	_getSetting
        	model.beforeRemote: updateAttributes
        	updateAttributes
        	getConnector
        	_forDB
        	model.getDataSource
        	model.getDataSource
        	model.afterRemote: updateAttributes
