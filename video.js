builtInArrays.SPRX = [] //horizontal coordinate of each sprite (-24 to 384)
builtInArrays.SPRY = [] //vertical coordinate of each sprite (-24 to 216)
builtInArrays.SPRDGN = [] //design pointer of each sprite

var builtInDesigns = [
    "ball10",
    "ball24",
    "ball4",
    "bomb",
    "clock",
    "door",
    "dust",
    "gem",
    "hammer",
    "key",
    "man",
    "medikit",
    "padhorz",
    "padvert",
    "plane",
    "rocket",
    "ufo",
    "wall"
]

for (var i in builtInDesigns) {
	var fun = "DGN" + builtInDesigns[i].toUpperCase()

	builtInFunctions[fun] = (function () {
		var gif = builtInDesigns[i] + ".gif"

		return function () { return gif }
	})()
}

commands["DGNS"] = function() {
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

var sprites = []

setInterval(function() {
	for (var i in arrays.SPRX) {
		if (i in arrays.SPRY) {
			if (!(i in sprites)) {
				if (i in arrays.SPRDGN) {
					if (typeof arrays.SPRDGN[i] == "number") {
						//TODO decode from memory
						sprites[i] = document.createElement("canvas")
					} else {
						// library design
						sprites[i] = document.createElement("img")
					}
				} else {
					sprites[i] = document.createElement("img")
					sprites[i].src = "ball24.gif"
				}
				sprites[i].style.position = "absolute"
				tabGraphic.appendChild(sprites[i])
			}

			sprites[i].style.left = arrays.SPRX[i] + "px"
			sprites[i].style.top = arrays.SPRY[i] + "px"
			
			if ((i in arrays.SPRDGN) && (i in sprites)) {
				if (typeof arrays.SPRDGN[i] == "number") {
					//TODO decode from memory
				} else {
					// library design
					sprites[i].src = arrays.SPRDGN[i]
				}
			}
		}
	}
}, 40)
