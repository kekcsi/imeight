//Start address: TEXT_LAYER as defined in memory.js
//48 by 27 matrix of character codes

//Rendering depends on LAYER_MODE
//	  bits 0..1 foreground for codes 1..127
//	  bits 2..3 foreground for codes 128..255
//	  bits 4..5 background for codes 1..127
//	  bits 6..7 background for codes 128..255
//		  00: transparent
//		  01: TEXT_COLOR_1
//		  10: TEXT_COLOR_2
//		  11: TEXT_COLOR_3

//character code 0 is transparent in all modes
