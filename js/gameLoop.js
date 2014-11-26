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