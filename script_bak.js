var START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
var _engine, _curmoves = [];
var _history = [[START]], _history2 = null, _historyindex = 0;
var _flip = false, _edit = false, _info = false, _play = null;
var _arrow = false, _menu = false;
var _dragElement = null, _dragActive = false, _startX, _startY, _dragCtrl, _dragLMB, _clickFrom, _clickFromElem;
var _tooltipState = false, _wantUpdateInfo = true;;
var _wname = "White", _bname = "Black", _color = 0, _bodyScale = 1;
var _nncache = null;
var moveAN = ""
const moveAudio = new Audio('sounds/Move.mp3');
var board,
  game = new Chess(),
  statusEl = $('#status'),
  
  sfmove = $('#sfmove'),
  //fenEl = $('#fen'),
  pgnEl = $('#pgn'),
  toggleEI = $('#toggle'),
  sdepth = 10
  colorsEI = $('#col1');
 
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

function Undo() {
		game.undo();
		game.undo();
		updateStatus();
	}
 function MakeMove() {
	var m = document.getElementById("move");
	var ret = game.move(m.value)
	//console.log(ret)
	if (ret === null) {
		alert("Illegal move!");
		ClearMove()
		return
	}
	updateStatus();
	moveAudio.play()
	//getResponseMove();
	getMove()
	ClearMove()
	moveAudio.play()
	
	//console.log(m.value)
 }
function changeLevel() {
		newGame()
		if (this.options[this.selectedIndex].value > 4) {

			alert("Above high difficulty, things will get real slow on phones or low powered devices!")
		}
		var x = document.getElementById("col1");
		if (x.options[x.selectedIndex].value == 'black') {

			getMove()
		}
	}
function changeBoard() {
		newGame()
		if (this.options[this.selectedIndex].value == 'black') {

			getMove()
		}
	}

var getMove = function () {
	makeBestMove()
    //window.setTimeout(makeBestMove, 250);
};
var onDragStart = function(source, piece, position, orientation) {
  if (game.game_over() === true ||
      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
};

var onDrop = function(source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) return 'snapback';

  updateStatus();
	makeBestMove()
    //window.setTimeout(makeBestMove, 250);
};

var makeBestMove = function () {
    if (game.game_over()) {
        alert('Game over');
    }

    positionCount = 0;
   
	makeEngineMove(1)
    //board.position(game.fen());
	//updateStatus();
	console.log(game.pgn())
    var pgn = game.pgn().split(" ");
	
    var move = pgn[pgn.length - 1];
	
	for (var i = 0; i < move.length; i++) {
		txt = text_move_map.get(move[i])
		if (txt == null) {
			txt = move[i]
		}
		//readOutLoud(txt);
		alert(txt)
	}
    if (game.game_over()) {
        alert('Game over');
    }
};



// update the board position after the piece snap
// for castling, en passant, pawn promotion
var onSnapEnd = function() {
    //board.position(game.fen());
};

var updateStatus = function() {
  var status = '';

  var moveColor = 'White';
  if (game.turn() === 'b') {
    moveColor = 'Black';
  }

  // checkmate?
  if (game.in_checkmate() === true) {
    status = 'Game over, ' + moveColor + ' is in checkmate.';
  }

  // draw?
  else if (game.in_draw() === true) {
    status = 'Game over, drawn position';
  }

  // game still on
  else {
    status = moveColor + ' to move';

    // check?
    if (game.in_check() === true) {
      status += ', ' + moveColor + ' is in check';
    }
  }

  
  pgnEl.html(game.pgn());
  
};

var cfg = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  orientation: elem.options[elem.selectedIndex].value
};

var newGame = function() {
    game.reset();
    
}

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
		console.log(source)
		console.log(target)
		if(makeMove == 1) {
			var move = game.move({
			from: source,
			to: target,
			promotion: 'q' // NOTE: always promote to a queen for example simplicity
		  })
			console.log(game.pgn())
		  // illegal move
		  if (move === null) return 'snapback'
		  
		  //board.position(game.fen())
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


// var input = document.getElementById("move");
    // input.addEventListener("keypress", function(event) {
      // if (event.keyCode === 13) {
       // event.preventDefault();
       // document.getElementById("submit").click();
      // }
    // });


_engine = loadEngine();
newGame()