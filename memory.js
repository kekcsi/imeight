var memory = []

//memory map:
//start---------------- end---- size--- purpose---------------- note--------------------------------------
//$0000		0			575		576		tile layer 				32*18
//$0240		576			639		64		16-color palettes		4*16
//$0280		640			999		360		sprite states			72*5
//$03E8		1000		1000	1		layering mode			sprite to text priority, text background
//$03E9		1001		1002	2		text colors				foreground, background
//$03EB		1003		1011	9		sprite color mode bits	72 bits
//$03F4		1012		1023	12		gap
//$0400		1024		2319	1296	text layer				48*27
//$0910		2320		2335	16		gap
//$0920		2336		20479	18144	pixmap array			Addressable 2048+72*idx where idx>=4
//$5000		20480		21503	1024	font bitmaps			1024*8 (codes 128 through 256 are inverts)

var TILE_LAYER = 0
var PALETTES = 576
var SPRITE_STATES = 640
var LAYER_MODE = 1000
var TEXT_FG_COLOR = 1001
var TEXT_BG_COLOR = 1002
var SPRITE_COLOR_MODE_BITS = 1003
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
			dirtyPalettes[Math.floor((addr - PALETTES)>>4)] = true
		}
	}

	var tilePm = dirtyPixmaps.slice()

	//palette update
	if(dirtyPalettes.length > 0) {
		updatePalettes()

		//also invalidate affected pixmaps (tiles)
		for(var i = 0; i < 255; ++i) {
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
