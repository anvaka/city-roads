<template>
<div class='print-window add-place'>
  <h3>Places on this map</h3>
  <div class='row place' v-for='(place, index) in places' :key='place.areaId || index'>
    <span class='col c-2'>{{place.name}}</span>
    <a v-if='index > 0' href='#' class='remove-place' @click.prevent='$emit("remove", place)'>remove</a>
  </div>

  <h3>Add a neighbouring place</h3>
  <form @submit.prevent='search' class='search-box add-search'>
    <input class='query-input' v-model='query' type='text' placeholder='Village or city that borders this map' ref='input'>
    <a class='search-submit' href='#' @click.prevent='search' v-if='query && !loading'>Find</a>
  </form>

  <div v-if='loading' class='loading message'>
    <loading-icon></loading-icon>
    <span>{{loading}}</span>
    <a href='#' @click.prevent='cancel' class='cancel-request' v-if='progress'>cancel</a>
  </div>

  <div v-if='error' class='error message'>
    <div>{{errorText}}</div>
    <a href='#' @click.prevent='retry' v-if='lastSuggestion'>Retry</a>
  </div>

  <div v-if='pending' class='message'>
    <div>{{pending.name.split(',')[0]}} does not seem to border the places on this map.</div>
    <div class='pending-actions'>
      <a href='#' @click.prevent='add(pending)'>Add anyway</a>
      <a href='#' @click.prevent='pending = null'>Cancel</a>
    </div>
  </div>

  <div v-if='searched && !loading && !pending'>
    <div v-if='!suggestions.length' class='message'>Didn't find matching boundaries. Try a different query?</div>
    <ul class='add-suggestions' v-else>
      <li v-for='(suggestion, index) in suggestions' :key='index'>
        <a href='#' class='suggestion' @click.prevent='pick(suggestion)'>
          <span>{{suggestion.name}} <small>({{suggestion.type}})</small></span>
        </a>
      </li>
    </ul>
  </div>
</div>
</template>

<script>
import LoadingIcon from './LoadingIcon.vue';
import findBoundaryByName, {findBoundaryByAreaId} from '../lib/findBoundaryByName.js';
import Progress from '../lib/Progress.js';

export default {
  name: 'AddPlace',
  components: {
    LoadingIcon
  },
  // loadPlace(suggestion, progress) => Promise. Resolves when the place is on the map.
  props: ['places', 'loadPlace', 'currentBbox', 'restoreIds'],
  emits: ['remove'],
  data() {
    return {
      query: '',
      suggestions: [],
      searched: false,
      loading: null,
      error: null,
      pending: null,
      progress: null,
      lastSuggestion: null
    };
  },
  watch: {
    restoreIds: {
      immediate: true,
      handler(ids) {
        if (ids && ids.length) this.restore(ids);
      }
    }
  },
  computed: {
    errorText() {
      let error = this.error;
      if (!error) return '';
      if (error.allServersFailed || error.statusError || error.timedOut || error.networkError) {
        return 'OpenStreetMap servers are busy or temporarily unavailable. Please try again in a few minutes.';
      }
      return error.message || String(error);
    }
  },
  methods: {
    search() {
      if (!this.query || this.loading) return;
      this.error = null;
      this.pending = null;
      this.loading = 'Searching places that match your query...';
      findBoundaryByName(this.query).then(suggestions => {
        this.loading = null;
        this.searched = true;
        // Only boundaries can be stitched. Skip the ones already on the map.
        this.suggestions = suggestions.filter(s => s.areaId && !this.places.some(p => p.areaId == s.areaId));
      }).catch(err => {
        this.loading = null;
        this.error = err;
      });
    },

    pick(suggestion) {
      if (this.currentBbox && suggestion.bbox && !bboxesTouch(this.currentBbox, suggestion.bbox)) {
        this.pending = suggestion;
        return;
      }
      this.add(suggestion);
    },

    add(suggestion) {
      this.pending = null;
      this.error = null;
      this.searched = false;
      this.suggestions = [];
      this.lastSuggestion = suggestion;
      let shortName = suggestion.name.split(',')[0];
      this.loading = `Downloading roads of ${shortName}...`;
      // Vue wraps `this.progress` in a proxy, so we compare request numbers instead of objects.
      let requestId = this.requestId = (this.requestId || 0) + 1;
      let progress = new Progress(status => {
        if (requestId === this.requestId) this.updateProgress(status, shortName);
      });
      this.progress = progress;

      return this.loadPlace(suggestion, progress).then(() => {
        if (requestId !== this.requestId) return;
        this.loading = null;
        this.progress = null;
        this.lastSuggestion = null;
        this.query = '';
      }).catch(err => {
        if (requestId !== this.requestId) return;
        this.loading = null;
        this.progress = null;
        if (!err.cancelled) this.error = err;
      });
    },

    restore(ids) {
      // Places from the url: look up their names, then load them one by one.
      return ids.reduce((prev, areaId) => prev.then(() => {
        if (this.places.some(p => p.areaId == areaId)) return;
        this.loading = 'Restoring places from the link...';
        return findBoundaryByAreaId(areaId)
          .then(boundary => this.add(boundary))
          .catch(err => {
            this.loading = null;
            this.error = err;
          });
      }), Promise.resolve());
    },

    retry() {
      if (this.lastSuggestion) this.add(this.lastSuggestion);
    },

    cancel() {
      if (this.progress) this.progress.cancel();
      this.requestId = (this.requestId || 0) + 1;
      this.progress = null;
      this.loading = null;
    },

    updateProgress(status, shortName) {
      if (status.loaded < 0) {
        this.loading = `Trying a different server for ${shortName}...`;
      } else {
        this.loading = `Downloading roads of ${shortName}: ${formatBytes(status.loaded)}`;
      }
    }
  }
}

/**
 * Checks whether two [south, west, north, east] boxes touch or overlap.
 * Tolerance is in degrees.
 */
function bboxesTouch(a, b, tolerance = 0.005) {
  return a[0] <= b[2] + tolerance && b[0] <= a[2] + tolerance &&
         a[1] <= b[3] + tolerance && b[1] <= a[3] + tolerance;
}

function formatBytes(x) {
  if (!Number.isFinite(x)) return '';
  if (x > 1024 * 1024) return (x / 1024 / 1024).toFixed(1) + ' MB';
  return Math.round(x / 1024) + ' KB';
}
</script>

<style lang='stylus'>
@import('../vars.styl');

.add-place {
  .place {
    align-items: center;
  }
  .remove-place {
    font-size: 12px;
  }
  .add-search {
    box-shadow: none;
    border: 1px solid border-color;
    height: 40px;
  }
  .message {
    margin-top: 8px;
    font-size: 14px;
  }
  .pending-actions {
    display: flex;
    justify-content: space-around;
    margin-top: 8px;
  }
  .add-suggestions {
    list-style-type: none;
    margin: 8px 0 0 0;
    padding: 0;
    max-height: 50vh;
    overflow-y: auto;
  }
  .suggestion {
    min-height: 48px;
    margin: 0; // the global `a` style uses -1px margins, which makes the list scroll
  }
}
</style>
