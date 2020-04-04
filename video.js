builtInArrays.SPRX = [] //horizontal coordinate of each sprite (-24 to 384)
builtInArrays.SPRY = [] //vertical coordinate of each sprite (-24 to 216)

var sprites = []

setInterval(function() {
	for (var i in arrays.SPRX) {
		if (i in arrays.SPRY) {
			if (!(i in sprites)) {
				sprites[i] = document.createElement("img")
				sprites[i].src = "ball.gif"
				sprites[i].style.position = "absolute"
				tabGraphic.appendChild(sprites[i])
			}

			sprites[i].style.left = arrays.SPRX[i] + "px"
			sprites[i].style.top = arrays.SPRY[i] + "px"
		}
	}
}, 40)
