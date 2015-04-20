var digits = [];//imageData for digits 0-9 and the empty digit(pos 10)
var resetDrawn = [11,12,13,14,15,16];
var lastDrawn = jQuery.extend(true, {}, resetDrawn);//index represents position of the last drawn digit (value)//jQuery deep copy
var twenty_four_hour_clock = false;
var lengthOfSemiColon = 32;//cannot be measured in the image, so needs to be specified
var timeAlarmExpires = 600;//in seconds
var alarmDelay = 10;//time in seconds from start of alarm sound
var alarmLastPlayed = 0;//ms since 1/1/1970
var alarmTriggering = false;//is an alarm being triggered right now
var alarmDraw = false;//draw empty digits if true
var testLocal = location.hostname === 'localhost';//detects local access to disable ajax calls so I can develop faster with local python implementation
var shiftKey = false;//detect when shift is pressed within the input HH:MM:SS fields
var procTab = false;//save pressing ':' in keydown/keyup event for use in oninput event since type=number doesn't give non-number characters
var modalClick = -1;//saves id of modified hyperlink
var lastHH = 0;
var lastMM = 0;
var lastSS = 0;
var colorEnum = {
	outline:    -2, 
	background: -1, 
	source:      0, 
	digiton:     1, 
	digitoff:    2};
Object.freeze(colorEnum);//closest implementation to enum available

{
	var clockIntervalID;
	var canvas;
	var context;
	var base_image;
	var gg;//global variable for inspecting objects quickly
}

/*Timer "class"
time
  Date object when timer expires
type
  0 Alarm
  1 Stop Watch*/
function Timer(time, type, id) {
	if (type == 1) {//the time given is milliseconds relative to today, so strip today midnight out to get the time from now that the timer will expire
		var today = new Date();
		today = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
		this.time = new Date(Date.now() - today.getTime() + new Date(time).getTime());
	}
	else
		this.time = new Date(time);
	this.type = 0;//type is only useful for calculating it to a common time format
	this.id = id;
}
var timers = [];

/*Hyper "class"
id
name
description
address
image
linkOrder
*/
function Hyper(id, name, description, address, image, linkOrder) {
	this.id = id;
	this.name = name;
	this.description = description;
	this.address = address;
	this.image = image;
	this.linkOrder = linkOrder;
}
var hyper = [];

/*Drag "class"
tracks variables for all dragging operations on the hyperlinks
current avoid multiple updates on dragenter by specifying the where
start identifying self will block events involving itself
*/
function Drag() {
	this.start;
	this.current;
	this.last;
	this.owner;
	this.clear = function () {//should be able to loop through properties instead of being explicit
		this.start = undefined;
		this.current = undefined;
		this.last = undefined;
		this.owner = undefined;
	}
}var drag = new Drag();

//gives back the index in the hyperlink object relating to the index parameter that is a unique id in the DOM
function findOwner(index) {
	for (var i = 0; i < hyper.length; i++) {
		if (parseInt(index.slice(5)) === parseInt(hyper[i].id))
			return i;
	}
}

