(function($) {
  $(document).ready(function () {
    var youtubeRe = /video-youtube-(\w+)\.jpg/;
    var vimeoRe = /video-vimeo-(\w+)\.jpg/;
    $('[data-fancybox]').each(function () {
      var youtube = $(this).attr('href').match(youtubeRe);
      var vimeo = $(this).attr('href').match(vimeoRe);
      if(youtube) {
        $(this).attr('href', `https://www.youtube.com/watch?v=${youtube[1]}`);
      } else if(vimeo) {
        $(this).attr('href', `https://vimeo.com/${vimeo[1]}`);
      }
    });
    $('[data-fancybox]').fancybox({
        beforeShow: function (current, previous) {
        // console.log(current);
        $('.ah-mobile-gallery__container').slick('slickGoTo', current.currPos, true);
      }
    });
    $('.ah-mobile-gallery__container').slick({
      infinite: false
    });
  });
})(jQuery);
