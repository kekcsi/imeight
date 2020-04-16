var spriteData = []
var drawingColor = "#000000"
var drawingIdx = 0
var selDesign = 0

var designerDirty = false

setInterval(function() {
	if (designerDirty) {
		localStorage.setItem("designdata", JSON.stringify(spriteData))
		localStorage.setItem("seldesign", selDesign)
		localStorage.setItem("memory", JSON.stringify(memory))
		desigerDirty = false
	}
}, 2000)

function sprEdit(ev) {
	if (ev.buttons > 0) {
		ev.target.style.backgroundColor = drawingColor
		spriteData[ev.target.dataset.idx] = drawingIdx
	}
}

pageLoadHooks.push(function() {
	var spriteDataJson = localStorage.getItem("designdata")
	if (spriteDataJson == null) {
		spriteData = []
		for (var i = 0; i < 24*24; i++) spriteData.push(0)
	} else {
		spriteData = JSON.parse(spriteDataJson)
	}

	selDesign = localStorage.getItem("seldesign")
	if (selDesign == null) selDesign = 0
	inPointer.value = 288*selDesign					

	var memoryJson = localStorage.getItem("memory")
	if (memoryJson == null) {
		memory = []
	} else {
		memory = JSON.parse(memoryJson)
	}

	var pixCells = document.getElementById("sprite-editor").getElementsByTagName("td")
	for(var i = 0; i < pixCells.length; ++i) {
		pixCells[i].addEventListener("mousedown", sprEdit);
		pixCells[i].addEventListener("mouseover", sprEdit);
		pixCells[i].addEventListener("mouseup", function() { designerDirty = true });
		pixCells[i].style.backgroundColor = colorToCSS(spriteData[i])
	}
	
	var cells = tblColors.getElementsByTagName("td")
	for(var i = 0; i < 16; ++i) {
		var cell = cells[i]
		cell.style.backgroundColor = colorToCSS(i)
		cell.style.borderColor = (i == drawingIdx) ? "white" : "gray"
				
		cell.addEventListener("mousedown", function(ev) {
			drawingColor = ev.target.style.backgroundColor
			drawingIdx = parseInt(ev.target.dataset.idx, 10)
			
			var cells = tblColors.getElementsByTagName("td")
			for (var j = 0; j < 16; j++) {
				cells[j].style.borderColor = (j == drawingIdx) ? "white" : "gray"
			}
		})
	}
	
	cells = tblMemory.getElementsByTagName("td")
	cells[selDesign].style.background = "white"
	for(var j = 0; j < 227; ++j) {
		var cell = cells[j]
		
		cell.addEventListener("mousedown", function(ev) {
			var prevSel = selDesign
			selDesign = parseInt(ev.target.dataset.idx, 10)
			
			inPointer.value = 288*selDesign					
			cells[prevSel].style.background = "black"
			cells[selDesign].style.background = "white"
			
			var thumb = new Uint8ClampedArray(4*24*24)

			for (var i = 0; i < 288; ++i) {
				var octet = ((spriteData[2*i]<<4)|spriteData[2*i + 1])
				memory[i + 288*prevSel] = octet

				var bytes = colorToBytes(spriteData[2*i])
				bytes = bytes.concat(colorToBytes(spriteData[2*i + 1]))
				for (var k = 0; k < 8; ++k) {
					thumb[8*i + k] = bytes[k]
				}

				octet = memory[i + 288*selDesign]
				spriteData[2*i] = (octet >> 4)
				spriteData[2*i + 1] = (octet & 15)
				pixCells[2*i].style.backgroundColor = colorToCSS(spriteData[2*i])
				pixCells[2*i + 1].style.backgroundColor = colorToCSS(spriteData[2*i + 1])
			}
			
			imd = new ImageData(thumb, 24, 24)
			var canvas = document.createElement('canvas')
			canvas.dataset.idx = prevSel
			canvas.width = 14
			canvas.height = 14
			var ctx = canvas.getContext('2d')
			ctx.putImageData(imd, 0, 0)
			cells[prevSel].innerHTML = ""
			cells[prevSel].appendChild(canvas)
			
			memoryUpdateHook(288*prevSel)
		})
	}
})
