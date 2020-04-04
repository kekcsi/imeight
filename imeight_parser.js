//parser
var text
var rollback
var parseSuccess = true
var lineNumber = 1
var colonCount = 1
var charsParsed = 0

var parseErrorHook = function(message) {}

function newProgram() {
	lineNumber = 1
	charsParsed = 0
	program = []
	bugLocators = []
	labels = { START:0 }
	dataLookup = []
	elseBranches = {}
}

function parseError(message) {
	if (!parseSuccess) return
	parseErrorHook(message)
	parseSuccess = false
}

var NAME_RE = /^[A-Z][A-Z0-9]*[%!$]?/
var ASSIGN_RE = /^[A-Z][A-Z0-9]*[%!$]?([(][^:]*[)])?[ \t]*=/
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
			name = "" //add a placeholder
		}

		program.push(name)
		text = text.substring(name.length)

		var rest = tryPrefix(",")
		
		if (rest === false) {
			break
		} else {
			while(shunt.length > 0) program.push(shunt.pop())
		    shunt.push("_NAMELIST")
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
		bugLocators.push(bugLocator)
		bugLocators[program.length] = bugLocator
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
	colonCount = 1
	
	parseToEndOfLine()
	
	if (parseSuccess) {
		lineNumber++
		charsParsed++
	} else {
		program.splice(rollback, program.length - rollback)
	}
}

function parseText() {
	var lines = taList.value.split("\n")
	fullTextParse = true
	newProgram()

	outputTab() //allow showing parse errors
	parseSuccess = true

	if (lines[lines.length - 1] == "") lines.pop()

	for (var i = 0; parseSuccess && (i < lines.length); i++) {
		text = lines[i]
		parseLine()
	}
	
	if (parseSuccess) {
		listClean = true
		videoPrint("PROGRAM UPDATED".bold())
		divStatus.innerHTML = "&nbsp;"
		inUserInput.value="RUN"
	}
	
	fullTextParse = false
}
