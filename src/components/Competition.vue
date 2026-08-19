<template>
  <loading-screen v-if="loading" />

  <template v-else>
    <div class="competition-container no-print d-flex ga-4">
      <v-btn color="info" @click="goToRegistrationForm"> رابط التسجيل </v-btn>
      <v-btn color="primary" @click="goToParticipants"> عرض المتسابقون </v-btn>
      <v-btn
        v-if="showQraatButton"
        color="primary"
        @click="goToQraatParticipants"
      >
        عرض متسابقيين القراءات
      </v-btn>

      <v-btn color="success" @click="goToSheikhs"> عرض الشيوخ </v-btn>

      <v-btn color="secondary" @click="goToReports"> طباعة التقارير </v-btn>

      <v-btn color="secondary" @click="goToStudentsAllocation">
        توزيع المتسابقين
      </v-btn>

      <v-btn color="secondary" @click="goToGrades">
        رصد الدرجات و الجوائز
      </v-btn>
    </div>

    <router-view />
  </template>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  CompetitionData,
  fetchCompetitionById,
  getCompetitionParticipants,
} from "../lib/api";

import { useRoute, useRouter } from "vue-router";
import { Participant } from "../shared/@types";
import LoadingScreen from "./LoadingScreen.vue";

const router = useRouter();
const route = useRoute();

const competitionId = computed(() => route.params.id as string);
const loading = ref(false);
const competition = ref<CompetitionData | null>(null);
const participants = ref<Participant[]>([]);

const goToParticipants = () => {
  router.push({
    name: "CompetitionParticipants",
  });
};

const goToQraatParticipants = () => {
  router.push({ name: "QraatParticipants" });
};

const goToSheikhs = () => {
  router.push({
    name: "SheikhsComponents",
  });
};

const goToReports = () => {
  router.push({
    name: "CompetitionReports",
  });
};

const goToRegistrationForm = () => {
  router.push({
    name: "RegistrationForm",
    query: { competition_id: competitionId.value },
  });
};

const goToStudentsAllocation = () => {
  router.push({
    name: "studentsAllocationComponent",
  });
};

const goToGrades = () => {
  router.push({
    name: "CompetitionGrades",
  });
};

const loadData = async () => {
  loading.value = true;
  try {
    competition.value = await fetchCompetitionById(competitionId.value);

    const response = await getCompetitionParticipants(competitionId.value);
    participants.value = response?.data?.studentsData ?? [];
  } catch (err: any) {
    console.log("error", err);
  } finally {
    loading.value = false;
  }
};

const showQraatButton = computed(() => {
  const cat = competition.value?.category?.toString?.().toLowerCase();
  return cat === "qraat" || cat === "both";
});

onMounted(async () => {
  await loadData();
});
</script>

<style scoped>
.competition-container {
  padding: 20px;
  justify-content: center;
}
</style>
