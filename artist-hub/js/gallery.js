var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

if (!HTMLCanvasElement.prototype.toBlob && HTMLCanvasElement.prototype.msToBlob) {
  HTMLCanvasElement.prototype.toBlob = HTMLCanvasElement.prototype.msToBlob;
}

var api = function api(action, parameters) {
  return axios.post(window.ah_config.ajax_url + '?action=ah_interact', _extends({ action: action, artist_id: window.ah_config.artistId }, parameters)).then(function (r) {
    // console.log(`Api response to ${action}: ${JSON.stringify(parameters)}: ${JSON.stringify(r)}`);
    return r;
  }).then(function (r) {
    return r.data;
  });
};

var _ = window.lodash || window._;

Vue.component('modal', {
  props: { 'isNotice': Boolean },
  template: '\n    <transition name="modal">\n      <div class="modal-mask">\n        <div class="modal-wrapper">\n          <div class="modal-container">\n\n            <div class="modal-header">\n              <slot name="header">\n                default header\n              </slot>\n            </div>\n\n            <div class="modal-body">\n              <slot name="body">\n                default body\n              </slot>\n            </div>\n\n            <div class="modal-footer">\n              <slot name="footer">\n                <button v-if="!isNotice" class="btn btn-primary" @click.prevent="$emit(\'confirm\')">\n                  Confirm\n                </button>\n                <button v-if="!isNotice" class="btn btn-secondary" @click.prevent="$emit(\'cancel\')">\n                  Cancel\n                </button>\n                <button v-if="isNotice" class="btn btn-secondary" @click.prevent="$emit(\'close\')">\n                  Close\n                </button>\n              </slot>\n            </div>\n\n          </div>\n        </div>\n      </div>\n    </transition>\n  '
});

