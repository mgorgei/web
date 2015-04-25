<?php
/*RECAPTCHA

Site key
Use this in the HTML code your site serves to users.

Secret key
Use this for communication between your site and Google. Be sure to keep it a secret.
*/

$p2i_apikey = '';
$stw_apikey = '';
$stw_secret = '';

$dsn = 'mysql:host=localhost;dbname=';
$username = '';
$password = '';
$options = array(
    PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
);
?>