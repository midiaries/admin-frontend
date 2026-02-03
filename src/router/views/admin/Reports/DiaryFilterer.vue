<template>
  <v-container fluid v-if="isAuthenticated && isElevated">
    <v-row class="justify-center">
      <v-col cols="12" sm="11">
        <v-data-table
          :headers="[
            {text: 'SID', value: 'subjectId', align: 'left', width: '135px'},
            {text: 'Date', value: 'metadata.diaryDate', align: 'left', width: '175px'},
            {text: 'Category', value: 'subjectMetadata.participant_category', align: 'left'},
            {text: 'Duration', value: 'metadata.duration', align: 'left', width: '125px'},
            {text: 'SID Total', value: 'subjectTotalDuration', align: 'left', width: '155px'},
            {text: '', value: 'actions'},
          ]"
          :items="reportData"
          :hide-default-header="reportData.length === 0 || isSearchRunning"
          :options.sync="tableOptions"
          :footer-props="{
            itemsPerPageOptions: [5,10,15,25,50,100,-1],
            showFirstLastPage: true,
            disablePagination: reportData.length <= tableOptions.itemsPerPage,
          }"
          :fixed-header="true"
          :multi-sort="true"
          height="65vh"
          class="elevation-1">
            <template v-slot:top="{ pagination, options, updateOptions }">
              <span>
                <v-toolbar flat class="msu dark-grey text-center white--text" height="80x">
                  <v-toolbar-title>
                    <h3>Filter Clogger</h3>
                  </v-toolbar-title>
                  <v-row class="justify-right">
                  <!---
                    <v-col cols="6" sm="8">
                      <v-text-field
                        v-model="searchString"
                        @change="(searchString && searchString.length >= 3) ? getReportData(searchString) : isInitDone = false"
                        label="Seach query"
                        :hint="regexSearch ? 'RegEx, don\'t need the `/ /g`' : 'Seach query (boolean mode +/-/*, 3+ chars)'"
                        :persistent-hint="true"
                        solo
                        dense
                        class="mt-7 mx-4"
                      ></v-text-field>
                    </v-col>
                  --->
                  </v-row>
                  <v-icon class="white--text font-weight-bold" large>
                    {{ searchIcon }}
                  </v-icon>
                </v-toolbar>
                <v-expansion-panels class="pb-1" v-model="filterBarToOpen">
                  <v-expansion-panel value="filters" multiple>
                    <v-expansion-panel-header v-slot="{ open }">
                      <v-row no-gutters>
                        <v-col cols="3">
                          Advanced Search Options
                        </v-col>
                        <v-col
                          cols="8"
                          class="text--secondary">
                          <v-fade-transition leave-absolute>
                            <span v-if="open">Filter the search if you want</span>
                            <v-row
                              v-else
                              no-gutters
                              style="width: 100%">
                              <v-col cols="7">
                                Options = {{ currentOptions || 'Not set' }}
                              </v-col>
                            </v-row>
                          </v-fade-transition>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <v-card class='pa-5 elevation-0'>
                        <v-row>
                          <!-- <v-col cols="12" sm="4">
                            <v-switch
                              label="Search with Regular Expressions?"
                              v-model="regexSearch"
                              @change="getReportData()"
                              :hide-details="true"
                              color="msu"/>
                          </v-col> -->
                          <v-col cols="12" sm="4">
                            <v-switch
                              label="Only return Completed diaries?"
                              v-model="completedOnly"
                              @change="getReportData()"
                              :hide-details="true"
                              color="msu"/>
                          </v-col>
                          <v-col cols="6" sm="4">
                            <v-text-field
                              v-model="minDiaryDuration"
                              type="number"
                              label="Min. Length - Each"
                              clearable
                              @click:clear="getReportData()"
                              @change="getReportData()"
                            />
                          </v-col>
                          <v-col cols="6" sm="4">
                            <v-text-field
                              v-model="minDiaryTotal"
                              type="number"
                              label="Min. Length - SID Total"
                              clearable
                              @click:clear="getReportData()"
                              @change="getReportData()"
                            />
                          </v-col>
                          <!-- <v-col cols="12" sm="4">
                            <v-switch
                              label="Return All (No query ok)"
                              v-model="returnAll"
                              @change="getReportData(null)"
                              :hide-details="true"
                              color="msu"/>
                          </v-col> -->
                        </v-row>
                        <v-row>
                          <!-- <v-col cols="12" sm="6">
                            <v-text-field
                              v-model="subjectIdFilter"
                              label="Subject ID"
                              clearable
                              @change="getReportData()"
                              placeholder="adding - in front will ignore; e.g. -261,120"
                            />
                          </v-col> -->
                          <v-col cols="12" sm="6">
                            <v-select
                              v-model="genderFilter"
                              :items="['M', 'F', 'X']"
                              label="Gender"
                              clearable
                              @change="getReportData()"
                              multiple
                            />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-select
                              v-model="categoryFilter"
                              :items="['Kid', 'Teen', 'Adult']"
                              label="Participant Category"
                              clearable
                              @change="getReportData()"
                              multiple
                            />
                          </v-col>
                          <!---
                          <v-col cols="12">
                            <v-select
                              v-model="ageComparator"
                              :items="['<', '=', '>', 'Between']"
                              label="Comparator"/>
                          </v-col>
                          <v-col cols="6">
                            <v-text-field
                              v-model="ageFilter"
                              label="Age"
                              type="number"/>
                          </v-col>
                          <v-col cols="6">
                            <v-text-field
                              v-model="ageFilter2"
                              label="Age2"
                              type="number"/>
                          </v-col>
                          --->
                        </v-row>
                      </v-card>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </span>
              <v-data-footer v-if="reportData.length !== 0 && !isSearchRunning"
                :itemsPerPageOptions="[5,10,15,25,50,100,-1]"
                :showFirstLastPage="true"
                :disablePagination="reportData.length <= tableOptions.itemsPerPage"
                :pagination="pagination"
                :options="options"
                @update:options="updateOptions"
                items-per-page-text="$vuetify.dataTable.itemsPerPageText"/>
            </template>
            <template v-slot:body v-if="isSearchRunning">
              <tr class="v-data-table__empty-wrapper" style="font-weight: bold; font-size: 0.875rem; height: 88px;">
                <td colspan="7">
                  <div>
                    Unclogging filters..
                  </div>
                </td>
              </tr>
            </template>
            <template v-slot:item.subjectMetadata.participant_category="{ item }">
              {{ (item && item.subjectMetadata && item.subjectMetadata.participant_category)
                ? typeof item.subjectMetadata.participant_category === 'object'
                  ? item.subjectMetadata.participant_category.join(', ')
                  : item.subjectMetadata.participant_category
                : '' }}
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                small
                color="msu white--text"
                @click="showDiaryDetail(item)">
                View
              </v-btn>
            </template>
            <template v-slot:item.metadata.diaryDate="{ item }">
              {{ item.metadata.diaryDate }} #{{item.metadata.sequence.toString().padStart(2, 0) }}
            </template>
            <template v-slot:item.metadata.duration="{ item }">
              {{ toSexagesimal((item.metadata.duration) ? item.metadata.duration : 0, 'seconds') }}
            </template>
            <template v-slot:item.subjectTotalDuration="{ item }">
              {{ toSexagesimal((item.subjectTotalDuration) ? item.subjectTotalDuration : 0, 'seconds') }}
            </template>
            <template v-slot:no-data v-if="!searchString || searchString.length <= 3 || !isInitDone">
               Please enter search terms to get started
            </template>
            <template v-slot:no-data v-else>
               Dear diary... there's nothing here
            </template>
            <template v-slot:footer.prepend>
              <v-btn
                small
                @click.stop="generateDownload({ type: 'xls' })"
                :loading="isDownloading"
                :disabled="isDownloading || fileDownloadBtn.disabled || reportData.length === 0"
                :color="fileDownloadBtn.color"
                class="ml-5">
                {{ fileDownloadBtn.text }}
                <v-icon small right v-html="fileDownloadBtn.icon"></v-icon>
              </v-btn>
            </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/* eslint-disable */
