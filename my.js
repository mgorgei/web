"use strict";
/*Glbl "class"
*/
function Glbl() {
	this.testLocal = window.location.hostname === 'localhost';//detects local access to disable ajax calls so I can develop faster with local python implementation
	this.modalClick = -1;//saves id of modified hyperlink when calling a modal dialog
	this.gg = null;//global variable for inspecting objects quickly
} var glbl = new Glbl();
	
/*Alarm "class"
*/
function Alarm() {
	this.digits = [];//imageData for digits 0-9 and the empty digit(pos 10)
	this.resetDrawn = [11,12,13,14,15,16];//default state of clock to show everything needs to be redrawn
	this.lastDrawn = $.extend(true, {}, this.resetDrawn);//index represents position of the last drawn digit (value)//jQuery deep copy
	this.twenty_four_hour_clock = false;
	this.lengthOfSemiColon = 32;//cannot be measured in the image, so needs to be specified
	this.timeAlarmExpires = 600;//in seconds
	this.alarmDelay = 10;//time in seconds from start of alarm sound
	this.alarmLastPlayed = 0;//ms since 1/1/1970
	this.alarmTriggering = false;//is an alarm being triggered right now
	this.alarmDraw = false;//draw empty digits if true
	this.lastHH = 0;
	this.lastMM = 0;//last value of the input field to fallback on when typing errors occur
	this.lastSS = 0;
	this.shiftKey = false;//detect when shift is pressed within the input HH:MM:SS fields
	this.procTab = false;//save pressing ':' in keydown/keyup event for use in oninput event since type=number doesn't give non-number characters
	this.colorEnum = {
		outline:    -2, 
		background: -1, 
		source:      0, 
		digiton:     1, 
		digitoff:    2};
	Object.freeze(this.colorEnum);//closest implementation to enum available
	this.clockIntervalID = null;//saves id of the interval so that it can be killed later
	this.canvas = null;//points to the DOM canvas
	this.context = null;//context of the canvas
	this.base_image = null;//color-coded image used for drawing the digits in the canvas
}var alarm = new Alarm();

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
	if (!isNaN(image))
		this.image = scapLocation(image);
	else
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
	this.start = null;
	this.current = null;
	this.last = null;
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
			if (e.target.id.slice(0,5) !== 'hyper') {
				e.preventDefault();
				return false;
			}
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
				$('#' + drag.start).insertBefore($('#' + drag.current));
			}
			else if (drag.current === 'links')
				if (e.originalEvent.pageX <= parseInt($('#links').css('padding-left')) || e.originalEvent.pageY <= parseInt($('#links').css('padding-top')))
					$('#' + drag.start).insertBefore($('#links').children().first());
				else
					$('#' + drag.start).insertAfter($('#links').children().last());
			drag.last = drag.current;
		});
		
		$('#links').on('dragend', function (e) {//should be a way to refactor this mess...
			$("#links > *").removeClass('dragStart over');
			var index = findOwner(drag.start);
			var i = null;
			if (drag.current === 'links') {
				//if the drag is placed within the left / top padding, drop as the first object in the list
				console.log(e.originalEvent.pageX, e.originalEvent.pageY);
				if (e.originalEvent.pageX <= parseInt($('#links').css('padding-left')) || e.originalEvent.pageY <= parseInt($('#links').css('padding-top'))) {
					if (hyper[index].linkOrder != 1) {//don't move if the element is already first
						modifyHyperOrder(hyper[index].id, hyper[findOwner(drag.start)].linkOrder, 1);
						for (i = 0; i < hyper.length; i++)
							if (hyper[i].linkOrder < hyper[index].linkOrder)
								hyper[i].linkOrder = hyper[i].linkOrder + 1;
						hyper[index].linkOrder = 1;
					}
				}
				else {//drop as last object in the list
					if (hyper[index].linkOrder != hyper.length) {//don't move if the element is already last
						modifyHyperOrder(hyper[index].id, hyper[findOwner(drag.start)].linkOrder, hyper.length + 1);
						for (i = 0; i < hyper.length; i++)
							if (hyper[i].linkOrder > hyper[index].linkOrder)
								hyper[i].linkOrder = hyper[i].linkOrder - 1;
						hyper[index].linkOrder = hyper.length;
					}
				}
			}
			else {
				if (drag.current !== drag.start) {
					var dragged = findOwner(drag.current);
					var tmp = hyper[dragged].linkOrder;
					modifyHyperOrder(hyper[index].id, hyper[findOwner(drag.start)].linkOrder, hyper[findOwner(drag.current)].linkOrder);
					//dragging to a lower element
					if (hyper[index].linkOrder > hyper[dragged].linkOrder){
						for (i = 0; i < hyper.length; i++)
							if (hyper[i].linkOrder < hyper[index].linkOrder && hyper[i].linkOrder >= hyper[dragged].linkOrder)
								hyper[i].linkOrder = hyper[i].linkOrder + 1;
						hyper[index].linkOrder = tmp;
					}
					//dragging to a higher element
					else {
						for (i = 0; i < hyper.length; i++)
							if (hyper[i].linkOrder > hyper[index].linkOrder && hyper[i].linkOrder < hyper[dragged].linkOrder)
								hyper[i].linkOrder = hyper[i].linkOrder - 1;
						hyper[index].linkOrder = tmp - 1;
					}
				}
			//find some kind of transition animation for moving the dragged item
			//$('#' + drag.start).addClass('dragEnd');
			drag = new Drag();
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
		alarm.canvas = document.getElementById("canvas");
		alarm.context = alarm.canvas.getContext('2d');
		drawDigits();
		//initialize all popovers (necessary)
		$('[data-toggle="popover"]').popover({
			trigger: 'hover',
			delay: '200'
		});
		$("#timer_hours").focus();
		/*********************************************************************/
		$("#myModal").on('show.bs.modal', function () {
			$("#hyper_entry input").removeClass('modalEmpty');
		});
		$("#myModal").on('shown.bs.modal', function () {
			$("#hyper_entry > ").find("input[name=hyper_name]").focus();
		});
		$("#hyper_modal").click(function () {$('#context').hide();});
		$("#add_hyper").click(function () {
			//make sure the web address points somewhere absolute by appending http:// if it cannot find  http://  https://
			var tmp = $("#hyper_entry > ").find("input[name=hyper_address]").val();
			//check if either field is empty, mark them by a class
			if (! tmp)
				$("#hyper_entry > ").find("input[name=hyper_address]").addClass('modalEmpty');
			if (! $("#hyper_entry > ").find("input[name=hyper_name]").val())
				$("#hyper_entry > ").find("input[name=hyper_name]").addClass('modalEmpty');
			if ($("#hyper_entry input").hasClass('modalEmpty'))
				return;
			//accepted
			if (tmp.toLowerCase().slice(0,7) !== 'http://')
				 $("#hyper_entry > ").find("input[name=hyper_address]").val('http://' + tmp);
			if (glbl.modalClick == -1) 
				insertHyper();
			else
				modifyHyper(glbl.modalClick);
			//dismiss modal
			$('#myModal').modal('hide');
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
					glbl.modalClick = -1;
					$('#myModalLabel').text('Enter new hyperlink');
					$("#hyper_entry > ").find("input[name=hyper_name]").val('');
					$("#hyper_entry > ").find("input[name=hyper_address]").val('');
					$('#add_hyper').children().first().text('New');
				}
				else {//find which div by traversing up until finding a 'hyper###' id
					var search = $(e.target);
					while (search.prop('id').slice(0,5) !== 'hyper')
						search = search.parent();
					glbl.modalClick = findOwner(search.prop('id'));
					$('#myModalLabel').text('Modify hyperlink');
					$("#hyper_entry > ").find("input[name=hyper_name]").val( hyper[glbl.modalClick].name );
					$("#hyper_entry > ").find("input[name=hyper_address]").val( hyper[glbl.modalClick].address );
					$('#add_hyper').children().first().text('Modify');
				}
				$("#myModal").modal('show');//just show the modal dialogue since all the other context options are woven into the html interactions
				window.event.returnValue = false;
			});
		}
		/*********************************************************************/
		$('#audio').on('loadedmetadata', function () {
			alarm.alarmDelay = Math.floor(4 * this.duration);
		});
		//when the base_image is loaded, can draw the clock
		$("#canvas").on("onloadeddata", function() {
			updateClock();
			clearInterval(alarm.clockIntervalID);
			alarm.clockIntervalID = setInterval(updateClock, 500);
		});
		//one time event for easier event handling (canvas should not use multiple color pickers)
		$(".canvas").one("click", canvasColor);
		/*********************************************************************/
		//make ':' behave as a tab key by capturing simultaneous SHIFT + ';' key presses
		$("#timer_entry").children().children("input[type=number]").on( "keydown", function( event ) {
			if (event.which == 16)
				alarm.shiftKey = true;
			if (event.which == 186)
				if (alarm.shiftKey) {
					alarm.procTab = true;
				}
		});
		$("#timer_entry").children().children("input[type=number]").on( "keyup", function( event ) {
			if (event.which == 16)
				alarm.shiftKey = false;
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
		alarm.digits[j].data[i] = CSScolor[0];
		alarm.digits[j].data[i+1] = CSScolor[1];
		alarm.digits[j].data[i+2] = CSScolor[2];
		alarm.digits[j].data[i+3] = 255;
	}
	alarm.canvas = document.getElementById("canvas");
	alarm.context = alarm.canvas.getContext('2d');
	alarm.base_image = new Image();
	alarm.base_image.onload = function() {
		alarm.canvas.width = alarm.base_image.width * 6 - alarm.lengthOfSemiColon;
		alarm.canvas.height = alarm.base_image.height * 1;
		//draw the coded image on the canvas to push the data onto an array
		alarm.context.drawImage(alarm.base_image, 0, 0);
		var colorDigit = $(".digitOn").css("color").slice(4, -1).split(',');
		var colorDigitOff = $(".digitOff").css("color").slice(4, -1).split(',');
		var colorBackground = $(".digitBackground").css("color").slice(4, -1).split(',');
		var colorOutline = $(".digitOutline").css("color").slice(4, -1).split(',');
		var imageData = alarm.context.getImageData(0, 0, alarm.base_image.width, alarm.base_image.height);
		for (var j = 0; j < 11; j++) {
			alarm.digits[j] = alarm.context.createImageData(alarm.base_image.width, alarm.base_image.height);
			//fill each pixel with a matching css color
			for (var i = 0; i < imageData.data.length; i+=4) {
				var result = identifyPixel(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2], j);
				if (result == alarm.colorEnum.digiton)
					fill(i, j, colorDigit);
				else if (result == alarm.colorEnum.digitoff)
					fill(i, j, colorDigitOff);
				else if (result == alarm.colorEnum.background)
					fill(i, j, colorBackground);
				else if (result == alarm.colorEnum.outline)
					fill(i, j, colorOutline);
				else //  result == alarm.colorEnum.source
					fill(i, j, imageData.data.splice(i, i + 3));//source is a fallback now since the entire image is tagged
			}
		}
		$("#canvas").triggerHandler("onloadeddata");
	};
	//alarm.base_image.crossOrigin = "use-credentials";//'anonymous';
	alarm.base_image.src = 'images/digit.png'; //src needs to be specified after onload event
}

