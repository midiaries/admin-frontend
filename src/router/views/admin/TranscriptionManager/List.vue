<template>
  <v-container fluid v-if="isAuthenticated">
    <v-row class="justify-center">
      <v-col cols="12" sm="11">
        <v-data-table
          :headers="[
            {text: 'S', value: 'diaryMetadata.editingStatus', width: '80px', align: 'center', sortable: false},
            {text: 'SID', value: 'shortcode', width: '155px', sortable: false},
            {text: 'Transcription', value: 'dateCode', width: '170px', sortable: false},
            {text: 'Validate', value: 'checker', width: '140px', align: 'center', sortable: false},
            {text: 'Status?', value: 'status', align: 'center', sortable: false},
            {text: 'Locking', value: 'metadata.locked', width: '100px', align: 'center', sortable: false},
            {text: 'Link', value: 'actions', align: 'end', sortable: false},
            {text: 'Hide', value: 'hidden', width: '75px', sortable: false},
          ]"
          :items="reportData"
          :server-items-length="serverItemsLength"
          :hide-default-header="reportData.length === 0"
          :options.sync="tableOptions"
          :footer-props="{
            itemsPerPageOptions: [5,10,15,25,50,100],
            showFirstLastPage: true,
            disablePagination: serverItemsLength <= tableOptions.itemsPerPage,
          }"
          :fixed-header="true"
          :loading="isProcessing"
          loading-text="Loading Transcriptions..."
          :sortable="false"
          :multi-sort="false"
          height="70vh"
          class="elevation-1">
            <template v-slot:top>
              <span>
                <v-toolbar flat class="msu dark-grey text-center white--text" height="80x">
                  <v-toolbar-title>
                    <h3>Transcription List</h3>
                  </v-toolbar-title>
                  <v-row class="justify-left">
                    <v-col cols="4" sm="6">
                      <v-text-field
                        v-model="searchString"
                        @change="getTranscriptionsList(searchString)"
                        label="Filter (SID, Date, etc)"
                        solo
                        dense
                        class="mt-7 mx-4"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="2" sm="1">
                        <v-checkbox
                          v-model="completedOnly"
                          @change="getTranscriptionsList(searchString)"
                          :hide-details="false"
                          :persistent-hint="true"
                          hint="Comp Only"
                          color="white"
                          dense
                          base-color="white"
                          class="pt-6 white--text">
                        </v-checkbox>
                    </v-col>
                    <v-col cols="2" sm="1">
                        <v-checkbox
                          v-model="includeLocked"
                          @change="getTranscriptionsList(searchString)"
                          :hide-details="false"
                          :persistent-hint="true"
                          hint="Show Locked"
                          color="white"
                          dense
                          base-color="white"
                          class="pt-6 white--text">
                        </v-checkbox>
                    </v-col>
                    <v-col cols="2" sm="1">
                        <v-checkbox
                          v-model="includeHidden"
                          @change="getTranscriptionsList(searchString)"
                          :hide-details="false"
                          :persistent-hint="true"
                          hint="Show Hidden"
                          color="white"
                          dense
                          base-color="white"
                          class="pt-6 white--text">
                        </v-checkbox>
                    </v-col>
                  </v-row>
                </v-toolbar>
              </span>
            </template>
            <template v-slot:item.hidden="{ item }">
