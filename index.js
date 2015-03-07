//var newObject = jQuery.extend(true, {}, oldObject);//jQuery deep copy
var digits = [];
var twenty_four_hour_clock = false;
var clockIntervalID;
var lengthOfSemiColon = 32;//cannot be measured
var timeAlarmExpires = 300;//in seconds

/*Timer "class"
  0 alarm
  1 timer*/
function Timer(time, type) {
	this.time = time;
	this.type = type;
}

//create the digits 0-9 for later use by the clock update function
function drawDigits() {
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext('2d');
	var base_image = new Image();
	base_image.onload = function() {
		canvas.width = base_image.width * 6 - lengthOfSemiColon;
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
	base_image.src = 'digit.png'; //src needs to be specified after onload event	
}

/*return values... replace with enum
-2: outline
-1: background
 0: source
 1: digit on
 2: digit off*/
function fillPixel(idd, i, j) {
	//fill 1
	var x = fp(1, [0, 2, 3, 5, 6, 7, 8, 9], idd[i], idd[i + 1], idd[i + 2], j);
	if (x != 127)
		return x;
	//fill 2
	var x = fp(2, [0, 1, 2, 3, 4, 7, 8, 9], idd[i], idd[i + 1], idd[i + 2], j);
	if (x != 127)
		return x;
	//fill 3
	var x = fp(3, [0, 1, 3, 4, 5, 6, 7, 8, 9], idd[i], idd[i + 1], idd[i + 2], j);
	if (x != 127)
		return x;
	//fill 4
	var x = fp(4, [0, 2, 3, 5, 6, 8, 9], idd[i], idd[i + 1], idd[i + 2], j);
	if (x != 127)
		return x;
	//fill 5
	var x = fp(5, [0, 2, 6, 8], idd[i], idd[i + 1], idd[i + 2], j);
	if (x != 127)
		return x;
	//fill 6
	var x = fp(6, [0, 4, 5, 6, 8, 9], idd[i], idd[i + 1], idd[i + 2], j);
	if (x != 127)
		return x;
	//fill 7
	var x = fp(7, [2, 3, 4, 5, 6, 8, 9], idd[i], idd[i + 1], idd[i + 2], j);
	if (x != 127)
		return x;
	//fill 8 (semi-colon)
	if (idd[i] == 8 && idd[i + 1] == 8 && idd[i + 2] == 8)
		return 1;
	if (idd[i] == 0 && idd[i + 1] == 255 && idd[i + 2] == 255)
		return -2;
	//background
	if (idd[i] == 0 && idd[i + 1] == 255 && idd[i + 2] == 0)
		return - 1;
	/*//outline (all outlines are specifically tagged
	if (idd[i] == 0 && idd[i + 1] == 0 && idd[i + 2] == 0)
		return - 2;*/
	return 0;
}

function fp(matching_color, valid_digits, red, green, blue, index) {
	if (red == matching_color && green == matching_color) {
		var result = false;
		for (var i = 0; i < valid_digits.length; i++)
			if (index == valid_digits[i]) {
				result = true;
				break;
			}
		if (result) {
			if (blue == matching_color)
				return 1;
			return -2;
		}
		else {
			if (blue == matching_color)
				return 2;
			return -1;
		}
	}
	return 127; //fail code
}

/*supply "MM DD YYYY " so that the time "HH[:MM][:SS][:MS]" in the input box is interpreted as a time for today by the parser
rfc2822*/
function validateInput() {
	var today = new Date();
	var d = Date.parse(Number(today.getMonth() + 1) + ' ' + Number(today.getDay() + 1) + ' ' + today.getFullYear() + ' ' + $("input").val());//apparently date is locale dependent since it is taking US formatting outside the spec
	if(! isNaN(d)) {
		console.log(new Date(d));
		$("#timer_warning").text("");
	}
	else {
		console.log('invalid');
		$("#timer_warning").text("Expecting HH:MM:[:SS]");
	}
}

function getTimers() {
	return;
	/*connect to database
	get the timers; set the timer objects
	
-- Database: `mgorgeix_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `Timer`
--

CREATE TABLE IF NOT EXISTS `Timer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `time` time NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

	*/
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
	if (hours == 0) {
		if (twenty_four_hour_clock)
			hours = 24;
		else
			hours = 12;
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
	var fillColor = $("#canvas").css("background-color").slice(4, -1).split(',');
	context.fillStyle = "#" + strToHex(fillColor[0]) + strToHex(fillColor[1]) + strToHex(fillColor[2]);//seems too common to not have a default method...
	if (true) {//remove hours conditionally
		if (hours > 9) {
			context.putImageData(digits[Math.floor(hours / 10)], 0, 0);
			context.fillRect(digits[0].width - lengthOfSemiColon, 0, lengthOfSemiColon, digits[0].height);
			}
		else {
			context.fillRect(0, 0, digits[0].width, digits[0].height);
			}
		context.putImageData(digits[hours % 10], digits[0].width * 1, 0);
	}
	if (true) {//remove minutes conditionally
		context.putImageData(digits[Math.floor(minutes / 10)], digits[0].width * 2, 0);
		context.fillRect(digits[0].width * 3 - lengthOfSemiColon, 0, lengthOfSemiColon, digits[0].height);
		context.putImageData(digits[minutes % 10], digits[0].width * 3, 0);
	}
	if (true) { //remove seconds conditionally
		context.putImageData(digits[Math.floor(seconds / 10)], digits[0].width * 4, 0);
		context.fillRect(digits[0].width * 5 - lengthOfSemiColon, 0, lengthOfSemiColon, digits[0].height);
		context.putImageData(digits[seconds % 10], digits[0].width * 5, 0);
	}
	/*if (true { //milliseconds if hours are not displayed??
		var zzz;
	}*/
	//check all timers (loaded once via SQL / ajax?)
	if ((Date.now() > +new Date(year, month, day, 17, 10).getTime() && Date.now() < +new Date(year, month, day, 17, 20).getTime())||
	(Date.now() > +new Date(year, month, day, 11, 5).getTime() && 
	Date.now() < +new Date(year, month, day, 11, 20).getTime())) {
		//signal this timer has fired to avoid hall of echoes
		//ask user to cancel audio?
		//time when alert is no longer useful (late to work)
		$("#audio")[0].play();
	}		
}

function strToHex(str) {
	return ('0' + parseInt(str).toString(16)).substr(-2);
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