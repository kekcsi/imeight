var ZOOM = 2

builtInVariables.BACKGROUND = 0 //color
builtInVariables.CURSORX = 0
builtInVariables.CURSORY = 0
builtInVariables.CURSORPERIOD = 30
builtInVariables.CURSORON = 20
builtInVariables.READYPROMPT = "READY."
builtInVariables["MUSIC$"] = "space_blues.mp3"
builtInVariables.MUSICTIME = 0

builtInArrays.SPRX = [] //horizontal coordinate of each sprite (-24 to 384)
builtInArrays.SPRY = [] //vertical coordinate of each sprite (-24 to 216)
builtInArrays.SPRDGN = [] //design pointer of each sprite (0 to 226*288)
builtInArrays.SPRPRIO = [] //z-index of each sprite

builtInArrays.TILE = [] //16+1 by 9+1 design pointers (-1 for full transparent)
builtInVariables.TILEX = 0 //X offset of the tile layer for smooth scrolling
builtInVariables.TILEY = 0 //Y offset of the tile layer for smooth scrolling
builtInVariables.TILEPRIO = "" //z-index of the tile layer

builtInVariables.FONTALNUM = -1 //pointer to font for the character generator
builtInVariables.FONTSIGNS = -1 //pointer to font pad 2 (non-alphanumerics)
builtInVariables.TEXTX = 0 //text layer X offset
builtInVariables.TEXTY = 0 //text layer Y offset
builtInVariables.TEXTCOLORUC = 2 //applies to capital letters (ASCII and 32 = 0)
builtInVariables.TEXTCOLORLC = 13 //applies to digits, punctuation etc.
builtInVariables.TEXTPRIO = 65535 //z-index of the text layer
builtInArrays["TEXTLINE$"] = [] //27+1 strings, 48+1 chars each

builtInFunctions.TOUCHX = { 
	apply: function(eventCode) {
		if (eventCode in ongoingTouches) {
			return ongoingTouches[eventCode].pageX
		} else {
			return -1
		}
	}
}

builtInFunctions.TOUCHY = { 
	apply: function(eventCode) {
		if (eventCode in ongoingTouches) {
			return ongoingTouches[eventCode].pageY
		} else {
			return -1
		}
	}
}

var builtInDesigns = [
    "ball24",
    "ball10",
    "ball4",
    "bomb",
    "car",
    "death",
    "door",
    "dragon",
    "dust",
    "gem",
    "hammer",
	"heart",
    "key",
    "ladder",
    "man",
    "medikit",
    "padhorz",
    "padvert",
    "plane",
    "robot",
    "rocket",
    "switchlt",
    "switchrt",
    "ufo",
    "wall"
]
for (var i in builtInDesigns) {
	var fun = "DGN" + builtInDesigns[i].toUpperCase()

	builtInFunctions[fun] = (function () {
		var url = "url('" + builtInDesigns[i] + ".gif')"

		return function () { return url }
	})()
}

