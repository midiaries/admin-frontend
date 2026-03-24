<template>
  <v-container fluid>
    <v-row v-if="isAuthenticated && isElevated">
      <v-col cols="12" md="8" offset-md="2">
        <v-card>
          <v-toolbar flat class="msu dark-grey white--text">
            <v-toolbar-title>
              <h3>Viewable</h3>
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-list
              two-line>
              <v-divider></v-divider>
              <v-list-item :to="{ name: 'adminReportsDurationSummary' }">
                <v-list-item-icon class="pt-4">
                  <v-icon color="msu">fa-stopwatch-20</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Summary: Recording Length</v-list-item-title>
                  <v-list-item-subtitle>Total (minutes) per Subject ID for given date range</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item :to="{ name: 'adminReportsDiaryFilterer' }">
                <v-list-item-icon class="pt-4">
                  <v-icon color="msu">fa-filter</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Recording Filterer</v-list-item-title>
                  <v-list-item-subtitle>Filter Recordings through said filter to retrieve filtered Recording list</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item :to="{ name: 'adminReportsContentSearch' }">
                <v-list-item-icon class="pt-4">
                  <v-icon color="msu">fa-search</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Content Search</v-list-item-title>
                  <v-list-item-subtitle>Filter all sentences by content</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-divider></v-divider>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="8" offset-md="2">
        <v-card>
          <v-toolbar flat class="msu dark-grey white--text">
            <v-toolbar-title>
              <h3>Downloads</h3>
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-list
              two-line>
              <v-divider></v-divider>
              <v-list-item
                @click="downloadableReport('reports:allDiaries', 'allDiaries')"
                :disabled="downloadStatus['allDiaries'] === 'running'">
                <v-list-item-icon class="pt-4">
                  <v-icon v-if="!downloadStatus['allDiaries']" color="msu">fa-clipboard-list</v-icon>
                  <v-icon v-if="downloadStatus['allDiaries'] === 'running'" color="msu">fa-redo fa-spin</v-icon>
                  <v-icon v-if="downloadStatus['allDiaries'] === 'error'" color="red">fa-ban</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Recording List</v-list-item-title>
                  <v-list-item-subtitle>Download CSV of all Recordings</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-divider></v-divider>
              <!--- TODO: selectable fields to be included --->
              <v-list-item
                @click="downloadableReport('reports:allSubjectsWithDemo', 'allSubjectsWithDemo')"
                :disabled="downloadStatus['allSubjectsWithDemo'] === 'running'">
                <v-list-item-icon class="pt-4">
                  <v-icon v-if="!downloadStatus['allSubjectsWithDemo']" color="msu">fa-clipboard-list</v-icon>
                  <v-icon v-if="downloadStatus['allSubjectsWithDemo'] === 'running'" color="msu">fa-redo fa-spin</v-icon>
                  <v-icon v-if="downloadStatus['allSubjectsWithDemo'] === 'error'" color="red">fa-ban</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Subject List, w/ demo</v-list-item-title>
                  <v-list-item-subtitle>Download CSV of all Subjects (SID + demo info only)</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-divider v-if="hasRole('admin, ra, ga')"></v-divider>
              <v-list-item
                v-if="hasRole('admin, ra, ga')"
                @click="batchConvert({type: 'tsv', caller: 'batchTsv'})"
                :disabled="downloadStatus['batchTsv'] === 'running'">
                <v-list-item-icon class="pt-4">
                  <v-icon v-if="!downloadStatus['batchTsv']" color="msu">fa-download</v-icon>
                  <v-icon v-if="downloadStatus['batchTsv'] === 'running'" color="msu">fa-redo fa-spin</v-icon>
                  <v-icon v-if="downloadStatus['batchTsv'] === 'error'" color="red">fa-ban</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Transcript Download - Tab</v-list-item-title>
                  <v-list-item-subtitle>Download ZIP of all transcripts w/ timestamps (TXT)</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-divider v-if="hasRole('admin, ra, ga')"></v-divider>
              <v-list-item
                v-if="hasRole('admin, ra, ga')"
                @click="batchConvert({type: 'tsv', caller: 'batchTsvRedacted', redact: true})"
                :disabled="downloadStatus['batchTsvRedacted'] === 'running'">
                <v-list-item-icon class="pt-4">
                  <v-icon v-if="!downloadStatus['batchTsvRedacted']" color="msu">fa-download</v-icon>
                  <v-icon v-if="downloadStatus['batchTsvRedacted'] === 'running'" color="msu">fa-redo fa-spin</v-icon>
                  <v-icon v-if="downloadStatus['batchTsvRedacted'] === 'error'" color="red">fa-ban</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Transcript Download - Tab (Redacted)</v-list-item-title>
                  <v-list-item-subtitle>Download ZIP of all transcripts w/ timestamps (TXT)</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-divider v-if="hasRole('admin, ra, ga')"></v-divider>
              <v-list-item
                v-if="hasRole('admin, ra, ga')"
                @click="batchConvert({type: 'csv', caller: 'batchCsv'})"
                :disabled="downloadStatus['batchCsv'] === 'running'">
                <v-list-item-icon class="pt-4">
                  <v-icon v-if="!downloadStatus['batchCsv']" color="msu">fa-download</v-icon>
                  <v-icon v-if="downloadStatus['batchCsv'] === 'running'" color="msu">fa-redo fa-spin</v-icon>
                  <v-icon v-if="downloadStatus['batchCsv'] === 'error'" color="red">fa-ban</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Transcript Download - CSV</v-list-item-title>
                  <v-list-item-subtitle>Download ZIP of all transcripts w/ timestamps (CSV)</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-divider v-if="hasRole('admin, ra, ga')"></v-divider>
              <v-list-item
                v-if="hasRole('admin, ra, ga')"
                @click="batchConvert({type: 'csv', caller: 'batchCsvRedacted', redact: true})"
                :disabled="downloadStatus['batchCsvRedacted'] === 'running'">
                <v-list-item-icon class="pt-4">
                  <v-icon v-if="!downloadStatus['batchCsvRedacted']" color="msu">fa-download</v-icon>
                  <v-icon v-if="downloadStatus['batchCsvRedacted'] === 'running'" color="msu">fa-redo fa-spin</v-icon>
                  <v-icon v-if="downloadStatus['batchCsvRedacted'] === 'error'" color="red">fa-ban</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Transcript Download - CSV (Redacted)</v-list-item-title>
                  <v-list-item-subtitle>Download ZIP of all transcripts w/ timestamps (CSV)</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-divider v-if="hasRole('admin, ra, ga')"></v-divider>
              <v-list-item
                v-if="hasRole('admin, ra, ga')"
                @click="batchConvert({type: 'tsv', caller: 'batchRaw', raw: true})"
                :disabled="downloadStatus['batchRaw'] === 'running'">
                <v-list-item-icon class="pt-4">
                  <v-icon v-if="!downloadStatus['batchRaw']" color="msu">fa-download</v-icon>
                  <v-icon v-if="downloadStatus['batchRaw'] === 'running'" color="msu">fa-redo fa-spin</v-icon>
                  <v-icon v-if="downloadStatus['batchRaw'] === 'error'" color="red">fa-ban</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Transcript Download - Data</v-list-item-title>
                  <v-list-item-subtitle>Download ZIP of all transcripts w/ timestamps (TXT, UUID-named)</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-divider></v-divider>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

