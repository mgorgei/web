//var newObject = jQuery.extend(true, {}, oldObject);//jQuery deep copy
var digits = [];
var twenty_four_hour_clock = false;
var clockIntervalID;
var lengthOfSemiColon = 32;//cannot be measured
var timeAlarmExpires = 600;//in seconds

/*Timer "class"
time
  Date object when timer expires
type
  0 Alarm
  1 StopWatch*/
function Timer(time, type) {
	if (type == 0)
		this.time = new Date(time);
	else {//the time given is milliseconds relative to today, so strip today midnight out to get the time from now that the timer will expire
		var today = new Date();
		today = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
		gg = time;
		this.time = new Date(Date.now() - today.getTime() + new Date(time).getTime());
		console.log(today.getTime(), Date.now(), time, Date.now() - today.getTime());
	}
	this.type = type;
}
var timers = [];

//create the digits 0-9 for later use by the clock update function in the canvas element
function drawDigits() {
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext('2d');
	var base_image = new Image();
	base_image.onload = function() {
		canvas.width = base_image.width * 6 - lengthOfSemiColon;
		canvas.height = base_image.height * 1;
		context.drawImage(base_image, 0, 0);
		var colorDigit = $("#canvas").css("color").slice(4, -1).split(',');
		var colorDigitOff = $("#canvas").css("outline-color").slice(4, -1).split(',');
		var colorBackground = $("#canvas").css("background-color").slice(4, -1).split(',');
		var colorOutline = $("#canvas").css("border-bottom-color").slice(4, -1).split(',');
		var imageData = context.getImageData(0, 0, base_image.width, base_image.height);
		for (var j = 0; j < 11; j++) {
			digits[j] = context.createImageData(base_image.width, base_image.height);
			for (var i = 0; i < imageData.data.length; i+=4) {
				var result = fillPixel(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2], j);
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
					digits[j].data[i] = colorOutline[0];
					digits[j].data[i+1] = colorOutline[1];
					digits[j].data[i+2] = colorOutline[2];
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
	base_image.src = 'images/digit.png'; //src needs to be specified after onload event	
}

//fill specific regions of an image with colors pulled from the canvas's CSS
var colorEnum = {
	outline:    -2, 
	background: -1, 
	source:      0, 
	digiton:     1, 
	digitoff:    2};
Object.freeze(colorEnum);//closest implementation to enum available
function fillPixel(red, green, blue, j) {
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
					return colorEnum.digiton;
				return colorEnum.outline;
			}
			else {
				if (blue == matching_color)
					return colorEnum.digitoff;
				return colorEnum.background;
			}
		}
		return 127; //fail code
	}
	//fill 1
	var x = fp(1, [0, 2, 3, 5, 6, 7, 8, 9], red, green, blue, j);
	if (x != 127)
		return x;
	//fill 2
	x = fp(2, [0, 1, 2, 3, 4, 7, 8, 9], red, green, blue, j);
	if (x != 127)
		return x;
	//fill 3
	x = fp(3, [0, 1, 3, 4, 5, 6, 7, 8, 9], red, green, blue, j);
	if (x != 127)
		return x;
	//fill 4
	x = fp(4, [0, 2, 3, 5, 6, 8, 9], red, green, blue, j);
	if (x != 127)
		return x;
	//fill 5
	x = fp(5, [0, 2, 6, 8], red, green, blue, j);
	if (x != 127)
		return x;
	//fill 6
	x = fp(6, [0, 4, 5, 6, 8, 9], red, green, blue, j);
	if (x != 127)
		return x;
	//fill 7
	x = fp(7, [2, 3, 4, 5, 6, 8, 9], red, green, blue, j);
	if (x != 127)
		return x;
	//fill 8 (semi-colon)
	if (red == 8 && green == 8 && blue == 8)
		return 1;
	if (red == 0 && green == 255 && blue == 255)
		return colorEnum.outline;
	//background
	if (red == 0 && green == 255 && blue == 0)
		return colorEnum.background;
	return colorEnum.source;
}

//updates the canvas to display the current time every ~1000 ms
function updateClock() {
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
	var d = new Date();
	var offset =  d.getTimezoneOffset() / 60;
	var seconds = d.getSeconds();
	var minutes = d.getMinutes();
	var hours = d.getHours();
	var AMPM = false;
	if (!twenty_four_hour_clock)//this block is probably already handled by Date()'s localization
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
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext('2d');
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
	checkTimers();
}

