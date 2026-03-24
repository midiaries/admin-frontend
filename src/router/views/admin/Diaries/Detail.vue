<template>
  <v-container fluid v-if="(isAuthenticated && currentDiary) && (isElevated || hasMatchingEmail(currentDiary.profile.subject.email) )">
    <v-row justify="center" >
      <v-col cols="12">
        <v-card>
          <v-card-title primary-title class="msu dark-grey text-center white--text">
            <h3>Recording Details</h3>
            <v-spacer></v-spacer>
            <v-dialog v-if="isElevated"
              v-model="showProfileEditor"
              width="50%"
              :fullscreen="$vuetify.breakpoint.xs"
              persistent
              scrollable
              :transition="($vuetify.breakpoint.xs) ? 'dialog-bottom-transition' : 'fade-transition'">
              <template v-slot:activator="{ on, attrs }">
                <v-btn class="white black--text" :small="$vuetify.breakpoint.smAndDown" v-on="on">
                  <v-icon small class="mr-2">fa-pencil-alt</v-icon>
                  Edit Profile
                </v-btn>
              </template>
              <FeathersVuexFormWrapper :item="currentDiary.profile" ref="profileForm" watch>
                <template v-slot="{ clone, save, reset, isDirty }">
                  <v-card>
                    <v-card-title class="msu dark-grey text-center white--text">
                      <span class="text-h5">Edit Profile</span>
                      <v-spacer></v-spacer>
                      <v-icon class="white--text">fa-user</v-icon>
                    </v-card-title>
                    <v-card-text>
                      <v-row>
                        <v-col cols="12" class="text-body-1">
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
                      <v-btn @click="reset(); clearProfileDialog();">Cancel</v-btn>
                      <v-btn color="msu white--text" :disabled="!isDirty" @click="save().then(clearProfileDialog);">Save</v-btn>
                    </v-card-actions>
                  </v-card>
                </template>
              </FeathersVuexFormWrapper>
            </v-dialog>
            <ValidationObserver ref="editorObserver" v-slot="{ invalid, validate }">
              <v-dialog
                v-model="showDictionaryEditor"
                width="50%"
                :fullscreen="$vuetify.breakpoint.xs"
                persistent
                scrollable
                :transition="($vuetify.breakpoint.xs) ? 'dialog-bottom-transition' : 'fade-transition'">
                <FeathersVuexFormWrapper :item="editedDictionaryWord" ref="dictionaryForm" watch>
                  <template v-slot="{ clone, save, reset, isDirty }">
                    <v-card>
                      <v-card-title class="msu dark-grey text-center white--text">
                        <span class="text-h5">Add to Dictionary</span>
                        <v-spacer></v-spacer>
                        <v-icon class="white--text">fa-quote-right</v-icon>
                      </v-card-title>
                      <v-card-text>
                        <v-container>
                          <EditorDictionaryWord
                            :clone="clone"
                            :isDirty="isDirty"
                            :isAdmin="true"
                            :allowDelete="false"
                            :showControls="false"
                            :standalone="true">
                          </EditorDictionaryWord>
                        </v-container>
                      </v-card-text>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn @click="reset(); clearDictionaryDialog();">Cancel</v-btn>
                        <v-btn color="msu accent-green white--text" @click="validate().then(valid => valid ? save().then(obj => clearDictionaryDialog(obj)) : null);">Save</v-btn>
                      </v-card-actions>
                    </v-card>
                  </template>
                </FeathersVuexFormWrapper>
              </v-dialog>
            </ValidationObserver>
          </v-card-title>
          <v-card-text class="text-subtitle-1">
            <v-row>
              <v-col cols="12" sm="6">
                SID: <span class="font-weight-bold">{{ currentDiary.subjectId }}</span>
                <span v-if="currentDiary.profile && currentDiary.profile.subject && !currentDiary.profile.subject.id"> (was: {{ currentDiary.profile.subjectId }})</span><br>
                Share Permission: <span class="font-weight-bold" :class="currentDiary.permissionShare ? 'msu--text' : 'red--text'">{{ (currentDiary.permissionShare) ? 'Yes' : 'No' }}</span><br>
                Entry: <span class="font-weight-bold">{{ currentDiary.dateCode }}</span>
                <ValidationObserver ref="diaryObserver" v-slot="{ invalid, validate }">
                  <v-dialog
                    v-model="showDiaryEditor"
                    width="50%"
                    :fullscreen="$vuetify.breakpoint.xs"
                    persistent
                    scrollable
                    :transition="($vuetify.breakpoint.xs) ? 'dialog-bottom-transition' : 'fade-transition'">
                    <template v-slot:activator="{ on, attrs }">
                      <span
                        class="text-caption pl-2 text-decoration-underline"
                        style="cursor: pointer;"
                        v-on="on">change</span>
                    </template>
                    <FeathersVuexFormWrapper :item="currentDiary" ref="diaryForm" watch>
                      <template v-slot="{ clone, save, reset, isDirty }">
                        <v-card>
                          <v-card-title class="msu dark-grey text-center white--text">
                            <span class="text-h5">Edit Recording</span>
                            <v-spacer></v-spacer>
                            <v-icon class="white--text">fa-user</v-icon>
                          </v-card-title>
                          <v-card-text>
                            <v-container>
                              <v-row>
                                <v-col cols="12" sm="9" md="6">
                                  <EditorDate
                                    :clone="clone.metadata"
                                    field="diaryDate"
                                    label="Date of Recording"
                                    :hide-details="true"
                                    :maxDate="$moment().format('YYYY-MM-DD')"
                                    :required="true"
                                    :readonly="false">
                                  </EditorDate>
                                </v-col>
                                <v-col cols="3" offset-md="2" sm="2" offset-sm="1">

                                  <ValidationProvider
                                    ref="sequence"
                                    name="Sequence"
                                    rules="required"
                                    v-slot="{ errors }">
                                    <v-text-field
                                      :key="`${clone.id}-sequence`"
                                      v-model.number="clone.metadata.sequence"
                                      label="Sequence"
                                      :error-messages="errors"
                                      type="number"
                                      :min="1"
                                      :required="true">
                                    </v-text-field>
                                  </ValidationProvider>
                                </v-col>
                              </v-row>
                            </v-container>
                          </v-card-text>

                          <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn @click="reset(); clearDiaryDialog();">Cancel</v-btn>
                            <v-btn color="msu accent-green white--text" @click="validate().then(valid => valid ? save().then(obj => clearDiaryDialog(obj)) : null);">Save</v-btn>
                          </v-card-actions>
                        </v-card>
                      </template>
                    </FeathersVuexFormWrapper>
                  </v-dialog>
                </ValidationObserver>
                <span v-if="currentDiary.profile.metadata.manual"> (manual upload)</span><br>
                Submitted: {{ currentDiary.createdAt | moment('MMM D YYYY @ h:mm A')}}<br>
                Duration: {{ speakingTime(currentDiary.metadata.duration || 0, 'seconds') }}
                <span
                  class="text-caption"
                  :class="!metadataIsRunning ? 'text-decoration-underline' : ''"
                  :style="!metadataIsRunning ? 'cursor: pointer;' : ''"
                  @click.stop="fixMetadata">{{ metadataIsRunning ? 'running...' : 'refresh metadata' }}</span>
                <br>
                <v-select
                  :id="`${currentDiary.id}-edited`"
                  :value="currentDiary.metadata.editingStatus"
                  name="diaryEditingStatus"
                  label="Editing Status?"
                  hint="New/In Progress/Completed"
                  placeholder="No Status yet"
                  clearable
                  @clear:click="updateEditingStatus()"
                  :items="diaryStatuses"
                  @change="updateEditingStatus"
                  :persistent-hint="true">
                </v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-row>
                  <v-col cols="12" class="d-flex justify-end">
                      <v-switch
                        label="Hidden?"
                        :input-value="currentDiary.hidden"
                        @change="toggle('hidden')"
                        :hide-details="true"
                        color="msu"
                        class="input-flip-flop flex-align-end"
                      />
                  </v-col>
                  <v-col cols="12" class="d-flex justify-end">
                      <v-switch
                        label="Not For Research?"
                        :input-value="currentDiary.metadata.notForResearch"
                        @change="toggle('notForResearch', 'metadata')"
                        :hide-details="true"
                        color="msu"
                        class="input-flip-flop flex-align-end"
                      />
                  </v-col>
                  <v-col cols="12" class="d-flex justify-end">
                      <v-switch
                        label="Feature Recording?"
                        :input-value="currentDiary.metadata.interesting"
                        @change="toggle('interesting', 'metadata')"
                        :hide-details="true"
                        color="msu"
                        class="input-flip-flop flex-align-end"
                      />
                  </v-col>
                  <v-col cols="12" class="d-flex justify-end">
                    <v-btn
                      v-if="hasRole('admin')"
                      :class="`${removeDiaryBtn.color} white--text`"
                      :small="$vuetify.breakpoint.smAndDown"
                      :disabled="removeDiaryBtn.disabled"
                      @click.stop="removeDiary">
                      <v-icon small class="mr-2">{{ removeDiaryBtn.icon }}</v-icon>
                      {{ removeDiaryBtn.text }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <FeathersVuexFind service="documents" ref="diaryAudio" :query="availableAudio">
      <span class="available-recordings" slot-scope="{ items: recording, isFindPending: recordingIsLoading }">
        <v-row justify="center">
          <v-col cols="12">
            <v-card>
              <v-card-title primary-title class="msu dark-grey text-center white--text">
                <h3>Audio</h3>
              </v-card-title>
              <v-card-text class="text-subtitle-1">
                <v-row>
                  <v-col cols="12">
                    <span v-if="recordingIsLoading">Audio loading...</span>
                    <span v-else>
                      <span v-if="recording.length">
                        <div>
                          <audio
                            controls
                            ref="player"
                            :key="recording[0].id"
                            preload="metadata"
                            @playing="updatePlayerStatus('playing')"
                            @pause="updatePlayerStatus('pause')"
                            @ended="updatePlayerStatus('ended')"
                            @timeupdate="updatePlayerTime"
                            style="width:100%;" >
                            <source
                              :src="`/audio/${recording[0].id}.mp3`"
                              type="audio/mp3">
                          </audio>
                        </div>
                        <v-row>
                          <v-col cols="12" md="6">
                            <v-select
                              :id="`${currentDiary.id}-audioDownloadOptions`"
                              v-model="selectedAudioDownloadOption"
                              name="selectedAudioDownloadOption"
                              label="Download audio as..."
                              :return-object="true"
                              :items="audioDownloadOptions(recording[0])"
                              @click.native.stop
                              >
                              <template v-slot:append-outer>
                                <v-btn
                                  :id="`${currentDiary.id}-audioDownloadBtn`"
                                  small
                                  class="controls-row mr-2"
                                  style="width: 10em"
                                  @click.native.stop="selectedAudioDownloadOption.type === 'original' ? downloader('/api/download/' + recording[0].id, currentDiary.id) : convertAudio(selectedAudioDownloadOption)"
                                  :loading="downloadBtnSettings[currentDiary.id]?.isDownloading || downloadBtnDefaults.disabled"
                                  :disabled="!selectedAudioDownloadOption.type
                                    || downloadBtnSettings[currentDiary.id]?.isDownloading
                                    || downloadBtnSettings[currentDiary.id]?.disabled
                                    || downloadBtnDefaults.disabled"
                                  :color="downloadBtnSettings[currentDiary.id]?.color || downloadBtnDefaults.color">
                                  <v-icon v-if="downloadBtnSettings[currentDiary.id]?.icon" small v-text="downloadBtnSettings[currentDiary.id]?.icon"></v-icon>
                                  <span v-else>
                                    {{ downloadBtnSettings[currentDiary.id]?.text || downloadBtnDefaults.text}}
                                  </span>
                                </v-btn>
                              </template>
                            </v-select>
                          </v-col>
                        </v-row>
                      </span>
                      <span v-else>
                        No Audio uploaded
                      </span>
                    </span>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col cols="12">
            <v-card>
              <v-card-title primary-title class="msu dark-grey text-center white--text">
                <h3>Transcripts</h3>
                <v-spacer></v-spacer>
                <v-btn v-if="recording.length"
                  class="black--text mr-5"
                  style="width: 19em;"
                  :color="fileUploadBtn.color"
                  :small="$vuetify.breakpoint.smAndDown"
                  @click.stop="$refs.fileInput.click();"
                  :loading="isUploading"
                  :disabled="isUploading">
                  <v-icon v-if="fileUploadBtn.icon" small class="mr-2" v-text="fileUploadBtn.icon"></v-icon>
                  {{ fileUploadBtn.text }}
                  <span slot="loader">
                    {{ uploadProgress }}%
                  </span>
                </v-btn>
                <input
                  ref="fileInput"
                  class="d-none"
                  type="file"
                  @change="importNewTranscript(recording[0].id)"
                  :key="`${currentDiary.id}-${fileInputKey}`"
                >
                <span v-if="isElevated">
                <v-btn v-if="recording.length" class="white black--text" :small="$vuetify.breakpoint.smAndDown" @click.stop="requestNewTranscript(recording[0].id)" :loading="transcriptIsRunning">
                  <v-icon small class="mr-2">fa-cloud-download-alt</v-icon>
                  Regenerate
                </v-btn></span>
              </v-card-title>
              <v-card-text class="text-subtitle-1">
                <FeathersVuexFind v-if="recording.length" service="transcriptions" :query="{ documentId: recording[0].id, $sort: { revision: -1 } }">
                  <span class="available-transcripts" slot-scope="{ items: transcripts, isFindPending: transcriptsAreLoading }">

                    <v-row v-if="transcriptsAreLoading" justify="center">
                      <v-col cols="12">
                        Transcripts loading...
                      </v-col>
                    </v-row>
                    <v-expansion-panels
                      v-model="transcriptPanelsExpanded"
                      v-else
                      :popout="($vuetify.breakpoint.smAndDown) ? false : true">
                      <v-expansion-panel v-for="(transcript, idx) in transcripts" :key="`${recording[0].id}-transcripts-${idx}`">
                        <v-expansion-panel-header>
                          <v-row class="pb-5">
                            <v-col cols="12" sm="6">
                              #{{ transcript.revision }} -
                              <span v-if="transcript.metadata.locked" class="font-weight-bold">
                                Locked
                                <v-icon small class="black--text">fa-lock</v-icon>
                              </span>
                              <span v-else-if="transcript.status === 0">
                                Pending...
                              </span>
                              <span v-else-if="transcript.status === 1">
                                Processing... (get a drink, it'll be a bit if 5min+ audio)
                              </span>
                              <span v-else-if="transcript.status === 66">
                                No audio detected
                              </span>
                              <span v-else-if="transcript.status === 99">
                                {{ transcript.metadata.imported ? 'Imported from file' : 'Processed'}}
                              </span>
                              <span v-else>
                                Error <a @click.stop="transcript.metadata.locked ? null : removeTranscript(transcript)" style="color: red; text-decoration: underline;">Remove</a> and Regenerate
                              </span>
                            </v-col>
                            <v-col cols="12" sm="6" class="pt-0 px-0" :class="($vuetify.breakpoint.smAndUp) ? 'text-right' : ''">
                              <span v-if="transcript.status === 99">
                                <span v-if="analysisStatus[transcript.id]">
                                  <v-chip class="msu light-grey black--text ml-2 font-weight-bold">
                                    Checking...
                                  </v-chip>
                                </span>
                                <span v-else>
                                  <v-chip :class="transcript.analysisBtn.class">
                                    {{ transcript.analysisBtn.text }}
                                  </v-chip>
                                </span>
                                <v-btn
                                  small
                                  class="controls-row ml-2"
                                  @click.stop="transcript.metadata.locked ? null : checkForErrors(transcript.id)"
                                  :loading="analysisStatus[transcript.id]"
                                  :disabled="analysisStatus[transcript.id] || transcript.metadata.locked"
                                  color="msu light-grey">
                                  {{ transcript.passing ? 'recheck' : 'check' }}
                                </v-btn>
                              </span>
                            </v-col>
                            <v-col cols="12" md="6" v-if="transcript.status === 99">

                              <v-select
                                :id="`${transcript.id}-transcriptDownloadOptions`"
                                v-model="selectedTranscriptDownloadOption[transcript.id]"
                                :name="`${transcript.id}-transcriptDownloadOptions`"
                                :label="`Download Transcript ${transcript.revision} as...`"
                                :return-object="true"
                                hint=" "
                                :persistent-hint="true"
                                :items="transcriptDownloadOptions"
                                @click.native.stop
                                >
                                <template v-slot:message>
                                  <div :style="`color: ${downloadBtnSettings[transcript.id]?.error.color};`">{{ downloadBtnSettings[transcript.id]?.error.message }}</div>
                                </template>
                                <template v-slot:append-outer>
                                  <v-btn
                                    :id="`${transcript.id}-transcriptDownloadBtn`"
                                    small
                                    class="controls-row mr-2"
                                    style="width: 10em"
                                    @click.native.stop="convertText({ id: transcript.id, ...selectedTranscriptDownloadOption[transcript.id] })"
                                    :loading="downloadBtnSettings[transcript.id]?.isDownloading || downloadBtnDefaults.disabled"
                                    :disabled="!selectedTranscriptDownloadOption[transcript.id]?.type
                                      || downloadBtnSettings[transcript.id]?.isDownloading
                                      || downloadBtnSettings[transcript.id]?.disabled
                                      || downloadBtnDefaults.disabled"
                                    :color="downloadBtnSettings[transcript.id]?.color || downloadBtnDefaults.color">
                                    <v-icon v-if="downloadBtnSettings[transcript.id]?.icon" small v-text="downloadBtnSettings[transcript.id]?.icon"></v-icon>
                                    <span v-else>
                                      {{ downloadBtnSettings[transcript.id]?.text || downloadBtnDefaults.text}}
                                    </span>
                                  </v-btn>
                                </template>
                              </v-select>
                            </v-col>
                          </v-row>
                        </v-expansion-panel-header>
                        <v-expansion-panel-content v-if="transcript.status === 99">
                          <v-row class="mb-5">
                            <v-col cols="12">
                              Actions:
                              <v-btn v-if="hasRole('admin, ra, ga')"
                                small
                                class="white--text controls-row float-right"
                                @click.stop="transcript.metadata.locked ? null : removeTranscript(transcript)"
                                :disabled="analysisStatus[transcript.id] || transcript.metadata.locked"
                                color="red">
                                Delete this Transcript
                              </v-btn>
                            </v-col>
                          </v-row>
                          <v-row v-if="transcript.hasErrors || transcript.hasWarnings">
                            <v-col cols="12" class="pt-0 pb-1" v-if="transcript.hasErrors">
                              <v-data-table
                                :headers="[
                                  {text: 'Start Time', value: 'startTime', width: 125},
                                  {text: 'Warning', value: 'type', width: 150},
                                  {text: 'Target', value: 'target', width: 200},
                                  {text: 'Action(s)', value: 'text'},
                                  {text: '', value: 'actions', align: 'end'},
                                ]"
                                :items="transcript.metadata.errors"
                                item-key="errorId"
                                :items-per-page="-1"
                                :fixed-header="true"
                                :hide-default-footer="true"
                                height="200px"
                                dense
                                class="elevation-1">
                                <template v-slot:top>
                                  <v-toolbar flat class="red text-center white--text" dense>
                                    <v-toolbar-title>
                                      <h5>{{ transcript.metadata.errors.length }} Errors</h5>
                                    </v-toolbar-title>
                                    <v-spacer></v-spacer>
                                    <v-icon class="white--text">
                                      fa-ban
                                    </v-icon>
                                  </v-toolbar>
                                </template>
                                <template v-slot:item.startTime="{ item }">
                                  <span @click="scrollToItem(item.id)" class="text-decoration-underline" style="cursor: pointer;">
                                    {{ item.startTime }}
                                  </span>
                                </template>
                                <template v-slot:item.text="{ item }">
                                  <span v-if="item.type === 'WORD'">
                                    Fix<span v-if="hasRole('admin, ra, ga')">, or <span @click="addToDictionary(item.target)" class="text-decoration-underline" style="cursor: pointer;">Add to Dictionary</span></span>
                                  </span>
                                  <span v-if="item.type === 'SYNTAX' || item.type === 'OVERLAP'">
                                    Fix
                                  </span>
                                  <span v-if="item.type === 'SHORT'">
                                    Extend end or merge and delete
                                  </span>
                                  <span v-if="item.type === 'LONG'">
                                    Split into multiple chunks with new start/end
                                  </span>
                                  <span v-if="item.type === 'NUMBERS'">
                                    Spell out number(s)
                                  </span>
                                </template>
                              </v-data-table>
                            </v-col>
                            <v-col cols="12" class="pt-0" v-if="transcript.hasWarnings">
                              <v-data-table
                                :headers="[
                                  {text: 'Start Time', value: 'startTime', width: 150},
                                  {text: 'Warning', value: 'type', width: 150},
                                  {text: 'Target', value: 'target', width: 200},
                                  {text: 'Action(s)', value: 'text'},
                                  {text: '', value: 'actions', align: 'end'},
                                ]"
                                :items="transcript.metadata.warnings"
                                item-key="errorId"
                                :items-per-page="-1"
                                :fixed-header="true"
                                :hide-default-footer="true"
                                dense
                                class="elevation-1">
                                <template v-slot:top>
                                  <v-toolbar flat class="msu accent-orange text-center white--text" dense>
                                    <v-toolbar-title>
                                      <h5>{{ transcript.metadata.warnings.length }} Warnings</h5>
                                    </v-toolbar-title>
                                    <v-spacer></v-spacer>
                                    <v-icon class="white--text">
                                      fa-exclamation-triangle
                                    </v-icon>
                                  </v-toolbar>
                                </template>
                                <template v-slot:item.startTime="{ item }">
                                  <span @click="scrollToItem(item.id)" class="text-decoration-underline" style="cursor: pointer;">
                                    {{ item.startTime }}
                                  </span>
                                </template>
                                <template v-slot:item.text="{ item }">
                                  <span v-if="item.type === 'EMPTY'">
                                    Consider removing line
                                  </span>
                                </template>
                              </v-data-table>
                            </v-col>
                          </v-row>
                          <v-row>
                            <v-col>
                            </v-col>
                            <v-col>
                              Start
                            </v-col>
                            <v-col>
                              Stop
                            </v-col>
                            <v-col>
                              Spk#
                            </v-col>
                            <v-col cols="7">
                              [R?]   Sentence
                            </v-col>
                          </v-row>
                          <FeathersVuexFind service="transcriptSentences" :query="{ transcriptionId: transcript.id }">
                            <span class="available-sentences" slot-scope="{ items: sentences, isFindPending: sentencesAreLoading }">
                              <v-row v-if="sentencesAreLoading">
                                Loading Sentences...
                              </v-row>
                              <v-row v-for="sentence in sentences.sort((a,b) => { return a.startTime - b.startTime; })" :key="`${transcript.id}-${sentence.id}`" :id="sentence.id" :class="(sentence.startTime <= playerStatus.currentTime && sentence.endTime >= playerStatus.currentTime) ? 'elevation-15' : ''">
                                <v-col>
                                  <span v-if="sentence.startTime <= playerStatus.currentTime && sentence.endTime >= playerStatus.currentTime && playerStatus.playing">
                                    <v-btn
                                      text
                                      icon
                                      large
                                      @click.stop="playerControl('pause')"
                                      class="pt-1"
                                      color="msu">
                                      <v-icon>
                                        far fa-pause-circle
                                      </v-icon>
                                    </v-btn>
                                  </span>
                                  <span v-else>
                                    <v-btn
                                      text
                                      icon
                                      large
                                      @click.stop="playerControl('play', sentence)"
                                      class="pt-1">
                                      <v-icon>
                                        far fa-play-circle
                                      </v-icon>
                                    </v-btn>
                                  </span>
                                </v-col>
                                <v-col>
                                  <FeathersVuexInputWrapper :item="sentence" prop="startTime" style="width: 100px;" watch>
                                    <template #default="{ current, prop, createClone, handler }">
                                      <v-textarea
                                        :key="`${sentence.id}-startTime`"
                                        v-model="current[prop]"
                                        :disabled="transcript.metadata.locked"
                                        :readonly="transcript.metadata.locked"
                                        dense
                                        rows="1"
                                        outlined
                                        auto-grow
                                        @focus="createClone"
                                        @change="e => handler(e, saveClone)"
                                        @keypress.enter="e => e.target.blur()"
                                        @keydown.escape="e => handler(e, resetClone)"/>
                                    </template>
                                  </FeathersVuexInputWrapper>
                                </v-col>
                                <v-col>
                                  <FeathersVuexInputWrapper :item="sentence" prop="endTime" style="width: 100px;" watch>
                                    <template #default="{ current, prop, createClone, handler }">
                                      <v-textarea
                                        :key="`${sentence.id}-endTime`"
                                        v-model="current[prop]"
                                        :disabled="transcript.metadata.locked"
                                        :readonly="transcript.metadata.locked"
                                        dense
                                        rows="1"
                                        outlined
                                        auto-grow
                                        @focus="createClone"
                                        @change="e => handler(e, saveClone)"
                                        @keypress.enter="e => e.target.blur()"
                                        @keydown.escape="e => handler(e, resetClone)"/>
                                    </template>
                                  </FeathersVuexInputWrapper>
                                </v-col>
                                <v-col>
                                  <FeathersVuexInputWrapper :item="sentence" prop="speaker" style="width: 60px;" watch>
                                    <template #default="{ current, prop, createClone, handler }">
                                      <v-text-field
                                        :key="`${sentence.id}-speaker`"
                                        v-model.number="current.metadata[prop]"
                                        :disabled="transcript.metadata.locked"
                                        :readonly="transcript.metadata.locked"
                                        dense
                                        outlined
                                        type="number"
                                        :min="1"
                                        @focus="createClone"
                                        @change="e => handler(e, saveClone)"
                                        @keypress.enter="e => e.target.blur()"
                                        @keydown.escape="e => handler(e, resetClone)">
                                      </v-text-field>
                                    </template>
                                  </FeathersVuexInputWrapper>
                                </v-col>
                                <v-col cols="6">
                                  <FeathersVuexInputWrapper :item="sentence" prop="content" style="width: 100%;" watch>
                                    <template #default="{ current, prop, createClone, handler }">
                                      <v-textarea
                                        :key="`${sentence.id}-content`"
                                        v-model="current[prop]"
                                        :disabled="transcript.metadata.locked"
                                        :readonly="transcript.metadata.locked"
                                        dense
                                        auto-grow
                                        @focus="createClone"
                                        @change="e => handler(e, saveClone)"
                                        @keypress.enter="e => e.target.blur()"
                                        @keydown.escape="e => handler(e, resetClone)"
                                        rows="1">
                                        <template v-slot:prepend>
                                          <v-icon
                                            :color="current.metadata.redact ? 'red' : 'msu light-grey'"
                                            :ripple="false"
                                            @click="transcript.metadata.locked ? null : updateRedactFlag(sentence)"
                                            style="cursor: pointer;">
                                            fa-flag
                                          </v-icon>
                                        </template>
                                      </v-textarea>
                                    </template>
                                  </FeathersVuexInputWrapper>
                                </v-col>
                                <v-col cols="1">
                                  <v-icon
                                    v-if="hasRole('admin, ra, ga, user')"
                                    :disabled="transcript.metadata.locked"
                                    :readonly="transcript.metadata.locked"
                                    class="mr-3"
                                    color="msu"
                                    @click="addSentence(sentence)"
                                    :tabindex="-1">
                                    fa-plus-circle
                                  </v-icon>
                                  <v-icon
                                    v-if="hasRole('admin, ra, ga, user')"
                                    :disabled="transcript.metadata.locked"
                                    :readonly="transcript.metadata.locked"
                                    class="mr-3"
                                    color="red"
                                    @click="removeSentence(sentence)"
                                    :tabindex="-1">
                                    fa-trash
                                  </v-icon>
                                </v-col>
                              </v-row>
                            </span>
                          </FeathersVuexFind>
                        </v-expansion-panel-content>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </span>
                </FeathersVuexFind>
                <span v-else>
                  No Audio to Transcribe
                </span>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </span>
    </FeathersVuexFind>
    <v-row justify="center" >
      <v-col cols="12">
        <v-card>
          <v-card-title primary-title class="msu dark-grey text-center white--text">
            <h3>Attachment(s)</h3>
          </v-card-title>
          <v-card-text class="text-subtitle-1">
            <FeathersVuexFind service="documents" :query="availableImages" watch="query">
              <v-row align="center" class="available-images" slot-scope="{ items: images, isFindPending: imagesAreLoading }">
                <v-col cols="12" v-if="imagesAreLoading" class="text-center">
                  Images loading...
                </v-col>
                <v-col cols="12" sm="8" md="6" lg="5" xl="3" v-if="images.length">
                  Images added:<br>
                  <span v-for="(image, idx) in images" :key="`${currentDiary.id}-image-${idx}`">
                    <img :src="'/api/images/' + image.id" width="100%">
                  </span>
                </v-col>
                <v-col cols="12" v-else class="text-center">
                  No Images uploaded
                </v-col>
              </v-row>
            </FeathersVuexFind>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <!---
    <div role="document" class="v-dialog__content v-dialog__content--active" :style="`top:auto;height:auto;left:${this.$vuetify.breakpoint.mdAndDown ? '28px' : '128px'};bottom:40px;z-index:202;`" tabindex="0" v-if="showCorrectionsList">
      <transition name="bottom-sheet-transition">
        <div class="msu light-grey v-dialog v-dialog--active v-dialog--persistent v-bottom-sheet v-bottom-sheet--inset" style="max-width:70%;padding: 10px 25px 10px 25px;max-height:50px;overflow:hidden;">
          <CorrectionsList
            :items="currentTranscriptErrors">
          </CorrectionsList>
        </div>
      </transition>
    </div>
    --->
  </v-container>
