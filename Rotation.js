// Namespace
var Defmech = Defmech ||
{};

Defmech.RotationWithQuaternion = (function()
{
	'use_strict';

	var container, stats;

	var camera, scene, renderer;

	var cube, plane;

	var mouseDown = false;
	var rotateStartPoint = new THREE.Vector3(0, 0, 1);
	var rotateEndPoint = new THREE.Vector3(0, 0, 1);

	var windowHalfX = window.innerWidth / 2;
	var windowHalfY = window.innerHeight / 2;

	var startPoint = {
		x: 0,
		y: 0
	};

	var setup = function()
	{
		container = document.createElement('div');
		document.body.appendChild(container);

		var info = document.createElement('div');
		info.style.position = 'absolute';
		info.style.top = '10px';
		info.style.width = '100%';
		info.style.textAlign = 'center';
		info.innerHTML = 'Drag to spin the cube';
		container.appendChild(info);

		camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 1000);
		camera.position.y = 150;
		camera.position.z = 500;

		scene = new THREE.Scene();

		// Cube

		var geometry = new THREE.BoxGeometry(200, 200, 200);

		for (var i = 0; i < geometry.faces.length; i += 2)
		{

			var color = {
				h: (1 / (geometry.faces.length)) * i,
				s: 0.5,
				l: 0.5
			};

			geometry.faces[i].color.setHSL(color.h, color.s, color.l);
			geometry.faces[i + 1].color.setHSL(color.h, color.s, color.l);

		}

		var material = new THREE.MeshBasicMaterial(
		{
			vertexColors: THREE.FaceColors,
			overdraw: 0.5
		});

		cube = new THREE.Mesh(geometry, material);
		cube.position.y = 150;
		scene.add(cube);

		// Plane

		var geometryPlane = new THREE.PlaneGeometry(200, 200);
		geometryPlane.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

		var materialPlane = new THREE.MeshBasicMaterial(
		{
			color: 0xe0e0e0,
			overdraw: 0.5
		});

		plane = new THREE.Mesh(geometryPlane, materialPlane);
		plane.position.y = -50;
		scene.add(plane);

		renderer = new THREE.CanvasRenderer();
		renderer.setClearColor(0xf0f0f0);
		renderer.setSize(window.innerWidth, window.innerHeight);

		container.appendChild(renderer.domElement);

		document.addEventListener('mousedown', onDocumentMouseDown, false);

		window.addEventListener('resize', onWindowResize, false);

		animate();
	};

	function onWindowResize()
	{

		windowHalfX = window.innerWidth / 2;
		windowHalfY = window.innerHeight / 2;

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function centerPoint(x, y)
	{
		return {
			x: (x - windowHalfX) / windowHalfX,
			y: (windowHalfY - y) / windowHalfY
		};
	}

	// The screen coordinate[(0,0)on the left-top] convert to the
	// trackball coordinate [(0,0) on the center of the page]
	function projectOnTrackball(x, y)
	{
		var mouseOnBall = new THREE.Vector3();

		mouseOnBall.set(x, y, 0.0);

		var length = mouseOnBall.length();

		if (length > 1.0)
		{
			mouseOnBall.normalize();
		}
		else
		{
			mouseOnBall.z = Math.sqrt(1.0 - length * length);
		}
		return mouseOnBall;
	}

	function rotateMatrix(rotateStart, rotateEnd)
	{
		var axis = new THREE.Vector3(),
			quaternion = new THREE.Quaternion();

		var angle = Math.acos(rotateStart.dot(rotateEnd) / rotateStart.length() / rotateEnd.length());

		if (angle)
		{
			axis.crossVectors(rotateStart, rotateEnd).normalize();
			angle *= 0.1; //Here we could define rotate speed
			quaternion.setFromAxisAngle(axis, angle);
		}
		return quaternion;
	}

	function onDocumentMouseDown(event)
	{
		event.preventDefault();

		document.addEventListener('mousemove', onDocumentMouseMove, false);
		document.addEventListener('mouseup', onDocumentMouseUp, false);

		mouseDown = true;

		startPoint = centerPoint(event.clientX, event.clientY);

		rotateStartPoint = rotateEndPoint = projectOnTrackball(startPoint.x, startPoint.y);
	}

	function onDocumentMouseMove(event)
	{
		var curPoint = centerPoint(event.clientX, event.clientY);

		var pointDeltaMultiplierX = 40;
		var pointDeltaMultiplierY = pointDeltaMultiplierX / camera.aspect;

		var pointDelta = {
			x: (curPoint.x - startPoint.x) * pointDeltaMultiplierX,
			y: (curPoint.y - startPoint.y) * pointDeltaMultiplierY
		};

		rotateEndPoint = projectOnTrackball(pointDelta.x, pointDelta.y);

		var rotateQuaternion = rotateMatrix(rotateStartPoint, rotateEndPoint);

		var curQuaternion = cube.quaternion;
		curQuaternion.multiplyQuaternions(rotateQuaternion, curQuaternion);
		curQuaternion.normalize();
		cube.setRotationFromQuaternion(curQuaternion);

		startPoint.x = curPoint.x;
		startPoint.y = curPoint.y;
	}

	function onDocumentMouseUp(event)
	{
		document.removeEventListener('mousemove', onDocumentMouseMove, false);
		document.removeEventListener('mouseup', onDocumentMouseUp, false);
		mouseDown = false;

		rotateStartPoint = rotateEndPoint;
	}

	function animate()
	{
		requestAnimationFrame(animate);
		render();
	}

	function render()
	{
		renderer.render(scene, camera);
	}

	// PUBLIC INTERFACE
	return {
		init: function()
		{
			setup();
		}
	};
})();

document.onreadystatechange = function()
{
	if (document.readyState === 'complete')
	{
		Defmech.RotationWithQuaternion.init();
	}
};