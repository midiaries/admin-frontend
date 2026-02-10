<template>
  <v-container fluid v-if="isAuthenticated && isElevated">
    <v-row justify="center">
      <v-col cols="12" sm="11">
        <v-data-table
          :headers="[
            {text: 'SID', value: 'subjectId', align: 'left'},
            {text: 'Name', value: 'Name', align: 'left'},
            {text: 'Email', value: 'email', align: 'left'},
            {text: 'Category', value: 'subjectMetadata.participant_category', align: 'left'},
            {text: '# Diaries', value: 'diaryCount', align: ($vuetify.breakpoint.smAndDown) ? ' d-none' : 'center'},
            {text: 'Total (min)', value: 'diaryLengthTotal', align: 'right'},
            {text: 'Qualifies?', value: 'shouldBePaid', align: 'center', sortable: false},
            {text: 'Opt?', value: 'subjectMetadata.payment_optout', align: ($vuetify.breakpoint.smAndDown) ? ' d-none' : 'center'},
            {text: '$ To', value: 'paymentGroup'},
          ]"
          :items="reportData"
          :search="localSearch"
          :hide-default-header="reportData.length === 0"
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
            <template v-slot:top>
              <span>
                <v-toolbar flat class="msu dark-grey text-center white--text">
                  <v-toolbar-title>
                    <h3>Report: Diary Durations</h3>
                  </v-toolbar-title>
                  <v-text-field
                    v-model="localSearch"
                    label="Search"
                    solo
                    dense
                    class="mt-7 mx-4"
                  ></v-text-field>
                  <v-spacer></v-spacer>
                  <h3>
                    Total: {{ Number(currentTotal).toFixed(0).toLocaleString() }} min
                  </h3>
                </v-toolbar>
                <v-toolbar flat class="text-center black--text mt-5">
                  <v-row>
                    <v-col cols="12" sm="10" md="6" lg="5">
                      <v-autocomplete
                        v-model="selectedDiaryPayPeriodId"
                        :readonly="isFindDiaryPayPeriodsPending || !availableDiaryPayPeriods.length"
                        :disabled="isFindDiaryPayPeriodsPending || !availableDiaryPayPeriods.length"
                        name="diaryPayPeriods"
                        ref="diaryPayPeriods"
                        :label="showHiddenDiaryPayPeriods ? 'Pay Periods (all)' : 'Pay Periods (active only)'"
                        :items="availableDiaryPayPeriods"
                        :filter="filterAll"
                        item-value="id"
                        dense
                        outlined
                        :persistent-hint="true"
                        hint=" "
                        :menu-props="{ auto: true }"
                        :loading="isFindDiaryPayPeriodsPending"
                        @change="updateSelectedDiaryPayPeriodId"
                        autocomplete="nope">
                        <template v-slot:message>
                          <a @click.stop="toggleHiddenDiaryPayPeriods"
                          class="text-body-3 black--text font-weight-bold text-decoration-underline">
                            {{ showHiddenDiaryPayPeriods ? 'Switch to only active periods' : 'Switch to all periods'}}
                          </a>
                        </template>
                        <template v-slot:item="{ item }">
                          {{ item.id === '-1' ? 'ALL DATES' : `${item.startDate} to ${item.endDate} (${item.goal}min)` }}
                        </template>
                        <template v-slot:selection="{ item }">
                          {{ item.id === '-1' ? 'ALL DATES' : `${item.startDate} to ${item.endDate} (${item.goal}min)` }}
                        </template>
                      </v-autocomplete>
                    </v-col>
                  </v-row>
                </v-toolbar>
              </span>
            </template>
            <template v-slot:item.diaryLengthTotal="{ item }">
              <span class="font-weight-bold">
                {{ (item.diaryLengthTotal || 0).toFixed(1) }}
              </span>
            </template>
            <template v-slot:item.subjectMetadata.participant_category="{ item }">
              {{ (item.subjectMetadata.participant_category)
                ? typeof item.subjectMetadata.participant_category === 'object'
                  ? item.subjectMetadata.participant_category.join(', ')
                  : item.subjectMetadata.participant_category
                : '' }}
            </template>
            <template v-slot:item.shouldBePaid="{ item }">
              <v-icon :color="((item.diaryLengthTotal || 0).toFixed(1) >= Number(selectedDiaryPayPeriod.goal || 0)) ? 'msu' : 'msu accent-orange'">
                {{ ((item.diaryLengthTotal || 0).toFixed(1) >= Number(selectedDiaryPayPeriod.goal || 0)) ? 'far fa-laugh-beam' : 'far fa-sad-cry' }}
              </v-icon>
            </template>
            <template v-slot:item.subjectMetadata.payment_optout="{ item }">
              <v-icon :color="(item.subjectMetadata.payment_optout) ? 'red' : 'msu'">
                {{ (item.subjectMetadata.payment_optout) ? 'fa-ban' : 'fa-money-bill-wave' }}
              </v-icon>
            </template>
            <template v-slot:no-data v-if="!selectedDiaryPayPeriodId">
               Please choose a Pay Period above to get started
            </template>
            <template v-slot:no-data v-else>
               No Diaries for this range
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
import { authComputed, appComputed, userComputed } from '@/store/helpers';
import feathersClient from '@/plugins/feathers-client';


