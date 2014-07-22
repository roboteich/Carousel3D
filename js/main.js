/**
* require config
*/

require.config({
  "baseUrl" : "/js",
  "paths"   : {
    "jquery" : "//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min",
    "three" : "vendor/threejs/three.min",
    "three-css3d" : "vendor/threejs/CSS3DRenderer",
    "tween" : "vendor/tween.min"
  },
  "shim" : {
    "jquery" : {
      "exports" : "$"
    },
    "three" : {
    	"exports" : "THREE"
    },
    "three-css3d" : {
    	"deps": ["three"],
    	"exports" : "THREE.CSS3DRenderer"
    },
    "tween" : {
    	"exports" : "TWEEN"
    }
  }
});

require(["jquery", "scene"], function($, Scene) {


		/**
		* data
		*/

		var slideCount = 10;
		var slides = [];
		for(var i=0; i<slideCount; i++){
			slides.push(
				{
					title: "slide"+i,
					body:"lorem ipsum " + i,
					color:"rgba("+
						Math.round(Math.random()*255)+","
						+Math.round(Math.random()*255)+","
						+Math.round(Math.random()*255)+","
					+175+")"
				}
			);
		}

		/**
		* 3D 
		*/

		var scene = new Scene("#screens", slides);
		
		/**
		* Interaction
		*/

		$(document).keypress(function(ev){
			switch(ev.which){
				//LEFT ARROW
				case 37:
					scene.next();
					break;
				//SPACEBAR
				case 32:
					scene.next();
					break;
				//RIGHT ARROW
				case 39:
					scene.prev();
					break;
			}

		});

		/**
		* logic
		* -- Screen State
		* -- Content Load
		* -- Address State
		*/

		/**
		* actions
		* -- window load
		* -- window resize
		* -- content load
		* -- content render
		* -- menu open
		* -- menu collapse
		* -- menu click
		* -- keystroke
		* -- address change
		* -- screen advance
		* -- panel advance
		*/

});
