<?php
/*page2images's REST API for requesting a screencap of a URL modified to save 
  the file in the /scaps directory on the root directory of the server
*/
include 'pwds.php';

//Please input your restful API key here.
$apikey = $p2i_apikey;
$api_url = "http://api.page2images.com/restfullink";

function call_p2i($url, $id)
{
    global $apikey, $api_url;
    // URL can be those formats: http://www.google.com https://google.com google.com and www.google.com
    // But free rate plan does not support SSL link.
    //$url = "http://www.google.com";
    $device = 6; // 0 - iPhone4, 1 - iPhone5, 2 - Android, 3 - WinPhone, 4 - iPad, 5 - Android Pad, 6 - Desktop
	$img_format = 'jpg';
	$cap_size = '150x150';
	$cap_screen = '1024x768';
    $loop_flag = TRUE;
    $timeout = 120; // timeout after 120 seconds
    set_time_limit($timeout+10);
    $start_time = time();
    $timeout_flag = false;

    while ($loop_flag) {
        // We need call the API until we get the screenshot or error message
        try {
            $para = array(
                "p2i_url" => $url,
                "p2i_key" => $apikey,
                "p2i_device" => $device,
				"p2i_imageformat" => $img_format, 
				"p2i_size" => $cap_size,
				"p2i_screen" => $cap_screen
            );
            // connect page2images server
            $response = connect($api_url, $para);

            if (empty($response)) {
                $loop_flag = FALSE;
                // something error
                echo "something error";
                break;
            } else {
                $json_data = json_decode($response);
                if (empty($json_data->status)) {
                    $loop_flag = FALSE;
                    // api error
                    break;
                }
            }
            switch ($json_data->status) {
                case "error":
                    // do something to handle error
                    $loop_flag = FALSE;
                    echo $json_data->errno . " " . $json_data->msg;
                    break;
                case "finished":
                    // do something with finished. For example, show this image
                    //echo "<img src='$json_data->image_url'>";
                    // Or you can download the image from our server
					$remote_shot = file_get_contents($json_data->image_url);//urlencode
					//write to the root directory's /scaps directory
					$location = $_SERVER['DOCUMENT_ROOT'] . '/scaps/' . $id . '.' . $img_format;
					file_put_contents($location, $remote_shot);
                    $loop_flag = FALSE;
					usleep(1000000);//one second wait
                    break;
                case "processing":
                default:
                    if ((time() - $start_time) > $timeout) {
                        $loop_flag = false;
                        $timeout_flag = true; // set the timeout flag. You can handle it later.
                    } else {
                        sleep(3); // This only work on windows.
                    }
                    break;
            }
        } catch (Exception $e) {
            // Do whatever you think is right to handle the exception.
            $loop_flag = FALSE;
            echo 'Caught exception: ', $e->getMessage(), "\n";
        }
    }

    if ($timeout_flag) {
        // handle the timeout event here
        echo "Error: Timeout after $timeout seconds.";
    }
}
// curl to connect server
function connect($url, $para)
{
    if (empty($para)) {
        return false;
    }
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($para));
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $data = curl_exec($ch);
    curl_close($ch);
    return $data;
}
