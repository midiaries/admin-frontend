<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    width="900px"
    :fullscreen="$vuetify.breakpoint.smAndDown"
    persistent
    scrollable>
    <v-card>
      <v-card-title class="msu dark-grey white--text">
        <span class="text-h5">Map ELAN Tiers</span>
        <v-spacer></v-spacer>
        <v-icon class="white--text">fa-layer-group</v-icon>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-alert v-if="parseError" type="error" dense text>
          {{ parseError }}
        </v-alert>

        <template v-else>
          <div class="text-body-2 mb-3">
            <strong>{{ fileName }}</strong>
            &middot; {{ tiers.length }} tier{{ tiers.length === 1 ? '' : 's' }}
            &middot; {{ totalAnnotations }} annotations
            &middot; {{ toSexagesimal(maxEnd, 'seconds') }} long
          </div>

          <v-alert v-if="durationWarning" type="warning" dense text class="text-body-2">
            {{ durationWarning }}
          </v-alert>

          <div class="text-body-2 mb-2">
            Tiers sharing a <em>Transcript</em> type will be merged into one transcript, interleaved
            by time. Give the participant <strong>Speaker #1</strong>, others as 2+
          </div>

          <v-card outlined class="mb-3">
            <v-card-text class="py-2">
              <v-row dense align="center">
                <v-col cols="12" md="7">
                  <div class="text-caption grey--text text--darken-1 mb-1">
                    Transcript types (add more if not just original/translation)
                  </div>
                  <v-chip
                    v-for="type in types"
                    :key="type"
                    small
                    class="mr-1 mb-1"
                    :close="!typeInUse(type)"
                    @click:close="removeType(type)">
                    {{ type }}
                  </v-chip>
                </v-col>
                <v-col cols="12" md="5">
                  <v-text-field
                    v-model="newType"
                    label="Add a transcript type"
                    :error-messages="typeError"
                    dense
                    outlined
                    hide-details="auto"
                    append-outer-icon="fa-plus"
                    @click:append-outer="addType"
                    @keyup.enter="addType">
                  </v-text-field>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card outlined v-for="(row, idx) in rows" :key="row.tierId" class="mb-2">
            <v-card-text class="py-2">
              <v-row dense align="center">
                <v-col cols="12" md="4">
                  <v-checkbox
                    v-model="row.include"
                    :label="row.tierId"
                    color="msu"
                    hide-details
                    class="mt-0 pt-0 font-weight-bold">
                  </v-checkbox>
                  <div class="text-caption grey--text text--darken-1 ml-8">
                    <span v-if="tiers[idx].participant">{{ tiers[idx].participant }} &middot; </span>
                    {{ tiers[idx].annotations.length }} annotations<br/>
                    <span v-if="tiers[idx].annotations.length">
                      {{ toSexagesimal(tiers[idx].startMs / 1000, 'seconds') }}&ndash;{{ toSexagesimal(tiers[idx].endMs / 1000, 'seconds') }}
                    </span>
                  </div>
                  <div v-if="tiers[idx].sample" class="text-caption font-italic grey--text ml-8 text-truncate">
                    &ldquo;{{ tiers[idx].sample }}&rdquo;
                  </div>
                </v-col>
                <v-col cols="12" sm="4" md="3">
                  <v-select
                    v-model="row.group"
                    :items="groupNames"
                    :disabled="!row.include"
                    label="Transcript"
                    dense
                    outlined
                    hide-details>
                  </v-select>
                </v-col>
                <v-col cols="6" sm="3" md="2">
                  <v-text-field
                    v-model.number="row.speaker"
                    :disabled="!row.include"
                    label="Speaker"
                    type="number"
                    min="1"
                    dense
                    outlined
                    hide-details>
                  </v-text-field>
                </v-col>
                <v-col cols="6" sm="5" md="3">
                  <v-text-field
                    v-model="row.header2"
                    :disabled="!row.include"
                    label="Header2"
                    dense
                    outlined
                    hide-details>
                  </v-text-field>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-divider class="my-3"></v-divider>

          <div class="text-body-2">
            <strong>Will create:</strong>
            <span v-if="!summary.length" class="red--text"> nothing &mdash; no tiers selected</span>
            <ul v-else class="mt-1">
              <li v-for="(group, i) in summary" :key="group.label">
                Transcript {{ i + 1 }} &mdash; <strong>{{ group.label }}</strong>:
                {{ group.sentenceCount }} lines from {{ group.tierCount }}
                tier{{ group.tierCount === 1 ? '' : 's' }}
              </li>
            </ul>
          </div>

          <v-alert v-if="validationError" type="error" dense text class="mt-3 text-body-2">
            {{ validationError }}
          </v-alert>
        </template>
      </v-card-text>

      <v-card-actions>
        <v-btn
          class="msu light-grey black--text"
          text @click="cancel">
          Cancel
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          class="msu success white--text"
          :disabled="!!parseError || !!validationError || !summary.length"
          @click="confirm">
          Use this mapping
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
/* eslint-disable */
import formatters from '@/mixins/formatters';
import { readFileAsText, parseTiers, defaultRows, rowsToTierMap, summarise, maxEndSeconds, DEFAULT_TRANSCRIPT_TYPES, MAX_TYPE_LENGTH } from '@/utils/elan';

