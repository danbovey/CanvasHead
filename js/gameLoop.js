function gameLoop() {
	if(game === true) {
		// Set every objects coords to their last coords
		for(var i = 0; i < scene.objects.length; i++) {
			scene.objects[i].lastX = scene.objects[i].x;
			scene.objects[i].lastY = scene.objects[i].y;
		}

		aiLoop++;
		if(aiLoop === 5) {
			aiLoop = 0;
		}

		input();
		update();
		render();
	}
}

function update() {
	waves();
	ai();
	collision();
	ui();

	if(health <= 0) {
		scene.objects.push(gameOver);
		game = false;
	}

	// Restart
	if(keys[82]) {
		window.cancelAnimFrame(request);
		request = false;

		init();
	}
}

function render() {
	scene.draw(canvas, ctx);
	request = requestAnimFrame(gameLoop);
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

function shoot() {
	if(shooting === false) {
		shooting = true;
		switch(player.direction) {
			case 'n':
				var bullet = new Rectangle({
					id: bulletID,
					type: 'bullet',
					ctx: ctx,
					x: player.x + (player.width / 2),
					y: player.y - 8,
					x2: player.x + (player.width / 2),
					y2: -8,
					width: 2,
					height: 8,
					fillStyle: '#AAAAAA'
				});
			break;
			case 'e':
				var bullet = new Rectangle({
					id: bulletID,
					type: 'bullet',
					ctx: ctx,
					x: player.x + player.width,
					y: player.y + (player.height / 2),
					x2: canvas.width + 8,
					y2: player.y + (player.height / 2),
					width: 8,
					height: 2,
					fillStyle: '#AAAAAA'
				});
			break;
			case 's':
				var bullet = new Rectangle({
					id: bulletID,
					type: 'bullet',
					ctx: ctx,
					x: player.x + (player.width / 2),
					y: player.y + player.height + 8,
					x2: player.x + (player.width / 2),
					y2: canvas.height + 8,
					width: 2,
					height: 8,
					fillStyle: '#AAAAAA'
				});
			break;
			case 'w':
				var bullet = new Rectangle({
					id: bulletID,
					type: 'bullet',
					ctx: ctx,
					x: player.x - 8,
					y: player.y + (player.height / 2),
					x2: -8,
					y2: player.y + (player.height / 2),
					width: 8,
					height: 2,
					fillStyle: '#AAAAAA'
				});
			break;
		}

		
		scene.objects.push(bullet);

		bulletID++;

		window.setTimeout(function() {
			shooting = false;
		}, 500);
	}
}

function collision() {
	var indexesToRemove = [];
	for(var i = 0; i < scene.objects.length; i++) {
		if(scene.objects[i].type === 'player') {
			if(scene.objects[i].x < 0 || scene.objects[i].x + scene.objects[i].width > canvas.width) {
				scene.objects[i].x = scene.objects[i].lastX;
			}
			if(scene.objects[i].y < 0 || scene.objects[i].y + scene.objects[i].height > canvas.height) {
				scene.objects[i].y = scene.objects[i].lastY;
			}
		}
		for(var x = 0; x < scene.objects.length; x++) {
			if(scene.objects[i].type !== 'ui' && scene.objects[x].type !== 'ui') {
				if(Math.ceil(scene.objects[i].x) + scene.objects[i].width === Math.ceil(scene.objects[x].x) && (Math.ceil(scene.objects[i].y) >= Math.ceil(scene.objects[x].y) && Math.ceil(scene.objects[i].y) <= Math.ceil(scene.objects[x].y) + scene.objects[x].height || Math.ceil(scene.objects[i].y) + scene.objects[i].height >= Math.ceil(scene.objects[x].y) && Math.ceil(scene.objects[i].y) + scene.objects[i].height <= Math.ceil(scene.objects[x].y) + scene.objects[x].height)) { // East
					if(Math.ceil(scene.objects[i].x) > scene.objects[i].lastX) {
						scene.objects[i].x = scene.objects[i].lastX;
						if(scene.objects[i].type === 'zombie' && scene.objects[x].type === 'player') {
							health = health - 0.1;
						}
					}
				}
				if(Math.ceil(scene.objects[i].x) === Math.ceil(scene.objects[x].x) + scene.objects[x].width && (Math.ceil(scene.objects[i].y) >= Math.ceil(scene.objects[x].y) && Math.ceil(scene.objects[i].y) <= Math.ceil(scene.objects[x].y) + scene.objects[x].height || Math.ceil(scene.objects[i].y) + scene.objects[i].height >= Math.ceil(scene.objects[x].y) && Math.ceil(scene.objects[i].y) + scene.objects[i].height <= Math.ceil(scene.objects[x].y) + scene.objects[x].height)) { // West
					if(Math.ceil(scene.objects[i].x) < scene.objects[i].lastX) {
						scene.objects[i].x = scene.objects[i].lastX;
						if(scene.objects[i].type === 'zombie' && scene.objects[x].type === 'player') {
							health = health - 0.1;
						}
					}
				}

				if(Math.ceil(scene.objects[i].y) + scene.objects[i].height === Math.ceil(scene.objects[x].y) && (Math.ceil(scene.objects[i].x) >= Math.ceil(scene.objects[x].x) && Math.ceil(scene.objects[i].x) <= Math.ceil(scene.objects[x].x) + scene.objects[x].width || Math.ceil(scene.objects[i].x) + scene.objects[i].width >= Math.ceil(scene.objects[x].x) && Math.ceil(scene.objects[i].x) + scene.objects[i].width <= Math.ceil(scene.objects[x].x) + scene.objects[x].width)) { // South
					if(Math.ceil(scene.objects[i].y) > scene.objects[i].lastY) {
						scene.objects[i].y = scene.objects[i].lastY;
						if(scene.objects[i].type === 'zombie' && scene.objects[x].type === 'player') {
							health = health - 0.1;
						}
					}
				}
				if(Math.ceil(scene.objects[i].y) === Math.ceil(scene.objects[x].y) + scene.objects[x].height && (Math.ceil(scene.objects[i].x) >= Math.ceil(scene.objects[x].x) && Math.ceil(scene.objects[i].x) <= Math.ceil(scene.objects[x].x) + scene.objects[x].width || Math.ceil(scene.objects[i].x) + scene.objects[i].width >= Math.ceil(scene.objects[x].x) && Math.ceil(scene.objects[i].x) + scene.objects[i].width <= Math.ceil(scene.objects[x].x) + scene.objects[x].width)) { // North
					if(Math.ceil(scene.objects[i].y) < scene.objects[i].lastY) {
						scene.objects[i].y = scene.objects[i].lastY;
						if(scene.objects[i].type === 'zombie' && scene.objects[x].type === 'player') {
							health = health - 0.1;
						}
					}
				}
			}

			if(scene.objects[i].type === 'player' && scene.objects[x].type === 'zombie') {
				if(scene.objects[i].x < scene.objects[x].x + scene.objects[x].width  && scene.objects[i].x + scene.objects[i].width  > scene.objects[x].x && scene.objects[i].y < scene.objects[x].y + scene.objects[x].height && scene.objects[i].y + scene.objects[i].height > scene.objects[x].y) {
					player.x = player.lastX;
					player.y = player.lastY;
				}
			}

			if(scene.objects[i].type === 'bullet') {
				// if(scene.objects[i] !== scene.objects[x]) {
					if(scene.objects[i].x < 0 || scene.objects[i].x + scene.objects[i].width > canvas.width || scene.objects[i].y < 0 || scene.objects[i].y + scene.objects[i].height > canvas.height) {
						// scene.objects[i].fillStyle = 'transparent';
						console.log('canvas ' + i);
						indexesToRemove.push(i);
					}
					if(scene.objects[i].x < scene.objects[x].x + scene.objects[x].width  && scene.objects[i].x + scene.objects[i].width  > scene.objects[x].x && scene.objects[i].y < scene.objects[x].y + scene.objects[x].height && scene.objects[i].y + scene.objects[i].height > scene.objects[x].y) {
						if(scene.objects[x].type === 'zombie') {
							// scene.objects[x].kill = true;
							console.log('zombie');
							indexesToRemove.push(i);
							indexesToRemove.push(x);
						} else {
							console.log('other');
							indexesToRemove.push(i);
						}
					}
				// }
			}
		}
	}

	for(var i = 0; i < indexesToRemove.length; i++) {
		
	}
}

var wavesStarted = false;

function waves() {
	if(wavesStarted === false) {
		wavesStarted = true;
		if(wavesEntered[wave] == undefined) {
			for(var i = 0, algorithm = Math.ceil(wave * wave + 3); i <= algorithm; i++) {
				if(i < algorithm / 2) {
					var zombie = new Rectangle({
						id: zombieID,
						type: 'zombie',
						ctx: ctx,
						x: Math.floor(Math.random()*(800-0+1)+0),
						y: -36,
						width: 24,
						height: 36,
						fillStyle: '#FFFFFF',
						lineWidth: 1,
						strokeStyle: '#000000'
					});
				} else {
					var zombie = new Rectangle({
						id: zombieID,
						type: 'zombie',
						ctx: ctx,
						x: Math.floor(Math.random()*(800-0+1)+0),
						y: canvas.height,
						width: 24,
						height: 36,
						fillStyle: '#FFFFFF',
						lineWidth: 1,
						strokeStyle: '#000000'
					});
				}
				zombies.push(zombie);
				scene.objects.push(zombie);

				zombieID++;
			}
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
			if(object.x < object.x2) {
				object.x = object.x + 6;
			} else {
				object.x = object.x - 6;
			}

			if(object.y < object.y2) {
				object.y = object.y + 6;
			} else {
				object.y = object.y - 6;
			}			
		}
	}
}

function ui() {
	if(health >= 0) {
		healthFG.width = (health / 100) * 150;
	}
	scoreText.text = score;
}
