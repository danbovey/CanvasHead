/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ==================================================== CanvasHead =================================================== //
//                                          Created by Dan Bovey - danbovey.uk                                         //
//                                                                                                                     //
// ---------------------------------------------------- References --------------------------------------------------- //
// RequestAnimFrame polyfill from Paul Irish - http://www.paulirish.com/2011/requestanimationframe-for-smart-animating //
// Drawable functions inspired by Steven Lambert - http://blog.sklambert.com/html5-canvas-game-2d-collision-detection  //
// Scene and pick function adapted from lecture slides by Russel Hunt                                                  //
// Collision system inspired by IE Dev Center - http://msdn.microsoft.com/en-us/library/ie/gg589497(v=vs.85).aspx      //
// =================================================================================================================== //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Define canvas variables
var canvas = document.getElementById('game'),
	ctx = canvas.getContext('2d'),
	scene = {},
	keys = {},
	request;

// Define game variables
var game,
	nightmare,
	score,
	combo,
	comboCountdown,
	health,
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

Array.prototype.remove = function(value) {
	var idx = this.indexOf(value);
	if (idx != -1) {
		return this.splice(idx, 1); // The second parameter is the number of elements to remove.
	}
	return false;
}

window.onkeydown = function(e) {
	keys[e.which] = true;

	// Prevent the page from scrolling
	if(keys[32]) {
		e.preventDefault();
	}
}

window.onkeyup = function(e) {
	keys[e.which] = false;
}

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

