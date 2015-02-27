var digits = [];
//var newObject = jQuery.extend(true, {}, oldObject);//deep copy
function image() {
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext('2d');
	var base_image = new Image();
	//create the digits 0-9 for later use by the clock update function
	base_image.onload = function() {
		canvas.width = base_image.width * 6;
		canvas.height = base_image.height * 2;
		context.drawImage(base_image, 0, 0);
		var imageData = context.getImageData(0, 0, base_image.width, base_image.height);
		for (var j = 0; j < 10; j++) {
			digits[j] = context.createImageData(base_image.width, base_image.height);//all black copy of dimensions
			for (var i = 0; i < imageData.data.length; i+=4) {
				if (fillDigit(imageData.data, i, j)){//(imageData.data[i] == j+1 && imageData.data[i+1] == j+1 && imageData.data[i+2] == j+1) {//data is arranged RGBARGBA...
					digits[j].data[i] = 255;
					digits[j].data[i+1] = 255;
					digits[j].data[i+2] = 0;
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
		//display everything in the canvas for testing
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
	//base_image.crossOrigin = "use-credentials";//'anonymous';
	base_image.src = 'broken_lcd.png'; //src needs to be specified after onload event	
}

/*123456,23,12754,12734,6723,16734,167345,123,1234567,123467
  0      1  2     3     4    5     6      7   8       9
   128 64 32 16 8 4 2 1
     1  2  3  4 5 6 7 8
trans = [252, 96, 218, 242, 102, 182, 190, 224, 254, 246]*/
function fillDigit(idd, i, j) {//data is arranged RGBARGBA...
	//fill 1
	if (j != 1 && j != 4){//0 2 3 5 6 7 8 9
		if (idd[i] == 1 && idd[i + 1] == 1 && idd[i + 2] == 1){
			return true;}}
	//fill 2
	if (j != 5 && j != 6)//0 1 2 3 4 7 8 9
		if (idd[i] == 2 && idd[i + 1] == 2 && idd[i + 2] == 2)
			return true;
	//fill 3
	if (j != 2)//0 1 3 4 5 6 7 8 9
		if (idd[i] == 3 && idd[i + 1] == 3 && idd[i + 2] == 3)
			return true;
	//fill 4
	if (j != 1 && j != 4 && j != 7)//0 2 3 5 6 8 9
		if (idd[i] == 4 && idd[i + 1] == 4 && idd[i + 2] == 4)
			return true;
	//fill 5
	if (j == 0 || j == 2 || j == 6 || j == 8)//0 2 6 8
		if (idd[i] == 5 && idd[i + 1] == 5 && idd[i + 2] == 5)
			return true;
	//fill 6
	if (j != 1 && j != 2 && j != 3 && j != 7)//0 4 5 6 8 9
		if (idd[i] == 6 && idd[i + 1] == 6 && idd[i + 2] == 6)
			return true;
	//fill 7
	if (j != 0 && j != 1 && j != 7)//2 3 4 5 6 8 9
		if (idd[i] == 7 && idd[i + 1] == 7 && idd[i + 2] == 7)
			return true;
	//fill 8
	if (false)//(never...)
		if (idd[i] == 8 && idd[i + 1] == 8 && idd[i + 2] == 8)
			return true;
	return false;
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
}

function isLeapYear(year) {
    if (year % 400 == 0)
        return true;
    if (year % 100 == 0)
        return false;
    return year % 4 == 0;
}
