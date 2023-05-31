<?php
// Exit if accessed directly
if (!defined('ABSPATH'))
    exit;

class AhArtist {
    public $id = null;
    public $profile_fields = [
        'ah_artist_name',
        'ah_artist_discipline',
        'ah_artist_description',
        'ah_artist_statement',
        'ah_artist_phone',
        'ah_artist_email',
        'ah_artist_contact',
        'ah_artist_links',
        'ah_artist_headshot_url'
    ];
    public $user = null;
    public $username = "";

    function __construct($id) {
        $this->id = $id;
        $this->user = get_userdata($id);
        $this->username = $this->user->user_login;
        $this->artist_slug = get_user_meta($this->id, 'artist_slug', true);
    }

    function is_viewing_own_profile() {
        return get_the_author_meta('ID') == get_current_user_id() && get_current_user_id() == $this->id;
    }


    function display_images() {
        //Gallery generation.
        $args = [
            'author' => $this->id,
            'post_type'   => 'attachment',
            'post_status' => 'inherit',
            'post_mime_type' => 'image',
            'meta_key' => 'order',
            'orderby' => 'meta_value_num',
            'order' => 'ASC',
            'meta_query' => [[
                'key' => 'ah_headshot',
                'compare' => 'NOT EXISTS',
                'value' => 1
            ]],
            'posts_per_page' => -1
        ];
        $query = new WP_Query( $args );
        $images = "";
        $count = 0;
        while($query->have_posts()) {
            $query->the_post();
            $caption_text = nl2br(htmlentities($query->post->post_excerpt, ENT_QUOTES));
            $caption = "<div class='ah-gallery__caption'>$caption_text</div>";
            $image_src_large = wp_get_attachment_image_src($query->post->ID, 'large')[0];
            $image_thumbnail = wp_get_attachment_image_src($query->post->ID, 'thumbnail')[0];
            $current_image = $count == 0 ? "ah-gallery__profile-image--current" : "";
            $image_link = "<a "
                        . "data-fancybox='gallery' "
                        . "data-caption='$caption_text' "
                        . "style='background-image: url($image_thumbnail)' "
                        . "class='ah-gallery__profile-image $current_image' href='$image_src_large'>"
                        . $caption
                        . "</a>";
            $images .= $image_link;
            $count += 1;
        }
        wp_reset_postdata();
        return $images;
    }

    function display_desktop_images() {
        //Gallery generation.
        $args = [
            'author' => $this->id,
            'post_type'   => 'attachment',
            'post_status' => 'inherit',
            'post_mime_type' => 'image',
            'meta_key' => 'order',
            'orderby' => 'meta_value_num',
            'order' => 'ASC',
            'meta_query' => [[
                'key' => 'ah_headshot',
                'compare' => 'NOT EXISTS',
                'value' => 1
            ]],
            'posts_per_page' => -1
        ];
        $query = new WP_Query( $args );
        $images = "";
        $count = 0;
        while($query->have_posts()) {
            $query->the_post();
            $caption_text = nl2br(htmlentities($query->post->post_excerpt, ENT_QUOTES));
            $caption = "<div class='ah-gallery__caption'>$caption_text</div>";
            $image_src_large = wp_get_attachment_image_src($query->post->ID, 'large')[0];
            $image_src_medium = wp_get_attachment_image_src($query->post->ID, 'medium')[0];
            $image_thumbnail = wp_get_attachment_image_src($query->post->ID, 'thumbnail')[0];
            $image_element = "<img src='$image_src_medium'>";
            $image_link = "<a "
                        . "data-fancybox='galleryDesktop' "
                        . "data-caption='$caption_text' "
                        . "href='$image_src_large'>"
                        . $image_element
                        . "</a>";

            $images .= "<div class='ah-gallery__profile-image'>$image_link$caption</div>";
        }
        wp_reset_postdata();
        return $images;
    }
    function display_pdfs() {
        //Gallery generation.
        $args = [
            'author' => $this->id,
            'post_type'   => 'attachment',
            'post_status' => 'inherit',
            'post_mime_type' => 'application/pdf',
            'posts_per_page' => -1
        ];
        $query = new WP_Query( $args );
        $images = "";
        $count = 0;
        while($query->have_posts()) {
            $query->the_post();
            $caption_text = nl2br(htmlentities($query->post->post_excerpt, ENT_QUOTES));
            if($caption_text ==  "") {
                $caption_text = basename(get_attached_file($query->post->ID));
            }
            $src = wp_get_attachment_url(get_the_ID());
            $image_link = "<a href='$src'>$caption_text</a>";

            $images .= "<div>$image_link</div>";
        }
        wp_reset_postdata();
        return $images;
    }
    function ajax_get_images($request) {
        $args = [
            'author' => $this->id,
            'post_type'   => 'attachment',
            'post_status' => 'inherit',
            'post_mime_type' => ['image', 'application/pdf'],
            'posts_per_page' => -1,
            'meta_query' => [[
                'key' => 'ah_headshot',
                'compare' => 'NOT EXISTS',
                'value' => 1
            ]],
        ];
        $query = new WP_Query( $args );
        $images = [];
        while($query->have_posts()) {
            $query->the_post();
            $images[] = $this->get_image_info($query->post);
        }
        wp_reset_postdata();
        return $images;
    }

