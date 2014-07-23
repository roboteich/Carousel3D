/**
* require config
*/

require.config({
  "baseUrl" : "./js",
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

require(["jquery", "components/slideshow3D"], function($, SlideShow3D) {

		/**
		* data
		*/

		var slideCount = 10;
		var slides = [];
		for(var i=0; i<slideCount; i++){
			slides.push(
				{
					title: "slide"+i,
					body:"lorem ipsum " + i +
					((i>0)?'<br /><a class="scene-link" href="#prev">prev</a>':'')+
					((i<slideCount-1)?'<br /><a class="scene-link" href="#next">next</a>':'<a class="scene-link" href="#next">restart</a>'),
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

		var slideshow = new SlideShow3D("#screens", slides);
		
		/**
		* Interaction
		*/
		$("#screens").on("click", ".scene-link", function(ev){
			switch($(this).attr("href")){
				case "#next":
					slideshow.next();
					break;
				case "#prev":
					slideshow.prev();
					break;
			}

			return false;
		});

		$(document).keypress(function(ev){
			switch(ev.which){
				//LEFT ARROW
				case 37:
					slideshow.next();
					break;
				//SPACEBAR
				case 32:
					slideshow.next();
					break;
				//RIGHT ARROW
				case 39:
					slideshow.prev();
					break;
			}

		});

		$(window).resize(function(ev){
			slideshow.set({width:window.innerWidth, height:window.innerHeight});
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
