var memory = []

//memory map:
//start---------------- end---- size--- purpose---------------- note--------------------------------------
//$0000		0			575		576		tile layer 				32*18
//$0240		576			639		64		16-color palettes		4*16
//$0280		640			999		360		sprite states			72*5
//$03E8		1000		1000	1		layering mode			text background; borders on/off (horizontal, vertical)
//$03E9		1001		1002	2		text colors				foreground, background
//$03EB		1003		1003	1		tile layer offsets		2*4 bits: horizontal, vertical
//$03EC		1004		1012	9		sprite color mode bits	72 bits
//$03F5		1013		1023	11		gap
//$0400		1024		2319	1296	text layer				48*27
//$0910		2320		2335	16		gap
//$0920		2336		20479	18144	pixmap array			Addressable 2048+72*idx where idx>=4
//$5000		20480		21503	1024	font bitmaps			128*8 (codes 128 through 256 are inverts)
//$5400		21504		21520	17		sound					2*8 + 1 (8 channels, 1 word for position + 1 play/stop bit each)

var TILE_LAYER = 0
var PALETTES = 576
var SPRITE_STATES = 640
var LAYER_MODE = 1000
var TEXT_FG_COLOR = 1001
var TEXT_BG_COLOR = 1002
var TILE_LAYER_OFFSET = 1003
var SPRITE_COLOR_MODE_BITS = 1004
var TEXT_LAYER = 1024
var PIXMAP_ORIGO = 2048
var FONT = 20480

var dirtyAddresses = []

function updateDirtyMirrors() {
	dirtyPixmaps = []
	dirtyPalettes = []

	//Console.log("dirty " + dirtyAddresses.length)

	//iterate over dirty addresses
	for(var i = 0; i < dirtyAddresses.length; ++i) {
		//set corresponding dirty flag
		var addr = dirtyAddresses[i]
		if((addr >= PIXMAP_ORIGO) && (addr < PIXMAP_ORIGO + 256*72)) {
			dirtyPixmaps[Math.floor((addr - PIXMAP_ORIGO)/72)] = true
		} else if((addr >= PALETTES) && (addr < PALETTES + 64)) {
			dirtyPalettes[(addr - PALETTES)>>4] = true
		} else if((addr >= TILE_LAYER) && (addr < TILE_LAYER + 32*18)) {
			tileLayerChange(addr - TILE_LAYER)
		}
	}

	var tilePm = dirtyPixmaps.slice()

	//palette update
	if(dirtyPalettes.length > 0) {
		updatePalettes()

		//also invalidate affected pixmaps (tiles)
		for(var i = 0; i < 256; ++i) {
			if(dirtyPalettes[i>>6]) {
				tilePm[i] = true
			}
		}
	}
	
	//check if on-screen tiles are affected
	updateOnscreenTiles(tilePm)
	
	//check if on-screen sprites are affected
	//updateOnscreenColorSprites(dirtyPixmaps.slice())
	//updateOnscreenMonoSprites(dirtyPixmaps.slice())
	
	dirtyAddresses = []
}

var writeMemory

if(DEBUG) {
	writeMemory = function(addr, value) {
		memory[addr] = value
		dirtyAddresses.push(addr)
		
		if((addr > 65535) || (addr < 0) || (addr != Math.floor(addr))) {
			console.log("Invalid address  in writeMemory [*" + addr + "] <== " + value)
		}
		if((value > 255) || (value < 0) || (value != Math.floor(value))) {
			console.log("Invalid value  in writeMemory " + addr + " <== [*" + value + "]")
		}
	}
} else {
	writeMemory = function(addr, value) {
		memory[addr] = value
		dirtyAddresses.push(addr)
	}
}
