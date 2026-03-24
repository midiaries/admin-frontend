<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" sm="8">
        <v-card>
          <v-toolbar flat class="msu dark-grey white--text">
            <v-toolbar-title>
              <h3>Manually Add Recording</h3>
              <h6>(unlinked from Participant-created Profiles)</h6>
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-row justify="center">
              <v-col cols="12" class="text-body-1 text-center">
                Choose a Subject with a Manual Profile <span v-if="isElevated">- OR - Add a New Manual Profile to a Subject</span><br>
              </v-col>
              <FeathersVuexFind service="profiles" :query="{ 'metadata.manual': true, $sort: { subjectId: 1 }, $limit: 99999 }">
                <v-col cols="12" sm="5" offset-sm="1" class="available-profiles text-center" slot-scope="{ items: profiles, isFindPending: profilesAreLoading }">
                  <!--- form blocks chrome attempting autofill on autocomplete --->
                  <form autocomplete="off">
                    <v-autocomplete
                      v-model="pickerProfile"
                      id="pickerProfile"
                      :disabled="profilesAreLoading || !profiles.length"
                      name="pickerProfile"
                      ref="pickerProfile"
                      label="Subjects with Manual Profiles"
                      :items="profiles"
                      item-value="id"
                      item-text="subject.shortcode"
                      dense
                      outlined
                      :menu-props="{ auto: true }"
                      :loading="profilesAreLoading"
                      return-object
                      @change="changeSelectedProfile"
                      autocomplete="nope">
                    </v-autocomplete>
                  </form>
                </v-col>
              </FeathersVuexFind>
              <v-col v-if="isElevated" cols="12" sm="6" class="text-center">
                <v-btn
                  class="white black--text"
                  @click.stop="addProfile">
                  <v-icon small class="mr-2">fa-plus</v-icon>Add Profile
                </v-btn>
              </v-col>
            </v-row>
            <v-row justify="center">
              <v-col v-if="editingProfile">
                <ValidationObserver ref="editorObserver" v-slot="{ invalid }">
                  <FeathersVuexFormWrapper :item="editingProfile" ref="editingForm" watch>
                    <template v-slot="{ clone, isDirty }">
                      <v-card>
                        <v-toolbar flat class="msu dark-grey text-center white--text">
                          <v-toolbar-title>
                            <h3>{{ editorTitle }}</h3>
                          </v-toolbar-title>
                          <v-spacer></v-spacer>
                          <v-icon class="white--text">fa-id-card</v-icon>
                        </v-toolbar>
                        <v-card-text>
                          <v-container>
                            <EditorProfile
                              :clone="clone"
                              :isDirty="isDirty"
                              :isAdmin="true"
                              :allowDelete="false"
                              :showControls="false"
                              :showParticipantInfo="false"
                              :standalone="true">
                            </EditorProfile>
                          </v-container>
                        </v-card-text>

                        <v-card-actions>
                          <v-spacer></v-spacer>
                          <v-btn @click="closeEditing">Cancel</v-btn>
                          <v-btn color="msu hover-1 white--text" :disabled="!clone.subjectId" @click="saveEditing(clone)">Select Subject</v-btn>
                        </v-card-actions>
                      </v-card>
                    </template>
                  </FeathersVuexFormWrapper>
                </ValidationObserver>
              </v-col>
            </v-row>
            <v-row justify="center">
              <v-col v-if="selectedProfile">
                <v-card>
                  <v-card-title class="msu text-center white--text">
                    <span class="text-h5">Using SID: {{ selectedProfile.subject.shortcode || '(missing sid)' }}</span>
                    <v-spacer></v-spacer>
                    <v-icon class="white--text">fa-id-card</v-icon>
                  </v-card-title>
                  <v-card-text>
                    <v-container class="text-body-1">
                      {{ selectedProfile.subject.first }}: {{ selectedProfile.subject.email }}
                    </v-container>
                  </v-card-text>
                </v-card>
                <v-card>
                  <v-card-title class="msu text-center white--text">
                    <span class="text-h5">Add Recording</span>
                    <v-spacer></v-spacer>
                    <v-icon class="white--text">fa-book</v-icon>
                  </v-card-title>
                  <v-card-text>
                    <v-container>
                      <DiaryUploader
                        :key="`${selectedProfile.id}-uploader`"
                        :profileId="selectedProfile.id"
                        :multiple="true">
                      </DiaryUploader>
                    </v-container>
                  </v-card-text>
                </v-card>
                <FeathersVuexFind service="diaries" :query="{ profileId: selectedProfile.id, active: 1 }" watch="query.profileId">
                  <span justify="center" align="center" class="available-diaries" slot-scope="{ items: diaries, isFindPending: diariesAreLoading }">
                    <v-data-table
                      :headers="[
                        {text: 'Recording #', value: 'dateCode', width: '40%'},
                        {text: 'Duration', value: 'duration', width: '20%', align: ($vuetify.breakpoint.smAndDown) ? ' d-none' : ''},
                        {text: 'Added', value: 'createdAt', align: ($vuetify.breakpoint.mdAndDown) ? ' d-none' : 'end'},
                      ]"
                      :items="diaries"
                      :items-per-page="-1"
                      :hide-default-header="diaries.length === 0"
                      hide-default-footer
                      :sort-by="['dateCode', 'createdAt']"
                      :sort-desc="[true, true]"
                      multi-sort
                      :loading="diariesAreLoading"
                      @click:row="showDiaryDetail"
                      class="elevation-1">
                        <template v-slot:top>
                          <v-toolbar flat class="msu text-center white--text">
                            <v-toolbar-title class="text-h5">
                              Existing Recordings
                            </v-toolbar-title>
                            <v-spacer></v-spacer>
                            <v-icon class="white--text">fa-book-open</v-icon>
                          </v-toolbar>
                        </template>
                        <template v-slot:item.duration="{ item }">
                          {{ toSexagesimal((item.metadata.duration) ? item.metadata.duration : 0, 'seconds') }}
                        </template>
                        <template v-slot:item.createdAt="{ item }">
                          {{ item.createdAt | moment('MMMM Do, YYYY, h:mm A') }}
                        </template>
                        <template v-slot:no-data>
                           No recordings to show yet
                        </template>
                    </v-data-table>
                  </span>
                </FeathersVuexFind>
              </v-col>
            </v-row>
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
import { mapGetters, mapActions } from 'vuex';
import Loading from '@/components/global/Loading.vue';
import { authComputed, appComputed } from '@/store/helpers';
import feathersClient from '@/plugins/feathers-client';
import formatters from '@/mixins/formatters';
import feathersVuexFormHelpers from '@/mixins/feathersVuexFormHelpers';


