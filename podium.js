/**
 *	Podium 2D Game Engine with HTML5 Canvas
 *	by Adam Passey.
 */

//	The GameStates Enumerated Type
var MainGameState = {
	GameStatePause			:	0,
	GameStatePlay			:	1,
	GameStateFlowControl	:	2,
	GameStateMenu			:	3,
	GameStateLoad			:	4
};

//	The GameDebug Modes
var MainGameMode = {
	GameModeRelease			:	0,
	GameModeDebug			:	1,
	GameModeAwesome			:	2	//	reserved for future use...!
};

//	The current mouse status
var MouseStatus = {
	MouseStatusUp			:	0,
	MouseStatusDown			:	1
};

//	the depth of the rendered objects
var RenderDepth = {
	RenderDepthForeground	:	0,
	RenderDepthMiddleground	:	1,
	RenderDepthBackground	:	2
};

//	The Game class
function MainGame( Canvas, GameMode, Stages ) {

	//	we're currently loading
	this.State = MainGameState.GameStateLoad;
	
	//	set the game mode
	this.Mode = GameMode;
	
	//	set the canvas, and get the context to draw to
	this.Canvas = Canvas;
	this.Context = Canvas.getContext( '2d' );
	
	//	create the renderer
	this.Renderer = new Renderer();
	
	//	create a UIEventHandler
	//	pass it the canvas to listen to, and the
	//	observer (this for now)
	this.UIEventHandler = new UIEventHandler( this, Canvas );
	
	//	a collection of stages
	this.Stages = Stages;
	
	//	the beginning stage should be 0
	this.StageIndex = 0;
	
	//	<private> our update loop speed
	var MainGameCycles = 25;
	
	//	start the main game loop using the MainGameInterval 
	this.MainGameInterval;
	this.StartMainGameLoop( MainGameCycles );
	
	//	will need to add a loader here based on the stage
	//	not sure how this will work yet
	
	//	start the first stage
	this.GoToStage(this.StageIndex);

};

//	Prototyping the MainGame class
MainGame.prototype = {
	
	//	the main game loop
	MainGameLoop : function() {
		
		//	if we're in debug mode, calculate fps, etc.
		if( this.Mode == MainGameMode.GameModeDebug ) {		
		
			//	determine the FPS
			if( !this.LastMicroTime ) {
				this.LastMicroTime = MicroTime.Get();
				return;
			}
			
			var NewMicroTime = MicroTime.Get();
			this.FPS = MicroTime.CalculateFPS( this.LastMicroTime, NewMicroTime );
			
			this.LastMicroTime = NewMicroTime;
		}
		
		//	render the game -> passing fps is just temporary
		//	until the Renderer has been finalized
		//	I'd like to eventually pass the stage...?
		//	or a series of objects that are within the
		//	canvas render view
		this.Renderer.RenderFrame( this.Mode, this.Canvas, this.Context, this.Stages[this.StageIndex], this.FPS );
	},
	
	//	Start the Main Game Loop
	StartMainGameLoop : function( RefreshRate ) {
		console.log( 'Initiating the main game loop.' );
		var self = this;
		this.MainGameInterval = setInterval( function() { self.MainGameLoop(); }, RefreshRate );
	},
	
	//	set the stages on the fly
	SetStages : function( StagesArray ) {
		this.Stages = StagesArray;
	},
	
	//	go to a certain stage
	GoToStage : function( StageIndex ) {
		//	I'll need to load a map, etc.
		//	but for now, the stage will
		//	just intercept the UI events
		this.UIEventHandler.SetObserver( this.Stages[StageIndex] );
	},
	
	//	go to the next stage
	NextStage : function() {
		this.Stages ++;
		this.GoToStage( this.Stages );
	}
};

