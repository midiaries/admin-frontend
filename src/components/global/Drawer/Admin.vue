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
          route: 'adminDiaryUpload',
        },
        {
          text: 'Recordings',
          icon: 'fa-book',
          route: 'adminDiariesList',
        },
        {
          text: 'Subjects',
          icon: 'fa-users',
          route: 'adminSubjectsList',
        },
        {
          text: 'Dictionary',
          icon: 'fa-quote-right',
          route: 'adminDictionaryWordsList',
        },
        {
          text: 'Reports',
          icon: 'fa-file-contract',
          route: 'adminReportsList',
        },
        {
          text: 'Transcriptions',
          icon: 'fa-list-check',
          roles: 'transcriptManager',
          route: 'adminTranscriptionManagerList',
        },
        {
          text: 'Research',
          icon: 'fa-clipboard-list',
          path: '/admin/research',
          children: [
            // {
            //   text: 'Data Builder',
            //   icon: 'fa-trowel-bricks',
            //   route: 'adminResearchBuilderSimple',
            //   roles: 'researchManager',
            // },
            {
              text: 'Processing Jobs',
              icon: 'fa-bars-progress',
              route: 'adminResearchProcessingJobsList',
              roles: 'researchManager',
            },
            {
              text: 'Workers',
              icon: 'fa-microchip',
              route: 'adminResearchRemoteWorkersList',
              roles: 'researchManager',
            },
          ],
        },
        {
          text: 'Manage',
          icon: 'fa-cogs',
          path: '/admin/manage',
          children: [
            {
              text: 'Participant Categories',
              icon: 'fa-people-group',
              route: 'adminParticipantCategoriesList',
            },
            {
              text: 'Payment Groups',
              icon: 'fa-dollar-sign',
              route: 'adminPaymentGroupsList',
            },
            {
              text: 'Recording Periods',
              icon: 'far fa-calendar-alt',
              route: 'adminDiaryPayPeriodsList',
            },
            {
              text: 'Users',
              icon: 'fa-users',
              route: 'adminUsersList',
              roles: 'admin',
            },
          ],
        },
      ];
    },
  },
};
</script>

<style lang="scss">
</style>
