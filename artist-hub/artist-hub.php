<?php
/**
 * Plugin Name: Artist Hub
 * Plugin URI:
 * Description:
 * Author:      KGZM
 * Author URI:  http://github.com/kgzm/
 * Version:     1.1.0
 */
// Exit if accessed directly
if (!defined('ABSPATH'))
    exit;

require('artist-page.php');

function artist_hub_load_scripts() {
    global $wp_query;
    if(property_exists($wp_query->post, 'artist')) {
        wp_enqueue_script('fancybox-js', plugin_dir_url(__FILE__) . 'jquery.fancybox.min.js', ['jquery']);
        wp_enqueue_style('fancybox-css', plugin_dir_url(__FILE__) . 'jquery.fancybox.min.css');
        wp_enqueue_script('slick-js', plugin_dir_url(__FILE__) . 'vendor/slick-js/slick.min.js', ['jquery'], null, true);
        wp_enqueue_style('slick-css', plugin_dir_url(__FILE__) . 'vendor/slick-css/slick.css');
        wp_enqueue_style('slick-theme', plugin_dir_url(__FILE__) . 'vendor/slick-theme/slick-theme.css');
        wp_enqueue_style('westbeth-fonts', plugin_dir_url(__FILE__) . 'vendor/westbeth-fonts/fonts.css', [], null);
        wp_enqueue_style('ah-gallery-css', plugin_dir_url(__FILE__) . 'gallery.css');
        wp_enqueue_script('ah-gallery-front-end-js', plugin_dir_url(__FILE__) . 'js/gallery-front-end.js', ['jquery'], null, true);
        if(is_user_logged_in() && property_exists($wp_query->post, 'mode') && $wp_query->post->mode == 'edit') {
            wp_enqueue_script('ah-gallery-js', plugin_dir_url(__FILE__) . 'js/gallery.js', ['vuejs', 'axios', 'lodash', 'vue-clip', 'vuedraggable'], null, true);
            wp_enqueue_style('bootstrap', plugin_dir_url(__FILE__) . 'bootstrap.min.css');
            wp_enqueue_script('vuejs', plugin_dir_url(__FILE__) . 'vendor/vuejs/vue.min.js', [], null, true);
            wp_enqueue_script('axios', plugin_dir_url(__FILE__) . 'vendor/axios/axios.min.js', [], null, true);
            wp_enqueue_script('lodash', plugin_dir_url(__FILE__) . 'vendor/lodash/lodash.min.js', [], null, true);
            wp_enqueue_script('vue-clip', plugin_dir_url(__FILE__) . 'vendor/vue-clip/vue-clip.min.js', ['vuejs'], null, true);
            wp_enqueue_script('sortable', plugin_dir_url(__FILE__) . 'vendor/sortable/Sortable.min.js', ['vuejs'], null, true);
            wp_enqueue_script('vuedraggable', plugin_dir_url(__FILE__) . 'vendor/vuedraggable/vuedraggable.min.js', ['vuejs','sortable'], null, true);
            $data = [
                'upload_url' => admin_url('async-upload.php'),
                'ajax_url'   => admin_url('admin-ajax.php'),
                'nonce'      => wp_create_nonce('media-form'),
                'artistId'   => $wp_query->post->post_author,
                'userId'   =>   get_current_user_id(),
                'thumbnailProxy' => plugin_dir_url(__FILE__) . 'get-video-thumbnail.php'
            ];
            wp_localize_script('ah-gallery-js', 'ah_config', $data);
        }
    }
}

add_action('wp_enqueue_scripts', 'artist_hub_load_scripts');
function ah_allow_uploads () {
    $artist_role = get_role('subscriber');
    if (!$artist_role->has_cap('upload_files')) {
        $artist_role->add_cap('upload_files');
    }
}
add_action('admin_init', 'ah_allow_uploads');
add_action('wp_ajax_ah_interact', 'ah_ajax_entry_point');


function ah_ajax_entry_point() {
    $request         = json_decode(file_get_contents('php://input'), true, 512, JSON_OBJECT_AS_ARRAY);
    $current_user_id =  get_current_user_id();
    $artist_id = null;
    if(array_key_exists('artist_id', $request)) {
        $artist_id = $request['artist_id'];
    }
    $allowed = $artist_id == $current_user_id || current_user_can('administrator');
    $artist  = new AhArtist($artist_id);
    if($allowed && array_key_exists('action', $request) && $artist->has_action($request['action'])) {
        wp_send_json($artist->do_action($request['action'], $request));
    } else {
        wp_send_json([ 'error' => 'Invalid request.']);
    }
}