export default {
  mixins: [
    formatters,
  ],
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    file: {
      type: File,
      default: null,
    },
    audioDuration: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      tiers: [],
      rows: [],
      types: [],
      newType: '',
      typeError: '',
      parseError: '',
    };
  },
  computed: {
    fileName() {
      return this.file ? this.file.name : '';
    },
    totalAnnotations() {
      return this.tiers.reduce((sum, t) => sum + t.annotations.length, 0);
    },
    maxEnd() {
      return maxEndSeconds(this.tiers);
    },
    groupNames() {
      const names = this.types.slice();
      this.rows.forEach(r => {
        const label = String(r.group || '').trim();
        if (label && names.indexOf(label) === -1) {
          names.push(label);
        }
      });
      return names;
    },
    summary() {
      return this.tiers.length ? summarise(this.tiers, this.rows) : [];
    },
    durationWarning() {
      if (!this.audioDuration || !this.maxEnd) {
        return '';
      }
      if (this.maxEnd > this.audioDuration + 1) {
        return `This transcript runs to ${this.toSexagesimal(this.maxEnd, 'seconds')} but the selected audio is only `
          + `${this.toSexagesimal(this.audioDuration, 'seconds')} long. Check that the .eaf matches this recording`;
      }
      return '';
    },
    validationError() {
      const active = this.rows.filter(r => r.include);
      if (!active.length) {
        return '';
      }
      const badSpeaker = active.find(r => !Number.isInteger(Number(r.speaker)) || Number(r.speaker) < 1);
      if (badSpeaker) {
        return `Speaker for "${badSpeaker.tierId}" must be 1 or higher`;
      }
      const clashes = {};
      let clash = '';
      active.forEach(r => {
        const key = `${String(r.group || '').trim()}::${Number(r.speaker)}::${String(r.header2 || '').trim()}`;
        if (clashes[key]) {
          clash = `"${clashes[key]}" and "${r.tierId}" will appear identical`;
        }
        clashes[key] = r.tierId;
      });
      return clash;
    },
  },
  methods: {
    typeInUse(type) {
      return this.rows.some(r => String(r.group || '').trim() === type);
    },
    addType() {
      const name = String(this.newType || '').trim();
      this.typeError = '';
      if (!name) {
        return;
      }
      if (name.length > MAX_TYPE_LENGTH) {
        this.typeError = `Keep it short, <${MAX_TYPE_LENGTH}`;
        return;
      }
      if (this.types.some(t => t.toLowerCase() === name.toLowerCase())) {
        this.typeError = `"${name}" is already in the list`;
        return;
      }
      this.types.push(name);
      this.newType = '';
    },
    removeType(type) {
      this.types = this.types.filter(t => t !== type);
      this.typeError = '';
    },
    async load() {
      this.parseError = '';
      this.tiers = [];
      this.rows = [];
      this.types = DEFAULT_TRANSCRIPT_TYPES.slice();
      this.newType = '';
      this.typeError = '';
      if (!this.file) {
        return;
      }
      try {
        const text = await readFileAsText(this.file);
        const tiers = parseTiers(text);
        if (!tiers.length) {
          this.parseError = 'The .eaf contains no tiers';
          return;
        }
        this.tiers = tiers;
        this.rows = defaultRows(tiers);
        this.rows.forEach(r => {
          const label = String(r.group || '').trim();
          if (label && this.types.indexOf(label) === -1) {
            this.types.push(label);
          }
        });
      } catch (err) {
        this.parseError = err.message;
      }
    },
    confirm() {
      this.$emit('confirm', {
        file: this.file,
        tierMap: rowsToTierMap(this.rows),
      });
      this.$emit('input', false);
    },
    cancel() {
      this.$emit('cancel');
      this.$emit('input', false);
    },
  },
  watch: {
    value(open) {
      if (open) {
        this.load();
      }
    },
  },
};
</script>
