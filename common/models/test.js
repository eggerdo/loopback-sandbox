module.exports = function(model) {

	model.beforeRemote('**', function(ctx, unused, next) {
		console.log("model.beforeRemote: " + ctx.method.name);
		next();
	});

	model.getDataSource = function() {
		console.log("model.getDataSource");
		return this.dataSource;
	}

	model.afterRemote('**', function(ctx, unused, next) {
		console.log("model.afterRemote: " + ctx.method.name);
		next();
	});

};
