<template>
  <v-container fluid>
    <div v-if="isAuthenticated">
      <v-dialog
        v-model="showEditor"
        width="50%"
        :fullscreen="$vuetify.breakpoint.xs"
        persistent
        scrollable
        @keydown.esc="clearObjDialog"
        :transition="($vuetify.breakpoint.xs) ? 'dialog-bottom-transition' : 'fade-transition'">
        <FeathersVuexFormWrapper :item="editedObj" ref="profileForm" watch>
          <template v-slot="{ clone, save, reset, isDirty }">
            <v-card>
              <v-card-title class="msu dark-grey text-center white--text">
                <span class="text-h5">{{ editorTitle }}</span>
                <v-spacer></v-spacer>
                <v-icon class="white--text">fa-user</v-icon>
              </v-card-title>
              <v-card-text class="text-body-1 mt-5">
                <v-row>
                  <v-col cols="12">
                    Please add Details for:<br>
                    First Name: {{ clone.fname }}<br>
                    Email: {{ clone.email }}<br>
                  </v-col>
                </v-row>
                <v-container>
                  <EditorProfile
                    :clone="clone"
                    :isDirty="isDirty"
                    :isAdmin="true"
                    :showParticipantInfo="false"
                    :allowDelete="false"
                    :showControls="false"
                    :standalone="true">
                  </EditorProfile>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="reset(); clearObjDialog();">Cancel</v-btn>
                <v-btn color="msu white--text" :disabled="!isDirty" @click="save().then(clearObjDialog);">Save</v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </FeathersVuexFormWrapper>
      </v-dialog>
      <v-row justify="center" align="center" class="available-diaries">
        <v-col cols="12" lg="10">
          <v-data-table
            :headers="[
              {text: 'S', value: 'metadata.editingStatus', width: '10%', align: 'center', sortable: false},
              {text: 'SID', value: 'subjectId', width: '20%', sortable: false},
              {text: 'Pub', value: 'permissionShare', width: '10%', align: 'center', sortable: false},
              {text: 'Feat', value: 'metadata.interesting', width: '10%', align: 'center', sortable: false},
              {text: 'Category', value: 'participantCategory', width: '10%', sortable: false},
              {text: 'Recording #', value: 'dateCode', width: '25%', align: 'end', sortable: false},
              {text: 'Duration', value: 'metadata.duration', width: '10%', align: 'start', sortable: false},
              {text: '', value: 'actions', width: '10%', sortable: false},
              {text: '', value: 'hidden', width: '5%', align: ($vuetify.breakpoint.smAndDown || !showHiddenDiaries) ? ' d-none' : '', sortable: false},
            ]"
            :items="diaries"
            :server-items-length="serverItemsLength"
            :hide-default-header="diaries.length === 0"
            :options.sync="tableOptions"
            :footer-props="{
              itemsPerPageOptions: [5,10,15,25,50,100],
              showFirstLastPage: true,
              disablePagination: serverItemsLength <= tableOptions.itemsPerPage
            }"
            :fixed-header="true"
            :loading="isProcessing"
            loading-text="Loading Recordings..."
            height="70vh"
            class="elevation-1">
            <template v-slot:progress>
              <v-progress-linear indeterminate color="msu"></v-progress-linear>
            </template>
            <template v-slot:top>
              <v-toolbar flat class="msu dark-grey text-center white--text">
                <v-toolbar-title>
                  <h3>My Recordings</h3>
                </v-toolbar-title>
                <v-text-field
                  v-model="searchString"
                  @change="getDiariesList()"
                  label="Search"
                  placeholder="SID, yyyy-mm-dd, kid, adult, etc"
                  solo
                  dense
                  class="mt-7 mx-4"
                ></v-text-field>
                <v-spacer></v-spacer>
                <v-icon class="white--text">
                  {{ showHiddenDiariesIcon }}
                </v-icon>
                <v-switch
                  v-model="showHiddenDiaries"
                  color="msu hover-1"
                  class="pt-5 mx-5">
                </v-switch>
              </v-toolbar>
            </template>
            <template v-slot:item.subjectId="{ item }">
              <span v-if="!item.profile.subjectId">
                <v-btn small class=" msu light-grey" @click="editObj(item)">Add SID</v-btn>
              </span>
              <span v-else>
                <!--- temporary workaround for list not updating after dialog editor adds sid --->
                {{ item.subjectId !== '(no SID)' ? item.subjectId : $FeathersVuex.api.Subject.getFromStore(item.profile.subjectId).shortcode }}
              </span>
            </template>
            <template v-slot:item.dateCode="{ item }">
              <FeathersVuexCount v-slot="{ total }" service="documents" :params="{ query: { parentId: item.id, $or: [ { fileext: 'jpg' }, { fileext: 'png' } ] } }">
                <v-icon left color="msu dark-grey" v-if="total">
                  {{ (total === 1) ? 'far fa-image' : 'far fa-images' }}
                </v-icon>
              </FeathersVuexCount>
              {{ item.dateCode }}
            </template>
            <template v-slot:item.permissionShare="{ item }">
              {{ (item.permissionShare) ? 'Y' : 'N' }}
            </template>
            <template v-slot:item.participantCategory="{ item }">
              <span v-if="item.profile.subjectId">
                <!--- temporary workaround for list not updating after dialog editor adds sid --->
                {{ item.participantCategory !== '' ? item.participantCategory : $FeathersVuex.api.Subject.getFromStore(item.profile.subjectId).metadata.participant_category }}
              </span>
            </template>
            <template v-slot:item.metadata.duration="{ item }">
              {{ toSexagesimal((item.metadata.duration) ? item.metadata.duration : 0, 'seconds') }}
            </template>
            <template v-slot:item.hidden="{ item }">
              <v-icon small class="black--text">
                {{ (item.hidden) ? 'fa-eye-slash' : '' }}
              </v-icon>
            </template>
            <template v-slot:item.metadata.interesting="{ item }">
              <v-icon class="black--text" color="msu">
                {{ (item.metadata.interesting) ? 'far fa-grin-stars' : '' }}
              </v-icon>
            </template>
            <template v-slot:item.metadata.editingStatus="{ item }">
              <span class="mr-1">
                <v-icon small color="msu" class="white--text" v-if="item.metadata.locked">
                  fa-lock
                </v-icon>
                <v-icon small color="msu" class="white--text" v-else-if="item.metadata.editingStatus === 'Completed'">
                  fa-check
                </v-icon>
                <v-icon small color="msu dark-grey" class="white--text" v-else-if="item.metadata.editingStatus === 'In Progress'">
                  fa-pencil-alt
                </v-icon>
                <v-icon small color="msu light-grey" class="white--text" v-else>
                  fa-check
                </v-icon>
              </span>
              <span class="ml-1">
                <v-icon small color="msu" class="white--text" v-if="item.metadata.lastCheckedAt && item.metadata.validated">
                  fa-check-double
                </v-icon>
                <v-icon small color="red" class="white--text ml-1" v-else-if="item.metadata.lastCheckedAt">
                  fa-times
                </v-icon>
                <v-icon small color="msu light-grey" class="white--text" v-else>
                  fa-check-double
                </v-icon>
              </span>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                v-if="hasRole('admin, ra, ga') || hasMatchingEmail(item.profile.subject.email)"
                small
                color="msu white--text"
                @click="showDiaryDetail(item)">
                View
              </v-btn>
            </template>
            <template v-slot:footer.prepend>
              <v-btn
                small
                @click.stop="getDiariesList()"
                :loading="isProcessing"
                :disabled="isProcessing"
                color="msu light-grey"
                class="ml-5">
                Refresh
                <v-icon small right>fa-refresh</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </div>
  </v-container>

