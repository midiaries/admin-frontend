<template>
  <v-app>
    <app-header />

    <component :is="sidebarComponent" v-if="sidebarVisible" class="elevation-0" />

    <v-main>
      <router-view :key="$route.fullPath" />
    </v-main>

    <app-footer
      v-if="$vuetify.breakpoint.mdAndUp"
      :showContactRow="false"
      email="elc@msu.edu"
      phone="(517) 353-0800"
      sitelink="https://elc.msu.edu/"
      class="elevation-5">
    </app-footer>
  </v-app>
</template>

<script>
import { appComputed } from '@/store/helpers';

export default {
  name: 'LayoutBasic',
  computed: {
    ...appComputed,
  },
};
</script>
