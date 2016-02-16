# loopback-sandbox

A repository for reproducing [LoopBack community issues][wiki-issues].

[wiki-issues]: https://github.com/strongloop/loopback/wiki/Reporting-issues

# Error Description

When calling the REST API operation PUT /CoffeeShop/{id}, the beforeRemote remote hook is triggered after the datasource is accessed to verifiy if the object with this id exists in the datasource. But according to the definition of the beforeRmote hook, it should be executed before anything else.

To call the functions I use the explorer on 0.0.0.0:3000/explorer. I added a simplified CoffeeShop model, and added a beforeRemote hook, an afterRemote hook, and an overridden getDataSource to the coffee-shop.js (with console logs). And I am using the mysql database available from the getting started tutorials.

# Examples

1. Showing a correct case, using GET /CoffeeShops I try to get the list of CoffeeShop objects, which should returns a list of three items

	`curl -X GET --header "Accept: application/json" "http://0.0.0.0:3000/api/CoffeeShops"`

    Console Output:

    	model.beforeRemote: find
    	model.getDataSource
    	model.getDataSource
    	model.getDataSource
    	model.afterRemote: find

    Explorer Response Body:

    	[
		  {
		    "id": 1
		  },
		  {
		    "id": 2
		  },
		  {
		    "id": 3
		  }
		]

    Explorer Response Code

    	200

    In this case, first the beforeRemote hook triggers, then the data source is accessed, then the afterRemote triggers.

2. Showing the error case, using PUT /CoffeeShops{id} I try to update a CoffeeShop object with id 4, which does not exist

	`curl -X PUT --header "Content-Type: application/json" --header "Accept: application/json" -d "{\"id\": 4}" "http://0.0.0.0:3000/api/CoffeeShops/4"`

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
		    "message": "could not find a model with id 4",
		    "statusCode": 404,
		    "code": "MODEL_NOT_FOUND",
		    "stack": "Error: could not find a model with id 4\n    at /data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback/lib/model.js:166:19\n    at /data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-datasource-juggler/lib/dao.js:1564:62\n    at /data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-datasource-juggler/lib/dao.js:1495:9\n    at Object.async.each (/data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-datasource-juggler/node_modules/async/lib/async.js:153:20)\n    at allCb (/data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-datasource-juggler/lib/dao.js:1431:13)\n    at /data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-connector/lib/sql.js:1071:7\n    at /data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-datasource-juggler/lib/observer.js:166:22\n    at doNotify (/data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-datasource-juggler/lib/observer.js:93:49)\n    at MySQL.ObserverMixin._notifyBaseObservers (/data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-datasource-juggler/lib/observer.js:116:5)\n    at MySQL.ObserverMixin.notifyObserversOf (/data/Projects/dobots/CloudAPI/examples/loopback-sandbox/node_modules/loopback-datasource-juggler/lib/observer.js:91:8)"
		  }
		}

    Explorer Response Code

    	404

    In this case, the datasource is accessed to check if the object with this id exists, but no beforeRemote hook has been triggered, and because the check for id fails, no beforeRemote hook is triggered at all.

3. Showing error case, using PUT /CoffeeShops{id} to update, but first adding an object with the given id using POST /CoffeeShops

    1. `curl -X POST --header "Content-Type: application/json" --header "Accept: application/json" -d "{\"id\": 4}" "http://0.0.0.0:3000/api/CoffeeShops"`

        Console Output:

        	model.beforeRemote: create
        	model.getDataSource
        	model.getDataSource
        	model.getDataSource
        	model.getDataSource
        	model.afterRemote: create

        Explorer Response Body:

        	{
        	  "id": 4
        	}

        Explorer Response Code

        	200

    2. `curl -X PUT --header "Content-Type: application/json" --header "Accept: application/json" -d "{\"id\": 4}" "http://0.0.0.0:3000/api/CoffeeShops/4"`

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
            	  "id": 4
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
