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
	var _invalidated = true;      /* properties changed, reconcile on next frame */
	var _contents = contents;     /* HTMl content to render as frames */
	var _frame = {
			width:window.innerWidth,
			height:window.innerHeight,
			padding:20,
			focalLength:2000,
			rate:1                /* pixels per millesecond */
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
	var _transition = null;       /* tween animation between slides */

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
				_frame.focalLength
				),
			_frame.width/_frame.height
		);

		_camera.position.set(0,0,_frame.focalLength*1.25);
		
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
				width:_frame.width,
				height:_frame.height,
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
		console.log("activateSlide :: " + _nextSlide);
	}

	this.next = function(){
		console.log("next");
		this.activateSlide((_activeSlide < _slides.length-1) ? _activeSlide+1 : 0);
		_invalidate();
	}

	this.prev = function(){
		this.activateSlide((_activeSlide >= 0) ? _activeSlide-1 :  _slides.length-1);
		_invalidate();
	}


	//------------------------------------------------------
	//  Private Methods
	//------------------------------------------------------

	//WTF - What's The Frustom Field Of View
	function _wtfFieldOfView(frameH, distance){

		//https://github.com/mrdoob/three.js/issues/1239
		// vertical frustum field of view angle in radians = 2 * arctan(frame height / (2 * focal length))
		// multiply by 180/Math.PI for angle in degrees
		return 2 * Math.atan(frameH / ( 2 * distance )) * 180/Math.PI;

	}

	//WTF - What's The Frustom World For this Slide
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

	//WTF - What's the Frustom Spline curve between these two points
	function _wtfSplineForPoints(from, to){

		var a = from; //start point
		var c = to;   //end point
		var b = new THREE.LineCurve3(from, to);  //mid point

		return b;

	}

	//------------------------------------------------------
	//  Display Methods
	//------------------------------------------------------

	function _invalidate() {
		_invalidated = true;
	}

	function _animate(time) {

		requestAnimationFrame( _animate );
		_update(time);
		_renderer.render( _scene, _camera );
		
	}

	function _update(time){

		if(_invalidated){

			TWEEN.removeAll();

			var from = {position:_world.position.clone(), rotation:_world.rotation.clone()};
			var to = _wtfWorldForSlide(_nextSlide);
			var path = _wtfSplineForPoints(from.position, to.position);
			var rotations = [(from.rotation.z - to.rotation.z), (from.rotation.y - to.rotation.y) , (from.rotation.x - to.rotation.x)];
			var duration = Math.round(path.getLength()*_frame.rate);
			
			_transition = new TWEEN.Tween({progress:0})
			.to(
				{progress:1},
				duration
			)
			.onUpdate(function(){

					//advance world position toward position inverse to targeted slide along path
					_world.position.copy(path.getPoint(this.progress));
						
					//advance world "euler" rotation toward rotation inverse of targeted slide
					//apply rotation in reverse "ZYX" order to ensure 
					_world.rotation.z = from.rotation.z - rotations[0] * this.progress;
					_world.rotation.y = from.rotation.y - rotations[1] * this.progress;
					_world.rotation.x = from.rotation.x - rotations[2] * this.progress;

					
					_camera.position.z = _frame.focalLength*1.25 + (_frame.focalLength * 4 * Math.sin(this.progress*Math.PI));

			})
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onComplete(function(){
				_activateComplete();
				_transition = null;
			})
			.start();

		}


		if(_transition && time) _transition.update(time);	
		_invalidated = false;

	}

	//------------------------------------------------------
	//  Events
	//------------------------------------------------------

	function _activateComplete(){
		_activeSlide = _nextSlide;
		_nextSlide = null;
		console.log("_activateComplete :: " + _activeSlide);
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