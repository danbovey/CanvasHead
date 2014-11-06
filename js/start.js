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
	score,
	combo,
	health,
	kills,
	wave,
	wavesEntered = [],
	aiLoop = 0,
	zombies = [],
	zombieID = 0,
	bullets = [],
	bulletID = 0,
	shooting,
	upgrade,
	damage,
	ammo;

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

var healthBG, healthFG, scoreText, gameOver, wall1, wall2, wall3, wall4, zombie1, zombie2, player;

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
	shooting = false;
	ammo = 100;
	upgrade = 0;
	damage = 1;

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

	player = new Rectangle({
		id: 0,
		ctx: ctx,
		type: 'player',
		direction: 'e',
		x: 364,
		y: 232,
		width: 24,
		height: 36,
		fillStyle: '#FF4444'
	});

	scene = {
		objects:[],
		clear: function(canvas, ctx) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		},
		draw: function(canvas, ctx) {
			scene.clear(canvas, ctx);

			// should be scene.objects.push(zombies, bullets) or for each zombies, bullets
			for(var i = 0; i < scene.objects.length; i++) {
				scene.objects[i].draw();
			}
		}
	};

	scene.objects = [player, healthBG, healthFG, wall1, wall2, wall3, wall4, scoreText];
	if(!request) {
		gameLoop();
	}
};
init();

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