function CompoundDrawable(params) {
	Drawable.apply(this, arguments);

	this.parts = pick(params.parts, []);

	this.draw = function() {
		this.ctx.save();
		this.ctx.translate(this.x, this.y);

		for(var i = 0; i < this.parts.length; i++) {
			this.parts[i].draw();
		}

		this.ctx.restore();
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

function Circle(params) {
	Drawable.apply(this, arguments);

	this.radius = pick(params.radius, 20);

	this.draw = function() {
		this.setupContext();

		this.ctx.beginPath();
		this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);

		this.ctx.fill();
		this.ctx.stroke();
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

function Player(params) {
	Rectangle.apply(this, arguments);

	this.width = 24;
	this.height = 36;
	this.fillStyle = '#FF4444';
	this.type = 'player';
	this.direction = 'e';
}

function Zombie(params) {
	Rectangle.apply(this, arguments);

	this.x = Math.floor(Math.random() * (800 - 0 + 1) + 0);
	this.width = 24;
	this.height = 36;
	this.lineWidth = 1;
	this.strokeStyle = '#000000';
	this.type = 'zombie';
}

function init() {
	canvas = document.getElementById('game');
	ctx = canvas.getContext('2d');
	keys = {};

	game = true;
	score = 0;
	combo = 1;
	health = 100;
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

	wall1 = new Rectangle({
		ctx: ctx,
		type: 'wall',
		x: 128,
		y: 128,
		width: 48,
		height: 48,
		fillStyle: '#888888',
		lineWidth: 2,
		strokeStyle: '#000000'
	});

	wall2 = new Rectangle({
		ctx: ctx,
		type: 'wall',
		x: 400,
		y: 256,
		width: 48,
		height: 48,
		fillStyle: '#888888',
		lineWidth: 2,
		strokeStyle: '#000000'
	});

	wall3 = new Rectangle({
		ctx: ctx,
		type: 'wall',
		x: 256,
		y: 424,
		width: 48,
		height: 48,
		fillStyle: '#888888',
		lineWidth: 2,
		strokeStyle: '#000000'
	});

	wall4 = new Rectangle({
		ctx: ctx,
		type: 'wall',
		x: 620,
		y: 88,
		width: 48,
		height: 48,
		fillStyle: '#888888',
		lineWidth: 2,
		strokeStyle: '#000000'
	});

	player = new Player({
		ctx: ctx,
		x: 364,
		y: 232
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
		}
	};

	scene.objects = [player, healthBG, healthFG, wall1, wall2, wall3, wall4, scoreText, comboText];
	if(!request) {
		gameLoop();
	}
};

function getCursor(canvas, e) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top
	};
}

document.getElementById('menu').setAttribute('onclick', 'return false');
document.getElementById('menu').onmouseup = function(e) {
	game = false;
	request = cancelAnimFrame(gameLoop);

	window.clearInterval(waveCountdown);
	window.clearInterval(comboCountdown);

	menu();
}

function menu() {
	document.getElementsByTagName('body')[0].removeAttribute('style');
	canvas.removeAttribute('style');
	document.getElementsByTagName('h1')[0].removeAttribute('style');
	document.getElementsByTagName('h3')[0].removeAttribute('style');
	document.getElementsByTagName('p')[0].removeAttribute('style');
	document.getElementsByTagName('p')[1].removeAttribute('style');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.font = '40px Bowlby One SC';
	ctx.fillStyle = '#B22F2F'
	ctx.strokeStyle = '#FFFFFF';
	ctx.lineWidth = 6;
	ctx.strokeText('SINGLEPLAYER', 200, 160);
	ctx.fillText('SINGLEPLAYER', 200, 160);
	ctx.strokeText('MULTIPLAYER', 200, 320);
	ctx.fillText('MULTIPLAYER', 200, 320);
	ctx.fillStyle = '#000000';
	ctx.strokeText('NIGHTMARE MODE', 200, 240);
	ctx.fillText('NIGHTMARE MODE', 200, 240);
	ctx.font = '14px Arial';
	ctx.fillStyle = '#666666';
	ctx.fillText('Regenerate health as you kill an expontential wave of zombies', 200, 182);
	ctx.fillText('No health regeneration and faster waves of zombies with more HP', 200, 262);
	ctx.fillText('Multiplayer is coming soon!', 200, 342);

	canvas.onmouseup = function(e) {
		if(game !== true) {
			var cursor = getCursor(canvas, e);

			if(cursor.x > 200 && cursor.x < 540 && cursor.y > 128 && cursor.y < 166) {
				nightmare = false;
				init();
			} else if(cursor.x > 200 && cursor.x < 620 && cursor.y > 210 && cursor.y < 245) {
				document.getElementsByTagName('body')[0].style.backgroundColor = '#000000';
				canvas.style.backgroundColor = '#222222';
				document.getElementsByTagName('h1')[0].style.color = '#333333';
				document.getElementsByTagName('h3')[0].style.color = '#333333';
				document.getElementsByTagName('p')[0].style.color = '#333333';
				document.getElementsByTagName('p')[1].style.color = '#333333';

				nightmare = true;
				init();
			} else if(cursor.x > 200 && cursor.x < 520 && cursor.y > 288 && cursor.y < 322) {
				// Multiplayer coming soon!
			}
		}
	}
}
function load() {
	ctx.fillStyle = '#FFFFFF';
	ctx.strokeStyle = '#FFFFFF';
	ctx.fillRect(297, 237, 206, 16);
	ctx.strokeRect(300, 240, 200, 10);
	var i = 0;
	var load = window.setInterval(function() {
		if(i === 200) {
			window.clearTimeout(load);
			menu();
		} else {
			i = i + 10;
			ctx.fillStyle = '#B22F2F';
			ctx.fillRect(300, 240, i, 10);
		}
	}, 50);
}
load();

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

function addObject(object) {
	scene.objects.push(object);
}

function removeObject(object) {
	var i = scene.objects.indexOf(object);
	scene.objects.splice(i, 1);
}

function gameLoop() {
	if(game === true) {
		// Set every objects coords to their last coords
		for(var i = 0; i < scene.objects.length; i++) {
			scene.objects[i].lastX = scene.objects[i].x;
			scene.objects[i].lastY = scene.objects[i].y;
		}

		input();
		update();
		render();
	}

	// Restart
	if(keys[82]) {
		game = false;
		window.clearInterval(waveCountdown);
		window.clearInterval(comboCountdown);

		init();
	}
}

function input() {
	// W
	if(keys[87]) {
		player.direction = 'n';
		player.y -= 4;
	}

	// S
	if(keys[83]) {
		player.direction = 's';
		player.y += 4;
	}

	// A
	if(keys[65]) {
		player.direction = 'w';
		player.x -= 4;
	}

	// D
	if(keys[68]) {
		player.direction = 'e';
		player.x += 4;
	}

	// Direction for diagonal movement
	if(keys[65] && keys[87]) {
		player.direction = 'nw';
	} else if(keys[68] && keys[87]) {
		player.direction = 'ne';
	} else if(keys[65] && keys[83]) {
		player.direction = 'sw';
	} else if(keys[68] && keys[83]) {
		player.direction = 'se';
	}

	// Shoot
	if(keys[32]) {
		shoot();
	}
}

function update() {
	waves();
	ai();
	collision();
	ui();
}

function render() {
	scene.draw(canvas, ctx);
	request = requestAnimFrame(gameLoop);
}

function shoot() {
	if(shooting === false) {
		shooting = true;

		var bullet = new Rectangle({
			type: 'bullet',
			ctx: ctx,
			x: 0,
			y: 0,
			x2: 0,
			y2: 0,
			width: 10,
			height: 10,
			fillStyle: '#AAAAAA'
		});

		switch(player.direction) {
			case 'n':
				bullet.x = player.x + (player.width / 2);
				bullet.x2 = player.x + (player.width / 2);
				bullet.y = player.y - 8;
				bullet.y2 = -8;
				bullet.width = 2;
				bullet.height = 8;
			break;
			case 'e':
				bullet.x = player.x + player.width;
				bullet.x2 = canvas.width + 8;
				bullet.y = player.y + (player.height / 2);
				bullet.y2 = player.y + (player.height / 2);
				bullet.width = 8;
				bullet.height = 2;
			break;
			case 's':
				bullet.x = player.x + (player.width / 2);
				bullet.x2 = player.x + (player.width / 2);
				bullet.y = player.y + player.height;
				bullet.y2 = canvas.height + 8;
				bullet.width = 2;
				bullet.height = 8;
			break;
			default:
				bullet.x = player.x - 8;
				bullet.x2 = -8;
				bullet.y = player.y + (player.height / 2);
				bullet.y2 = player.y + (player.height / 2);
				bullet.width = 8;
				bullet.height = 2;
			break;
		}
		
		addObject(bullet);

		window.setTimeout(function() {
			shooting = false;
		}, 400);
	}
}

function collision() {
	var indexesToRemove = [];
	for(var i = 0; i < scene.objects.length; i++) {
		// Check that the player is not outside of the canvas
		if(scene.objects[i].type === 'player') {
			if(scene.objects[i].x < 0 || scene.objects[i].x + scene.objects[i].width > canvas.width) {
				scene.objects[i].x = scene.objects[i].lastX;
			}
			if(scene.objects[i].y < 0 || scene.objects[i].y + scene.objects[i].height > canvas.height) {
				scene.objects[i].y = scene.objects[i].lastY;
			}
		}

		// Check that bullets are not outside of the canvas
		if(scene.objects[i].type === 'bullet') {
			if(scene.objects[i].x < 0 || scene.objects[i].x + scene.objects[i].width > canvas.width || scene.objects[i].y < 0 || scene.objects[i].y + scene.objects[i].height > canvas.height) {
				indexesToRemove.push(scene.objects[i]);
			}
		}

		// Collision checks
		for(var x = 0; x < scene.objects.length; x++) {
			if(scene.objects[i].type !== 'ui' && scene.objects[x].type !== 'ui') {
				// Diagonal movement around walls
				if(Math.ceil(scene.objects[i].x) + scene.objects[i].width === Math.ceil(scene.objects[x].x) && (Math.ceil(scene.objects[i].y) >= Math.ceil(scene.objects[x].y) && Math.ceil(scene.objects[i].y) <= Math.ceil(scene.objects[x].y) + scene.objects[x].height || Math.ceil(scene.objects[i].y) + scene.objects[i].height >= Math.ceil(scene.objects[x].y) && Math.ceil(scene.objects[i].y) + scene.objects[i].height <= Math.ceil(scene.objects[x].y) + scene.objects[x].height)) { // East
					if(Math.ceil(scene.objects[i].x) > scene.objects[i].lastX) {
						scene.objects[i].x = scene.objects[i].lastX;
						if(scene.objects[i].type === 'zombie' && scene.objects[x].type === 'player') {
							health = health - 0.5;
						}
					}
				}
				if(Math.ceil(scene.objects[i].x) === Math.ceil(scene.objects[x].x) + scene.objects[x].width && (Math.ceil(scene.objects[i].y) >= Math.ceil(scene.objects[x].y) && Math.ceil(scene.objects[i].y) <= Math.ceil(scene.objects[x].y) + scene.objects[x].height || Math.ceil(scene.objects[i].y) + scene.objects[i].height >= Math.ceil(scene.objects[x].y) && Math.ceil(scene.objects[i].y) + scene.objects[i].height <= Math.ceil(scene.objects[x].y) + scene.objects[x].height)) { // West
					if(Math.ceil(scene.objects[i].x) < scene.objects[i].lastX) {
						scene.objects[i].x = scene.objects[i].lastX;
						if(scene.objects[i].type === 'zombie' && scene.objects[x].type === 'player') {
							health = health - 0.5;
						}
					}
				}

				if(Math.ceil(scene.objects[i].y) + scene.objects[i].height === Math.ceil(scene.objects[x].y) && (Math.ceil(scene.objects[i].x) >= Math.ceil(scene.objects[x].x) && Math.ceil(scene.objects[i].x) <= Math.ceil(scene.objects[x].x) + scene.objects[x].width || Math.ceil(scene.objects[i].x) + scene.objects[i].width >= Math.ceil(scene.objects[x].x) && Math.ceil(scene.objects[i].x) + scene.objects[i].width <= Math.ceil(scene.objects[x].x) + scene.objects[x].width)) { // South
					if(Math.ceil(scene.objects[i].y) > scene.objects[i].lastY) {
						scene.objects[i].y = scene.objects[i].lastY;
						if(scene.objects[i].type === 'zombie' && scene.objects[x].type === 'player') {
							health = health - 0.5;
						}
					}
				}
				if(Math.ceil(scene.objects[i].y) === Math.ceil(scene.objects[x].y) + scene.objects[x].height && (Math.ceil(scene.objects[i].x) >= Math.ceil(scene.objects[x].x) && Math.ceil(scene.objects[i].x) <= Math.ceil(scene.objects[x].x) + scene.objects[x].width || Math.ceil(scene.objects[i].x) + scene.objects[i].width >= Math.ceil(scene.objects[x].x) && Math.ceil(scene.objects[i].x) + scene.objects[i].width <= Math.ceil(scene.objects[x].x) + scene.objects[x].width)) { // North
					if(Math.ceil(scene.objects[i].y) < scene.objects[i].lastY) {
						scene.objects[i].y = scene.objects[i].lastY;
						if(scene.objects[i].type === 'zombie' && scene.objects[x].type === 'player') {
							health = health - 0.5;
						}
					}
				}
			}

			if(scene.objects[i].x < scene.objects[x].x + scene.objects[x].width  && scene.objects[i].x + scene.objects[i].width  > scene.objects[x].x && scene.objects[i].y < scene.objects[x].y + scene.objects[x].height && scene.objects[i].y + scene.objects[i].height > scene.objects[x].y) {
				if(scene.objects[i].type === 'player' && scene.objects[x].type === 'zombie') {
					player.x = player.lastX;
					player.y = player.lastY;
				}

				if(scene.objects[i].type === 'bullet' && scene.objects[x].type === 'wall') {
					indexesToRemove.push(scene.objects[i]);
				}
				if(scene.objects[i].type === 'bullet' && scene.objects[x].type === 'zombie') {
					indexesToRemove.push(scene.objects[i]);
					scene.objects[x].health = scene.objects[x].health - damage;
					if(scene.objects[x].health <= 0) {
						indexesToRemove.push(scene.objects[x]);
						zombies.splice(0, 1);

						if(nightmare === false) {
							health = health + 5;
							if(health > 100) {
								health = 100;
							}
						}
						score = score + (200 * combo);
						combo = combo + 1;
					}
				}
			}
		}
	}

	for(var i = 0; i < indexesToRemove.length; i++) {
		removeObject(indexesToRemove[i]);
	}
	indexesToRemove = [];
}

function waves() {
	if(wavesEntered[wave] == undefined) {
		for(var i = 0, algorithm = wave * 2; i <= algorithm; i++) {
			if(i < algorithm / 2) {
				var zombie = new Zombie({
					health: 2,
					ctx: ctx,
					y: -36,
					fillStyle: '#FFFFFF'
				});
			} else {
				var zombie = new Zombie({
					health: 2,
					ctx: ctx,
					y: canvas.height,
					fillStyle: '#FFFFFF'
				});
			}
			if(nightmare === true) {
				zombie.fillStyle = '#000000';
				zombie.health = 3;
			}

			zombies.push(zombie);
			addObject(zombie);
		}
		wavesEntered.push(wave);
	}
}

function ai() {
	for(var i = 0; i < scene.objects.length; i++) {
		var object = scene.objects[i];

		if(object.type === 'zombie') {
			// Zombies
			if(object.kill === false) {
				if(player.x !== object.x) {
					if(player.x > object.x) {
						object.x = object.x + 0.1;
					} else {
						object.x = object.x - 0.1;
					}
				}

				if(player.y !== object.y) {
					if(player.y > object.y) {
						object.y = object.y + 0.1;
					} else {
						object.y = object.y - 0.1;
					}
				}
			}
		}
		 else if(object.type === 'bullet') {
			// Bullets
			if(object.x !== object.x2) {
				if(object.x < object.x2) {
					object.x = object.x + 8;
				} else {
					object.x = object.x - 8;
				}
			}

			if(object.y !== object.y2) {
				if(object.y < object.y2) {
					object.y = object.y + 8;
				} else {
					object.y = object.y - 8;
				}
			}
		}
	}
}

function ui() {
	if(health >= 0) {
		healthFG.width = (health / 100) * 24;
	} else {
		scene.objects.push(gameOver);
	}
	healthFG.x = player.x;
	healthBG.x = player.x;
	healthFG.y = player.y - 10;
	healthBG.y = player.y - 10;

	scoreText.text = pad(score, 8);
	comboText.text = combo + 'x';
}