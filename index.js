var digits = [];

//var newObject = jQuery.extend(true, {}, oldObject);//deep copy
function image() {
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext('2d');
	var base_image = new Image();
	//create the digits 0-9 for later use by the clock update function
	base_image.onload = function() {
		canvas.width = base_image.width * 6;
		canvas.height = base_image.height;
		context.drawImage(base_image, 0, 0);
		var data = context.getImageData(0, 0, base_image.width, base_image.height).data;
		var j;
		for (var i = 0; i < data.length; i+=4) {
			for (j = 0; j < 10; j++) {
				if (data[i] == j && data[i+1] == j && data[i+2] == j) {
					digits[j].push(data[i]);
					digits[j].push(data[i+1]);
					digits[j].push(data[i+2]);
					digits[j].push(data[i+3]);
				}
				else {
					digits[j].push(data[i]);
					digits[j].push(data[i+1]);
					digits[j].push(data[i+2]);
					digits[j].push(data[i+3]);
				}
			}
			//console.log(data[i], data[i+1], data[i+2], data[i+3]);//expected RGBA in order
		}
		//console.log(data.BYTES_PER_ELEMENT, data.length);
		//context.putImageData(data,0,0);
	}
	//base_image.crossOrigin = "use-credentials";//'anonymous';
	base_image.src = 'broken_lcd.png'; //src needs to be specified after onload event	
}
/*123456,23,12754,12734,6723,16734,167345,123,1234567,123467
0      1  2     3     4    5     6      7   8       9
   128 64 32 16 8 4 2 1
     1  2  3  4 5 6 7 8
'''
trans = [252, 96, 218, 242, 102, 182, 190, 224, 254, 246]*/

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
