var listClean = true //does the tokenized program match the text in the listing?
var oldText = ""

var tabs
var grabTutor = null

function dragTutor(ev) {
	if (ev.buttons == 0) grabTutor = null
	if (grabTutor === null) return
	
	ev.preventDefault()
	
	divTutor.style.left = ev.clientX + grabTutor + "px"
}

function selectTab(selected) {
	var oldTab

	for (var i in tabs) {
		if (tabs[i].tab.style.display != "none") {
			oldTab = i
		}
		
		if (i == selected) {
			tabs[i].btn.src = tabs[i].btn.src.replace("-ina", "-act")
			tabs[i].tab.style.display = "block"
		} else {
			tabs[i].btn.src = tabs[i].btn.src.replace("-act", "-ina")
			tabs[i].tab.style.display = "none"
		}
	}

	tabs[selected].focused.focus()
	
	return oldTab
}

function programTab() { return selectTab("Program") }
function graphicTab() { return selectTab("Graphic") }
function designerTab() { return selectTab("Designer") }
function miscTab() { return selectTab("Misc") }

pageLoadHooks.push(function() {
	tabs = {
		Program: { btn: btnProgram, tab: tabProgram, focused: taList }, 
		Graphic: { btn: btnGraphic, tab: tabGraphic, focused: tabGraphic }, 
		Designer: { btn: btnDesigner, tab: tabDesigner, focused: tabDesigner },
		Misc: { btn: btnMisc, tab: tabMisc, focused: tabMisc }
	}

	cursorBlink = true
	
	taList.addEventListener("keyup", function(event) {
		if (event.keyCode === 120) { //F9
			event.preventDefault()
			parseText()
		}

		updateLineNumber() //in case it's up/down arrow etc.
	})
	
	taList.addEventListener("mouseup", updateLineNumber)
	
	taList.addEventListener("change", function() { 
		listClean = false

		if (window.navigator.userAgent.indexOf("Edge/") >= 0) return
		localStorage.setItem("proglist", taList.value)
	})

	// initialize built-in variables for direct expressions (?) on Command Line
	instructions.CLR.run(0)
	
	//Edge will fill the form automatically by default
	listClean = false
	if (window.navigator.userAgent.indexOf("Edge/") >= 0) return
	taList.value = localStorage.getItem("proglist")
})

function updateLineNumber() {
	inLine.value = taList.value.substring(0, taList.selectionStart).split("\n").length
	divStatus.innerHTML = ""
}

function goLine(target, selectIt) {
	var currPos = 0
	var lines = taList.value.split("\n")
	var target0based = parseInt(target) - 1
	
	var saveTab = programTab()
	taList.scrollTop = Math.max(taList.scrollTop, (target0based - 16)*15)
	taList.scrollTop = Math.min(taList.scrollTop, (target0based - 4)*15)
	selectTab(saveTab)

	if (selectIt !== false) {
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
}

//the default inputAction routine
var interact = function(input) {
	if (input === null) return
	
	videoPrint(input)
	
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
		bugLocator = false
		parseSuccess = true //enable reporting PARSE errors (even after errors)
		stopped = evalPC //enable reporting RUN errors (even after errors)

		var rest = expressionArg(input.trim().substring(1))
		if (rest !== "") {
			parseError("EXTRA ARGUMENT")
		} else {
			while (evalPC in program) {
				var token = program[evalPC]
				evaluateToken(token)
				evalPC++
			}

			var result = popAndEvaluate("")
			if (result === undefined) {
				readyPrompt()
			} else {
				videoPrint(result)
			}
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
			
			variables.CURSORY--
			videoPrint(FmtStr("PROGRAM", input))
		} else {
			userInputValue = input
		}
	}
}
var inputAction = interact

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
		goLine(bugLocator.line, false)
		taList.selectionStart = bugLocator.chStart
		taList.selectionEnd = bugLocator.chEnd
		taList.focus()

		videoPrint("?" + message + "  ERROR IN " + bugLocator.line + ":" 
			+ bugLocator.colon + ", " + bugLocator.instruction)
		
		divStatus.innerHTML = message
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
	readyPrompt()

	if (fullTextParse) {
		userInputValue = "LIST"
		goLine(lineNumber, false)
		taList.selectionStart = charsParsed
		taList.selectionEnd = (taList.value + "\n").indexOf("\n", charsParsed)
		taList.focus()
	}
}
