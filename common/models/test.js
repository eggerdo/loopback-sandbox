module.exports = function(model) {

	DS = undefined;

	model.beforeRemote('**', function(ctx, unused, next) {
		console.log("model.beforeRemote: " + ctx.method.name);
		DS = undefined;
		model.updateDs(ctx, next);
	});

	model.getDataSource = function() {
		console.log("model.getDataSource:", DS ? DS.settings.name : DS);
		return DS;
	};

	model.afterRemote('**', function(ctx, unused, next) {
		console.log("model.afterRemote: " + ctx.method.name);
		next();
	});

	model.observe('access', function(ctx, next) {
		console.log("model.access:", ctx.req);
		next();
	});

	model.updateDs = function(ctx, next) {

		// function takes the user,then updates the database, i.e. create a new database if it doesn't exist already.
		// for my own debugging purposes, if user or it's realm is undefined I use the default db, but in
		// the end that shouldn't occur anymore. In either case, the remote calls will have to return an error
		update = function(user, next) {
			if (user && user.realm) {
				if (!model.app.dataSources[user.realm]) {
					// obtain the url format then use the user realm variable to change
					// the database name. host, port, user and password stays the same
					url = util.format(app.get('db_url'), user.realm);
					model.app.dataSources[user.realm] = loopback.createDataSource({
						connector: "mongodb",
						url: url
					});
					model.app.dataSources[user.realm].on('connected', function() {
						next();
					});
					DS = model.app.dataSources[user.realm];
					return;
				}

				DS = model.app.dataSources[user.realm];
				next();
			} else {
				console.log("attach default");
				DS = model.app.dataSources["db"];
				next();
			}
		}

		// based on the userId in the access token I obtain the user.
		if (ctx.req.accessToken) {
			this.app.models.User.findById(ctx.req.accessToken.userId, function(err, user) {
				update(user, next);
			});
		} else {
			update(undefined, next);
		}
	}

};