export default {
  mixins: [
    makeFindMixin({ service: 'diaryPayPeriods', watch: true }),
  ],
  name: 'duration-summaries',
  page() {
    return {
      title: `Diary Times | Reports | ${this.$appStrings('appName')}`,
      meta: [
        {
          name: 'description',
          content: 'Reports - Diary Duration Summaries',
        },
      ],
    };
  },
  data() {
    return {
      selectedDiaryPayPeriod: () => {
        return {
          id: '-1',
          startDate: '',
          endDate: '',
          goal: 15,
        };
      },
      selectedDiaryPayPeriodId: '',
      showHiddenDiaryPayPeriods: false,
      isInitDone: false,
      localSearch: '',
      tableOptions: {
        sortBy: ['subjectId'],
        sortDesc: [false],
        itemsPerPage: 15,
        page: 1,
      },
      currentTotal: 0.0,
    };
  },
  computed: {
    ...authComputed,
    ...appComputed,
    ...userComputed,
    diaryPayPeriodsParams() {
      const query = { active: 1, $sort: { startDate: 1, endDate: 1 }, $limit: 99999 };
      if (this.showHiddenDiaryPayPeriods) {
        delete query.active;
      }
      return { query };
    },
    availableDiaryPayPeriods() {
      let ret = [];
      if (this.diaryPayPeriods && this.diaryPayPeriods.length) {
        ret = [
          {
            id: '-1',
            startDate: '',
            endDate: '',
            goal: 15,
          },
          ...this.diaryPayPeriods,
        ];
      }
      return ret;
    },
  },
  asyncComputed: {
    reportData: {
      get() {
        if (this.isInitDone) {
          return feathersClient.service('reporting').create({
            action: "reports:durationSummary",
            date1: this.selectedDiaryPayPeriod.startDate,
            date2: this.selectedDiaryPayPeriod.endDate,
            params: {
                returnSums: true
            },
          });
        } else {
          return [];
        }
      },
      default: [],
    },
  },
  methods: {
    updateSelectedDiaryPayPeriodId(id) {
      if (id) {
        this.$store.dispatch('view/set', {
          "reports:durationSummary:selectedDiaryPayPeriodId": id
        }, { root: true });
      }
    },
    toggleHiddenDiaryPayPeriods() {
      this.showHiddenDiaryPayPeriods = !this.showHiddenDiaryPayPeriods;
      this.$store.dispatch('view/set', {
        "reports:durationSummary:showHiddenDiaryPayPeriods": this.showHiddenDiaryPayPeriods
      }, { root: true });
    },
    filterAll(item, queryText) {
      return (
        item.startDate.toLocaleLowerCase().indexOf(queryText.toLocaleLowerCase()) > -1
        || item.endDate.toLocaleLowerCase().indexOf(queryText.toLocaleLowerCase()) > -1
      );
    },
  },
  watch: {
    selectedDiaryPayPeriodId(val) {
      if (val) {
        if (this.availableDiaryPayPeriods.length) {
          this.selectedDiaryPayPeriod = this.availableDiaryPayPeriods.find(dpp => dpp.id === val);
        } else {
          if (val !== '-1' && val) {
          this.$FeathersVuex.api.DiaryPayPeriod.get(val)
            .then((resp) => {
              this.selectedDiaryPayPeriod = resp;
            });
          }
        }
      }
    },
    selectedDiaryPayPeriod(item) {
      if (item && !this.isInitDone) {
        this.isInitDone = true;
      }
    },
    reportData(items) {
      if (items) {
        this.currentTotal = items.reduce((acc, val) => {
          acc += val.diaryLengthTotal;
          return acc;
        }, 0);
      }
    }
  },
  mounted() {
    this.showHiddenDiaryPayPeriods = this.viewPreferences('reports:durationSummary:showHiddenDiaryPayPeriods');
    this.selectedDiaryPayPeriodId = this.viewPreferences('reports:durationSummary:selectedDiaryPayPeriodId');
    if (this.selectedDiaryPayPeriodId === '-1') {
      this.isInitDone = true;
    }
  },
};
</script>
