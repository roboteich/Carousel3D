define([
	"jquery", 
	"three", 
	"three-css3d",  
	"tween"
	], 

	function($, THREE, CSS3DRenderer, TWEEN){

	//----------------------------------------------------------
	// Private Static Vars
	//----------------------------------------------------------

	var VERSION = 0.2;

	//-------------------------------------------------------
	//  NameSpace
	//-------------------------------------------------------

	var Scene = function(selector, contents){

	//------------------------------------------------------
	//  Private Parameters
	//------------------------------------------------------
	
	var _self = this;             /* reference to instance for clear scoping in callbacks and events */
	var _contents = contents;     /* HTMl content to render as frames */
	var _frame = {
			width:window.innerWidth,
			height:window.innerHeight,
			padding:20,
			focalLength:1500,
			rate:13.7
		}


	//------------------------------------------------------
	//  Private Controller Properties
	//------------------------------------------------------

	var _scene;                   /* Root container of 3D visualization */
	var _camera;                  /* 3D Camera for visualizing scene */
	var _renderer;                /* Draws scene/camera configuration to display */

	//------------------------------------------------------
	//  Private Display Properties
	//------------------------------------------------------

	var _node = $(selector);
	var _world = null;            /* container for all child frames */
	var _slides = [];             /* collection of 3D positioned frames within the _world */
	var _activeSlide = null;      /* selected frame to display fullscreen in camera view */
	var _nextSlide = null;        /* frame to set active upon transition */

	//------------------------------------------------------
	//  Initialization
	//------------------------------------------------------

	function _init() {
		
		_initializeParameters();
		_initScene();
		_initFrames();
		_animate();

	}

	function _initializeParameters(){
		_nextSlide = 0;
	}

	function _initScene(){
		_scene = new THREE.Scene();
		
		//TODO: Determine why camera position must be 1.1x focal length
		_camera = new THREE.PerspectiveCamera(
			_wtfFieldOfView(
				_frame.height, 
				_frame.focalLength,
				-_frame.focalLength*_contents.length+1,
				0),
			_frame.width/_frame.height
		);

		_camera.position.set(0,0,_frame.focalLength*1.1);
		
		_renderer = new CSS3DRenderer();
		_renderer.setSize( _frame.width, _frame.height );
		
		//TODO: Set this up with CSS
		_renderer.domElement.style.position = 'absolute';
		_renderer.domElement.style.top = 0;

		_node.append( $(_renderer.domElement) );
	}

	function _initFrames(){
		_createWorld();
		_createSlidesFromContent();
	}

	function _createWorld(){
		var $worldEl = $('<div></div>');
			$worldEl.css({width:_frame.width,height:_frame.height});

		_world = new THREE.CSS3DObject($worldEl[0]);
		_world.rotation.reorder("ZYX");
		_scene.add(_world);
	}

	function _createSlidesFromContent(){
		
		var count = _contents.length;

		$.each(_contents, function(index, content){

			var $slideEl, _slide, len;

			$slideEl = $(
				'<div>' +
					'<h2>'+content.title+'</h2>' +
					'<p>'+content.body+'</p>' +
				'</div>'
			).css({
				width:_frame.width-_frame.padding*2,
				height:_frame.height-_frame.padding*2,
				padding:_frame.padding,
				background:content.color
			});

			_slide = new THREE.CSS3DObject( $slideEl[0] );
			_slides.push(_slide);

			len = _frame.focalLength

			//apply random spacing and random rotation
			_slide.position.set(
				- len + Math.random() * len * 2,
				- len + Math.random() * len * 2,
				- len + Math.random() * count
			);

			_slide.rotation.set(
				Math.PI/2 - Math.random() * Math.PI,
				Math.PI/2 - Math.random() * Math.PI,
				Math.PI/2 - Math.random()
			);

			_world.add( _slide );

		}); 
	}

	//------------------------------------------------------
	//  Public Methods
	//------------------------------------------------------

	this.activateSlide = function(index){
		_nextSlide = index;
	}

	this.next = function(){
		this.activateSlide((_activeSlide < _slides.length-1) ? _activeSlide+1 : 0);
	}

	this.prev = function(){
		this.activateSlide((_activeSlide >= 0) ? _activeSlide-1 :  _slides.length-1);
	}


	//------------------------------------------------------
	//  Private Methods
	//------------------------------------------------------

	//WTF - What The Frustom is Field Of View
	function _wtfFieldOfView(frameH, distance){

		//https://github.com/mrdoob/three.js/issues/1239
		// vertical frustum field of view angle in radians = 2 * arctan(frame height / (2 * focal length))
		// multiply by 180/Math.PI for angle in degrees
		return 2 * Math.atan(frameH / ( 2 * distance )) * 180/Math.PI;

	}

	function _wtfWorldForSlide(index){

		var slideTarget = _slides[index];
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

	//------------------------------------------------------
	//  Display Methods
	//------------------------------------------------------

	function _animate() {

		requestAnimationFrame( _animate );
		_invalidateWorld();
		_renderer.render( _scene, _camera );
		
	}

	function _invalidateWorld(){

		if(null !== _nextSlide && _nextSlide !== _activeSlide){

			var target = _wtfWorldForSlide(_nextSlide);
			
			//snap to target position if distance remaining is less than .1 "mm"
			if(_world.position.distanceTo(target.position) <= .1){
				
				_world.position.set(
					target.position.x, 
					target.position.y, 
					target.position.z
				);

				_world.rotation.set(
					target.rotation.x, 
					target.rotation.y, 
					target.rotation.z
				);

				_activateComplete();

			}else{

				//advance world position toward position inverse to targeted slide
				_world.position.x -= (_world.position.x - target.position.x)/_frame.rate;
				_world.position.y -= (_world.position.y - target.position.y)/_frame.rate;
				_world.position.z -= (_world.position.z - target.position.z)/_frame.rate;
				
				//advance world "euler" rotation toward rotation inverse of targeted slide
				//apply rotation in reverse "ZYX" order to ensure 
				_world.rotation.z -= (_world.rotation.z - target.rotation.z)/_frame.rate;
				_world.rotation.y -= (_world.rotation.y - target.rotation.y)/_frame.rate;
				_world.rotation.x -= (_world.rotation.x - target.rotation.x)/_frame.rate;

			}

		}	

	}

	//------------------------------------------------------
	//  Events
	//------------------------------------------------------

	function _activateComplete(){
		_activeSlide = _nextSlide;
		_nextSlide = null;
	}

	//------------------------------------------------------
	//  Getters/Setters
	//------------------------------------------------------

	this.getActiveSlide = function(){
		return (activeSlide) ? activeSlide : _slides[0];
	}

	//------------------------------------------------------
	//  Actuation
	//------------------------------------------------------

	_init();
	_animate();

	};

	//----------------------------------------------------------
	// Public Static Vars
	//----------------------------------------------------------

	Scene.version = function() {
		return VERSION;
	}


	return Scene;
});