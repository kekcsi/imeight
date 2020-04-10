builtInArrays.SPRX = [] //horizontal coordinate of each sprite (-24 to 384)
builtInArrays.SPRY = [] //vertical coordinate of each sprite (-24 to 216)
builtInArrays.SPRDGN = [] //design pointer of each sprite

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
				sprites[i] = document.createElement("div")
				sprites[i].style.width = "24px"
				sprites[i].style.height = "24px"
				sprites[i].style.position = "absolute"
				tabGraphic.appendChild(sprites[i])
			}

			sprites[i].style.left = arrays.SPRX[i] + "px"
			sprites[i].style.top = arrays.SPRY[i] + "px"
			
			if (i in arrays.SPRDGN) {
				if (typeof arrays.SPRDGN[i] == "number") {
					//TODO decode from memory
					sprites[i].innerHTML = "" + arrays.SPRDGN[i]
					sprites[i].style.background = "none"
				} else {
					// library design
					sprites[i].style.background = arrays.SPRDGN[i]
					sprites[i].innerHTML = "&nbsp;"
				}
			}
		}
	}
}, 40)