Vue.component('ah-file-uploader', {
  template: '\n    <div>\n    <h2 class="mt-4">Upload Images</h2>\n    <vue-clip class="ah-uploader" :options="options" :on-sending="sending" :on-complete="complete">\n        <template slot="clip-uploader-action">\n        <div class="ah-dropzone">\n            <div class="dz-message">\n                <h2 class="text-center">\n                    Click here or Drag and Drop images here to upload  <br>\n                    You may upload image or PDF files.\n                </h2>\n            </div>\n        </div>\n        </template>\n\n        <template slot="clip-uploader-body" slot-scope="props">\n        <div class="mt-2" v-for="file in props.files">\n            <img class="mt-1" v-bind:src="file.dataUrl" />\n            {{ file.name }} {{ file.status }}\n        </div>\n        </template>\n    </vue-clip>\n    <modal v-if="showModal" :isNotice="true" @close="showModal = false">\n      <h3 slot="header">\n        <span v-if="!uploadError">Upload Successful!</span>\n        <span v-else>Upload Error</span>\n      </h3>\n      <p slot="body">\n        <span v-if="!uploadError">Image has been added.</span>\n        <span v-else>Oops. Something went wrong. Please try again.</span>\n      </p>\n    </modal>\n    <h2 class="mt-4">Upload Videos</h2>\n    <div class="input-group">\n        <input type="text"\n               class="form-control"\n               v-model="videoUrl"\n               spellcheck="false"\n               @input="submitVideo"\n               placeholder="Paste Youtube or Vimeo link here to add video."/>\n        <span class="input-group-btn">\n          <button class="btn btn-secondary" :disabled="!videoId || !videoHost  || !thumbnailLoaded || thumbnailError" @click="uploadVideo">Add Video</button>\n        </span>\n    </div>\n    <div v-show="videoThumbnail">\n      <p v-if="videoUrl && !videoId && !videoHost" class="mt-1 alert alert-warning">Malformed video URL, please verify the URL.</p>\n      <p v-if="videoId && videoHost && thumbnailLoaded && !thumbnailError" class="mt-1 alert alert-success">Found your video, click "add video" to add it to the gallery.</p>\n      <p v-if="videoId && videoHost && thumbnailError" class="mt-1 alert alert-danger">Could not load a thumbnail from <strong>{{videoHost}}</strong> for video id <strong>{{videoId}}</strong>! Please verify the video url and try again.</p>\n      <img class="ah-video-thumbnail" ref="thumbnail" :src="videoThumbnail" v-show="thumbnailLoaded">\n      <div class="ah-video-uploader__progress">{{ videoHint }}</div>\n    </div>\n    </div>\n  ',
  data: function data() {
    return {
      options: {
        paramName: 'async-upload',
        url: ah_config.upload_url,
        renameFilename: function renameFilename(filename) {
          return '0934-artist-' + ah_config.artistId + '-media-' + filename;
        }
      },
      videoHost: null,
      videoId: null,
      videoThumbnail: null,
      videoUrl: null,
      videoHint: null,
      showModal: false,
      uploadError: false,
      thumbnailLoaded: false,
      thumbnailError: false
    };
  },
  mounted: function mounted() {
    var _this = this;

    var videoThumbnail = this.$refs.thumbnail;
    videoThumbnail.onload = function () {
      _this.thumbnailLoaded = true;
      _this.thumbnailError = false;
    };
    videoThumbnail.onerror = function () {
      _this.thumbnailLoaded = false;
      _this.thumbnailError = true;
    };
  },

  methods: {
    complete: function complete(file, status, xhr) {
      if (status !== 'success') {
        this.uploadError = true;
      } else {
        this.uploadError = false;
      }
      window.ahRefreshImages();
      this.showModal = true;
    },
    sending: function sending(file, xhr, formData) {
      this.applyFormData(file, formData);
    },
    applyFormData: function applyFormData(file, formData) {
      formData.append('action', 'upload-attachment');
      formData.append('_wpnonce', ah_config.nonce);
      formData.append('name', file.name);
      return formData;
    },

    submitVideo: _.debounce(function () {
      var isYoutube = /(youtu\.be|youtube)/,
          isVimeo = /vimeo/,
          vimeoId = /\d+/,
          url = this.videoUrl,
          matchedId = null;

      var youtubeId = function youtubeId(url) {
        var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        return match[2];
      };

      this.videoHost = null;
      this.videoId = null;
      this.videoThumbnail = null;

      if (url.match(isYoutube)) {
        this.videoHost = 'youtube';
        matchedId = youtubeId(url);
      } else if (url.match(isVimeo)) {
        this.videoHost = 'vimeo';
        matchedId = url.match(/\d+$/)[0];
      } else {
        //error out
      }
      this.videoId = matchedId;
      this.getThumbnail(this.videoHost, this.videoId);
    }, 500),
    getThumbnail: function getThumbnail(host, id) {
      this.videoThumbnail = window.ah_config.thumbnailProxy + '?service=' + host + '&videoid=' + id;
    },
    uploadVideo: function uploadVideo() {
      var _this2 = this;

      var canvas = document.createElement('canvas'),
          ctx = canvas.getContext('2d'),
          img = new Image(),
          formData = new FormData(),
          filename = '--video-' + this.videoHost + '-' + this.videoId + '.jpg';
      img.onerror = function () {
        console.log("Shit got fuckacious!");
      };
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(function (blob) {
          var name = '0934-artist-' + ah_config.artistId + '-media-' + filename;
          formData.append('action', 'upload-attachment');
          formData.append('_wpnonce', ah_config.nonce);
          formData.append('name', name);
          formData.append('async-upload', blob, name);
          axios.post(ah_config.upload_url, formData).then(function () {
            _this2.videoHost = null;
            _this2.videoId = null;
            _this2.videoThumbnail = null;
            _this2.videoUrl = null;
            _this2.videoHint = null;
            window.ahRefreshImages();
          });
        }, 'image/jpeg');
      };
      img.crossOrigin = 'Anonymous';
      img.src = this.videoThumbnail;
    }
  }
});