    function get_image_info( $attachment_id ) {
        $attachment = get_post( $attachment_id );
        return array(
            'id' => $attachment->ID,
            'alt' => get_post_meta( $attachment->ID, '_wp_attachment_image_alt', true ),
            'caption' => $attachment->post_excerpt,
            'description' => $attachment->post_content,
            'href' => get_permalink( $attachment->ID ),
            'src' => $attachment->guid,
            'title' => $attachment->post_title,
            'thumbnail' => wp_get_attachment_image_src($attachment->ID, 'thumbnail'),
            'order' => intval(get_post_meta($attachment->ID, 'order', true)),
            'type' => $attachment->post_mime_type,
            'filename' => basename(get_attached_file($attachment->ID))
        );
    }

    function ajax_set_images($request) {
        foreach($request['images'] as $image) {
            //If deleted, smoke it!
            if($image['deleted'] === true) {
                wp_delete_post($image['id']);
            } else {
                wp_update_post([
                    'ID' => $image['id'],
                    'post_excerpt' => $image['caption']
                ]);
            }
            update_post_meta($image['id'], 'order', $image['order']);
        }
        return $this->ajax_get_images($request);
    }

    function profile() {
        return $this->get_meta_values();
    }

    function user_may_edit() {
        $user_is_owner = $this->is_viewing_own_profile();
        $user_is_admin = current_user_can('administrator');
        $user_may_edit = $user_is_owner || $user_is_admin;
        return $user_may_edit;
    }
    function relationship_pronoun() {
        $user_is_owner = $this->is_viewing_own_profile();
        $pronoun = $user_is_owner ? "Your" : "This";
        return $pronoun;
    }
    function render_profile() {
        $info = [];
        foreach($this->profile() as $key => $value) {
            $info[$key] = str_replace("\n", "<br>", $value);
        }
        $images = $this->display_images();
        $desktop_images = $this->display_desktop_images();
        $pdfs = $this->display_pdfs();
        $mode = get_post()->mode;
        $artist = $this;
        $headshot = $this->get_headshot_url();
        $user_is_owner = $this->is_viewing_own_profile();
        $user_is_admin = current_user_can('administrator');
        $user_may_edit = $user_is_owner || $user_is_admin;
        $pronoun = $user_is_owner ? "Your" : "This";
        $view_link = $this->profile_url();
        $edit_link = $this->edit_profile_url();
        $other_artist_url = $this->other_artist_url();
        if($mode == 'edit') {
            include 'tpl/edit.tpl.php';
        } else {
            include 'tpl/profile.tpl.php';
        }
    }
    function other_artist_url() {
        global $wpdb;
        $sql = "SELECT meta_value AS artist_slug FROM wp_usermeta WHERE user_id != {$this->id} AND meta_key = 'artist_slug' AND meta_value <> '' ORDER BY RAND() LIMIT 1";
        $result = $wpdb->get_results($sql);
        if($result) {
            return get_site_url() . "/artist-page/" . $result[0]->artist_slug;
        }
    }
    function get_headshot_url() {
        $args = [
            'author' => $this->id,
            'post_type'   => 'attachment',
            'post_status' => 'inherit',
            'meta_key' => 'ah_headshot',
            'meta_value' => true,
            'post_mime_type' => 'image',
            'posts_per_page' => -1
        ];
        $url = null;
        $query = new WP_Query( $args );
        while($query->have_posts()) {
            $query->the_post();
            $url = wp_get_attachment_image_src($query->post->ID, 'thumbnail')[0];
            break;
        }
        wp_reset_postdata();
        return $url;

    }
    function maybe_edit_link() {
        if($this->is_viewing_own_profile() && get_post()->mode == 'view') {
            return "<a href='" . get_post()->post_name . "edit'>Edit Your Profile</a>";
        } else {
            return "";
        }
    }

    function get_meta ($key) {
        return get_user_meta($this->id, $key, true);
    }

    function set_meta ($key, $value) {
        return update_user_meta($this->id, $key, $value);
    }

    function get_meta_values() {
        $values = [];
        foreach($this->profile_fields as $key) {
            $value = $this->get_meta($key);
            if($key == "ah_artist_headshot_url") {
                $values[$key] = $this->get_headshot_url();
            } else if($key != "ah_artist_links") {
                $values[$key] = $value;
            } else {
                if($value == "") {
                    $values[$key] = [];
                } else {
                    $values[$key] = json_decode($value);
                }
            }
        }
        return $values;
    }

    function set_meta_values($values) {
        foreach($this->profile_fields as $key) {
            $value = $values[$key];
            if($key != "ah_artist_links") {
                $this->set_meta($key, $value);
            } else {
                $this->set_meta($key, json_encode($value));
            }
        }
        return $values;
    }

    function ajax_update_profile($request) {
        // $req = json_decode(file_get_contents('php://input'));
        // $id =  get_current_user_id();
        // if($req['id'] == $id) {
            // $profile = array_intersect_key($a, array_flip(['artist_name', 'artist_description']));
            return $this->set_meta_values($request['profile']);
        // } else {

            //Otherwise tell me to go fuck myself.
        // }
    }

    function has_action($action) {
        return method_exists($this, 'ajax_' . $action);
    }

    function do_action($action, $request) {
        $action = "ajax_" . $action;
        return $this->$action($request);
    }

    function ajax_get_profile($request) {
        return $this->get_meta_values();
        // return $this->profile();
    }
    function profile_url() {
        return get_site_url() . "/artist-page/" . $this->artist_slug;
    }
    function edit_profile_url() {
        return get_site_url() . "/artist-page/" . $this->artist_slug . "/edit";
    }
}