</template>

<script>
/* eslint-disable */
import axios from 'axios';
import qs from 'qs';
import { authComputed, appComputed } from '@/store/helpers';
import feathersClient from '@/plugins/feathers-client';


export default {
  page() {
    return {
      title: `Reports | Admin | ${this.$appStrings('appName')}`,
      meta: [
        {
          name: 'description',
          content: 'Admin - Reports List',
        },
      ],
    };
  },
  data() {
    return {
      downloadStatus: {
        allDiaries: false,
        allSubjectsWithDemo: false,
        batchCsv: false,
        batchTsv: false,
        batchRaw: false,
        batchCsvRedacted: false,
        batchTsvRedacted: false,
      },
    };
  },
  computed: {
    ...authComputed,
    ...appComputed,
  },
  methods: {
    generateReport(action) {
      feathersClient.service('reporting').create({ action });
    },
    setDownloading(report, status) {
      this.downloadStatus[report] = status;
    },
    downloadableReport(action, caller) {
      this.setDownloading(caller, 'running');
      axios.get('/api/reporting', {
        params: { action },
        headers: {
          Authorization: this.$store.state.auth.accessToken,
          // block cache as location doesn't change, but content can
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        responseType: 'arraybuffer',
      })
      .then((resp) => {
        var blob = new Blob([resp.data],{type:resp.headers['content-type']});
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.target = "_blank"
        link.download = resp.headers['x-filename'];
        link.click();
        setTimeout(() => {
          this.setDownloading(caller, false);
          Promise.resolve(true);
        }, 1000);
      })
      .catch((err) => {
        this.setDownloading(caller, 'error');
        console.log('err', err);
      });
    },
    batchConvert({type, caller, format = 'timestamps', redact = false, raw = false}) {
      this.setDownloading(caller, 'running');
      const options = {};
      options.redact = redact;
      options.raw = raw;
      if (type === 'tsv') {
        options.delimiter = '\t';
        options.quote = '';
      }

      if (format === 'text') {
        options.header = false;
        options.fields = [ 
          {
            label: '-- transcript --',
            value: 'content'
          }
        ];
      } else {
        options.header = true;
        options.fields = [
          {
            label: 'Speaker',
            value: 'metadata.speaker'
          },
          {
            label: 'Header2',
            value: 'metadata.header2'
          },
          {
            label: 'Chunk_Start',
            value: 'startTime'
          },
          {
            label: 'Chunk_End',
            value: 'endTime'
          },
          {
            label: 'Chunk',
            value: 'content'
          },
        ];
      }
      axios.get(`/api/transcriptions/batchDownload/${type}`, {
        params: options,
        paramsSerializer: params => {
          return qs.stringify(params)
        },
        headers: {
          Authorization: this.$store.state.auth.accessToken,
          // block cache as location doesn't change, but content can
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        responseType: 'arraybuffer',
      })
      .then((resp) => {
        var blob = new Blob([resp.data],{type:resp.headers['content-type']});
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.target = "_blank"
        link.download = resp.headers['x-filename'];
        link.click();
        setTimeout(() => {
          this.setDownloading(caller, false);
          Promise.resolve(true);
        }, 1000);
      })
      .catch((err) => {
        this.setDownloading(caller, 'error');
        console.log('err', err);
      });
    },
  },
};
</script>