import { mapGetters, mapActions } from 'vuex';
import { makeFindMixin, makeGetMixin } from 'feathers-vuex';
import * as excel from 'xlsx';
import { authComputed, appComputed, userComputed } from '@/store/helpers';
import feathersClient from '@/plugins/feathers-client';
import formatters from '@/mixins/formatters';


export default {
  name: 'diary-filter-feeder',
  page() {
    return {
      title: `Diary Filterer | Reports | ${this.$appStrings('appName')}`,
      meta: [
        {
          name: 'description',
          content: 'Reports - Diary Filterer',
        },
      ],
    };
  },
  mixins: [
    formatters,
  ],
  data() {
    return {
      filterBarToOpen: 0,
      subjectIdFilter: '',
      genderFilter: [],
      ageFilter: null,
      ageFilter2: null,
      ageComparator: '',
      categoryFilter: ['Kid', 'Teen', 'Adult'],
      isInitDone: false,
      searchString: '',
      isSearchRunning: false,
      searchIcon: '',
      localSearch: '',
      reportData: [],
      tableOptions: {
        sortBy: ['subjectId', 'metadata.diaryDate', 'startTime', 'endTime'],
        sortDesc: [false, false, false, false],
        itemsPerPage: 25,
        page: 1,
      },
      fileDownloadBtn: {
        text: 'Download',
        icon: 'fa-cloud-download-alt',
        disabled: false,
      },
      isDownloading: false,
      isCompleted: false,
      maxResults: 2500,
      completedOnly: true,
      regexSearch: false,
      minDiaryDuration: 5,
      minDiaryTotal: 30,
      returnAll: false,
    };
  },
  computed: {
    ...authComputed,
    ...appComputed,
    ...userComputed,
    currentOptions() {
      const ret = [];

      ret.push(this.regexSearch ? 'RegEx' : null);
      ret.push(this.genderFilter.length ? `Gender: only ${this.genderFilter.filter(Boolean).join(',')}` : null);
      ret.push(this.subjectIdFilter ? `SID: ${this.subjectIdFilter}` : null);
      ret.push(this.minDiaryDuration ? `Len: >${this.minDiaryDuration}` : null);
      ret.push(this.minDiaryTotal ? `Tot: >${this.minDiaryTotal}` : null);
      ret.push(this.completedOnly ? 'Completed' : null);
      ret.push(this.returnAll ? 'Get All' : null);

      return ret.filter(Boolean).join(', ');
    },
  },
  methods: {
    async getReportData(data) {
      this.isInitDone = true;
      this.isSearchRunning = true;
      this.searchIcon = "fas fa-face-flushed fa-spin"
      this.reportData = await feathersClient.service('reporting').create({
          action: "reports:diaryFilterer",
          searchString: data,
          params: {
            completedOnly: this.completedOnly,
            regexSearch: this.regexSearch,
            genderFilter: this.genderFilter,
            subjectIdFilter: this.subjectIdFilter,
            categoryFilter: this.categoryFilter,
            minDiaryDuration: this.minDiaryDuration,
            minDiaryTotal: this.minDiaryTotal,
            returnAll: this.returnAll,
          },
        })
        .then((resp) => {
          this.isSearchRunning = false;
          this.searchIcon = resp.length ? "fas fa-face-surprise" : "fas fa-face-sad-cry"
          return resp;
        })
        .catch((err) => {
          this.isSearchRunning = false;
          this.searchIcon = "fas fa-face-dizzy"
          return [];
        })
    },
    showDiaryDetail(obj) {
      let routeData = this.$router.resolve({ name: 'adminDiaryDetails', params: { id: obj.diaryId } });
      window.open(routeData.href, '_blank');
    },
    generateDownload({
      type = 'csv',
      filename = `${this.$appStrings('subjectPrefix')} filtered ${new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000).toISOString().substr(0, 10)} - min${this.minDiaryDuration || 0}-tot${this.minDiaryTotal || 0}${this.completedOnly ? ' comp only' : ''}`
      }) {
      const ret = [];
      const headers = [
        'SID',
        'Diary',
        'Duration',
        'Subject Total',
        'Completed',
        'Category',
        'link',
      ];
      ret.push(headers);
      const sortedReportData = this.reportData.sort((a,b) => a.subjectId.localeCompare(b.subjectId))
      for (const reportLine of sortedReportData) {
        const reportLineLink = this.$router.resolve({ name: 'adminDiaryDetails', params: { id: reportLine.diaryId } });
        ret.push([
          reportLine.subjectId,
          `${reportLine.metadata.diaryDate} #${reportLine.metadata.sequence.toString().padStart(2, 0)}`,
          reportLine.metadata.duration,
          reportLine.subjectTotalDuration,
          reportLine.metadata.editingStatus,
          reportLine.subjectMetadata.participant_category,
          `${this.$appStrings('appUrl')}${reportLineLink.href}`,
        ]);
      }
      const ws = excel.utils.aoa_to_sheet(ret);
      const wb = excel.utils.book_new();
      excel.utils.book_append_sheet(wb, ws, 'output');
      excel.writeFile(wb, `${filename}.${type}`);
    },
  },
  mounted() {
    this.getReportData();
  },
};
</script>

<style lang="scss">
  .v-messages__message {
      color: white !important;
      font-weight: bold;
  }
</style>
