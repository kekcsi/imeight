builtInArrays.SPRX = [] //horizontal coordinate of each sprite (-24 to 384)
builtInArrays.SPRY = [] //vertical coordinate of each sprite (-24 to 216)
builtInArrays.SPRDGN = [] //design pointer of each sprite
builtInVariables.BACKGROUND = 0

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

var designs = []
var sprites = []

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
			sprites[i].remove()
			delete sprites[i]
		}
	}
})

varUpdateHook = function(arrayName, index) {
	if (index == null) {
		//CLR
		sprites = []
		tabGraphic.innerHTML = ""
	}
	
	if (arrayName == "SPRDGN") {
		if (index in sprites) {
			sprites[index].remove()
			delete sprites[index]
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
		
		for (var i in arrays.SPRX) {
			if (i in arrays.SPRY) {
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

						if (!(designIdx in designs)) {
							var pixels = new Uint8ClampedArray(4*24*24)
							
							for (var j = 0; j < 288; ++j) {
								var addr = arrays.SPRDGN[i] + j
								var bytes = colorToBytes(memory[addr] >> 4)
								bytes = bytes.concat(colorToBytes(memory[addr] & 15))
								for (var k = 0; k < 8; ++k) {
									pixels[8*j + k] = bytes[k]
								}
							}
							
							designs[designIdx] = new ImageData(pixels, 24, 24)
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
					}
				} else {
					// default design
					sprites[i].style.background = "url(ball24.gif)"
					sprites[i].innerHTML = ""
				}
			}
		}
	}, 40)
})
