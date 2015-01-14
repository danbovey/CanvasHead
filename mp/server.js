var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer({port: 1337}),
	GameObjects = require('./GameObjects.js')
	Flickr = require('flickrapi'),
	flickrOptions = {
      api_key: "c32e94f9513f5f15b14927b5b5a3e405",
      secret: "b3b0369a1e85866e"
    };

console.log('Server started');

var game = false,
	score = 0,
	objects = [],
	players = [],
	bullets = [],
	nextSocketId = 0;

var wall1 = {
	x: 128,
	y: 128,
	width: 48,
	height: 48,
	fillStyle: '#888888',
	lineWidth: 2,
	strokeStyle: '#000000'
};

var wall2 = {
	x: 400,
	y: 256,
	width: 48,
	height: 48,
	fillStyle: '#888888',
	lineWidth: 2,
	strokeStyle: '#000000'
};

var wall3 = {
	x: 256,
	y: 424,
	width: 48,
	height: 48,
	fillStyle: '#888888',
	lineWidth: 2,
	strokeStyle: '#000000'
};

var wall4 = {
	x: 620,
	y: 88,
	width: 48,
	height: 48,
	fillStyle: '#888888',
	lineWidth: 2,
	strokeStyle: '#000000'
};
objects = [wall1, wall2, wall3, wall4];

setInterval(gameLoop, 16);
setInterval(sendPlayerUpdates, 16);

function gameLoop() {
	// Input
	for(var socketId in players) {
		if(players.hasOwnProperty(socketId)) {
			var player = players[socketId];

			player.lastX = Math.ceil(player.x);
			player.lastY = Math.ceil(player.y);

			// W
			if(player.keys[87]) {
				player.direction = 'n';
				player.y -= 4;
			}

			// S
			if(player.keys[83]) {
				player.direction = 's';
				player.y += 4;
			}

			// A
			if(player.keys[65]) {
				player.direction = 'w';
				player.x -= 4;
			}

			// D
			if(player.keys[68]) {
				player.direction = 'e';
				player.x += 4;
			}

			player.x = Math.ceil(player.x);
			player.y = Math.ceil(player.y);

			// Direction for diagonal movement
			if(player.keys[65] && player.keys[87]) {
				player.direction = 'nw';
			} else if(player.keys[68] && player.keys[87]) {
				player.direction = 'ne';
			} else if(player.keys[65] && player.keys[83]) {
				player.direction = 'sw';
			} else if(player.keys[68] && player.keys[83]) {
				player.direction = 'se';
			}

			// Shoot
			if(player.keys[32]) {
				player.shoot();
			}

			// Bullets
			for(var bullet in bullets) {
				if(bullet.x !== bullet.x2) {
					if(bullet.x < bullet.x2) {
						bullet.x = bullet.x + 8;
					} else {
						bullet.x = bullet.x - 8;
					}
				}

				if(bullet.y !== bullet.y2) {
					if(bullet.y < bullet.y2) {
						bullet.y = bullet.y + 8;
					} else {
						bullet.y = bullet.y - 8;
					}
				}
			}

			// Check that the player is not outside of the canvas
			if(player.x < 0 || player.x + player.width > 800) {
				player.x = player.lastX;
			}
			if(player.y < 0 || player.y + player.height > 500) {
				player.y = player.lastY;
			}

			for(var i = 0; i < objects.length; i++) {
				var objectx = objects[i].x + 77;
				var objecty = objects[i].y + 63;
				var objectw = objects[i].width - 77;
				var objecth = objects[i].height - 63;

				if(Math.ceil(player.x) + player.width === objectx) {
					if(Math.ceil(player.y) >= objecty && Math.ceil(player.y) <= objecty + objecth || Math.ceil(player.y) + player.height >= objecty && Math.ceil(player.y) + player.height <= objecty + objecth) { // West
						if(Math.ceil(player.x) > player.lastX) {
							player.x = player.lastX;
						}
					}
				}
				if(Math.ceil(player.x) === objectx + objectw && (Math.ceil(player.y) >= objecty && Math.ceil(player.y) <= objecty + objecth || Math.ceil(player.y) + player.height >= objecty && Math.ceil(player.y) + player.height <= objecty + objecth)) { // East
					if(Math.ceil(player.x) < player.lastX) {
						player.x = player.lastX;
					}
				}
				if(Math.ceil(player.y) + player.height === objecty && (Math.ceil(player.x) >= objectx && Math.ceil(player.x) <= objectx + objectw || Math.ceil(player.x) + player.width >= objectx && Math.ceil(player.x) + player.width <= objectx + objectw)) { // South
					if(Math.ceil(player.y) > player.lastY) {
						player.y = player.lastY;
					}
				}
				if(Math.ceil(player.y) === objecty + objecth && (Math.ceil(player.x) >= objectx && Math.ceil(player.x) <= objectx + objectw || Math.ceil(player.x) + player.width >= objectx && Math.ceil(player.x) + player.width <= objectx + objectw)) { // North
					if(Math.ceil(player.y) < player.lastY) {
						player.y = player.lastY;
					}
				}
				if(Math.ceil(player.x) < objectx + objectw  && Math.ceil(player.x) + player.width > objectx && Math.ceil(player.y) < objecty + objecth && Math.ceil(player.y) + player.height > objecty) {
					player.x = player.lastX;
					player.y = player.lastY;
				}
			}
		}
	}

	for(var i = bullets.length; i > bullets.length; i--) {
		var deleted = false;

		// Check that bullets are not outside of the canvas
		if(bullets[i].x < 0 || bullets[i].x + bullets[i].width > 800 || bullets[i].y < 0 || bullets[i].y + bullets[i].height > 500) {
			bullets.splice(i, 1);
			deleted = true;
		}

		if(deleted === false) {
			// Check that bullets are not inside objects
			for(var x = 0; x < objects.length; x++) {
				var objectx = objects[i].x + 77;
				var objecty = objects[i].y + 63;
				var objectw = objects[i].width - 77;
				var objecth = objects[i].height - 63;

				if(bullet.x < objectx + objectw  && bullet.x + bullet.width > objectx && bullet.y < objecty + objecth && bullet.y + bullet.height > objecty) {
					bullets.splice(i, 1);
					deleted = true;
				}
			}
		}

		if(deleted === false) {
			// Check that bullets are not inside zombies

		}
	}
}