</template>

<script>
/* eslint-disable */
import { makeFindMixin } from 'feathers-vuex';
import { authComputed, appComputed } from '@/store/helpers';
import feathersClient from '@/plugins/feathers-client';
import formatters from '@/mixins/formatters';

export default {
  page() {
    return {
      title: `Home | My Recordings | ${this.$appStrings('appName')}`,
      meta: [
        {
          name: 'description',
          content: 'User - Recording List',
        },
      ],
    };
  },
  mixins: [
    formatters,
    // makeFindMixin({ service: 'diaries', watch: true }),
  ],
  data() {
    return {
      diaries: [],
      showHiddenDiaries: false,
      searchString: null,
      showEditor: false,
      editedObj: new this.$FeathersVuex.api.Profile(),
      editorTitle: '',
      serverItemsLength: 0,
      tableOptions: {
        sortDesc: [false],
        itemsPerPage: 25,
        page: 1,
      },
      isProcessing: false,
    };
  },
  computed: {
    ...authComputed,
    ...appComputed,
    // diariesParams() {
    //   const query = { active: 1, hidden: 0, $sort: { createdAt: -1 } };
    //   if (this.showHiddenDiaries) {
    //     delete query.hidden;
    //   }
    //   return { query };
    // },
    showHiddenDiariesIcon() {
      return (this.showHiddenDiaries) ? 'fa-eye' : 'fa-eye-slash';
    },
  },
  methods: {
    async getDiariesList() {
      this.isProcessing = true;
      const sorter = [];
      if (this.tableOptions.sortBy.length > 0) {
        for (const idx of this.tableOptions.sortBy) {
          sorter.push(`${this.tableOptions.sortBy[idx]} ${this.tableOptions.sortDesc[idx] ? 'ASC' : 'DESC'}`)
        }
      } else {
        sorter.push(`diaries.createdAt DESC`);
      }
      this.diaries = await feathersClient.service('userMaintenance').create({
          action: "diary:getList",
          searchString: this.searchString,
          params: {
            showHiddenDiaries: this.showHiddenDiaries,
            sort: sorter,
            limit: this.tableOptions.itemsPerPage,
            skip: this.tableOptions.itemsPerPage * ((this.tableOptions.page || 1) - 1)
          },
        })
        .then((resp) => {
          this.serverItemsLength = resp.serverItemsLength;
          const ret = [];
          for (const d of resp.data) {
            ret.push(new this.$FeathersVuex.api.Diary(d));
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
    showDiaryDetail(obj) {
      let routeData = this.$router.resolve({ name: 'basicDiaryDetails', params: { id: obj.id } });
      window.open(routeData.href, '_blank');
    },
    editObj(obj) {
      this.editorTitle = 'Edit Details';
      this.editedObj = obj.profile;
      this.showEditor = true;
    },
    clearObjDialog() {
      this.showEditor = false;
      this.editorTitle = 'Edit Details';
      this.editedObj = new this.$FeathersVuex.api.Profile();
    },
  },
  watch: {
    showHiddenDiaries(val) {
      this.$store.dispatch('view/set', {
        showHiddenDiaries: val
      }, { root: true });
      this.$set(this.tableOptions, 'page', 1);
      this.getDiariesList();
    },
    tableOptions(val, oldVal) {
      if (val && val !== oldVal) {
        this.getDiariesList();
      }
    },
  },
  mounted() {
    this.showHiddenDiaries = this.viewPreferences('showHiddenDiaries');
  },
};
</script>