var builtInCharGen = {32: [0,0,0,0,0,0,0,0],
33: [24,24,24,24,0,24,24,0],
34: [102,102,102,0,0,0,0,0],
35: [108,254,108,108,108,254,108,0],
36: [16,124,208,124,22,124,16,0],
37: [194,196,8,16,32,70,134,0],
38: [112,216,216,118,204,204,126,0],
39: [24,24,24,0,0,0,0,0],
40: [12,24,24,24,24,24,12,0],
41: [48,24,24,24,24,24,48,0],
42: [16,214,124,254,124,214,16,0],
43: [0,24,24,126,24,24,0,0],
44: [0,0,0,0,0,24,24,48],
45: [0,0,0,254,0,0,0,0],
46: [0,0,0,0,0,24,24,0],
47: [2,4,8,16,32,64,128,0],

48: [124,198,198,198,198,198,124,0],
49: [56,24,24,24,24,24,126,0],
50: [252,6,6,124,192,192,254,0],
51: [252,6,6,124,6,6,252,0],
52: [12,28,60,108,204,254,12,0],
53: [254,192,192,252,6,6,252,0],
54: [124,192,192,252,198,198,124,0],
55: [254,6,12,24,24,48,48,0],
56: [124,198,198,124,198,198,124,0],
57: [124,198,198,126,6,6,124,0],

58: [0,0,24,24,0,24,24,0],
59: [0,0,24,24,0,24,24,48],
60: [12,24,48,96,48,24,12,0],
61: [0,0,254,0,0,254,0,0],
62: [96,48,24,12,24,48,96,0],
63: [124,198,6,28,48,0,48,0],
64: [124,198,222,214,222,192,124,0],

65: [124,198,198,198,254,198,198,0],
66: [252,198,198,252,198,198,252,0],
67: [124,198,192,192,192,198,124,0],
68: [248,204,198,198,198,198,252,0],
69: [254,192,192,252,192,192,254,0],
70: [254,192,192,252,192,192,192,0],
71: [124,192,192,222,198,198,126,0],
72: [198,198,198,254,198,198,198,0],
73: [126,24,24,24,24,24,126,0],
74: [30,6,6,6,6,198,124,0],
75: [198,204,216,252,198,198,198,0],
76: [192,192,192,192,192,192,254,0],
77: [130,198,238,214,198,198,198,0],
78: [134,198,230,214,206,198,194,0],
79: [124,198,198,198,198,198,124,0],
80: [252,198,198,198,252,192,192,0],
81: [124,198,198,194,218,124,24,14],
82: [252,198,198,252,216,204,198,0],
83: [124,198,192,124,6,198,124,0],
84: [126,24,24,24,24,24,24,0],
85: [198,198,198,198,198,198,124,0],
86: [198,198,198,108,108,56,16,0],
87: [198,198,198,214,214,238,68,0],
88: [198,198,108,56,108,198,198,0],
89: [102,102,102,60,24,24,24,0],
90: [126,6,12,24,48,96,126,0],

91: [60,48,48,48,48,48,60,0],
92: [192,96,48,24,12,6,3,0],
93: [60,12,12,12,12,12,60,0],
94: [56,108,198,0,0,0,0,0],
95: [0,0,0,0,0,0,254,0],
96: [48,24,12,0,0,0,0,0],

123: [60,48,48,96,48,48,60,0],
124: [24,24,24,24,24,24,24,0],
125: [60,12,12,6,12,12,60,0],
126: [112,214,28,0,0,0,0,0]}
for (var alpha = 1; alpha <= 26; alpha++) {
	builtInCharGen[96 + alpha] = builtInCharGen[64 + alpha]
}
for (var n = 32; n < 64; n++) {
	builtInCharGen[n - 32] = builtInCharGen[n]
}

var designs = [] //ImageData
var sprites = [] //div
var tiles = []
var tileCanvas
var tilesDirty
var divTileGrid
var glyphs = [] //ASCII --> ImageData
var glyphsDirty = true
var textCanvas
var textDirty = false

var cursorBlink = false
var cursorPhase = 0
var userInputValue = ""

var ongoingTouches = {}

videoPrint = function(message) {
	if (variables.CURSORY === "") {
		console.log(message)
		return
	}

	arrays["TEXTLINE$"][variables.CURSORY++] = message
	variables.CURSORX = 0
	textDirty = true
}

readyPrompt = function() {
	videoPrint(variables.READYPROMPT)
	cursorBlink = true
}

if (typeof commands == "object") {
	commands.DGNS = function() {
		var ln = ""
		
		for (var dgn in builtInDesigns) {
			ln += builtInDesigns[dgn].toUpperCase()
			
			if (dgn == builtInDesigns.length - 1) {
				videoPrint(ln)
				break
			}
			
			ln += ","
			
			if (ln.length > 40) {
				videoPrint(ln)
				ln = ""
			}
		}
	}
}

memoryUpdateHooks.push(function(addr) {
	// invalidating affected designs
	var designIdx = Math.floor(addr/288)
	delete designs[designIdx]

	// invalidating affected sprites
	for (var i in sprites) {
		if (arrays.SPRDGN[i] == 288*designIdx) {
			//flickerless design modifying animations
			sprites[i].dataset.dirty = true
		}
	}
	
	tilesDirty = true

	if (addr >= variables.FONTALNUM && addr < variables.FONTALNUM + 288 || 
			addr >= variables.FONTSIGNS && addr < variables.FONTSIGNS + 272) {
				
		glyphsDirty = true
	}
})

