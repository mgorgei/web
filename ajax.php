<?php
include 'pwds.php';
echo $_SERVER["REQUEST_METHOD"];
echo $_SERVER["QUERY_STRING"];
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
		echo 'failed';
		echo $e->getMessage();
		die('why you die');
	}
}
#echo phpinfo();//this is useful server info
/*_SERVER["REQUEST_METHOD"]	GET
_SERVER["QUERY_STRING"]	timers*/
?>