//change digits with the new color and draw every digit again
function reDraw() {
	drawDigits();
	alarm.lastDrawn = jQuery.extend(true, {}, alarm.resetDrawn);
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
	function fp(matching_color, valid_digits) {//
		if (red == matching_color && green == matching_color) {//in a region or region-outline
			var result = false;
			for (var i = 0; i < valid_digits.length; i++)//go through all digits that needs this region
				if (j == valid_digits[i]) {
					result = true;
					break;
				}
			if (result) {//the current digit needs this region
				if (blue == matching_color)//is this a region (true) or region-outline
					return alarm.colorEnum.digiton;
				return alarm.colorEnum.outline;
			}
			else {
				if (blue == matching_color)//is this a region (true) or region-outline
					return alarm.colorEnum.digitoff;
				return alarm.colorEnum.background;//the digitoff outline does not have a unique color
			}
		}
		return 127; //fail code
	}
	var regionMap = [
	[0, 2, 3, 5, 6, 7, 8, 9],
	[0, 1, 2, 3, 4, 7, 8, 9],
	[0, 1, 3, 4, 5, 6, 7, 8, 9],
	[0, 2, 3, 5, 6, 8, 9],
	[0, 2, 6, 8],
	[0, 4, 5, 6, 8, 9],
	[2, 3, 4, 5, 6, 8, 9]];
	//fill regions 1 - 7
	for (var i = 0; i < 7; i++) {
		var colorCode = fp(i + 1, regionMap[i]);
		if (colorCode != 127)
			return colorCode;
	}
	//fill region 8 (semi-colon)
	if (red == 8 && green == 8 && blue == 8)
		return alarm.colorEnum.digiton;
	if (red === 0 && green == 255 && blue == 255)
		return alarm.colorEnum.outline;
	//fill background
	if (red === 0 && green == 255 && blue === 0)
		return alarm.colorEnum.background;
	return alarm.colorEnum.source;
}