<!--               <v-icon small class="black--text">
                {{ (item.hidden) ? 'fa-eye-slash' : '' }}
              </v-icon> -->
              <v-checkbox
                v-model="item.hidden"
                @change="toggleHidden(item)"
                :hide-details="true"
                dense
                class="pb-1">
              </v-checkbox>
            </template>
            <template v-slot:item.diaryMetadata.editingStatus="{ item }">
              <span class="mr-1" v-if="item.diaryMetadata">
                <v-icon small class="black--text" v-if="item.metadata.locked">
                  fa-lock
                </v-icon>
                <v-icon small color="msu" class="white--text" v-else-if="item.diaryMetadata.editingStatus === 'Completed'">
                  fa-check
                </v-icon>
                <v-icon small color="msu dark-grey" class="white--text" v-else-if="item.diaryMetadata.editingStatus === 'In Progress'">
                  fa-pencil-alt
                </v-icon>
                <v-icon small color="msu light-grey" class="white--text" v-else>
                  fa-check
                </v-icon>
              </span>
              <span class="mr-1" v-else>
                <v-icon small color="red" class="white--text">
                  fa-times
                </v-icon>
              </span>
              <span class="ml-1">
                <v-icon small color="msu" class="white--text" v-if="item.passing && !item.metadata.hasChanged">
                  fa-check-double
                </v-icon>
                <v-icon small color="msu accent-dark-blue" class="white--text" v-else-if="item.passing && item.metadata.hasChanged">
                  fa-question
                </v-icon>
                <v-icon small color="red" class="white--text ml-1" v-else-if="item.hasErrors">
                  fa-times
                </v-icon>
                <v-icon small color="msu accent-orange" class="white--text ml-1" v-else-if="!item.hasErrors && item.hasWarnings">
                  fa-triangle-exclamation
                </v-icon>
                <v-icon small color="msu light-grey" class="white--text" v-else>
                  fa-check-double
                </v-icon>
              </span>
            </template>
            <template v-slot:item.dateCode="{ item }">
              {{ item.diaryMetadata ? `${item.diaryMetadata.diaryDate} #${item.diaryMetadata.sequence} T${item.revision}` : 'NO RECORDING?' }}
            </template>
            <template v-slot:item.status="{ item }">
              <span v-if="item.status === 99">
                <span v-if="analysisStatus[item.id]">
                  <v-chip class="msu light-grey black--text font-weight-bold" small>
                    Checking...
                  </v-chip>
                </span>
                <span v-else>
                  <v-chip :class="item.analysisBtn.class" small>
                    {{ item.analysisBtn.text }}
                  </v-chip>
                </span>
              </span>
            </template>
            <template v-slot:item.metadata.locked="{ item }">
              <v-btn
                v-if="!item.subjectMetadataCoded"
                x-small
                color="msu accent-orange white--text"
                @click="showSubjectDetail(item)">
                Coding
              </v-btn>
              <v-btn
                v-else-if="!(item.subjectMetadataCoded.birthYear && item.subjectMetadataCoded.gender)"
                x-small
                color="msu accent-orange white--text"
                @click="showSubjectDetail(item)">
                Coding
              </v-btn>
              <span v-else-if="item.passing && !item.metadata.hasChanged && (item.diaryMetadata && item.diaryMetadata.editingStatus && item.diaryMetadata.editingStatus == 'Completed')">
                <v-btn
                  x-small
                  class="controls-row"
                  @click.stop="item.processingJobCount != 0 ? null : toggleLocked(item)"
                  :disabled="item.processingJobCount != 0"
                  color="msu light-grey"
                  style="width: 65px;">
                  {{ !item.metadata.locked ? 'Lock' : item.processingJobCount ? 'In Use' : 'Unlock' }}
                </v-btn>
              </span>
            </template>
            <template v-slot:item.checker="{ item }">
              <span v-if="!item.metadata">
                NO METADATA?
              </span>
              <v-btn
                v-else
                x-small
                class="controls-row"
                @click.stop="item.metadata.locked ? null : checkForErrors(item.id)"
                :loading="analysisStatus[item.id]"
                :disabled="analysisStatus[item.id] || item.metadata.locked"
                color="msu light-grey">
                {{ item.passing ? 'recheck' : 'check' }}
              </v-btn>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                x-small
                color="msu white--text"
                @click="showDiaryDetail(item)">
                Recording
              </v-btn>
            </template>
            <template v-slot:footer.prepend v-if="hasRole('admin, transcriptManager')">
              <v-btn
                small
                @click.stop="getTranscriptionsList(searchString)"
                :loading="isProcessing"
                :disabled="isProcessing"
                color="msu light-grey"
                class="ml-5">
                Refresh
                <v-icon small right>fa-refresh</v-icon>
              </v-btn>
              <v-btn
                small
                @click.stop="validateCurrentPageItems()"
                :loading="isProcessing"
                :disabled="isProcessing"
                color="msu light-grey"
                class="ml-5">
                Validate Page
                <v-icon small right>fa-check-double</v-icon>
              </v-btn>
            </template>
            <template v-slot:no-data>
               No Transcriptions to show
            </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/* eslint-disable */