//	The UIEventHandler Class
function UIEventHandler( Observer, Canvas ) {
		
	//	shortcut to this object
	var self = this;
	
	//	the one receiving event notifications
	this.Observer = Observer;
	
	//	the current mouse position
	this.Point = new Point( null, null );
	
	//	the time since the mouse was clicked down
	//	and only set if it has not been released
	this.MouseDownTimer;
	
	//	the interval to continually send the observer
	//	the mouse held down event
	this.MouseDownInterval;
	
	//	the mouse status
	this.MouseStatus = MouseStatus.MouseStatusUp;
	
	//	get the current Point based on canvas offset
	var GetCanvasPoint = function( x, y ) {
		var CanvasPosition = new Point( Canvas.offsetLeft, Canvas.offsetTop );
		var ModifiedPoint = new Point( event.clientX - CanvasPosition.X(), event.clientY - CanvasPosition.Y() );
		return ModifiedPoint;
	};
	
	//	the event handlers
	this.OnMouseDownEvent = function( event ) {
		console.log( 'UIEventHandler OnMouseDownEvent: ' + event.clientX + 'x, ' + event.clientY + 'y' );
		
		this.MouseStatus = MouseStatus.MouseStatusDown;
		this.MouseDownTimer = MicroTime.Get();
		
		this.MouseDownInterval = setInterval( function() { self.OnMouseHeldDownEvent(); }, 500 );
		
		var ModifiedPoint = GetCanvasPoint( event.clientX, event.clientY );
		
		if( self.Observer.OnMouseDownEvent )
			self.Observer.OnMouseDownEvent( ModifiedPoint );
	};
	
	this.OnMouseHeldDownEvent = function() {
		
		if( self.Observer.OnMouseHeldDownEvent )
			self.Observer.OnMouseHeldDownEvent();
	};
	
	this.OnMouseUpEvent = function( event ) {
		console.log( 'UIEventHandler OnMouseUpEvent: ' + event.clientX + 'x, ' + event.clientY + 'y' );	
		
		this.MouseStatus = MouseStatus.MouseStatusUp;
		
		this.MouseDownInterval = clearInterval( this.MouseDownInterval );
		
		var ModifiedPoint = GetCanvasPoint( event );
		
		if( self.Observer.OnMouseUpEvent )
			self.Observer.OnMouseUpEvent( ModifiedPoint );
	};
	
	this.OnMouseMoveEvent = function( event ) {
		console.log( 'UIEventHandler OnMouseMoveEvent: ' + event.clientX + 'x, ' + event.clientY + 'y' );
		
		var ModifiedPoint = GetCanvasPoint( event );
		
		if( self.Observer.OnMouseMoveEvent )
			self.Observer.OnMouseMoveEvent( ModifiedPoint );
	};
	
	this.OnKeyPressEvent = function( event ) {
		console.log( 'UIEventHandler OnKeyPressEvent: ' + event.keyCode );
		
		if( self.Observer.OnKeyPressEvent )
			self.Observer.OnKeyPressEvent( event );
	};
	
	this.OnWindowDidResizeEvent = function( event ) {
		console.log( 'UIEventHandler OnWindowDidResizeEvent: ' + event );
		
		if( self.Observer.OnWindowDidResizeEvent )
			self.Observer.OnWindowDidResizeEvent( event );
	};
	
	//	this has not been tested -
	//	may not be able to use a closure like this.
	this.UpdateMousePosition = function( x, y ) {
		
		this.Point.Set( { x : x, y : y } );
	};
	
	//	mouse events
	Canvas.addEventListener( 'mousedown', this.OnMouseDownEvent, false );
	Canvas.addEventListener( 'mouseup', this.OnMouseUpEvent, false );
	Canvas.addEventListener( 'mousemove', this.OnMouseMoveEvent, false );
	
	//	key events
	addEventListener( 'keydown', this.OnKeyPressEvent, false );
	addEventListener( 'resize', this.OnWindowDidResizeEvent, false );
	
	//	set the Object that will receive UI events
	this.SetObserver = function( Observer ) {
		this.Observer = Observer;
	};
	
};

//	The Renderer Class
function Renderer() {
	
};

Renderer.prototype = {
	
	RenderFrame : function( RenderMode, Canvas, Context, Stage, FPS ) {
	
		//	first, wipe the canvas
		//	may need to implement a way to 
		//	stop the wiping of the canvas
		Canvas.setAttribute( 'width', Canvas.width );
		
		//	if we're in debug mode, let's draw the 
		//	fps, etc. at the top left of hte screen
		if( RenderMode == MainGameMode.GameModeDebug ) {
			
			Context.fillText( 'FPS:' + FPS, 10, 15 );
		}
		
		//	render the stage
		Stage.Draw( Context );
	}
};

