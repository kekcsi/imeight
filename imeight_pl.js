//TODO
//buglocator coloncount in parseerror
//coloncount in goline

//interactive

function programTab() {
	btnProgram.style.borderStyle="inset"
	tabProgram.style.display="block"
	btnOutput.style.borderStyle="outset"
	tabOutput.style.display="none"
	btnGraphic.style.borderStyle="outset"
	tabGraphic.style.display="none"
	taList.focus()
}

function outputTab() {
	btnProgram.style.borderStyle="outset"
	tabProgram.style.display="none"
	btnOutput.style.borderStyle="inset"
	tabOutput.style.display="block"
	btnGraphic.style.borderStyle="outset"
	tabGraphic.style.display="none"
	inUserInput.focus()
}

function graphicTab() {
	btnProgram.style.borderStyle="outset"
	tabProgram.style.display="none"
	btnOutput.style.borderStyle="outset"
	tabOutput.style.display="none"
	btnGraphic.style.borderStyle="inset"
	tabGraphic.style.display="block"
	tabGraphic.focus()
}

function pageLoad() {
	inUserInput.addEventListener("keydown", function(event) {
		if (interact != inputAction) {
			eventQueue.push(event.keyCode + 0.5*event.shiftKey + 0.25*event.ctrlKey)
			eventHandler()
		}
	})

	inUserInput.addEventListener("keyup", function(event) {
		if (event.keyCode === 13) { //Enter
			event.preventDefault()
			userInput()
		}
		
		if (event.keyCode === 27) { //Esc
			event.preventDefault()
			userBreak()
		}
	})
	
	taList.addEventListener("keyup", function(event) {
		if (event.keyCode === 120) { //F9
			event.preventDefault()
			parseText()
		}

		updateLineNumber()
	})
	
	taList.addEventListener("mouseup", updateLineNumber)
	
	tabGraphic.addEventListener("keydown", function(event) {
		event.preventDefault()
		eventQueue.push(event.keyCode)
		eventHandler()
	})

	setInterval(function() { eventHandler() }, 20)
}

function updateLineNumber() {
	inLine.value = taList.value.substring(0, taList.selectionStart).split("\n").length
}

function goLine(target) {
	var currPos = 0
	var lines = taList.value.split("\n")
	var target0based = parseInt(target) - 1

	for (var currLine in lines) {
		var part = lines[currLine]
		
		if (currLine == target0based) {
			taList.selectionStart = currPos
		}
		
		currPos += part.length + 1
		
		if (currLine == target0based) {
			taList.selectionEnd = currPos
			break
		}
	}
	
	taList.focus()
}

function videoPrint(message) {
	while (divOutput.childElementCount >= 20) {
		divOutput.removeChild(divOutput.firstChild)
	}
	divOutput.innerHTML = divOutput.innerHTML + "<div>" + message + "&nbsp;</div>"
	
	return divOutput.lastChild
}

//the default inputAction routine
var interact = function(input) {
	if (input === null) return
	
	var div = videoPrint(input)

	var command = input.toUpperCase().trim()

	if (command in commands) {
		commands[command]()
	} else {
		//try adding it as a line to the end of the program text
		parseSuccess = true

		text = input
		parseLine()
		
		if (parseSuccess) {
			if (!taList.value.endsWith("\n")) taList.value += "\n"
			taList.value += input //FIXME 'PROGRAM FORKED when dirty
			div.style.color = "yellow"
		}
	}
}

var inputAction = interact

function userBreak() {
	inUserInput.focus()
	inUserInput.value = ""
	inputAction(null)
}

function userInput() {
	inUserInput.focus()
	var input = inUserInput.value
	inUserInput.value = ""
	inputAction(input)
}

var oldText = ""

var commands = {
	RUN: runProgram,
	CONT: contProgram,
	LIST: programTab,
	NEW: function() {
		newProgram()
		oldText = taList.value
		taList.value = ""
		programTab()
	},
	OLD: function() {
		newProgram()
		var swap = taList.value
		taList.value = oldText
		oldText = swap
		programTab()
	}
}

//parser
var text
var rollback
var parseSuccess
var lineNumber = 0
var colonCount
var charsParsed
 
