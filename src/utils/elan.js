/* eslint-disable */

const TRANSLATION_SUFFIX = /_translation$/i;
const MAX_REF_DEPTH = 20;

export const DEFAULT_TRANSCRIPT_TYPES = ['original', 'translation'];

export const MAX_TYPE_LENGTH = 40;

export const readFileAsText = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
  reader.readAsText(file);
});

const valueOf = node => {
  const el = node.getElementsByTagName('ANNOTATION_VALUE')[0];
  return el ? (el.textContent || '').trim() : '';
};

export const parseTiers = xmlText => {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('This file is not valid XML.');
  }
  const root = doc.documentElement;
  if (!root || root.nodeName !== 'ANNOTATION_DOCUMENT') {
    throw new Error('Not an ELAN document: missing ANNOTATION_DOCUMENT.');
  }

  const timeSlots = {};
  const slots = root.getElementsByTagName('TIME_SLOT');
  for (let i = 0; i < slots.length; i += 1) {
    const id = slots[i].getAttribute('TIME_SLOT_ID');
    const value = slots[i].getAttribute('TIME_VALUE');
    if (id !== null && value !== null) {
      timeSlots[id] = Number(value);
    }
  }

  const tierNodes = root.getElementsByTagName('TIER');
  const boundsById = {};
  const refParentById = {};

  for (let i = 0; i < tierNodes.length; i += 1) {
    const aligned = tierNodes[i].getElementsByTagName('ALIGNABLE_ANNOTATION');
    for (let j = 0; j < aligned.length; j += 1) {
      const start = timeSlots[aligned[j].getAttribute('TIME_SLOT_REF1')];
      const end = timeSlots[aligned[j].getAttribute('TIME_SLOT_REF2')];
      if (start !== undefined && end !== undefined) {
        boundsById[aligned[j].getAttribute('ANNOTATION_ID')] = { startMs: start, endMs: end };
      }
    }
    const refs = tierNodes[i].getElementsByTagName('REF_ANNOTATION');
    for (let j = 0; j < refs.length; j += 1) {
      refParentById[refs[j].getAttribute('ANNOTATION_ID')] = refs[j].getAttribute('ANNOTATION_REF');
    }
  }

  const resolveRef = annotationId => {
    let current = annotationId;
    for (let depth = 0; depth < MAX_REF_DEPTH; depth += 1) {
      if (boundsById[current]) {
        return boundsById[current];
      }
      const parent = refParentById[current];
      if (parent === undefined || parent === null) {
        return undefined;
      }
      current = parent;
    }
    return undefined;
  };

  const tiers = [];
  for (let i = 0; i < tierNodes.length; i += 1) {
    const tierNode = tierNodes[i];
    const annotations = [];
    const wrappers = tierNode.getElementsByTagName('ANNOTATION');

    for (let j = 0; j < wrappers.length; j += 1) {
      const child = wrappers[j].firstElementChild;
      if (!child) {
        continue;
      }
      const value = valueOf(child);
      if (!value) {
        continue;
      }
      const bounds = child.nodeName === 'REF_ANNOTATION'
        ? resolveRef(child.getAttribute('ANNOTATION_ID'))
        : boundsById[child.getAttribute('ANNOTATION_ID')];
      if (bounds) {
        annotations.push({ startMs: bounds.startMs, endMs: bounds.endMs, value });
      }
    }

    tiers.push({
      tierId: tierNode.getAttribute('TIER_ID'),
      participant: tierNode.getAttribute('PARTICIPANT') || '',
      annotator: tierNode.getAttribute('ANNOTATOR') || '',
      annotations,
      startMs: annotations.length ? Math.min.apply(null, annotations.map(a => a.startMs)) : 0,
      endMs: annotations.length ? Math.max.apply(null, annotations.map(a => a.endMs)) : 0,
      sample: annotations.length ? annotations[0].value : '',
    });
  }

  return tiers;
};

export const defaultRows = tiers => {
  const tierIds = tiers.map(t => t.tierId);
  const baseNameOf = tierId => String(tierId).replace(TRANSLATION_SUFFIX, '');
  const isPairedTranslation = tierId =>
    TRANSLATION_SUFFIX.test(String(tierId)) && tierIds.indexOf(baseNameOf(tierId)) !== -1;

  const speakerByBase = {};
  let nextSpeaker = 1;
  tiers.forEach(t => {
    if (!isPairedTranslation(t.tierId)) {
      speakerByBase[t.tierId] = nextSpeaker;
      nextSpeaker += 1;
    }
  });

  return tiers.map(t => {
    const paired = isPairedTranslation(t.tierId);
    const base = paired ? baseNameOf(t.tierId) : t.tierId;
    return {
      tierId: t.tierId,
      include: true,
      group: paired ? 'translation' : 'original',
      speaker: paired ? speakerByBase[base] : speakerByBase[t.tierId],
      header2: base,
    };
  });
};

export const rowsToTierMap = rows => {
  const order = [];
  const byGroup = {};

  rows.filter(r => r.include).forEach(row => {
    const label = String(row.group || '').trim() || 'original';
    if (!byGroup[label]) {
      byGroup[label] = [];
      order.push(label);
    }
    byGroup[label].push({
      tierId: row.tierId,
      speaker: Number(row.speaker),
      header2: String(row.header2 || row.tierId).trim() || row.tierId,
    });
  });

  return order.map(label => ({ label, tiers: byGroup[label] }));
};

export const summarise = (tiers, rows) => {
  const counts = {};
  tiers.forEach(t => { counts[t.tierId] = t.annotations.length; });
  return rowsToTierMap(rows).map(group => ({
    label: group.label,
    tierCount: group.tiers.length,
    sentenceCount: group.tiers.reduce((sum, t) => sum + (counts[t.tierId] || 0), 0),
  }));
};

export const maxEndSeconds = tiers =>
  tiers.reduce((max, t) => (t.endMs > max ? t.endMs : max), 0) / 1000;
