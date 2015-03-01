//var newObject = jQuery.extend(true, {}, oldObject);//jQuery deep copy
var digits = [];
var twenty_four_hour_clock = false;
var clockIntervalID;

//create the digits 0-9 for later use by the clock update function
function drawDigits() {
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext('2d');
	var base_image = new Image();
	base_image.onload = function() {
		canvas.width = base_image.width * 6;
		canvas.height = base_image.height * 1;
		context.drawImage(base_image, 0, 0);
		//get CSS colors
		var colorDigit = $("#canvas").css("color").slice(4, -1).split(',');
		var colorDigitOff = $("#canvas").css("outline-color").slice(4, -1).split(',');
		var colorBackground = $("#canvas").css("background-color").slice(4, -1).split(',');
		var colorOutline = $("#canvas").css("outline-color").slice(4, -1).split(',');
		var imageData = context.getImageData(0, 0, base_image.width, base_image.height);
		for (var j = 0; j < 10; j++) {
			digits[j] = context.createImageData(base_image.width, base_image.height);
			for (var i = 0; i < imageData.data.length; i+=4) {
				var result = fillPixel(imageData.data, i, j);
				if (result == 1) {
					digits[j].data[i] = colorDigit[0];
					digits[j].data[i+1] = colorDigit[1];
					digits[j].data[i+2] = colorDigit[2];
					digits[j].data[i+3] = 255;
				}
				else if (result == 2) {
					digits[j].data[i] = colorDigitOff[0];
					digits[j].data[i+1] = colorDigitOff[1];
					digits[j].data[i+2] = colorDigitOff[2];
					digits[j].data[i+3] = 255;
				}
				else if (result == -1) {
					digits[j].data[i] = colorBackground[0];
					digits[j].data[i+1] = colorBackground[1];
					digits[j].data[i+2] = colorBackground[2];
					digits[j].data[i+3] = 255;
				}
				else if (result == -2) {
					digits[j].data[i] = 0;//colorOutline[0];
					digits[j].data[i+1] = 0;//colorOutline[1];
					digits[j].data[i+2] = 0;//colorOutline[2];
					digits[j].data[i+3] = 255;
				}
				else {
					digits[j].data[i] = imageData.data[i];
					digits[j].data[i+1] = imageData.data[i+1];
					digits[j].data[i+2] = imageData.data[i+2];
					digits[j].data[i+3] = imageData.data[i+3];
				}
			}
		}
		$("#canvas").triggerHandler("onloadeddata");
	}
	//base_image.crossOrigin = "use-credentials";//'anonymous';
	base_image.src = 'broken_lcd.png'; //src needs to be specified after onload event	
}

/*return values
-2: outline
-1: background
 0: source
 1: digit on
 2: digit off*/
function fillPixel(idd, i, j) {
	//fill 1
	if (idd[i] == 1 && idd[i + 1] == 1 && idd[i + 2] == 1) {
		if (j != 1 && j != 4)//0 2 3 5 6 7 8 9
			return 1;
		return 2;
	}
	//fill 2
	if (idd[i] == 2 && idd[i + 1] == 2 && idd[i + 2] == 2) {
		if (j != 5 && j != 6)//0 1 2 3 4 7 8 9
			return 1;
		return 2;
	}
	//fill 3
	if (idd[i] == 3 && idd[i + 1] == 3 && idd[i + 2] == 3) {
		if (j != 2)//0 1 3 4 5 6 7 8 9
			return 1;
		return 2;
	}
	//fill 4
	if (idd[i] == 4 && idd[i + 1] == 4 && idd[i + 2] == 4) {
		if (j != 1 && j != 4 && j != 7)//0 2 3 5 6 8 9
			return 1;
		return 2;
	}
	//fill 5
	if (idd[i] == 5 && idd[i + 1] == 5 && idd[i + 2] == 5) {
		if (j == 0 || j == 2 || j == 6 || j == 8)//0 2 6 8
			return 1;
		return 2;
	}
	//fill 6
	if (idd[i] == 6 && idd[i + 1] == 6 && idd[i + 2] == 6) {
		if (j != 1 && j != 2 && j != 3 && j != 7)//0 4 5 6 8 9
			return 1;
		return 2;
	}
	//fill 7
	if (idd[i] == 7 && idd[i + 1] == 7 && idd[i + 2] == 7) {
		if (j != 0 && j != 1 && j != 7)//2 3 4 5 6 8 9
			return 1;
		return 2;
	}
	//fill 8 (semi-colon)
	if (idd[i] == 8 && idd[i + 1] == 8 && idd[i + 2] == 8) {
		if (false)//(never...?)
			return 0;
	}
	//background
	if (idd[i] == 0 && idd[i + 1] == 255 && idd[i + 2] == 0)
		return - 1;
	//outline
	if (idd[i] == 0 && idd[i + 1] == 0 && idd[i + 2] == 0)
		return - 2;
	return 0;
}

