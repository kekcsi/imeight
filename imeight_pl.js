//parser
var text
var rollback
var parseSuccess
var line = 0
 
function parseError(message) {
    window.alert("?" + message + "  ERROR IN " + (line + 1))
	text = ""
	parseSuccess = false
}

var NAME_RE = /^[A-Z][A-Z0-9]*[%!$]?/

function checkName(fragment) {
    var m = fragment.match(NAME_RE)
	
	if (!m) return false
	
	return m[0]
}

var INDEXED_RE = /^[A-Z][A-Z0-9]*[%!$]?[(]/

function checkIndexed(fragment) {
	var m = fragment.match(INDEXED_RE)

	if (!m) return false
	
	return m[0]
}

function nameArg() {
    text = text.trim()
    var name = checkName(text)
 
    if (name === false) {
        parseError("REFERENCE EXPECTED")
		return
    }

    program.push(name)
    text = text.substring(name.length)
}
 
function assignableArg() {
	text = text.trim()
	var prefix = checkIndexed(text)
 
	if (prefix === false) {
		nameArg()
	} else {
		text = text.substring(prefix.length)
		expressionArg()
		expect(")")
		  
		program.push(prefix.substring(0, prefix.length - 1))
	}
}
 
function expectEnd() {
    text = text.trim()
 
    if (text.length > 0 && text[0] == ":") {
        text = text.substring(1)
    }
}

function instructionEnds() {
    text = text.trim()
	
	if (text.length == 0) {
		return true
	}
	
	if (':' == text[0]) {
		text = text.substring(1)
		return true
	}
	
	return false
}
 
function expect(s, fragment) {
    if (fragment === undefined) {
        text = expect(s, text)
    } else {
        fragment = fragment.trim()
 
        if (fragment.toUpperCase().startsWith(s)) {
            fragment = fragment.substring(s.length)
        } else {
            parseError("SYNTAX")
			return
        }
                  
        return fragment
    }
}
 
function isName(ch) {
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".includes(ch)
}

function expressionArg(fragment) {
	return expressionArgUpTo(100000, fragment)
}

function expressionArgUpTo(endPrecedence, fragment) {
    if (fragment === undefined) {
        text = expressionArgUpTo(endPrecedence, text)
    } else {
        var shunt = []
 
        do {
			fragment = fragment.trim()

            fragment = extractExpression(fragment)
			if (fragment === undefined) return //parse error happened and reported, stop
 
            var pushedOperator = false
			fragment = fragment.trim()
                      
            //infix operators
            for (operator in operators) {
				if (operators[operator].precedenceLevel >= endPrecedence) {
					continue
				}
				
                if (fragment.toUpperCase().startsWith(operator)) {
                    while (shunt.length > 0 && operators[shunt[shunt.length - 1]].precedenceLevel <= operators[operator].precedenceLevel) {
                        program.push(shunt.pop())
                    }
                          
                    fragment = fragment.substring(operator.length)
                    shunt.push(operator)
                    pushedOperator = true
					break
                }
            }
        } while (pushedOperator)
                  
        while (shunt.length > 0) {
            program.push(shunt.pop())
        }

        return fragment
    }
}
 
function extractExpression(fragment) {
    var prefix
 
	if (fragment.startsWith("-")) {
        fragment = fragment.substring(1)
		fragment = expressionArgUpTo(operators["*"].precedenceLevel, fragment)
		if (fragment === undefined) return //parse error happened and reported, stop

		program.push("_NEG")
		
		return fragment
	}
 
    for (var token in builtInFunctions) {
        if ("listAs" in builtInFunctions[token]) {
            prefix = builtInFunctions[token].listAs
        } else {
            prefix = token + "(" //spaces in between are _not_ allowed
        }
 
        if (fragment.toUpperCase().startsWith(prefix)) {
            fragment = fragment.substring(prefix.length)
            fragment = expressionArg(fragment)
            fragment = expect(")", fragment)
                     
            program.push(token)
                      
            return fragment
        }
    }
 
    //user-defined functions, arrays
	prefix = checkIndexed(fragment)
    if (prefix !== false) {
        fragment = fragment.substring(prefix.length)
        fragment = expressionArg(fragment)
        fragment = expect(")", fragment)
                  
        program.push(prefix.substring(0, prefix.length - 1))
                  
        return fragment
    }
 
    //variable name
    prefix = checkName(fragment)
    if (prefix !== false) {
        program.push(prefix)
        return fragment.substring(prefix.length)
    }
 
    //number literals
    m = fragment.match(NUMBER_LITERAL_RE)
    if (m) {
		literal = m[0]
        program.push(literal)
        return fragment.substring(literal.length)
    }
              
    //string literals
    if (fragment.startsWith('"')) {
        var end = fragment.indexOf('"', 1)
        if (end == -1) {
            parseError("PARSE")
			return
        }
                  
        program.push(fragment.substring(0, end + 1))
        return fragment.substring(end + 1)
    }
}

function tokenEscape(fragment) {
	//prevent a remark be interpreted as a token
	return fragment + "\n"
}

function parseToEndOfLine() {
    text = text.trim()

    while (text.length > 0) {
		instructionPushed = false
                  
        for (var instruction in instructions) {
			if ("parse" in instructions[instruction]) {
				if (text.toUpperCase().startsWith(instruction)) {
					text = text.substring(instruction.length)
					instructions[instruction].parse()
					program.push(instruction)
					instructionPushed = true
					break
				}
            }
        }

		if (!instructionPushed) {
			//no instruction keyword - check if it is an assignment
			instructions.LET.parse()
			program.push("_LET")
		}

        text = text.trim()
    }
}

function parseLine() {
    rollback = program.length
	
	parseToEndOfLine()
	
	if (parseSuccess) {
		line++
	} else {
		program.splice(rollback, program.length - rollback)
	}
}

function parseText() {
	line = 1
	lines = taText.value.split("\n")
	program = []
	labels = { START:0 }
    dataLookup = []
	elseBranches = {}

	parseSuccess = true
	
	for (var i = 0; parseSuccess && (i < lines.length); i++) {
		text = lines[i]
		parseLine()
	}
	
	if (program.length > 0) {
		btnRun.disabled = false
	}
}
 
//runner
var argumentStack = []
  
var functions = builtInFunctions

var readDataBuffer = []
var readDataPointer
 
var variables = {}

function varToMem(name, index, value) {
    var base
 
    switch (name) {
        case "VECTORX":
			value &= 511
            base = (index < 48)?3088:3200
            index %= 48
            memory[base + index] = value & 255
            base += 48
            highbit = (value >> 8) << (index%8)
            memory[base + index/8] &= ~highbit
            memory[base + index/8] |= highbit
            break
        case "VECTORY":
			value &= 255
            base = (index < 48)?3142:3254
            memory[base + index%48] = value
            break
        case "VECTORCOLOR":
			value &= 3
            base = (index < 16)?3190:3302
            index &= 15
            highbit = (value >> 1) << (index%8)
			lowbit = (value & 1) << (index%8)
            memory[base + index/8] &= ~highbit
            memory[base + index/8] |= highbit
			base += 2
            memory[base + index/8] &= ~lowbit
            memory[base + index/8] |= lowbit
            break
        case "VECTORFILL":
			value &= 3
            base = (index < 16)?3194:3306
            index &= 15
            highbit = (value >> 1) << (index%8)
			lowbit = (value & 1) << (index%8)
            memory[base + index/8] &= ~highbit
            memory[base + index/8] |= highbit
			base += 2
            memory[base + index/8] &= ~lowbit
            memory[base + index/8] |= lowbit
            break
        case "CHARMASK":
            memory[0 + index] = value
            break
        case "FONT":
            memory[1296 + index] = value
            break
        case "DESIGN":
            memory[1872 + index] = value
            break
    }
}

function memToVar(name, index) {
	switch (name) {
		case "CHARMASK":
			variables.CHARMASK[index] = memory[index]
			break
		case "FONT":
			variables.FONT[index] = memory[index + 1296]
			break
		case "DESIGN":
			variables.DESIGN[index] = memory[index + 1872]
			break
		case "VECTORX":
			var base = (index < 48)?3088:3200
			var i = index%48
			variables.VECTORX[index] = memory[base + i] | (((memory[base + 48 + i/8] >> (i%8)) & 1) << 8)
			break
		case "VECTORY":
			var base = (index < 48)?3142:3254
			var i = index%48
			variables.VECTORY[index] = memory[base + i]
			break
        case "VECTORCOLOR":
            base = (index < 16)?3190:3302
			var i = index%16
			highbit = (memory[base + i/8] >> (i%8)) & 1
			base += 2
			lowbit = (memory[base + i/8] >> (i%8)) & 1
			variables.VECTORCOLOR[index] = (highbit << 1) & lowbit
			break
        case "VECTORFILL":
            base = (index < 16)?3194:3306
			highbit = (memory[base + index/8] >> (index%8)) & 1
			base += 2
			lowbit = (memory[base + index/8] >> (index%8)) & 1
			variables.VECTORFILL[index] = (highbit << 1) & lowbit
			break
	}
}
 
var arrays = {}
 
var loops = []
 
var memory = []
 
var lastLabel = "START"
 
//runner constant
var builtInVariables = {
    PI: Math.PI,
 
    /* Built-in variables bound to video chip registers */
    COLORTEXT: 1, //mask is 6 bits ASCII, 2 bits color if COLORTEXT=1; 8 bits ASCII if COLORTEXT=0
    CHARFILL: 0, //zero pixels of the font are transparent (0) or filled (1) in the 8 by 8 block
    VECTORS: 3, //enable/disable triangle sets 0-15 (bit 1) and 16-31 (bit 2)
    TILEX: 0, //tile offset horizontal (0-32)
    TILEY: 0, //tile offset vertical (0-32)
    TEXTX: 0, //text offset horizontal (0-32)
    TEXTY: 0, //text offset vertical (0-32)
    BORDERS: 255, //4 tile borders + 4 text borders
 
    BACKGROUND: 0, //8-bit IRGB
    CHARFILL: 0, //8-bit IRGB
    BORDER: 0 //8-bit IRGB
}
 
var builtInArrays = {
    SPRITEX: new Array(16), //values 0-511
    SPRITEY: new Array(16), //values 0-255
    SPRITEPTR: new Array(16), //values 0-16, 0 being off
    SPRITEPRIO: new Array(16), //values 0-2 (behind tiles, over tiles, over vectors, over text)
              
    PALSELECT: new Array(16), //0 is for vectors, 1-15 is for designs; values 0-3
 
    PALDEFINE: new Array(5*3),
        //each member of the PALDEFINE dim is mapped to 1 byte, which represents 8-bit IRGB
        //1 palette is 3 color definitions:
        //color index 0 is transparent, 1-3 are defined in such palettes
        //4 palettes (0-2, 3-5, 6-9, 10-12) are selectable for sprite/tile designs 1-15
        //palette 13-15 is for the text layer
              
    TILES: new Array(9*16), //values 0-15, 0 is fully transparent
 
    //overlapped memory area @V+3088-3312
    VECTORX: new Array(3*32), //values 0-511
    VECTORY: new Array(3*32), //values 0-256
    VECTORCOLOR: new Array(32), //values 0-3
    VECTORFILL: new Array(32), //values 0-3
              
    BASSPITCH: new Array(32), //values 0-63
    BASSEFFECT: new Array(32), //values 0-3: drum bit, glide (pitch > 0)/release (pitch = 0) bit
    TENORPITCH: new Array(32), //values 0-63
    TENOREFFECT: new Array(32), //values 0-3: snare bit, glide (pitch > 0)/release (pitch = 0) bit
 
    CHARMASK: new Array(24*48), //@V+0; 24 rows, 48 columns of ASCII + color data bytes
    FONT: new Array(8*256), //@V+1296; index=8*(ASCII>32?ASCII-32:ASCII+224)
    DESIGN: new Array(15*144) //@V+1872
}
 
function runError(message) {
    window.alert("?" + message + "  ERROR AT " + lastLabel)
    program.splice(rollback, program.length - rollback)
}

function runProgram() {
    var programCounter = 0
	instructions.CLR.run(0)
    lastLabel = "START"
              
    while (programCounter < program.length) {
        var token = program[programCounter]
 
        if (token in instructions) {
            var instruction = instructions[token]
            programCounter = instruction.run(programCounter)
        } else if (token in functions) {
            var fn = functions[token]
            var arg = popValue()
            argumentStack.push(fn.apply(arg))
            programCounter++
        } else if (token in operators) {
			var o = operators[token]
			var b = popValue()
			var a = popValue()
			argumentStack.push(o.evaluate(a, b))
			programCounter++
        } else {
			// token here may be a variable name or a literal value
			// the instruction may want to use variable names or variable values
			// the run function of each instruction will evaluate variables if necessary
            argumentStack.push(token)
			programCounter++
        }
    }
}

function evaluateDataInstruction() {
    var programCounter = dataLookup[readDataPointer]
    var token = program[programCounter]

    while (token != "DATA") {
        if (token in functions) {
            var fn = functions[token]
            var arg = popValue()
            argumentStack.push(fn.apply(arg))
        } else if (token in operators) {
			var o = operators[token]
			var b = popValue()
			var a = popValue()
			argumentStack.push(o.evaluate(a, b))
        } else if (token in variables) {
			argumentStack.push(variables[token])
		} else {
			//should be a literal
            argumentStack.push(token)
        }
		
        programCounter++
		token = program[programCounter]
    }
	
	if (!Array.isArray(argumentStack[argumentStack.length - 1])) {
		//there was no comma operator in the DATA argument, only a single element
		//make it a singleton list
		argumentStack[argumentStack.length - 1] = [argumentStack[argumentStack.length - 1]]
	}
}

function popValue(defaultValue) {
	var arg = argumentStack.pop()
	if (arg === "") arg = defaultValue
	
	if (Array.isArray(arg)) {
		var results = []
		
		for (i in arg) {
			results.push(getValue(arg[i]))
		}
		
		return results
	} else {
		return getValue(arg)
	}
}

var NUMBER_LITERAL_RE = /^(([0-9]*[.])?[0-9]+|%[01]*|![0123]|[$][A-F0-9]*)/

// dereference names and parse literals
function getValue(arg) {
	if (arg in variables) {
		arg = variables[arg]
	}

	if (arg === undefined) runError("NO VALUE")
		
 	if (typeof arg != 'string') return arg //already a parsed calculation result?
		
	if (arg.startsWith('"')) {
		return arg.substring(1, arg.length - 1)
	}

    m = arg.match(NUMBER_LITERAL_RE)
    if (m) {
		literal = m[0]
		
		if (literal.startsWith("%")) {
			return parseInt(literal.substring(1), 2)
		}
		
		if (literal.startsWith("!")) {
			return parseInt(literal.substring(1), 4)
		}
		
		if (literal.startsWith("$")) {
			return parseInt(literal.substring(1), 16)
		}
		
		return parseFloat(literal)
	}

	return arg
}

//common constant
var instructions = {
    "@": {
        //text label for GOTO/GOSUB/RESTORE (put them on the list while relinking)
        parse: function() {
            nameArg()
            labels[program[program.length - 1]] = program.length + 1
            expectEnd()
        },
                  
        run: function(pc) {
            lastLabel = argumentStack.pop()
            return pc + 1
        }
    },
              
    END: {
        parse: expectEnd,
                  
        run: function(pc) {
            return program.length
        }
    },
              
    FOR: {
        parse: function() {
            nameArg()
            expect("=")
            expressionArg()
            expect("TO")
            expressionArg()
            if (instructionEnds()) {
                program.push("")
            } else {
                expect("STEP")
                expressionArg()
            }
            expectEnd()
        },
 
        run: function(pc) {
            var loop = {
                bodyStart: pc + 1,
                step: popValue(1),
                end: popValue(),
                start: popValue(),
                name: argumentStack.pop()
            }
                      
            loops.push(loop)
                      
            variables[loop.name] = loop.start
                      
            return pc + 1
        }
    },
 
    NEXT: {
        parse: function() {
            if (instructionEnds()) {
                program.push("")
            } else {
                nameArg()
				expectEnd()
            }
        },
 
        run: function(pc) {
            loop = loops[loops.length - 1]
                      
            var expectedName = argumentStack.pop()
                      
            if (expectedName != "" && expectedName != loop.name) {
                runError("NEXT WITHOUT FOR")
				return 
            }
                      
            variables[loop.name] += loop.step
            if (loop.end*Math.sign(loop.step) >= variables[loop.name]*Math.sign(loop.step)) {
				return loop.bodyStart
            }
            
			loops.pop()
			return pc + 1
        }
    },
              
    DATA: {
        parse: function() {
			dataLookup.push(program.length)
            expressionArg()
			expectEnd()
        },
		
		run: function(pc) {
			argumentStack.pop()
			return pc + 1
		}
    },
              
    INPUT: {
		parse: function() {
			var firstArg = program.length
			expressionArgUpTo(operators[","].precedenceLevel) //message or target variable

			if (instructionEnds()) {
				var name = program[program.length - 1]
				if (checkName(name) !== name) {
					parseError("REFERENCE EXPECTED")
					return
				}
				
				program.splice(firstArg, 0, "")
			} else {
				expect(",")
				assignableArg()				
				expectEnd()
			}
		},
 
        run: function(pc) {
			var name = argumentStack.pop()
			if (name in arrays) {
				arrays[name][popValue()] = window.prompt(popValue("ENTER VALUE FOR " + name))
			} else {
				variables[name] = window.prompt(popValue("ENTER VALUE FOR " + name))
			}
			
			return pc + 1
		}
	},
    
	DIM: {
		parse: function() {
			nameArg()
			expect("(")
			expressionArg()
			expect(")")
			expectEnd()
		},
		
		run: function(pc) {
			var size = popValue()
			arrays[argumentStack.pop()] = new Array(size)
			
			return pc + 1
		}
	},	
	
    READ: {
		// DATA and READ instructions work a lot different from those of C64. The values
		// in DATA lines are evaluated like any other expression when READ reaches the
		// DATA instruction in question. They evaluate to an array along the commas.
		parse: function() {
			nameArg()
			expectEnd()
		},
		
		run: function(pc) {
			if (readDataBuffer.length == 0) {
				if (readDataPointer >= dataLookup.length) {
					runError("OUT OF DATA")
					return
				}
				
				evaluateDataInstruction()
				readDataBuffer = argumentStack.pop()
				readDataPointer++
			}

			variables[argumentStack.pop()] = readDataBuffer.shift()
			
			return pc + 1
		}
	},
	
    LET: { //explicit assignment (show keyword in listing)
		parse: function() {
			assignableArg()
			expect("=")
			expressionArg()
			expectEnd()
		},
		
		run: function(pc) {
			var value = popValue()
			var name = argumentStack.pop()
			
			if (name in arrays) {
				arrays[name][popValue()] = value
			} else {
				variables[name] = value
			}
			
			return pc + 1
		}
	},
	
    GOTO: {  
		parse: function() {
			nameArg()
			expectEnd()
		},

        run: function(pc) {
            lastLabel = argumentStack.pop()
            return labels[lastLabel]
        }
    },

	// IF/THEN construct in tokenized postfix: [ conditionExpression, THEN token, thenBranchInstructions, IF token ]
    IF: {
		parse: function() {
			expressionArg()
			expect("THEN")
			var thenBranch = program.length
			program.push("THEN")
			parseToEndOfLine()
			elseBranches[thenBranch] = program.length + 1
		},
		
		run: pc => pc + 1
	},
	
	// evaluate the condition expression here
	THEN: {
		run: function(pc) {
			if (popValue()) {
				return pc + 1
			}
			
			return elseBranches[pc]
		}
	},
	
    RESTORE: {
		parse: function() {
            if (instructionEnds()) {
                program.push("")
            } else {
                nameArg()
				expectEnd()
            }
		},

        run: function(pc) {
			readDataBuffer = []
			
            var label = argumentStack.pop()
			if (label == "") {
				readDataPointer = 0
			} else if (label in labels) {
				readDataPointer = dataLookup.indexOf(labels[label])

				if (readDataPointer < 0) {
					runError("NO DATA AT LABEL")
				}
			} else {
				runError("LABEL EXPECTED")
				return
			}

			return pc + 1
        }
	},
	
    GOSUB: {
		parse: function() {
			nameArg()
			expectEnd()
		},
		
		run: function(pc) {
            lastLabel = argumentStack.pop()
			argumentStack.push(pc + 1)
            return labels[lastLabel]
		}
	},
	
    RETURN: {
		parse: expectEnd,
		
		run: function(pc) {
            return argumentStack.pop()
		}
	},
	
    REM: {
		parse: function() {
			program.push(tokenEscape(text))
			text = ""
		},
		
		run: function(pc) {
			argumentStack.pop()
			return pc + 1
		}
	},
	
    //STOP:
    //ON:
    //WAIT:
    //DEF: "FN"
	
    POKE: {
		parse: function() {
			expressionArgUpTo(operators[","].precedenceLevel)
			expect(",")
			expressionArg()
			expectEnd()
		},
		
		run: function(pc) {
			var value = popValue()
			memory[popValue()] = value
			
			return pc + 1
		}
	},
	
    PRINT: {
		parse: function() {
			expressionArg()
			expectEnd()
		},
		
		run: function(pc) {
			console.log(popValue())
			return pc + 1
		}
	},
	
    CLR: {
		parse: expectEnd,
		
		run: function(pc) {
			variables = builtInVariables
			arrays = builtInArrays
			loops = []
			functions = builtInFunctions
			argumentStack = []
			readDataBuffer = []
			readDataPointer = 0
			
			return pc + 1
		}
	}
	
    //OPEN:
    //CLOSE:
    //GET:
}

instructions._LET = { //implicit assignment (omit keyword in listing, appears as token)
	run: instructions.LET.run
}

instructions._GOTO = { //implicit GOTO after THEN (omit keyword in listing, appears as token)
	run: instructions.GOTO.run
}

instructions["\n"] = { //line break - enables relinking and listing from tokenized program
	run: pc => pc + 1
}

var operators = {
    "+": { precedenceLevel: 3, evaluate: (a, b) => a + b },
    "-": { precedenceLevel: 3, evaluate: (a, b) => a - b },
    "/": { precedenceLevel: 2, evaluate: (a, b) => a / b },
    "*": { precedenceLevel: 2, evaluate: (a, b) => a * b },
    "^": { precedenceLevel: 1, evaluate: Math.pow },
    AND: { precedenceLevel: 6, evaluate: (a, b) => a & b },
    OR: { precedenceLevel: 7, evaluate: (a, b) => a | b },
    "<>": { precedenceLevel: 4, evaluate: (a, b) => a != b },
    ">": { precedenceLevel: 4, evaluate: (a, b) => a > b },
    "=": { precedenceLevel: 5, evaluate: (a, b) => a == b },
    "<": { precedenceLevel: 4, evaluate: (a, b) => a < b },
    ",": { precedenceLevel: 8, evaluate: (a, b) => (Array.isArray(a) ? a.concat([b]) : [a, b]) }
}
 
var builtInFunctions = {
    NOT: { apply: arg => ~arg }, 
    SGN: { apply: Math.sign },
    "INT%": { apply: arg => Math.floor(arg)&65535 },
    INT: { apply: Math.floor },
    ABS: { apply: Math.abs },
    SQR: { apply: Math.sqrt },
    RND: { apply: arg => Math.floor(Math.random() * arg) },
    LOG: { apply: Math.log },
    EXP: { apply: Math.exp },
    COS: { apply: Math.cos },
    SIN: { apply: Math.sin },
    TAN: { apply: Math.tan },
    ATN: { apply: Math.atan },
    PEEK: { apply: arg => memory[arg] },
    LEN: { apply: arg => arg.length },
    "STR$": { apply: arg => "" + arg },
    VAL: { apply: parseFloat },
    ASC: { apply: arg => arg.charCodeAt(0) },
    "CHR$": { apply: String.fromCharCode },
    "LEFT$": { apply: arg => arg[0].substr(0, arg[1]) },
    "RIGHT$": { apply: arg => arg[0].substring(arg[0].length - arg[1]) },
    "MID$": { apply: arg => arg[0].substr(arg[1] - 1, arg[2]) },
    _PAREN: {
        listAs: "(", //explicitly marked parentheses - omit keyword in listing 
        apply: arg => arg
    },
	_NEG: { apply: arg => -arg }
}

//transfer variables from parser to runner
  
var labels = { START: 0 } //pointers to instructions after each @ instruction in the tokenized program
var dataLookup = [] //pointers to DATA instruction arguments in the tokenized program
var elseBranches = {} //where to jump if condition evaluates to false (pointer to IF mapped to end of its line)

var program = [] //the tokenized program (postfix Polish notation)