varUpdateHook = function(arrayName, index) {
	if (arrayName == null && index == null) {
		//CLR
		ZOOM = inZoom.checked ? 2 : 1
		tabGraphic.style.width = 384*ZOOM + "px"
		tabGraphic.style.height = 216*ZOOM + "px"
		
		sprites = []
		tabGraphic.innerHTML = ""
		
		divTileGrid = document.createElement('div')
		divTileGrid.style.pointerEvents = "none"
		divTileGrid.style.width = 24*17*ZOOM + "px"
		divTileGrid.style.height = 24*10*ZOOM + "px"
		divTileGrid.style.position = "absolute"
		tabGraphic.appendChild(divTileGrid)
		
		tileCanvas = document.createElement('canvas')
		tileCanvas.style.pointerEvents = "none"
		tileCanvas.width = 24*17*ZOOM
		tileCanvas.height = 24*10*ZOOM
		tileCanvas.style.position = "absolute"
		tileCanvas.style.top = "0px"
		tileCanvas.style.left = "0px"
		divTileGrid.appendChild(tileCanvas)
		
		for (var row = 0; row <= 9; row++) {
			for (var col = 0; col <= 16; col++) {
				i = [row, col]
				tiles[i] = document.createElement('div')
				tiles[i].style.pointerEvents = "none"
				tiles[i].style.width = 24*ZOOM + "px"
				tiles[i].style.height = 24*ZOOM + "px"
				tiles[i].style.position = "absolute"
				tiles[i].style.left = 24*col*ZOOM + "px"
				tiles[i].style.top = 24*row*ZOOM + "px"
				divTileGrid.appendChild(tiles[i])
			}
		}
		
		tilesDirty = true
		
		textCanvas = document.createElement('canvas')
		textCanvas.style.pointerEvents = "none"
		textCanvas.width = 8*49*ZOOM
		textCanvas.height = 8*28*ZOOM
		textCanvas.style.position = "absolute"
		textCanvas.style.top = "0px"
		textCanvas.style.left = "0px"
		tabGraphic.appendChild(textCanvas)

		var touchLayer = document.createElement('canvas')
		touchLayer.width = 384*ZOOM
		touchLayer.height = 216*ZOOM
		touchLayer.style.position = "absolute"
		touchLayer.style.top = "0px"
		touchLayer.style.left = "0px"
		tabGraphic.appendChild(touchLayer)
		touchLayer.addEventListener("touchstart", touchStart, false)
		touchLayer.addEventListener("touchend", touchEnd, false)
		touchLayer.addEventListener("touchcancel", touchCancel, false)
		touchLayer.addEventListener("touchmove", touchMove, false)
		touchLayer.addEventListener("mousedown", mouseDown, false)
		touchLayer.addEventListener("mouseup", mouseUp, false)
		touchLayer.addEventListener("mouseout", mouseOut, false)
		touchLayer.addEventListener("mousemove", mouseMove, false)
		
		glyphsDirty = true
		designs = []
	}
	
	if (arrayName == "SPRDGN") {
		if (index in sprites) {
			if (typeof arrays.SPRDGN[index] == "number" && sprites[index].childElementCount > 0) {
				//flickerless design swapping animations 
				sprites[index].dataset.dirty = true
			} else {
				if (sprites[index].dataset.dgnurl != arrays.SPRDGN[index]) {
					//library designs do flicker on change
					sprites[index].remove()
					delete sprites[index]
				}
			}
		}
	}
	
	// DIM SPR...()
	if (index == null && (arrayName == "SPRDGN" || arrayName == "SPRX" || 
			arrayName == "SPRY")) {

		for (i in sprites) {
			sprites[i].remove()
		}

		sprites = []
	}
	
	if (arrayName == "TILE") {
		tilesDirty = true
	}
	
	if (arrayName == "TEXTLINE$") {
		textDirty = true
	}
	
	if ((index == "FONTALNUM" || index == "FONTSIGNS" || 
			index == "TEXTCOLORUC" || index == "TEXTCOLORLC") && !arrayName) {
		
		glyphsDirty = true
	}
	
	if (index == "MUSIC$" && !arrayName) {
		auBackground.src = variables["MUSIC$"]

		if (variables["MUSIC$"].length) {
			auBackground.play()
		} else {
			auBackground.pause()
		}
	}
	
	if (index == "MUSICTIME" && !arrayName) {
		auBackground.currentTime = variables["MUSICTIME"]

		if (auBackground.src.length) {
			auBackground.play()
		}
	}
}

