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
	this.eating = false;

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