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
		desigerDirty = false
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
	var i = ev.target.dataset.idx

	if (ev.buttons > 0) {
		ev.target.style.backgroundColor = drawingColor
		designData[i] = drawingIdx
	}

	divDgnStatus.innerHTML = Math.floor(i/24) + ":" + i%24 + "=" + designData[i]
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
		var spriteDataJson = localStorage.getItem("designdata")
		if (spriteDataJson == null) {
			clearDesigner()
		} else {
			designData = JSON.parse(spriteDataJson)
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
	
	designFromMemory()
	
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

			if (cbGetDesign.checked) {
				designToMemory(prevSel)
				designFromMemory()
			}
		})
	}
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
}

function designFromMemory() {
	var pixCells = tblDesigner.getElementsByTagName("td")

	for (var i = 0; i < 288; ++i) {
		octet = memory[i + 288*selDesign]
		if (!octet) octet = 0
		designData[2*i] = (octet >> 4)
		designData[2*i + 1] = (octet & 15)
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
