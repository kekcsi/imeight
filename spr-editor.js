var selSlot = 0

var designData = []
var drawingColor = "#000000"
var drawingIdx = 0

var designModes = []
var designModeMap = []

var fontData = []
var selGlyph = 0

var designerDirty = false
var thumbsDirty = true

var mouseButtons = 0 // instead of event.buttons for Edge compatibility

memoryUpdateHooks.push(function() {
	thumbsDirty = true
})

setInterval(function() {
	if (designerDirty) {
		if (window.navigator.userAgent.indexOf("Edge/") < 0 || window.location.protocol != "file:") {
			localStorage.setItem("designdata", JSON.stringify(designData))
			localStorage.setItem("fontdata", JSON.stringify(fontData))
			localStorage.setItem("selslot", selSlot)
			localStorage.setItem("selglyph", selGlyph)
			localStorage.setItem("memory", JSON.stringify(memory))
			localStorage.setItem("designmodemap", JSON.stringify(designModeMap))
		}

		designerDirty = false
	}
	
	if (thumbsDirty) {
		for (var i = 0; updateThumb(i); ++i) {}
		thumbsDirty = false
	}
	
	cells = tblMemory.getElementsByTagName("td")	
	if (cells[selSlot].style.background != "white") {
		cells[selSlot].style.background = "white"
	} else {
		cells[selSlot].style.background = "gray"
	}
}, 2000)

function changeDesignMode() {
	designModeMap[selSlot]++
	designModeMap[selSlot]%=designModes.length
	updateDesignMode()
	
	designFromMemory()
}

function updateDesignMode() {
	var m = designModeMap[selSlot]
	for (var i in designModes) {
		designModes[i].tab.style.display = ((m == i)?"block":"none")
	}
	
	setDrawingIndex(7)
}

function updateFont() {
	var tbl = document.getElementById("tblDesignerGlyph")
	var cells = tbl.getElementsByTagName("td")
	
	for (var i = 0; i < 64; i++) {
		cells[i].style.backgroundColor = (fontData[i] ? colorToCSS(7) : "black")
	}
}

function goFont(glyphIdx) {
	if (cbGetDesign.checked) {
		fontToMemory(selSlot, selGlyph)
	}

	var anchs = divGlyph.getElementsByTagName("a")
	anchs[selGlyph].style.backgroundColor = "gray"
	
	selGlyph = isNaN(glyphIdx) ? glyphIdx.charCodeAt(0) - 55 : glyphIdx

	anchs[selGlyph].style.backgroundColor = "white"
	
	if (cbGetDesign.checked) {
		fontFromMemory()
	}
}

function fontEdit(ev) {
	ev.preventDefault()
	
	var i = ev.target.dataset.idx

	if (!mouseButtons && ev.buttons > 0) {
		drawingIdx = !fontData[i]
		drawingColor = colorToCSS(7*drawingIdx)
	}

	if (mouseButtons > 0 || ev.buttons > 0) {
		ev.target.style.backgroundColor = drawingColor
		fontData[i] = drawingIdx
	}

	divDgnStatus.innerHTML = Math.floor(i/8) + ":" + i%8 + "=" + 
			fontData[i]
}

function sprEdit(ev) {
	ev.preventDefault()
	
	var i = ev.target.dataset.idx

	if (mouseButtons > 0 || ev.buttons > 0) {
		ev.target.style.backgroundColor = drawingColor
		designData[i] = drawingIdx
	}

	divDgnStatus.innerHTML = Math.floor(i/24) + ":" + i%24 + "=" + 
			designData[i].toString(16)
}

function clearDesigner() {
	designData = []

	var pixCells = tblDesigner.getElementsByTagName("td")
	for (var i = 0; i < pixCells.length; ++i) {
		designData[i] = drawingIdx
		pixCells[i].style.backgroundColor = drawingColor
	}
	
	var bitCells = tblDesignerGlyph.getElementsByTagName("td")
	for (var j = 0; j < bitCells.length; ++j) {
		fontData[j] = 0
		bitCells[j].style.backgroundColor = "black"
	}
}

function clearDesignModes() {
	designModeMap = []
	
	for (var i = 0; i < 227; i++) {
		designModeMap[i] = 0
	}
}

