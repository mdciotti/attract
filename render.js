
var iterations = 64,
	x_n,
	y_n,
	a,
	b,
	c,
	d;

function getPointSet() {
	var pixArray = [];
	for (var n = 0; n < iterations; n += 1) {
		pixArray.push([x_n, y_n]);
		
		// Clifford
		//x_n1 = Math.sin(a * y_n) + c * Math.cos(a * x_n);
		//y_n1 = Math.sin(b * x_n) + d * Math.cos(b * y_n);
		
		// Peter de Jong
		x_n1 = Math.sin(a * y_n) - Math.cos(b * x_n);
		y_n1 = Math.sin(c * x_n) - Math.cos(d * y_n);
		
		// Peter de Jong Variation
		//x_n1 = d * Math.sin(a * x_n) - Math.sin(b * y_n);
		//y_n1 = c * Math.cos(a * x_n) + Math.cos(b * y_n);
		
		x_n = x_n1;
		y_n = y_n1;
	}
	return pixArray;
}

onmessage = function(event) {
	var coef = event.data;
	x_n = coef.x_n;
	y_n = coef.y_n;
	a = coef.a;
	b = coef.b;
	c = coef.c;
	d = coef.d;
	r = coef.amount / iterations;

	/*
	var iterator = setInterval(function () {
		postMessage(getPointSet());
	}, 10);*/
	
	while (r > 0) {
		postMessage(getPointSet());
		r -= 1;
	}
	
	if (r == 0) {
		postMessage("done");
	}
};
