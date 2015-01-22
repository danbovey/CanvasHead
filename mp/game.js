// Define canvas variables
var canvas = document.getElementById('game'),
	ctx = canvas.getContext('2d'),
	scene = {},
	keys = {},
	request;

// Define game variables
var game,
	disconnected = false,
	players = {},
	bullets = {},
	mySocketId,
	nightmare,
	score,
	combo,
	comboCountdown,
	kills,
	wave,
	wavesEntered,
	waveCountdown,
	waveTime,
	zombies,
	shooting,
	damage;

// Define game objects
var healthBG, healthFG, scoreText, comboText, gameOver, wall1, wall2, wall3, wall4, zombie1, zombie2, player;

window.requestAnimFrame = (function() {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
		window.setTimeout(callback, 1000 / 60);
	};
})();
window.cancelAnimFrame = (function() {
	return window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame;
})();

function Drawable(params) {
	this.x = pick(params.x, 0);
	this.y = pick(params.y, 0);
	this.fillStyle = pick(params.fillStyle, null);
	this.strokeStyle = pick(params.strokeStyle, 'transparent');
	this.lineWidth = pick(params.lineWidth, 0);
	this.ctx = pick(params.ctx, null);

	this.draw = function() {
		console.log('Unable to draw');
	};

	this.setupContext = function() {
		this.ctx.fillStyle = this.fillStyle;
		this.ctx.strokeStyle = this.strokeStyle;
		this.ctx.lineWidth = this.lineWidth;
	};
}

function Rectangle(params) {
	Drawable.apply(this, arguments);

	this.id = pick(params.id, null);
	this.type = pick(params.type, null);
	this.direction = pick(params.direction, null);
	this.lastX = null;
	this.lastY = null;
	this.x2 = pick(params.x2, null);
	this.y2 = pick(params.y2, null);

	this.health = pick(params.health, 100);
	this.kill = false;

	this.width = pick(params.width, 100);
	this.height = pick(params.height, 100);

	this.draw = function() {
		if(this.kill === false) {
			this.setupContext();
			this.ctx.fillRect(this.x, this.y, this.width, this.height);
			this.ctx.strokeRect(this.x, this.y, this.width, this.height);
		}
	};
}

function Text(params) {
	Drawable.apply(this, arguments);

	this.strokeStyle = pick(params.strokeStyle, null);
	this.lineWidth = pick(params.lineWidth, null);
	this.text = pick(params.text, '');

	this.draw = function() {
		this.setupContext();
		this.ctx.font = params.font;
		ctx.strokeStyle = this.strokeStyle;
    	ctx.lineWidth = this.lineWidth;
    	this.ctx.strokeText(this.text, this.x, this.y);
		this.ctx.fillText(this.text, this.x, this.y);
	}
}

function init() {
	canvas = document.getElementById('game');
	ctx = canvas.getContext('2d');
	keys = {};

	game = true;
	score = 0;
	combo = 1;
	kills = 0;
	wave = 1;
	zombies = [];
	wavesEntered = [];
	waveTime = 12000;
	shooting = false;
	damage = 1;

	waveCountdown = window.setInterval(function() {
		if(zombies.length < 30) {
			wave++;
			if(nightmare === false) {
				waveTime = waveTime * 4;
			} else {
				waveTime = waveTime * 2;
			}
		}
	}, waveTime);

	comboCountdown = window.setInterval(function() {
		if(combo > 1) {
			combo = combo - 1;
		}
	}, 2000);

	healthBG = new Rectangle({
		type: 'ui',
		ctx: ctx,
		x: 10,
		y: 10,
		width: 24,
		height: 5,
		fillStyle: '#B22F2F',
		lineWidth: 1,
		strokeStyle: '#999999'
	});
	healthFG = new Rectangle({
		type: 'ui',
		ctx: ctx,
		x: 10,
		y: 10,
		width: 24,
		height: 5,
		fillStyle: '#44FF44'
	});

	scoreText = new Text({
		type: 'ui',
		ctx: ctx,
		x: 338,
		y: 30,
		font: '28px Arial',
		fillStyle: '#FFFFFF',
		strokeStyle: '#000000',
		lineWidth: 4,
		text: pad(score, 8)
	});
	comboText = new Text({
		type: 'ui',
		ctx: ctx,
		x: 465,
		y: 45,
		font: '20px Arial',
		fillStyle: '#FFFFFF',
		strokeStyle: '#000000',
		lineWidth: 3 + 'x',
		text: combo
	});

	gameOver = new Text({
		type: 'ui',
		ctx: ctx,
		x: 243,
		y: 267,
		font: '48px Bowlby One SC',
		fillStyle: '#B22F2F',
		strokeStyle: '#FFFFFF',
		lineWidth: 6,
		text: 'GAME OVER'
	});

	scene = {
		objects:[],
		clear: function(canvas, ctx) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		},
		draw: function(canvas, ctx) {
			scene.clear(canvas, ctx);

			for(var i = 0; i < scene.objects.length; i++) {
				scene.objects[i].draw();
			}
		},
		remove: function(object) {
			var index = scene.objects.indexOf(object);
			if(index != -1) {
				scene.objects.splice(index, 1);
			}
		}
	};

	scene.objects = [healthBG, healthFG, scoreText, comboText];
	if(!request) {
		gameLoop();
	}
};



