const moveAudio = new Audio('sounds/Move.mp3');
const captureAudio = new Audio('sounds/Capture.mp3');
const confirmAudio = new Audio('sounds/Confirmation.mp3');
const startAudio = new Audio('sounds/Berserk.mp3');
const endAudio = new Audio('sounds/Error.mp3');
const gameOverAudio = new Audio('sounds/gameOver.wav');
const gameFinishAudio = new Audio('sounds/Victory.mp3');
const lowTimeAudio = new Audio('sounds/LowTime.mp3');

// do not pick up pieces if the game is over
// only pick up pieces for the side to move

var START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
var _engine, _curmoves = [];
var _history = [[START]], _history2 = null, _historyindex = 0;
var _flip = false, _edit = false, _info = false, _play = null;
var _arrow = false, _menu = false;
var _dragElement = null, _dragActive = false, _startX, _startY, _dragCtrl, _dragLMB, _clickFrom, _clickFromElem;
var _tooltipState = false, _wantUpdateInfo = true;;
var _wname = "White", _bname = "Black", _color = 0, _bodyScale = 1;
var _nncache = null;
var glb_source = "";
var glb_target = "";
var sdepth = 10;
var gamestart = 'w';
var board,
game = new Chess(),
  
  pgnEl = $('#pgn'),
  engineMove = $('#enginemove'),
  colorsEI = $('#col1');
  var SQUARES = {
           0:"a8",    1:"b8",    2:"c8",    3:"d8",    4:"e8",    5:"f8",    6:"g8",    7:"h8",
          16:"a7",   17:"b7",   18:"c7",   19:"d7",   20:"e7",   21:"f7",   22:"g7",   23:"h7",
          32:"a6",   33:"b6",   34:"c6",   35:"d6",   36:"e6",   37:"f6",   38:"g6",   39:"h6",
          48:"a5",   49:"b5",   50:"c5",   51:"d5",   52:"e5",   53:"f5",   54:"g5",   55:"h5",
          64:"a4",   65:"b4",   66:"c4",   67:"d4",   68:"e4",   69:"f4",   70:"g4",   71:"h4",
          80:"a3",   81:"b3",   82:"c3",   83:"d3",   84:"e3",   85:"f3",   86:"g3",   87:"h3",
          96:"a2",   97:"b2",   98:"c2",   99:"d2",  100:"e2",  101:"f2",  102:"g2",  103:"h2",
         112:"a1",  113:"b1",  114:"c1",  115:"d1",  116:"e1",  117:"f1",  118:"g1",  119:"h1"
    };
	var PIECES = {
		r: "Black Rook",
		n: "Black Knight",
		b: "Black Bishop",
		q: "Black Queen",
		k: "Black King",
		p: "Black Pawn",
		R: "White Rook",
		N: "White Knight",
		B: "White Bishop",
		Q: "White Queen",
		K: "White King",
		P: "White Pawn"
	};
  var elem = document.getElementById('col1');
var text_move_map = new Map(
	[
		["N","knight"],
		["B","bishop"],
		["Q","queen"],
		["K","king"],
		["R","rook"],
		["x","takes"],
		["O-O","king side castle"],
		["O-O-O","longcastle"],
		["#","checkmate"]
	]
);
var getMove = function () {
	makeBestMove()
};
  

var makeBestMove = function () {
    if (game.game_over()) {
        alert('Game over');
    }

    positionCount = 0;
    
	makeEngineMove(1)
    
	updateStatus();
    
    if (game.game_over()) {
        alert('Game over');
    }
};
// update the board position after the piece snap 
// for castling, en passant, pawn promotion

var updateStatus = function() {
  var status = '';

  var moveColor = 'White';
  if (game.turn() === 'b') {
    moveColor = 'Black';
  }

  // checkmate?
  if (game.in_checkmate() === true) {
    status = 'Game over, ' + moveColor + ' is in checkmate.';
	gameOverAudio.play()
  }

  // draw?
  else if (game.in_draw() === true) {
    status = 'Game over, drawn position';
	gameOverAudio.play()
  }

  // game still on
  else {
    status = moveColor + ' to move';

    // check?
    if (game.in_check() === true) {
      status += ', ' + moveColor + ' is in check';
	  gameOverAudio.play()
    }
  }

  

};
function is_digit(c) {
        return '0123456789'.indexOf(c) !== -1;
    }
