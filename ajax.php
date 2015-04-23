<?php
include 'pwds.php';//variables for passwords and keys that need to be hidden from the public
include 'p2i.php';//function to 
/*connect to the MySQL database on the server.  Respond based on the post 
  request type, the first object's name, and the first key of the expected JSON
  object.  
******************************************************************************/
try {
	$dbh = new PDO($dsn, $username, $password, $options);
	$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}
catch(PDOException $e) {
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

//SELECT statements won't show old data after an update anymore
header('Pragma: no-cache', true);
header("Cache-Control: no-store, no-cache, must-revalidate", true);

//get some basic user information
$host = "unset";//$_SERVER['REMOTE_HOST']
$data = array($_SERVER['REMOTE_ADDR'], $_SERVER['HTTP_USER_AGENT'], $host, $_SERVER['HTTP_REFERER']);
$STH = $dbh->prepare('INSERT INTO `Visitors` (`IP`, `agent`, `host`, `referrer`, `method`, `time`) ' .
					 'VALUES (?, ?, ?, ?, "ajax", NOW())');
$STH->execute($data);
/*****************************************************************************/
//deal with timers
if (isset($js->timers)) {
	//GET READ //{"timers":[{"READ":"all"}]}
	if ($_SERVER["REQUEST_METHOD"] === 'GET' and isset($js->timers[0]->READ)) {
		$sql = 'SELECT id, type, time ' .
			   'FROM `Timer` ' .
			   'WHERE deleteFlag=0';
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
			//should check if the time is valid instead of just numeric!!!
			$data = array($js->timers[0]->CREATE, 0, 0);
			$STH = $dbh->prepare('INSERT INTO `Timer` (`time`, `type`, `deleteFlag`) ' .
								 'VALUES (?, ?, ?)');
			$STH->execute($data);
			//getting the MAX id should get the latest created auto increment primary key value to pass back to the application
			$sql = 'SELECT MAX(id) ' .
				   'FROM `Timer`';
			$out = $dbh->query($sql)->fetch()['MAX(id)'];
			echo json_encode( array('timers' => array(array('id' => $out ))));//array of array... well looks pretty wrong now, looked okay on JS side
			exit();
		}
	}
	//DELETE DELETE //{"timers":[{"DELETE":"id"}]}
	elseif ($_SERVER["REQUEST_METHOD"] === 'DELETE' and isset($js->timers[0]->DELETE)) {
		if (is_numeric($js->timers[0]->DELETE)) {
			$STH = $dbh->prepare('UPDATE `Timer` ' .
							     'SET deleteFlag=? ' .
								 'WHERE id=?');
			$STH->execute(array(1, $js->timers[0]->DELETE));
			exit();
		}
	}
}
/*****************************************************************************/
//deal with hyperlinks
elseif (isset($js->hyper)) {
	//GET READ //{"hyper":[{"READ":"all"}]}
	if ($_SERVER["REQUEST_METHOD"] === 'GET' and isset($js->hyper[0]->READ)) {
		$sql = 'SELECT id, name, description, address, image, linkOrder ' .
			   'FROM `Hyperlink` ' .
			   'WHERE `deleteFlag`=0 ' .
			   'ORDER BY linkOrder ASC';
		foreach ($dbh->query($sql) as $row) {
			$out['id'] = $row['id'];
			$out['name'] = $row['name'];
			$out['description'] = $row['description'];
			$out['address'] = $row['address'];
			$out['image'] = $row['image'];
			$out['linkOrder'] = $row['linkOrder'];
			$output[] = $out;//push the array on
		}
		$output = array('hyper' => $output);
		echo json_encode($output);
		exit();
	}
	//POST CREATE //{"hyper":[{"CREATE":"link"}]}
	elseif ($_SERVER["REQUEST_METHOD"] === 'POST' and isset($js->hyper[0]->CREATE)) {
		if (true) {//presume XSS-checking is going on for now...
			$data = array($js->hyper[0]->name, $js->hyper[0]->description, $js->hyper[0]->address, $js->hyper[0]->image, $js->hyper[0]->linkOrder, 0);
			$STH = $dbh->prepare('INSERT INTO `Hyperlink` (`name`, `description`, `address`, `image`, `linkOrder`, `deleteFlag`) ' .
								 'VALUES (?, ?, ?, ?, ?, ?)');
			$STH->execute($data);
			//get the last inserted auto increment id
			$sql = 'SELECT MAX(id) ' .
				   'FROM `Hyperlink`';
			$id = $dbh->query($sql)->fetch()['MAX(id)'];
			echo json_encode( array('hyper' => array(array('id' => $id ))));
			exit();
		}
	}
	//PUT UPDATE //{"hyper":[{"UPDATE":"id"}]}//has two paths now...
	elseif ($_SERVER["REQUEST_METHOD"] === 'PUT' and isset($js->hyper[0]->UPDATE)) {
		//dragging linkOrder update
		if (is_numeric($js->hyper[0]->UPDATE) and isset($js->hyper[0]->dragged)) {
			if (is_numeric($js->hyper[0]->dragged) and is_numeric($js->hyper[0]->dropped) and true) {//presume XSS-checking is going on for now...
				//the dragged item is being placed at a position more than itself
				$data = array($js->hyper[0]->dragged, $js->hyper[0]->dropped);
				if ($js->hyper[0]->dragged < $js->hyper[0]->dropped)
					$sql = 'UPDATE `Hyperlink` ' .
						   'SET linkOrder = linkOrder - 1 ' .
						   'WHERE linkOrder > ? AND linkOrder < ? AND deleteFlag=0';
				//the dragged item is being placed at a position less than itself
				else
					$sql = 'UPDATE `Hyperlink` ' .
						   'SET linkOrder = linkOrder + 1 ' .
						   'WHERE linkOrder < ? AND linkOrder >= ? AND deleteFlag=0';
				//moves items around to compensate for the shift
				$STH = $dbh->prepare($sql);
				$STH->execute($data);
				//update the dragged hyperlink with the new value
				if ($js->hyper[0]->dragged < $js->hyper[0]->dropped)
					$data = array($js->hyper[0]->dropped - 1, $js->hyper[0]->UPDATE);
				else
					$data = array($js->hyper[0]->dropped, $js->hyper[0]->UPDATE);
				$STH = $dbh->prepare('UPDATE `Hyperlink` ' .
									 'SET linkOrder = ? ' .
									 'WHERE id = ?');
				$STH->execute($data);
				exit();
			}
		}
		//modal update of name and address
		elseif (isset($js->hyper[0]->name) AND isset($js->hyper[0]->address) AND isset($js->hyper[0]->modified)) {
			if (true) {//presume XSS-checking is going on for now...
				$data = array($js->hyper[0]->name, $js->hyper[0]->address, $js->hyper[0]->UPDATE);
				$STH = $dbh->prepare('UPDATE `Hyperlink` ' .
									 'SET name = ?, address = ? ' .
									 'WHERE id = ?');
				$STH->execute($data);
				if ($js->hyper[0]->modified)
					call_p2i($js->hyper[0]->address, $js->hyper[0]->UPDATE);//will know if this passes by having a modified data changed for the image on the server
				exit();
			}
		}
		//update of only the screencap
		elseif (is_numeric($js->hyper[0]->UPDATE) AND isset($js->hyper[0]->address)) {
			call_p2i($js->hyper[0]->address, $js->hyper[0]->UPDATE);//will know if this passes by having the image on the server
			//when request returns, rewrite the `image` field so that a proper preview can happen
			//db update should be unnecessary, but doing it anyway
			$data = array($js->hyper[0]->UPDATE, $js->hyper[0]->UPDATE);
			$STH = $dbh->prepare('UPDATE `Hyperlink` ' .
								 'SET image = ? ' .
								 'WHERE id = ?');
			$STH->execute($data);
			exit();
		}
	}
	//DELETE DELETE //{"hyper":[{"DELETE":"id"}]}
	elseif ($_SERVER["REQUEST_METHOD"] === 'DELETE' and isset($js->hyper[0]->DELETE)) {
		if (is_numeric($js->hyper[0]->DELETE)) {
			//move all with linkOrder > than the selected's linkOrder back
			$STH = $dbh->prepare('UPDATE Hyperlink ' . 
								 'SET linkOrder = linkOrder - 1 ' .
								 'WHERE deleteFlag=0 AND linkOrder > (' .
								 'SELECT * from (' .
								 'SELECT linkOrder ' .
								 'FROM Hyperlink ' .
								 'WHERE id = ?) ' .
								 'as t)');
			$STH->execute(array($js->hyper[0]->DELETE));
			//now delete
			$STH = $dbh->prepare('UPDATE `Hyperlink` ' . 
								 'SET deleteFlag=? ' . 
								 'WHERE id=?');
			$STH->execute(array(1, $js->hyper[0]->DELETE));
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