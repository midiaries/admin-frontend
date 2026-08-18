<template>
  <AppDrawer
    :items="items">
  </AppDrawer>
</template>

<script>
import { appComputed, authComputed } from '@/store/helpers';

export default {
  data() {
    return {
      item: '',
    };
  },
  computed: {
    ...appComputed,
    ...authComputed,
    mini() {
      return (this.$vuetify.breakpoint.mdAndDown);
    },
    items() {
      return [
        {
          text: 'Quick Add: Recording',
          icon: 'fa-plus-circle',
          route: 'basicDiaryUpload',
        },
        {
          text: 'Recordings',
          icon: 'fa-book',
          route: 'basicDiariesList',
        },
      ];
    },
  },
};
</script>

<style lang="scss">
</style>