function gameLoop() {
	if(game === true) {
		// Set every objects coords to their last coords
		for(var i = 0; i < scene.objects.length; i++) {
			scene.objects[i].lastX = scene.objects[i].x;
			scene.objects[i].lastY = scene.objects[i].y;
		}
		
		render();
	}
}

function render() {
	scene.draw(canvas, ctx);
	request = requestAnimFrame(gameLoop);
}

var ws = new WebSocket('ws://localhost:1337');
ws.onopen = function(){
	var username, avatar;
	if(window.localStorage.getItem('username') && window.localStorage.getItem('avatar')) {
		document.getElementById('username').value = window.localStorage.getItem('username');
		document.getElementById('avatar').value = window.localStorage.getItem('avatar');
	}
	
	var btn = document.getElementById('info-btn');
	btn.onmouseup = function getInfo() {
		username = document.getElementById('username').value;
		avatar = document.getElementById('avatar').value;
		document.getElementById('form').style.display = 'none';

		window.localStorage.setItem('username', username);
		window.localStorage.setItem('avatar', avatar);

		ws.send(
			JSON.stringify({
				'type': 'info',
				'username': username,
				'avatar': avatar
			})
		);
		init();
	}
};
ws.onmessage = function(e) {
	var data;
	try {
		data = JSON.parse(e.data);
	} catch(e) {
		console.log('Unable to parse JSON');
	}

	if(data.type === 'socketId') {
		mySocketId = data.id;
	} else if(data.type === 'objects') {
			for(var i = 0; i < data.objects.length; i++) {
				var object = new Rectangle(data.objects[i]);
				object.ctx = ctx;
				scene.objects.push(object);
			}
	} else if(data.type === 'score') {
		score = data.newScore;
	} else if(data.type === 'update') {
		if(game == true) {
			for(var playerId in players) {
				if(players.hasOwnProperty(playerId)) {
					scene.remove(players[playerId]);
				}
			}
			players = {};

			for(var playerId in data.players) {
				if(data.players.hasOwnProperty(playerId)) {
					var serverPlayer = data.players[playerId];

					if(serverPlayer.type === 'Rectangle') {
						serverPlayer.properties.ctx = ctx;

						var player = new Rectangle(serverPlayer.properties);
						scene.objects.push(player);
						players[playerId] = player;

						if(playerId == mySocketId) {
							if(player.health >= 0) {
								healthFG.width = (player.health / 100) * 24;
							}

							healthFG.x = player.x;
							healthBG.x = player.x;
							healthFG.y = player.y - 10;
							healthBG.y = player.y - 10;
						}
					}
				}
			}
			if(data.bullets.length != 0) {
				for(var bulletId in bullets) {
					scene.remove(bullets[bulletId]);
				}
				bullets = {};

				for(var bulletId in data.bullets) {
					var serverBullet = data.bullets[bulletId];
					serverBullet.properties.ctx = ctx;

					var bullet = new Rectangle(serverBullet.properties);
					scene.objects.push(bullet);
					bullets[bulletId] = bullet;
				}
			}
			if(data.zombies.length != 0) {
				for(var zombieId in zombies) {
					scene.remove(zombies[zombieId]);
				}
				zombies = {};

				for(var zombieId in data.zombies) {
					var serverZombie = data.zombies[zombieId];
					serverZombie.properties.ctx = ctx;

					var zombie = new Rectangle(serverZombie.properties);
					scene.objects.push(zombie);
					zombies[zombieId] = zombie;
				}
			}
		}
	} else if(data.type = 'playerlist') {
		document.getElementById('playerlist').innerHTML = '';
		for(var i = 0; i < data.list.length; i++) {
			if(data.list[i] != undefined) {
				document.getElementById('playerlist').innerHTML += '<tr><td><img src="' + data.list[i].avatar + '" alt=""></td><td>' + data.list[i].username + '</td></tr>'; 
			}
		}
	}
};
ws.onclose = function(){
	disconnected = true;
	document.getElementById('form').style.display = 'block';
	document.getElementById('playerlist').innerHTML = '<tr><td></td><td style="color:red">Disconnected from server</td></tr>';
};

var canvas = document.getElementById('game');

window.onkeydown = function(e) {
	if(disconnected === false && game === true) {
		keys[e.which] = true;

		ws.send(
			JSON.stringify({
				'type': 'keydown',
				'keycode': e.which
			})
		);

		// Prevent the page from scrolling
		if(e.which == 32) {
			e.preventDefault();
		}
	}
}

window.onkeyup = function(e) {
	if(disconnected === false && game === true) {
		keys[e.which] = false;

		ws.send(
			JSON.stringify({
				'type': 'keyup',
				'keycode': e.which
			})
		);
	}
}

function pick(a, b) {
	if(typeof a !== 'undefined') {
		return a;
	} else {
		return b;
	}
}

function pad(str, max) {
	str = str.toString();
	return str.length < max ? pad('0' + str, max) : str;
}