Vue.component('ah-info-editor', {
  data: function data() {
    return {
      artistId: ah_config.artistId,
      recordedProfile: {},
      profile: {},
      dirty: false,
      loaded: false,
      showModal: false
    };
  },
  methods: {
    summonData: function summonData() {
      api('get_profile').then(this.loadData.bind(this));
    },
    loadData: function loadData(data) {
      this.recordedProfile = _.cloneDeep(data);
      this.profile = _.cloneDeep(data);
      this.loaded = true;
    },
    submitData: function submitData() {
      matchUrl = /^((http|ftp)s?)?:\/{2}/;
      isComplete = function isComplete() {
        return function (_ref) {
          var text = _ref.text,
              url = _ref.url;
          return url != "" && text != "";
        };
      };
      normalizeUrl = function normalizeUrl(link) {
        var matches = link.url.match(matchUrl);
        if (matches) {
          var _matches = _slicedToArray(matches, 2),
              protocolString = _matches[0],
              protocol = _matches[1];

          if (!protocol) {
            link.url = "http" + link.url;
          }
        } else {
          link.url = "http://" + link.url;
        }
        return link;
      };
      this.profile.links = this.profile.ah_artist_links.filter(isComplete).map(normalizeUrl);
      api('update_profile', { profile: this.profile }).then(this.loadData.bind(this));
      this.showModal = false;
    },
    cancel: function cancel() {
      this.profile = _.cloneDeep(this.recordedProfile);
      this.showModal = false;
    },
    addLink: function addLink() {
      // console.log("Adding link.");
      this.profile.ah_artist_links.push({ text: "", url: "" });
    },
    removeLink: function removeLink(index) {
      this.profile.ah_artist_links.splice(index, 1);
    },
    refreshHeadshot: function refreshHeadshot() {
      var _this3 = this;

      api('get_profile').then(function (data) {
        // console.log("Refresh headshot: data.ah_artist_headshot_url");
        _this3.recordedProfile.ah_artist_headshot_url = _this3.profile.ah_artist_headshot_url = data.ah_artist_headshot_url;
      });
    }
  },
  mounted: function mounted() {
    this.summonData();
    window.edd = this.$data;
  },

  watch: {
    profile: {
      deep: true,
      handler: function handler(val) {
        // console.log("I'm here!", _.isEqual(this.profile, this.recordedProfile));
        this.dirty = this.loaded && !_.isEqual(this.profile, this.recordedProfile);
      }
    }
  },
  computed: {
    saveMode: function saveMode() {
      if (!this.dirty) {
        return {
          disabled: true,
          text: "Clean"
        };
      } else {
        return {
          disabled: false,
          text: "Save"
        };
      }
    }
  },
  template: '\n    <form class="artist-info-editor">\n      <div class="form-group">\n        <label class="artist-info-editor__field-label">Name</label>\n        <input type="text" class="form-control" v-model="profile.ah_artist_name">\n      </div>\n      <div class="form-group">\n        <label class="artist-info-editor__field-label">Discipline</label>\n        <input type="text" class="form-control" v-model="profile.ah_artist_discipline">\n      </div>\n      <div class="form-group">\n        <label class="artist-info-editor__field-label">Description</label>\n        <textarea v-model="profile.ah_artist_description" class="form-control"></textarea>\n      </div>\n      <div class="form-group">\n        <label class="artist-info-editor__field-label">Contact Information</label>\n        <textarea v-model="profile.ah_artist_contact" class="form-control"></textarea>\n      </div>\n      <div class="form-group">\n        <label class="artist-info-editor__field-label">Links</label>\n        <div class="input-group" v-for="(link, linkIndex) in profile.ah_artist_links">\n          <input type="text" v-model="link.text" placeholder="Link Text" class="form-control">\n          <input type="text" v-model="link.url" placeholder="Link URL"""class="form-control">\n          <div class="input-group-append">\n            <button class="btn btn-outline-secondary" @click="removeLink(linkIndex)" type="button">Remove</button>\n          </div>\n        </div>\n      </div>\n      <div class="form-group text-right"><button class="btn btn-primary" @click.prevent="addLink()">Add Link</button></div>\n      <ah-headshotter class="mb-4" :headshot-url="profile.ah_artist_headshot_url" @uploaded="refreshHeadshot()">\n      </ah-headshotter>\n      <div class="form-group">\n        <button class="btn btn-primary" :disabled="saveMode.disabled" @click.prevent="showModal = true">Save Information</button>\n        <modal v-if="showModal" @confirm="submitData" @cancel="showModal = false">\n          <h3 slot="header">Update Information</h3>\n          <p slot="body">Please confirm or cancel</p>\n        </modal>\n        <button class="btn btn-danger" v-if="!saveMode.disabled" @click="cancel">Reset</button>\n      </div>\n    </form>\n  '
});

