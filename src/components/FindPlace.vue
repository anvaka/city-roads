<template>
<div class='find-place' :class='{centered: !suggestionsLoaded }'>
  <div v-if='!suggestionsLoaded'>
    <h3 class='site-header'>city roads</h3>
    <p class='description'>This website renders every single road within a city</p>
  </div>
  <form v-on:submit.prevent="onSubmit" class='search-box'>
      <input class='query-input' v-model='enteredInput' type='text' placeholder='Enter a city name to start' ref='input'>
      <a type='submit' class='search-submit' href='#' @click.prevent='onSubmit' v-if='enteredInput && !hideInput'>{{mainActionText}}</a>
  </form>
  <div v-if='showWarning' class='prompt message note shadow'>
    Note: Large cities may require 200MB+ of data transfer and may need a powerful device to render.
  </div>
  <div class='results' v-if='!loading'>
    <div v-if='suggestionsLoaded && data.length' class='suggestions shadow'>
      <div class='prompt message'>
        <div>Select boundaries below to download all roads within</div>
        <div class='note'>large cities may require 200MB+ of data transfer and a powerful device</div>
      </div>
      <ul>
        <li v-for='(suggestion, index) in data' :key="index">
          <a @click.prevent='pickSuggestion(suggestion)' class='suggestion'
          href='#'>
          <span>
          {{suggestion.name}} <small>({{suggestion.type}})</small>
          </span>
          </a>
        </li>
      </ul>
    </div>
    <div v-if='suggestionsLoaded && !data.length && !loading' class='no-results message shadow'>
      Didn't find matching cities. Try a different query?
    </div>
    <div v-if='noRoads' class='no-results message shadow'>
      Didn't find any roads. Try a different query?
    </div>
  </div>
  <div v-if='error' class='error message shadow'>
    <div>Something went wrong. The error was:</div>
    <pre>{{error}}</pre>
  </div>
  <div v-if='loading' class='loading message shadow'>
    <loading-icon></loading-icon>
    <span>{{loading}}</span>
    <a href="#" @click.prevent='cancelRequest' class='cancel-request'>cancel</a>
    <div class='load-padding' v-if='stillLoading > 0'>
      Still loading...
    </div>
    <div class='load-padding' v-if='stillLoading > 1'>
      Sorry it takes so long!
    </div>
  </div>
</div>
</template>

<script>
import LoadingIcon from './LoadingIcon';
import postData from '../lib/postData';
import request from '../lib/request';
import appState from '../lib/appState';
import Grid from '../lib/Grid';
import queryState from '../lib/appState';
import config from '../config';
import Progress from '../lib/Progress'

const FIND_TEXT = 'Find City Bounds';

export default {
  name: 'FindPlace',
  components: {
    LoadingIcon
  },
  data () {
    let hasValidArea = this.getCurrentAreaId();

    return {
      enteredInput: appState.get('q') || '',
      loading: null,
      lastCancel: null,
      suggestionsLoaded: false,
      stillLoading: 0,
      error: null,
      hideInput: false,
      noRoads: false,
      clicked: false,
      showWarning: hasValidArea, 
      mainActionText: hasValidArea ? 'Download Area' : FIND_TEXT,
      data: []
    }
  },
  watch: {
    enteredInput() {
      // As soon as they change it, we need not to download:
      this.mainActionText = FIND_TEXT;
      this.showWarning = false;
      this.hideInput = false;
      if (appState.get('areaId')) {
        appState.unset('areaId');
      }
    }
  },
  mounted() {
    this.$refs.input.focus();
  },
  beforeDestroy() {
    if (this.lastCancel) this.lastCancel();
    clearInterval(this.notifyStillLoading);
  },
  methods: {
    getCurrentAreaId() {
      let areaId = appState.get('areaId');
      if (!Number.isFinite(Number.parseInt(areaId, 10))) {
        areaId = null;
      }
      return areaId;
    },
    onSubmit() {
      queryState.set('q', this.enteredInput);
      this.cancelRequest()
      this.data = [];
      this.noRoads = false;
      this.error = false;
      this.showWarning = false;

      let areaId = this.getCurrentAreaId();
      if (areaId) {
        this.pickSuggestion({
          name: this.enteredInput,
          areaId
        });
        return;
      }

      const query = encodeURIComponent(this.enteredInput);
      this.loading = 'Searching cities that match your query...'
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(x => x.json())
        .then(x => x.filter(row => row.osm_type === 'relation').map(row => ({
          name: row.display_name,
          type: row.type,
          areaId: row.osm_id + 36e8
        })))
        .then(data => {
          this.loading = null;
          this.suggestionsLoaded = true;
          this.data = data;
          this.hideInput = data && data.length;
        });
    },

    updateProgress(status) {
      this.stillLoading = 0;
      clearInterval(this.notifyStillLoading);
      if (status.loaded < 0) {
        this.loading = 'Trying a different server'
        this.restartLoadingMonitor();
        return;
      }
      if (status.percent !== undefined) {
        this.loading = 'Loaded ' + Math.round(100 * status.percent) + '% (' + formatNumber(status.loaded) + ' bytes)...';
      } else {
        this.loading = 'Loaded ' + formatNumber(status.loaded) + ' bytes...';
      }
    },

    pickSuggestion(suggestion) {
      this.checkCache(suggestion)
        .catch(error => {
          if (error.cancelled) return; // no need to do anything. They've cancelled

          // No Cache - fallback
          return this.useOSM(suggestion);
        });

      this.error = false;
    },

    restartLoadingMonitor() {
      clearInterval(this.notifyStillLoading);
      this.stillLoading = 0;
      this.notifyStillLoading = setInterval(() => {
        this.stillLoading++;
      }, 10000);
    },

    checkCache(suggestion) {
      this.loading = 'Checking cache...'
      let areaId = suggestion.areaId;

      return request(config.areaServer + '/' + areaId + '.pbf', {
        progress: this.generateNewProgressToken(),
        responseType: 'arraybuffer'
      }).then(arrayBuffer => {
        var byteArray = new Uint8Array(arrayBuffer);
        return byteArray;
      }).then(byteArray => {
        var Pbf = require('pbf');
        var place = require('../proto/place.js').place;
        var pbf = new Pbf(byteArray);
        var obj = place.read(pbf);
        let grid = Grid.fromPBF(obj)
        this.$emit('loaded', grid);
      });
    },

    useOSM(suggestion) {
      this.loading = 'Connecting to OpenStreetMap...'
      
      // it may take a while to load data. 
      this.restartLoadingMonitor();

      postData(getQuery(suggestion.areaId), this.generateNewProgressToken())
        .then(osmResponse => {
          this.loading = null;
          if (osmResponse.elements.length === 0) {
            this.noRoads = true;
            return;
          }

          let grid = Grid.fromOSMResponse(osmResponse.elements)
          grid.setName(suggestion.name);
          grid.setId(suggestion.areaId);
          this.$emit('loaded', grid);
        })
        .catch(err => {
          if (err.cancelled) {
            this.loading = null;
            return;
          }
          console.error(err);
          this.error = err;
          this.loading = null;
          this.data = [];
        })
        .finally(() => {
          clearInterval(this.notifyStillLoading);
          this.stillLoading = 0;
        });
    },

    cancelRequest() {
      if (this.progressToken) {
        this.progressToken.cancel();
        this.progressToken = null;
        this.loading = false;
      }
    },

    generateNewProgressToken() {
      if (this.progressToken) {
        this.progressToken.cancel();
        this.progressToken = null;
      }

      this.progressToken = new Progress(this.updateProgress);
      return this.progressToken;
    }
  }
}

