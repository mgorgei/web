<?php
//get a report on visitors without jumping through cPanel
include 'pwds.php';

$dbh = new PDO($dsn, $username, $password, $options);
$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$sql = 'SELECT * ' .
	   'FROM `Visitors` ' .
	   'ORDER BY time ASC';
$STH = $dbh->prepare($sql);
$STH->execute();
print '<style type="text/css">
table tr:nth-child(odd){
	background-color: #F2F1EF;
	}
table tr:nth-child(even){
	background-color: #DADADA;
	}
</style>
<div class="table-responsive">
	<table id="timer_table" class="table table-bordered">';
foreach ($STH->fetchAll() as $row) {
	print "<tr>";
	for ($i = 0; $i < floor(count($row) / 2); $i++)
		print "<td>" . $row[$i] . "</td>";
	print "</tr>";
}
print "</table></div>";
exit();
?>