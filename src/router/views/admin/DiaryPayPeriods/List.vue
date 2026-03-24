<template>
  <v-container fluid>
    <v-row justify="center" align="center" class="available-diaryPayPeriods">
      <v-col cols="12" sm="10">
        <v-data-table
          :headers="[
            {text: 'Start', value: 'startDate', width: '20vw'},
            {text: 'End', value: 'endDate', width: '20vw'},
            {text: 'Goal (min)', value: 'goal', width: '10vw', sortable: false},
            {text: 'Visible?', value: 'active', width: '10vw', align: 'left', sortable: false},
            {text: '', value: 'actions', align: 'end', sortable: false},
          ]"
          :options.sync="tableOptions"
          :footer-props="{
            itemsPerPageOptions: [5,10,15,25,50,100,-1],
            showFirstLastPage: true,
            disablePagination: diaryPayPeriodsParams.query.$limit === 0
          }"
          :fixed-header="true"
          :items="diaryPayPeriods"
          :loading="isFindDiaryPayPeriodsPending"
          :search="localSearch"
          :multi-sort="true"
          :hide-default-header="diaryPayPeriods.length === 0"
          height="70vh"
          class="elevation-1">
          <template v-slot:progress>
            <v-progress-linear indeterminate color="msu"></v-progress-linear>
          </template>
          <template v-slot:top>
            <ValidationObserver ref="editorObserver" v-slot="{ invalid, validate }">
              <v-toolbar flat class="msu dark-grey text-center white--text">
                <v-toolbar-title>
                  <h3>Recording Periods</h3>
                </v-toolbar-title>
                <v-text-field
                  v-model="localSearch"
                  label="Search"
                  solo
                  dense
                  class="mt-7 mx-4"
                ></v-text-field>
                <v-dialog
                  v-model="showEditor"
                  width="50%"
                  :fullscreen="$vuetify.breakpoint.xs"
                  persistent
                  scrollable
                  :transition="($vuetify.breakpoint.xs) ? 'dialog-bottom-transition' : 'fade-transition'">
                  <FeathersVuexFormWrapper :item="editedObj" ref="userForm" watch>
                    <template v-slot="{ clone, save, reset, isDirty }">
                      <v-card>
                        <v-card-title class="msu dark-grey text-center white--text">
                          <span class="text-h5">{{ editorTitle }}</span>
                          <v-spacer></v-spacer>
                          <v-icon class="white--text">far fa-calendar-alt</v-icon>
                        </v-card-title>
                        <v-card-text>
                          <v-container>
                            <EditorDiaryPayPeriod
                              :clone="clone"
                              :isDirty="isDirty"
                              :allowDelete="false"
                              :showControls="false"
                              :standalone="true">
                            </EditorDiaryPayPeriod>
                          </v-container>
                        </v-card-text>

                        <v-card-actions>
                          <v-spacer></v-spacer>
                          <v-btn @click="reset(); clearObjDialog();">Cancel</v-btn>
                          <v-btn color="msu accent-green white--text" @click="validate().then(valid => valid ? save().then(obj => clearObjDialog(obj)) : null);">Save</v-btn>
                        </v-card-actions>
                      </v-card>
                    </template>
                  </FeathersVuexFormWrapper>
                </v-dialog>
                <v-spacer></v-spacer>
                <v-btn v-if="hasRole('admin, ra, ga') && $vuetify.breakpoint.mdAndUp" type="button" class="add-row mr-5" @click="addObj">
                  Add Recording Period
                </v-btn>
                <v-icon class="white--text">
                  {{ showHiddenDiaryPayPeriodsIcon }}
                </v-icon>
                <v-switch
                  v-model="showHiddenDiaryPayPeriods"
                  color="msu hover-1"
                  class="pt-5 mx-5">
                </v-switch>
              </v-toolbar>
            </ValidationObserver>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-icon
              v-if="hasRole('admin, ra, ga')"
              small
              class="mr-5"
              color="msu"
              @click="editObj(item)">
              fa-pencil-alt
            </v-icon>
            <v-icon
              v-if="hasRole('admin, ra, ga')"
              small
              class="mr-5"
              color="red"
              @click="removeObj(item)">
              fa-trash
            </v-icon>
          </template>
          <template v-slot:footer v-if="hasRole('admin, ra, ga') && $vuetify.breakpoint.smAndDown">
            <v-col cols="12" class="text-center">
              <v-btn type="button" small class="add-row" @click="addObj">
                Add Recording Period
              </v-btn>
            </v-col>
          </template>
          <template v-slot:item.active="{ item }">
            <FeathersVuexFormWrapper :item="item" :key="`${item.id}-active`" watch>
              <template v-slot="{ clone, save }">
                <v-checkbox
                  v-model="clone.active"
                  name="active"
                  dense
                  :readonly="!hasRole('admin, ra, ga')"
                  :disabled="!hasRole('admin, ra, ga')"
                  :hide-details="true"
                  @change="clone.commit(); save();"
                  class="ma-0">
                </v-checkbox>
              </template>
            </FeathersVuexFormWrapper>
          </template>
          <template v-slot:no-data>
             No active Recording Periods to show yet
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>

