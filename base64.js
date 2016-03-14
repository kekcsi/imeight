var DIGITS64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

function encode64(bytes_orig) {
	var digits = ""
	var bytes = bytes_orig.slice()

	bytes.push(0)
	bytes.push(0)

	while(bytes.length >= 3) {
		var val = ((bytes.shift()<<16)|(bytes.shift()<<8)|bytes.shift())

		digits += DIGITS64[val>>18]
		digits += DIGITS64[(val>>12)&63]
		digits += DIGITS64[(val>>6)&63]
		digits += DIGITS64[val&63]
	}

	return digits
}