Vue.component('ah-organize-gallery', {
  template: '\n    <div class="ah-organize-gallery">\n        <div class="ah-organize__controls mb-3">\n            <button class="btn btn-primary" @click="showModal = true;">Save Gallery</button>\n            <modal v-if="showModal" @confirm="pushImages" @cancel="showModal = false">\n              <h3 slot="header">Update Gallery</h3>\n              <p slot="body">Please confirm or cancel</p>\n            </modal>\n            <button class="btn btn-secondary" v-if="viewing != \'images\'" @click="viewing = \'images\'">View Images/Videos</button>\n            <button class="btn btn-secondary" v-if="viewing != \'pdfs\'" @click="viewing = \'pdfs\'">View PDFs</button>\n        </div>\n        <div v-if="files.length == 0" class="alert alert-secondary">\n            No {{viewing}}, why don\'t you upload some?\n        </div>\n        <table class="table" v-if="files.length > 0">\n            <thead>\n                <th>Order</th>\n                <th v-if="imageMode">Image</th>\n                <th v-if="imageMode">Caption</th>\n                <th v-if="pdfMode" class="text-left">File Name</th>\n                <th v-if="pdfMode" class="text-left">Link Text</th>\n                <th></th>\n            </thead>\n            <draggable v-model="images" element="tbody" :options="draggableOptions">\n                <tr v-for="(image, index) in files">\n                    <td class="ah-organize__order handle">{{index + 1}}</td>\n                    <td v-if="imageMode"class="ah-organize__thumbnail">\n                        <img :src="image.thumbnail[0]"\n                             :width="image.thumbnail[1] / 2"\n                             :height="image.thumbnail[2] / 2">\n                    </td>\n                    <td v-if="imageMode" class="ah-organize__caption">\n                        <textarea v-model="image.caption"></textarea>\n                    </td>\n                    <td v-if="pdfMode">\n                      <div class="input-group mb-3">\n                        <label class="align-middle input-group-text">{{image.filename}}</label>\n                      </div>\n                    </td>\n                    <td v-if="pdfMode">\n                      <div class="input-group mb-3">\n                        <input class="form-control" v-mode="image.caption" type="text" placeholder="Link Text">\n                      </div>\n                    </td>\n                    <td><button :class="{ \'btn\': true, \'btn-danger\': image.deleted, \'btn-secondary\': !image.deleted }" @click="toggleDeleteImage(image)">\n                      {{ image.deleted ? "Keep" : "Delete" }}\n                    </button></td>\n                <tr/>\n            </draggable>\n        </table>\n        <div class="ah-organize__controls mb-3">\n            <button class="btn btn-primary" @click="showModal = true">Save Gallery</button>\n            <modal v-if="showModal" @confirm="pushImages" @cancel="showModal = false">\n              <h3 slot="header">Update Gallery</h3>\n              <p slot="body">Please confirm or cancel</p>\n            </modal>\n            <button class="btn btn-secondary" v-if="viewing != \'images\'" @click="viewing = \'images\'">View Images/Videos</button>\n            <button class="btn btn-secondary" v-if="viewing != \'pdfs\'" @click="viewing = \'pdfs\'">View PDFs</button>\n        </div>\n    </div>\n  ',
  data: function data() {
    return {
      viewing: "images",
      images: [],
      fetchedImages: [],
      showModal: false,
      draggableOptions: {
        // handle: '.handle'
      }
    };
  },
  mounted: function mounted() {
    this.fetchImages();
    window.ahRefreshImages = this.fetchImages.bind(this);
  },

  computed: {
    imageMode: function imageMode() {
      return this.viewing == "images";
    },
    pdfMode: function pdfMode() {
      return this.viewing == "pdfs";
    },
    files: function files() {
      if (this.viewing == "images") {
        return this.images.filter(function (i) {
          return i.type != "application/pdf";
        });
      } else {
        return this.images.filter(function (i) {
          return i.type == "application/pdf";
        });
      }
    }
  },
  methods: {
    fetchImages: function fetchImages() {
      api('get_images').then(this.setImages.bind(this));
    },
    setImages: function setImages(images) {
      this.fetchedImages = _.chain(images).sortBy(_.property('order')).each(function (i) {
        i.deleted = false;
      }).value();
      // console.log("Fetched images", this.fetchedImages.map(i => [i.order, i.deleted]));
      this.images = _.cloneDeep(this.fetchedImages);
    },
    toggleDeleteImage: function toggleDeleteImage(image) {
      image.deleted = !image.deleted;
      // console.log(image);
    },
    pushImages: function pushImages() {
      var images = this.images.map(function (image, order) {
        return _extends({}, image, { order: order });
      });
      api('set_images', { images: images }).then(this.setImages.bind(this));
      this.showModal = false;
    }
  }
});

