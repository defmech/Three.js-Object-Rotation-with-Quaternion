// Namespace
var Defmech = Defmech ||
{};

Defmech.RotationWithQuaternion = (function()
{
	'use_strict';

	var container;

	var camera, scene, renderer;

	var cube, plane;

	var mouseDown = false;
	var rotateStartP = new THREE.Vector3(0, 0, 1);
	var rotateEndP = new THREE.Vector3(0, 0, 1);

	var lastPosX;
	var lastPosY;
	var targetRotationY = 0;
	var targetRotationX = 0;
	var quater;
	var windowHalfX = window.innerWidth / 2;
	var windowHalfY = window.innerHeight / 2;

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

		camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
		camera.position.y = 150;
		camera.position.z = 500;

		scene = new THREE.Scene();

		// Cube

		var boxGeometry = new THREE.BoxGeometry(200, 200, 200);

		for (var i = 0; i < boxGeometry.faces.length; i += 2)
		{

			var color = {
				h: (1 / (boxGeometry.faces.length)) * i,
				s: 0.5,
				l: 0.5
			};

			boxGeometry.faces[i].color.setHSL(color.h, color.s, color.l);
			boxGeometry.faces[i + 1].color.setHSL(color.h, color.s, color.l);

		}

		var cubeMaterial = new THREE.MeshBasicMaterial(
		{
			vertexColors: THREE.FaceColors,
			overdraw: 0.5
		});

		cube = new THREE.Mesh(boxGeometry, cubeMaterial);
		cube.position.y = 200;
		scene.add(cube);

		// Plane

		var planeGeometry = new THREE.PlaneGeometry(200, 200);
		planeGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

		var planeMaterial = new THREE.MeshBasicMaterial(
		{
			color: 0xe0e0e0,
			overdraw: 0.5
		});

		plane = new THREE.Mesh(planeGeometry,planeMaterial);
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

	function onDocumentMouseDown(event)
	{
		event.preventDefault();

		document.addEventListener('mousemove', onDocumentMouseMove, false);
		document.addEventListener('mouseup', onDocumentMouseUp, false);
		mouseDown = true;
		rotateStartP = projectOnTrackball(event.clientX, event.clientY);
	}

	function onDocumentMouseMove(event)
	{

		if (!mouseDown)
		{
			return;
		}

		rotateEndP = projectOnTrackball(event.clientX, event.clientY);
	}

	function onDocumentMouseUp(event)
	{
		document.removeEventListener('mousemove', onDocumentMouseMove, false);
		document.removeEventListener('mouseup', onDocumentMouseUp, false);
		mouseDown = false;
		rotateStartP = rotateEndP;
	}

	function getMouseOnScreen(pageX, pageY)
	{
		return new THREE.Vector2.set(pageX / window.innerWidth, pageY / window.innerHeight);
	}
	// The screen coordinate[(0,0)on the left-top] convert to the
	//trackball coordinate [(0,0) on the center of the page]
	function projectOnTrackball(pageX, pageY)
	{
		var mouseOnBall = new THREE.Vector3();
		mouseOnBall.set(
			(pageX - window.innerWidth * 0.5) / (window.innerWidth * 0.5), (window.innerHeight * 0.5 - pageY) / (window.innerHeight * 0.5),
			0.0
		);

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

	function animate()
	{
		requestAnimationFrame(animate);
		render();
	}

	function render()
	{

		var rotateQuaternion = rotateMatrix(rotateStartP, rotateEndP);
		quater = cube.quaternion;
		quater.multiplyQuaternions(rotateQuaternion, quater);
		quater.normalize();
		cube.setRotationFromQuaternion(quater);


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