export default {
  page() {
    return {
      title: `Manage | ${this.$appStrings('appName')}`,
      meta: [
        {
          name: 'description',
          content: `Admin Management - ${this.$appStrings('appName')}`,
        },
      ],
    };
  },
  mixins: [
    formatters,
  ],
  data() {
    return {
      pickerProfile: null,
      selectedProfile: null,
      editingProfile: null,
      showDiaryEditor: false,
      editorTitle: 'New Profile',
      selectedTitle: 'Using:',
    };
  },
  computed: {
    ...authComputed,
    ...appComputed,
  },
  methods: {
    addProfile() {
      this.editorTitle = 'New Profile';
      this.selectedProfile = null;
      const tempMetadata = { manual: true };
      const tempTags = ['box_upload'];
      this.editingProfile = new this.$FeathersVuex.api.Profile({ metadata: tempMetadata, tags: tempTags });
    },
    closeEditing() {
      this.$refs.editorObserver.reset();
      this.editingProfile = null;
    },
    closeProfile() {
      this.$refs.selectedObserver.reset();
      this.selectedProfile = null;
    },
    async saveEditing(profile) {
      this.changeSelectedProfile(await profile.save());
    },
    changeSelectedProfile(profile) {
      if (this.editingProfile) {
        this.closeEditing();
      }
      this.selectedProfile = profile;
      this.selectedTitle = 'Using: ' + (profile.subject.shortcode || '(missing SID)');
      if (this.pickerProfile) {
        this.$nextTick(() => {
          this.pickerProfile = null;
          this.$refs.pickerProfile.blur();
        });
      }
    },
    editProfile() {
      this.editingProfile = this.selectedProfile;
      this.editorTitle = 'Editing ' + this.editingProfile.subject.shortcode;
    },
    showDiaryDetail(row) {
      const link = this.$router.resolve({ name: 'adminDiaryDetails', params: { id: row.id } });
      window.open(link.href, '_blank');
    },
  },
};
</script>

<style lang="css">
tbody tr :hover {
  cursor: pointer;
}
</style>