Vue.component('ah-headshotter', {
  template: '\n    <div class="ah-headshotter">\n      <vue-clip class="ah-headshotter__uploader" :options="options" :on-sending="sending" :on-complete="complete">\n        <template slot="clip-uploader-action">\n          <div class="ah-headshotter__dropzone">\n              <img zv-if="headshot-url" :src="headshotUrl">\n              <div class="dz-message">\n                  <h2 class="text-center">\n                      Click here or Drag and Drop an image here <br>\n                      to upload a headshot for your profile.\n                  </h2>\n              </div>\n          </div>\n        </template>\n      </vue-clip>\n\n      <modal v-if="showModal" :isNotice="true" @close="showModal = false">\n        <h3 slot="header">\n          <span v-if="!uploadError">Upload Successful!</span>\n          <span v-else>Upload Error</span>\n        </h3>\n        <p slot="body">\n          <span v-if="!uploadError">Headshot has been added.</span>\n          <span v-else>Oops. Something went wrong. Please try again.</span>\n        </p>\n      </modal>\n\n    </div>\n  ',
  props: ['headshot-url'],
  data: function data() {
    return {
      options: {
        paramName: 'async-upload',
        url: ah_config.upload_url,
        renameFilename: function renameFilename(filename) {
          return '0934-artist-' + ah_config.artistId + '-headshot-' + filename;
        }
      },
      showModal: false,
      uploadError: false
    };
  },

  methods: {
    complete: function complete(file, status, xhr) {
      this.$emit('uploaded', 'boom');
      if (status !== 'success') {
        this.uploadError = true;
      } else {
        this.uploadError = false;
      }
      this.showModal = true;
    },
    sending: function sending(file, xhr, formData) {
      this.applyFormData(file, formData);
    },
    applyFormData: function applyFormData(file, formData) {
      formData.append('action', 'upload-attachment');
      formData.append('_wpnonce', ah_config.nonce);
      // formData.append('name', file.name);
      return formData;
    }
  }
});

vm = new Vue({
  el: '#edit-profile',
  template: '<div class="bootstrap">\n    <h2>Basic Info</h2>\n    <ah-info-editor></ah-info-editor>\n    <ah-file-uploader></ah-file-uploader>\n    <h2 class="mt-4">Organize Media</h2>\n    <ah-organize-gallery></ah-organize-gallery>\n    </div>\n  ',
  data: {
    profile: {
      name: '',
      description: ''
    }
  }
});