function ah_render_artist($artist) {
    $artist->render_profile();
}
function ah_get_current_artist() {
    return new AhArtist(get_current_user_id());
}

$artist_page = new AhArtistPage();
add_action( 'admin_bar_menu', 'remove_wp_logo', 999 );
function remove_wp_logo( $wp_admin_bar ) {
    if(!is_user_logged_in()) {
        return;
    }
    $artist = ah_get_current_artist();
    // id edit needs to be altered
    if(get_post() && get_post()->artist && get_post()->artist->user_may_edit()) {
        $pronoun = get_post()->artist->relationship_pronoun();
        $wp_admin_bar->remove_node('edit');
        if(get_post()->mode == 'view') {
            $wp_admin_bar->add_node([
                'id' => 'edit',
                'title' => "Edit $pronoun Artist Profile",
                'href' => get_post()->artist->edit_profile_url()
            ]);
        } else if(get_post()->mode == 'edit') {
            $wp_admin_bar->add_node([
                'id' => 'view',
                'title' => "View $pronoun Artist Profile",
                'href' => get_post()->artist->profile_url()
            ]);
        }
    }
    if(!current_user_can('administrator')) {
        $wp_admin_bar->remove_node( 'wp-logo' );
        $wp_admin_bar->remove_node( 'dashboard' );
        $wp_admin_bar->remove_node( 'site-name' );
        $wp_admin_bar->remove_node( 'new-content' );
        $wp_admin_bar->remove_node( 'edit-profile' );
        $wp_admin_bar->remove_node( 'user-info' );
        $wp_admin_bar->remove_node( 'search' );
    }
    $user_actions = $wp_admin_bar->get_node('user-actions');
    $wp_admin_bar->add_node([
        'id' => 'view-artist-profile',
        'parent' => $user_actions->id,
        'title' => 'View My Artist Profile',
        'href' => $artist->profile_url()

    ]);
    $wp_admin_bar->add_node([
        'id' => 'edit-artist-profile',
        'parent' => $user_actions->id,
        'title' => 'Edit My Artist Profile',
        'href' => $artist->edit_profile_url()
    ]);
}
function ah_suppress_admin_bar() {
    $user = wp_get_current_user();
    $roles = (array) $user->roles;
    if(in_array('subscriber', $roles)) {
        return false;
    } else {
        return true;
    }
}
// add_filter('show_admin_bar', 'ah_suppress_admin_bar');

add_action('pre_get_posts','ml_restrict_media_library');

function ml_restrict_media_library( $wp_query_obj ) {
    global $current_user, $pagenow;
    if( !is_a( $current_user, 'WP_User') )
        return;
    if( 'admin-ajax.php' != $pagenow || $_REQUEST['action'] != 'query-attachments' )
        return;
    if( !current_user_can('administrator') )
        $wp_query_obj->set('author', $current_user->ID );
    return;
}
// function mytheme_admin_bar_render() {
// 	global $wp_admin_bar;
// 	$wp_admin_bar->remove_menu('comments');
// 	$wp_admin_bar->remove_menu('comments');
// }
// add_action( 'wp_before_admin_bar_render', 'mytheme_admin_bar_render' );
function ah_login_redirect( $redirect_to, $request, $user ) {

    if( $user && is_object( $user ) && is_a( $user, 'WP_User' ) ) {

        $artist_slug = get_user_meta( $user->ID, 'artist_slug', true );
        
        if (in_array( 'administrator', $user->roles ) || !$artist_slug ) {
            // redirect them to the default place
            return $redirect_to;
        } else {
            return get_site_url() . "/artist-page/" . $artist_slug;;
        }

    }
    return $redirect_to;

}
add_filter( 'login_redirect', 'ah_login_redirect', 10, 3 );