function getQuery(areaId) {
    return `[timeout:9000][maxsize:2000000000][out:json];
area(${areaId});
(._; )->.area;
(
way["highway"](area.area);
node(w);
);
out skel;`;
}

function formatNumber(x) {
  if (!Number.isFinite(x)) return 'N/A';
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
</script>

<style lang="stylus">
@import('../vars.styl');
.find-place  {
  width: desktop-controls-width;
}

h3.site-header {
  margin: 0;
  font-weight: normal;
  font-size: 32px;
  text-align: center;
}

input {
  border: none;
  flex: 1;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  padding: 0;
  color: #434343;
  height: 100%;
  font-size: 16px;
  &:focus {
    outline: none;
  }
}

.search-box {
  position: relative;
  background-color: emphasis-background;
  padding: 0 8px;
  padding: 0 0 0 8px;

  box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 -1px 0px rgba(0,0,0,0.02);
  height: 48px;
  display: flex;
  font-size: 16px;
  cursor: text;
  a {
    cursor: pointer;
  }
  span {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
}

.prompt {
  padding: 4px;
  text-align: center;
  font-size: 12px;
}

.search-submit {
  padding: 0 8px;
  align-items: center;
  text-decoration: none;
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  outline: none;
  color: highlight-color
  &:hover {
    color: emphasis-background;
    background: highlight-color;
  }
}

.suggestion {
  display: block
  min-height: 64px
  align-items: center;
  border-bottom: 1px solid border-color
  display: flex
  padding: 0 10px;
  text-decoration: none
  color: highlight-color
}

.suggestions {
  position: relative;
  background: white
  .note {
    font-size: 10px;
    font-style: italic;
  }

  ul {
    list-style-type: none
    margin: 0
    padding: 0
  }
}

.message,
.loading {
  padding: 4px 8px;
  position: relative;
}
.shadow {
  box-shadow: 0 2px 4px rgba(0,0,0,0.2)
}

.error {
  overflow-x: auto;
}

.find-place {
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 8px;
  left: 50%;

  transform: translateX(-50%) translateY(0);
  transition-timing-function: ease-out;
  transition-property: top left transform;
  transition-duration: 0.3s;
}

.find-place.centered {
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-143px);
}
.load-padding {
  padding-left: 16px;
}
.description {
  padding: 8px;
  margin: 0;
  text-align: center;
}

.cancel-request {
  position: absolute;
  right: 4px;
  top: 4px;
  font-size: 12px;
}

@media (max-width: small-screen) {
  .find-place {
    width: 100%;
  }
  .find-place.centered {
    top: 8px;
    left: 0;
    transform: none;
  }
  .message {
    font-size: 12px;
  }
  .prompt {
    font-size: 12px;
    .note {
      font-size: 9px;
    }
  }
}

</style>
