var designData = []
var drawingColor = "#000000"
var drawingIdx = 0
var selDesign = 0

var designerDirty = false
var thumbsDirty = true

memoryUpdateHooks.push(function() {
	thumbsDirty = true
})

setInterval(function() {
	if (designerDirty) {
		localStorage.setItem("designdata", JSON.stringify(designData))
		localStorage.setItem("seldesign", selDesign)
		localStorage.setItem("memory", JSON.stringify(memory))
		designerDirty = false
	}
	
	if (thumbsDirty) {
		for (var i = 0; updateThumb(i); ++i) {}
		thumbsDirty = false
	}
	
	cells = tblMemory.getElementsByTagName("td")	
	if (cells[selDesign].style.background != "white") {
		cells[selDesign].style.background = "white"
	} else {
		cells[selDesign].style.background = "gray"
	}
}, 2000)

function sprEdit(ev) {
	ev.preventDefault()
	
	var i = ev.target.dataset.idx

	if (ev.buttons > 0) {
		ev.target.style.backgroundColor = drawingColor
		designData[i] = drawingIdx
	}

	divDgnStatus.innerHTML = Math.floor(i/24) + ":" + i%24 + "=" + 
			designData[i].toString(16)
}

function clearDesigner() {
	designData = []

	var pixCells = tblDesigner.getElementsByTagName("td")
	for(var i = 0; i < pixCells.length; ++i) {
		designData.push(drawingIdx)
		pixCells[i].style.backgroundColor = drawingColor
	}
}

pageLoadHooks.push(function() {
	if (window.navigator.userAgent.indexOf("Edge/") < 0 || window.location.protocol != "file:") {
		var designDataJson = localStorage.getItem("designdata")
		if (designDataJson == null) {
			clearDesigner()
		} else {
			designData = JSON.parse(designDataJson)
			updateDesign()
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
    }
	
	var pixCells = tblDesigner.getElementsByTagName("td")
	for(var i = 0; i < pixCells.length; ++i) {
		pixCells[i].addEventListener("mousedown", sprEdit);
		pixCells[i].addEventListener("mouseover", sprEdit);
		pixCells[i].addEventListener("mouseup", function() { designerDirty = true });
	}
	
	var cells = tblColors.getElementsByTagName("td")
	for(var i = 0; i < 16; ++i) {
		var cell = cells[i]
				
		cell.addEventListener("mousedown", function(ev) {
			setDrawingIndex(parseInt(ev.target.dataset.idx, 10))
		})
	}
	
	setDrawingIndex(7)
	
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

			if (cbGetDesign.checked) {
				designToMemory(prevSel)
				designFromMemory()
			}
		})
	}
	
	inMove.addEventListener("keyup", function(event) {
		if (event.keyCode == 38) { //up
			transformDesign(false, false, false, 0, -1)
		}
		if (event.keyCode == 37) { //left
			transformDesign(false, false, false, -1, 0)
		}
		if (event.keyCode == 39) { //right
			transformDesign(false, false, false, 1, 0)
		}
		if (event.keyCode == 40) { //down
			transformDesign(false, false, false, 0, 1)
		}
		if (event.keyCode >= 48 && event.keyCode <= 57) { //digit
			swapColor(event.keyCode - 48)
		}
		if (event.keyCode >= 65 && event.keyCode <= 71) { //A-F
			swapColor(event.keyCode - 55)
		}
		inMove.value = "MOVE"
	})
})

function designToMemory(designIdx) {
	if (designIdx === undefined) {
		designIdx = selDesign
	}
	
	for (var i = 0; i < 288; ++i) {
		var octet = ((designData[2*i]<<4)|designData[2*i + 1])
		memory[i + 288*designIdx] = octet
	}
	
	updateThumb(designIdx)
	memoryUpdateHook(288*designIdx)
	updateDownloadBlob()
	
	designerDirty = true
}

function designFromMemory() {
	for (var i = 0; i < 288; ++i) {
		octet = memory[i + 288*selDesign]
		if (!octet) octet = 0
		designData[2*i] = (octet >> 4)
		designData[2*i + 1] = (octet & 15)
	}
	
	updateDesign()
}

function updateDesign() {
	var pixCells = tblDesigner.getElementsByTagName("td")

	for (var i = 0; i < 288; ++i) {
		pixCells[2*i].style.backgroundColor = colorToCSS(designData[2*i])
		pixCells[2*i + 1].style.backgroundColor = colorToCSS(designData[2*i + 1])
	}
}

function updateThumb(designIndex) {
	cells = tblMemory.getElementsByTagName("td")
	var thumb = new Uint8ClampedArray(4*24*24)
	
	if (designIndex > 226) return false
	
	for (var i = 0; i < 288; ++i) {
		octet = memory[i + 288*designIndex]
		if (!octet) octet = 0
		var bytes = colorToBytes(octet>>4)
		bytes = bytes.concat(colorToBytes(octet&15))
		for (var k = 0; k < 8; ++k) {
			thumb[8*i + k] = bytes[k]
		}
	}

	imd = new ImageData(thumb, 24, 24)
	var canvas = document.createElement('canvas')
	canvas.dataset.idx = designIndex
	canvas.width = 15
	canvas.height = 15
	var ctx = canvas.getContext('2d')
	ctx.putImageData(imd, 0, 0)
	cells[designIndex].innerHTML = ""
	cells[designIndex].appendChild(canvas)
	
	return true
}

function transformDesign(hFlip, vFlip, transpose, dx, dy) {
	var transformed = []
	
	for (var ox = 0; ox < 24; ox++) {
		for (var oy = 0; oy < 24; oy++) {
			if (transpose) {
				var x = (oy + dy + 24)%24
				var y = (ox + dx + 24)%24
			} else {
				var x = (ox + dx + 24)%24
				var y = (oy + dy + 24)%24
			}
			
			if (hFlip) {
				x = 23 - x
			}
			
			if (vFlip) {
				y = 23 - y
			}
			
			transformed[x + 24*y] = designData[ox + 24*oy]
		}
	}
	
	designData = transformed
	
	updateDesign()
}

function swapColor(color) {
	var transformed = []
	
	for (var x = 0; x < 24; x++) {
		for (var y = 0; y < 24; y++) {
			var oi = designData[x + 24*y]
			if (oi == color) {
				transformed[x + 24*y] = drawingIdx
			} else if (oi == drawingIdx) {
				transformed[x + 24*y] = color
			} else {
				transformed[x + 24*y] = oi
			}
		}
	}
	
	setDrawingIndex(color)
	designData = transformed
	updateDesign()
}

function setDrawingIndex(colorIndex) {
	drawingColor = colorToCSS(colorIndex)
	drawingIdx = colorIndex

	var cells = tblColors.getElementsByTagName("td")
	for(var i = 0; i < 16; ++i) {
		var cell = cells[i]
		cell.style.backgroundColor = colorToCSS(i)
		cell.style.borderColor = (i == drawingIdx) ? "white" : "gray"
	}
}