function sendPlayerUpdates() {
	if(game == true) {
		var response = {
			'type': 'players',
			'players': {},
			'bullets': {}
		};

		for(var socketId in players) {
			if(players.hasOwnProperty(socketId)) {
				var player = players[socketId];
				var type = player.constructor.name;

				var properties = {};
				for(var property in player) {
					if(player.hasOwnProperty(property)) {
						properties[property] = player[property];
					}
				}

				response.players[socketId] = {
					'type': type,
					'properties': properties
				};
			}
		}

		var b = 0;
		for(var bullet in bullets) {
			var properties = {};
			for(var property in bullet) {
				properties[property] = bullet[property];
			}

			response.bullets[b] = {
				'type': 'bullet',
				'properties': properties
			}

			b++;
		}

		wss.broadcast(
			JSON.stringify(response)
		);
	}
}

wss.on('connection', function(ws) {
	var thisSocketId = nextSocketId;
	nextSocketId++;

	ws.send(
		JSON.stringify({
			'type': 'socketId',
			'id': thisSocketId
		})
	);

	ws.on('message', function(data) {
		var message = null;
		try {
			message = JSON.parse(data);
		} catch(e) {
			console.log('Error parsing JSON: ' + e);
		}

		if(message !== null) {
			if(message.type === 'keydown') {
				if(game == true) {
					players[thisSocketId].keys[message.keycode] = true;
				}
			} else if(message.type === 'keyup') {
				if(game == true) {
					players[thisSocketId].keys[message.keycode] = false;
				}
			} else if(message.type === 'info') {
				if(message.username.length > 0 && message.avatar.length > 0) {
					game = true;

					var player = new GameObjects.Rectangle({
						x: Math.random() * 750,
						y: Math.random() * 450,
						width: 24,
						height: 36,
						fillStyle: '#FF4444'
					});
					players.push(player);

					players[thisSocketId].keys = {};
					players[thisSocketId].health = 100;
					players[thisSocketId].username = message.username;
					players[thisSocketId].avatar = 'http://www.eurowebcart.com/images/default_user.png';
					players[thisSocketId].shooting = false;
					players[thisSocketId].shoot = function() {
						if(players[thisSocketId].shooting === false) {
							players[thisSocketId].shooting = true;

							var bullet = new GameObjects.Rectangle({
								x: 0,
								y: 0,
								x2: 0,
								y2: 0,
								width: 10,
								height: 10,
								fillStyle: '#AAAAAA'
							});

							switch(players[thisSocketId].direction) {
								case 'n':
									bullet.x = players[thisSocketId].x + (players[thisSocketId].width / 2);
									bullet.x2 = players[thisSocketId].x + (players[thisSocketId].width / 2);
									bullet.y = players[thisSocketId].y - 8;
									bullet.y2 = -8;
									bullet.width = 2;
									bullet.height = 8;
								break;
								case 'e':
									bullet.x = players[thisSocketId].x + players[thisSocketId].width;
									bullet.x2 = 808;
									bullet.y = players[thisSocketId].y + (players[thisSocketId].height / 2);
									bullet.y2 = players[thisSocketId].y + (players[thisSocketId].height / 2);
									bullet.width = 8;
									bullet.height = 2;
								break;
								case 's':
									bullet.x = players[thisSocketId].x + (players[thisSocketId].width / 2);
									bullet.x2 = players[thisSocketId].x + (players[thisSocketId].width / 2);
									bullet.y = players[thisSocketId].y + players[thisSocketId].height;
									bullet.y2 = 508;
									bullet.width = 2;
									bullet.height = 8;
								break;
								default:
									bullet.x = players[thisSocketId].x - 8;
									bullet.x2 = -8;
									bullet.y = players[thisSocketId].y + (players[thisSocketId].height / 2);
									bullet.y2 = players[thisSocketId].y + (players[thisSocketId].height / 2);
									bullet.width = 8;
									bullet.height = 2;
								break;
							}
							
							bullets.push(bullet);

							setTimeout(function() {
								players[thisSocketId].shooting = false;
							}, 400);
						}
					}

					Flickr.tokenOnly(flickrOptions, function(error, flickr) {
						flickr.photos.search({
							text: message.avatar
						}, function(err, result) {
							if(err) {
								throw new Error(err);
							}

							players[thisSocketId].avatar = 'https://farm' + result.photos.photo[0].farm + '.staticflickr.com/' + result.photos.photo[0].server + '/' + result.photos.photo[0].id + '_' + result.photos.photo[0].secret + '_s.jpg'
							sendPlayerList();
						})
					});
					ws.send(
						JSON.stringify({
							'type': 'objects',
							'objects': objects
						})
					);
				}
			}
		}
	});

	ws.on('close', function() {
		delete players[thisSocketId];
		if(players.length === 0) {
			game = false;
		}
		sendPlayerList();
	});
});

function sendPlayerList() {
	wss.broadcast(
		JSON.stringify({
			'type': 'playerlist',
			'list': players
		})
	);
}

wss.broadcast = function(data) {
	for(var i in this.clients) {
		if(this.clients[i].readyState === 1){
			this.clients[i].send(data);
		}
	}
};

function changeScore(amount) {
	score += amount;

	wss.broadcast(
		JSON.stringify({
			'type': 'score',
			'newScore': score
		})
	);
}