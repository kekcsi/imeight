//parser + runner shared constants
var instructions = {
    "@": {
        //text label for GOTO/GOSUB/RESTORE (put them on the list while relinking)
        parse: function() {
            nameArg()
			var name = program[program.length - 1]
			if (name in labels) {
				parseError("DUPLICATE LABEL")
				return
			}
            labels[name] = program.length + 1
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
				
				program.splice(firstArg, 0, "") //insert default first argument
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
				if (message === undefined) return
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
				
				videoPrint(response.italics())
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
			var size = popAndEvaluate()
			var name = argumentStack.pop()

			if (name in functions) {
				runError("DIM OVERDEFINES DEF")
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
	
	PUSH: {
		parse: function() {
			expressionArg()
			expectEnd()
		},

		run: function(pc) {
			var value = popAndEvaluate()
			argumentStack.push(preparePush(value))
			return pc + 1
		}
	},
	
	PULL: {
		parse: function() {
			assignableArg()
			expectEnd()
		},
		
		run: function(pc) {
			popAndAssign(function() { return popAndEvaluate() })	
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

			if (typeof target == "number" && target in program) {
				return target
			}

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
			var which = parseFloat("" + popAndEvaluate())
			which = Math.floor(which) - 1
			
			if (which in labelArray) {
				argumentStack.push(labelArray[which])
			} else {
				argumentStack.push(labelArray[labelArray.length - 1])
			}

			return instructions[goWord].run(pc)
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
				parseError("DEF SYNTAX")
				return
			} else {
				text = text.substring(prefix.length)
				namesArg()
				expect(")")
				
				program.push(prefix.substring(0, prefix.length - 1))
			}
			
			expect("=")
			
			var deStart = deferredEvaluation("_FN")
			expressionArg()
			expectEnd(deStart)
		}
	},
	
	// comma between names that are not to be evaluated (label or definition)
	_NAMELIST: {
		run: function(pc) {
			var b = argumentStack.pop()
			var a = argumentStack.pop()
			
			argumentStack.push(Array.isArray(a) ? a.concat([b]) : [a, b])
			
			return pc + 1
		}
	},

	// add a user function definition
	_FN: {
		run: function(pc) {
			var name = argumentStack.pop()
			var fnParams = argumentStack.pop()
			if (!Array.isArray(fnParams)) {
				if (fnParams === "") {
					//nullary case
					fnParams = []
				} else {
					// unary case
					fnParams = [fnParams]
				}
			}

			if (name in arrays) {
				runError("DEF OVERDEFINES DIM")
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
					
					return popAndEvaluate()
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
			var msg = popAndEvaluate("")
			if (msg === undefined) return
			videoPrint(msg)
			return pc + 1
		}
	},
	
    CLR: {
		parse: expectEnd,
		
		run: function(pc) {
			variables = Object.assign({}, builtInVariables)
			arrays = {}
			for (array in builtInArrays) {
				arrays[array] = builtInArrays[array].slice()
			}
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
				return
			}
			
			return a / b 
		}
	},
	MOD: { 
		precedenceLevel: 2, 
		evaluate: function(a, b) {
			if (b == 0) {
				runError("DIVIDE BY ZERO")
				return
			}
			
			return a % b
		}
	},
    "^": { precedenceLevel: 1, evaluate: Math.pow },
    AND: { precedenceLevel: 6, evaluate: (a, b) => a & b },
	XOR: { precedenceLevel: 7, evaluate: (a, b) => a ^ b },
    OR: { precedenceLevel: 8, evaluate: (a, b) => a | b },
    ">=": { precedenceLevel: 4, evaluate: (a, b) => a >= b },
    "<>": { precedenceLevel: 4, evaluate: (a, b) => a != b },
    "<=": { precedenceLevel: 4, evaluate: (a, b) => a <= b },
    ">": { precedenceLevel: 4, evaluate: (a, b) => a > b },
    "=": { precedenceLevel: 5, evaluate: (a, b) => a == b },
    "<": { precedenceLevel: 4, evaluate: (a, b) => a < b },
    ",": { precedenceLevel: 9, evaluate: (a, b) => (Array.isArray(a) ? a.concat([b]) : [a, b]) }
}
 
var builtInFunctions = {
    NOT: { apply: arg => ~arg }, 
    SGN: { apply: Math.sign },
    FRAC: { apply: arg => arg%1 },
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
    LEN: { apply: arg => ("" + arg).length },
    "STR$": { apply: arg => "" + arg },
    VAL: { apply: parseFloat },
    ASC: { apply: arg => ("" + arg).charCodeAt(0) },
    "CHR$": { apply: String.fromCharCode },
    "LEFT$": { apply: arg => ("" + arg[0]).substr(0, arg[1]) },
    "RIGHT$": { apply: arg => ("" + arg[0]).substring(arg[0].length - arg[1]) },
    "MID$": { apply: arg => ("" + arg[0]).substr(arg[1] - 1, arg[2]) },
    "TIME$": { apply: arg => new Date(arg == []?Date.now():arg).toUTCString().replace(/ GMT$/, '').toUpperCase() },
	TIME: { apply: function() { return Date.now() } },
    _PAREN: {
        listAs: "(", //explicitly marked parentheses - omit keyword in listing 
        apply: arg => arg
    },
	_NEG: { apply: arg => -arg }
}