/*dumping ground for events
*/
function main() {
	function resizeLabelWidths(jq, what) { //resize all of the labels to the largest (for small width form)
		var maxLabelWidths = [];
		$(what, jq).map(function() {
			maxLabelWidths.push(parseInt($('label[for=' + $(this).prop('id') + ']', jq).css('width')));
		});
		var maxLabelWidth = Math.max.apply(null, maxLabelWidths);
		$(what, jq).map(function() {
			$('label[for=' + $(this).prop('id') + ']', jq).css('width', maxLabelWidth);
		});
	}
	function dragEvents() { //corral all the drag events into one function called in main
		$('#links').on('dragstart', function (e) { 
			$("#links > *").removeClass("dragStart over");
			$(e.target).addClass('dragStart');
			drag.start = e.target.id;
		});

		$('#links').on('dragenter', function (e) {
			if (e.target.id === 'links') {
				drag.current = e.target.id;
			}
			else if (e.target.id.slice(0,5) === 'hyper') {
				drag.current = e.target.id;
			}
			else {
				drag.current = $(e.target).parents('div').first()[0].id;
			}
			//add class that signifies this element is hovered over to make accurate drops
			if (drag.start != drag.current && drag.current.slice(0,5) === 'hyper' && drag.current != drag.last) {
				/*$("#links > *").removeClass('over');
				$('#' + drag.current).addClass('over');*/
				$('#' + drag.start).insertBefore($('#' + drag.current));
			}
			else if (drag.current === 'links')
				//$("#links > *").removeClass('over');
				if (e.originalEvent.pageX <= parseInt($('#links').css('padding-left')) || e.originalEvent.pageY <= parseInt($('#links').css('padding-top')))
					$('#' + drag.start).insertBefore($('#links').children().first());
				else
					$('#' + drag.start).insertAfter($('#links').children().last());
			drag.last = drag.current;
		});
		
		$('#links').on('dragleave', function (e) {
			//may be able to skip dragleave by detecting a change in entry...
		});
		
		$('#links').on('dragover', function (e) {
			//console.log (e.originalEvent.pageX, e.originalEvent.pageY)
		});
		
		$('#links').on('dragend', function (e) {//should be a way to refactor this mess...
			$("#links > *").removeClass('dragStart over');
			var index = findOwner(drag.start);
			if (drag.current === 'links') {
				//if the drag is placed within the left / top padding, drop as the first object in the list
				console.log(e.originalEvent.pageX, e.originalEvent.pageY);
				if (e.originalEvent.pageX <= parseInt($('#links').css('padding-left')) || e.originalEvent.pageY <= parseInt($('#links').css('padding-top'))) {
					if (hyper[index].linkOrder != 1) {//don't move if the element is already first
						modifyHyperOrder(hyper[index].id, -1, hyper[findOwner(drag.start)].linkOrder, 1);
						//$('#' + drag.start).insertBefore($('#links').children().first());
						for (var i = 0; i < hyper.length; i++)
							if (hyper[i].linkOrder < hyper[index].linkOrder)
								hyper[i].linkOrder = hyper[i].linkOrder + 1;
						hyper[index].linkOrder = 1;
					}
				}
				else {//drop as last object in the list
					if (hyper[index].linkOrder != hyper.length) {
						modifyHyperOrder(hyper[index].id, -1, hyper[findOwner(drag.start)].linkOrder, hyper.length + 1);
						//$('#' + drag.start).insertAfter($('#links').children().last());
						for (var i = 0; i < hyper.length; i++)
							if (hyper[i].linkOrder > hyper[index].linkOrder)
								hyper[i].linkOrder = hyper[i].linkOrder - 1;
						hyper[index].linkOrder = hyper.length;
					}
				}
			}
			else {
				if (drag.current !== drag.start) {
				//divide in two situations between half the width of the div?
					//$('#' + drag.start).insertBefore($('#' + drag.current));
					var dragged = findOwner(drag.current);
					var tmp = hyper[dragged].linkOrder;
					modifyHyperOrder(hyper[index].id, -1, hyper[findOwner(drag.start)].linkOrder, hyper[findOwner(drag.current)].linkOrder);
					//dragging to a lower element
					if (hyper[index].linkOrder > hyper[dragged].linkOrder){
						for (var i = 0; i < hyper.length; i++)
							if (hyper[i].linkOrder < hyper[index].linkOrder && hyper[i].linkOrder >= hyper[dragged].linkOrder)
								hyper[i].linkOrder = hyper[i].linkOrder + 1;
						hyper[index].linkOrder = tmp;
					}
					//dragging to a higher element
					else {
						for (var i = 0; i < hyper.length; i++)
							if (hyper[i].linkOrder > hyper[index].linkOrder && hyper[i].linkOrder < hyper[dragged].linkOrder)
								hyper[i].linkOrder = hyper[i].linkOrder - 1;
						hyper[index].linkOrder = tmp - 1;
					}
				}
			//find some kind of transition animation for moving the dragged item
			//$('#' + drag.start).addClass('dragEnd');
			drag.clear();
			}
		});
	}
	$("#delete_hyper").prop('disabled', true);
	$('#context').hide();
	resizeLabelWidths('#timer_entry', 'input[type=number]');
	dragEvents();
	//document is ready
	$( document ).ready(function() {
		getTimers();
		getHyper();
		canvas = document.getElementById("canvas");
		context = canvas.getContext('2d');
		drawDigits();
		//initialize all popovers (necessary)
		$('[data-toggle="popover"]').popover({
			trigger: 'hover',
			delay: '200'
		});
		$("#timer_hours").focus();
		/*********************************************************************/
		/*$("#myModal").on('show.bs.modal', function () {
			//clear the inputs
			$("#hyper_entry > ").find("input[name=hyper_name]").val('');
			$("#hyper_entry > ").find("input[name=hyper_address]").val('');
		});*/
		$("#myModal").on('shown.bs.modal', function () {
			$("#hyper_entry > ").find("input[name=hyper_name]").focus();
		});
		$("#hyper_modal").click(function () {$('#context').hide();});
		$("#add_hyper").click(function () {
			//make sure the web address points somewhere absolute by appending http:// if it cannot find  http://  https://
			var tmp = $("#hyper_entry > ").find("input[name=hyper_address]").val();
			if ( tmp.slice(0,7) !== 'http://' && tmp.slice(0,8) !== 'https://')
				 $("#hyper_entry > ").find("input[name=hyper_address]").val('http://' + tmp);
			if (modalClick == -1) 
				insertHyper();
			else
				modifyHyper(modalClick);
		});
		$("#refresh_hyper").click(getHyper);
		$("#delete_hyper").click(deleteHyper);
		$("#links").on('click', 'div', clickHyperClose);//need to delegate because the links are dynamically created
		//hyperlink context menu
		if ($('#links').addEventListener) {
			$('#links').addEventListener('contextmenu', function(e) {
				alert("You've tried to open context menu"); //here you draw your own menu
				e.preventDefault();
			}, false);
		} else {
			$('body').on('contextmenu', '#links', function(e) {
				//determine whether a div or links was clicked
				if ($(e.target).prop('id') === 'links') {
					modalClick = -1;
					$('#myModalLabel').text('Enter new hyperlink');
					$("#hyper_entry > ").find("input[name=hyper_name]").val('');
					$("#hyper_entry > ").find("input[name=hyper_address]").val('');
					$('#add_hyper').children().first().text('New');
				}
				else {//find which div by traversing up until finding a 'hyper###' id
					var search = $(e.target);
					while (search.prop('id').slice(0,5) !== 'hyper')
						search = search.parent();
					modalClick = findOwner(search.prop('id'));
					$('#myModalLabel').text('Modify hyperlink');
					$("#hyper_entry > ").find("input[name=hyper_name]").val( hyper[modalClick].name );
					$("#hyper_entry > ").find("input[name=hyper_address]").val( hyper[modalClick].address );
					$('#add_hyper').children().first().text('Modify');
				}
				$("#myModal").modal('show');//just show the modal dialogue since all the other context options are woven into the html interactions
				//$('#context').show();
				window.event.returnValue = false;
				/*var x = e.pageX;
				var y = e.pageY;
				$("#context").css({left: x, top: y});*/
			});
		}
		//dismiss context menu on any left-click outside
		/*$('body').click(function() {
			if ($('#context').is(':visible'))
				$('#context').hide();
		});*/
		/*********************************************************************/
		$('#audio').on('loadedmetadata', function () {
			alarmDelay = Math.floor(4 * this.duration);
		});
		//when the base_image is loaded, can draw the clock
		$("#canvas").on("onloadeddata", function() {
			updateClock();
			clearInterval(clockIntervalID);
			clockIntervalID = setInterval(updateClock, 500);
		});
		//one time event for easier event handling (canvas should not use multiple color pickers)
		$(".canvas").one("click", canvasColor);
		/*********************************************************************/
		//make ':' behave as a tab key by capturing simultaneous SHIFT + ';' key presses
		$("#timer_entry").children().children("input[type=number]").on( "keydown", function( event ) {
			if (event.which == 16)
				shiftKey = true;
			if (event.which == 186)
				if (shiftKey) {
					procTab = true;
				}
		});
		$("#timer_entry").children().children("input[type=number]").on( "keyup", function( event ) {
			if (event.which == 16)
				shiftKey = false;
		});
		$("#timer_entry").on("input", validateInput);
		/*********************************************************************/
		$("#add_timer").on("click", attemptNewTimer);
		$("#refresh_timer").on("click", getTimers);
		$("#delete_timer").on("click", deleteTimer);
		/*********************************************************************/
		$("#table_body").on("click", selectTimer);
		//bottom bar events
		/*********************************************************************/
		svgInline(".icon");//change all .icon images into inline svg to be modifiable
		$("#botbar li").hover(hoverSVG);
	});
} main();//run this function as soon as possible

