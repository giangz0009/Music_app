const API_HOST = "shazam.p.rapidapi.com";
const API_KEY = "f35f0a7761mshca1c10f5bfb394fp13883fjsnd0f30751d099";
const API =
  "https://shazam.p.rapidapi.com/songs/list-artist-top-tracks?id=40008598&locale=en-US";

const PLAYER_STORAGE_KEY = "F8_Course_Giang_Do";

const options = {
  method: "GET",
  headers: {
    "X-RapidAPI-Host": API_HOST,
    "X-RapidAPI-Key": API_KEY,
  },
};

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const player = $(".player");
const heading = $(".dashboard h2");
const cd = $(".cd");
const cdThumb = $(".cd-thumb");
const audio = $("#audio");
const playlist = $(".playlist");
const playBtn = $(".control .btn.btn-toggle-play");
const nextBtn = $(".control .btn.btn-next");
const prevBtn = $(".control .btn.btn-prev");
const randomBtn = $(".control .btn.btn-random");
const repeatBtn = $(".control .btn.btn-repeat");
const progress = $("#progress");

const app = {
  isRepeat: false,
  isRandom: false,
  isPlaying: false,
  currentIndex: 0,
  config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
  songLists: [],
  playedSongs: [],

  setConfig: function (key, value) {
    this.config[key] = value;
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
  },

  start: function () {
    this.loadConfig();
    this.renderConfig();
    this.handleRender();

    this.handleDOMEvent(this);
  },

  handleDOMEvent: function (thisApp) {
    const _this = thisApp;
    let lastScrollTop;

    // CD rotate
    const cdThumbAnimate = cdThumb.animate([{ transform: "rotate(360deg)" }], {
      duration: 10000,
      iterations: Infinity,
    });

    cdThumbAnimate.pause();

    // event click play btn
    playBtn.onclick = function () {
      if (_this.isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
    };

    // event click next btn
    nextBtn.onclick = function () {
      if (_this.isRandom) {
        _this.handleRandomEvent();
      } else {
        _this.currentIndex++;
        if (_this.currentIndex >= _this.songLists.length)
          _this.currentIndex = 0;
      }

      _this.handleRenderDashBoard();
      _this.changeActiveSong(_this);

      cdThumbAnimate.cancel();

      audio.play();
    };

    // event click prev btn
    prevBtn.onclick = function () {
      if (_this.isRandom) {
        _this.handleRandomEvent();
      } else {
        _this.currentIndex--;
        if (_this.currentIndex < 0)
          _this.currentIndex = _this.songLists.length - 1;
      }

      _this.handleRenderDashBoard();
      _this.changeActiveSong(_this);

      cdThumbAnimate.cancel();

      audio.play();
    };

    // event click random btn
    randomBtn.onclick = function () {
      _this.isRandom = !_this.isRandom;
      randomBtn.classList.toggle("active", _this.isRandom);

      if (_this.isRandom && !_this.playedSongs.includes(_this.currentIndex))
        _this.playedSongs.push(_this.currentIndex);

      _this.setConfig("isRandom", _this.isRandom);
    };

    // event click repeat btn
    repeatBtn.onclick = function () {
      _this.isRepeat = !_this.isRepeat;
      repeatBtn.classList.toggle("active", _this.isRepeat);

      _this.setConfig("isRepeat", _this.isRepeat);
    };

    // event audio play
    audio.onplay = function () {
      _this.isPlaying = true;
      player.classList.add("playing");
      cdThumbAnimate.play();
    };

    // event audio pause
    audio.onpause = function () {
      _this.isPlaying = false;
      player.classList.remove("playing");
      cdThumbAnimate.pause();
    };

    // event timeupdate
    audio.ontimeupdate = function () {
      let seekValue = Math.floor((audio.currentTime * 100) / audio.duration);
      if (seekValue) {
        progress.value = seekValue;
      }
    };

    // event audio ended
    audio.onended = function () {
      if (_this.isRepeat) {
        setTimeout(function () {
          audio.play();
        }, 300);
      } else {
        nextBtn.click();
      }
    };

    // seek Event
    progress.oninput = function () {
      let newTime = progress.value * 0.01 * audio.duration;
      audio.pause();
      setTimeout(function () {
        audio.currentTime = newTime;
        audio.play();
      }, 200);
    };

    // hide disc onScroll
    playlist.onwheel = function (e) {
      let scrollTop = e.deltaY;
      if (scrollTop > 0) {
        cd.style.width = 0;
        cd.style.opacity = 0;
      } else {
        cd.style.width = 200 + "px";
        cd.style.opacity = 1;
      }
    };
    playlist.ontouchmove = function (e) {
      let scrollTop = e.changedTouches[0].clientY;
      if (lastScrollTop) {
        if (lastScrollTop < scrollTop) {
          // Scroll down
          cd.style.width = 200 + "px";
          cd.style.opacity = 1;
        } else {
          // Scroll up
          cd.style.width = 0;
          cd.style.opacity = 0;
        }
      }

      lastScrollTop = scrollTop;
    };

    // play song when click on song list
    player.onclick = function (e) {
      let optionNode = e.target.closest(".option");
      let songNodeNotActive = e.target.closest(".song:not(.active)");
      if (songNodeNotActive || optionNode) {
        if (songNodeNotActive) {
          _this.currentIndex = songNodeNotActive.dataset.id;
          _this.handleRenderDashBoard();
          _this.changeActiveSong(_this);
          cdThumbAnimate.cancel();
          cdThumbAnimate.play();
        }
        if (optionNode) {
          console.log("Open option menu");
        }
      }
    };
  },

  renderConfig: function () {
    repeatBtn.classList.toggle("active", this.isRepeat);
    randomBtn.classList.toggle("active", this.isRandom);
  },

  loadConfig: function () {
    this.isRandom = this.config.isRandom;
    this.isRepeat = this.config.isRepeat;
  },

  handleRender: function () {
    this.handleRenderDashBoard();
    this.handleRenderPlaylist();
  },

  handleRenderDashBoard: function () {
    let song = this.songLists[this.currentIndex];

    heading.innerText = song.name;
    cdThumb.style.backgroundImage = "url('" + song.img_src + "')";
    audio.src = song.src;
  },

  handleRenderPlaylist: function () {
    let html = "";
    this.songLists.forEach((song) => {
      html += `
        <div class="song song-${song.id} ${
        song.id === this.currentIndex ? "active" : ""
      }" data-id="${song.id}">
          <div class='thumb' style="background-image: url('${
            song.img_src
          }');"></div>
          <div class='body'>
            <h3 class='title'>${song.name}</h3>
            <p class='author'>${song.singer}</p>
          </div>
          <div class='option'>
            <i class='fas fa-ellipsis-h'></i>
          </div>
        </div>
      `;
    });

    playlist.innerHTML = html;
  },

  handleRandomEvent: function () {
    let newIndex;

    do {
      newIndex = Math.floor(Math.random() * this.songLists.length);
    } while (
      newIndex === this.currentIndex ||
      this.playedSongs.includes(newIndex)
    );

    this.playedSongs.push(newIndex);
    this.currentIndex = newIndex;

    if (this.playedSongs.length === this.songLists.length)
      this.playedSongs = [];
  },

  changeActiveSong: function (app) {
    let _this = app;
    $(".song.active").classList.remove("active");
    setTimeout(function () {
      let currentSong = $(".song.song-" + _this.currentIndex);
      currentSong.classList.add("active");
      currentSong.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
  },
};

fetch(API, options)
  .then((response) => response.json())
  .then((response) => response.tracks)
  .then((songs) => {
    app.songLists = songs.map((song, index) => {
      return {
        id: index,
        name: song.title,
        img_src: song.images.coverart,
        src: song.hub.actions[1].uri,
        singer: song.subtitle,
      };
    });

    app.start();
  })
  .catch((err) => console.error(err));
