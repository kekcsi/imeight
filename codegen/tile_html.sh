#!/bin/bash
for i in `seq 0 575`
do
	if [ $((i%32)) -eq 0 ]
	then
		echo "		<tr>"
	fi
	echo "			<td id=\"tile$i\">&nbsp;</td>"
	if [ $((i%32)) -eq 31 ]
	then
		echo "		</tr>"
	fi
done
