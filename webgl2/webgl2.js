var canvas,
	gl = null,
	running = true,
	vbuffer = [],
	program,
	fshaderCode = 
		"void main(void) {" +
		"	gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);" +
		"}",
	vshaderCode = 
		"attribute vec3 ppos;" +
		"uniform mat4 uMVMatrix;" +
		"uniform mat4 uPMatrix;" +
		"void main(void) {" +
		"	gl_Position = uPMatrix * uMVMatrix * vec4(ppos.x, ppos.y, ppos.z, 1.0);" +
		"}",
	rotx = 0,
	roty = 0,
	rotz = 0,
	pointCount = 32*4096
	A = -4.6,
	B = 0.5,
	C = -0.4,
	D = 1.5,
	E = -1.7;

function toRad(deg) {return deg * 2 * Math.PI / 360;}

function getRotationMatrix(rx, ry, rz) {
	var cx = Math.cos(rx), sx = Math.sin(rx),
		cy = Math.cos(ry), sy = Math.sin(ry),
		cz = Math.cos(rz), sz = Math.sin(rz);

		return new Float32Array([
			cy*cz, sx*sy*cz-cx*sz, sx*sz+cx*sy*cz, 0,
			cy*sz, sx*sy*sz+cx*cz, cx*sy*sz-sx*cz, 0,
			  -sy,          sx*cy,          cx*cy, 0,
			    0,              0,              0, 1
		]);
}

function setMatrixUniforms() {
	var mvUniform = gl.getUniformLocation(program, 'uMVMatrix');
	if (mvUniform == -1) {
		console.error('Error during uniform address retrieval: "uMVMatrix"');
		running = false;
		return;
	}
	var pUniform = gl.getUniformLocation(program, 'uPMatrix');
	if (pUniform == -1) {
		console.error('Error during uniform address retrieval: "uPMatrix"');
		running = false;
		return;
	}

	var mvMatrix = getRotationMatrix(toRad(rotx), toRad(roty), toRad(rotz));

	gl.uniformMatrix4fv(mvUniform, false, mvMatrix);
	gl.uniformMatrix4fv(pUniform, false, pMatrix);
}

function draw() {
	if (!running || !gl) return;

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	//gl.clear(gl.COLOR_BUFFER_BIT);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	rotx = (rotx) % 360;
	roty = (roty + 1) % 360;
	rotz = (rotz) % 360;

	//setMatrixUniforms();
	var mvUniform = gl.getUniformLocation(program, 'uMVMatrix');
	if (mvUniform == -1) {
		console.error('Error during uniform address retrieval: "uMVMatrix"');
		running = false;
		return;
	}
	var mvMatrix = getRotationMatrix(toRad(rotx), toRad(roty), toRad(rotz));
	/*var mvMatrix = mat4.create();
	mat4.rotate(mvMatrix, toRad(rotx), [1, 0, 0], mvMatrix);
	mat4.rotate(mvMatrix, toRad(roty), [0, 1, 0], mvMatrix);
	mat4.rotate(mvMatrix, toRad(rotz), [0, 0, 1], mvMatrix);*/
	gl.uniformMatrix4fv(mvUniform, false, mvMatrix);

	var pUniform = gl.getUniformLocation(program, 'uPMatrix');
	if (pUniform == -1) {
		console.error('Error during uniform address retrieval: "uPMatrix"');
		running = false;
		return;
	}
	var pMatrix = mat4.create();
	mat4.identity(pMatrix);
	//mat4.perspective(90, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	gl.uniformMatrix4fv(pUniform, false, pMatrix);

	gl.drawArrays(gl.POINTS, 0, pointCount);
	gl.flush();
}

/*function getShader(id) {
	var shaderScript = document.getElementById(id);

	if (!shaderScript) {
		return null;
	}

	var source = "";
	var currentChild = shaderScript.firstChild;
	while(currentChild) {
		if (currentChild.nodeType == 3) {
			source += currentChild.textContent;
		}
		currentChild = currentChild.nextSibling;
	}

	var shader;

	switch (shaderScript.type) {
	case "x-shader/x-fragment":
		shader = gl.createShader(gl.FRAGMENT_SHADER);
		break;
	case "x-shader/x-vertex":
		shader = gl.createShader(gl.VERTEX_SHADER);
		break;
	default:
		return null;
	}
	
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error("Error while compiling shader (ID '" + id + "')");
		return null;
	}

	return shader;
}*/

function initShaders() {
	//var fshader = getShader('shader-fs');
	//var vshader = getShader('shader-vs');

	var fshader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fshader, fshaderCode);
	gl.compileShader(fshader);
	if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
		console.error('Error during fragment shader compilation:\n' + gl.getShaderInfoLog(fshader));
		return;
	}
	var vshader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vshader, vshaderCode);
	gl.compileShader(vshader);
	if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
		console.error('Error during vertex shader compilation:\n' + gl.getShaderInfoLog(vshader));
		return;
	}

	program = gl.createProgram();
	gl.attachShader(program, vshader);
	gl.attachShader(program, fshader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('Error during program linking:\n' + gl.getProgramInfoLog(program));
		return;
	}

	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		console.error('Error during program validation:\n' + gl.getProgramInfoLog(program));
		return;
	}

	gl.useProgram(program);

	var vattrib = gl.getAttribLocation(program, 'ppos');
	if (vattrib == -1) {
		console.error('Error during attribute address retrieval');
		return;
	}
	gl.enableVertexAttribArray(vattrib);

	vbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);

	//var vertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
	var vertices = new Float32Array(createAttractor(A, B, C, D, E, pointCount));
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	gl.vertexAttribPointer(vattrib, 3, gl.FLOAT, false, 0, 0);
}

function createAttractor(a, b, c, d, e, amount) {
	var scale = 0.3,
		points = [],
		x = 0.0,
		y = 0.0,
		z = 0.0;
	
	for (var n = 0; n < amount; n++) {
		tx = x;
		x = Math.sin(a * y) - z * Math.cos(b * x);
		y = z * Math.sin(c * tx) - Math.cos(d * y);
		z = e * Math.sin(tx)
		points.push(scale * x, scale * y, scale * z);
	}

	//console.log(points);
	return points;
}

function initWebGL() {
	try {
		gl = canvas.getContext('experimental-webgl');
	} catch(e) {
		
	}

	if (!gl) {
		alert('Unable to initialize WebGL');
	} else {
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		//gl.clearDepth(1.0);
		//gl.enable(gl.DEPTH_TEST);
		//gl.depthFunc(gl.LEQUAL);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		gl.enable(gl.BLEND);

		initShaders();

		setInterval(draw, 40);
		//draw();
	}
}

window.onload = function () {
	canvas = document.getElementById('glcanvas');

	initWebGL();
};