//create the digits 0-9 for later use by the clock update function in the canvas element
function drawDigits() {
	function fill(i, j, CSScolor){//fill a pixel with a specific CSS color 
		digits[j].data[i] = CSScolor[0];
		digits[j].data[i+1] = CSScolor[1];
		digits[j].data[i+2] = CSScolor[2];
		digits[j].data[i+3] = 255;
	};
	canvas = document.getElementById("canvas");
	context = canvas.getContext('2d');
	base_image = new Image();
	base_image.onload = function() {
		canvas.width = base_image.width * 6 - lengthOfSemiColon;
		canvas.height = base_image.height * 1;
		//draw the coded image on the canvas to push the data onto an array
		context.drawImage(base_image, 0, 0);
		var colorDigit = $(".digitOn").css("color").slice(4, -1).split(',');
		var colorDigitOff = $(".digitOff").css("color").slice(4, -1).split(',');
		var colorBackground = $(".digitBackground").css("color").slice(4, -1).split(',');
		var colorOutline = $(".digitOutline").css("color").slice(4, -1).split(',');
		var imageData = context.getImageData(0, 0, base_image.width, base_image.height);
		for (var j = 0; j < 11; j++) {
			digits[j] = context.createImageData(base_image.width, base_image.height);
			//fill each pixel with a matching css color
			for (var i = 0; i < imageData.data.length; i+=4) {
				var result = identifyPixel(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2], j);
				if (result == colorEnum.digiton)
					fill(i, j, colorDigit);
				else if (result == colorEnum.digitoff)
					fill(i, j, colorDigitOff);
				else if (result == colorEnum.background)
					fill(i, j, colorBackground);
				else if (result == colorEnum.outline)
					fill(i, j, colorOutline);
				else //  result == colorEnum.source
					fill(i, j, imageData.data.splice(i, i + 3));//source is a fallback now since the entire image is tagged
			}
		}
		$("#canvas").triggerHandler("onloadeddata");
	}
	//base_image.crossOrigin = "use-credentials";//'anonymous';
	base_image.src = 'images/digit.png'; //src needs to be specified after onload event
}

//change digits with the new color and draw every digit again
function reDraw() {
	drawDigits();
	lastDrawn = jQuery.extend(true, {}, resetDrawn);
}

