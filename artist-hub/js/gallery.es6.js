if (!HTMLCanvasElement.prototype.toBlob && HTMLCanvasElement.prototype.msToBlob) {
  HTMLCanvasElement.prototype.toBlob = HTMLCanvasElement.prototype.msToBlob;
}

let api = function(action, parameters) {
  return axios.post(`${window.ah_config.ajax_url}?action=ah_interact`, {action, artist_id: window.ah_config.artistId, ...parameters})
    .then(function(r) {
      // console.log(`Api response to ${action}: ${JSON.stringify(parameters)}: ${JSON.stringify(r)}`);
      return r;
    })
    .then(r => r.data);
};

var _ = (window.lodash || window._);

Vue.component('modal', {
  props: {'isNotice' : Boolean },
  template: `
    <transition name="modal">
      <div class="modal-mask">
        <div class="modal-wrapper">
          <div class="modal-container">

            <div class="modal-header">
              <slot name="header">
                default header
              </slot>
            </div>

            <div class="modal-body">
              <slot name="body">
                default body
              </slot>
            </div>

            <div class="modal-footer">
              <slot name="footer">
                <button v-if="!isNotice" class="btn btn-primary" @click.prevent="$emit('confirm')">
                  Confirm
                </button>
                <button v-if="!isNotice" class="btn btn-secondary" @click.prevent="$emit('cancel')">
                  Cancel
                </button>
                <button v-if="isNotice" class="btn btn-secondary" @click.prevent="$emit('close')">
                  Close
                </button>
              </slot>
            </div>

          </div>
        </div>
      </div>
    </transition>
  `
});

