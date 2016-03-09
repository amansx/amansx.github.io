var cam;

var Preloader = (function(){
	var canvas, ctx;
	var _setText = function( txt ){
		_clear();
		var fontSize = 10;
		ctx.font= fontSize + 'px Arial';
		ctx.fillText(txt,10,10);
	};	
	var _clear = function(){
		canvas = document.getElementById('preloader');
		ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);	
	};
	var _setVisible = function( bool){
		canvas.style.display = bool?'block':'none';
	};
	return {setText: _setText, clear: _clear, setVisible: _setVisible};
})();

window.addEventListener('DOMContentLoaded', function(){
	Preloader.setText( 'Now loading...');
	var loadStart = false;
	var bgm = document.getElementById('bgm');
	var bgmProgress = function( e ){
		loadStart = true;
		var bgmduration = e.target.duration, bgmend;
		try{ bgmend = e.target.buffered.end(0); }catch(ex){ bgmend = 0 ; }
		var preloadPercentage = Math.round( ( bgmend/bgmduration) * 100 );
		if( preloadPercentage < 100 ){ 
			Preloader.clear(); 
			Preloader.setText( 'Now loading BGM ' + preloadPercentage + '%' ); 
		}else{ 
			Preloader.clear();
			bgm.removeEventListener('progress', bgmProgress );
			WorldSynthesizer.init()
		}
	};
	bgm.addEventListener('progress', bgmProgress );
	bgm.addEventListener('loadeddata', function( e ){
		bgm.play(); setTimeout("bgm.pause()", 10);
	});
	setTimeout(function(){
		if(!loadStart){
			Preloader.clear();
			bgm.removeEventListener('progress', bgmProgress );
			WorldSynthesizer.init();
		}
	}, 5000);
});

