<!--<?php
include 'pwds.php';
header("Cache-Control: no-cache, private, no-store, max-age=0, must-revalidate"); //HTTP 1.1
header("Pragma: no-cache"); //HTTP 1.0
try {
	$dbh = new PDO($dsn, $username, $password, $options);
	$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}
catch (PDOException $e) {
	header("HTTP/1.1 402 Payment required");
	exit();
}
//get some basic user information
$host = 'unset';
$referer = 'unset';
$data = array($_SERVER['REMOTE_ADDR'], $_SERVER['HTTP_USER_AGENT'], $host, $referer);
$STH = $dbh->prepare('INSERT INTO `Visitors` (`IP`, `agent`, `host`, `referrer`, `method`, `time`) ' .
					 'VALUES (?, ?, ?, ?, "html", NOW())');
$STH->execute($data);
?>-->
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>New Tab()</title>
		<link rel="stylesheet" href="bs/css/bootstrap.min.css">
		<link rel="stylesheet" href="index.css">
	</head>
	<body>
		<!--hyperlinks-->
		<div id="links" class="container-fluid"><!--
			<div id="hyper1" class="col-md-2 drag" draggable=true>
				<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<a href="web address">
					<h5 class="text-center">name</h5>
					<img class="centered center-block" src="image URL" draggable=false />
					<p class="text-center">description</p>
				</a>
			</div>-->
			<!--dynamically built-->
			<img src="images/loading.svg" hidden />
			<!--attribution: Brent Jackson
			http://jxnblk.com -->
		</div>

		<!--modal-->
		<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<h4 class="modal-title" id="myModalLabel">Enter new hyperlink</h4>
			  </div>
			  <div class="modal-body">
			  
				<div id="hyper_entry" class="form-horizontal">
					<div class="row spacing2">
						<label class="control-label col-sm-2" for="hyper_name">Name</label>
						<div class="col-sm-10">
							<input id="hyper_name" name="hyper_name" type="text" class="form-control" />
						</div>
					</div>
					<div class="row spacing2" hidden>
						<label class="control-label col-sm-2" for="hyper_description">Description</label>
						<div class="col-sm-10">
							<input id="hyper_description" name="hyper_description" type="text" class="form-control" disabled="true" />
						</div>
					</div>
					<div class="row spacing2">
						<label class="control-label col-sm-2" for="hyper_address">Address</label>
						<div class="col-sm-10">
							<input id="hyper_address" name="hyper_address" type="text" class="form-control" />
						</div>
					</div>
					<div class="row spacing2" hidden>
						<label class="control-label col-sm-2" for="hyper_image">Image url</label>
						<div class="col-sm-10">
							<input id="hyper_image" name="hyper_image" type="text" class="form-control" disabled="true" value="images/google.svg" />
						</div>
					</div>
				</div>
				<!--<div class="g-recaptcha center" data-sitekey="6LfQ6gQTAAAAAPQm0vvxhSq1xuUdKdCmevRg_GgN"></div>-->
				
			  </div>
			  <div class="modal-footer">
				<button type="button" id="add_hyper" class="btn btn-primary">
					<span class="glyphicon glyphicon-plus" aria-hidden="true">New</span>
				</button>
				<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>

		<!--clock in canvas-->
		<input id="color_picker" class="color {pickerFaceColor:'#EEE'}" />
		<div class="canvas container-fluid">
			<canvas id="canvas" tabindex=-1>
				<img id="digit" src="images/digit.png" hidden /><!--will this preload the image or cache it on consecutive loads?-->
				<!--Attribution: default palette and base image taken from 
				https://www.codeeval.com/open_challenges/179/ -->
				<span class="digitOn" hidden></span>
				<span class="digitOff" hidden></span>
				<span class="digitOutline" hidden></span>
				<span class="digitBackground" hidden></span>
			</canvas>
		</div>
		
		<!--inline form-->
		<form id="timer_entry" class="form-inline" action="" method="post">
			<div class="input-group spacing">
				<label class="input-group-addon" for="timer_hours">HH</label>
					<input id="timer_hours" name="timer_hours" type="number" min=0 max=23 placeholder="(0-23)" class="form-control" tabindex=1 />
			</div>
			<div class="input-group spacing">
				<label class="input-group-addon" for="timer_minutes">MM</label>
					<input id="timer_minutes" name="timer_minutes" type="number" min=0 max=59 placeholder="(0-59)" class="form-control" tabindex=2 />
			</div>
			<div class="input-group spacing">
				<label class="input-group-addon" for="timer_seconds">SS</label>
					<input id="timer_seconds" name="timer_seconds" type="number" min=0 max=59 placeholder="(0-59)" class="form-control" tabindex=3 />
			</div>
				
			<div class="form-group">
				<button type="button" id="add_timer" class="btn btn-default" tabindex=4>
					<span class="glyphicon glyphicon-plus" aria-hidden="true">Add</span>
				</button><!--
				<button type="button" id="refresh_timer" class="btn btn-default" tabindex=5>
					<span class="glyphicon glyphicon-refresh" aria-hidden="true">Refresh</span>
				</button>-->
				<button type="button" id="delete_timer" class="btn btn-default" tabindex=6 disabled="true">
					<span class="glyphicon glyphicon-trash" aria-hidden="true">Remove</span>
				</button>
			</div>
				
			<div class="btn-group spacing" data-toggle="buttons">
				<label for="radio0" id="radio0_label" class="btn btn-default active">
					<input id="radio0" type="radio" name="radio" value=0 checked="checked" tabindex=7 />
					Alarm
				</label>
				<label for="radio1" id="radio1_label" class="btn btn-default">
					<input id="radio1" type="radio" name="radio" value=1 tabindex=7 />
					Stop Watch
				</label>
			</div>
		</form>
		
		<!--table of alarms-->
		<div class="table-responsive">
			<table id="timer_table" class="table table-bordered" tabindex=8>
				<thead>
					<tr><th>Time</th><th>Remaining</th></tr>
				</thead>
				<tbody id="table_body"><!--
					<tr>
						<td>12:00:00</td>
						<td>01:23:45</td>
					</tr>
					<!--dynamically built-->
				</tbody>
			</table>
			<audio id="audio" src="ding.mp3" type="audio/mpeg"><!--not supported in firefox-->
				Your browser does not support the <code>audio</code> element.
				<!--attribution: corsica_s / Tim Kahn on freesound.org via Creative Commons license 
				https://www.freesound.org/people/Corsica_S/sounds/91926/ -->
			</audio>
		</div>

		<!--bottom navbar-->
		<nav class="navbar navbar-default navbar-fixed-bottom">
			<div class="container-fluid">
				<div class="navbar-header">
					<span class="navbar-brand">Contact Me</span>
				</div>
				<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
					<ul id="botbar" class="nav navbar-nav navbar-right">
						<li id="mail"><a href="mailto:mgorgei+filter@umail.iu.edu" class="icons" target="_blank" tabindex=9  data-toggle="popover" data-placement="top" data-title="Email" data-content="Emails sent to this address will be responded to promptly">
							<img src="images/mail.svg" class="icon" />
						</a></li>
						<li id="linkedin"><a href="https://www.linkedin.com/in/michaelgorgei/" class="icons" target="_blank" tabindex=10 data-toggle="popover" data-placement="top" data-title="LinkedIn" data-content="Connect with me on LinkedIn">
							<img src="images/linkedin.svg" class="icon" />
						</a></li>
						<li id="github"><a href="https://www.github.com/mgorgei/" class="icons" target="_blank" tabindex=11 data-toggle="popover" data-placement="top" data-title="GitHub" data-content="Check out my active projects">
							<img src="images/github.svg" class="icon" />
						</a></li>
						<!--attribution: Dreamstale via Creative Commons license 
						http://www.dreamstale.com/free-download-72-vector-social-media-icons/ -->
					</ul>
				</div>
			</div>
		</nav>

<!--********************************************************************************************-->
		<!--<script src='https://www.google.com/recaptcha/api.js'></script>-->
		<script src="jscolor/jscolor.js"></script>
		<script src="jquery-2.1.3.js"></script>
		<script src="bs/js/bootstrap.js"></script>
		<script src="my.js"></script>
	</body>
</html>