function ah_metadata_filter($metadata, $attachment_id) {
    $fileinfo = [];
    $attached_file = get_attached_file($attachment_id);
    $is_artist_media_file = preg_match(
        '/^0934-artist-(?<artist_id>[^-]+)-(?<kind>headshot|media)-(?<filename>.+)/',
        basename(array_key_exists('file', $metadata) ? $metadata['file'] : $attached_file), 
        $fileinfo
    );
    $id =  get_current_user_id();
    if($is_artist_media_file) {
        if($fileinfo['artist_id'] != $id && !current_user_can('administrator')) {
            // Need to bail out here.
            return $metadata;
        }
        $artist  = new AhArtist($fileinfo['artist_id']);
        if($fileinfo['kind'] == 'headshot') {
            $args = [
                'author' => $artist->id,
                'post_type'   => 'attachment',
                'meta_query' => [[
                        'key' => 'ah_headshot',
                        'value' => 1
                    ]],
                'post_status' => 'inherit',
                'post_mime_type' => 'image',
                'posts_per_page' => -1
            ];
            $query = new WP_Query( $args );
            // Clean up old headshot
            while($query->have_posts()) {
                $query->the_post();
                wp_delete_post($query->post->ID);
            }
            wp_reset_postdata();
            wp_update_post(['ID' => $attachment_id, 'post_author' => $artist->id]);
            add_post_meta($attachment_id, "ah_headshot", true, true);
        } elseif($fileinfo['kind'] == 'media') {
            wp_update_post(['ID' => $attachment_id, 'post_author' => $artist->id]);
            update_post_meta($attachment_id, 'order', 0);
        }
        if(!array_key_exists('file', $metadata)) {
            $metadata['file'] = str_replace(wp_upload_dir()['basedir'] . '/', '', $attached_file);
            $clean_metadata = ah_sanitize_attachment_metadata($metadata, $artist);
            update_attached_file($attachment_id, $clean_metadata['file']);
        } else {
            $clean_metadata = ah_sanitize_attachment_metadata($metadata, $artist);
            update_attached_file($attachment_id, $clean_metadata['file']);
        }
        return $clean_metadata;
    }
    return $metadata;
}
add_filter('wp_generate_attachment_metadata', 'ah_metadata_filter',10, 3);

function ah_sanitize_filename($file, $artist) {
    $path = pathinfo($file);
    $clean_name = preg_replace('/^0934-artist-(?<artist_id>[^-]+)-(?<kind>headshot|media)-(?<filename>.+)/', '$3', $path['basename']);
    $newpath =  $path['dirname'] . '/'. $clean_name;
    rename($file, $newpath);
    return $clean_name;
}

function ah_sanitize_attachment_metadata($metadata, $artist) {
    $path = pathinfo($metadata['file']);
    $dest = wp_upload_dir()['basedir'] . '/' . $path['dirname'] . '/';
    $clean_name = ah_sanitize_filename($dest . $path['basename'], $artist);
    $metadata['file'] = $path['dirname'] . '/'. $clean_name;
    if(array_key_exists('sizes', $metadata)) {
        foreach($metadata['sizes'] as &$size) {
            $size['file'] = ah_sanitize_filename($dest . $size['file'], $artist);
        }
    }
    return $metadata;
}

function ah_add_profile_column ($columns) {
    $columns['ah_artist_profile'] = 'Artist Profile';
    return $columns;
}
add_filter('manage_users_columns', 'ah_add_profile_column');

function ah_add_profile_row($val, $column_name, $user_id) {

    $artist_slug = get_user_meta( $user_id, 'artist_slug', true );

    if($column_name == 'ah_artist_profile' && $artist_slug) {
        $username = get_userdata($user_id)->user_login;
        $artist = new AhArtist($user_id);
        $view = $artist->profile_url();
        $edit = $artist->edit_profile_url();
        return "<a href='$view'>View Profile</a> | <a href='$edit'>Edit Profile</a>";
    } else {
        return $val;
    }
}
add_filter('manage_users_custom_column', 'ah_add_profile_row', 10, 3);


add_action( 'show_user_profile', 'extra_user_profile_fields' );
add_action( 'edit_user_profile', 'extra_user_profile_fields' );

function extra_user_profile_fields( $user ) { ?>
    <h3><?php _e("Extra profile information", "blank"); ?></h3>

    <table class="form-table">
        <tr>
            <th><label for="artist_slug"><?php _e("Artist Slug"); ?></label></th>
            <td>
                <input type="text" name="artist_slug" id="artist_slug" value="<?php echo esc_attr( get_the_author_meta( 'artist_slug', $user->ID ) ); ?>" class="regular-text" /><br />
                <span class="description"><?php _e("Please enter your unique artist slug."); ?></span>
            </td>
        </tr>
    </table>
<?php }

add_action( 'personal_options_update', 'save_extra_user_profile_fields' );
add_action( 'edit_user_profile_update', 'save_extra_user_profile_fields' );

function save_extra_user_profile_fields( $user_id ) {
    if ( !current_user_can( 'edit_user', $user_id ) ) { 
        return false; 
    }
    update_user_meta( $user_id, 'artist_slug', $_POST['artist_slug'] );
}


