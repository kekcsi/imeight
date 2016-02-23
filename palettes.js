//Start address: PALETTES as defined in memory.js
//array of four 16-color palettes
//used for tiles and color sprites

//tiles: 
// * palette 0 applied to pixmaps 4..63
// * palette 1 applied to pixmaps 64..127
// * palette 2 applied to pixmaps 128..191
// * palette 3 applied to pixmaps 192..255

//color sprites:
//  byte 3 lower two bits select palette

//the rgb representation of all the 256 possible colors
var possibleColors

//rgb interpretations of the bytes in memory at PALETTES
//TODO really mirror memory, now it contains test colors
var paletteMirror

var HUES = [
	0, //red
	1/24,
	2/24, //orange
	3/24,
	4/24, //yellow
	6/24, //lime
	8/24, //green
	10/24,
	11/24,
	12/24, //cyan
	14/24,
	16/24, //blue
	18/24,
	20/24, //magenta
	21/24,
	22/24
]

function hue2rgb(p, q, t) {
	if(t < 0) t += 1;
	if(t > 1) t -= 1;
	if(t < 1/6) return p + (q - p)*6*t;
	if(t < 1/2) return q;
	if(t < 2/3) return p + (q - p)*(2/3 - t)*6;
	return p;
}

function hsl2rgb(h, s, l){
    var r, g, b;

	var q = l < 0.5 ? l*(1 + s) : l + s - l*s;
	var p = 2*l - q;
	r = hue2rgb(p, q, h + 1/3);
	g = hue2rgb(p, q, h);
	b = hue2rgb(p, q, h - 1/3);

    return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}

function hsv2rgb(h, s, v) {
    var i = Math.floor(h*6)
    var f = h*6 - i
    var m = Math.round(255*v*(1 - s))
    var n = Math.round(255*v*(1 - s*f))
    var k = Math.round(255*v*(1 - s*(1 - f)))
    var w = Math.round(255*v)

    switch (i) {
        case 0:
            return [w, k, m]
        case 1:
            return [n, w, m]
        case 2:
            return [m, w, k]
        case 3:
            return [m, n, w]
        case 4:
            return [k, m, w]
        case 5:
        case 6:
            return [w, m, n]
    }
}

function paletteInit() {
	possibleColors = []

	//000LLLLL - grayscale (i.e. HLS at saturation 0)
	for(var L = 0; L < 32; ++L) {
		var l = Math.round(L*255/31)
		possibleColors.push([l, l, l])
	}

	//0SSHHHLL[S > 0] - HLS palette at saturations 0.25, 0.50 and 0.75
	for(var S = 1; S < 4; ++S) {
		for(var H = 0; H < 8; ++H) {
			//light levels: 0.2, 0.4, 0.6, 0.8
			//(black and white only present in the grayscale)
			for(var L = 1; L < 5; ++L) { 
				possibleColors.push(hsl2rgb(HUES[H<<1], S/4, L/5))
			}
		}
	}

	//1HHHHVVV - HSV palette at saturation 1.00
	for(var H = 0; H < 16; ++H) {
		//value levels: 1/8 through 8/8
		for(var V = 1; V < 9; ++V) {
			possibleColors.push(hsv2rgb(HUES[H], 1.0, V/8))
		}
	}

	paletteMirror = [[], [], [], []]
}

function updatePalettes() {
	for(var i = 0; i < 4; ++i) {
		var pal = paletteMirror[i]
		
		for(var j = 0; j < 16; ++j) {
			pal[j] = possibleColors[memory[PALETTES + 16*i + j]]
		}
	}
}