function colorToCSS(i) {
	var colorBytes = colorToBytes(i)
	return "rgb(" + colorBytes[0] + 
			"," + colorBytes[1] + 
			"," + colorBytes[2] + ")"
}

function colorToBytes(i) {
	var light = ((i >> 3)&1) ? 0xff : 0xcc
	var dark = ((i >> 3)&1) ? 0x33 : 0
	var red = (i&1) ? light : dark
	var green = ((i >> 1)&1) ? light : dark
	var blue = ((i >> 2)&1) ? light : dark
	var opacity = (i == 0) ? 0 : 255
	return [red, green, blue, opacity]
}

function copyTouch({ identifier, pageX, pageY }) {
	return { identifier:identifier, pageX:pageX/ZOOM, pageY:pageY/ZOOM }
}

function mouseDown(evt) {
	evt.preventDefault()
	tabGraphic.focus()
	ongoingTouches[1] = {identifier: 1, pageX: evt.offsetX/ZOOM, pageY: evt.offsetY/ZOOM}
	eventQueue.push(1 + 0.5*evt.shiftKey + 0.25*evt.ctrlKey)
	eventHandler()
}

function mouseMove(evt) {
	evt.preventDefault()
	ongoingTouches[1] = {identifier: 1, pageX: evt.offsetX/ZOOM, pageY: evt.offsetY/ZOOM}
}

function mouseUp(evt) {
	eventQueue.push(-1)
	eventHandler()
}

function mouseOut(evt) {
	delete ongoingTouches[1]
	eventHandler()
}

function touchStart(evt) {
	evt.preventDefault()
	tabGraphic.focus()
	var numTouches = evt.changedTouches.length

	for (var i = 0; i < numTouches; i++) {
		var touch = evt.changedTouches[i]
		eventQueue.push(256 + (touch.identifier%0xff00&0xffff))
		ongoingTouches[256 + (touch.identifier%0xff00&0xffff)] = copyTouch(touch)
	}

	eventHandler()
}

function touchMove(evt) {
	evt.preventDefault()
	var numTouches = evt.changedTouches.length

	for (var i = 0; i < numTouches; i++) {
		var touch = evt.changedTouches[i]
		ongoingTouches[256 + (touch.identifier%0xff00&0xffff)] = copyTouch(touch)
	}
}

function touchEnd(evt) {
	evt.preventDefault()
	var numTouches = evt.changedTouches.length

	for (var i = 0; i < numTouches; i++) {
		var touch = evt.changedTouches[i]
		eventQueue.push(-256 - (touch.identifier%0xff00&0xffff))
		delete ongoingTouches[256 + (touch.identifier%0xff00&0xffff)]
	}

	eventHandler()
}

function touchCancel(evt) {
	evt.preventDefault();
	var numTouches = evt.changedTouches.length

	for (var i = 0; i < numTouches; i++) {
		var touch = evt.changedTouches[i]
		delete ongoingTouches[256 + (touch.identifier%0xff00&0xffff)]
	}
}

