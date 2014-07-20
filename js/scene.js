define([
	"jquery", 
	"three", 
	"three-css3d", 
	"three-trackball", 
	"tween"
	], 

	function($, THREE, CSS3DRenderer, TrackballControls, TWEEN){


	//----------------------------------------------------------
	// Private Static Vars
	//----------------------------------------------------------

	var VERSION = 0.1;

	//-------------------------------------------------------
	//  NameSpace
	//-------------------------------------------------------

	var Scene = function(selector, data){

	//------------------------------------------------------
	//  Private Instance Vars
	//------------------------------------------------------

		var camera;
		var scene, renderer;
		var parentScreen;
		var screens = [];
		var frames = [];
		var controls;
		var self = this;
		var activeScreen, nextScreen = null;
		var _spacing = 500;
		var _rate = 13;
		var _focalVector;

	//------------------------------------------------------
	//  Public Instance Vars
	//------------------------------------------------------

		this.$el = $(selector);
		this.data = data;


	//------------------------------------------------------
	//  Initialization
	//------------------------------------------------------

		var init = function() {
			scene = new THREE.Scene();
			var $parentScreenEl = 
					$('<div>' +
					'</div>');
				$parentScreenEl.css({
					width:window.innerWidth,
					height:window.innerHeight
				});

			parentScreen = new THREE.CSS3DObject($parentScreenEl[0]);
			parentScreen.rotation.reorder("ZYX");
			scene.add(parentScreen);

			for ( var i = 0; i < self.data.length; i ++ ) {

				var screen = self.data[i];

				var $screenEl = 
					$('<div>' +
						'<h2>'+screen.title+'</h2>' +
						'<p>'+screen.body+'</p>' +
					'</div>');
				$screenEl.css({
					width:window.innerWidth-20,
					height:window.innerHeight-20,
					padding:10,
					background:screen.color
				});

				var object = new THREE.CSS3DObject( $screenEl[0] );
				object.position.x = - _spacing + Math.random()* _spacing *2;
				object.position.y = - _spacing + Math.random()* _spacing *2;
				object.position.z = -(i * _spacing*1.2);
				object.rotation.x = Math.PI/2 - Math.random() * Math.PI ;
				object.rotation.y = Math.PI/2 - Math.random() * Math.PI;
				object.rotation.z = Math.PI/2 - Math.random();
				
				screens.push(object);
				parentScreen.add( object );

			}

			var vFOV = _wtfFOVFromFrame(window.innerWidth, window.innerHeight, _spacing);

			camera = new THREE.PerspectiveCamera( 
				vFOV, 
				window.innerWidth / window.innerHeight
			);

			var $camEl = $('<div>CAMERA</div>');
				$camEl.css({
					width:window.innerWidth,
					height:window.innerHeight,
					'text-align': 'center',
					'line-height': window.innerHeight/2,
					background:'rgba(0,0,0,.5)',
					border:'10px solid #FF0000'
				});

			camera.position.set(0,0,_spacing*1.1);

			renderer = new CSS3DRenderer();
			renderer.setSize( window.innerWidth, window.innerHeight );
			renderer.domElement.style.position = 'absolute';
			renderer.domElement.style.top = 0;

			nextScreen = 0; 
		
			self.$el.append( $(renderer.domElement) );
			animate();

		}

		//------------------------------------------------------
		//  Public Methods
		//------------------------------------------------------

		this.activateScreen = function(index){
			console.log("scene :: activateScreen : " + index);
			nextScreen = index;
			//animate to screen

			// console.log(
			// 	"camera vector : " 
			// 	+ cameraVector.x 
			// 	+ " : " + cameraVector.y 
			// 	+ " : " + cameraVector.z
			// );

			// console.log(
			// 	"distance to activeScreen : " 
			// 	+ cameraVector.distanceTo(eposition)
			// );
			

			//camera.lookAt(eposition);
		}

		this.next = function(){
			this.activateScreen((activeScreen < screens.length-1) ? activeScreen+1 : 0);
		}

		this.prev = function(){
			this.activateScreen((activeScreen >= 0) ? activeScreen-1 :  screens.length-1);
		}


		//------------------------------------------------------
		//  Private Methods
		//------------------------------------------------------

		//WTF - Whats The Frustom? Field Of View
		function _wtfFOVFromFrame(frameW, frameH, distance){

			//https://github.com/mrdoob/three.js/issues/1239
			// vertical frustum field of view angle in radians = 2 * arctan(frame height / (2 * focal length))
			// multiply by 180/Math.PI for angle in degrees
			return 2 * Math.atan(frameH / ( 2 * distance )) * 180/Math.PI;

		}

		function _getCamDistanceForFrame(frameH, vFOV){
			//http://stackoverflow.com/questions/2866350/move-camera-to-fit-3d-scene
			//a = field of view angle
			//d = distance from camera
			//s = frame size

			var distance = (frameH/2) / Math.tan(vFOV/2);
			return distance;
		}

		function _getCameraPositionForScreen(index){

			var screenTarget = screens[index];
			var focalDistance = new THREE.Vector3(0,0,_spacing);
			
			var targetPosition = focalDistance.clone();
			targetPosition.applyEuler(screenTarget.rotation);
			targetPosition.add(screenTarget.position);

			var targetRotation = screenTarget.rotation.clone();

			return {position:targetPosition, rotation:targetRotation};

		}

		function _getParentPositionForScreen(index){

			var slideTarget = screens[index];
			var slideRotation = slideTarget.rotation;
			var slidePosition = slideTarget.position;
			var targetPosition = slidePosition.clone();

			var targetRotation = new THREE.Euler(
				-slideRotation.x,
				-slideRotation.y,
				-slideRotation.z,
				//This magical line of code thanks to Evan Ribnick
				//3M Computer Vision Engineer.  
				//Took me 3 days of beating my head
				//Took him 3 minutes, and a better understanding
				//of the Euler (pronounced "oy-ler") order
				"ZYX"
			);

			targetPosition.applyEuler(targetRotation);
			
			targetPosition.x*= -1;
			targetPosition.y*= -1;
			targetPosition.z*= -1;

			return {position:targetPosition, rotation:targetRotation};

		}

		function invalidateControls(){
			if(!controls){
				controls = new TrackballControls( camera );
			}else{
				controls.update();
			}
		}

		function invalidateCamera(){

			if(null !== nextScreen && nextScreen !== activeScreen){
				var frame = _getParentPositionForScreen(nextScreen);//screens[nextScreen];

				/*camera.position.set(
					frame.position.x, 
					frame.position.y, 
					frame.position.z
				);
				
				camera.rotation.set(
					frame.rotation.x, 
					frame.rotation.y, 
					frame.rotation.z
				);*/

				//camera.lookAt(screens[nextScreen].position);


				parentScreen.position.x -= (parentScreen.position.x - frame.position.x)/_rate;
				parentScreen.position.y -= (parentScreen.position.y - frame.position.y)/_rate;
				parentScreen.position.z -= (parentScreen.position.z - frame.position.z)/_rate;
				parentScreen.rotation.z -= (parentScreen.rotation.z - frame.rotation.z)/_rate;
				parentScreen.rotation.y -= (parentScreen.rotation.y - frame.rotation.y)/_rate;
				parentScreen.rotation.x -= (parentScreen.rotation.x - frame.rotation.x)/_rate;

				if(parentScreen.position.distanceTo(frame.position) <= .1){
					parentScreen.position.set(
						frame.position.x, 
						frame.position.y, 
						frame.position.z
					);

					//console.log(parentScreen.position);
					
					// parentScreen.rotation.set(
					//  	frame.rotation.x, 
					//  	frame.rotation.y, 
					//  	frame.rotation.z
					//  );

					activateComplete();
				}
				//
			}

			

		}

		function activateComplete(){
			console.log("activateComplete");
			activeScreen = nextScreen;
			nextScreen = null;
		}

		//------------------------------------------------------
		//  Display Methods
		//------------------------------------------------------

		function animate() {

			requestAnimationFrame( animate );
			invalidateCamera();
			//invalidateControls();
			renderer.render( scene, camera );
			
			
		}

		//------------------------------------------------------
		//  Getters/Setters
		//------------------------------------------------------

		this.getActiveScreen = function(){
			return (activeScreen) ? activeScreen : frames[0];
		}

		//------------------------------------------------------
		//  Actuation
		//------------------------------------------------------

		init();
		animate();

	};

	//----------------------------------------------------------
	// Public Static Vars
	//----------------------------------------------------------

	Scene.version = function() {
		return VERSION;
	}


	return Scene;
});