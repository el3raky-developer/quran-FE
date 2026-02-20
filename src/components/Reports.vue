<template>
  <div class="reports-container">
    <v-row justify="center" class="mt-6" dir="rtl">
      <v-col cols="12" md="3">
        <v-btn block size="large" color="success" @click="goToAccepted">
          كشف المقبولين
        </v-btn>
      </v-col>

      <v-col cols="12" md="3">
        <v-btn block size="large" color="success" @click="goToUnderReview">
          كشف المراجعة
        </v-btn>
      </v-col>

      <v-col cols="12" md="3">
        <v-btn block size="large" color="success" @click="goToHanged">
          كشف المعلقين
        </v-btn>
      </v-col>

      <v-col cols="12" md="3">
        <v-btn block size="large" color="success" @click="goToRejected">
          كشف المرفوضين
        </v-btn>
      </v-col>

      <v-col cols="12" md="3">
        <v-btn block size="large" color="success" @click="goToBaned">
          كشف المحظورين
        </v-btn>
      </v-col>

      <!-- <v-col cols="12" md="3">
        <v-btn block size="large" color="primary" @click="goToAttendance">
          كشف الحضور
        </v-btn>
      </v-col>

      <v-col cols="12" md="3">
        <v-btn block size="large" color="secondary" @click="goToGrades">
          كشف الدرجات
        </v-btn>
      </v-col> -->
    </v-row>
  </div>
  <router-view />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
// const route = useRoute();

// const competitionId = route.params.id;

const goToAccepted = () => {
  router.push({
    name: 'AcceptedReport',
  });
};

const goToUnderReview = () => {
  router.push({
    name: 'UnderReviewReport',
  });
};

const goToHanged = () => {
  router.push({
    name: 'HangedReport',
  });
};

const goToRejected = () => {
  router.push({
    name: 'RejectedReport',
  });
};

const goToBaned = () => {
  router.push({
    name: 'BanedReport',
  });
};

// const goToAttendance = () => {
//   router.push({
//     name: 'AttendanceReport',
//   });
// };

// const goToGrades = () => {
//   router.push({
//     name: 'GradesReport',
//   });
// };
</script>

<style scoped>
.reports-container {
  padding: 20px;
}
</style>