/*identify specific regions of an image to be colored

  Image regions are labeled between 1-8 by their red and green components of a 
  given pixel's rgb color.  The regions 1-6 are organized clockwise, the 
  central bar is 7, the semi colon is 8 and does not follow color coding since
  it is always colored.  If the blue component of a pixel matches the region 
  designation (1-7) then it is part of that region-otherwise it belongs to that
  region's outline.  Anything that is not a region-outline or region is part of
  the background.
  
  Digits are composed of a number of these regions.  For instance, the digit
  '0' is requires the regions and matching region-outlines: 1, 2, 3, 4, 5, 6.
*/
function identifyPixel(red, green, blue, j) {
	function fp(matching_color, valid_digits, red, green, blue, index) {
		if (red == matching_color && green == matching_color) {//in a region or region-outline
			var result = false;
			for (var i = 0; i < valid_digits.length; i++)//go through all digits that needs this region
				if (index == valid_digits[i]) {
					result = true;
					break;
				}
			if (result) {//the current digit needs this region
				if (blue == matching_color)//is this a region (true) or region-outline
					return colorEnum.digiton;
				return colorEnum.outline;
			}
			else {
				if (blue == matching_color)//is this a region (true) or region-outline
					return colorEnum.digitoff;
				return colorEnum.background;//the digitoff outline does not have a unique color
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
		return colorEnum.digiton;
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
	if (hours > 12)//cannot find a non-convoluted way of detecting local time (12 or 24 hour clock)
		hours = hours - 12;
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
	var fillColor = $(".digitBackground").css("color").slice(4, -1).split(',');
	context.fillStyle = "#" + strToHex(fillColor[0]) + strToHex(fillColor[1]) + strToHex(fillColor[2]);//seems too common to not have a default method...
	var divChange = lastDrawn[0] === resetDrawn[0];
	//alternate between showing empty digits during an alarm and the real time
	if (alarmTriggering && alarmDraw) {
		context.putImageData(digits[10], 0, 0);
		context.putImageData(digits[10], digits[0].width * 1, 0);
		context.putImageData(digits[10], digits[0].width * 2, 0);
		context.putImageData(digits[10], digits[0].width * 3, 0);
		context.putImageData(digits[10], digits[0].width * 4, 0);
		context.putImageData(digits[10], digits[0].width * 5, 0);
		context.fillRect(digits[0].width - lengthOfSemiColon, 0, lengthOfSemiColon, digits[0].height);
		context.fillRect(digits[0].width * 3 - lengthOfSemiColon, 0, lengthOfSemiColon, digits[0].height);
		context.fillRect(digits[0].width * 5 - lengthOfSemiColon, 0, lengthOfSemiColon, digits[0].height);
		lastDrawn = jQuery.extend(true, {}, [10,10,10,10,10,10]);
	}
	//draw only digits that have changed
	else {
		//hours
		if (hours > 9) {
			if (lastDrawn[0] != Math.floor(hours / 10)) {
				lastDrawn[0] = Math.floor(hours / 10);
				context.putImageData(digits[lastDrawn[0]], 0, 0);
				context.fillRect(digits[0].width - lengthOfSemiColon, 0, lengthOfSemiColon, digits[0].height);
			}
		}
		else {
			if (lastDrawn[0] != 10) {
				lastDrawn[0] = 10;
				context.putImageData(digits[lastDrawn[0]], 0, 0);
				context.fillRect(digits[0].width - lengthOfSemiColon, 0, lengthOfSemiColon, digits[0].height);
			}
		}
		if (lastDrawn[1] != hours % 10) {
			lastDrawn[1] = hours % 10;
			context.putImageData(digits[lastDrawn[1]], digits[0].width * 1, 0);
		}
		//minutes
		if (lastDrawn[2] != Math.floor(minutes / 10)) {
			lastDrawn[2] = Math.floor(minutes / 10);
			context.putImageData(digits[lastDrawn[2]], digits[0].width * 2, 0);
			context.fillRect(digits[0].width * 3 - lengthOfSemiColon, 0, lengthOfSemiColon, digits[0].height);
		}
		if (lastDrawn[3] != minutes % 10) {
			lastDrawn[3] = minutes % 10;
			context.putImageData(digits[lastDrawn[3]], digits[0].width * 3, 0);
		}
		//seconds
		if (true) { //remove seconds conditionally if screen width on canvas won't scale down nicely
			if (lastDrawn[4] != Math.floor(seconds / 10)) {
				lastDrawn[4] = Math.floor(seconds / 10)
				context.putImageData(digits[lastDrawn[4]], digits[0].width * 4, 0);
				context.fillRect(digits[0].width * 5 - lengthOfSemiColon, 0, lengthOfSemiColon, digits[0].height);
			}
			if (lastDrawn[5] != seconds % 10) {
				lastDrawn[5] = seconds % 10;
				context.putImageData(digits[lastDrawn[5]], digits[0].width * 5, 0);//the semi-colon would be truncated by the max length of the canvas
			}
		}
	}
	if (divChange) {//paint the surrounding div the same background-color as the canvas
		var color = $(".digitBackground").css("color").slice(4, -1).split(',');
		$(".canvas").css("background-color", "#" + strToHex(color[0]) + strToHex(color[1]) + strToHex(color[2]));
	}
	checkTimers();
}

//determine which css class sample matches then change the color on the canvas
function canvasColor(e) {
	function match(cssClass) {//find the first css class color that matches the pixel that was clicked
		var color = $(cssClass).css("color").slice(4, -1).split(',');
		for (var i = 0; i < 3; i++)
			if (color[i] != sample[i])
				return false;
		return true;
	}
	function showPicker(cssClass) {//call a palette change dialogue
		var color = $(cssClass).css("color").slice(4, -1).split(',');
		$("#color_picker").val('#' + strToHex(color[0]) + strToHex(color[1]) + strToHex(color[2]));
		$("#color_picker")[0].color.fromString($("#color_picker").val());
		if (e.target.id === 'canvas') {
			var min = Math.min(y, $("#canvas").prop('height') - parseInt($("#color_picker").css('height')));
			$("#color_picker").css({left: x, top: $("#canvas").offset().top + min});
		}
		else
			$("#color_picker").css({left: $("#canvas").offset().left, top: $("#canvas").offset().top});
		$("#color_picker").show();
		$("#color_picker")[0].color.showPicker();
	}
	function hidePicker(event) {//callback when the picker has a new value, hide the picker and update the canvas
		$(event.data.cssClass).css("color", '#' + $("#color_picker").val());
		$("#color_picker").hide();
		$("#color_picker")[0].color.hidePicker();
		reDraw();
		$(".canvas").one("click", canvasColor);//reactivate the click event
	}
	//determine where you clicked to make context-sensitive color change for css
	var classes = [".digitOn", ".digitOff", ".digitBackground", ".digitOutline"];
	if (e.target.id === 'canvas') {
		var x = Math.floor(e.pageX - $(e.target).offset().left);
		var y = Math.floor(e.pageY - $(e.target).offset().top);
		var sample = context.getImageData(x, y, 1, 1).data;
		for (var i = 0; i < classes.length; i++)
			if (match(classes[i])) {
				break;
			}
	}
	else
		i = 2;//".digitBackground" because the div was clicked
	showPicker(classes[i]);
	$("#color_picker").one("change", {cssClass:classes[i]}, hidePicker);
}

/*validate user input can be interpreted as a valid time for today

  supply "MM DD YYYY " so that the time "HH[:MM][:SS][:MS]" in the input box is
  interpreted as a time for today by the parser according to rfc2822.
  having complete input or typing ':' on a valid input will behave as a tab 
  over to the next element.  Force any unexpected input to 0; confirm input is
  valid by successful creation of a Date object.
*/
function validateInput() {
	function vi(i, jq){//make sure input is set to a number and is within the valid range
		return (isNaN(i) || i == "" || parseInt(i) < $(jq).prop("min") || parseInt(i) > $(jq).prop("max") || i.indexOf('.') != -1);
	}
	function getValue(jq){//get the value; if is not valid, set the form to 0; return the value on the form
		var value = $(jq).val();
		if (vi(value, jq)) {
			if (!procTab) {
				$(jq).val(0);
				return 0;
			}
			else//set input to last valid value if ':' was pressed
				if (jq == "#timer_hours")
					$(jq).val(lastHH);
				else if (jq == "#timer_minutes")
					$(jq).val(lastMM);
				else //if (jq == "#timer_seconds")
					$(jq).val(lastSS);
		}
		return value;
	}
	console.log($("#timer_hours").val(), $("#timer_minutes").val(), $("#timer_seconds").val());
	var HH = getValue("#timer_hours");
	var MM = getValue("#timer_minutes");
	var SS = getValue("#timer_seconds");
	//check who has focus here to validate and move onto another input based on the range or procTab
	if ($(document.activeElement).prop("id") == "timer_hours") {
		var tmp = HH.toString().substr(-2);
		if ((tmp > 2 && tmp < 10) || (tmp.length == 2) || procTab)
			$('#timer_minutes').select();
		procTab=false;
		lastHH = tmp;
	}
	else if ($(document.activeElement).prop("id") == "timer_minutes") {
		var tmp = MM.toString().substr(-2);
		if ((tmp > 5 && tmp < 10) || (tmp.length == 2) || procTab)
			$('#timer_seconds').select();
		procTab=false;
		lastMM = tmp;
	}
	else if ($(document.activeElement).prop("id") == "timer_seconds") {
		var tmp = SS.toString().substr(-2);
		if ((tmp > 5 && tmp < 10) || (tmp.length == 2) || procTab)
			$('#add_timer').focus();
		procTab=false;
		lastSS = tmp;
	}
	//pass user input into new Date object and return the string if it survives
	var today = new Date();
	var ps = Number(today.getMonth() + 1) + ' ' + Number(today.getDate()) + ' ' + today.getFullYear() + ' ' + 
		('0' + HH.toString()).substr(-2) + ':' + ('0' + MM.toString()).substr(-2) + ':' + ('0' + SS.toString()).substr(-2);
	var d = Date.parse(ps);
	if(! isNaN(d)) {
		console.log(new Date(d), ps);
		return ps;
	}
	else {
		console.log('invalid', ps);
		return false;
	}
}

//build DOM from existing timers
function buildTimerDOM() {
	$("#table_body > tr").slice(0).remove();
	for (var i = 0; i < timers.length; i++)
		addTimerDOM(i);
}

//add recent timer to the DOM
function addTimerDOM(i) {
	var type = ['Alarm', 'Stop Watch'];
	$('#table_body').append("<tr><td>" + timers[i].time.toLocaleTimeString() + "</td><td>" + timeRemaining(timers[i].time.getTime()) + "</td></tr>");
}

//remove DOM and timer object associated with the index parameter
function deleteTimerDOM(index) {
	timers.splice(index, 1);
	$('#table_body tr')[index].remove();
}

//enables delete_timer button and add a class to visually indicate what timer is selected
function selectTimer(event) {
	var target = $(event.target);
	var hasClass = target.parent().hasClass("timer_table_selected");//assist in deselecting the table
	$("#table_body > *").removeClass("timer_table_selected");//transition out with animation?
	$("#delete_timer").prop('disabled', true);
	if (target.is("td") && !hasClass) {
		$(target.parent()).addClass("timer_table_selected");
		$("#delete_timer").prop('disabled', false);
	}
}

//get the timers from either the server or locally on failure
function getTimers() {
	function fallback(today)//get timers locally for testing or fallback
	{
		timers[0] = new Timer(Date.parse(today + '11:05'), 0, -1);
		timers[1] = new Timer(Date.parse(today + '17:10'), 0, -1);
		timers[2] = new Timer(Date.parse(today + '19:25'), 0, -1);
	}
	var today = new Date();
	today = Number(today.getMonth() + 1) + ' ' + Number(today.getDate()) + ' ' + today.getFullYear() + ' ';
	timers = [];
	if (testLocal) {
		fallback(today);
		buildTimerDOM();
	}
	else {//get timers from server
		$.ajax({
			url : window.location.pathname + "ajax.php",
			data : escape('{"timers":[{"READ":"all"}]}'),
			type : "GET",
			success: function(data) {
				if (data) {
					console.log("success", data);
					var obj = JSON.parse(String(data));
					if ($.isPlainObject(obj)) {
						for(var i = 0; i < obj.timers.length; i++)
							timers[i] = new Timer(Date.parse(today + obj.timers[i]['time']), obj.timers[i]['type'], obj.timers[i]['id']);
					}
					else
						console.log("Data passed was not valid JSON");
				}
			},
			error: function() {
				console.log("error");
				fallback(today);
			},
			complete: function() {
				buildTimerDOM();
				console.log("complete");
			}
		});
	}
}

//check if the timer has valid (Date)Time input, no duplicate, if so add it to the DOM
function attemptNewTimer() {
	var ps = validateInput();
	if (ps) {
		timers[timers.length] = new Timer(ps, $('input[name=radio]:checked', '#timer_entry').val(), -1);
		console.log(ps, $('input[name=radio]:checked', '#timer_entry').val());
		var dupe = false;
		//check for existing duplicates in UI, delete them if they exist
		for (var i = 0; i < timers.length - 1; i++)
			if (timers[i].time.getTime() == timers[timers.length - 1].time.getTime() && timers[i].type == timers[timers.length - 1].type) {
				timers.splice(timers.length - 1, 1);
				dupe = true;
				break;//should only have one dupe at least locally; also not designed to properly navigate the loop using this structure after a deletion
			}
		if (!dupe) {
			if (!testLocal) {
				var t = timers[i].time.toTimeString();
				var obj = JSON.parse('{"timers":[{"CREATE":"time"}]}');
				obj.timers[0]['CREATE'] = t.substr(0, t.indexOf(' '));
				$.ajax({
					url : window.location.pathname + "ajax.php",
					data : escape(JSON.stringify(obj)),
					type : "POST",
					success: function(data) {
						console.log("success", data);
						var obj = JSON.parse(String(data));
						if ($.isPlainObject(obj))
							timers[0].id = obj.timers[0]['id'];//get back the id that was just created, to avoid getting all information for one op
						else
							console.log("Data passed was not valid JSON or received no data");
					},
					error: function() {
						console.log("error");
					},
					complete: function() {
						console.log("complete");
					}
				});
			}
			addTimerDOM(i);
		}
	}
}

//delete selected timers[index] and disable the delete_timer button because nothing is selected in the table
function deleteTimer() {
	var index = $(".timer_table_selected").index();
	if (index != -1) {//index 0 doesn't get the timer_table_selected class, so not subject to deletion
		if (!testLocal) {
			var obj = JSON.parse('{"timers":[{"DELETE":"id"}]}');
			obj.timers[0]['DELETE'] = timers[index].id;
			$.ajax({
				url : window.location.pathname + "ajax.php",
				data : escape(JSON.stringify(obj)),
				type : "DELETE",
				success: function(data) {
					console.log("success", data);
				},
				error: function() {
					console.log("error");
				},
				complete: function() {
					console.log("complete");
				}
			});
		}
		//remove the affected table row by animation
		$("#delete_timer").prop('disabled', true);
		$(".timer_table_selected").fadeOut(200, function () {deleteTimerDOM(index);});
	}
	else
		alert("Nothing selected!");
}

//play audio for (recently) expired timers; display time remaining on active timers
function checkTimers() {
	for (var i = 0; i < timers.length; i++) {
		if (Date.now() > timers[i].time.getTime() && Date.now() < timers[i].time.getTime() + timeAlarmExpires * 1000) {
			alarmTriggering = true;
			alarmDraw = !alarmDraw;
			if (Date.now() > alarmLastPlayed + alarmDelay * 1000) {
				//show which tr element is playing this sound
				var tmp = '<span name="temp" class="glyphicon glyphicon-volume-up" aria-hidden="true" style="padding-left:8px"></span>';
				$("#table_body > tr:eq(" + i + ")").children(":eq(0)").append(tmp);
				$("span[name=temp]").fadeOut(1000, function() {$(this).remove();});
				alarmLastPlayed = Date.now();
				$("#audio")[0].play();
			}
		}
		var td = $("#table_body > tr")[i].children;
		td[1].innerText = timeRemaining(timers[i].time.getTime());
	}
}

//calculate time remaining on a timer from now
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
	return ('0' + parseInt(str).toString(16)).substr(-2).toUpperCase();
}

/*find the child to the li for identification, change the inline SVG element's
  fill color via CSS.  The query is highly specific to the structure and 
  uniformity of the SVG files.
*/
function hoverSVG(event) {
	//find the child to this li
	var child = $(this).prop('id');
	var elem = $(this).find('svg').children('g').children('g').children('circle');
	elem.css('fill','')//erase so that it can be overridden
	elem.attr("class", "circle");//$.addClass | $.removeClass doesn't behave well with SVG
	if (event.type !== 'mouseleave')
		elem.attr("class", child);
	var color = elem.css("fill").slice(4, -1).split(',');
	elem.css('fill', "#" + strToHex(color[0]) + strToHex(color[1]) + strToHex(color[2]));
}

/*attribution: https://snippetlib.com/jquery/replace_all_svg_images_with_inline_svg
  Replace all SVG images with inline SVG */
function svgInline(jq) {
	$(jq).each(function(){
		var $img = $(this);
		var imgID = $img.attr('id');
		var imgClass = $img.attr('class');
		var imgURL = $img.attr('src');

		$.get(imgURL, function(data) {
			// Get the SVG tag, ignore the rest
			var $svg = $(data).find('svg');
			// Add replaced image's ID to the new SVG
			if (typeof imgID !== 'undefined') {
				$svg = $svg.attr('id', imgID);
			}
			// Add replaced image's classes to the new SVG
			if (typeof imgClass !== 'undefined') {
				$svg = $svg.attr('class', imgClass+' replaced-svg');
			}
			// Remove any invalid XML tags as per http://validator.w3.org
			$svg = $svg.removeAttr('xmlns:a');
			// Replace image with new SVG
			$img.replaceWith($svg);
		});
	});
}

/*hyperlink*******************************************************************/

//remove all hyperLinks and replace with the ones generated by getHyper into hyper
function buildHyperDOM() {
	$("#links > ").remove();
	for (var i = 0; i < hyper.length; i++)
		addHyperDOM(i);
}

//add recent hyper to the DOM
function addHyperDOM(i) {
	$("#links").append("<div id=\"hyper" + hyper[i].id + "\" class=\"col-md-2 col-sm-3 col-xs-6 drag\" draggable=true>" +
	"<button type=\"button\" class=\"close\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>" + 
	"<a href=\"" + hyper[i].address + "\" draggable=false >" + 
	"<h5>" + hyper[i].name + "</h5>" + 
	"<img class=\"centered center-block\" src=\"" + hyper[i].image + "\" draggable=false />" + 
	"<p class=\"text-center\" hidden>" + hyper[i].description + "</p></a></div>");
}

//modify hyper DOM
function modifyHyperDOM() {
	$('#hyper' + hyper[modalClick].id + ' > a').prop('href', hyper[modalClick].address);
	$('#hyper' + hyper[modalClick].id + ' > > h5').text(hyper[modalClick].name);
}

//remove the DOM and hyperlink object associated with the index parameter
function deleteHyperDOM(index) {
	hyper.splice(index, 1);
	$('#hyper' + index).remove();
}

/*****************************************************************************/

//find out if the close element was clicked, then find the id of the div to place the class into and call delete function
function clickHyperClose(event) {
	if (event.target.tagName.toUpperCase() === 'SPAN') {
		$(event.target).parent().parent().addClass("activeLink");
		deleteHyper();
	}
	/*else
		gg = event;*/
}

//clear all hyperLinks and grab everything from the server
function getHyper() {
	$('#context').hide();
	hyper = [];
	if (!testLocal) {
		$.ajax({
			url : window.location.pathname + "ajax.php",
			data : escape('{"hyper":[{"READ":"all"}]}'),
			type : "GET",
			success: function(data) {
				console.log("success", data);
				var obj = JSON.parse(String(data));
				if ($.isPlainObject(obj)) {
					for(var i = 0; i < obj.hyper.length; i++)
						hyper[i] = new Hyper(obj.hyper[i]['id'], obj.hyper[i]['name'], obj.hyper[i]['description'], obj.hyper[i]['address'], obj.hyper[i]['image'], +obj.hyper[i]['linkOrder']);
				}
				else
					console.log("Data passed was not valid JSON");
			},
			error: function() {
				console.log("error");
			},
			complete: function() {
				buildHyperDOM();
				console.log("complete");
			}
		});
	}
	else {
		for (var i = 0; i < 15; i++)
			hyper[i] = new Hyper(i+1, 'name'+(i+1), 'description', 'http://www.google.com', 'images/google.svg', i+1);
		buildHyperDOM();
	}
}

//
function modifyHyper() {
	var tmp = $("#hyper_entry > ");
	hyper[modalClick].name = tmp.find("input[name=hyper_name]").val();
	hyper[modalClick].address = tmp.find("input[name=hyper_address]").val();
	if (!testLocal) {
		var obj = JSON.parse('{"hyper":[{"UPDATE":"id", "name":"", "address":""}]}');
		obj.hyper[0]['UPDATE'] = hyper[modalClick].id;
		obj.hyper[0]['name'] = hyper[modalClick].name;
		obj.hyper[0]['address'] = hyper[modalClick].address;
		$.ajax({
			url : window.location.pathname + "ajax.php",
			data : escape(JSON.stringify(obj)),
			type : "PUT",
			success: function(data) {
				console.log("success", data);
				modifyHyperDOM();
			},
			error: function() {
				console.log("error");
			},
			complete: function() {
				console.log("complete");
			}
		});
	}
	else
		modifyHyperDOM();
}

//insert a new record based on user input on the modal form
function insertHyper() {
	var tmp = $("#hyper_entry > ");
	hyper[hyper.length] = new Hyper(
		Math.floor(Math.random() * 1000000),//temp value, hopefully nevers collides for offline
		tmp.find("input[name=hyper_name]").val(),
		tmp.find("input[name=hyper_description]").val(),
		tmp.find("input[name=hyper_address]").val(),
		tmp.find("input[name=hyper_image]").val(),
		hyper.length+1
	);
	var cur = hyper.length - 1;
	if (!testLocal) {
		var obj = JSON.parse('{"hyper":[{"CREATE":"id", "name":"", "description":"", "address":"", "image":"", "linkOrder":""}]}');
		obj.hyper[0]['name'] = hyper[cur].name;
		obj.hyper[0]['description'] = hyper[cur].description;
		obj.hyper[0]['address'] = hyper[cur].address;
		obj.hyper[0]['image'] = hyper[cur].image;
		obj.hyper[0]['linkOrder'] = hyper[cur].linkOrder;
		$.ajax({
			url : window.location.pathname + "ajax.php",
			data : escape(JSON.stringify(obj)),
			type : "POST",
			success: function(data) {
				console.log("success", data);
				obj = JSON.parse(String(data));
				if ($.isPlainObject(obj))
					hyper[cur].id = obj.hyper[0]['id'];//set the id to the one on the server so that it can be interacted with
				else
					console.log("Data passed was not valid JSON or received no data");
				addHyperDOM(cur);
			},
			error: function() {
				console.log("error");
			},
			complete: function() {
				console.log("complete");
			}
		});
	}
	else
		addHyperDOM(cur);
}

/*DOM / object swapping takes place in the drag events
  swap the dragged linkOrder value with the dropped linkOrder value
*/
function modifyHyperOrder(activeID, linkOrder, dragged, dropped) {
	if (!testLocal) {
		var obj = JSON.parse('{"hyper":[{"UPDATE":"","dragged":"","dropped":""}]}');
		obj.hyper[0]['UPDATE'] = activeID;
		obj.hyper[0]['dragged'] = dragged;
		obj.hyper[0]['dropped'] = dropped;
		console.log('obj', obj);
		$.ajax({
			url : window.location.pathname + "ajax.php",
			data : escape(JSON.stringify(obj)),
			type : "PUT",
			success: function(data) {
				console.log("success", data);
			},
			error: function() {
				console.log("error");
			},
			complete: function() {
				console.log("complete");
			}
		});
	}
}

//delete the corresponding DOM, object, and database record of the element with the .activeLink class
function deleteHyper() {
	$('#context').hide();
	var index = $('#links').children('.activeLink').prop('id');
	if (typeof index === 'undefined') {
		alert('No links have been selected');
		return;
	}
	index = index.replace('hyper', '');
	if (!testLocal) {
		var obj = JSON.parse('{"hyper":[{"DELETE":"id"}]}');
		obj.hyper[0]['DELETE'] = index;
		$.ajax({
			url : window.location.pathname + "ajax.php",
			data : escape(JSON.stringify(obj)),
			type : "DELETE",
			success: function(data) {
				console.log("success", data);
				deleteHyperDOM(index);
			},
			error: function() {
				console.log("error");
			},
			complete: function() {
				console.log("complete");
			}
		});
	}
	else {
		$(".activeLink").fadeOut(200, function () {deleteHyperDOM(index);});
	}
}