Vue.component('ah-file-uploader', {
  template: `
    <div>
    <h2 class="mt-4">Upload Images</h2>
    <vue-clip class="ah-uploader" :options="options" :on-sending="sending" :on-complete="complete">
        <template slot="clip-uploader-action">
        <div class="ah-dropzone">
            <div class="dz-message">
                <h2 class="text-center">
                    Click here or Drag and Drop images here to upload  <br>
                    You may upload image or PDF files.
                </h2>
            </div>
        </div>
        </template>

        <template slot="clip-uploader-body" slot-scope="props">
        <div class="mt-2" v-for="file in props.files">
            <img class="mt-1" v-bind:src="file.dataUrl" />
            {{ file.name }} {{ file.status }}
        </div>
        </template>
    </vue-clip>
    <modal v-if="showModal" :isNotice="true" @close="showModal = false">
      <h3 slot="header">
        <span v-if="!uploadError">Upload Successful!</span>
        <span v-else>Upload Error</span>
      </h3>
      <p slot="body">
        <span v-if="!uploadError">Image has been added.</span>
        <span v-else>Oops. Something went wrong. Please try again.</span>
      </p>
    </modal>
    <h2 class="mt-4">Upload Videos</h2>
    <div class="input-group">
        <input type="text"
               class="form-control"
               v-model="videoUrl"
               spellcheck="false"
               @input="submitVideo"
               placeholder="Paste Youtube or Vimeo link here to add video."/>
        <span class="input-group-btn">
          <button class="btn btn-secondary" :disabled="!videoId || !videoHost  || !thumbnailLoaded || thumbnailError" @click="uploadVideo">Add Video</button>
        </span>
    </div>
    <div v-show="videoThumbnail">
      <p v-if="videoUrl && !videoId && !videoHost" class="mt-1 alert alert-warning">Malformed video URL, please verify the URL.</p>
      <p v-if="videoId && videoHost && thumbnailLoaded && !thumbnailError" class="mt-1 alert alert-success">Found your video, click "add video" to add it to the gallery.</p>
      <p v-if="videoId && videoHost && thumbnailError" class="mt-1 alert alert-danger">Could not load a thumbnail from <strong>{{videoHost}}</strong> for video id <strong>{{videoId}}</strong>! Please verify the video url and try again.</p>
      <img class="ah-video-thumbnail" ref="thumbnail" :src="videoThumbnail" v-show="thumbnailLoaded">
      <div class="ah-video-uploader__progress">{{ videoHint }}</div>
    </div>
    </div>
  `,
  data() {
    return {
      options: {
        paramName: 'async-upload',
        url: ah_config.upload_url,
        renameFilename: (filename) => {
          return `0934-artist-${ah_config.artistId}-media-${filename}`;
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
      thumbnailError: false,
    };
  },
  mounted() {
    let videoThumbnail = this.$refs.thumbnail;
    videoThumbnail.onload = () => {
      this.thumbnailLoaded = true;
      this.thumbnailError = false;
    }
    videoThumbnail.onerror = () => {
      this.thumbnailLoaded = false;
      this.thumbnailError = true;
    }
  },
  methods: {
    complete(file, status, xhr) {
      if (status !== 'success') {
        this.uploadError = true;
      } else {
        this.uploadError = false;
      }
      window.ahRefreshImages();
      this.showModal = true;
    },
    sending(file, xhr, formData) {
      this.applyFormData(file, formData);
    },
    applyFormData(file, formData) {
      formData.append('action', 'upload-attachment');
      formData.append('_wpnonce', ah_config.nonce);
      formData.append('name', file.name);
      return formData;
    },
    submitVideo: _.debounce(function () {
      let isYoutube = /(youtu\.be|youtube)/,
          isVimeo   = /vimeo/,
          vimeoId   = /\d+/,
          url       = this.videoUrl,
          matchedId = null;

      let youtubeId = (url) => {
        let regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        let match = url.match(regExp);
        return match[2];
      };

      this.videoHost = null;
      this.videoId = null;
      this.videoThumbnail = null;

      if(url.match(isYoutube)) {
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
    getThumbnail(host, id) {
      this.videoThumbnail = `${window.ah_config.thumbnailProxy}?service=${host}&videoid=${id}`
    },
    uploadVideo() {
      let canvas   = document.createElement('canvas'),
          ctx      = canvas.getContext('2d'),
          img      = new Image(),
          formData = new FormData(),
          filename =  `--video-${this.videoHost}-${this.videoId}.jpg`;
      img.onerror = () => {
        console.log("Shit got fuckacious!");
      }
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          let name =  `0934-artist-${ah_config.artistId}-media-${filename}`
          formData.append('action', 'upload-attachment');
          formData.append('_wpnonce', ah_config.nonce);
          formData.append('name', name);
          formData.append('async-upload', blob, name);
          axios.post(ah_config.upload_url, formData)
            .then(() => {
              this.videoHost =  null;
              this.videoId =  null;
              this.videoThumbnail =  null;
              this.videoUrl =  null;
              this.videoHint =  null;
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
  data: function() {
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
    summonData() {
      api('get_profile').then(this.loadData.bind(this));
    },
    loadData(data) {
      this.recordedProfile = _.cloneDeep(data);
      this.profile = _.cloneDeep(data);
      this.loaded = true;
    },
    submitData() {
      matchUrl = /^((http|ftp)s?)?:\/{2}/;
      isComplete = () => ({text, url}) => url != "" && text != "";
      normalizeUrl = (link) => {
        let matches = link.url.match(matchUrl);
        if(matches) {
          let [protocolString, protocol] = matches;
          if(!protocol) {
            link.url = "http" + link.url;
          }
        } else {
          link.url = "http://" + link.url;
        }
        return link;
      };
      this.profile.links = this.profile.ah_artist_links.filter(isComplete).map(normalizeUrl);
      api('update_profile', {profile: this.profile}).then(this.loadData.bind(this));
      this.showModal = false;
    },
    cancel() {
      this.profile = _.cloneDeep(this.recordedProfile);
      this.showModal = false;
    },
    addLink() {
      // console.log("Adding link.");
      this.profile.ah_artist_links.push({text: "", url: ""});
    },
    removeLink(index) {
      this.profile.ah_artist_links.splice(index, 1);
    },
    refreshHeadshot() {
      api('get_profile').then((data) => {
        // console.log("Refresh headshot: data.ah_artist_headshot_url");
        this.recordedProfile.ah_artist_headshot_url = this.profile.ah_artist_headshot_url = data.ah_artist_headshot_url;
      });
    },
  },
  mounted() {
    this.summonData();
    window.edd = this.$data;
  },
  watch: {
    profile: {
      deep: true,
      handler(val) {
        // console.log("I'm here!", _.isEqual(this.profile, this.recordedProfile));
        this.dirty = this.loaded && !_.isEqual(this.profile, this.recordedProfile);
      }
    }
  },
  computed: {
    saveMode() {
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
  template: `
    <form class="artist-info-editor">
      <div class="form-group">
        <label class="artist-info-editor__field-label">Name</label>
        <input type="text" class="form-control" v-model="profile.ah_artist_name">
      </div>
      <div class="form-group">
        <label class="artist-info-editor__field-label">Discipline</label>
        <input type="text" class="form-control" v-model="profile.ah_artist_discipline">
      </div>
      <div class="form-group">
        <label class="artist-info-editor__field-label">Description</label>
        <textarea v-model="profile.ah_artist_description" class="form-control"></textarea>
      </div>
      <div class="form-group">
        <label class="artist-info-editor__field-label">Contact Information</label>
        <textarea v-model="profile.ah_artist_contact" class="form-control"></textarea>
      </div>
      <div class="form-group">
        <label class="artist-info-editor__field-label">Links</label>
        <div class="input-group" v-for="(link, linkIndex) in profile.ah_artist_links">
          <input type="text" v-model="link.text" placeholder="Link Text" class="form-control">
          <input type="text" v-model="link.url" placeholder="Link URL"""class="form-control">
          <div class="input-group-append">
            <button class="btn btn-outline-secondary" @click="removeLink(linkIndex)" type="button">Remove</button>
          </div>
        </div>
      </div>
      <div class="form-group text-right"><button class="btn btn-primary" @click.prevent="addLink()">Add Link</button></div>
      <ah-headshotter class="mb-4" :headshot-url="profile.ah_artist_headshot_url" @uploaded="refreshHeadshot()">
      </ah-headshotter>
      <div class="form-group">
        <button class="btn btn-primary" :disabled="saveMode.disabled" @click.prevent="showModal = true">Save Information</button>
        <modal v-if="showModal" @confirm="submitData" @cancel="showModal = false">
          <h3 slot="header">Update Information</h3>
          <p slot="body">Please confirm or cancel</p>
        </modal>
        <button class="btn btn-danger" v-if="!saveMode.disabled" @click="cancel">Reset</button>
      </div>
    </form>
  `
});

Vue.component('ah-organize-gallery', {
  template: `
    <div class="ah-organize-gallery">
        <div class="ah-organize__controls mb-3">
            <button class="btn btn-primary" @click="showModal = true;">Save Gallery</button>
            <modal v-if="showModal" @confirm="pushImages" @cancel="showModal = false">
              <h3 slot="header">Update Gallery</h3>
              <p slot="body">Please confirm or cancel</p>
            </modal>
            <button class="btn btn-secondary" v-if="viewing != 'images'" @click="viewing = 'images'">View Images/Videos</button>
            <button class="btn btn-secondary" v-if="viewing != 'pdfs'" @click="viewing = 'pdfs'">View PDFs</button>
        </div>
        <div v-if="files.length == 0" class="alert alert-secondary">
            No {{viewing}}, why don't you upload some?
        </div>
        <table class="table" v-if="files.length > 0">
            <thead>
                <th>Order</th>
                <th v-if="imageMode">Image</th>
                <th v-if="imageMode">Caption</th>
                <th v-if="pdfMode" class="text-left">File Name</th>
                <th v-if="pdfMode" class="text-left">Link Text</th>
                <th></th>
            </thead>
            <draggable v-model="images" element="tbody" :options="draggableOptions">
                <tr v-for="(image, index) in files">
                    <td class="ah-organize__order handle">{{index + 1}}</td>
                    <td v-if="imageMode"class="ah-organize__thumbnail">
                        <img :src="image.thumbnail[0]"
                             :width="image.thumbnail[1] / 2"
                             :height="image.thumbnail[2] / 2">
                    </td>
                    <td v-if="imageMode" class="ah-organize__caption">
                        <textarea v-model="image.caption"></textarea>
                    </td>
                    <td v-if="pdfMode">
                      <div class="input-group mb-3">
                        <label class="align-middle input-group-text">{{image.filename}}</label>
                      </div>
                    </td>
                    <td v-if="pdfMode">
                      <div class="input-group mb-3">
                        <input class="form-control" v-mode="image.caption" type="text" placeholder="Link Text">
                      </div>
                    </td>
                    <td><button :class="{ 'btn': true, 'btn-danger': image.deleted, 'btn-secondary': !image.deleted }" @click="toggleDeleteImage(image)">
                      {{ image.deleted ? "Keep" : "Delete" }}
                    </button></td>
                <tr/>
            </draggable>
        </table>
        <div class="ah-organize__controls mb-3">
            <button class="btn btn-primary" @click="showModal = true">Save Gallery</button>
            <modal v-if="showModal" @confirm="pushImages" @cancel="showModal = false">
              <h3 slot="header">Update Gallery</h3>
              <p slot="body">Please confirm or cancel</p>
            </modal>
            <button class="btn btn-secondary" v-if="viewing != 'images'" @click="viewing = 'images'">View Images/Videos</button>
            <button class="btn btn-secondary" v-if="viewing != 'pdfs'" @click="viewing = 'pdfs'">View PDFs</button>
        </div>
    </div>
  `,
  data: () => ({
    viewing: "images",
    images: [],
    fetchedImages: [],
    showModal: false,
    draggableOptions: {
      // handle: '.handle'
    }
  }),
  mounted() {
    this.fetchImages();
    window.ahRefreshImages = this.fetchImages.bind(this);
  },
  computed: {
    imageMode() {
      return this.viewing == "images";
    },
    pdfMode() {
      return this.viewing == "pdfs";
    },
    files() {
      if(this.viewing == "images") {
        return this.images.filter((i) => i.type != "application/pdf");
      } else {
        return this.images.filter((i) => i.type == "application/pdf");
      }
    }
  },
  methods: {
    fetchImages() {
      api('get_images')
        .then(this.setImages.bind(this));
    },
    setImages(images) {
      this.fetchedImages = _.chain(images)
        .sortBy(_.property('order'))
        .each(i => { i.deleted = false; })
        .value();
      // console.log("Fetched images", this.fetchedImages.map(i => [i.order, i.deleted]));
      this.images = _.cloneDeep(this.fetchedImages);
    },
    toggleDeleteImage(image) {
      image.deleted = !image.deleted;
      // console.log(image);
    },
    pushImages() {
      let images = this.images.map((image, order) => {
        return {...image, order};
      });
      api('set_images', {images})
        .then(this.setImages.bind(this));
      this.showModal = false;
    }
  }
});

Vue.component('ah-headshotter', {
  template: `
    <div class="ah-headshotter">
      <vue-clip class="ah-headshotter__uploader" :options="options" :on-sending="sending" :on-complete="complete">
        <template slot="clip-uploader-action">
          <div class="ah-headshotter__dropzone">
              <img zv-if="headshot-url" :src="headshotUrl">
              <div class="dz-message">
                  <h2 class="text-center">
                      Click here or Drag and Drop an image here <br>
                      to upload a headshot for your profile.
                  </h2>
              </div>
          </div>
        </template>
      </vue-clip>

      <modal v-if="showModal" :isNotice="true" @close="showModal = false">
        <h3 slot="header">
          <span v-if="!uploadError">Upload Successful!</span>
          <span v-else>Upload Error</span>
        </h3>
        <p slot="body">
          <span v-if="!uploadError">Headshot has been added.</span>
          <span v-else>Oops. Something went wrong. Please try again.</span>
        </p>
      </modal>

    </div>
  `,
  props: ['headshot-url'],
  data() {
    return {
      options: {
        paramName: 'async-upload',
        url: ah_config.upload_url,
        renameFilename: (filename) => {
            return `0934-artist-${ah_config.artistId}-headshot-${filename}`;
          }
      },
      showModal: false,
      uploadError: false
    };
  },
  methods: {
    complete(file, status, xhr) {
      this.$emit('uploaded', 'boom');
      if (status !== 'success') {
        this.uploadError = true;
      } else {
        this.uploadError = false;
      }
      this.showModal = true;
    },
    sending(file, xhr, formData) {
      this.applyFormData(file, formData);
    },
    applyFormData(file, formData) {
      formData.append('action', 'upload-attachment');
      formData.append('_wpnonce', ah_config.nonce);
      // formData.append('name', file.name);
      return formData;
    },
  }
});

vm = new Vue({
  el: '#edit-profile',
  template: `<div class="bootstrap">
    <h2>Basic Info</h2>
    <ah-info-editor></ah-info-editor>
    <ah-file-uploader></ah-file-uploader>
    <h2 class="mt-4">Organize Media</h2>
    <ah-organize-gallery></ah-organize-gallery>
    </div>
  `,
  data: {
    profile: {
      name: '',
      description: ''
    }
  }
});
