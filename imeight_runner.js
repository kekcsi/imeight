//transfer variables from parser to runner
  
var program = [] //the tokenized program (postfix Polish notation)

var labels = { START: 0 } //pointers to instructions after each @ instruction in the tokenized program
var dataLookup = [] //pointers to DATA instruction arguments in the tokenized program (after _DEFER)
var elseBranches = {} //where to jump if condition evaluates to false (pointer to THEN mapped to after IF)
var bugLocators = [] //mapping program indices of instructions to bugLocators (debug info)

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

//runner hooks
var runErrorHook = function(message) {} // only react in dev env - not in prod
var videoPrint = function(message) {
	console.log(message)
} // print to Command Line in dev env - browser logs instead in prod

//runner constant
var safetyWait = 10000

var builtInVariables = {
    PI: Math.PI,
	TZO: -60000*new Date().getTimezoneOffset()
}
 
var builtInArrays = {}

//runner routines
function runError(message) {
	if (stopped === true) return
	runErrorHook(message)
	stopped = true
}

//try to interpret the token as a function call or array member reference
function indexedReference(token, expectedSet) {
	if (typeof token === "string" && token.endsWith("(")) {
		var name = token.substring(0, token.length - 1)
		
		if (expectedSet === undefined || (name in expectedSet)) {
			return name
		}
	}
	
	return false
}

//make string values distinguishable from tokens
function preparePush(result) {
	if (typeof result === "string") {
		result = '"' + result + '"'
	}
	
	return result
}

function evaluateOperator(token) {
	var o = operators[token]
	
	var b = getValue(argumentStack.pop())
	var a = getValue(argumentStack.pop())

	var result = o.evaluate(a, b)

	if (result === undefined) {
		return
	}
		
	argumentStack.push(preparePush(result))
}

function runProgram() {
	stopped = 0
	instructions.CLR.run(0)
	
	contProgram()
}

function contProgram() {
    var programCounter = stopped
	stopped = 0
	var heat = 10*safetyWait + safetyWait*Math.random()

    while (programCounter < program.length && !stopped) {
        var token = program[programCounter]
		if (programCounter in bugLocators) bugLocator = bugLocators[programCounter]

        if (token in instructions) {
            var instruction = instructions[token]
            programCounter = instruction.run(programCounter)
			
			// keep the browser responsive in case of a busy loop
			if(heat-- <= 0) {
				instructions.WAIT.run(programCounter - 1)
				break //in case program stops at 0
			}
        } else {
			var funcName = indexedReference(token, functions)
			if (funcName !== false) {
				var arg = popAndEvaluate([])
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

	variables.STATUS = (stopped === true) ? -1 : ((stopped == 0) ? 0 : 1)
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

function popAndEvaluate(defaultValue) {
	var arg = argumentStack.pop()
	if (arg === "") arg = defaultValue
	return getValue(arg)
}

function evaluateToken(token) {
	var funcName = indexedReference(token, functions)
	
	if (funcName !== false) {
		var arg = popAndEvaluate([])
		argumentStack.push(preparePush(functions[funcName].apply(arg)))
	} else if (token in operators) {
		evaluateOperator(token)
	} else if (token in variables) {
		argumentStack.push(preparePush(variables[token]))
	} else {
		argumentStack.push(token)
	}
}

var NUMBER_LITERAL_RE = /^(([0-9]*[.])?[0-9]+(E[+-]?[0-9]+)?|%[01]+|![0123]+|[$][A-F0-9]+)/

// dereference names and parse literals
function getValue(arg) {
	if (typeof arg !== "string") {
		return arg
	}
	
	var arrayName = indexedReference(arg)
	if (arrayName !== false) {
		var i = popAndEvaluate()
		
		if (arrayName in arrays) {
			if (i in arrays[arrayName]) {
				return arrays[arrayName][i]
			}
		}

		runError("NO VALUE")
		return
	} else if (getRegexPrefix(NAME_RE, arg) === arg) {
		if (arg in variables) {
			return variables[arg]
		}

		runError("NO VALUE")
		return
	} 
	
	if (arg.startsWith('"') && arg.endsWith('"')) {
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
		if (stopped === true) return // valueSupplier had a runError
		return { array: a, index: i }
	} else if (getRegexPrefix(NAME_RE, name) === name) {
		variables[name] = valueSupplier(name, variables[name])
		if (stopped === true) return // valueSupplier had a runError
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
