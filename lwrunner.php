<!DOCTYPE html>
<html lang="en">
<head>
	<script type="text/javascript" src="<?php echo $_POST["urlbase"]; ?>imeight_runner.js"></script>
    <script type="text/javascript" src="<?php echo $_POST["urlbase"]; ?>imeight_pl.js"></script>
    <script type="text/javascript" src="<?php echo $_POST["urlbase"]; ?>video.js"></script>
	<script type="application/json" id="programJson"><?php echo $_POST["programJson"]; ?></script>
	<script type="application/json" id="labelsJson"><?php echo $_POST["labelsJson"]; ?></script>
	<script type="application/json" id="dataLookupJson"><?php echo $_POST["dataLookupJson"]; ?></script>
	<script type="application/json" id="elseBranchesJson"><?php echo $_POST["elseBranchesJson"]; ?></script>
	<script type="text/javascript">
		program = JSON.parse(document.scripts.namedItem("programJson").text)
		labels = JSON.parse(document.scripts.namedItem("labelsJson").text)
		dataLookup = JSON.parse(document.scripts.namedItem("dataLookupJson").text)
		elseBranches = JSON.parse(document.scripts.namedItem("elseBranchesJson").text)
		var interact = function() {}
		pageLoadHooks.push(runProgram)
	</script>
	<style type="text/css">
		#tabGraphic {
			width:384px;
			height:216px;
			position:relative;
			overflow:hidden;
			background:black;
		}
	</style>
</head>
<body onload="pageLoad()">
	<div id="tabGraphic"></div>
</body>
