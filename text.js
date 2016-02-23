//Start address: TEXT_LAYER as defined in memory.js
//48 by 27 matrix of character codes

//Rendering depends on LAYER_MODE lower two bits

//00:
//Text layer is totally invisible

//01: (LSB of character code inverts, transparent)
//character codes 1..127 are TEXT_FG_COLOR on transparent
//character codes 128..255 are transparent on TEXT_BG_COLOR

//10: (LSB of character code inverts, background filled)
//character codes 1..127 are TEXT_FG_COLOR on TEXT_BG_COLOR
//character codes 128..255 are TEXT_BG_COLOR on TEXT_FG_COLOR

//11: (LSB selects whether background filled or transparent)
//character codes 1..127 are TEXT_FG_COLOR on transparent
//character codes 128..255 are TEXT_FG_COLOR on TEXT_BG_COLOR

//character code 0 is transparent in all modes
