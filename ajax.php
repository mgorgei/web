<?php
include 'pwds.php';
/*my free server host won't play nice with DELETE / PUT / etc. requests (need a
  workaround) -> first character of the query string indicates what the
  original request was supposed to be in CRUD.
  CRUD in a GET request
  C == Create 
  R == Read (already correctly handled by GET)
  U == Update
  D == Delete
*/
try {
	$dbh = new PDO($dsn, $username, $password, $options);
	$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}
catch(PDOException $e) {
	echo 'failed fetch';
	echo $e->getMessage();
	die('why you die');
}
if ($_SERVER["REQUEST_METHOD"] === 'GET') {
	//Read request R == Read
	if (substr($_SERVER["QUERY_STRING"], 0, 1) === 'R') {
		$sql = 'SELECT id, type, time FROM `Timer`';
		foreach ($dbh->query($sql) as $row) {
			echo $row['id'] . "\t";
			echo $row['type'] . "\t";
			echo $row['time'] . "\n";
		}
	}
	//Create request C == Create
	elseif (substr($_SERVER["QUERY_STRING"], 0, 1) === 'C') {
		$input = explode(',', substr($_SERVER["QUERY_STRING"], 1));//typical value-> C17:10:00,0
		if (is_numeric(str_replace(':', '', $input[0])) and is_numeric($input[1])) {
			$sql = 'INSERT INTO `Timer` (`time`, `type`) VALUES (\'' . $input[0] . '\', \'' . $input[1] . '\');';
			$dbh->query($sql);
			//getting the MAX id should get the latest created auto increment primary key value to pass back to the application
			$sql = 'SELECT MAX(id) as \'m\' FROM `Timer`';
			foreach ($dbh->query($sql) as $row)
				echo $row['m'];
		}
	}
	//Delete request D == Delete
	elseif (substr($_SERVER["QUERY_STRING"], 0, 1) === 'D') {
		if (is_numeric(substr($_SERVER["QUERY_STRING"], 1))) {
			$sql = 'DELETE FROM `Timer` WHERE id=' . substr($_SERVER["QUERY_STRING"], 1);
			$dbh->query($sql);
		}
	}
}
else {
	header("HTTP/1.1 406 Not Acceptable");
	exit();
}
?>