//Start address $0920 2336
//for tiles and sprites
//24*3 = 72 bytes per pixmap

//mono sprites:
//  * each bit is a pixel
//  * 24 by 24 pixel matrix

//color sprites:
//  * one color sprite takes four of these indexable buffers
//  * 4 bits per pixel (indexes the per-sprite selected 16-color palette)
//  * 24 by 24 pixels

//tiles:
//  * 4 bits per pixel
//  * 12 by 12 pixels

//map of dirty pixmaps (mirrors that are not yet updated but corresponding memory area changed)
var dirtyPixmaps = []