function newProgram() {
	lineNumber = 1
	charsParsed = 0
	program = []
	lineNumbers = []
	labels = { START:0 }
	dataLookup = []
	elseBranches = {}
}
 
function parseError(message) {
	if (!parseSuccess) return
    videoPrint("?" + message + "  ERROR IN " + lineNumber + ":" + colonCount)
	chStart = charsParsed - colonAt
	charsParsed -= text.length
	text = ""
	parseSuccess = false
	videoPrint("READY.")
	inUserInput.value="LIST"
	taList.selectionStart = chStart
	taList.selectionEnd = charsParsed
	inLine.value = lineNumber
	taList.focus()
}

var NAME_RE = /^[A-Z][A-Z0-9]*[%!$]?/
var ASSIGN_RE = /^[A-Z][A-Z0-9]*[%!$]?([(][^)]*[)])?[ \t]*=/
var INDEXED_RE = /^[A-Z][A-Z0-9]*[%!$]?[(]/

function getRegexPrefix(regex, fragment) {
    var m = fragment.match(regex)
	
	if (!m) return false
	
	return m[0]
}

function nameArg() {
    text = text.trim()
    var name = getRegexPrefix(NAME_RE, text)
 
    if (name === false) {
        parseError("REFERENCE EXPECTED")
		return
    }

    program.push(name)
    text = text.substring(name.length)
}

function namesArg() {
	var shunt = []
	
	while (true) {
		text = text.trim()
		var name = getRegexPrefix(NAME_RE, text)
	 
		if (name === false) {
			break
		}

		program.push(name)
		text = text.substring(name.length)

		var rest = tryPrefix(",")
		
		if (rest === false) {
			break
		} else {
			while(shunt.length > 0) program.push(shunt.pop())
		    shunt.push(",")
		}
	}
	
	while (shunt.length > 0) program.push(shunt.pop())
}

//parse an argument that refers to either a variable by name or an array member by index
function assignableArg() {
	text = text.trim()
	var prefix = getRegexPrefix(INDEXED_RE, text)
 
	if (prefix === false) {
		nameArg()
	} else {
		text = text.substring(prefix.length)
		expressionArg()
		expect(")")
		  
		program.push(prefix)
	}
}
 
function expectEnd(deStart) {
    text = text.trim()

    if (text.length > 0) {
		if (text[0] == ":") {
			text = text.substring(1)
			colonAt = text.length
			colonCount++
		} else if (text[0] != "'") {
			parseError("EXTRA ARGUMENT")
			return
		}
    }

	// ending deferred evaluation
	if (deStart === undefined) return

	elseBranches[deStart] = program.length + 1
}

function instructionEnds() {
    text = text.trim()
	
	if (text.length == 0) {
		return true
	}
	
	if (text[0] == ":") {
		colonAt = text.length - 1
		colonCount++
		text = text.substring(1)
		return true
	}
	
	return "'" == text[0]
}

function tryPrefix(pfx, fragment) {
    if (fragment === undefined) {
        var rest = tryPrefix(pfx, text)
		if (rest !== false) text = rest
		return rest
    } else {
		fragment = fragment.trim()

		if (fragment.startsWith(pfx)) {
			fragment = fragment.substring(pfx.length)
			return fragment
		}
		
		return false
	}
}

function expect(pfx, fragment) {
	var rest = tryPrefix(pfx, fragment)
	
	if (rest === false) {
		parseError("SYNTAX")
		return
	}
	
	return rest
}

function expectOne(arr) {
	for (idx in arr) {
		pfx = arr[idx]
		
		var rest = tryPrefix(pfx)
		if (rest !== false) {
			return pfx
		}
	}

	parseError("SYNTAX")
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
				
                if (fragment.startsWith(operator)) {
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

		program.push("_NEG(")
		
		return fragment
	}
 
    for (var token in builtInFunctions) {
        if ("listAs" in builtInFunctions[token]) {
            prefix = builtInFunctions[token].listAs
        } else {
            prefix = token + "(" //spaces in between are _not_ allowed
        }
 
        if (fragment.startsWith(prefix)) {
            fragment = fragment.substring(prefix.length)
            fragment = expressionArg(fragment)
            fragment = expect(")", fragment)
                     
            program.push(token + "(")
                      
            return fragment
        }
    }
 
    //user-defined functions, arrays
	prefix = getRegexPrefix(INDEXED_RE, fragment)
    if (prefix !== false) {
        fragment = fragment.substring(prefix.length)
        fragment = expressionArg(fragment)
        fragment = expect(")", fragment)
                  
        program.push(prefix)
                  
        return fragment
    }
 
    //variable name
    prefix = getRegexPrefix(NAME_RE, fragment)
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

	//nullary function call?
	program.push("")
	return fragment
}

function deferredEvaluation(token) {
	var deStart = program.length
	program.push(token)
	return deStart
}

function tokenEscape(fragment) {
	//prevent a remark be interpreted as a token
	return fragment + "\n"
}

function parseInstruction(pushed, parsed, displayed, sinceChars) {
	var bugLocator = {colon: colonCount, instruction: displayed, 
		chStart: charsParsed - text.length - sinceChars}

	if (parsed) instructions[parsed].parse()
	if (displayed) {
		bugLocator.line = lineNumber
		bugLocator.chEnd = charsParsed - text.length
		lineNumbers.push(bugLocator)
		lineNumbers[program.length] = bugLocator
	}
	if (pushed) program.push(pushed)
}

function parseToEndOfLine(deStart) {
    text = text.trim().toUpperCase()

    while (text.length > 0) {
		instructionPushed = false
                  
        for (var instruction in instructions) {
			if ("parse" in instructions[instruction]) {
				if (text.startsWith(instruction)) {
					text = text.substring(instruction.length)
					parseInstruction(instruction, instruction, instruction, instruction.length)
					instructionPushed = true
					break
				}
            }
        }
		
		if (!instructionPushed) {
			//no instruction keyword - check if it is an assignment
			if (getRegexPrefix(ASSIGN_RE, text) !== false) {
				parseInstruction("_LET", "LET", "ASSIGNMENT", 0)
			} else {
				parseError("INSTRUCTION EXPECTED")
				break
			}
		}

        text = text.trim()
    }

	// ending deferred evaluation
	if (deStart === undefined) return

	elseBranches[deStart] = program.length + 1
}

function parseLine() {
    rollback = program.length
	charsParsed += text.length
	colonAt = text.length
	
	parseToEndOfLine()
	
	if (parseSuccess) {
		lineNumber++
		colonCount = 1
		charsParsed++
	} else {
		program.splice(rollback, program.length - rollback)
	}
}

function parseText() {
	lines = taList.value.split("\n")
	newProgram()

	outputTab() //allow showing parse errors
	parseSuccess = true

	for (var i = 0; parseSuccess && (i < lines.length); i++) {
		text = lines[i]
		parseLine()
	}
	
	if (parseSuccess) {
		videoPrint("PROGRAM UPDATED").style.color = "yellow"
		inUserInput.value="RUN"
	}
}
 
//runner
var argumentStack = [] //for evaluating arguments and storing return addresses
  
var functions = {}

var readDataBuffer = []
var readDataPointer
 
var variables = {}

var stopped
 
var arrays = {}
 
var loops = []
 
var memory = []
 
var eventQueue = []
var eventHandler = function() {}

var bugLocator

//runner constant
var builtInVariables = {
    PI: Math.PI
}
 
var builtInArrays = {}

function runError(message) {
	if (stopped === true) return
    videoPrint("?" + message + "  ERROR IN " + bugLocator.line + ":" 
		+ bugLocator.colon + ", " + bugLocator.instruction)

	taList.selectionStart = bugLocator.chStart
	taList.selectionEnd = bugLocator.chEnd
	inLine.value = bugLocator.line
	taList.focus()
	stopped = true
}

//try to interpret the token as a function call or array member reference
function indexedReference(token, expectedSet) {
	if (typeof token === "string" && token.endsWith("(")) {
		var name = token.substring(0, token.length - 1)
		
		if (name in expectedSet) {
			return name
		}
	}
	
	return false
}

function preparePush(result) {
	if (typeof result === "string") {
		result = '"' + result + '"'
	}
	
	return result
}

function runProgram() {
	stopped = 0
	instructions.CLR.run(0)
	
	contProgram()
}

function contProgram() {
    var programCounter = stopped
	stopped = 0

    while (programCounter < program.length && !stopped) {
        var token = program[programCounter]
		if (programCounter in lineNumbers) bugLocator = lineNumbers[programCounter]

        if (token in instructions) {
            var instruction = instructions[token]
            programCounter = instruction.run(programCounter)
        } else {
			var funcName = indexedReference(token, functions)
			if (funcName !== false) {
				var arg = popAndDeeplyEvaluate([])
				argumentStack.push(preparePush(functions[funcName].apply(arg)))
				programCounter++
			} else if (token in operators) {
				evaluateOperator(token)
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

	if (interact == inputAction) {
		videoPrint("READY.")
		outputTab()
	}
}

function evaluateDataInstruction() {
    var programCounter = dataLookup[readDataPointer]
    var token = program[programCounter]

    while (token != "DATA") {
		evaluateToken(token)
		
		programCounter++
		token = program[programCounter]
    }
	
	if (!Array.isArray(argumentStack[argumentStack.length - 1])) {
		//there was no comma operator in the DATA argument, only a single element
		//make it a singleton list
		argumentStack[argumentStack.length - 1] = [argumentStack[argumentStack.length - 1]]
	}
}

function evaluateOperator(token) {
	var o = operators[token]
	
	if ("lateEvaluated" in o) {
		var b = argumentStack.pop()
		var a = argumentStack.pop()
	} else {
		var b = getValue(argumentStack.pop())
		var a = getValue(argumentStack.pop())
	}
	
	argumentStack.push(preparePush(o.evaluate(a, b)))
}

function popAndEvaluate(defaultValue) {
	var arg = argumentStack.pop()
	if (arg === "") arg = defaultValue
	return getValue(arg)
}

function popAndDeeplyEvaluate(defaultValue) {
	var arg = argumentStack.pop()
	if (arg === "") arg = defaultValue
	
	if (Array.isArray(arg)) {
		for (var i = 0; i < arg.length; i++) {
			arg[i] = getValue(arg[i])
		}
		
		return arg
	}
	
	return getValue(arg)
}

function evaluateToken(token) {
	var funcName = indexedReference(token, functions)
	
	if (funcName !== false) {
		var arg = popAndDeeplyEvaluate([])
		argumentStack.push(preparePush(functions[funcName].apply(arg)))
	} else if (token in operators) {
		evaluateOperator(token)
	} else if (token in variables) {
		argumentStack.push(preparePush(variables[token]))
	} else {
		//should be a literal
		argumentStack.push(token)
	}
}

var NUMBER_LITERAL_RE = /^(([0-9]*[.])?[0-9]+(E[+-]?[0-9]+)?|%[01]+|![0123]+|[$][A-F0-9]+)/

// dereference names and parse literals
function getValue(arg) {
	if (typeof arg !== "string") {
		return arg
	}
	
	var dereferenced = arg
	var arrayName = indexedReference(arg, arrays)
	if (arrayName !== false) {
		var i = popAndEvaluate()
		var a = arrays[arrayName]
		dereferenced = a[i]
	} else if (getRegexPrefix(NAME_RE, arg) === arg) {
		dereferenced = variables[arg]
	}
	
	if (dereferenced === undefined) {
		runError("NO VALUE")
		return
	} else {
		arg = dereferenced
	}

	if (typeof arg !== "string") {
		return arg
	}
	
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

function popAndAssign(valueSupplier, defaultName) {
	var name = argumentStack.pop()

	if (name === "") {
		name = defaultName
	}
	
	if (typeof name !== "string") {
		runError("INVALID REFERENCE")
		return
	}
	
	var arrayName = indexedReference(name, arrays)
	if (arrayName !== false) {
		var i = popAndEvaluate()
		var a = arrays[arrayName]
		a[i] = valueSupplier(name + i + ")", a[i])
		return { array: a, index: i }
	} else if (getRegexPrefix(NAME_RE, name) === name) {
		variables[name] = valueSupplier(name, variables[name])
		return { array: variables, index: name }
	} else {
		runError("INVALID REFERENCE")
		return
	}
}

//inputAction alternative for WAIT
var onlyStop = function(input) {
	//don't display READY prompt when program is stopped like this
	if (input === null) {
		//unless there was user break 
		videoPrint("READY.")
		outputTab()

		//restore normal handlers
		inputAction = interact
		eventHandler = function() {}
	}
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
            argumentStack.pop()
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
            assignableArg()
            expect("=")
            expressionArg()
            expect("TO")
            expressionArg()
            if (instructionEnds()) {
                program.push("")
            } else {
                expect("STEP")
                expressionArg()
				expectEnd()
            }
        },
 
        run: function(pc) {
            var loop = {
                bodyStart: pc + 1,
                step: popAndEvaluate(1),
                end: popAndEvaluate(),
                start: popAndEvaluate()
            }
			
            popAndAssign(function(name) { loop.name = name; return loop.start })
                      
            loops.push(loop)
			
            return pc + 1
        }
    },
 
    NEXT: {
        parse: function() {
            if (instructionEnds()) {
                program.push("")
            } else {
                assignableArg()
				expectEnd()
            }
        },
 
        run: function(pc) {
			if (loops.length == 0) {
				runError("NEXT WITHOUT FOR")
				return 
			}
			
			var loop = loops[loops.length - 1]
            
			popAndAssign(function(expectedName, oldValue) {
				if (expectedName != "" && expectedName != loop.name) {
					runError("LOOP MISMATCH")
					return 
				}

				loop.counter = oldValue + loop.step
				
				return loop.counter
			}, loop.name)

			if (stopped) return

			var dir = Math.sign(loop.step)
			if (loop.end*dir >= loop.counter*dir) {
				return loop.bodyStart
			}            

			loops.pop()
			return pc + 1
        }
    },
	
    DATA: {
        parse: function() {
			var deStart = deferredEvaluation("_DEFER")
			dataLookup.push(program.length)
            expressionArg()
			expectEnd(deStart)
		}
    },

    INPUT: {
		parse: function() {
			var firstArg = program.length
			expressionArgUpTo(operators[","].precedenceLevel) //message or target variable

			if (instructionEnds()) {
				var name = program[program.length - 1]
				if (getRegexPrefix(INDEXED_RE, name) === false && getRegexPrefix(NAME_RE, name) === false) { 
					//the only argument was neither array nor variable name
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
			saveStk = argumentStack.slice() //in case user breaks

			var target = popAndAssign(function(name, oldValue) {
				var message = popAndEvaluate("ENTER VALUE FOR " + name)
				videoPrint(message)
				outputTab()
				stopped = pc + 1
								
				return oldValue //for now
			})
			
			if (target === undefined) return
			
			inputAction = function(response) {
				inputAction = interact

				if (response === null) {
					videoPrint("READY.")
					outputTab()
					argumentStack = saveStk
					stopped = pc
					return
				}
				
				videoPrint(response).style.opacity = 0.75
				target.array[target.index] = response
				eventQueue = [] //don't let GET capture what is already processed
				contProgram()
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
			var size = popAndDeeplyEvaluate()
			var name = argumentStack.pop()

			if (name in functions) {
				runError("OVERDEFINITION")
				return
			}

			arrays[name] = []
			
			return pc + 1
		}
	},	
	
    READ: {
		// DATA and READ instructions work a lot different from those of C64. The values
		// in DATA lines are evaluated like any other expression when READ reaches the
		// DATA instruction in question. They evaluate to an array along the commas.
		parse: function() {
			assignableArg()
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

			popAndAssign(function() { return readDataBuffer.shift() })
			
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
			var value = popAndEvaluate()
			popAndAssign(function() { return value })

			return pc + 1
		}
	},
	
    GOTO: {  
		parse: function() {
			nameArg()
			expectEnd()
		},

        run: function(pc) {
            var target = argumentStack.pop()
			
			if (target in labels) {
				return labels[target]
			}
			
			runError("LABEL DOES NOT EXIST")
        }
    },

	// IF/THEN construct in tokenized postfix: [ conditionExpression, THEN token, thenBranchInstructions, IF token ]
    IF: {
		parse: function() {
			var startTail = text.length
			expressionArg()
			parseInstruction(false, false, "IF", startTail - text.length - 1)
			var thenWord = expectOne(["THEN", "T."])
			var deStart = deferredEvaluation(thenWord)
			parseToEndOfLine(deStart)
		},
		
		run: function(pc) { return pc + 1 }
	},
	
	// evaluate the condition expression here
	THEN: {
		run: function(pc) {
			if (popAndEvaluate()) {
				return pc + 1
			}
			
			return elseBranches[pc]
		}
	},
	
	// DATA and DEF skips evaluation of arguments like THEN with a false condition
	_DEFER: {
		run: function(pc) { return elseBranches[pc] }
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
				readDataPointer = dataLookup.indexOf(labels[label] + 1 /* skip the _DEFER instruction */)

				if (readDataPointer < 0) {
					runError("NO DATA AT LABEL")
					return
				}
			} else {
				runError("LABEL DOES NOT EXIST")
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
            var target = argumentStack.pop()
			
			if (target in labels) {
				argumentStack.push(pc + 1)
				return labels[target]
			}
			
			runError("LABEL DOES NOT EXIST")
		}
	},
	
    RETURN: {
		parse: expectEnd,
		
		run: function(pc) {
			var target = argumentStack.pop()
			if (typeof target == "number") return target
			runError("RETURN WITHOUT GOSUB")
		}
	},
	
    REM: {
		parse: function() {
			for (label in labels) {
				if (labels[label] === program.length) {
					labels[label] += 2
				}
			}
			
			program.push(tokenEscape(text))
			text = ""
		},
		
		run: function(pc) {
			argumentStack.pop()
			return pc + 1
		}
	},
	
    STOP: {
		parse: expectEnd,

		run: function(pc) {
			stopped = pc + 1
			return pc + 1
		}
	},

    ON: {
		parse: function() {
			expressionArg()
			
			var goWord = expectOne(goWords)
			program.push(goWords.indexOf(goWord))
			
			namesArg()

			expectEnd()
		},
		
		run: function(pc) {
			var labelArray = argumentStack.pop()
			var goWord = goWords[argumentStack.pop()]
			var which = popAndEvaluate()

			if (typeof which === "number") 
			{ 
				which = Math.floor(which) - 1

				if (which in labelArray) {
					argumentStack.push(labelArray[which])
					return instructions[goWord].run(pc)
				}
			}
			
			runError("BRANCH")
		}
	},

    WAIT: {
		parse: expectEnd,
		
		run: function(pc) {
			stopped = pc + 1

			inputAction = onlyStop

			// wake up with a CONT when the next event comes
			eventHandler = function() { 
				// restore normal stopping conditions for a future STOP/INPUT
				inputAction = interact
				eventHandler = function() {}

				contProgram()
			}
			
			return pc + 1
		}
	},
	
    DEF: {
		parse: function() {
			text = text.trim()
			var prefix = getRegexPrefix(INDEXED_RE, text)
		 
			if (prefix === false) {
				parseError("FN SYNTAX")
				return
			} else {
				text = text.substring(prefix.length)
				namesArg()
				var fnParam = program[program.length - 1]
				expect(")")
				
				program.push(prefix.substring(0, prefix.length - 1))
			}
			
			expect("=")
			
			var deStart = deferredEvaluation("_FN")
			expressionArg()
			expectEnd(deStart)
		}
	},

	// add a user function definition
	_FN: {
		run: function(pc) {
			var name = argumentStack.pop()
			var fnParams = argumentStack.pop()
			if (!Array.isArray(fnParams)) {
				// unary case
				fnParams = [fnParams]
			}

			if (name in arrays) {
				runError("OVERDEFINITION")
				return
			}

			functions[name] = { 
				apply: function(arg) {
					if (!Array.isArray(arg)) {
						//unary case
						arg = [arg]
					}

					var saveX = []
					
					for (i in fnParams) {
						var fnParam = fnParams[i]
						
						saveX[i] = variables[fnParam]
						variables[fnParam] = arg[i]
					}
					
					var evalPC = pc + 1
					var token = program[evalPC]

					while (token != "DEF") {
						evaluateToken(token)
						
						evalPC++
						token = program[evalPC]
					}

					for (i in fnParams) {
						var fnParam = fnParams[i]
						
						variables[fnParam] = saveX[i]
					}
					
					return argumentStack.pop()
				}
			}
			
		    return elseBranches[pc] //defer evaluation
		}
	},
		
    POKE: {
		parse: function() {
			expressionArgUpTo(operators[","].precedenceLevel)
			expect(",")
			expressionArg()
			expectEnd()
		},
		
		run: function(pc) {
			var value = popAndEvaluate()
			memory[popAndEvaluate()] = value
			
			return pc + 1
		}
	},
	
    PRINT: {
		parse: function() {
			expressionArg()
			expectEnd()
		},
		
		run: function(pc) {
			var msg = popAndDeeplyEvaluate("")
			if (msg === undefined) return
			videoPrint(msg)
			return pc + 1
		}
	},
	
    CLR: {
		parse: expectEnd,
		
		run: function(pc) {
			variables = Object.assign({}, builtInVariables)
			arrays = Object.assign({}, builtInArrays)
			loops = []
			functions = Object.assign({}, builtInFunctions)
			argumentStack = []
			readDataBuffer = []
			readDataPointer = 0
			eventQueue = []
			
			return pc + 1
		}
	},
	
    //OPEN:
    //CLOSE:
    GET: {
		parse: function() {
			assignableArg()
			expectEnd()
		},
		
		run: function(pc) {
			var value = eventQueue.shift()
			
			popAndAssign(function() {
				return value?value:0 
			})

			return pc + 1
		}
	}
}

instructions._LET = { //implicit assignment (omit keyword in listing, appears as token)
	run: instructions.LET.run
}

// abbreviations
instructions["T."] = instructions.THEN
instructions["G."] = instructions.GOTO
instructions["N."] = instructions.NEXT
instructions["R."] = instructions.RETURN
instructions["W."] = instructions.WAIT
instructions["'"] = instructions.REM

var goWords = ["GOTO", "GOSUB", "G."]

var operators = {
    "+": { precedenceLevel: 3, evaluate: (a, b) => a + b },
    "-": { precedenceLevel: 3, evaluate: (a, b) => a - b },
    "*": { precedenceLevel: 2, evaluate: (a, b) => a * b },
    "/": { 
		precedenceLevel: 2, 
		evaluate: function(a, b) {
			if (b == 0) {
				runError("DIVIDE BY ZERO")
			}
			
			return a / b 
		}
	},
    "^": { precedenceLevel: 1, evaluate: Math.pow },
    AND: { precedenceLevel: 6, evaluate: (a, b) => a & b },
    OR: { precedenceLevel: 7, evaluate: (a, b) => a | b },
    ">=": { precedenceLevel: 4, evaluate: (a, b) => a >= b },
    "<>": { precedenceLevel: 4, evaluate: (a, b) => a != b },
    "<=": { precedenceLevel: 4, evaluate: (a, b) => a <= b },
    ">": { precedenceLevel: 4, evaluate: (a, b) => a > b },
    "=": { precedenceLevel: 5, evaluate: (a, b) => a == b },
    "<": { precedenceLevel: 4, evaluate: (a, b) => a < b },
    ",": { precedenceLevel: 8, evaluate: (a, b) => (Array.isArray(a) ? a.concat([b]) : [a, b]), lateEvaluated: true }
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
    PEEK: { apply: arg => (arg in memory ? memory[arg] : 255) },
    LEN: { apply: arg => arg.length },
    "STR$": { apply: arg => "" + arg },
    VAL: { apply: parseFloat },
    ASC: { apply: arg => arg.charCodeAt(0) },
    "CHR$": { apply: String.fromCharCode },
    "LEFT$": { apply: arg => arg[0].substr(0, arg[1]) },
    "RIGHT$": { apply: arg => arg[0].substring(arg[0].length - arg[1]) },
    "MID$": { apply: arg => arg[0].substr(arg[1] - 1, arg[2]) },
    "TIME$": { apply: arg => new Date(Array.isArray(arg)?Date.now():arg).toUTCString().replace(/ GMT$/, '').toUpperCase() },
	TIME: { apply: function() { return Date.now() } },
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
var lineNumbers = [] //mapping program indices of instructions to line numbers
var program = [] //the tokenized program (postfix Polish notation)