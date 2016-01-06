var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function (req, res) {
	res.send('Todo API root');
});

//GET url will be /todos
app.get('/todos', function (req, res) {
	var queryParams = req.query;
	var filteredToDos = todos;

	if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true'){
		filteredToDos = _.where(filteredToDos, {completed: true});
	} else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
		filteredToDos = _.where(filteredToDos, {completed: false});
	}

	if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
		filteredToDos = _.filter(filteredToDos, function (todo) {
			return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1;
		});
	}

	res.json(filteredToDos);
});

//GET url will be /todos/:id

app.get('/todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {id: todoId});
	
	if (matchedTodo) {
		res.json(matchedTodo);
	} else {
		res.status(404).send();
	}

});

//DELETE /todos/:id
app.delete('/todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {id: todoId});

	if (!matchedTodo){
		res.status(404).json({"error": "No todo found"});
	} else {
		todos = _.without(todos, matchedTodo);
		res.json(matchedTodo);
	}
	
});

//PUT /todos/:id
app.put('todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {id: todoId});
	var body = _.pick(req.body, 'description', 'completed');
	var validateAttributes = {};

	if (!matchedTodo) {
		return res.status(404).send();
	}

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validateAttributes.completed = body.completed;
	} else if (body.hasOwnProperty('completed')) {
		//Bad
		return res.status(400).send();
	} 

	if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
		validateAttributes.description = body.description;
	} else if (body.hasOwnProperty('description')){
		return res.status(400).send();
	}
 	
	_.extend(matchedTodo, validateAttributes);
	res.json(matchedTodo);
});

//POST http request
//POST /todos

app.post('/todos', function (req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function (todo){
		res.json(todo.toJSON());
	}, function (e) {
		res.status(400).json(e);
	});

/*
	if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
		return res.status(400).send();
	}

	body.description = body.description.trim();

	body.id = todoNextId++;

	todos.push(body);

	console.log('description: ' + body.description);
	res.json(body);
	*/
});

db.sequelize.sync().then(function (){
		app.listen(PORT, function () {
		console.log('Express listening on port ' + PORT + '!');
	});
});




