<template>
  <div v-if="visible" id="loading-screen" class="loading-screen">
    <div class="loader-content">
      <div class="image-container">
        <img src="/images/loading.jfif" alt="مسابقة الفرقان للقرآن الكريم" class="loading-img" />
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
      </div>

      <div class="subtitle">جاري التحميل...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const visible = ref(true);
const progress = ref(0);

let rafId: number | null = null;
let isFilling = false;

function cancelRaf() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function startProgress() {
  cancelRaf();
  isFilling = false;
  progress.value = 0;

  const tick = () => {
    if (isFilling) return;
    if (progress.value < 90) {
      progress.value = Math.min(progress.value + 0.4, 90);
      rafId = requestAnimationFrame(tick);
    }
  };

  rafId = requestAnimationFrame(tick);
}

function finishAndFade() {
  cancelRaf();
  isFilling = true;

  const tick = () => {
    if (progress.value < 100) {
      progress.value = Math.min(progress.value + 0.6, 100);
      rafId = requestAnimationFrame(tick);
    } else {
      setTimeout(() => {
        const loader = document.getElementById("loading-screen");
        if (loader) {
          loader.style.opacity = "0";

          setTimeout(() => {
            visible.value = false;
            progress.value = 0;
            isFilling = false;
          }, 650);
        }
      }, 300);
    }
  };

  rafId = requestAnimationFrame(tick);
}

onMounted(() => {
  startProgress();
  window.addEventListener("load", finishAndFade);
});

onBeforeUnmount(() => {
  window.removeEventListener("load", finishAndFade);
  cancelRaf();
});
</script>

<style scoped>
.loading-screen {
  position: fixed;
  inset: 0;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  transition: opacity 0.6s;
}

.loader-content {
  width: 100%;
  max-width: 900px;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.image-container {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.loading-img {
  display: block;
  width: 100%;
  height: 100%;
  /* object-fit: cover; */
  /* aspect-ratio: 16 / 9; */
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1b5e20, #4caf50);
  transition: width 0.1s ease;
}

.subtitle {
  color: #f5d78e;
  font-weight: bold;
  font-size: clamp(16px, 4vw, 22px);
  font-family: "Amiri", serif;
}

@media (max-width: 600px) {
  .loader-content {
    padding: 12px;
  }
}
</style>
