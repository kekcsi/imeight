var memory = []

//memory map:
//start---------------- end---- size--- purpose---------------- note--------------------------------------
//$0000		0			575		576		tile layer 				32*18
//$0240		576			639		64		16-color palettes		4*16
//$0280		640			999		360		sprite states			72*5
//$03E8		1000		1000	1		text color selectors 	4*2 bits: fg, bg; codes 1..127, 128..255; transparent/one of the 3 colors
//$03E9		1001		1003	3		text/border palette of 	3 color definitions
//$03EC		1004		1004	1		border color selectors	4*2 bits: top, bottom, left, right; transparent/one of the 3 colors
//$03ED		1005		1005	1		text layer offset		2*4 bits: horizontal, vertical
//$03EE		1006		1006	1		tile layer offset		2*4 bits: horizontal, vertical
//$03EF		1007		1015	9		sprite color mode bits	72 bits
//$03F8		1016		1023	8		program entries			main program, time interrupt, key event, user/collision event handler
//$0400		1024		2319	1296	text layer				48*27
//$0910		2320		2335	16		gap
//$0920		2336		20479	18144	pixmap array			Addressable 2048+72*idx where idx>=4
//$5000		20480		20480	1   	play/stop bits			8 bits
//$5001		20481		21503	1023	font bitmaps			128*8 (codes 128 through 256 are inverts)
//$5400		21504		21519	16		sound					2*8 (8 channels, 1 word for position)

var TILE_LAYER = 0
var PALETTES = 576
var SPRITE_STATES = 640
var TEXT_COLORS = 1000
var COLOR_1 = 1001
var COLOR_2 = 1002
var COLOR_3 = 1003
var BORDER_COLORS = 1004
var TEXT_LAYER_OFFSET = 1005
var TILE_LAYER_OFFSET = 1006
var SPRITE_COLOR_MODE_BITS = 1007
var PROGRAM_ENTRY = 1016
var TIME_INT_ENTRY = 1018
var KEY_INT_ENTRY = 1020
var USER_INT_ENTRY = 1022
var TEXT_LAYER = 1024
var PIXMAP_ORIGO = 2048
var FONT_ORIGO = 20480

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