var ScriptCamera = (function(){
	var _scene, _camera;
	var fps = 30;
 	var IP, SCRIPT, I_END, isEx = false;
	
	var _runCurrentInstruction = function(){
		if( IP >= I_END ){ return;}
		
		console.log( 'running: ' );
		console.log( SCRIPT[IP] );
		
		isEx = true;
		
		if( SCRIPT[IP].callback ){ SCRIPT[IP].callback.call( this ); }
		_animate( SCRIPT[IP].position, SCRIPT[IP].rotation, SCRIPT[IP].speed );
		IP++;
	};
	
	var _animate = function ( position, rotation, speed ) {
		_camera.animations = [];
		if( position ){
			var animCamPosition = new BABYLON.Animation("animCam", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			var keysPosition = [];
			keysPosition.push({ frame: 0, value: _camera.position });
			keysPosition.push({ frame: 100, value: position });
			animCamPosition.setKeys(keysPosition);
			_camera.animations.push(animCamPosition);
		}
		
		if(rotation){
			var animCamRotation = new BABYLON.Animation("animCam", "rotation", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			var keysRotation = [];
			keysRotation.push({ frame: 0, value: _camera.rotation });
			keysRotation.push({ frame: 100, value: rotation });
			animCamRotation.setKeys(keysRotation);
			_camera.animations.push(animCamRotation);
		}
		
		_scene.beginAnimation(_camera, 0, 100, false, (speed?speed:1) , function(){ setTimeout( _runCurrentInstruction, 0 ); });
	}
	
	var _runScript = function( script ){
		if( isEx ){ return; }
		SCRIPT = script; IP = 0; I_END = script.length;
		_runCurrentInstruction();
	};
	
	var _init = function( scene ){
		_scene = scene, _camera = scene.activeCamera;
	};
	return { init: _init, runScript: _runScript };
})();
	
var TextureLoader = (function(){
	var _textureRegistry = {};
	var _textureQueue = [];
	var _callback;
	var _addTexture = function( _name, _src){
		_textureQueue.push({ name: _name, src: _src });
	};
	var _preLoad = function(){
		
		var obj = _textureQueue.pop();
		if(obj){
			var imageObj = new Image();
			imageObj.src = obj.src;
			imageObj.onload = function() {	
				var canvas = document.createElement("canvas");
				canvas.width = this.width;
				canvas.height = this.height;
				var ctx = canvas.getContext("2d");
				ctx.drawImage(this, 0, 0);
				_textureRegistry[obj.name] = canvas.toDataURL("image/png|gif|jpg");

				console.log( 'Load complete for texture: ' + obj.name );
				_preLoad();	
			};
		}else{
			_callback.call( window );
		}
	};
	var _setCallback = function( callback ){ _callback = callback; };
	var _load = function( name ){
		return _textureRegistry[name];
	};
	return { load: _load, preLoad : _preLoad, setCallback: _setCallback, addTexture: _addTexture };
})();

var WorldSynthesizer = (function(){
	
	var DEBUG = false;
	
	var _canvas, _engine, _scene, _track;
	var CAM_CONTROLLABLE = true, LOCK_CAMERA = false;
	
	var SCENE_BG  =  new BABYLON.Color4(0,0,0,1);
	
	var _buldingRegistry = [], _roadRegistry = [], _heliRegistry = [], _carRegistry = [];
	
	var MAT_BUILD, GUIDE, ANIM_CAMERA;
	var A = 110, B = 100, C = 101, D = 102, E = 103, F = 104, G = 105,
		H = 106, I = 107, J = 108, K = 109;
	
	var _shadowGenerator;
	
	var _renderLoop = function(){
		TWEEN.update();
		_scene.render();
	};
	
	var _rand = function( start, end ){
		if(!end){
			return Math.random() * (start*2) - start;
		}else{
			return Math.random() * (end - start) + start;
		}
	};
	
	var _unloadSound = function(){
		var i = 0;
		var intv1 = setInterval( function(){
			_track.volume-=(_track.volume<0.1)?(0):(0.1);
			if( (++i) >= 9){ 
				clearInterval( intv1 ); 
				_track.pause();
				_track.currentTime = 0;
			}
		}, 1000);
	};
	
	var _loadSound = function(){
		
		_track = document.getElementById("bgm");
		_track.volume = 0.5; 
		_track.play();
		
		var raiseVol = function(){
			_track.volume += (_track.volume>0.9)?(0):(0.1); 
		};
		var decVol = function(){ 
			_track.volume-=(_track.volume<0.1)?(0):(0.1); 
		};
		
		document.getElementById('increaseVolume').addEventListener('click', raiseVol );
		document.getElementById('decreaseVolume').addEventListener('click', decVol );
		
	};
	
	var _endAnimation = function(){
		console.log('Credit Roll!');
		setTimeout(function(){
			_unloadSound();
		}, 10000);
	};
	
	var _generateBuildingTexture = function(){
		var canvas  = document.createElement( 'canvas' );
		canvas.width  = 32, canvas.height = 64;
		
		var context = canvas.getContext( '2d' );
		context.fillStyle = '#ffffff';
		//context.fillStyle = '#555';
		context.fillRect( 0, 0, 32, 64 );

		for( var y = 2; y < 64; y += 2 ){
			for( var x = 0; x < 32; x += 2 ){
				var value = Math.floor( Math.random() * 64 );
				//var value = 0;
				context.fillStyle = 'rgb(' + [value, value, value].join( ',' )  + ')';
				context.fillRect( x, y, 2, 1 );
			}
		}		
		return canvas.toDataURL("image/png");		
	};
	
	var _initSnow = function( scene ){
	
		var fountain = BABYLON.Mesh.CreatePlane("plane", 1, scene);
		fountain.position.x = 0;
		fountain.position.y = 14;
		fountain.position.z = 0;
		fountain.isVisible = false;
		
		fountain.rotation.x = Math.PI/2;
		
		//fountain.scaling = new BABYLON.Vector3( 5, 1, 5);
		
		var particleSystem = new BABYLON.ParticleSystem("particles", 10000, scene);
		particleSystem.color1 = new BABYLON.Color4( 1, 1, 1 );
		particleSystem.particleTexture = new BABYLON.Texture( TextureLoader.load('snow') , scene);
		
		particleSystem.minEmitBox = new BABYLON.Vector3(-50, -50, 0);
		particleSystem.maxEmitBox = new BABYLON.Vector3(50, 50, 0);
		
		particleSystem.emitRate = 7000;
		particleSystem.maxLifeTime = 4.8;
		particleSystem.minSize = 0.1;
		particleSystem.maxSize = 0.1;
		
		//particleSystem.textureMask = new BABYLON.Color4(0.1, 0.8, 0.8, 1.0);
		particleSystem.emitter = fountain;
		particleSystem.gravity = new BABYLON.Vector3(0, -Math.PI/2 , 0);
		particleSystem.start();
		
		
	};
	
	var _acCLock = function( arcRotCamera ){
		
		// TOP BOTTOM
		if (arcRotCamera.beta < 1.2){ arcRotCamera.beta = 1.2; }
		else if (arcRotCamera.beta > (Math.PI / 2) * 0.9){ arcRotCamera.beta = (Math.PI / 2) * 0.9; }
		
		//FAR
		if (arcRotCamera.radius > 50){ arcRotCamera.radius = 50; }
		
		//Close
		if (arcRotCamera.radius < 50){ arcRotCamera.radius = 50; }
	};
	
	var _createGround = function( scene ){
	
		var ground = BABYLON.Mesh.CreateGround("Ground", 100, 100, 1, scene, false);
		
		var groundMaterial = new BABYLON.StandardMaterial("GroundMat", scene);
		groundMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
		groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		ground.material = groundMaterial;
		
		//groundMaterial.alpha = 0.8;
		// groundMaterial.diffuseTexture = new BABYLON.Texture("textures/bgg3.png", scene);
		// groundMaterial.diffuseTexture.uScale = 3;
		// groundMaterial.diffuseTexture.vScale = 3;		
		
		ground.position.y = 0;
		ground.receiveShadows = true;
	
	};
	var _setLight = function( scene ){
		
		var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
		light.intensity = 0.5;

		var sun = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-1, -2, -1), scene);
		sun.position = new BABYLON.Vector3( 100, 100, 100);
		_shadowGenerator = new BABYLON.ShadowGenerator(1024, sun);

		var fakeSun = BABYLON.Mesh.CreateBox('sun', 1, scene );
		
		fakeSun.isVisible = false;
		fakeSun.position.x = 100;
		fakeSun.position.y = 50;
		fakeSun.position.z = 100;
		
		
		var lensFlareSystem = new BABYLON.LensFlareSystem("lensFlareSystem", fakeSun, scene);
		var flare00 = new BABYLON.LensFlare(1, 1, new BABYLON.Color3(1, 0, 0), TextureLoader.load('lens4'), lensFlareSystem);
		var flare01 = new BABYLON.LensFlare(0.8, 0.6, new BABYLON.Color3(1, 1, 1), TextureLoader.load('flare'), lensFlareSystem);
	
	};
	var _setEnvironment = function( scene ){

		var sky = BABYLON.Mesh.CreateBox('sky', 500, scene );
		var skyMat = new BABYLON.StandardMaterial("skyMat", scene);
		skyMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
		skyMat.backFaceCulling = false;
		sky.material = skyMat;
	
		scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
		scene.fogColor = new BABYLON.Color3(1, 1, 1);
		scene.fogDensity = 0.01;	
		
		_initSnow( scene );
	};
	var _generateMaterial = function( scene ){
		var m1 = new BABYLON.StandardMaterial("m1", scene);
		m1.diffuseColor = new BABYLON.Color3(0, 0, 0);
		m1.specularColor = new BABYLON.Color3(0, 0, 0);

		var m2 = new BABYLON.StandardMaterial("m2", scene);
		m2.diffuseColor = new BABYLON.Color3( 1, 1, 1);
		m2.diffuseTexture = new BABYLON.Texture(_generateBuildingTexture(), scene);
		m2.diffuseTexture.uScale = 1;
		m2.diffuseTexture.vScale = 1;

		var mf = new BABYLON.MultiMaterial("mf", scene);
		mf.subMaterials.push(m2);
		mf.subMaterials.push(m1);
		mf.subMaterials.push(m2);

		MAT_BUILD = mf;
	}
	var _loadObjects = function( scene ){
	
		var levelYOffset = 0.1;
	
		var levelMap = [
			 [F, A, A, A, A, A, A, A, J, A, A, A, J, A, A, A, C, 0, 0, 0, 0],
			 [B, 1, 1, 1, 0, 1, 1, 1, B, 1, 1, 1, B, 1, 1, 1, B, 1, 1, 1, 0],
			 [B, 3, 2, 1, 0, 1, A, A, G, 1, 4, 4, G, 1, 3, 1, B, 1, K, 1, 0],
			 [B, 3, 2, 1, 0, 1, 1, 1, 4, 1, 1, F, D, 1, 3, 1, B, 1, K, 1, 0],
			 [B, 1, 0, 1, F, A, 0, 1, 0, 1, F, D, 2, 1, 3, 1, B, 1, K, 1, 0],
			 [B, 2, 1, 2, B, 1, 1, 1, 0, 1, B, 2, 2, 1, 1, 1, B, 1, 1, 1, 0],
			 [E, A, A, A, H, 4, 0, 0, 0, 4, H, A, A, A, A, A, D, 0, 0, 0, 0],
		];

		var createShops = function( x, z ){
		
			var shopFloor = BABYLON.Mesh.CreatePlane("shopFloor", 4, scene);
			shopFloor.position.x = x;
			shopFloor.position.y = levelYOffset;
			shopFloor.position.z = z;
			
			shopFloor.rotation.x = Math.PI/2;
			
			var sfMat = new BABYLON.StandardMaterial('shopFloorMat', scene);
			sfMat.diffuseTexture = new BABYLON.Texture( TextureLoader.load('ground') , scene);
			sfMat.diffuseTexture.uScale = 5;
			sfMat.diffuseTexture.vScale = 5;
			//sfMat.diffuseColor = new BABYLON.Color3( 0.5, 0.5, 0.5 );
			sfMat.specularColor = new BABYLON.Color3( 0,0,0);
			
			shopFloor.material = sfMat;
			
			var createRandomShop = function(){
			
				var height = 1;
			
				var shop = BABYLON.Mesh.CreateBox("shop", height , scene);
				var shopMat = new BABYLON.StandardMaterial('shopMat', scene);
				shopMat.diffuseColor = new BABYLON.Color3( 1, 0, 0 );
				shopMat.specularColor = new BABYLON.Color3(0, 0, 0);
				shop.material = shopMat;
				
				height = (height) + Math.random()*2;
				
				var nx = x + _rand(1.5), nz = z  + _rand(1.5);
				shop.position.x = nx;
				shop.position.y = levelYOffset + (height/2);
				shop.position.z = nz;
				
				shop.scaling.y = height;
				shop.rotation.y = Math.random();
			}
						
			for( var t =0; t < 2; t++){ createRandomShop();	}
			shopFloor.receiveShadows = true;
		};
		
		var createPool = function( x, z ){
		
			var pool = BABYLON.Mesh.CreatePlane("pool", 4, scene);
			pool.position.x = x;
			pool.position.y = levelYOffset;
			pool.position.z = z;
			
			pool.rotation.x = Math.PI/2;
			
			var poolMat = new BABYLON.StandardMaterial('poolMat', scene);
			poolMat.diffuseColor = new BABYLON.Color3( 0, 1, 2 );
			poolMat.specularColor = new BABYLON.Color3( 0,0,0);
			pool.material = poolMat;
			
			pool.receiveShadows = true;			
		};
		
		var createGarden = function( x, z ){
		
			var createRandomTree = function(){
				var tree = BABYLON.Mesh.CreateBox("tree", 0.5, scene);
				var treeMat = new BABYLON.StandardMaterial('treeMat', scene);
				treeMat.diffuseColor = new BABYLON.Color3( 1, 2, 0 );
				treeMat.specularColor = new BABYLON.Color3(0, 0, 0);
				tree.material = treeMat;
				
				var treeHeight = 1 + Math.random()*1;
				var nx = x + _rand(1.5), nz = z  + _rand(1.5);
				tree.position.x = nx;
				tree.position.y = 0.5 + (treeHeight/2);
				tree.position.z = nz;
				tree.scaling.y = treeHeight;
				
				var treeBark = BABYLON.Mesh.CreateBox("treeBark", 0.1, scene);
				treeBark.position.x = nx;
				treeBark.position.y = 0.5;
				treeBark.position.z = nz;	
				treeBark.scaling.y = 10;			
				//tree.receiveShadows = true;
			}
			
			for( var t =0; t < 3; t++){ createRandomTree();	}
			
			var garden = BABYLON.Mesh.CreatePlane("garden", 4, scene);
			garden.position.x = x;
			garden.position.y = levelYOffset;
			garden.position.z = z;
			
			garden.rotation.x = Math.PI/2;
			
			var gardenMat = new BABYLON.StandardMaterial('gardenMat', scene);
			gardenMat.diffuseColor = new BABYLON.Color3( 0.7, 0.8, 0 );
			gardenMat.specularColor = new BABYLON.Color3(0, 0, 0);
			garden.material = gardenMat;
			
			garden.receiveShadows = true;
			
		};
		
		var loadLogo = function(){

			var logo = BABYLON.Mesh.CreatePlane( 'logo', 10, scene );
			logo.position.x = 0;
			logo.position.y = 70;
			logo.position.z = 20;
						
			var logoMat = new BABYLON.StandardMaterial('logoMat', scene);
			logoMat.diffuseTexture = new BABYLON.Texture( TextureLoader.load('wingify') , scene);
			logoMat.diffuseTexture.hasAlpha = true;
			logo.material = logoMat;
			
			logo.rotation.x = Math.PI/2;
			logo.scaling.x = 3;
			
			
		};
		
		var createHelicopter = function( x, z ){
			
			var heliWidth = 1;
			var heli = BABYLON.Mesh.CreateBox( 'heli', 1, scene );
			heli.position.x = 0;
			heli.position.y = 0;
			heli.position.z = 0;
			
			heli.scaling.y = 0.8;
			heli.scaling.z = 0.8;

			var heliTailWidth = 1;
			var heliTail = BABYLON.Mesh.CreateBox( 'heliTail', heliTailWidth, scene );
			heliTail.position.x = heliWidth;
			heliTail.position.y = (heliWidth/2)-0.3;
			heliTail.position.z = 0;
			
			heliTail.scaling.y = 0.2;
			heliTail.scaling.z = 0.2;

			var heliTailFanWidth = 0.5;
			var heliTailFan = BABYLON.Mesh.CreatePlane( 'heliTailFan', heliTailFanWidth, scene );
			heliTailFan.position.x = (heliWidth/2) + heliTailWidth;
			heliTailFan.position.y = heliTail.position.y;
						
			var choper = BABYLON.Mesh.mergeMeshes('choper', [heli, heliTail, heliTailFan], scene );
			choper.position.y = 15;
			
			choper.scaling.x = 0.5;
			choper.scaling.y = 0.5;
			choper.scaling.z = 0.5;
			
			

			var heliMat = new BABYLON.StandardMaterial('helimat', scene);
			//heliMat.diffuseColor = new BABYLON.Color3( 0.4, 0.1, 0.8);
			heliMat.diffuseColor = new BABYLON.Color3( 0.3, 0.3, 0.3 );
			//heliMat.specularColor = new BABYLON.Color3( 0, 0, 0);
			heliMat.backFaceCulling = false;
			choper.material = heliMat;
			
			_shadowGenerator.getShadowMap().renderList.push( choper );
			_heliRegistry.push( choper );
			
		};

		var createCars = function(){
		
			var createCar = function( x, z ){

				var carBodyHeight = 1;
				var carHeadHeight = 0.5;
				
				var carHead = BABYLON.Mesh.CreateBox("carHead", 1, scene);
				carHead.position.x = (carBodyHeight/2) + (carHeadHeight/2);
				carHead.position.y = -(carHeadHeight/2);
				carHead.position.z = 0;
				
				carHead.scaling.y = carHeadHeight;
				carHead.scaling.x = carHeadHeight;
				
				carHead.isVisible = false;
				

				var carBody = BABYLON.Mesh.CreateBox("carBody", 1, scene);
				carBody.position.x = -0.25;
				carBody.position.y = 0;
				carBody.position.z = 0;
				
				carBody.scaling.x = 1.5;
				
				carBody.isVisible = false;
				
				var car = BABYLON.Mesh.mergeMeshes('car', [ carHead, carBody], scene );
				car.position.x = x;
				car.position.y = levelYOffset + ( (carBodyHeight - 0.5)/2);
				car.position.z = z;
				
				var carMat = new BABYLON.StandardMaterial('carMat', scene);
				var color1 = (Math.random()*10)<5?1:0;
				carMat.diffuseColor = new BABYLON.Color3( 1, color1, color1 );
				car.material = carMat;
				
				car.scaling.x = 0.3;
				car.scaling.y = 0.3;
				car.scaling.z = 0.3;
				
				car.isVisible = false;
				_carRegistry.push( car );
				
			};
			
			for( var i = 0; i < 20; i++){
				createCar( 0, 0 );
			}
		
		};
		
		
		var createRoad = function( x , z, type, vertical ){
			var road = BABYLON.Mesh.CreatePlane("Road", 4.1, scene);
			road.position.x = x;
			road.position.y = levelYOffset;
			road.position.z = z;
			
			var mat = new BABYLON.StandardMaterial('roadMat', scene);
			mat.diffuseTexture = new BABYLON.Texture( TextureLoader.load( 'r'+type), scene);
			mat.diffuseTexture.uScale = 0.95;
			mat.diffuseTexture.vScale = 0.95;
			
			if( vertical ){ road.rotation.y = Math.PI/2; }
			
			mat.diffuseColor = new BABYLON.Color3(1,1,1);
			mat.specularColor = new BABYLON.Color3(0,0,0);
			mat.diffuseTexture.hasAlpha = true;
		
			road.material = mat
			
			road.rotation.x = Math.PI/2;
		}
		
		var createBuilding = function( height, x , z ){
			
			var building = BABYLON.Mesh.CreateCylinder("cube", height, 3, 3, 4, 1, scene, false);
		    //building.isVisible = false;

			building.subMeshes = [];
			building.subMeshes.push(new BABYLON.SubMesh(0, 0, 4, 0, 6, building));
			building.subMeshes.push(new BABYLON.SubMesh(1, 0, 4, 18, 24, building));
			building.subMeshes.push(new BABYLON.SubMesh(2, 0, 4, 6, 18, building));
			
			building.material = MAT_BUILD;
			
			var y = (height/2);
			building.position.x = x, 
			building.position.z = z, 
			building.position.y = y;
		
			_shadowGenerator.getShadowMap().renderList.push( building );
			_buldingRegistry.push( building );
		
		};
		
		var offsety = -Math.floor(levelMap.length/2);
		for( var j = 0, len = levelMap.length; j < len; j++){
			var offsetx = -Math.floor(levelMap[j].length/2);
			for( var k = 0, len1 = levelMap[j].length; k < len1; k++){
				if( levelMap[j][k] === 1 ){
					createBuilding( _rand(4, 14), (offsetx * 4) , ( (-j - offsety ) * 4) );
					if( (Math.random()*10) < 5 ){
						createBuilding( _rand(5, 10), (offsetx * 4)-1 , ( (-j - offsety ) * 4) );
					}
				}
				if( levelMap[j][k] === A ){
					createRoad( (offsetx * 4) , ( (-j - offsety ) * 4), B, true );
				}else if( levelMap[j][k] >= B ){
					createRoad( (offsetx * 4) , ( (-j - offsety ) * 4), levelMap[j][k] );
				}
				
				if( levelMap[j][k] === 2 ){
					createGarden( (offsetx * 4) , ( (-j - offsety ) * 4) );
				}

				if( levelMap[j][k] === 3 ){
					createPool( (offsetx * 4) , ( (-j - offsety ) * 4) );
				}

				if( levelMap[j][k] === 4 ){
					createShops( (offsetx * 4) , ( (-j - offsety ) * 4) );
				}

				offsetx++;
			}
		}
		
		createHelicopter();
		createCars();
		loadLogo();
	};
	


	var _runAnimation = function( scene ){
		ScriptCamera.init( scene );
		ScriptCamera.runScript([		
			{position: new BABYLON.Vector3(0, 10, -30), speed: 0.2 },
			{position: new BABYLON.Vector3(8, 2, 50), rotation: new BABYLON.Vector3( -0.2 , Math.PI, 0), speed: 0.2  },
			{position: new BABYLON.Vector3(0, 20, 50), rotation: new BABYLON.Vector3( 0.2 , Math.PI , 0), speed: 0.5 },
			{rotation: new BABYLON.Vector3( 0.2 , Math.PI + 0.2, 0), speed: 0.6 },
			{rotation: new BABYLON.Vector3( 0.2 , Math.PI - 0.2, 0), speed: 0.4 },
			{position: new BABYLON.Vector3(-10, 4, -30), rotation: new BABYLON.Vector3( -0.5 , 0.4 , 0), speed: 0.7 },
			{position: new BABYLON.Vector3(-30, 20, 0), rotation: new BABYLON.Vector3( 0.5 , Math.PI/2 , 0), speed: 0.2 },
			{position: new BABYLON.Vector3(-50, 5, 0), rotation: new BABYLON.Vector3( 0.2 , Math.PI/2 , 0), speed: 0.5 },
			{position: new BABYLON.Vector3(-50, 5, 12), speed: 0.5 },
			{position: new BABYLON.Vector3(18, 2, 13), speed: 0.2 },
			{position: new BABYLON.Vector3(0, 25, 13),rotation: new BABYLON.Vector3( 0.4 , Math.PI , 0), speed: 0.5 },
			{position: new BABYLON.Vector3(-18, 2, -35), rotation: new BABYLON.Vector3( 0 , 0 , 0), speed: 0.2 },
			{rotation: new BABYLON.Vector3( 0 , 0.6 , 0), speed: 0.2 },
			{position: new BABYLON.Vector3(0, 140, 0), rotation: new BABYLON.Vector3( Math.PI/2 , 0 , 0)  },
			{callback: WorldSynthesizer.end },
		]);
		
	};
	
	var _runCars = function(){
		var runCarPathA = function(){
			var car = _carRegistry.pop();
			car.isVisible = true;
			
			var position = {x:0, z:0};
			
			var tweenA2 = new TWEEN.Tween(position).to( {x: -22, z: -12.5}, 0 )
			.onUpdate(function(){ 
				car.position.x = position.x;
				car.position.z = position.z;
			})
			.onComplete(function(){
				car.rotation.y = Math.PI;
			});
			
			var tweenA1 = new TWEEN.Tween(position).to( {x: -40.5, z: -12.5}, 4000 )
			.onUpdate(function(){ 
				car.position.x = position.x;
				car.position.z = position.z;
			})
			.onComplete(function(){
				car.rotation.y = -Math.PI/2;
			});
			
			var tween = new TWEEN.Tween(position).to( {x: -40.5, z: 12.4}, 4000 )
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onUpdate(function(){ 
				car.position.x = position.x;
				car.position.z = position.z;
			})
			.onComplete(function(){
				car.rotation.y = 0;
			});
			
			var tweenA = new TWEEN.Tween(position).to( {x: 24.4 }, 10000 )
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onUpdate(function(){ 
				car.position.x = position.x;
			})
			.onComplete(function(){
				car.rotation.y = Math.PI/2;
			});

			var tweenB = new TWEEN.Tween(position).to( {z: -12.5}, 4000 )
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onUpdate(function(){ 
				car.position.z = position.z;
			})
			.onComplete(function(){
				car.rotation.y = Math.PI;
			});
			
			var tweenC = new TWEEN.Tween(position).to( {x: -2}, 4000 )
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onUpdate(function(){ 
				car.position.x = position.x;
			})
			.onComplete(function(){
				car.rotation.y = 0;
			});
			
			tweenA2.chain( tweenA1 );
			tweenA1.chain( tween );
			tween.chain( tweenA );
			tweenA.chain( tweenB );
			tweenB.chain( tweenC );
			tweenC.chain( tweenA2 );
			
			tweenA2.start();
			
		};
		
		var runCarPathB = function(){
			var car = _carRegistry.pop();
			car.isVisible = true;
			
			var position = {x:0, z:0};
			
			var tween = new TWEEN.Tween(position).to( {x: 7.5, z: 4}, 0 )			
			.onUpdate(function(){
				car.position.x = position.x;
				car.position.z = position.z;
			});

			var tweenA = new TWEEN.Tween(position).to( {x: 7.5, z: 11.6}, 2000 )
			.onStart(function(){
				car.rotation.y = -Math.PI/2;
			})
			.onComplete(function(){
				car.rotation.y = -Math.PI;
			})
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onUpdate(function(){
				car.position.x = position.x;
				car.position.z = position.z;
			});


			var tweenB = new TWEEN.Tween(position).to( {x: -39.5, z: 11.6}, 10000 )
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onUpdate(function(){
				car.position.x = position.x;
				car.position.z = position.z;
			});

			var tweenC = new TWEEN.Tween(position).to( {x: -39.5, z: -11.6}, 6000 )
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onStart(function(){
				car.rotation.y = (Math.PI/2);
			})
			.onUpdate(function(){
				car.position.x = position.x;
				car.position.z = position.z;
			});
			
			var tweenD = new TWEEN.Tween(position).to( {x: -21.5, z: -11.6}, 2000 )
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onStart(function(){
				car.rotation.y = 0;
			})
			.onUpdate(function(){
				car.position.x = position.x;
				car.position.z = position.z;
			});
			
			tween.chain( tweenA );
			tweenA.chain( tweenB );
			tweenB.chain( tweenC );
			tweenC.chain( tweenD );
			tweenD.chain( tween );
			
			tween.start();
			
		};
		
		for(var i = 0, len = 10; i < len; i++){
			setTimeout( runCarPathA, (i*2000 ) );
		}
		
		for(var i = 0, len = 10; i < len; i++){
			setTimeout( runCarPathB, (i*2000 ) );
		}		

	};
	
	var _playHeli = function(){
	
		var movementTime = function( distance ){
			return distance * 3 * 1000;
		};
	
		var script = [
			{ pos: { x: 40, y: 15, z: 20 }, time: 100 },
			
			{ rot: { y: -0.3 }, time: 2000 },
			{ pos: { x: -40, y: 15, z: -20 }, time: movementTime(5 + 2) },
			{ rot: { y: Math.PI }, time: 2000 },			
			{ pos: { x: -8, y: 5, z: -20 }, time: movementTime( 3 ) },
			{ rot: { y: (Math.PI/2) }, time: 2000},
			{ pos: { x: -8, y: 15, z:15 }, time: movementTime( 3 ) },
			{ rot: { y: Math.PI }, time: 2000},
			{ pos: { x: 23, y: 15, z: 15 }, time: movementTime( 2 ) },
			{ rot: { y: (Math.PI) + (Math.PI/2) }, time: 2000},
			{ pos: { x: 23, y: 4, z: -15 }, time: movementTime( 2 ) },
			{ rot: { y: (Math.PI) }, time: 2000},
			{ pos: { x: 40, y: 4, z: -15 }, time: movementTime( 1 ) },
			{ rot: { y: (Math.PI/2) }, time: 2000},
			{ pos: { x: 40, y: 15, z: 20 }, time: movementTime( 2 ) },
			
		];
	
		var flightPath	= function( obj ){
			
			var tweenRegistry = [];

			var pos = {x:0, y:0, z:0},
				rot = {x:0, y:0, z:0};
			for( var i = 0, len = script.length; i < len; i++){
				var tween;
				if( script[i].pos ){
					tween = new TWEEN.Tween(pos).to({
						x: (script[i].pos.x+0)?(script[i].pos.x+0):(pos.x+0), 
						y: (script[i].pos.y+0)?(script[i].pos.y+0):(pos.y+0), 
						z:(script[i].pos.z+0)?(script[i].pos.z+0):(pos.z+0) 
					}, script[i].time+0 );
					tween.easing(TWEEN.Easing.Quadratic.InOut);
					tween.onUpdate(function(){ 
						obj.position.x = pos.x;
						obj.position.y = pos.y;
						obj.position.z = pos.z;
					});
				}
				if( script[i].rot ){
					tween = new TWEEN.Tween(rot).to({
						x: (script[i].rot.x+0)?(script[i].rot.x+0):0, 
						y: (script[i].rot.y+0)?(script[i].rot.y+0):0, 
						z:(script[i].rot.z+0)?(script[i].rot.z+0):0 
					}, script[i].time+0 );
					tween.onUpdate(function(){ 
						obj.rotation.x = rot.x;
						obj.rotation.y = rot.y;
						obj.rotation.z = rot.z;
					});
				}
				tweenRegistry.push( tween );
				
				if( tweenRegistry[i-1] ){ tweenRegistry[i-1].chain( tweenRegistry[i] ); }
			}
			tweenRegistry[len-1].chain( tweenRegistry[0] );

			tweenRegistry[0].start();
			
		};
		
		for( var i = 0; i < _heliRegistry.length; i++){ 
			flightPath( _heliRegistry[i] );
		}
		
		
	};
	
	var _createScene = function(){
	
		var scene = new BABYLON.Scene( _engine );
		
		var camx = 0, 
			camy = 5,
			camz = -200;
		
		var fC = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, -250), scene);
		fC.setTarget(new BABYLON.Vector3.Zero());
		
		var aC = new BABYLON.ArcRotateCamera("ArcRotateCamera", 1, 0.8, 10, new BABYLON.Vector3(0, 0, 0), scene);
		aC.setPosition(new BABYLON.Vector3(camx, camy, camz));
		
		var arC = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
        arC.setPosition(new BABYLON.Vector3(camx, camy, camz));
		
		_setLight( scene );
		_generateMaterial( scene );
		_loadObjects( scene );
		_createGround( scene );
		_setEnvironment( scene );

		if(!DEBUG){
			_loadSound();
			scene.activeCamera = fC;
			_runAnimation( scene );
		}else{
			scene.activeCamera = arC;
		}
		
		_playHeli();
		_runCars();		
		if( scene.activeCamera === arC && LOCK_CAMERA ){ scene.registerBeforeRender( function(){ _acCLock( arC ) } ); }
		if(CAM_CONTROLLABLE){ scene.activeCamera.attachControl( _canvas ); }
		scene.clearColor = SCENE_BG;
		return scene;
	};
	var _loadWorld = function(){
		Preloader.clear();
		Preloader.setVisible(false);
		_canvas = document.getElementById("renderCanvas");
		_engine = new BABYLON.Engine( _canvas, true);
		_scene = _createScene();
		_engine.runRenderLoop( _renderLoop );
		//_engine.setHardwareScalingLevel(720.0 / window.innerHeight)
		//window.addEventListener("resize", function () {  _engine.resize(); });
	};
	var _init = function(){
		TextureLoader.setCallback( WorldSynthesizer.loadWorld );
		Preloader.clear();
		Preloader.setText('Now loading Textures..');
		TextureLoader.addTexture( 'flare', 'textures/flare.png');
		TextureLoader.addTexture( 'lens4', 'textures/lens4.png');
		TextureLoader.addTexture( 'snow', 'textures/snow.png');
		TextureLoader.addTexture( 'wingify', 'textures/wingifylogo.png');
		TextureLoader.addTexture( 'ground', 'textures/roads/ground.png');
		for( var i = 100; i <= 109; i++){ TextureLoader.addTexture( 'r' + i , 'textures/roads/' + i + '.png'); }
		TextureLoader.preLoad();
	};
	
	return { init: _init, loadWorld: _loadWorld, end: _endAnimation };
})();