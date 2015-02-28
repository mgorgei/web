var digits = [];
//var newObject = jQuery.extend(true, {}, oldObject);//jQuery deep copy
function drawDigits() {
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext('2d');
	var base_image = new Image();
	//create the digits 0-9 for later use by the clock update function
	base_image.onload = function() {
		canvas.width = base_image.width * 6;
		canvas.height = base_image.height * 1;
		context.drawImage(base_image, 0, 0);
		//get CSS colors
		var colorDigit = $("#canvas").css("color").slice(4, -1).split(',');
		var colorDigitOff = $("#canvas").css("outline-color").slice(4, -1).split(',');
		var colorBackground = $("#canvas").css("background-color").slice(4, -1).split(',');
		var imageData = context.getImageData(0, 0, base_image.width, base_image.height);
		for (var j = 0; j < 10; j++) {
			digits[j] = context.createImageData(base_image.width, base_image.height);//all black copy of dimensions
			for (var i = 0; i < imageData.data.length; i+=4) {
				var result = fillDigit(imageData.data, i, j);
				if (result > 0) {//data is arranged RGBARGBA...
					if (result == 1) {
						digits[j].data[i] = colorDigit[0];
						digits[j].data[i+1] = colorDigit[1];
						digits[j].data[i+2] = colorDigit[2];
						digits[j].data[i+3] = 255;
					}
					else {
						digits[j].data[i] = colorDigitOff[0];
						digits[j].data[i+1] = colorDigitOff[1];
						digits[j].data[i+2] = colorDigitOff[2];
						digits[j].data[i+3] = 255;
					}
				}
				else {
					if (result == -1) {
						digits[j].data[i] = colorBackground[0];
						digits[j].data[i+1] = colorBackground[1];
						digits[j].data[i+2] = colorBackground[2];
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
		}
		if (false) {//display everything in the canvas for testing
			context.putImageData(digits[0],0,0);
			context.putImageData(digits[1],base_image.width*1,0);
			context.putImageData(digits[2],base_image.width*2,0);
			context.putImageData(digits[3],base_image.width*3,0);
			context.putImageData(digits[4],base_image.width*4,0);
			context.putImageData(digits[5],0,base_image.height);
			context.putImageData(digits[6],base_image.width*1,base_image.height);
			context.putImageData(digits[7],base_image.width*2,base_image.height);
			context.putImageData(digits[8],base_image.width*3,base_image.height);
			context.putImageData(digits[9],base_image.width*4,base_image.height);
		}
		$("#canvas").triggerHandler("onloadeddata");
	}
	//base_image.crossOrigin = "use-credentials";//'anonymous';
	base_image.src = 'broken_lcd.png'; //src needs to be specified after onload event	
}

/*123456,23,12754,12734,6723,16734,167345,123,1234567,123467
  0      1  2     3     4    5     6      7   8       9
   128 64 32 16 8 4 2 1
     1  2  3  4 5 6 7 8
trans = [252, 96, 218, 242, 102, 182, 190, 224, 254, 246]*/

/*return values
-1: background
 0: source (could expand to outlines of digits as -2 when image gets cleaned)
 1: digit on
 2: digit off
*/
function fillDigit(idd, i, j) {//data is arranged RGBARGBA...
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
	return 0;
}

var twenty_four_hour_clock = false;
function updateClock() {
	var raw_seconds = Math.floor($.now() / 1000);//time in seconds since 1/1/1970
	var d = new Date();
	var offset =  d.getTimezoneOffset() / 60;
	var seconds = raw_seconds % 60;
	raw_seconds = raw_seconds - seconds;
	var minutes = (raw_seconds % 3600) / 60;
	raw_seconds = raw_seconds - minutes * 60;
	var hours = (raw_seconds % 86400) / 3600 - offset;
	raw_seconds = raw_seconds - (hours + offset) * 3600;
	if (!twenty_four_hour_clock)
		if (hours > 12)
			hours = hours - 12;
	var days = (raw_seconds / 86400);
	raw_seconds = raw_seconds - days * 86400;//should be 0
	/*************************************************************************/
	var remaining_days = days;
	var year = 1970;
	var tdays = 0;
	while (remaining_days > 364){
		if (isLeapYear(year)) {
			tdays = 366;
		}
		else {
			tdays = 365;
		}
		remaining_days -= tdays;
		year += 1;
	}
	/*************************************************************************/
	var month;
	if (remaining_days > 0){
		remaining_days -= 31;
		month = 'January';
	}
	if (remaining_days > 0){
		remaining_days -= 28;
		month = 'February';
		if (isLeapYear(year))
			remaining_days -= 1;
	}
	if (remaining_days > 0){
		remaining_days -= 31;
		month = 'March';
	}
	if (remaining_days > 0){
		remaining_days -= 30;
		month = 'April';
	}
	if (remaining_days > 0){
		remaining_days -= 31;
		month = 'May';
	}
	if (remaining_days > 0){
		remaining_days -= 30;
		month = 'June';
	}
	if (remaining_days > 0){
		remaining_days -= 31;
		month = 'July';
	}
	if (remaining_days > 0){
		remaining_days -= 31;
		month = 'August';
	}
	if (remaining_days > 0){
		remaining_days -= 30;
		month = 'September';
	}
	if (remaining_days > 0){
		remaining_days -= 31;
		month = 'October';
	}
	if (remaining_days > 0){
		remaining_days -= 30;
		month = 'November';
	}
	if (remaining_days > 0){
		remaining_days -= 31;
		month = 'December';
	}
	var day = 28 + remaining_days + 1;//hackery based on this month as february without a "thismonth" function
	/*************************************************************************/
	$("#demo").text([year, month, day, hours, minutes, seconds].join(':'));
	/*************************************************************************/
	//wrap this in a custom event?
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext('2d');
	//hours
	//console.log(digits[0], digits[0].length, typeof digits[0]);
	context.putImageData(digits[Math.floor(hours / 10)], 0, 0);
	context.putImageData(digits[hours % 10], digits[0].width * 1, 0);
	//minutes
	context.putImageData(digits[Math.floor(minutes / 10)], digits[0].width * 2, 0);
	context.putImageData(digits[minutes % 10], digits[0].width * 3, 0);
	//seconds
	context.putImageData(digits[Math.floor(seconds / 10)], digits[0].width * 4, 0);
	context.putImageData(digits[seconds % 10], digits[0].width * 5, 0);
}

function isLeapYear(year) {
    if (year % 400 == 0)
        return true;
    if (year % 100 == 0)
        return false;
    return year % 4 == 0;
}