pageLoadHooks.push(function() {
	tabGraphic.addEventListener("keydown", function(event) {
		if (!cursorBlink) {
			event.preventDefault()
			
			if (!(event.keyCode in pressedKeys)) { //ignore repeats
				eventQueue.push(event.keyCode + 0.5*event.shiftKey + 0.25*event.ctrlKey)
				eventHandler()
				pressedKeys[event.keyCode] = Date.now()
			}
		} else if (event.keyCode == 8 || event.keyCode == 46 || event.keyCode == 37) {
			event.preventDefault()
			
			userInputValue = userInputValue.substring(0, userInputValue.length - 1)
		} else if (event.keyCode >= 96 && event.keyCode < 106) { //numpad
			event.preventDefault()
			userInputValue += String.fromCharCode(event.keyCode - 48)
		}

		if (event.keyCode == 27) {
			event.preventDefault()
				
			if (pressedKeys[event.keyCode] < Date.now() - 2000) { //force break
				userBreak()
				instructions.CLR.run(0)
			}

			if (!(27 in pressedKeys)) {
				pressedKeys[27] = Date.now()
			}
		}
	})
	
	tabGraphic.addEventListener("keypress", function(event) {
		if (cursorBlink) {
			if (event.charCode >= 32) {
				event.preventDefault()
				
				userInputValue += String.fromCharCode(event.charCode)
			}
		}
	})
	
	tabGraphic.addEventListener("keyup", function(event) {
		event.preventDefault()
		
		if (cursorBlink) {
			if (event.keyCode == 27) { //Esc
				userBreak()
			}
			if (event.keyCode == 13) { //Enter
				userInput()
			}
		} else {
			eventQueue.push(-event.keyCode)
		}

		eventHandler()
		delete pressedKeys[event.keyCode]
	})

	setInterval(function() {
		tabGraphic.style.backgroundColor = colorToCSS(variables.BACKGROUND)
		
		// render sprites
		for (var i in arrays.SPRY) {
			if (i in arrays.SPRX) {
				if (!(i in sprites)) {
					sprites[i] = document.createElement("div")
					sprites[i].style.pointerEvents = "none"
					sprites[i].style.width = 24*ZOOM + "px"
					sprites[i].style.height = 24*ZOOM + "px"
					sprites[i].style.position = "absolute"
					tabGraphic.appendChild(sprites[i])
				}

				sprites[i].style.left = arrays.SPRX[i]*ZOOM + "px"
				sprites[i].style.top = arrays.SPRY[i]*ZOOM + "px"
				if (i in arrays.SPRPRIO) {
					sprites[i].style.zIndex = arrays.SPRPRIO[i]
				}
				
				if (i in arrays.SPRDGN) { //not the default design
					if (typeof arrays.SPRDGN[i] == "number") { //user-designed
						var designIdx = Math.floor(arrays.SPRDGN[i]/288)

						arrays.SPRDGN[i] = 288*designIdx //correct the alignment
						
						cacheDesign(designIdx)
						if ("dirty" in sprites[i].dataset) {
							var ctx = sprites[i].firstChild.getContext('2d')
							ctx.putImageData(designs[designIdx], 0, 0)
						}
						
						if (sprites[i].childElementCount == 0) {
							// created just now
							var canvas = document.createElement('canvas')
							canvas.width = 24*ZOOM
							canvas.height = 24*ZOOM
							canvas.style.pointerEvents = "none"
							var ctx = canvas.getContext('2d')
							ctx.putImageData(designs[designIdx], 0, 0)
							sprites[i].appendChild(canvas)
							sprites[i].style.background = "none"
						}
					} else { // library design
						sprites[i].style.background = arrays.SPRDGN[i] //url
						sprites[i].style.backgroundSize = "cover"
						sprites[i].innerHTML = ""
						sprites[i].dataset.dgnurl = arrays.SPRDGN[i]
					}
				} else {
					// default design
					sprites[i].style.background = "url(ball24.gif)"
					sprites[i].style.backgroundSize = "cover"
					sprites[i].innerHTML = ""
					sprites[i].dataset.dgnurl = "url(ball24.gif)"
				}
			}
		} //end of sprites
		
		//tiles
		divTileGrid.style.left = variables.TILEX*ZOOM + "px"
		divTileGrid.style.top = variables.TILEY*ZOOM + "px"
		divTileGrid.style.zIndex = variables.TILEPRIO
		if (tilesDirty) {
			ctx = tileCanvas.getContext('2d')
			for (var row = 0; row <= 9; row++) {
				for (var col = 0; col <= 16; col++) {
					i = [row, col]
					if (typeof arrays.TILE[i] == "number") {
						designIdx = Math.floor(arrays.TILE[i]/288)
						cacheDesign(designIdx)
						ctx.putImageData(designs[designIdx], col*24*ZOOM, row*24*ZOOM)
						tiles[i].style.backgroundImage = ""
					} else if (typeof arrays.TILE[i] == "string") {
						tiles[i].style.backgroundImage = arrays.TILE[i]
						tiles[i].style.backgroundSize = "cover"
						ctx.clearRect(col*24*ZOOM, row*24*ZOOM, 24*ZOOM, 24*ZOOM)
					} else {
						tiles[i].style.backgroundImage = ""
						ctx.clearRect(col*24*ZOOM, row*24*ZOOM, 24*ZOOM, 24*ZOOM)
					}
				}
			}
			
			tilesDirty = false
		}

		if (glyphsDirty) {
			var pad1 = Math.max(Math.floor(variables.FONTALNUM/288)*288, -1)
			var pad2 = Math.max(Math.floor(variables.FONTSIGNS/288)*288, -1)
			var tup1 = colorToBytes(variables.TEXTCOLORUC)
			var tup2 = colorToBytes(variables.TEXTCOLORLC)

			for (var ascii in builtInCharGen) {
				var gi = null
				var tup = ((ascii & 0x20) ? tup2 : tup1) 
				var startAddress = -2
				
				var upscii = (ascii & 0xdf)

				if (upscii >= 16 && upscii <= 25) {
					gi = upscii - 16
					startAddress = pad1
				}

				if (upscii > 64 && upscii <= 90) {
					gi = upscii - 55
					startAddress = pad1
				}
				
				if (startAddress < -1 && (pad2 in memory)) {
					if (ascii < 64) {
						gi = (upscii & 31) //0-15, 26-31
					} else if (ascii == 64) {
						gi = 32
					} else if (ascii == 96) {
						gi = 33
					} else { //16-25
						gi = 16 + ((ascii - 27)&31) + ((ascii & 0x20)?5:0)
					}

					startAddress = pad2
				}
				
				if (startAddress >= 0) {
					glyphs[ascii] = genChar(memory, startAddress + gi*8, tup)
				} else {
					glyphs[ascii] = genChar(builtInCharGen[ascii], 0, tup)
				}
			}
			
			textDirty = true
			glyphsDirty = false
		}

		var txCtx = textCanvas.getContext("2d")

		if (variables.CURSORY > 26) {
			if (variables.TEXTY > -7 && variables.CURSORY < 32) {
				variables.TEXTY -= 1
			} else {
				console.log("scrolled out " + arrays["TEXTLINE$"].shift())
				arrays["TEXTLINE$"].push("")
				variables.CURSORY--
				variables.TEXTY = 0
				textDirty = true
			}
		} 

		if (cursorBlink) {
			if (arrays["TEXTLINE$"][variables.CURSORY] != userInputValue) {
				arrays["TEXTLINE$"][variables.CURSORY] = userInputValue
				variables.CURSORX = userInputValue.length
				textDirty = true
			}
		}
			
		if (textDirty)	{
			for (var lineNum = 0; lineNum < 28; lineNum++) {
				var fmt = "NORMAL"
				var str

				if (lineNum in arrays["TEXTLINE$"]) {
					str = "" + arrays["TEXTLINE$"][lineNum]
				} else {
					str = ""
				}

				if (typeof arrays["TEXTLINE$"][lineNum] == "object") {
					fmt = arrays["TEXTLINE$"][lineNum].fmt
				}

				txCtx.clearRect(0, 8*lineNum*ZOOM, 392*ZOOM, 8*ZOOM)
				for (var x = 0; x < 49 && x < str.length; x++) {
					var ascii = str.charCodeAt(x)
					if (!(ascii in glyphs)) continue
					txCtx.putImageData(glyphs[ascii], 8*x*ZOOM, 8*lineNum*ZOOM)
				}

				if (fmt == "INPUT") {
					txCtx.fillStyle = colorToCSS(variables.TEXTCOLORUC)
					txCtx.fillRect(0, (8*lineNum + 7)*ZOOM, str.length*8*ZOOM, ZOOM)
				} else if (fmt == "PROGRAM") {
					txCtx.fillStyle = colorToCSS(variables.TEXTCOLORLC)
					txCtx.fillRect(0, (8*lineNum + 7)*ZOOM, str.length*8*ZOOM, ZOOM)
				}
			}
			
			textDirty = false
		}

		if (cursorBlink && tabGraphic == document.activeElement) {
			cursorPhase++
			if (cursorPhase < variables.CURSORON) {
				txCtx.fillStyle = colorToCSS(variables.TEXTCOLORUC)
				txCtx.fillRect(8*ZOOM*variables.CURSORX, 8*ZOOM*variables.CURSORY, 8*ZOOM, 8*ZOOM)
			} else if (cursorPhase == variables.CURSORON) {
				txCtx.fillStyle = colorToCSS(variables.BACKGROUND)
				txCtx.fillRect(8*ZOOM*variables.CURSORX, 8*ZOOM*variables.CURSORY, 8*ZOOM, 8*ZOOM)

				textDirty = true
			} else if (cursorPhase > variables.CURSORPERIOD) {
				cursorPhase = 0
			}
		}
		
		textCanvas.style.left = variables.TEXTX*ZOOM + "px"
		textCanvas.style.top = variables.TEXTY*ZOOM + "px"
		textCanvas.style.zIndex = variables.TEXTPRIO
		
		variables["MUSICTIME"] = auBackground.currentTime
	}, 40)
})

