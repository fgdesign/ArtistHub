<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$service = isset($_GET['service']) ? $_GET['service'] : null;
$videoid = isset($_GET['videoid']) ? $_GET['videoid'] : null;
$thumbnailUrl = null;

if(!$videoid) {
    http_response_code(400); echo "400 No video id specified"; die;
}

if($service == "youtube") {
    $thumbnailUrl =  "https://img.youtube.com/vi/${videoid}/0.jpg";
} elseif($service == "vimeo" ) {
    $data = file_get_contents("https://vimeo.com/api/v2/video/${videoid}.json");
    $json = json_decode($data);
    $thumbnailUrl = $json[0]->thumbnail_medium;
} else {
    http_response_code(400); echo "400 No service specified."; die;
}

$thumbnail = file_get_contents($thumbnailUrl);

$pattern = "/^content-type\s*:\s*(.*)$/i";

if(($header = array_values(preg_grep($pattern, $http_response_header))) &&
    (preg_match($pattern, $header[0], $match) !== false)) {
    $content_type = $match[1];
}
header("Content-Type: $content_type");
header("Content-Length:" . strlen($thumbnail));
echo $thumbnail;
