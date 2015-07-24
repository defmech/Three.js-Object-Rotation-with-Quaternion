window.log = function()
{
	if (this.console)
	{
		console.log(Array.prototype.slice.call(arguments));
	}
};

// Namespace
var Defmech = Defmech ||
{};

Defmech.RotationWithQuaternion = (function()
{
	'use_strict';

	var container;

	var camera, scene, renderer;

	var cube, floor;

	var mouseDown = false;
	var rotateStartPoint = new THREE.Vector3(0, 0, 1);
	var rotateEndPoint = new THREE.Vector3(0, 0, 1);

	var curQuaternion;
	var windowHalfX = window.innerWidth / 2;
	var windowHalfY = window.innerHeight / 2;
	var rotationSpeed = 2;
	var lastMoveTimestamp,
		moveReleaseTimeDelta = 50;

	var startPoint = {
		x: 0,
		y: 0
	};

	var deltaX = 0,
		deltaY = 0;

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

		var cubeMaterial = new THREE.MeshLambertMaterial(
		{
			vertexColors: THREE.FaceColors,
			overdraw: 0.5
		});

		cube = new THREE.Mesh(boxGeometry, cubeMaterial);
		cube.position.y = 200;
		cube.castShadow = true;
		scene.add(cube);

		// LIGHTS

		var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
		hemiLight.color.setHSL(1, 1, 1);
		hemiLight.position.set(0, 500, 0);
		scene.add(hemiLight);

		var dirLight = new THREE.DirectionalLight(0xffffff, 1);
		dirLight.color.setHSL(0.2, 0.2, 0.2);
		dirLight.position.set(0, 800, 0);
		dirLight.castShadow = true;

		dirLight.shadowMapWidth = 2048;
		dirLight.shadowMapHeight = 2048;

		var d = 400;

		dirLight.shadowCameraLeft = -d;
		dirLight.shadowCameraRight = d;
		dirLight.shadowCameraTop = d;
		dirLight.shadowCameraBottom = -d;

		dirLight.shadowCameraFar = 3500;
		dirLight.shadowBias = -0.0001;
		dirLight.shadowDarkness = 0.20;
		// dirLight.shadowCameraVisible = true;

		scene.add(dirLight);
		// GROUND

		var groundGeo = new THREE.PlaneGeometry(10000, 10000);
		var groundMat = new THREE.MeshPhongMaterial(
		{
			ambient: 0xffffff,
			color: 0xffffff,
			specular: 0x000000
		});
		groundMat.color.setHSL(1, 1, 1);

		var ground = new THREE.Mesh(groundGeo, groundMat);
		ground.rotation.x = -Math.PI / 2;
		ground.position.y = -33;
		ground.receiveShadow = true;

		scene.add(ground);

		// renderer
		renderer = new THREE.WebGLRenderer(
		{
			antialias: true
		});
		// renderer = new THREE.CanvasRenderer();
		renderer.setClearColor(0xf0f0f0);
		renderer.shadowMapEnabled = true;
		renderer.shadowMapCullFace = THREE.CullFaceBack;
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

		startPoint = {
			x: event.clientX,
			y: event.clientY
		};

		rotateStartPoint = rotateEndPoint = projectOnTrackball(0, 0);
	}

	function onDocumentMouseMove(event)
	{
		deltaX = event.x - startPoint.x;
		deltaY = event.y - startPoint.y;

		handleRotation();

		startPoint.x = event.x;
		startPoint.y = event.y;

		lastMoveTimestamp = new Date();
	}

	function onDocumentMouseUp(event)
	{
		if (new Date().getTime() - lastMoveTimestamp.getTime() > moveReleaseTimeDelta)
		{
			deltaX = event.x - startPoint.x;
			deltaY = event.y - startPoint.y;
		}

		mouseDown = false;

		document.removeEventListener('mousemove', onDocumentMouseMove, false);
		document.removeEventListener('mouseup', onDocumentMouseUp, false);
	}

	function projectOnTrackball(touchX, touchY)
	{
		var mouseOnBall = new THREE.Vector3();

		mouseOnBall.set(
			clamp(touchX / windowHalfX, -1, 1), clamp(-touchY / windowHalfY, -1, 1),
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
			angle *= rotationSpeed;
			quaternion.setFromAxisAngle(axis, angle);
		}
		return quaternion;
	}

	function clamp(value, min, max)
	{
		return Math.min(Math.max(value, min), max);
	}

	function animate()
	{
		requestAnimationFrame(animate);
		render();
	}

	function render()
	{
		if (!mouseDown)
		{
			var drag = 0.95;
			var minDelta = 0.05;

			if (deltaX < -minDelta || deltaX > minDelta)
			{
				deltaX *= drag;
			}
			else
			{
				deltaX = 0;
			}

			if (deltaY < -minDelta || deltaY > minDelta)
			{
				deltaY *= drag;
			}
			else
			{
				deltaY = 0;
			}

			handleRotation();
		}

		renderer.render(scene, camera);
	}

	var handleRotation = function()
	{
		rotateEndPoint = projectOnTrackball(deltaX, deltaY);

		var rotateQuaternion = rotateMatrix(rotateStartPoint, rotateEndPoint);
		curQuaternion = cube.quaternion;
		curQuaternion.multiplyQuaternions(rotateQuaternion, curQuaternion);
		curQuaternion.normalize();
		cube.setRotationFromQuaternion(curQuaternion);

		rotateEndPoint = rotateStartPoint;
	};

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