//updates the canvas to display the current time every ~1000 ms
function updateClock() {
	function drawDigit(fn, i) {//draws digit if it has been changed since last draw
		if (alarm.lastDrawn[i] != fn(use)) {
			alarm.lastDrawn[i] = fn(use);
			alarm.context.putImageData(alarm.digits[alarm.lastDrawn[i]], alarm.digits[0].width * i, 0);
			if (i % 2 === 0)//draw over even semi-colons with a blank rectangle to cover them up
				alarm.context.fillRect(alarm.digits[0].width * (i + 1) - alarm.lengthOfSemiColon, 0, alarm.lengthOfSemiColon, alarm.digits[0].height);
		}
	}
	function flashAlarm() {//alternate between showing empty digits during an alarm and the real time
		for (var i = 0; i < 6; i++)
			alarm.context.putImageData(alarm.digits[10], alarm.digits[0].width * i, 0);//empty '8'
			if (i % 2 === 1)//cover the semi-colon of half the digits
				alarm.context.fillRect(alarm.digits[0].width * i - alarm.lengthOfSemiColon, 0, alarm.lengthOfSemiColon, alarm.digits[0].height);
		alarm.lastDrawn = jQuery.extend(true, {}, [10,10,10,10,10,10]);
	}
	function drawUnchanged() {//draw only digits that have changed
		var f_even = function (v) { return Math.floor(v / 10); };
		var f_odd = function (v) { return v % 10; };
		for (var i = 0; i < 6; i++) {
			if (i < 2)
				use = hours;
			else if (i < 4)
				use = minutes;
			else
				use = seconds;
			if (i === 0 && use < 10)
				drawDigit(function () { return 10; }, i);//special case where hours < 10 shows an empty digit
			else
				drawDigit(i % 2 ? f_odd : f_even, i);
		}
	}
	var d = new Date();
	var seconds = d.getSeconds();
	var minutes = d.getMinutes();
	var hours = d.getHours();
	if (hours > 12)//cannot find a non-convoluted way of detecting local time (12 or 24 hour clock)
		hours = hours - 12;
	if (hours === 0)
		hours = 12;
	var fillColor = $(".digitBackground").css("color").slice(4, -1).split(',');
	alarm.context.fillStyle = "#" + strToHex(fillColor[0]) + strToHex(fillColor[1]) + strToHex(fillColor[2]);//seems too common to not have a default method...
	var divChange = alarm.lastDrawn[0] === alarm.resetDrawn[0];
	var use = null;
	if (alarm.alarmTriggering && alarm.alarmDraw) 
		flashAlarm();
	else
		drawUnchanged();
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
	var i = null;
	if (e.target.id === 'canvas') {
		var x = Math.floor(e.pageX - $(e.target).offset().left);
		var y = Math.floor(e.pageY - $(e.target).offset().top);
		var sample = alarm.context.getImageData(x, y, 1, 1).data;
		for (i = 0; i < classes.length; i++)
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
		return (isNaN(i) || i === "" || parseInt(i) < $(jq).prop("min") || parseInt(i) > $(jq).prop("max") || i.indexOf('.') != -1);
	}
	function getValue(jq) {//get the value; if is not valid, set the form to 0; return the value on the form
		var value = $(jq).val();
		if (vi(value, jq)) {
			if (!alarm.procTab) {
				$(jq).val(0);
				return 0;
			}
			else//set input to last valid value if ':' was pressed
				if (jq == "#timer_hours")
					$(jq).val(alarm.lastHH);
				else if (jq == "#timer_minutes")
					$(jq).val(alarm.lastMM);
				else //if (jq == "#timer_seconds")
					$(jq).val(alarm.lastSS);
		}
		return value.toString().substr(-2);//untested
	}
	function checkTab() {//check who has focus here to validate and move onto another input based on the range or procTab
		var tmp = null;
		var tenDigit = 2;//for hours (2_), for minutes and seconds (5_)
		var elems = ["timer_hours", "timer_minutes", "timer_seconds", "add_timer"];
		var vars = ['lastHH', 'lastMM', 'lastSS'];
		for (var i = 0; i < elems.length - 1; i++) {//don't check 'add_timer'
			if ($(document.activeElement).prop("id") === elems[i]) {
				tmp = getValue('#' + elems[i]).toString().substr(-2);
				console.log(elems[i], tmp, tenDigit);
				if ((tmp > tenDigit && tmp < 10) || (tmp.length >= 2) || alarm.procTab) {
					if (i !== 2)
						$('#' + elems[i + 1]).select();//select the text an focus the next tabbed element
					else
						$('#' + elems[i + 1]).focus();
				}
				alarm.procTab=false;
				alarm[vars[i]] = tmp;//typing ':' clears the input, so the old input needs to be saved for later
				break;
			}
			tenDigit = 5;//instead of conditionally checking something true 2/3 of the time, this is computationally cheaper
		}
	}
	console.log($("#timer_hours").val(), $("#timer_minutes").val(), $("#timer_seconds").val());
	checkTab();
	//pass user input into new Date object and return the string if it survives
	var today = new Date();
	var ps = Number(today.getMonth() + 1) + ' ' + Number(today.getDate()) + ' ' + today.getFullYear() + ' ' + 
		('0' + getValue("#timer_hours").toString()).substr(-2) + ':' + 
		('0' + getValue("#timer_minutes").toString()).substr(-2) + ':' +
		('0' + getValue("#timer_seconds").toString()).substr(-2);
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
	if (glbl.testLocal) {
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
							timers[i] = new Timer(Date.parse(today + obj.timers[i].time), obj.timers[i].type, obj.timers[i].id);
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
			if (!glbl.testLocal) {
				var t = timers[i].time.toTimeString();
				var obj = JSON.parse('{"timers":[{"CREATE":"time"}]}');
				obj.timers[0].CREATE = t.substr(0, t.indexOf(' '));
				$.ajax({
					url : window.location.pathname + "ajax.php",
					data : escape(JSON.stringify(obj)),
					type : "POST",
					success: function(data) {
						console.log("success", data);
						var obj = JSON.parse(String(data));
						if ($.isPlainObject(obj))
							timers[0].id = obj.timers[0].id;//get back the id that was just created, to avoid getting all information for one op
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
		if (!glbl.testLocal) {
			var obj = JSON.parse('{"timers":[{"DELETE":"id"}]}');
			obj.timers[0].DELETE = timers[index].id;
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
		if (Date.now() > timers[i].time.getTime() && Date.now() < timers[i].time.getTime() + alarm.timeAlarmExpires * 1000) {
			alarm.alarmTriggering = true;
			alarm.alarmDraw = !alarm.alarmDraw;
			if (Date.now() > alarm.alarmLastPlayed + alarm.alarmDelay * 1000) {
				//show which tr element is playing this sound
				var tmp = '<span name="temp" class="glyphicon glyphicon-volume-up" aria-hidden="true" style="padding-left:8px"></span>';
				$("#table_body > tr:eq(" + i + ")").children(":eq(0)").append(tmp);
				$("span[name=temp]").fadeOut(1000, function() {$(this).remove();});
				alarm.alarmLastPlayed = Date.now();
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
	elem.css('fill','');//erase so that it can be overridden
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
//return the screencap's location as a string
function scapLocation(filename) {
	return window.location.origin + '/scaps/' + filename + '.jpg';
}

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
	"<a href=\"" + hyper[i].address + "\" draggable=false target=\"_blank\">" + 
	"<h5>" + hyper[i].name + "</h5>" + 
	"<img class=\"centered center-block\" src=\"" + hyper[i].image + "\" draggable=false />" +
	"<p class=\"text-center\" hidden>" + hyper[i].description + "</p></a></div>");
}

//modify hyper DOM
function modifyHyperDOM() {
	$('#hyper' + hyper[glbl.modalClick].id + ' > a').prop('href', hyper[glbl.modalClick].address);
	$('#hyper' + hyper[glbl.modalClick].id + ' > > h5').text(hyper[glbl.modalClick].name);
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
}

//clear all hyperLinks and grab everything from the server
function getHyper() {
	$('#context').hide();
	hyper = [];
	if (!glbl.testLocal) {
		$.ajax({
			url : window.location.pathname + "ajax.php",
			data : escape('{"hyper":[{"READ":"all"}]}'),
			type : "GET",
			success: function(data) {
				console.log("success", data);
				var obj = JSON.parse(String(data));
				if ($.isPlainObject(obj)) {
					for(var i = 0; i < obj.hyper.length; i++)
						hyper[i] = new Hyper(obj.hyper[i].id, obj.hyper[i].name, obj.hyper[i].description, obj.hyper[i].address, obj.hyper[i].image, +obj.hyper[i].linkOrder);
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

/*update the hyperlink through the modal form's fields if the address has 
  changed, a new screencap needs to be generated
*/
function modifyHyper() {
	var tmp = $("#hyper_entry > ");
	var modifiedImage = hyper[glbl.modalClick].address !== tmp.find("input[name=hyper_address]").val();
	hyper[glbl.modalClick].name = tmp.find("input[name=hyper_name]").val();
	hyper[glbl.modalClick].address = tmp.find("input[name=hyper_address]").val();
	if (!glbl.testLocal) {
		//show the loading image indicating something is going on
		$('#hyper' + hyper[glbl.modalClick].id + ' > > img').attr('src', window.location.origin + '/images/loading.svg');
		var obj = JSON.parse('{"hyper":[{"UPDATE":"id", "name":"", "address":"", "modified":""}]}');
		obj.hyper[0].UPDATE = hyper[glbl.modalClick].id;
		obj.hyper[0].name = hyper[glbl.modalClick].name;
		obj.hyper[0].address = hyper[glbl.modalClick].address;
		obj.hyper[0].modified = modifiedImage;
		$.ajax({
			url : window.location.pathname + "ajax.php",
			data : escape(JSON.stringify(obj)),
			type : "PUT",
			success: function(data) {
				console.log("success", data);
				if (modifiedImage) {
					console.log('image was modified');
					//try to un-cache the image
					if (true) //should check for existence since a long time has passed
						$('#hyper' + hyper[glbl.modalClick].id + ' > > img').attr('src', scapLocation(hyper[glbl.modalClick].id) + '#' + new Date().getTime());
				}
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

//needs to be broken down
//insert a new record based on user input on the modal form
function insertHyper() {
	var tmp = $("#hyper_entry > ");
	var r_value = 100000 + Math.floor(Math.random() * 1000000);//temp value, hopefully nevers collides for offline
	var t_img = null;
	if (!glbl.testLocal)
		t_img = window.location.origin + '/images/loading.svg';
	else
		t_img = tmp.find("input[name=hyper_image]").val();
	hyper[hyper.length] = new Hyper(
		r_value,
		tmp.find("input[name=hyper_name]").val(),
		tmp.find("input[name=hyper_description]").val(),
		tmp.find("input[name=hyper_address]").val(),
		t_img,
		hyper.length+1
	);
	var cur = hyper.length - 1;
	if (!glbl.testLocal) {
		var obj = JSON.parse('{"hyper":[{"CREATE":"id", "name":"", "description":"", "address":"", "image":"", "linkOrder":""}]}');
		obj.hyper[0].name = hyper[cur].name;
		obj.hyper[0].description = hyper[cur].description;
		obj.hyper[0].address = hyper[cur].address;
		obj.hyper[0].image = hyper[cur].image;
		obj.hyper[0].linkOrder = hyper[cur].linkOrder;
		addHyperDOM(cur);//changing order here to be illustrative of how long it takes to load a screencap
		$.ajax({
			url : window.location.pathname + "ajax.php",
			data : escape(JSON.stringify(obj)),
			type : "POST",
			success: function(data) {
				console.log("success", data);
				obj = JSON.parse(String(data));
				if ($.isPlainObject(obj)) {
					hyper[cur].id = obj.hyper[0].id;//set the id to the one on the server so that it can be interacted with
					$('#hyper' + r_value).prop('id', 'hyper' + hyper[cur].id);//this is messy
					//make a separate query for database interactive stability
					obj = JSON.parse('{"hyper":[{"UPDATE":0, "address":0}]}');
					obj.hyper[0].UPDATE = hyper[cur].id;
					obj.hyper[0].address = hyper[cur].address;
					$.ajax({
						url : window.location.pathname + "ajax.php",
						data : escape(JSON.stringify(obj)),
						type : "PUT",
						success: function() {
							hyper[cur].image = scapLocation(hyper[cur].id);
							$('#hyper' + hyper[cur].id + ' > > img').attr('src', hyper[cur].image + '#' + new Date().getTime());
						}
					});
					/*********************************************************/
				}
				else
					console.log("Data passed was not valid JSON or received no data");
				//addHyperDOM(cur);
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
function modifyHyperOrder(activeID, dragged, dropped) {
	if (!glbl.testLocal) {
		var obj = JSON.parse('{"hyper":[{"UPDATE":"","dragged":"","dropped":""}]}');
		obj.hyper[0].UPDATE = activeID;
		obj.hyper[0].dragged = dragged;
		obj.hyper[0].dropped = dropped;
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
	if (!glbl.testLocal) {
		var obj = JSON.parse('{"hyper":[{"DELETE":"id"}]}');
		obj.hyper[0].DELETE = index;
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