function load(fen) {
        var tokens = fen.split(/\s+/);
        var position = tokens[0];
        var square = 0;

        for (var i = 0; i < position.length; i++) {
            var piece = position.charAt(i);
			if (piece === '/') {
                square += 8;
            } else if (is_digit(piece)) {
                //square += parseInt(piece, 10);
				for (var j = 0; j < parseInt(piece, 10); j++) {
					//alert(gamestart + SQUARES[square])
					var e = document.getElementById(gamestart + SQUARES[square]);
					e.innerHTML = SQUARES[square]
					//console.log(SQUARES[square])
					square++;
				}
            } else {
				
                //alert(gamestart + SQUARES[square] + square)
				var e = document.getElementById(gamestart + SQUARES[square]);
				e.innerHTML = SQUARES[square] + " " + PIECES[piece]
				//console.log(SQUARES[square] + " " + PIECES[piece])
                square++;
            }
        }
		return true
        
    }
var Undo = function() {
	game.undo()
	game.undo()
    load(game.fen())
}
function ButtonSingleClick (buttonobj) {
	
	
	if (glb_source == "") {
		
		glb_source = buttonobj.id.substring(1);
	} else if(glb_source != "" && glb_target == "") {
		glb_target = buttonobj.id.substring(1);
		
		makehumanmove(glb_source,glb_target)
	} else {
		
		glb_source = buttonobj.id.substring(1);
		glb_target = ""
	}
}
function updateBoard(source, target) {
	
	var e = document.getElementById(gamestart + source);
	
	var pclst = e.innerHTML.split(" ");
	var pc = pclst[pclst.length - 2] + " " + pclst[pclst.length - 1];
	var newtxt1 = pclst[0]
	e.innerHTML = newtxt1
	
	var e = document.getElementById(gamestart + target);
	
	var pclst1 = e.innerHTML.split(" ");
	
	var newtxt1 = pclst1[0] + " " + pc
	e.innerHTML = newtxt1
}
function makehumanmove(source, target) {
  // see if the move is legal
  
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) {
	  //alert("illegal move!")
	  engineMove.html("illegal move!")
	  glb_source = ""
	  glb_target = ""
	  return 'snapback';
  }

  updateBoard(source,target);
  if (move.captured) captureAudio.play()
			else moveAudio.play()
	makeBestMove()
	pgnEl.html("PGN: " + game.pgn());
    //window.setTimeout(makeBestMove, 250);
};
function loadEngine() {
  var engine = {ready: false, kill: false, waiting: true, depth: sdepth, lastnodes: 0};
  var wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
  if (typeof(Worker) === "undefined") return engine;
  var workerData = new Blob([atob(wasmSupported ? sfWasm : sf)], { type: "text/javascript" });
  try { var worker = new Worker(window.URL.createObjectURL(workerData )); }
  catch(err) { return engine; }
  worker.onmessage = function (e) { if (engine.messagefunc) engine.messagefunc(e.data); }
  engine.send = function send(cmd, message) {
    cmd = String(cmd).trim();
    engine.messagefunc = message;
    worker.postMessage(cmd);
  };
  engine.eval = function eval(fen, done, info) {
    engine.send("position fen " + fen);
    engine.send("go depth "+ engine.depth, function message(str) {
      var matches = str.match(/depth (\d+) .*score (cp|mate) ([-\d]+) .*nodes (\d+) .*pv (.+)/);
      if (!matches) matches = str.match(/depth (\d+) .*score (cp|mate) ([-\d]+).*/);
      if (matches) {
        if (engine.lastnodes == 0) engine.fen = fen;
        if (matches.length > 4) {
          var nodes = Number(matches[4]);
          if (nodes < engine.lastnodes) engine.fen = fen;
          engine.lastnodes = nodes;
        }
        var depth = Number(matches[1]);
        var type = matches[2];
        var score = Number(matches[3]);
        if (type == "mate") score = (1000000 - Math.abs(score)) * (score <= 0 ? -1 : 1);
        engine.score = score;
        if (matches.length > 5) {
          var pv = matches[5].split(" ");
          if (info != null && engine.fen == fen) info(depth, score, pv);
        }
      }
      if (str.indexOf("bestmove") >= 0 || str.indexOf("mate 0") >= 0 || str == "info depth 0 score cp 0") {
        if (engine.fen == fen) done(str);
        engine.lastnodes = 0;
      }
    });
  };
  engine.send("uci", function onuci(str) {
    if (str === "uciok") {
      engine.send("isready", function onready(str) {
        if (str === "readyok") engine.ready = true;
      });
    }
  });
  return engine;
}
function changeLevel() {
	newGame()
	startAudio.play();
	if (this.options[this.selectedIndex].value > 4) {

		alert("Above level 4, things will get real slow on phones or low powered devices!")
	}
}