function cacheDesign(designIdx) {
	if (!(designIdx in designs)) {
		var pixels = new Uint8ClampedArray(4*24*ZOOM*24*ZOOM)
		
		var j = 0 //indexing pixel data array
		for (var ro = 0; ro < 24; ++ro) { //row of imaginary pixels
			for (var ib = 0; ib < 12; ++ib) { //memory byte index in row
				var addr = 288*designIdx + 12*ro + ib //memory address

				var hi = colorToBytes(memory[addr] >> 4) //pixel from high...
				var lo = colorToBytes(memory[addr] & 15) //...low nibble
				
				if (ZOOM == 2) {
					for (var component = 0; component < 4; ++component) {
						pixels[j + component] = hi[component]
						pixels[j + component + 4] = hi[component]
						pixels[j + component + 192] = hi[component]
						pixels[j + component + 196] = hi[component]

						pixels[j + component + 8] = lo[component]
						pixels[j + component + 12] = lo[component]
						pixels[j + component + 200] = lo[component]
						pixels[j + component + 204] = lo[component]
					}
				} else {
					for (var component = 0; component < 4; ++component) {
						pixels[j + component] = hi[component]
						pixels[j + component + 4] = lo[component]
					}
				}
				
				j += 8*ZOOM //next memory byte goes 2 imaginary pixels ahead
			}
			
			if (ZOOM == 2) {
				//skip a line of real pixels, i.e. 48*4 pixel data bytes
				j += 192
			}
		}
		
		designs[designIdx] = new ImageData(pixels, 24*ZOOM, 24*ZOOM)
	}
}

function genChar(ary, offset, tup) {
	var ba = new Uint8ClampedArray(4*8*ZOOM*8*ZOOM)

	var a = 0
	for (var ro = 0; ro < 8; ro++) {
		var by = ary[offset + ro]

		for (var co = 0; co < 8; co++) {
			var bit = ((by>>(7 - co))&1)
			tup[3] = (bit ? 255 : 0)

			for (var k = 0; k < 4; k++) {
				ba[k + a] = tup[k]

				if (ZOOM == 2) {
					ba[k + a + 4] = tup[k]
					ba[k + a + 64] = tup[k]
					ba[k + a + 68] = tup[k]
				}
			}
			
			a += 4*ZOOM //next bit goes 1 imaginary pixel ahead
		}
		
		if (ZOOM == 2) {
			a += 64 //skip a line of real pixels, i.e. 16*4 pixel data bytes
		}
	}
	
	return new ImageData(ba, 8*ZOOM, 8*ZOOM)
}

function FmtStr(fmt, str) {
	return {fmt: fmt, str: str, toString: function() { return str }}
}