</template>

<script>
/* eslint-disable */
import axios from 'axios';
import qs from 'qs';
import { mapGetters, mapActions } from 'vuex';
import { makeFindMixin } from 'feathers-vuex';
import Loading from '@/components/global/Loading.vue';
// import TranscriptSentences from '@/components/TranscriptSentences.vue';
import { authComputed } from '@/store/helpers';
import feathersClient from '@/plugins/feathers-client';
import feathersVuexFormHelpers from '@/mixins/feathersVuexFormHelpers';
import formatters from '@/mixins/formatters';


export default {
  name: 'diary-detail',
  mixins: [
    feathersVuexFormHelpers,
    formatters,
  ],
  components: {
    Loading,
    // TranscriptSentences,
  },
  page() {
    return {
      title: `Diary Details | ${this.$appStrings('appName')}`,
      meta: [
        {
          name: 'description',
          content: 'Diary Detail page',
        },
      ],
    };
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      currentDiary: '',
      detailsAreLoading: true,
      showTimestamps: false,
      isDownloading: false,
      isCompleted: false,
      downloadBtnSettings: {},
      downloadBtnDefaults: {
        text: 'Download',
        color: 'msu light-grey',
        icon: 'fa-cloud-download-alt',
        disabled: false,
      },
      analysisStatus: {},
      showDiaryEditor: false,
      showProfileEditor: false,
      showDictionaryEditor: false,
      editedDictionaryWord: new this.$FeathersVuex.api.DictionaryWord(),
      editedObj: new this.$FeathersVuex.api.Profile(),
      editorTitle: '',
      removeDiaryError: false,
      removeDiaryBtn: {
        text: 'Delete Recording',
        color: 'red',
        icon: 'fa-trash',
        disabled: false,
      },
      metadataIsRunning: false,
      transcriptIsRunning: false,
      isUploading: false,
      uploadResponse: null,
      pendingUploadCount: 0,
      uploadProgress: 0,
      uploadProgressColor: 'msu accent-orange',
      fileInputKey: 0,
      fileUploadBtn: {
        text: 'Import a transcript',
        color: 'white',
        icon: 'fa-file-alt',
      },
      transcriptPanelsExpanded: [],
      currentTranscriptErrors: [],
      showCorrectionsList: true,
      diaryStatuses: [
        {
          text: 'Not Started',
          value: 'Not Started',
        },
        {
          text: 'In Progress',
          value: 'In Progress',
        },
        {
          text: 'Completed',
          value: 'Completed',
        },
      ],
      playerStatus: {
        currentTime: 0,
        playing: false,
        paused: false,
        requestedChunk: false,
        requestedChunkStart: 0,
        requestedChunkEnd: 0,
      },
      selectedAudioDownloadOption: {},
      selectedTranscriptDownloadOption: {},
      transcriptDownloadOptions: [
        {
          text: 'Timestamps',
          type: 'tsv',
          format: 'timestamps',
          redact: false,
        },
        {
          text: 'Timestamps (Redacted)',
          type: 'tsv',
          format: 'timestamps',
          redact: true,
        },
        {
          text: 'Text',
          type: 'tsv',
          format: 'text',
          redact: false,
        },
        {
          text: 'Text (Redacted)',
          type: 'tsv',
          format: 'text',
          redact: true,
        },
        {
          text: 'Timestamps (CSV)',
          type: 'csv',
          format: 'timestamps',
          redact: false,
        },
        {
          text: 'Timestamps (CSV, Redacted)',
          type: 'csv',
          format: 'timestamps',
          redact: true,
        },
        {
          text: 'Text (CSV)',
          type: 'csv',
          format: 'text',
          redact: false,
        },
        {
          text: 'Text (CSV, Redacted)',
          type: 'csv',
          format: 'text',
          redact: true,
        },
        {
          text: 'MFA TextGrid (ZIP, tg + wav)',
          type: 'textgrid',
          format: 'textgrid',
          redact: false,
        },
        {
          text: 'MFA TextGrid (ZIP, tg + wav, Redacted)',
          type: 'textgrid',
          format: 'textgrid',
          redact: true,
        },
      ],
    };
  },
  computed: {
    ...authComputed,
    availableAudio() {
      return {
        parentId: this.currentDiary.id,
        $or: [
          { fileext: 'mp4' },
          { fileext: 'm4a' },
          { fileext: 'mp3' },
          { fileext: 'wav' },
          { fileext: 'webm' },
          { fileext: 'ogg' },
          { fileext: 'flac' },
        ],
        $sort: { createdAt: 1 },
      };
    },
    availableImages() {
      return {
        parentId: this.currentDiary.id,
        $or: [
          { fileext: 'jpg' },
          { fileext: 'png' },
          { fileext: 'jpeg' },
          { fileext: 'JPG' },
          { fileext: 'PNG' },
          { fileext: 'JPEG' },
        ],
        $sort: { createdAt: 1 },
      };
    },
  },
  methods: {
    audioDownloadOptions(recording) {
      const ret = [];
      ret.push({
        text: 'Original (' + recording.fileext.toUpperCase() + ')',
        type: 'original',
      });
      ret.push({
        id: recording.id,
        text: 'WAV',
        type: 'wav',
      });
      ret.push({
        id: recording.id,
        text: 'MP3',
        type: 'mp3',
      });

      const { Transcription } = this.$FeathersVuex.api;
      const { data: transcriptions } = Transcription.findInStore({ query: { documentId: recording.id, $sort: { revision: 1 } } });


      transcriptions.forEach(transcription => {
        ret.push({
          id: recording.id,
          transcriptionId: transcription.id,
          text: 'Redacted MP3 (Transcript ' + (transcription.revision) + ')' ,
          type: 'mp3',
          redact: true,
        });
      })

      return ret;
    },
    fetchDiaryData() {
      const diary = this.currentDiary;
      if (diary.id) {
      };
    },
    saveClone({ event, clone }) {
      clone.commit();
      clone.save();
    },
    resetClone({ event, clone }) {
      clone.reset();
      event.target.blur();
    },
    clearDiaryDialog() {
      this.showDiaryEditor = false;
      this.$refs.diaryObserver.reset();
    },
    clearProfileDialog() {
      this.showProfileEditor = false;
    },
    toggle(prop, sub) {
      const clone = this.currentDiary.clone();
      if (sub) {
        clone[sub][prop] = !clone[sub][prop];
      } else {
        clone[prop] = !clone[prop];
      }
      clone.commit();
      clone.save();
    },
    updateEditingStatus(status) {
      const clone = this.currentDiary.clone();
      clone.metadata.editingStatus = status || null;
      clone.commit();
      clone.save();
    },
    removeTranscript(transcript) {
      this.$confirm('Are you sure you would like to delete this Transcript?',
        {
          title: 'Delete Transcript?',
          icon: 'fas fa-question',
          color: 'msu',
          buttonTrueText: 'Yes',
          buttonFalseText: 'Whoops',
        })
        .then((choice) => {
          if (choice) {
            transcript.remove();
            this.transcriptPanelsExpanded = [];
          }
        });
    },
    removeDiary() {
      if (this.currentDiary.id) {
        this.removeDiaryBtn.text = '... bye';
        this.removeDiaryBtn.disabled = 'disabled';
        feathersClient.service('adminMaintenance').create({
          action: 'diary:remove',
          id: this.currentDiary.id,
          actuallyDelete: false,
        })
        .then((ret) => {
          this.$confirm(`
            Are you extra sure? This will delete the recording and:<br><br>
            <ul>
              <li><strong>${ret.relatedDocumentCount} files</strong></>
              <li><strong>${ret.relatedTranscriptionCount} transcripts</strong></>
              <li><strong>${ret.relatedTranscriptSentenceCount} sentences</strong></>
            </ul><br>
            from the file system and database.
            `, 
            {
              title: 'Delete all recording data',
              icon: 'fas fa-question',
              color: 'msu',
              buttonTrueText: 'Yes',
              buttonFalseText: 'Whoops',
            })
            .then((conf) => {
              if (conf) {
                feathersClient.service('adminMaintenance').create({
                  action: 'diary:remove',
                  id: this.currentDiary.id,
                  actuallyDelete: true,
                })
                .then((ret) => {
                  this.$store.dispatch('alert/display',
                    {
                      type: 'success',
                      message: 'Removed Recording and files!',
                      timeout: 1000,
                      icon: 'fa-thumbs-up',
                    },
                    { root: true });
                  this.$router.push({ name: 'adminDiariesList' });
                })
                .catch((err) => {
                  this.removeDiaryError = true;
                  this.$store.dispatch('alert/display',
                    {
                      type: 'error',
                      message: err.message,
                      timeout: 2500,
                      icon: 'fa-exclamation',
                    },
                    { root: true });
                  setTimeout(() => {
                    this.removeDiaryBtn.text = 'Delete Recording';
                    this.removeDiaryBtn.disabled = false;
                    Promise.resolve(true);
                  }, 500);
                });
              } else {
                this.removeDiaryBtn.text = 'Delete Recording';
                this.removeDiaryBtn.disabled = false;
              }
            });
        })
        .catch((err) => {
          this.removeDiaryError = true;
          this.$store.dispatch('alert/display',
            {
              type: 'error',
              message: err.message,
              timeout: 2500,
              icon: 'fa-exclamation',
            },
            { root: true });
          setTimeout(() => {
            this.removeDiaryBtn.text = 'Delete Recording';
            this.removeDiaryBtn.disabled = false;
            Promise.resolve(true);
          }, 500);
        });
      }
    },
    fixMetadata() {
      if (this.currentDiary.metadata) {
        this.metadataIsRunning = true;
        feathersClient.service('adminMaintenance').create({
          action: 'diary:fixMetadata',
          params: {
            diaryId: this.currentDiary.id,
            query: this.availableAudio,
          }
        })
        .catch((err) => { console.log('metadata err', err); })
        .finally(() => {
          setTimeout(() => {
            this.metadataIsRunning = false;
            Promise.resolve(true);
          }, 250);
        });
      }
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
    addToDictionary(word) {
      this.editedDictionaryWord = new this.$FeathersVuex.api.DictionaryWord({ word });
      this.showDictionaryEditor = true;
    },
    clearDictionaryDialog() {
      this.showDictionaryEditor = false;
      this.dictionaryEditorTitle = 'Edit Details';
      this.editedDictionaryWord = new this.$FeathersVuex.api.DictionaryWord();
      this.$refs.editorObserver.reset();
    },
    requestNewTranscript(documentId) {
      if (documentId) {
        this.transcriptIsRunning = true;
        feathersClient.service('adminMaintenance').create({
          action: 'diary:requestNewTranscript',
          params: {
            diaryId: this.currentDiary.id,
            documentId
          }
        })
        .catch((err) => { console.log('transcript err', err); })
        .finally(() => { this.transcriptIsRunning = false; });
      }
    },
    importNewTranscript(documentId) {
      let importedFile = null;
      if (documentId) {
        importedFile = this.$refs.fileInput.files[0];
        if (importedFile) {
          let formData = new FormData();
          formData.append("files[]", importedFile);
          formData.append("secretKey", this.$appStrings('formSecret'));
          formData.append('parentId', this.currentDiary.id);
          formData.append('audioDocumentId', documentId);
          this.isUploading = true;
          axios.post('/api/documents', formData, {
            headers: {
              Authorization: this.$store.state.auth.accessToken,
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: function(progressEvent) {
              this.uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            }.bind(this),
          })
          .then((resp) => {
            this.isCompleted = true;
            this.fileUploadBtn.text = '';
            this.fileUploadBtn.icon = 'fa-check-circle';
            this.uploadResponse = resp;
            this.uploadProgressColor = 'msu success-1';
            this.transcriptPanelsExpanded = [];
          })
          .catch((err) => {
            this.uploadResponse = err;
            this.fileUploadBtn.text = '';
            this.fileUploadBtn.icon = 'fa-exclamation-circle';
          })
          .finally(() => {
            this.isUploading = false;
            setTimeout(() => {
              this.fileUploadBtn.text = 'Import a transcript';
              this.fileUploadBtn.icon = 'fa-file-alt';
              this.uploadProgress = 0;
              this.uploadProgressColor = 'msu accent-orange';
              this.fileInputKey += 1;
              Promise.resolve(true);
            }, 1500);
          });
        }
      }
    },
    convertAudio({id, type, raw = false, redact = false, transcriptionId = null}) {
      const options = {};
      options.to = type;
      options.channels = 1;
      options.redact = redact;
      options.raw = raw;

      if (options.redact && transcriptionId) {
        options.transcriptionId = transcriptionId;
      }

      this.downloader('/api/audio/' + id, this.currentDiary.id, options);
    },
    convertText({id, type, raw = false, format = 'timestamps', redact = false}) {
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
      this.downloader('/api/transcriptions/' + id + '/' + type, id, options);
    },
    downloader(uri, sourceId, options) {

      this.updateDownloadBtnSettings(sourceId, 'isCompleted', false);
      this.updateDownloadBtnSettings(sourceId, 'isDownloading', true);
      this.updateDownloadBtnSettings(sourceId, 'error', '');

      axios.get(uri, {
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
        this.updateDownloadBtnSettings(sourceId, 'isDownloading', false);
        this.updateDownloadBtnSettings(sourceId, 'disabled', true);
        this.updateDownloadBtnSettings(sourceId, 'text', '');
        this.updateDownloadBtnSettings(sourceId, 'icon', 'fa-check-circle');
        var blob = new Blob([resp.data],{type:resp.headers['content-type']});
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.target = "_blank"
        link.download = resp.headers['x-filename'];
        link.click();
        setTimeout(() => {
          this.updateDownloadBtnSettings(sourceId, 'text', 'Download');
          this.updateDownloadBtnSettings(sourceId, 'icon', '');
          this.updateDownloadBtnSettings(sourceId, 'disabled', false);
          this.updateDownloadBtnSettings(sourceId, 'isCompleted', true);
          Promise.resolve(true);
        }, 2000);
      })
      .catch((err) => {
        const errorData = err.response.data instanceof ArrayBuffer
          ? JSON.parse(new TextDecoder('utf-8').decode(err.response.data))
          : err.response.data
        this.updateDownloadBtnSettings(sourceId, 'error', { color: 'red', message: errorData.message });
        this.updateDownloadBtnSettings(sourceId, 'isDownloading', false);
        this.updateDownloadBtnSettings(sourceId, 'disabled', false);
        this.updateDownloadBtnSettings(sourceId, 'text', '');
        this.updateDownloadBtnSettings(sourceId, 'icon', 'fa-exclamation-circle');
        this.updateDownloadBtnSettings(sourceId, 'color', 'msu accent-orange');
        setTimeout(() => {
          this.updateDownloadBtnSettings(sourceId, 'text', 'Download');
          this.updateDownloadBtnSettings(sourceId, 'icon', '');
          this.updateDownloadBtnSettings(sourceId, 'color', '');
          Promise.resolve(true);
        }, 3000);
      })
    },
    updateDownloadBtnSettings(sourceId, key, value) {
      this.$set(this.downloadBtnSettings, sourceId, { ...this.downloadBtnSettings[sourceId], [key]: value });
    },
    updatePlayerStatus(action) {
      switch (action) {
        case 'playing': 
          this.playerStatus.playing = true;
          this.playerStatus.paused = false;
          break;
        case 'pause': 
          this.playerStatus.playing = false;
          this.playerStatus.paused = true;
          break;
        case 'ended': 
          this.playerStatus.playing = false;
          this.playerStatus.paused = false;
          break;
        case 'seeking': 
          this.playerStatus.requestedChunk = null;
          break;
        default :
          this.playerStatus.playing = false;
          this.playerStatus.paused = false;
      }
    },
    playerControl(action, chunk) {
        if (this.$refs.player) {
          switch (action) {
            case 'play':
              if (chunk && chunk.id) {
                if (chunk.id !== this.playerStatus.requestedChunk) {
                  this.playerStatus.requestedChunk = chunk.id;
                  this.playerStatus.requestedChunkStart = chunk.startTime;
                  this.playerStatus.requestedChunkEnd = chunk.endTime;
                  this.$refs.player.currentTime = chunk.startTime;
                }
              } else {
                this.playerStatus.requestedChunk = null;
              }
              this.$refs.player.play();
              break;
            case 'pause':
              this.$refs.player.pause();
              break;
          } 
        }
    },
    updatePlayerTime() {
      if (this.$refs.player) {
        this.playerStatus.currentTime = this.$refs.player.currentTime;
        if (this.playerStatus.requestedChunk && this.playerStatus.currentTime >= this.playerStatus.requestedChunkEnd) {
          this.$refs.player.pause();
          this.playerStatus.requestedChunk = null;
          this.$refs.player.currentTime = this.playerStatus.currentTime = (this.playerStatus.requestedChunkEnd - .01);
        }
      } else {
        this.playerStatus.currentTime = 0;
      }
    },
    scrollToItem(id) {
      const el = document.getElementById(id)
      if (el) {
        el.style.boxShadow = "0px 0px 0px 3px red inset";
        window.scrollTo(0, el.offsetTop);
        setTimeout(() => {
          el.style.boxShadow = "";
        }, 2500);
      }
    },
    addSentence(parent) {
      const obj = new this.$FeathersVuex.api.TranscriptSentence({
        transcriptionId: parent.transcriptionId,
        startTime: parent.endTime,
        metadata: {
          header2: 'SID',
          speaker: 1,
        },
      });
      const newSentence = obj.save();
    },
    removeSentence(obj) {
      this.$confirm('Are you sure you want to delete this Sentence?', 
        {
          title: 'Delete Sentence',
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
    async updateRedactFlag(obj) {
      const clone = obj.clone();
      clone.metadata.redact = !clone.metadata.redact;
      clone.commit();
      await clone.save();
    },
  },
  watch: {
    id: {
      async handler(val) {
        if (!val) {
          this.$router.push({ name: (this.isElevated) ? 'adminDiariesList' : 'basicDiariesList'  });
        }
        const { Diary } = this.$FeathersVuex.api;
        const diaryAlreadyLoaded = Diary.getFromStore(val);

        if (diaryAlreadyLoaded) {
          this.currentDiary = diaryAlreadyLoaded;
          this.fetchDiaryData();
        } else {
          await Diary.get(val)
            .then((resp) => {
              this.currentDiary = resp;
              this.fetchDiaryData();
            })
            .catch((err) => {
              let errMsg = '';
              // error: check FeathersError
              // if record not found, display error and route back
              if (err.name) {
                errMsg = (err.name === 'NotFound')
                  ? 'No Recording found for this ID!'
                  : 'There was a problem loading that Recording!';
              }
              this.$store.dispatch('alert/display',
                {
                  type: 'error',
                  message: errMsg,
                  timeout: 2500,
                  icon: 'fa-exclamation',
                },
                { root: true });
              this.$router.push({ name: (this.isElevated) ? 'adminDiariesList' : 'basicDiariesList' });
            });
        }
      },
      immediate: true,
    },
  },
  created() {
    // TODO: add checks for deleted, not this user, etc
    if (!this.id) {
      this.$router.push({ name: (this.isElevated) ? 'adminDiariesList' : 'basicDiariesList'  });
    }
  },
};
</script>
