var selSlot = 0

var designData = []
var drawingColor = "#000000"
var drawingIdx = 0

var designModes = []
var designModeMap = []

var fontData = []
var selGlyph = 0
var activePad

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
	var m = designModes[designModeMap[selSlot]]
	var tSel = m.tab
	for (var i in designModes) {
		var t = designModes[i].tab
		designModes[i].tab.style.display = ((tSel == t)?"block":"none")
	}
	
	m.init()
}

function updateFont() {
	if (selGlyph == 36) {
		tblDesignerGlyph.style.display = "none"
		fontOverviewCanvas.style.display = "block"

		var wt = 48
		var arr = new Uint8ClampedArray(4*wt*48)
		var glyph = 0
		for (var y = 0; y < 48; y+=8) {
			for (var x = 0; x < 48; x+=8) {
				for (var ro = 0; ro < 8; ro++) {
					for (var co = 0; co < 8; co++) {
						var bit = fontData[co + 8*ro][glyph]
						var tup = [(bit ? 255 : 0), 0, 0, (bit ? 255 : 0)]
					
						for (var k = 0; k < 4; k++) {
							arr[k + 4*(wt*(ro + y) + co + x)] = tup[k]
						}
					}
				}
				glyph++
			}
		}
		var imd = new ImageData(arr, 48, 48)
		var ctx = fontOverviewCanvas.getContext('2d')
		ctx.putImageData(imd, 0, 0)

		return
	}
	
	var cells = tblDesignerGlyph.getElementsByTagName("td")
	
	for (var i = 0; i < 64; i++) {
		cells[i].style.backgroundColor = (fontData[i] ? colorToCSS(7) : "black")
	}
}

function goFont(glyphIdx) {
	if (cbGetDesign.checked) {
		fontToMemory(selSlot, selGlyph)
	}

	var anchs = activePad.getElementsByTagName("a")
	anchs[selGlyph].style.backgroundColor = "gray"
	
	selGlyph = isNaN(glyphIdx) ? glyphIdx.charCodeAt(0) - 55 : glyphIdx

	anchs[selGlyph].style.backgroundColor = "white"
	
	if (cbGetDesign.checked) {
		fontFromMemory()
	}
	
	if (glyphIdx == 36) {
		tblDesignerGlyph.style.display = "none"
		fontOverviewCanvas.style.display = "block"
	} else {
		tblDesignerGlyph.style.display = "table"
		fontOverviewCanvas.style.display = "none"
	}
}

function fontEdit(ev) {
	ev.preventDefault()
	
	var i = ev.target.dataset.idx

	if (!mouseButtons && ev.buttons > 0) {
		drawingIdx = (fontData[i]?0:1)
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
	
	var ctx = fontOverviewCanvas.getContext("2d")
	ctx.fillStyle = "black"
	ctx.fillRect(0, 0, 48, 48)
}

function clearDesignModes() {
	designModeMap = []
	
	for (var i = 0; i < 227; i++) {
		designModeMap[i] = 0
	}
}

pageLoadHooks.push(function() {
	designModes = [
		{ 
			tab: tabSprTile, 
			init: function() { setDrawingIndex(7) }, 
			put: sprToMemory, get: sprFromMemory, 
			data: "designData", thumb: sprThumb 
		}, 
		{ 
			tab: tabFont, 
			init: function() { divPad1.style.display = "block"; divPad2.style.display = "none"; activePad = divPad1 },
			put: fontToMemory, get: fontFromMemory, 
			data: "fontData", thumb: fontThumb 
		},
		{ 
			tab: tabFont, 
			init: function() { divPad1.style.display = "none"; divPad2.style.display = "block"; activePad = divPad2 },
			put: fontToMemory, get: fontFromMemory, 
			data: "fontData", thumb: fontThumb 
		},
		{ 
			tab: tabHex, 
			init: function() {},
			put: hexToMemory, get: hexFromMemory, 
			data: "designData", thumb: hexThumb 
		}
	]
	
	clearDesigner()
	clearDesignModes()

	if (window.navigator.userAgent.indexOf("Edge/") < 0 || window.location.protocol != "file:") {
		selSlot = localStorage.getItem("selslot")
		if (selSlot == null) selSlot = 0
		inPointer.value = 288*selSlot					

		selGlyph = localStorage.getItem("selglyph")
		if (selGlyph == null) selGlyph = 0
		
		designModeMapJson = localStorage.getItem("designmodemap")
		if (designModeMapJson) {
			designModeMap = JSON.parse(designModeMapJson)
		}

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

		var memoryJson = localStorage.getItem("memory")
		if (memoryJson) {
			memory = JSON.parse(memoryJson)
		}
	}

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
	
	fontOverviewCanvas.addEventListener("mousemove", function(ev) {
		var i = Math.floor(ev.offsetX/8) + 6*Math.floor(ev.offsetY/8)
		if (i > 9) {
			divDgnStatus.innerHTML = String.fromCharCode(i + 55)
		} else {
			divDgnStatus.innerHTML = "" + i
		}
	})
	
	var cells = tblColors.getElementsByTagName("td")
	for(var i = 0; i < 16; ++i) {
		var cell = cells[i]
				
		cell.addEventListener("mousedown", function(ev) {
			setDrawingIndex(parseInt(ev.target.dataset.idx, 10))
		})
	}
	
	updateDesignMode()

	if (activePad) {
		var anchs = activePad.getElementsByTagName("a")
		anchs[selGlyph].style.backgroundColor = "white"
	}
	
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
	
	tabSprTile.addEventListener("keypress", function(event) {
		var idx = parseInt(String.fromCharCode(event.charCode), 16)
		if (isNaN(idx)) return
		
		event.preventDefault()
		setDrawingIndex(idx)
	})
})

function designToMemory(designIdx) {
	if (designIdx === undefined) {
		designIdx = selSlot
	}
	
	var putFn = designModes[designModeMap[designIdx]].put
	putFn(designIdx)
	
	updateThumb(designIdx)
	memoryUpdateHook(288*designIdx)
	designerDirty = true
}

function hexToMemory(designIdx) {
	var hex = taHex.value.replace(/[^0-9A-Fa-f]/g, "")

	if (hex.length != 2*288) {
		divDgnStatus.innerHTML = "BAD FORMAT"
		return
	}

	for (var b = 0; b < 288; b++) {
		memory[designIdx*288 + b] = parseInt(hex.substring(2*b, 2*b + 2), 16)
	}
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
		if (glyph < 36) {
			by = 0

			for (var co = 0; co < 8; ++co) {
				by = (fontData[8*ro + co] | (by<<1))
			}

			memory[288*designIdx + 8*glyph + ro] = by
		} else {
			for (var g = 0; g < 36; g++) {
				by = 0

				for (var co = 0; co < 8; ++co) {
					by = (fontData[8*ro + co][g] | (by<<1))
				}

				memory[288*designIdx + 8*g + ro] = by
			}
		}
	}
}