//	The Stage Class
function Stage() {

	//	this declares the three different sections that
	//	are 'renderable' allowing depth! yay!
	this.Drawable = [];
	//this.Drawable[RenderDepth.RenderDepthBackground] = [];
	//this.Drawable[RenderDepth.RenderDepthMiddleground] = [];
	//this.Drawable[RenderDepth.RenderDepthForeground] = [];
	
	this.MousePosition = new Point(0, 0);
	
	//	This will render the stage
	//	drawing all objects in the 'Drawable' array
	this.Draw = function( Context ) {
		for( i = 0; i < this.Drawable.length; i ++ ) {
			this.Drawable[i].Draw( Context );
		}
	};
	
	this.OnMouseDownEvent = function( Point ) {
		console.log( 'Stage received OnMouseDownEvent message.' );
	};
	
	this.OnMouseHeldDownEvent = function() {
		console.log( 'Stage received OnMouseHeldDownEvent message.' );
	};
	
	this.OnMouseMoveEvent = function( MovePoint ) {
		this.MousePosition = MovePoint;
	};
};

//	A time utility (to help determine fps)
//	staticly accessible
var MicroTime = {
	Get 	:	function() {
		//	found this code here:
		//	http://www.navioo.com/javascript/tutorials/Javascript_microtime_1583.html
		var now = new Date().getTime() / 1000;
		var s = parseInt( now );
		
		return Math.round( (now-s) * 1000) / 1000;
	},
	CalculateFPS :	function( MicrotimeOne, MicrotimeTwo ) {
		return Math.round( 1000 / Math.round((MicrotimeTwo - MicrotimeOne) * 1000) );
	}
};

//	Point class
function Point( x, y ) {
	this.x = x;
	this.y = y;
	
	this.SetX = function( x ) { this.x = x; }
	this.SetY = function( y ) { this.y = y; }
	
	this.X = function() { return this.x; }
	this.Y = function() { return this.y; }
	
	this.Set = function( ClosurePoint ) {
		this.x = ClosurePoint.x;
		this.y = ClosurePoint.y;
	}
};

/** 
 * END OF GAME ENGINE 
 */

//	stage definitions
function Opening() {
	Stage.call( this );
	
	this.OnMouseDownEvent = function( OriginPoint ) {
		
		for( i = 0; i < 5; i ++ ) {
			var ParticlePoint = new Point( OriginPoint.X(), OriginPoint.Y() );
			var Particle = new RandomParticle( ParticlePoint );
			this.Drawable[this.Drawable.length] = Particle;
		}
		
	};
	
	this.OnMouseHeldDownEvent = function() {
		
		for( i = 0; i < 100; i ++ ) {
			var ParticlePoint = new Point( this.MousePosition.X(), this.MousePosition.Y() );
			var Particle = new RandomParticle( ParticlePoint );
			this.Drawable[this.Drawable.length] = Particle;
		}
	};
};

Opening.prototype = new Stage;
Opening.prototype.constructor = Opening;

//	particle effect (for testing)
function RandomParticle( Point, Name ) {

	var Radius = Math.floor( Math.random() * 10 ) + 10;
	var Direction = Math.floor( Math.random() * 359 ) + 1;
	var Size = Math.floor( Math.random() * 100 ) + 50;
	var Speed = Math.floor( Math.random() * 25 ) + 1;
	var Alpha = Math.floor( Math.random() ) * 100;
	var ParticleColor = "rgb(" + Math.floor(Math.random(0, 255)*100) + "," + Math.floor(Math.random(0, 255)*100) + "," + Math.floor(Math.random(0, 255)*100) + ")";
	var Position = Point;
	
	this.Draw = function( Context ) {
		
		//	move it
		Position.SetX( Position.X() + ( Math.sin( Direction ) * Speed ) );
		Position.SetY( Position.Y() + ( Math.cos( Direction ) * Speed ) );
		
		//	draw it
		var Gradient = Context.createRadialGradient( Position.X(), Position.Y(), 0, Position.X(), Position.Y(), Radius );
		Gradient.addColorStop( 0, ParticleColor );
		Gradient.addColorStop( 1, 'rgba(255,255,255,0)' );
		Context.fillStyle = Gradient;
		Context.fillRect( Position.X() - Radius, Position.Y() - Radius, Radius * 2, Radius * 2);
		
	};
	
};

//	the jQuery triggered onLoad
$(document).ready(function() {
	
	//	get the canvas
	var Canvas = document.getElementById( 'canvas' );
	
	//	create the stages
	var Stages = [];
	Stages[0] = new Opening();
	
	//	pass the canvas to the MainGame constructor
	var Game = new MainGame( Canvas, MainGameMode.GameModeDebug, Stages );
	
});