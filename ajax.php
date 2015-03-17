<?php
include 'pwds.php';
if ($_SERVER["REQUEST_METHOD"] === 'GET' and $_SERVER["QUERY_STRING"] === 'timers') {
	try {
		$dbh = new PDO($dsn, $username, $password, $options);
		$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$sql = 'SELECT id, type, time FROM `Timer`';
		foreach ($dbh->query($sql) as $row) {
			echo $row['id'] . "\t";
			echo $row['type'] . "\t";
			echo $row['time'] . "\n";
		}
		$query = $dbh->prepare($sql);
		$query->execute();
		$rows = $query->fetchAll();
		foreach ($rows as $rs) {
			$id = $rs['id'];
		}
	}
	catch(PDOException $e) {
		echo 'failed fetch';
		echo $e->getMessage();
		die('why you die');
	}
}

//cannot use DELETE right now on server...
if ($_SERVER["REQUEST_METHOD"] === 'GET' and substr($_SERVER["QUERY_STRING"], 0, 1) === 'D') {// and is_numeric($_SERVER["QUERY_STRING"])) {
	try {
		$dbh = new PDO($dsn, $username, $password, $options);
		$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$sql = 'DELETE FROM `Timer` WHERE id=' . substr($_SERVER["QUERY_STRING"], 1);
		$dbh->query($sql);
	}
	catch(PDOException $e) {
		echo 'failed deletion';
		echo $e->getMessage();
		die('why you die');
	}
}

if ($_SERVER["REQUEST_METHOD"] === 'GET' and substr($_SERVER["QUERY_STRING"], 0, 1) === 'P') {//<-- really need to validate data from XSS on this one...
	try {
		$dbh = new PDO($dsn, $username, $password, $options);
		$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$input = explode(',', substr($_SERVER["QUERY_STRING"], 1));
		$sql = 'INSERT INTO `Timer` (`time`, `type`) VALUES (\'' . $input[0] . '\', \'' . $input[1] . '\');';
		//echo $_SERVER["QUERY_STRING"];
		//echo $sql;
		$dbh->query($sql);
		$sql = 'SELECT MAX(id) as \'m\' FROM `Timer`';
		foreach ($dbh->query($sql) as $row)
			echo $row['m'];
	}
	catch(PDOException $e) {
		echo 'failed post';
		echo $e->getMessage();
		die('why you die');
	}
}
#echo phpinfo();//this is useful server info
?>