pageLoadHooks.push(function() {
	designModes = [{ tab: tabSprTile, put: sprToMemory, get: sprFromMemory, data: "designData", thumb: sprThumb }, 
			{ tab: tabFont, put: fontToMemory, get: fontFromMemory, data: "fontData", thumb: fontThumb }]
	
	clearDesigner()
	clearDesignModes()

	if (window.navigator.userAgent.indexOf("Edge/") < 0 || window.location.protocol != "file:") {
		var designDataJson = localStorage.getItem("designdata")
		if (designDataJson) {
			designData = JSON.parse(designDataJson)
			updateDesign()
		}

		var fontDataJson = localStorage.getItem("fontdata")
		if (fontDataJson) {
			fontData = JSON.parse(fontDataJson)
			updateFont()
		}

		selSlot = localStorage.getItem("selslot")
		if (selSlot == null) selSlot = 0
		inPointer.value = 288*selSlot					

		selGlyph = localStorage.getItem("selglyph")
		if (selGlyph == null) selGlyph = 0
		
		designModeMapJson = localStorage.getItem("designmodemap")
		if (designModeMapJson) {
			designModeMap = JSON.parse(designModeMapJson)
		}

		var memoryJson = localStorage.getItem("memory")
		if (memoryJson) {
			memory = JSON.parse(memoryJson)
		}
	}

	var anchs = divGlyph.getElementsByTagName("a")
	anchs[selGlyph].style.backgroundColor = "white"

	document.body.addEventListener("mousedown", function(ev) {
		mouseButtons = 1
	})
	document.body.addEventListener("mouseup", function(ev) {
		mouseButtons = 0
	})
	
	var pixCells = tblDesigner.getElementsByTagName("td")
	for(var i = 0; i < pixCells.length; ++i) {
		pixCells[i].addEventListener("mousedown", sprEdit);
		pixCells[i].addEventListener("mouseover", sprEdit);
		pixCells[i].addEventListener("mouseup", function() { designerDirty = true })
	}
	
	var tdg = document.getElementById("tblDesignerGlyph")
	var bitCells = tdg.getElementsByTagName("td")
	for(var i = 0; i < bitCells.length; ++i) {
		bitCells[i].addEventListener("mousedown", fontEdit);
		bitCells[i].addEventListener("mouseover", fontEdit);
		bitCells[i].addEventListener("mouseup", function() { designerDirty = true })
	}
	
	var cells = tblColors.getElementsByTagName("td")
	for(var i = 0; i < 16; ++i) {
		var cell = cells[i]
				
		cell.addEventListener("mousedown", function(ev) {
			setDrawingIndex(parseInt(ev.target.dataset.idx, 10))
		})
	}
	
	updateDesignMode()
	
	cells = tblMemory.getElementsByTagName("td")
	for(var j = 0; j < 227; ++j) {
		var cell = cells[j]
		
		if (!designModeMap[j]) {
			designModeMap[j] = 0
		}
		
		cell.addEventListener("mousedown", function(ev) {
			var prevSel = selSlot
			selSlot = parseInt(ev.target.dataset.idx, 10)
			
			inPointer.value = 288*selSlot					
			cells[prevSel].style.background = "black"
			cells[selSlot].style.background = "white"

			if (cbGetDesign.checked) {
				designToMemory(prevSel)
				updateDesignMode()
				designFromMemory()
			} else {
				designModeMap[selSlot] = designModeMap[prevSel]
			}
		})
	}
	
	inMove.addEventListener("keydown", function(event) {
		event.preventDefault()
		
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
		inMove.value = "<>"
	})

	inMove.value = "<>"
})

function designToMemory(designIdx) {
	if (designIdx === undefined) {
		designIdx = selSlot
	}
	
	var putFn = designModes[designModeMap[designIdx]].put
	putFn(designIdx)
	
	updateThumb(designIdx)
	memoryUpdateHook(288*designIdx)
	updateDownloadBlob()
	designerDirty = true
}

function sprToMemory(designIdx) {
	for (var i = 0; i < 288; ++i) {
		var octet = ((designData[2*i]<<4)|designData[2*i + 1])
		memory[i + 288*designIdx] = octet
	}
}

