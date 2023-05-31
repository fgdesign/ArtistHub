<section class="profile entry-content ah-profile__top">
    <? if($user_may_edit) :?>
        <a href="<?=$edit_link?>">Edit <?=$pronoun?> Profile</a>
    <? endif; ?>
    <section class="ah-profile__artist-header">
        <div class="randompage">
            <a href="<?=$other_artist_url?>">See another artist page.</a>
        </div>
        <header class="entry-header">
            <h1 class="entry-title" sdfsclass="ah-profile__artist-name" >
                <?=$info['ah_artist_name']?>
                <? if($info['ah_artist_discipline']): ?>
                    &mdash; <?=$info['ah_artist_discipline']?>
                <? endif; ?>
            </h1>
        </header>
        <section class="ah-profile__blurb">
            <? if($headshot) :?>
            <div class="ah-profile__headshot" style="background-image: url(<?=$headshot?>);"></div>
            <? endif; ?>
            <section>
                <p class="ah-profile__artist-description" ><?=$info['ah_artist_description']?></p>
            </section>
        </section>
    </section>
    <section class="ah-mobile__container">
        <div class="ah-mobile-gallery__container">
            <?=$images?>
        </div>
    </section>
    <section class="ah-desktop__container">
        <div class="ah-desktop-gallery__container">
            <?=$desktop_images?>
        </div>
    </section>
    <section>
        <? if(count($info['ah_artist_links']) > 0): ?>
            <h4 class="ah-heading">Links</h4>
            <? foreach($info['ah_artist_links'] as $link) : ?>
                <div><a href="<?= $link->url ?>"><?= $link->text ?></a></div>
            <? endforeach; ?>
        <? endif; ?>
    </section>
    <section>
        <? if($pdfs != ""): ?>
            <h4 class="ah-heading">PDFs</h4>
            <?= $pdfs?>
        <? endif; ?>
    </section>
    <section>
        <h4 class="ah-heading" >Contact</h4>
        <p><?=$info['ah_artist_contact']?></p>
    </section>
</section>
