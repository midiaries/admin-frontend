import LayoutBlank from '@/components/global/Layout/Blank.vue';

export default [
  {
    path: '/admin',
    component: LayoutBlank,
    meta: {
      authRequired: true,
      elevatedRequired: true,
      layout: {
        component: 'LayoutAdmin',
      },
      sidebar: {
        component: 'DrawerAdmin',
        visible: true,
      },
    },
    children: [
      {
        path: '',
        name: 'adminHome',
        component: () => import(/* webpackChunkName: "adminHome" */ '@/router/views/admin/Home.vue'),
      },
      {
        path: 'profile',
        name: 'adminProfile',
        component: () => import(/* webpackChunkName: "adminProfile" */ '@/router/views/UserProfile.vue'),
        meta: {
          sidebar: {
            visible: false,
          },
        },
      },
      {
        path: 'manage',
        component: LayoutBlank,
        children: [
          {
            path: '',
            name: 'adminManage',
            component: () => import(/* webpackChunkName: "adminManage" */ '@/router/views/admin/Manage.vue'),
          },
          {
            path: 'users',
            name: 'adminUsersList',
            component: () => import(/* webpackChunkName: "adminUsersList" */ '@/router/views/admin/UsersList.vue'),
            meta: {
              roleRequired: 'admin',
            },
          },
          {
            path: 'recordingPeriods',
            name: 'adminDiaryPayPeriodsList',
            component: () => import(/* webpackChunkName: "adminDiaryPayPeriodsList" */ '@/router/views/admin/DiaryPayPeriods/List.vue'),
          },
          {
            path: 'paymentGroups',
            name: 'adminPaymentGroupsList',
            component: () => import(/* webpackChunkName: "adminPaymentGroupsList" */ '@/router/views/admin/PaymentGroups/List.vue'),
          },
          {
            path: 'participantCategories',
            name: 'adminParticipantCategoriesList',
            component: () => import(/* webpackChunkName: "adminParticipantCategoriesList" */ '@/router/views/admin/ParticipantCategories/List.vue'),
          },
        ],
      },
      {
        path: 'research',
        component: LayoutBlank,
        children: [
          {
            path: 'processingJobs',
            component: LayoutBlank,
            meta: {
              roleRequired: 'researchManager',
            },
            children: [
              {
                path: '',
                name: 'adminResearchProcessingJobsList',
                component: () => import(/* webpackChunkName: "adminResearchProcessingJobsList" */ '@/router/views/admin/ProcessingJobs/List.vue'),
              },
            ],
          },
          {
            path: 'remoteWorkers',
            component: LayoutBlank,
            meta: {
              roleRequired: 'researchManager',
            },
            children: [
              {
                path: '',
                name: 'adminResearchRemoteWorkersList',
                component: () => import(/* webpackChunkName: "adminResearchRemoteWorkersList" */ '@/router/views/admin/RemoteWorkers/List.vue'),
              },
            ],
          },
        ],
      },
      {
        path: 'transcriptions',
        component: LayoutBlank,
        meta: {
          roleRequired: 'transcriptManager',
        },
        children: [
          {
            path: '',
            name: 'adminTranscriptionManagerList',
            component: () => import(/* webpackChunkName: "adminTranscriptionManagerList" */ '@/router/views/admin/TranscriptionManager/List.vue'),
          },
        ],
      },
      {
        path: 'dictionary',
        component: LayoutBlank,
        children: [
          {
            path: '',
            name: 'adminDictionaryWordsList',
            component: () => import(/* webpackChunkName: "adminDictionaryWordsList" */ '@/router/views/admin/DictionaryWords/List.vue'),
          },
        ],
      },
      {
        path: 'recordings',
        component: LayoutBlank,
        children: [
          {
            path: '',
            name: 'adminDiariesList',
            component: () => import(/* webpackChunkName: "adminDiariesList" */ '@/router/views/admin/Diaries/List.vue'),
          },
          {
            path: 'upload',
            name: 'adminDiaryUpload',
            component: () => import(/* webpackChunkName: "adminDiariesCreate" */ '@/router/views/admin/Diaries/Create.vue'),
          },
          {
            path: ':id',
            name: 'adminDiaryDetails',
            component: () => import(/* webpackChunkName: "adminDiariesDetail" */ '@/router/views/admin/Diaries/Detail.vue'),
            props: true,
          },
        ],
      },
      {
        path: 'profiles',
        component: LayoutBlank,
        children: [
          {
            path: '',
            name: 'adminProfilesList',
            component: () => import(/* webpackChunkName: "adminProfilesList" */ '@/router/views/admin/Profiles/List.vue'),
          },
          {
            path: 'new',
            name: 'adminProfileUpload',
            component: () => import(/* webpackChunkName: "adminProfilesCreate" */ '@/router/views/admin/Profiles/Create.vue'),
          },
          {
            path: ':id',
            name: 'adminProfileDetails',
            component: () => import(/* webpackChunkName: "adminProfilesDetail" */ '@/router/views/admin/Profiles/Detail.vue'),
            props: true,
          },
        ],
      },
      {
        path: 'subjects',
        component: LayoutBlank,
        children: [
          {
            path: '',
            name: 'adminSubjectsList',
            component: () => import(/* webpackChunkName: "adminSubjectsList" */ '@/router/views/admin/Subjects/List.vue'),
          },
          {
            path: ':id',
            name: 'adminSubjectDetails',
            component: () => import(/* webpackChunkName: "adminSubjectsDetail" */ '@/router/views/admin/Subjects/Detail.vue'),
            props: true,
          },
        ],
      },
      {
        path: 'reports',
        component: LayoutBlank,
        children: [
          {
            path: '',
            name: 'adminReportsList',
            component: () => import(/* webpackChunkName: "adminReportsList" */ '@/router/views/admin/Reports/List.vue'),
          },
          {
            path: 'duration-summaries',
            name: 'adminReportsDurationSummary',
            component: () => import(/* webpackChunkName: "adminReportsDurationSummary" */ '@/router/views/admin/Reports/DurationSummary.vue'),
            props: true,
          },
          {
            path: 'recording-filterer',
            name: 'adminReportsDiaryFilterer',
            component: () => import(/* webpackChunkName: "adminReportsDiaryFilterer" */ '@/router/views/admin/Reports/DiaryFilterer.vue'),
            props: true,
          },
          {
            path: 'content-search',
            name: 'adminReportsContentSearch',
            component: () => import(/* webpackChunkName: "adminReportsContentSearch" */ '@/router/views/admin/Reports/ContentSearch.vue'),
            props: true,
          },
        ],
      },
    ],
  },
  {
    path: '/my',
    alias: ['/base'],
    component: LayoutBlank,
    meta: {
      authRequired: true,
      layout: {
        component: 'LayoutBasic',
      },
      sidebar: {
        component: 'DrawerBasic',
        visible: true,
      },
    },
    children: [
      {
        path: '',
        name: 'basicHome',
        component: () => import(/* webpackChunkName: "basicHome" */ '@/router/views/Home.vue'),
        meta: { sidebar: { visible: true } },
      },
      {
        path: 'recordings',
        component: LayoutBlank,
        name: 'basicDiaries',
        children: [
          {
            path: '',
            name: 'basicDiariesList',
            component: () => import(/* webpackChunkName: "basicDiariesList" */ '@/router/views/basic/Diaries/List.vue'),
          },
          {
            path: 'upload',
            name: 'basicDiaryUpload',
            component: () => import(/* webpackChunkName: "basicDiariesCreate" */ '@/router/views/admin/Diaries/Create.vue'),
          },
          {
            path: ':id',
            name: 'basicDiaryDetails',
            component: () => import(/* webpackChunkName: "basicDiariesDetail" */ '@/router/views/admin/Diaries/Detail.vue'),
            props: true,
          },
        ],
      },
      {
        path: 'profile',
        name: 'basicProfile',
        component: () => import(/* webpackChunkName: "basicProfile" */ '@/router/views/UserProfile.vue'),
        meta: {
          sidebar: {
            visible: false,
          },
        },
      },
      /* {
        path: 'dictionary',
        component: LayoutBlank,
        children: [
          {
            path: '',
            name: 'adminDictionaryWordsList',
            component: () => import(/ *webpackChunkName: "adminDictionaryWordsList"* / '@/router/views/admin/DictionaryWords/List.vue'),
          },
        ],
      }, */
    ],
  },
];