function updateClock() {
	var d = new Date();
	var offset =  d.getTimezoneOffset() / 60;//automatically handled?
	var seconds = d.getSeconds();
	var minutes = d.getMinutes();
	var hours = d.getHours();
	var AMPM = false;
	if (!twenty_four_hour_clock)
		if (hours > 12) {
			hours = hours - 12;
			AMPM = true;
		}
	var day = d.getDate();
	var month = d.getMonth();
	var year = d.getFullYear();
	var monthText = getMonthText(month);
	$("#demo").text([year, monthText, day, hours, minutes, seconds].join(':'));
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext('2d');
	if (false) {//display everything in the canvas for testing
		context.putImageData(digits[0],0,0);
		context.putImageData(digits[1],digits[0].width*1,0);
		context.putImageData(digits[2],digits[0].width*2,0);
		context.putImageData(digits[3],digits[0].width*3,0);
		context.putImageData(digits[4],digits[0].width*4,0);
		context.putImageData(digits[5],0,digits[0].height);
		context.putImageData(digits[6],digits[0].width*1,digits[0].height);
		context.putImageData(digits[7],digits[0].width*2,digits[0].height);
		context.putImageData(digits[8],digits[0].width*3,digits[0].height);
		context.putImageData(digits[9],digits[0].width*4,digits[0].height);
		return 0;
	}
	if (true) {//remove hours later
		/*if (((hours - 1) % 12) > 9)*/
			context.putImageData(digits[Math.floor(hours / 10)], 0, 0);
		/*else
			throw a blank rectangle up to fill the empty space of hours 1-9
			*/
		context.putImageData(digits[hours % 10], digits[0].width * 1, 0);
	}
	if (true) {//remove minutes later
		context.putImageData(digits[Math.floor(minutes / 10)], digits[0].width * 2, 0);
		context.putImageData(digits[minutes % 10], digits[0].width * 3, 0);
	}
	if (true) { //later have an option for displaying seconds or not
		context.putImageData(digits[Math.floor(seconds / 10)], digits[0].width * 4, 0);
		context.putImageData(digits[seconds % 10], digits[0].width * 5, 0);
	}
	//check all timers (loaded once via SQL / ajax?)
	if (Date.now() > +new Date(year, month, day, 17, 10).getTime() ||
	(Date.now() > +new Date(year, month, day, 11, 5).getTime() && 
	Date.now() < +new Date(year, month, day, 11, 20).getTime())) {
		//signal this timer has fired to avoid hall of echoes
		//ask user to cancel audio?
		//time when alert is no longer useful (late to work)
		$("#audio")[0].play();//shows as undefined when typed live in the console, but plays anyway
	}		
}

function isLeapYear(year) {
    if (year % 400 == 0)
        return true;
    if (year % 100 == 0)
        return false;
    return year % 4 == 0;
}

function getMonthText(month) {
	if (month == 0)
		return 'January';
	else if (month == 1)
		return 'February';
	else if (month == 2)
		return 'March';
	else if (month == 3)
		return 'April';
	else if (month == 4)
		return 'May';
	else if (month == 5)
		return 'June';
	else if (month == 6)
		return 'July';
	else if (month == 7)
		return 'August';
	else if (month == 8)
		return 'September';
	else if (month == 9)
		return 'October';
	else if (month == 10)
		return 'November';
	return 'December';
}