function designFromMemory() {
	var getFn = designModes[designModeMap[selSlot]].get
	getFn()
}

function hexFromMemory() {
	taHex.value = ""
	var sep = ""
	
	for (var lin = 0; lin < 288; lin+=16) {
		taHex.value += sep
		sep = "\n"

		for (var b = 0; b < 16; b++) {
			var by = memory[selSlot*288 + b + lin]
			taHex.value += (by>>4).toString(16)
			taHex.value += (by&15).toString(16)
		}
	}
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

		if (selGlyph < 36) {
			var by = memory[selSlot*288 + selGlyph*8 + ro]

			for (var co = 0; co < 8; co++) {
				fontData[8*ro + co] = ((by>>(7 - co))&1)
			}
		} else {
			for (var co = 0; co < 8; co++) {
				fontData[8*ro + co] = []

				for (var g = 0; g < 36; g++) {
					var by = memory[selSlot*288 + g*8 + ro]
					fontData[8*ro + co][g] = ((by>>(7 - co))&1)
				}
			}
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
	var thumb = new Uint8ClampedArray(4*24*24)
	
	if (designIndex > 226) return false
	
	genThumb(designIndex, thumb)

	imd = new ImageData(thumb, 24, 24)
	var canvas = document.createElement('canvas')
	canvas.dataset.idx = designIndex
	canvas.width = 24
	canvas.height = 24
	var ctx = canvas.getContext('2d')
	ctx.putImageData(imd, 0, 0)
	cells[designIndex].innerHTML = ""
	cells[designIndex].appendChild(canvas)
	
	return true
}

function genThumb(designIndex, thumb) {
	designModes[designModeMap[designIndex]].thumb(designIndex, thumb)
}

function hexThumb(designIndex, thumb) {
	for (var b in thumb) {
		thumb[b] = 255
	}
}

function sprThumb(designIndex, thumb) {
	for (var ro = 0; ro < 24; ++ro) {
		for (var co = 0; co < 24; ++co) {
			var i = 12*ro + Math.floor(co/2)
			
			octet = memory[i + 288*designIndex]
			if (!octet) octet = 0
			var bytes = ((co%2) ? colorToBytes(octet&15) : colorToBytes(octet>>4))

			for (var k = 0; k < 4; ++k) {
				thumb[4*(24*ro + co) + k] = bytes[k]
			}
		}
	}
}

function fontThumb(designIndex, thumb) {
	var glyphs = [0, 1, 2, 10, 11, 12, 13, 14, 15]
	var xoffs = [0, 8, 16, 0, 8, 16, 0, 8, 16]
	var yoffs = [0, 0, 0, 8, 8, 8, 16, 16, 16]
	
	for (var gi in glyphs) {
		var glyph = glyphs[gi]
		var xoff = xoffs[gi]
		var yoff = yoffs[gi]
		charGen(designIndex, thumb, glyph, xoff, yoff, 24)
	}
}

function fontOverview(designIndex, arr) {
	var glyph = 0
	for (var y = 0; y < 48; y+=8) {
		for (var x = 0; x < 48; x+=8) {
			charGen(designIndex, arr, glyph, x, y, 48)
			glyph++
		}
	}
}

function charGen(designIndex, thumb, glyph, xoff, yoff, wt) {
	for (var ro = 0; ro < 8; ro++) {
		var by = memory[designIndex*288 + glyph*8 + ro]

		for (var co = 0; co < 8; co++) {
			var bit = ((by>>(7 - co))&1)

			var tup = [(bit ? 255 : 0), 0, 0, (bit ? 255 : 0)]
			
			for (var k = 0; k < 4; k++) {
				thumb[k + 4*(wt*(ro + yoff) + co + xoff)] = tup[k]
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
