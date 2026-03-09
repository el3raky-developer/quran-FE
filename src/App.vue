<script setup lang="ts">
import { RouterView } from "vue-router";
import LoadingScreen from "./components/LoadingScreen.vue";
</script>

<template>
  <!-- global loading overlay shown while app is initializing or during route changes -->
  <LoadingScreen />

  <RouterView />
  <div id="print-root" style="display: none"></div>
</template>
