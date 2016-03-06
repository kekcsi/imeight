//Start address: TILE_LAYER as defined in memory.js
//Each byte 
//  * corresponds to a position in the 18-row 32-column screen matrix
//  * indexes the pixmap array: displayed tile pixmap start address is 2048 + 72*idx
//  * should be >= 4, otherwise text layer bytes addressed
//  * also selects a 16-color palette in its higher 2 bits

//array of canvas imagedata objects that correspond to the pixmap array in the memory
var tileMirror = []

//the canvas to draw on
var tileCanvas
var tileCtx

function tileInit() {
	tileCanvas = document.getElementById("tile-layer")
	tileCtx = tileCanvas.getContext("2d")
}

//call when TILE_LAYER changes in memory - display tile accordingly
function tileLayerChange(tilePos) {
	var pixmapIdx = memory[TILE_LAYER + tilePos]
	if(tileMirror[pixmapIdx]) {
		tileCtx.putImageData(tileMirror[pixmapIdx], (tilePos&31)*24, (tilePos>>5)*24)
	}
}

//call when pixmap array in memory changed - updates imagedata
//assumes that palette mirror is already up to date
function tilePixmapChange(pixmapIdx) {
	var address = pixmapIdx*72 + PIXMAP_ORIGO
	
	//create tile
	var tileData = tileCtx.createImageData(24, 24)
	var selectedPal = paletteMirror[pixmapIdx >> 6]

	var i = 0
	var p = address
	var r, g, b
	for (var y = 0; y < 12; ++y)
	{
		for (var bo = 0; bo < 6; ++bo)
		{
			//fetch color data for the color index in the low nibble
			var colorLo = selectedPal[memory[p] & 15]
			r = colorLo[0]
			g = colorLo[1]
			b = colorLo[2]
			
			//zoom this imaginary pixel to four real pixels
			tileData.data[i + 0] = r
			tileData.data[i + 1] = g
			tileData.data[i + 2] = b
			tileData.data[i + 3] = 255
			tileData.data[i + 4] = r
			tileData.data[i + 5] = g
			tileData.data[i + 6] = b
			tileData.data[i + 7] = 255
			tileData.data[i + 96] = r
			tileData.data[i + 97] = g
			tileData.data[i + 98] = b
			tileData.data[i + 99] = 255
			tileData.data[i + 100] = r
			tileData.data[i + 101] = g
			tileData.data[i + 102] = b
			tileData.data[i + 103] = 255

			i+=8

			//fetch color data for the color index in the high nibble
			var colorHi = selectedPal[memory[p] >> 4]
			r = colorHi[0]
			g = colorHi[1]
			b = colorHi[2]
			
			//zoom this imaginary pixel to four real pixels
			tileData.data[i + 0] = r
			tileData.data[i + 1] = g
			tileData.data[i + 2] = b
			tileData.data[i + 3] = 255
			tileData.data[i + 4] = r
			tileData.data[i + 5] = g
			tileData.data[i + 6] = b
			tileData.data[i + 7] = 255
			tileData.data[i + 96] = r
			tileData.data[i + 97] = g
			tileData.data[i + 98] = b
			tileData.data[i + 99] = 255
			tileData.data[i + 100] = r
			tileData.data[i + 101] = g
			tileData.data[i + 102] = b
			tileData.data[i + 103] = 255

			i+=8
			++p
		}

		//skip a raster line (already filled)
		i+=96
	}

	tileMirror[pixmapIdx] = tileData
}

function updateOnscreenTiles(dirtyPixmaps) {
	//iterate over the tile layer updating only those dirty pixmaps that are shown on screen
	for(var tilePos = 0; tilePos < 576; ++tilePos) {
		var pixmapIdx = memory[TILE_LAYER + tilePos]
		
		if(dirtyPixmaps[pixmapIdx] === undefined) {
			//tile is not affected
			continue
		}
		
		if(dirtyPixmaps[pixmapIdx]) {
			//neither canvas nor pixmap mirror has been updated
			tilePixmapChange(pixmapIdx)
			dirtyPixmaps[pixmapIdx] = false
		}
		
		if(dirtyPixmaps[pixmapIdx] === false) {
			//pixmap already up to date but canvas still to be updated in this position
			tileCtx.putImageData(tileMirror[pixmapIdx], (tilePos&31)*24, (tilePos>>5)*24)
		}
	}
}
