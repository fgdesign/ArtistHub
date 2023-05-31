<div class="bootstrap">
    <a href="<?=$view_link?>">View <?=$pronoun?> Profile</a>
    <? if($user_may_edit) : ?>
    <div id="edit-profile"></div>
    <? elseif(!is_user_logged_in()): ?>
    <h1> Please login to edit this profile</h1>
    <a class="btn btn-primary" href="<?=wp_login_url();?>" title="Login">Login</a>
    <? else: ?>
    <div class="alert alert-danger" role="alert">
        <strong>Access Denied.</strong> You don't have permission to edit this page.
    </div>
    <? endif; ?>
</div>