function fontToMemory(designIdx, glyph) {
	if (glyph === undefined) {
		glyph = selGlyph
	}
	
	for (var ro = 0; ro < 8; ++ro) {
		by = 0

		for (var co = 0; co < 8; ++co) {
			by = (fontData[8*ro + co] | (by<<1))
		}

		memory[288*designIdx + 8*glyph + ro] = by
	}
}

function designFromMemory() {
	var getFn = designModes[designModeMap[selSlot]].get
	getFn()
}

function sprFromMemory() {
	for (var i = 0; i < 288; ++i) {
		octet = memory[i + 288*selSlot]
		if (!octet) octet = 0
		designData[2*i] = (octet >> 4)
		designData[2*i + 1] = (octet & 15)
	}
	
	updateDesign()
}

function fontFromMemory() {
	for (var ro = 0; ro < 8; ro++) {
		var by = memory[selSlot*288 + selGlyph*8 + ro]

		for (var co = 0; co < 8; co++) {
			fontData[8*ro + co] = ((by>>(7 - co))&1)
		}
	}

	updateFont()
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
	var thumb = new Uint8ClampedArray(4*16*16)
	
	if (designIndex > 226) return false
	
	genThumb(designIndex, thumb)

	imd = new ImageData(thumb, 16, 16)
	var canvas = document.createElement('canvas')
	canvas.dataset.idx = designIndex
	canvas.width = 16
	canvas.height = 16
	var ctx = canvas.getContext('2d')
	ctx.putImageData(imd, 0, 0)
	cells[designIndex].innerHTML = ""
	cells[designIndex].appendChild(canvas)
	
	return true
}

function genThumb(designIndex, thumb) {
	designModes[designModeMap[designIndex]].thumb(designIndex, thumb)
}

function sprThumb(designIndex, thumb) {
	for (var ro = 0; ro < 16; ++ro) {
		for (var co = 0; co < 16; ++co) {
			var i = 12*Math.floor(ro*3/2) + Math.floor(co*3/4)
			
			octet = memory[i + 288*designIndex]
			if (!octet) octet = 0
			var bytes = ((co%2) ? colorToBytes(octet&15) : colorToBytes(octet>>4))

			for (var k = 0; k < 4; ++k) {
				thumb[4*co + 64*ro + k] = bytes[k]
			}
		}
	}
}

function fontThumb(designIndex, thumb) {
	var glyphs = [0, 1, 10, 11]
	var xoffs = [0, 8, 0, 8]
	var yoffs = [0, 0, 8, 8]

	for (var gi in glyphs) {
		var glyph = glyphs[gi]
		var xoff = xoffs[gi]
		var yoff = yoffs[gi]
		
		for (var ro = 0; ro < 8; ro++) {
			var by = memory[designIndex*288 + glyph*8 + ro]

			for (var co = 0; co < 8; co++) {
				var bit = ((by>>(7 - co))&1)

				var tup = [(bit ? 255 : 0), 0, 0, (bit ? 255 : 0)]
				
				for (var k = 0; k < 4; k++) {
					thumb[k + 4*(16*(ro + yoff) + co + xoff)] = tup[k]
				}
			}
		}
	}
}

function transformDesign(hFlip, vFlip, transpose, dx, dy) {
	var transformed = []
	
	var data = window[designModes[designModeMap[selSlot]].data]
	var sz = Math.sqrt(data.length)
	
	for (var ox = 0; ox < sz; ox++) {
		for (var oy = 0; oy < sz; oy++) {
			if (transpose) {
				var x = (oy + dy + sz)%sz
				var y = (ox + dx + sz)%sz
			} else {
				var x = (ox + dx + sz)%sz
				var y = (oy + dy + sz)%sz
			}
			
			if (hFlip) {
				x = sz - x - 1
			}
			
			if (vFlip) {
				y = sz - y - 1
			}
			
			transformed[x + sz*y] = data[ox + sz*oy]
		}
	}
	
	for (var i = 0; i < data.length; i++) {
		data[i] = transformed[i]
	}
	
	updateDesign()
	updateFont()
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
