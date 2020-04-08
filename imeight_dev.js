//interactive

var listClean = true //does the tokenized program match the text in the lising?
var oldText = ""

var tabs

function selectTab(selected) {
	for (var i in tabs) {
		if (i == selected) {
			tabs[i].btn.style.borderStyle="inset"
			tabs[i].tab.style.display="block"
		} else {
			tabs[i].btn.style.borderStyle="outset"
			tabs[i].tab.style.display="none"
		}
	}

	tabs[selected].focused.focus()
}

function programTab() { selectTab("Program") }
function outputTab() { selectTab("Output") }
function graphicTab() { selectTab("Graphic") }
function designerTab() { selectTab("Designer") }

function tutorRight() {
	divTutor.style.display = "block"
    divTutor.style.top = "8px"
    divTutor.style.left = "624px";
	btnTutorRight.style.display = "none"
	btnTutorBelow.style.display = "inline"
}

function tutorBelow() {
	divTutor.style.display = "block"
    divTutor.style.top = "372px"
    divTutor.style.left = "8px";
	btnTutorRight.style.display = "inline"
	btnTutorBelow.style.display = "none"
}

function pageLoad() {
	tabs = {
		Program: { btn: btnProgram, tab: tabProgram, focused: taList }, 
		Output: { btn: btnOutput, tab: tabOutput, focused: inUserInput }, 
		Graphic: { btn: btnGraphic, tab: tabGraphic, focused: tabGraphic }, 
		Designer: { btn: btnDesigner, tab: tabDesigner, focused: tabDesigner }
	}

	btnTutorBelow.addEventListener("mouseout", function(event) {
		btnTutorRight.style.display = "inline"
		btnTutorBelow.style.display = "none"
	})
	
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

		updateLineNumber() //in case it's up/down arrow etc.
	})
	
	taList.addEventListener("mouseup", updateLineNumber)
	
	taList.addEventListener("change", function() { listClean = false })
	
	tabGraphic.addEventListener("keydown", function(event) {
		event.preventDefault()
		eventQueue.push(event.keyCode)
		eventHandler()
	})

	setInterval(function() { eventHandler() }, 20)

	// initialize built-in variables for direct expressions (?) on Command Line
	instructions.CLR.run(0)
}

function updateLineNumber() {
	inLine.value = taList.value.substring(0, taList.selectionStart).split("\n").length
	divStatus.innerHTML = ""
}

function goLine(target) {
	var currPos = 0
	var lines = taList.value.split("\n")
	var target0based = parseInt(target) - 1
	
	taList.scrollTop = Math.max(taList.scrollTop, (target0based - 16)*15)
	taList.scrollTop = Math.min(taList.scrollTop, (target0based - 4)*15)

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

videoPrint = function(message) {
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
	
	if (input === "") return

	fullTextParse = false
	var command = input.toUpperCase().trim()

	if (command in commands) {
		commands[command]()
	} else if (command.startsWith("?")) {
		//direct expression
		var saveProgram = program.slice()
		var saveStopped = stopped
		
		var evalPC = program.length

		var rest = expressionArg(command.substring(1))
		if (rest !== "") {
			parseError("EXTRA ARGUMENT")
		} else {
			bugLocator = false
			stopped = evalPC //enable reporting errors (even after errors)
			
			while (evalPC in program) {
				var token = program[evalPC]
				evaluateToken(token)
				evalPC++
			}

			var result = popAndEvaluate("")
			if (result === undefined) result = "READY."
			videoPrint(result)
		}
		
		program = saveProgram
		stopped = saveStopped
	} else {
		//try adding it as a line to the end of the program text
		parseSuccess = true

		text = input
		parseLine()
		
		if (parseSuccess) {
			if (listClean) {
				if (!taList.value.endsWith("\n") && taList.value.length > 0) {
					taList.value += "\n"
				}
				taList.value += input + "\n"
				updateLineNumber()
			} else {
				divStatus.innerHTML = "[PROGRAM FORKED]"
			}
			div.innerHTML = div.innerHTML.bold()
		} else {
			inUserInput.value = input
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

runErrorHook = function(message) {
	if (bugLocator) {
		videoPrint("?" + message + "  ERROR IN " + bugLocator.line + ":" 
			+ bugLocator.colon + ", " + bugLocator.instruction)
		
		divStatus.innerHTML = message
		taList.selectionStart = bugLocator.chStart
		taList.selectionEnd = bugLocator.chEnd
		inLine.value = bugLocator.line
		taList.focus()
	} else {
		videoPrint("?" + message + "  ERROR")
	}
}

parseErrorHook = function(message) {
	if (fullTextParse) {
		videoPrint("?" + message + "  ERROR IN " + lineNumber + ":" + colonCount)
		divStatus.innerHTML = message
		charsParsed -= text.length
	} else {
		videoPrint("?" + message + "  ERROR")
	}

	text = ""
	videoPrint("READY.")

	if (fullTextParse) {
		inUserInput.value = "LIST"
		taList.selectionStart = charsParsed
		taList.selectionEnd = (taList.value + "\n").indexOf("\n", charsParsed)
		inLine.value = lineNumber
		taList.focus()
	}
}
