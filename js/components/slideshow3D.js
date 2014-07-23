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

	var VERSION = 0.3;

	//-------------------------------------------------------
	//  NameSpace
	//-------------------------------------------------------

	var SlideShow3D = function(selector, contents, options){

	//------------------------------------------------------
	//  Private Parameters
	//------------------------------------------------------
	
	var _self = this;             /* reference to instance for clear scoping in callbacks and events */
	
	var _contents = contents;     /* HTMl content to render as frames */
	
	var _frame = {
			width:window.innerWidth,
			height:window.innerHeight,
			focalLength:700,
			zooming:4,
			rate:.5                /* pixels per millesecond */
		}


	//------------------------------------------------------
	//  3D Rendering Components
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
		_initSlides();
		_resize();
		_slide();
		_update();

	}

	function _initializeParameters(){
		_frame = $.extend(_frame, options);
		_nextSlide = 0;
	}

	function _initScene(){
		
		_scene = new THREE.Scene();
		_renderer = new CSS3DRenderer();
		_camera = new THREE.PerspectiveCamera(
			_wtfFieldOfView(), 
			_frame.width/_frame.height
		);

		_node.append( $(_renderer.domElement) );
	}

	function _initSlides(){
		_createWorld();
		_createSlidesFromContent();
	}

	function _createWorld(){

		var $worldEl = $('<div class="world"></div>');
			$worldEl.css({width:_frame.width,height:_frame.height});

		_world = new THREE.CSS3DObject($worldEl[0]);
		
		//This reorder is very important
		//The application of rotation to the world
		//Occurs in reverse of the child elements
		//to face it to the screen
		//It's like undoing a rubiks cube
		_world.rotation.reorder("ZYX");
		_scene.add(_world);

	}

	function _createSlidesFromContent(){
		
		var count = _contents.length;
		var len = _frame.focalLength
		var radius = new THREE.Vector3(len, len, len);

		$.each(_contents, function(index, content){

			var $slideEl, slide;

			$slideEl = $(
				'<div id="slide-'+index+'" class="slide">' +
					'<h2>'+content.title+'</h2>' +
					'<p>'+content.body+'</p>' +
				'</div>'
			).css({
				width:_frame.width,
				height:_frame.height,
				background:content.color
			});

			slide = new THREE.CSS3DObject( $slideEl[0] );
			
			//place slide at 1x -> 2x 
			//focal distance from world center
			slide.position.copy(radius);
			slide.position.multiplyScalar(1+Math.random());
			
			//randomize slide position at
			//radius from world center
			slide.position.applyEuler(
				new THREE.Euler(
					Math.random()*Math.PI*2,
					Math.random()*Math.PI*2,
					Math.random()*Math.PI*2
				)
			);

			//maximize distance between rotations
			//add some random variation
			slide.rotation.set(
				Math.PI*(index%3) - Math.PI/3 + (Math.random() * Math.PI * 2/3),
				Math.PI*(index%3) - Math.PI/3 + (Math.random() * Math.PI * 2/3),
				Math.PI*(index%3) - Math.PI/3 + (Math.random() * Math.PI * 2/3)
			);

			_slides.push(slide);
			_world.add(slide);

		}); 
	}

	//------------------------------------------------------
	//  Public Methods
	//------------------------------------------------------

	this.activateSlide = function(index){
		_nextSlide = index;
		_slide();
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

	//WTF - What's The Frustom Field Of View
	function _wtfFieldOfView(){

		//https://github.com/mrdoob/three.js/issues/1239
		// vertical frustum field of view angle in radians = 2 * arctan(frame height / (2 * focal length))
		// multiply by 180/Math.PI for angle in degrees
		return 2 * Math.atan(_frame.height / ( 2 * _frame.focalLength )) * 180/Math.PI;

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

		var segment = new THREE.Line3(from, to);
		var center = segment.center();
		center.z-=(_frame.focalLength*_frame.zooming);

		return new THREE.SplineCurve3([from, center, to]);

	}

	//------------------------------------------------------
	//  Display Methods
	//------------------------------------------------------

	function _update(time) {
		requestAnimationFrame( _update );
		if(time && _transition) _transition.update(time);
		_renderer.render(_scene, _camera);
	}

	function _resize(){
		_renderer.setSize(_frame.width, _frame.height);
		_camera.setLens(_frame.focalLength, _frame.height);
		_camera.position.set(0,0,_frame.focalLength);
		$(".scene-slide, .scene-world").css({width:_frame.width,height:_frame.height});
	}

	function _slide(){

		TWEEN.removeAll();

		var from = {position:_world.position.clone(), rotation:_world.rotation.clone()};
		var to = _wtfWorldForSlide(_nextSlide);
		var path = _wtfSplineForPoints(from.position, to.position);
		var duration = Math.round(path.getLength()*_frame.rate);
		
		var rotations = [
			(from.rotation.z - to.rotation.z), 
			(from.rotation.y - to.rotation.y), 
			(from.rotation.x - to.rotation.x)
		];
		
		_transition = new TWEEN.Tween({progress:0})
		
		.to({progress:1},duration)
		.easing(TWEEN.Easing.Sinusoidal.InOut)
		.onStart(function(){_node.find(".slide").show();})
		.onUpdate(function(){

			if(this.progress) {
				
				//advance world position toward position 
				//inverse to targeted slide along path
				_world.position.copy(path.getPoint(this.progress));
					
				//advance world "euler" rotation toward 
				//rotation inverse of targeted slide apply 
				//rotation in reverse "ZYX" order to ensure 
				_world.rotation.set(
					(from.rotation.x - rotations[2] * this.progress),
					(from.rotation.y - rotations[1] * this.progress),
					(from.rotation.z - rotations[0] * this.progress)
				)
				
				_camera.setLens(_frame.focalLength - (_frame.focalLength*.75 * Math.sin(this.progress*Math.PI)), _frame.height);
			}

		})
		.onComplete(function(){
			_node.find(".slide").not("#slide-"+_nextSlide).hide();
			_activateComplete();
			_transition = null;
		})
		.start();

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

	this.set = function(options){

		_frame = $.extend(_frame, options);
		_resize();

	}

	//------------------------------------------------------
	//  Actuation
	//------------------------------------------------------

	_init();

	};

	//----------------------------------------------------------
	// Public Static Vars
	//----------------------------------------------------------

	SlideShow3D.version = function() {
		return VERSION;
	}


	return SlideShow3D;
});