function changeBoard() {
	newGame()
	startAudio.play();
	if (this.options[this.selectedIndex].value == 'black') {
		
		//alert("Currently board orientation will still be from white side")
		gamestart = 'b'
		var b = document.getElementById("myboard_black");
		b.style.display = "block"
		var c = document.getElementById("myboard_white");
		c.style.display = "none"
		getMove()
		
	} else {
		gamestart = 'w'
		var b = document.getElementById("myboard_white");
		b.style.display = "block"
		var c = document.getElementById("myboard_black");
		c.style.display = "none"
	}
}
var newGame = function() {
	
    //game.reset();
    
    updateStatus();
}
/*-----------------------------
      Speech Synthesis 
------------------------------*/

function readOutLoud(message) {
	var speech = new SpeechSynthesisUtterance();

  // Set the text and voice attributes.
	speech.text = message;
	speech.volume = 1;
	speech.rate = 1;
	speech.pitch = 1;
  
	window.speechSynthesis.speak(speech);
}
function makeEngineMove (makeMove) {
	_engine.kill = false;
	_engine.waiting = false;
	_engine.send("stop");
	_engine.send("ucinewgame");
	var e = document.getElementById("sel1");
	var level = e.options[e.selectedIndex].value;
	_engine.send("setoption name Skill Level value " + level); 
	_engine.score = null;
	_engine.eval(game.fen(), function done(str) {
	  _engine.waiting = true;
	  
	  var matches = str.match(/^bestmove\s(\S+)(?:\sponder\s(\S+))?/);
	  if (matches && matches.length > 1) {
		var source  = matches[1][0] + matches[1][1] 
		var target  = matches[1][2] + matches[1][3]  
		
		if(makeMove == 1) {
			var move = game.move({
			from: source,
			to: target,
			promotion: 'q' // NOTE: always promote to a queen for example simplicity
		  })

		  // illegal move
		  if (move === null) return 'snapback'
		  updateBoard(source,target)
		  
		  var pgn = game.pgn().split(" ");
	
			var move = pgn[pgn.length - 1];
			var engmove = ""
			for (var i = 0; i < move.length; i++) {
				txt = text_move_map.get(move[i])
				if (txt == null) {
					txt = move[i]
				}
				//readOutLoud(txt);
				//alert(txt)
				engmove = engmove + " " + txt 
			}
			engineMove.html(engmove)
		  if (move.captured) captureAudio.play()
			else moveAudio.play()
		  pgnEl.html("PGN: " + game.pgn());
		  updateStatus()
		  //console.log(getStaticEvalList(game.fen()))
		}
		
	  }
	},function info(depth, score, pv) {
        if(depth == sdepth) {
			console.log(score)
			//document.getElementById("cpscore").innerHTML = " CP score: " + score/100;
		}
      });
	
	
}

_engine = loadEngine();
newGame()

