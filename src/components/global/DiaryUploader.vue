<template>
  <span>
    <ValidationObserver ref="uploadObserver" v-slot="{ invalid, validate }">
      <v-row>
        <v-col cols="12" md="6">
          <v-menu
            ref="menu"
            v-model="menu"
            :close-on-content-click="false"
            :return-value.sync="selectedDate"
            transition="scale-transition"
            offset-y
            min-width="290px"
          >
            <template v-slot:activator="{ on }">
              <ValidationProvider
                :ref="selectedDate"
                name="Recording Date"
                rules="required|date_format:YYYY-MM-DD"
                v-slot="{ errors }">
                <v-text-field
                  v-model="selectedDate"
                  label="Recording Date"
                  :error-messages="errors"
                  clearable
                  prepend-icon="fa-calendar"
                  v-on="on"
                  hint="YYYY-MM-DD"
                  :persistent-hint="true"
                  @change="updateDate(selectedDate)"
                ></v-text-field>
              </ValidationProvider>
            </template>
            <v-date-picker
              ref="picker"
              v-model="selectedDate"
              color="msu"
              @change="updateDate(selectedDate)"
            >
              <v-spacer></v-spacer>
              <v-btn text color="primary" @click="menu = false">Cancel</v-btn>
            </v-date-picker>
          </v-menu>
        </v-col>
        <v-col cols="12" md="8">
          <v-file-input :label="(multiple) ? 'Select file(s)' : 'Select a file'" v-model="fileList" :disabled="isUploading" ref="fileInput" name="file" :loading="isUploading" :multiple="multiple" chips></v-file-input>
        </v-col>
        <v-col cols="12" md="4">
          <v-switch
            label="Transcribe?"
            v-model="transcribeEnabled"
            :hide-details="true"
            color="msu"
          />
        </v-col>
      </v-row>
      <v-row v-if="elanError || elanFile">
        <v-col cols="12">
          <v-alert v-if="elanError" type="error" dense text class="text-body-2 mb-0">
            {{ elanError }}
          </v-alert>
          <v-alert
            v-else
            dense
            text
            outlined
            color="msu"
            class="text-body-2 mb-0">
            <v-row dense align="center">
              <v-col cols="12" sm="8">
                <strong>{{ elanFile.name }}</strong><br>
                <span v-if="elanTierMap" color="msu">
                  Will create {{ elanSummary }}.
                </span>
                <span v-else>
                  ELAN file selected &mdash; choose which tiers become which transcripts before uploading.
                </span>
              </v-col>
              <v-col cols="12" sm="4" class="text-sm-right">
                <v-btn small class="white black--text" @click.stop="showTierMapper = true">
                  <v-icon small class="mr-2">fa-layer-group</v-icon>
                  {{ elanTierMap ? 'Change mapping' : 'Map tiers' }}
                </v-btn>
              </v-col>
            </v-row>
          </v-alert>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="2" class="d-flex">
          <v-btn
            type="button"
            class="flex-grow-1"
            @click.stop="uploadFile"
            :disabled="!fileList || !validDate(selectedDate) || uploadBlocked"
            :loading="isUploading"
            :color="fileUploadBtn.color">
            <v-icon v-if="fileUploadBtn.icon" color="white" v-text="fileUploadBtn.icon"></v-icon>
            {{ fileUploadBtn.text }}
            <span slot="loader">
              {{ uploadProgress }}%
            </span>
          </v-btn>
        </v-col>
      </v-row>
    </ValidationObserver>

    <ElanTierMapper
      v-model="showTierMapper"
      :file="elanFile"
      :audioDuration="audioDuration"
      @confirm="applyTierMap">
    </ElanTierMapper>
  </span>
</template>

<script>
/* eslint-disable */
import axios from 'axios';
import { mapGetters, mapActions } from 'vuex';
import feathersVuexFormHelpers from '@/mixins/feathersVuexFormHelpers';

