builtInVariables.BACKGROUND = 0 //color

builtInArrays.SPRX = [] //horizontal coordinate of each sprite (-24 to 384)
builtInArrays.SPRY = [] //vertical coordinate of each sprite (-24 to 216)
builtInArrays.SPRDGN = [] //design pointer of each sprite (0 to 226*288)

builtInArrays.TILE = [] //16+1 by 9+1 design pointers (-1 for full transparent)
builtInVariables.TILEX = 0 //X offset of the tile layer for smooth scrolling
builtInVariables.TILEY = 0 //Y offset of the tile layer for smooth scrolling

builtInVariables.CHARGEN = -1 //pointer to font for the character generator
builtInVariables.TEXTX = 0 //text layer X offset
builtInVariables.TEXTY = 0 //text layer Y offset
builtInVariables.TEXTCOLOR = 0
builtInArrays.TEXTLINES = [] //27+1 strings, 48+1 chars each

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

var designs = [] //ImageData
var sprites = [] //div
var tiles = []
var tileCanvas
var tilesDirty
var divTileGrid
var glyphs = [] //36*ImageData
var glyphsDirty = false
var textCanvas
var textDirty = false

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
})

varUpdateHook = function(arrayName, index) {
	if (index == null) {
		//CLR
		sprites = []
		tabGraphic.innerHTML = ""
		
		divTileGrid = document.createElement('div')
		divTileGrid.style.width = 24*17 + "px"
		divTileGrid.style.height = 24*10 + "px"
		divTileGrid.style.position = "absolute"
		tabGraphic.appendChild(divTileGrid)
		
		tileCanvas = document.createElement('canvas')
		tileCanvas.width = 24*17
		tileCanvas.height = 24*10
		tileCanvas.style.position = "absolute"
		tileCanvas.style.top = "0px"
		tileCanvas.style.left = "0px"
		divTileGrid.appendChild(tileCanvas)
		
		for (var row = 0; row <= 9; row++) {
			for (var col = 0; col <= 16; col++) {
				i = [row, col]
				tiles[i] = document.createElement('div')
				tiles[i].style.width = 24 + "px"
				tiles[i].style.height = 24 + "px"
				tiles[i].style.position = "absolute"
				tiles[i].style.left = 24*col + "px"
				tiles[i].style.top = 24*row + "px"
				divTileGrid.appendChild(tiles[i])
			}
		}
		
		tilesDirty = true
		
		textCanvas = document.createElement('canvas')
		textCanvas.width = 8*49
		textCanvas.height = 8*28
		textCanvas.style.position = "absolute"
		textCanvas.style.top = "0px"
		textCanvas.style.left = "0px"
		tabGraphic.appendChild(textCanvas)
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
	
	if (arrayName == "TILE") {
		tilesDirty = true
	}
	
	if (arrayName == "TEXTLINES") {
		textDirty = true
	}
	
	if ((index == "CHARGEN" || index == "TEXTCOLOR") && !arrayName) {
		glyphsDirty = true
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

pageLoadHooks.push(function() {
	tabGraphic.addEventListener("keydown", function(event) {
		event.preventDefault()

		if (!(event.keyCode in pressedKeys)) { //ignore repeats
			eventQueue.push(event.keyCode + 0.5*event.shiftKey + 0.25*event.ctrlKey)
			eventHandler()
			pressedKeys[event.keyCode] = Date.now()
		}
	})
	
	tabGraphic.addEventListener("keyup", function(event) {
		event.preventDefault()
		eventQueue.push(-event.keyCode)
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
					sprites[i].style.width = "24px"
					sprites[i].style.height = "24px"
					sprites[i].style.position = "absolute"
					tabGraphic.appendChild(sprites[i])
				}

				sprites[i].style.left = arrays.SPRX[i] + "px"
				sprites[i].style.top = arrays.SPRY[i] + "px"
				
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
							canvas.width = 24
							canvas.height = 24
							var ctx = canvas.getContext('2d')
							ctx.putImageData(designs[designIdx], 0, 0)
							sprites[i].appendChild(canvas)
							sprites[i].style.background = "none"
						}
					} else { // library design
						sprites[i].style.background = arrays.SPRDGN[i] //url
						sprites[i].innerHTML = ""
						sprites[i].dataset.dgnurl = arrays.SPRDGN[i]
					}
				} else {
					// default design
					sprites[i].style.background = "url(ball24.gif)"
					sprites[i].innerHTML = ""
					sprites[i].dataset.dgnurl = "url(ball24.gif)"
				}
			}
		} //end of sprites
		
		//tiles
		divTileGrid.style.left = variables.TILEX + "px"
		divTileGrid.style.top = variables.TILEY + "px"
		if (tilesDirty) {
			ctx = tileCanvas.getContext('2d')
			for (var row = 0; row <= 9; row++) {
				for (var col = 0; col <= 16; col++) {
					i = [row, col]
					if (typeof arrays.TILE[i] === "number") {
						designIdx = Math.floor(arrays.TILE[i]/288)
						cacheDesign(designIdx)
						ctx.putImageData(designs[designIdx], col*24, row*24)
						tiles[i].style.backgroundImage = ""
					} else {
						tiles[i].style.backgroundImage = arrays.TILE[i]
						ctx.clearRect(col*24, row*24, 24, 24)
					}
				}
			}
			
			tilesDirty = false
		}

		if (variables.CHARGEN in memory) {
			if (glyphsDirty) {
				var startAddress = variables.CHARGEN

				for (var gi = 0; gi < 36; gi++) {
					var ba = new Uint8ClampedArray(4*8*8)
					
					for (var ro = 0; ro < 8; ro++) {
						var by = memory[startAddress + gi*8 + ro]

						for (var co = 0; co < 8; co++) {
							var bit = ((by>>(7 - co))&1)
							
							var tup = colorToBytes(variables.TEXTCOLOR)
							tup[3] = (bit ? 255 : 0)
							
							for (var k = 0; k < 4; k++) {
								ba[k + 4*(8*ro + co)] = tup[k]
							}
						}
					}
					
					glyphs[gi] = new ImageData(ba, 8, 8)
				}
				
				glyphs.push(new ImageData(new Uint8ClampedArray(4*8*8), 8, 8))
				
				textDirty = true
				glyphsDirty = false
			}
			
			if (textDirty) {
				var txCtx = textCanvas.getContext("2d")

				for (var lineNum in arrays.TEXTLINES) {
					var str = "" + arrays.TEXTLINES[lineNum]
					
					for (var x = 0; x < 49; x++) {
						var ascii = str.charCodeAt(x)
						var gi = 36
						if (ascii >= 48 && ascii < 58) gi = ascii - 48
						if (ascii > 64 && ascii <= 90) gi = ascii - 55
						
						txCtx.putImageData(glyphs[gi], 8*x, 8*lineNum)
					}
				}
				
				textDirty = false
			}
			
			textCanvas.style.left = variables.TEXTX + "px"
			textCanvas.style.top = variables.TEXTY + "px"
		}
	}, 40)
})

function cacheDesign(designIdx) {
	if (!(designIdx in designs)) {
		var pixels = new Uint8ClampedArray(4*24*24)
		
		for (var j = 0; j < 288; ++j) {
			var addr = 288*designIdx + j
			var bytes = colorToBytes(memory[addr] >> 4)
			bytes = bytes.concat(colorToBytes(memory[addr] & 15))
			for (var k = 0; k < 8; ++k) {
				pixels[8*j + k] = bytes[k]
			}
		}
		
		designs[designIdx] = new ImageData(pixels, 24, 24)
	}
}
