<template>
  <div class="reports-container">
    <v-row justify="center" class="mt-6" dir="rtl">
      <v-col cols="12" md="3">
        <v-btn block size="large" color="success" @click="goToAccepted">
          كشف المقبولين
        </v-btn>
      </v-col>

      <v-col cols="12" md="3">
        <v-btn block size="large" color="success" @click="goToHanged">
          كشف الموقوفين
        </v-btn>
      </v-col>

      <v-col cols="12" md="3">
        <v-btn block size="large" color="primary" @click="goToAttendance">
          كشف الحضور
        </v-btn>
      </v-col>

      <v-col cols="12" md="3">
        <v-btn block size="large" color="secondary" @click="goToGrades">
          كشف الدرجات
        </v-btn>
      </v-col>
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

const goToHanged = () => {
  router.push({
    name: 'HangedReport',
  });
};

const goToAttendance = () => {
  router.push({
    name: 'AttendanceReport',
  });
};

const goToGrades = () => {
  router.push({
    name: 'GradesReport',
  });
};
</script>

<style scoped>
.reports-container {
  padding: 20px;
}
</style>
