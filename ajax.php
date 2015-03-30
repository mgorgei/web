<?php
include 'pwds.php';
try {
	$dbh = new PDO($dsn, $username, $password, $options);
	$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}
catch(PDOException $e) {
	echo 'failed fetch';
	echo $e->getMessage();
	die('why you die');
}
//get the JSON data for processing
if ($_SERVER["REQUEST_METHOD"] === 'GET') {
	$data = $_SERVER["QUERY_STRING"];
}
else {
	$data = file_get_contents('php://input');//POST, PUT, DELETE won't use $_SERVER["QUERY_STRING"]
}
$js = json_decode(rawurldecode($data));

//deal with timers
if (isset($js->timers)) {
	//GET READ //{"timers":[{"READ":"all"}]}
	if ($_SERVER["REQUEST_METHOD"] === 'GET' and isset($js->timers[0]->READ)) {
		$sql = 'SELECT id, type, time FROM `Timer`';
		foreach ($dbh->query($sql) as $row) {
			$out['id'] = $row['id'];
			$out['type'] = $row['type'];
			$out['time'] = $row['time'];
			$output[] = $out;//push the array on
		}
		$output = array('timers' => $output);
		echo json_encode($output);
		exit();
	}
	//POST CREATE //{"timers":[{"CREATE":"time"}]}
	elseif ($_SERVER["REQUEST_METHOD"] === 'POST' and isset($js->timers[0]->CREATE)) {
		if (is_numeric(str_replace(':', '', $js->timers[0]->CREATE))) {
			$sql = 'INSERT INTO `Timer` (`time`, `type`) VALUES (\'' . $js->timers[0]->CREATE . '\', \'' . 0 . '\');';
			$dbh->query($sql);
			//getting the MAX id should get the latest created auto increment primary key value to pass back to the application
			$sql = 'SELECT MAX(id) as \'m\' FROM `Timer`';
			$out = $dbh->query($sql)->fetch()['m'];
			echo json_encode( array('timers' => array(array('id' => $out ))));//array of array... well looks pretty wrong now, looked okay on JS side
			exit();
		}
	}
	//DELETE DELETE //{"timers":[{"DELETE":"id"}]}
	elseif ($_SERVER["REQUEST_METHOD"] === 'DELETE' and isset($js->timers[0]->DELETE)) {
		if (is_numeric($js->timers[0]->DELETE)) {
			$sql = 'DELETE FROM `Timer` WHERE id=' . $js->timers[0]->DELETE;
			$dbh->query($sql);
			exit();
		}
	}
}
//did not recognize the JSON given
else {
	header("HTTP/1.1 402 Payment required");
	exit();
}
//in case anything slips partially by, but does not complete via exit()
header("HTTP/1.1 406 Not Acceptable");
?>