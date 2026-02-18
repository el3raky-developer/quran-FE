<template>
    <div class="competition-container no-print d-flex ga-4">
    
        <v-btn color="primary" @click="goToParticipants">
        عرض المتسابقون
        </v-btn>

        <v-btn color="success" @click="goToSheikhs">
        عرض الشيوخ
        </v-btn>

        <v-btn color="secondary" @click="goToReports">
        طباعة التقارير
        </v-btn>

        <v-btn color="secondary" @click="goToStudentsAllocation">
          توزيع المتسابقين
        </v-btn>

    </div>

    <router-view />
</template>

<script setup lang="ts">

import { useRouter } from 'vue-router'

const router = useRouter()

const goToParticipants = () => {
  router.push({
    name: 'CompetitionParticipants'
  })
}

const goToSheikhs = () => {
  router.push({
    name: 'SheikhsComponents'
  })
}

const goToReports = () => {
  router.push({
    name: 'CompetitionReports'
  })
}

const goToStudentsAllocation = () => {
  router.push({
    name: 'studentsAllocationComponent'
  })
}
</script>

<style scoped>
.competition-container {
  padding: 20px;
  justify-content: center;
}
</style>
