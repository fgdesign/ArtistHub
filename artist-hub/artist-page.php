<?php
// Exit if accessed directly
if (!defined('ABSPATH'))
    exit;

require("artist.php");

class AhArtistPage {
    public $title = '';
    public $body = '';
    public $artist_name = '';
    public $url = '';
    public $rendered_posts = 0; // HAX
    public $mode = 'view';
    public $artist = '';

    function __construct() {
        add_action('parse_request', [&$this, 'ah_custom_url_handler']);
    }

    function ah_custom_url_handler() {
        $this->url = $_SERVER['REQUEST_URI'];
        $url_pattern = "/.*\/artist-page\/([^\/]+)(\/\w+)*/";
        $matches = [];
        $is_artist_url = preg_match($url_pattern, $this->url, $matches);
        if ($is_artist_url) {
            $this->artist_name = $matches[1];

            // sould we make sure slugs are unique?
            $args = array(
                'meta_key' => 'artist_slug',
                'meta_value' => $this->artist_name
            );
            $artist_slug = get_users($args);

            if ( count($artist_slug) > 0 ) {
                $user = $artist_slug[0];
            } else {
                return;
            }

            $this->user = $user->ID;
            $this->artist = new AhArtist($this->user);
            $this->body = "Welcome to $this->artist_name page!"; 
            if (array_key_exists(2, $matches) && $matches[2] == '/edit') {
                $this->mode = 'edit';
            }
            remove_action('template_redirect', 'redirect_canonical');
            remove_all_filters('redirect_canonical');
            add_filter('template_include', [&$this, 'ah_template_redirect']);
            add_action('the_posts', [&$this, 'ah_make_dummy_post']);
        }
    }

    function ah_make_dummy_post ($posts) {
        global $wp, $wp_query;
        if ($this->rendered_posts) return $posts;
        $this->rendered_posts = 1;
        //create a fake post intance
        $p = new stdClass;
        // fill $p with everything a page in the database would have
        $p->ID = -1;
        $p->post_author = $this->user;
        $p->post_date = current_time('mysql');
        $p->post_date_gmt =  current_time('mysql', $gmt = 1);
        $p->post_content = $this->body;
        $p->post_title = $this->title;
        $p->post_excerpt = '';
        $p->post_status = 'publish';
        $p->ping_status = 'closed';
        $p->post_password = '';
        $p->post_name = $this->url; // slug
        $p->to_ping = '';
        $p->pinged = '';
        $p->modified = $p->post_date;
        $p->modified_gmt = $p->post_date_gmt;
        $p->post_content_filtered = '';
        $p->post_parent = 0;
        $p->guid = get_home_url($this->url); // use url instead?
        $p->menu_order = 0;
        $p->post_type = 'page';
        $p->post_mime_type = '';
        $p->comment_status = 'closed';
        $p->comment_count = 0;
        $p->filter = 'raw';
        $p->ancestors = array(); // 3.6
        $p->mode = $this->mode;
        $p->artist = $this->artist;

        // reset wp_query properties to simulate a found page
        $wp_query->is_page = TRUE;
        $wp_query->is_singular = TRUE;
        $wp_query->is_home = FALSE;
        $wp_query->is_archive = FALSE;
        $wp_query->is_category = FALSE;
        unset($wp_query->query['error']);
        $wp->query = array();
        $wp_query->query_vars['error'] = '';
        $wp_query->is_404 = FALSE;

        $wp_query->current_post = $p->ID;
        $wp_query->found_posts = 1;
        $wp_query->post_count = 1;
        $wp_query->comment_count = 0;
        // -1 for current_comment displays comment if not logged in!
        $wp_query->current_comment = null;
        $wp_query->is_singular = 1;

        $wp_query->post = $p;
        $wp_query->posts = array($p);
        $wp_query->queried_object = $p;
        $wp_query->queried_object_id = $p->ID;
        $wp_query->current_post = $p->ID;
        $wp_query->post_count = 1;

        return array($p);
    }
    function ah_template_redirect($template) {
        return plugin_dir_path(__FILE__) . "tpl/page-artist.php";
    }
}