</template>

<script>
/* eslint-disable */
import { makeFindMixin, makeGetMixin } from 'feathers-vuex';
import { appComputed, authComputed, userComputed} from '@/store/helpers';


export default {
  mixins: [
    makeFindMixin({ service: 'diaryPayPeriods', watch: true }),
  ],
  page() {
    return {
      title: `Recording Periods | Admin | ${this.$appStrings('appName')}`,
      meta: [
        {
          name: 'description',
          content: 'Admin - Recording Periods List',
        },
      ],
    };
  },
  data() {
    return {
      showEditor: false,
      showHiddenDiaryPayPeriods: false,
      editedObj: new this.$FeathersVuex.api.DiaryPayPeriod(),
      editorTitle: '',
      localSearch: '',
      tableOptions: {
        sortBy: ['startDate', 'endDate'],
        sortDesc: [false, false],
        itemsPerPage: 25,
        page: 1,
      },
    };
  },
  computed: {
    ...authComputed,
    ...userComputed,
    ...appComputed,
    diaryPayPeriodsParams() {
      const query = { active: 1, hidden: 0, $sort: { startDate: 1, endDate: 1 }, $limit: 99999 };
      if (this.showHiddenDiaryPayPeriods) {
        delete query.active;
      }
      return { query };
    },
    showHiddenDiaryPayPeriodsIcon() {
      return (this.showHiddenDiaryPayPeriods) ? 'fa-eye' : 'fa-eye-slash';
    },
  },
  methods: {
    addObj() {
      this.editorTitle = 'Add a Recording Period';
      this.editedObj = new this.$FeathersVuex.api.DiaryPayPeriod();
      this.showEditor = true;
    },
    editObj(obj) {
      this.editorTitle = 'Edit Recording Period';
      this.editedObj = obj;
      this.showEditor = true;
    },
    clearObjDialog() {
      this.showEditor = false;
      this.editorTitle = 'Add a Recording Period';
      this.editedObj = new this.$FeathersVuex.api.DiaryPayPeriod();
      this.$refs.editorObserver.reset();
    },
    removeObj(obj) {
      this.$confirm('Are you sure you want to delete this Recording Period?', 
        {
          title: 'Delete Recording Period',
          icon: 'fas fa-question',
          color: 'msu',
          buttonTrueText: 'Yes',
          buttonFalseText: 'Whoops',
        })
        .then((conf) => {
          if (conf) {
            const clone = obj.clone();
            clone.remove();
          }
        });
    },
    requestAnimationFrame() {
      this.$refs.editorObserver.reset();
    },
  },
  watch: {
    showHiddenDiaryPayPeriods(val) {
      this.$store.dispatch('view/set', {
        showHiddenDiaryPayPeriods: val
      }, { root: true });
      this.tableOptions.page = 1;
    }
  },
  mounted() {
    this.showHiddenDiaryPayPeriods = this.viewPreferences('showHiddenDiaryPayPeriods');
  },
};
</script>
