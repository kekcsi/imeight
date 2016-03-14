//Maximum of 72 sprites on screen

//Sprite state structures
//start address SPRITE_STATES as defined in memory.js

//all sprites:
//byte  |-------:-------:-------:-------|-------:-------:-------:-------|
//0		|rough X-coordinate (right edge in 4-pixel units)---------------|
//1		|rough Y-coordinate (bottom from screen top in 4-pixel units)---|
//2		|X offset (pixel accuracy)------|Y offset (pixel accuracy)------|

//mono sprites:
//byte  |-------:-------:-------:-------|-------:-------:-------:-------|
//3		|pixmap selector (hide sprite if < 4)---------------------------|
//4		|color----------------------------------------------------------|

//color sprites:
//byte  |-------:-------:-------:-------|-------:-------:-------:-------|
//3		|pixmap selector (4 pixmaps from byte3 & $fc)---:prio---:fill bg|
//4		|palette A------:palette B------|palette C------:palette D------|

//Sprite Positioning
//
//        ########################
//        ## 24 by 24 pixel ######
//        ## sprite         ######
//        ########################
//        #######  .  ############. ==== hot spot when offset = $0f
//        ####### $ff ############|
//        ########################|
//        ########################|
//        ########################|
//        ########################|
//        ########################|
//        #########fedcba987654321|
//                 '~~~~~~~~~~~~~~' ==== hot spot when offset = $00
//                $f0
//
// Screen position 0, 0 is the upper left corner of the screen.
// X coords ascend to the right, Y coords ascend downwards.
// Rough X and Y coordinates are interpreted as the screen coords of 
// the hot spot. See figure to determine hot spot relative to the
// sprite depending on the offset (i.e. byte #2 of the state struct.)
// Rough coords are meant in four-pixel-long units. Offsets are in
// one-pixel-long units.

//Sprite Rendering
//fill bg bit unset: pixels of color index 0 are transparent
//fill bg bit set: color for color index 0 taken from the palette

//Coloring layout
//AAAA
//BBBB
//CCCC
//DDDD

//Sprite color mode bits: 0 for mono, 1 for 16-color
//start address SPRITE_COLOR_MODE_BITS

//Priority over text layer depends on prio bit

var colorSpriteMirror = [] //color sprite interpretations
var monoSpriteMirror = [] //mono sprite interpretations

var spriteCanvases = []

function spriteInit() {
	for(var i = 0; i < 72; ++i) {
		var canvas = document.createElement("canvas")
		canvas.width = 48
		canvas.height = 48
		canvas.className = "sprite"
		spriteCanvases.push(canvas)
		document.body.appendChild(canvas)
	}
}

