function pick(a, b) {
	if(typeof a !== 'undefined') {
		return a;
	} else {
		return b;
	}
}

function Drawable(params) {
	this.x = pick(params.x, 0);
	this.y = pick(params.y, 0);
	this.fillStyle = pick(params.fillStyle, null);
	this.strokeStyle = pick(params.strokeStyle, 'transparent');
	this.lineWidth = pick(params.lineWidth, 0);
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
}

module.exports = {
	Drawable: Drawable,
	Rectangle: Rectangle
}