export default {
  mixins: [
    feathersVuexFormHelpers,
  ],
  props: {
    parentDisabled: {
      type: Boolean,
      default: false,
    },
    allowTypeChange: {
      type: Boolean,
      default: true,
    },
    profileId: {
      type: String,
      default: '',
    },
    documentTypeId: {
      type: String,
      default: '',
    },
    multiple: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isUploading: false,
      isCompleted: false,
      fileType: this.documentTypeId,
      uploadResponse: null,
      pendingUploadCount: 0,
      uploadProgress: 0,
      uploadProgressColor: 'msu accent-orange',
      fileList: null,
      fileUploadBtn: {
        text: 'Upload',
        color: 'msu lighten-1',
        icon: '',
      },
      selectedDate: null,
      menu: false,
      transcribeEnabled: true,
      textFileTypes: [
        "txt",
        "tsv",
      ],
      elanFileTypes: [
        "eaf",
      ],
      audioFileTypes: [
        "m4a",
        "mp4",
        "webm",
        "wav",
        "ogg",
        "flac",
        "mp3",
      ],
      elanFile: null,
      elanTierMap: null,
      elanError: '',
      showTierMapper: false,
      audioDuration: 0,
    };
  },
  computed: {
    uploadBlocked() {
      return !!this.elanError || (!!this.elanFile && !this.elanTierMap);
    },
    elanSummary() {
      if (!this.elanTierMap) {
        return '';
      }
      return this.elanTierMap
        .map(g => `"${g.label}" (${g.tiers.length} tier${g.tiers.length === 1 ? '' : 's'})`)
        .join(' and ');
    },
  },
  methods: {
    extensionOf(file) {
      const parts = file.name.split('.');
      return parts[parts.length - 1].toLowerCase();
    },
    isOfType(file, types) {
      return types.indexOf(this.extensionOf(file)) !== -1;
    },
    readAudioDuration(file) {
      return new Promise(resolve => {
        const url = URL.createObjectURL(file);
        const probe = document.createElement('audio');
        probe.preload = 'metadata';
        probe.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve(isFinite(probe.duration) ? probe.duration : 0);
        };
        probe.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(0);
        };
        probe.src = url;
      });
    },
    applyTierMap({ tierMap }) {
      this.elanTierMap = tierMap;
    },
    async inspectSelection(files) {
      this.elanFile = null;
      this.elanTierMap = null;
      this.elanError = '';
      this.audioDuration = 0;
      if (!files || !files.length) {
        return;
      }

      const elanFiles = files.filter(f => this.isOfType(f, this.elanFileTypes));
      if (elanFiles.length > 1) {
        this.elanError = 'Only one ELAN (.eaf) file can be imported per upload to support mapping; if you have multiple, add them as separate recordings'
        return;
      }
      if (!elanFiles.length) {
        return;
      }

      const audioFile = files.find(f => this.isOfType(f, this.audioFileTypes));
      if (!audioFile) {
        this.elanError = 'ELAN file detected; please include an audio file for it';
        return;
      }
      this.audioDuration = await this.readAudioDuration(audioFile);

      this.elanFile = elanFiles[0];
      this.showTierMapper = true;
    },
    validDate(value) {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(value)) {
        return false;
      }
      const date = new Date(value);
      const isValidDate = date instanceof Date && !isNaN(date);

      const [year, month, day] = value.split('-');
      const dateYear = date.getUTCFullYear().toString();
      const dateMonth = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const dateDay = date.getUTCDate().toString().padStart(2, '0');

      return isValidDate && year === dateYear && month === dateMonth && day === dateDay;
    },
    updateDate(date) {
      this.$refs.menu.save(date);
      this.selectedDate = date;
      this.menu = false;
    },
    uploadFile() {
      if (this.fileList) {
        let formData = new FormData();
        this.fileList.forEach(file => {
          formData.append("files[]", file);
        })
        formData.append("secretKey", this.$appStrings('formSecret'));
        formData.append('profileId', this.profileId);
        formData.append('diaryDate', this.selectedDate);
        formData.append('transcribe', this.transcribeEnabled);
        if (this.elanTierMap) {
          formData.append('tierMap', JSON.stringify(this.elanTierMap));
        }
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
          this.fileList = null;
          this.fileUploadBtn.text = '';
          this.fileUploadBtn.icon = 'fa-check-circle';
          this.uploadResponse = resp;
          this.uploadProgressColor = 'msu success-1';
        })
        .catch((err) => {
          this.uploadResponse = err;
          this.fileUploadBtn.text = '';
          this.fileUploadBtn.icon = 'fa-exclamation-circle';
        })
        .finally(() => {
          this.isUploading = false;
          setTimeout(() => {
            this.fileUploadBtn.text = 'Upload';
            this.fileUploadBtn.icon = '';
            this.uploadProgress = 0;
            this.uploadProgressColor = 'msu accent-orange';
            Promise.resolve(true);
          }, 1500);
        });
      }
    },
  },
  watch: {
    fileList(files) {
      if (files) {
        files.forEach(file => {
          if (this.textFileTypes.some(textFileType => file.name.split('.')[file.name.split('.').length-1].includes(textFileType))) {
            this.transcribeEnabled = false;
          }
          if (this.isOfType(file, this.elanFileTypes)) {
            this.transcribeEnabled = false;
          }
        })
      }
      this.inspectSelection(files);
    }
  }
};
</script>