import { authComputed, appComputed, userComputed } from '@/store/helpers';
import feathersClient from '@/plugins/feathers-client';


export default {
  name: 'sentence-search',
  page() {
    return {
      title: `Transcription Manager | Admin | ${this.$appStrings('appName')}`,
      meta: [
        {
          name: 'description',
          content: 'Transcription Manager - List',
        },
      ],
    };
  },
  data() {
    return {
      searchString: null,
      analysisStatus: {},
      reportData: [],
      serverItemsLength: 0,
      tableOptions: {
        sortDesc: [false],
        itemsPerPage: 15,
        page: 1,
      },
      isProcessing: false,
      completedOnly: true,
      includeLocked: false,
      includeHidden: false,
    };
  },
  computed: {
    ...authComputed,
    ...appComputed,
    ...userComputed,
  },
  methods: {
    async getTranscriptionsList(data) {
      this.isProcessing = true;
      this.reportData = await feathersClient.service('transcriptionManager').create({
          action: "list",
          searchString: data,
          params: {
            completedOnly: this.completedOnly,
            includeLocked: this.includeLocked,
            includeHidden: this.includeHidden,
            limit: this.tableOptions.itemsPerPage,
            skip: this.tableOptions.itemsPerPage * ((this.tableOptions.page || 1) - 1)
          },
        })
        .then((resp) => {
          this.serverItemsLength = resp.serverItemsLength;
          const ret = [];
          for (const t of resp.data) {
            ret.push(new this.$FeathersVuex.api.Transcription(t));
          }
          return ret;
        })
        .catch((err) => {
          return [];
        })
        .finally(() => {
          this.isProcessing = false;
        })
    },
    checkForErrors(transcriptId) {
      this.$set(this.analysisStatus, transcriptId, true);
      feathersClient.service('transcriptMaintenance').create({
        action: 'checkForErrors',
        id: transcriptId,
      })
      .catch((err) => { console.log('analysis err', err); })
      .finally(() => {
        this.$set(this.analysisStatus, transcriptId, false);
      });
    },
    validateCurrentPageItems() {
      if (this.reportData && this.reportData.length) {
        for (const t of this.reportData) {
          if (t && t.id) {
            this.checkForErrors(t.id);
          }
        }
      }
    },
    toggleLocked(transcript) {
      const clone = transcript.clone();
      clone.metadata.locked = !clone.metadata.locked;
      clone.commit();
      clone.save();
      this.getTranscriptionsList(this.searchString);
    },
    toggleHidden(transcript) {
      const clone = transcript.clone();
      clone.hidden = clone.hidden != 0;
      clone.commit();
      clone.save();
      this.getTranscriptionsList(this.searchString);
    },
    showDiaryDetail(obj) {
      let routeData = this.$router.resolve({ name: 'adminDiaryDetails', params: { id: obj.diaryId } });
      window.open(routeData.href, '_blank');
    },
    showSubjectDetail(obj) {
      let routeData = this.$router.resolve({ name: 'adminSubjectDetails', params: { id: obj.subjectId } });
      window.open(routeData.href, '_blank');
    },
  },
  watch: {
    tableOptions(val, oldVal) {
      if (val && val !== oldVal) {
        this.getTranscriptionsList(this.searchString);
      }
    },
  },
};
</script>

<style lang="scss">
  .v-messages__message {
      color: white !important;
      font-weight: bold;
  }
</style>