/*supply "MM DD YYYY " so that the time "HH[:MM][:SS][:MS]" in the input box is interpreted as a time for today by the parser
rfc2822*/
//having newly valid input or typing ':' on a valid input should auto tab over to the next point
//force unexpected input to 0; confirm input is valid by successful creation of a Date object
//it's possible since the input is (properly) constrained that the warning label is no longer going to fire
function validateInput() {
	function vi(i, jq){
		return (isNaN(i) || i == "" || parseInt(i) < $(jq).prop("min") || parseInt(i) > $(jq).prop("max") || i.indexOf('.') != -1);
	}
	var today = new Date();
	var HH = $("#timer_hours").val();
	if (vi(HH, "#timer_hours")) {
		var timer_type = $('input[name=radio]:checked', '#timer_entry').val();
		$("#timer_hours").val(0);
		HH = 0;
	}
	var MM = $("#timer_minutes").val();
	if (vi(MM, "#timer_minutes")) {
		$("#timer_minutes").val(0);
		MM = 0;
	}
	var SS = $("#timer_seconds").val();
	if (vi(SS, "#timer_seconds")) {
		$("#timer_seconds").val(0);
		SS = 0;
	}
	var ps = Number(today.getMonth() + 1) + ' ' + Number(today.getDate()) + ' ' + today.getFullYear() + ' ' + 
		('0' + HH.toString()).substr(-2) + ':' + ('0' + MM.toString()).substr(-2) + ':' + ('0' + SS.toString()).substr(-2);
	var d = Date.parse(ps);
	if(! isNaN(d)) {
		console.log(new Date(d), ps);
		$("#timer_warning").hide();
		return ps;
	}
	else {
		console.log('invalid', ps);
		$("#timer_warning").show();
		alert('still need warning label');
	}
	return false;
}

//get the timers from somewhere (should be server-side in the future)
function getTimers() {
	var today = new Date();
	today = Number(today.getMonth() + 1) + ' ' + Number(today.getDate()) + ' ' + today.getFullYear() + ' ';
	timers = [];
	timers[0] = new Timer(Date.parse(today + '11:05'), 0);
	timers[1] = new Timer(Date.parse(today + '17:10'), 0);
	timers[2] = new Timer(Date.parse(today + '23:20'), 0);
	buildTimerDOM();
}

//build DOM from existing timers
function buildTimerDOM() {
	$("#table_body > tr").slice(1).remove();
	for (var i = 0; i < timers.length; i++) {
		addTimerDOM(i);
	}
}

//add recent timer to the DOM
function addTimerDOM(i) {
	var type = ['Alarm', 'Stop Watch'];
	$('#table_body').append("<tr><td>" + type[timers[i].type] + "</td><td>" + timers[i].time.toLocaleString() + "</td><td>" + timeRemaining(timers[i].time.getTime()) + "</td></tr>");
}

//enables delete_timer button and add a class to visually indicate what timer is selected
function selectTimer(event/*<-why is that not required? event is global or somehow inherited? how does that operate with multiple active events?*/) {
	var target = $(event.target);
	var hasClass = target.parent().hasClass("timer_table_selected");//assist in deselecting the table
	$("#table_body > *").removeClass("timer_table_selected");//transition out with animation?
	$("#delete_timer").prop('disabled', true);
	if (target.is("td") && !hasClass) {
		$(target.parent()).addClass("timer_table_selected");
		$("#delete_timer").prop('disabled', false);
	}
}

//delete selected timers[index] and disable the delete_timer button because nothing is selected in the table
function deleteTimer() {
	var index = $(".timer_table_selected").index();
	if (index != -1) {//index 0 doesn't get the timer_table_selected class, so not subject to deletion
		if (true) {//confirm("Do you want to delete the selected row?")) { use BS modal dialog?
			timers.splice(index, 1);//delete selected index
			$('#table_body tr')[index].remove();
			$("#delete_timer").prop('disabled', true);
		}
	}
	else
		alert("Nothing selected!");
}

//check if the timer has valid (Date)Time input, no duplicate, if so add it to the DOM
function attemptNewTimer() {
	var ps = validateInput();
	if (ps) {
		timers[timers.length] = new Timer(ps, $('input[name=radio]:checked', '#timer_entry').val());
		console.log(ps, $('input[name=radio]:checked', '#timer_entry').val());
		var dupe = false;
		//check for existing duplicates, delete them if they exist
		for (var i = 0; i < timers.length - 1; i++)
			if (timers[i].time.getTime() == timers[timers.length - 1].time.getTime() && timers[i].type == timers[timers.length - 1].type) {
				timers.splice(timers.length - 1, 1);
				dupe = true;
				break;//should only have one dupe at least locally; also not designed to properly navigate the loop using this structure after a deletion
			}
		if (!dupe)
			addTimerDOM(i);
	}
}

//play audio for (recently) expired timers; display time remaining on active timers
function checkTimers() {
	var playOnce = false;
	for (var i = 0; i < timers.length; i++) {
		if (!playOnce)
			if (Date.now() > timers[i].time.getTime() && Date.now() < timers[i].time.getTime() + timeAlarmExpires * 1000) {
				$("#audio")[0].play();
				playOnce = true;
			}
		var td = $("#table_body > tr")[i].children;
		td[2].innerText = timeRemaining(timers[i].time.getTime());
	}
}

function timeRemaining(time) {
	var remaining = time - Date.now();
	if (remaining >= 0) {
		remaining = Math.floor(remaining / 1000);
		var seconds = remaining % 60;
		remaining-= seconds;
		var minutes = (remaining % 3600) / 60;
		remaining-= minutes * 60;
		var hours = (remaining % 86400) / 3600;
		return ('0' + hours).substr(-2) + ':' + ('0' + minutes).substr(-2) + ':' + ('0' + seconds).substr(-2);
	}
	else
		return 'expired';
}

function strToHex(str) {
	return ('0' + parseInt(str).toString(16)).substr(-2);
}