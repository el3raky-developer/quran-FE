<template>
  <div v-if="visible" id="loading-screen">
    <div class="mosque-bg"></div>

    <div class="loader-content">
      <!-- SVG Circular Progress -->
      <div class="svg-progress-container">
        <svg class="progress-ring" viewBox="0 0 520 520" xmlns="http://www.w3.org/2000/svg">
          <!-- Background circle -->
          <circle
            class="progress-ring__bg"
            stroke="rgba(255, 215, 0, 0.2)"
            stroke-width="6"
            fill="transparent"
            r="235"
            cx="260"
            cy="260"
          />
          <!-- Progress circle -->
          <circle
            class="progress-ring__progress"
            stroke="gold"
            stroke-width="8"
            fill="transparent"
            r="235"
            cx="260"
            cy="260"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            stroke-linecap="round"
          />
        </svg>
        <img src="/images/loading.png" class="quran-img" />
      </div>

      <h2 class="title">مسابقة القرآن الكريم</h2>

      <div class="subtitle fw-bold text-white">
        جاري التحميل
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";

const visible = ref(true);
const router = useRouter();
const progress = ref(0);

// SVG uses viewBox so radius stays at 235 regardless of rendered size
const radius = 235;
const circumference = 2 * Math.PI * radius;

const dashOffset = computed(() => {
  return circumference - (progress.value / 100) * circumference;
});

onMounted(() => {
  const interval = setInterval(() => {
    progress.value = (progress.value + 1) % 101;
  }, 50);

  window.addEventListener("load", () => {
    clearInterval(interval);
    fadeOut();
  });

  router.beforeEach((to, from, next) => {
    if (!visible.value) {
      visible.value = true;
      const el = document.getElementById("loading-screen");
      if (el) el.style.opacity = "1";
    }
    next();
  });

  router.afterEach(() => {
    fadeOut();
  });
});

function fadeOut() {
  const loader = document.getElementById("loading-screen");
  if (!loader) return;
  loader.style.opacity = "0";
  
}

onBeforeUnmount(() => {
  window.removeEventListener("load", fadeOut);
});
</script>

<style scoped>
#loading-screen {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, #1a1208, #000);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  z-index: 9999;
  transition: opacity 0.6s;
}

/* floating particles */
#loading-screen::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  background: url("https://www.transparenttextures.com/patterns/stardust.png");
  opacity: 0.25;
  animation: starsMove 40s linear infinite;
}

@keyframes starsMove {
  from { transform: translateY(0); }
  to   { transform: translateY(-1000px); }
}

/* center content */
.loader-content {
  text-align: center;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

/* ── Responsive container using min() so it never overflows ── */
.svg-progress-container {
  position: relative;
  /* Takes up 80vw on mobile, capped at 520px on desktop */
  width: min(80vw, 80vh, 520px);
  height: min(80vw, 80vh, 520px);
  margin: 0 auto 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* SVG fills its container; viewBox handles internal scaling */
.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring__bg {
  stroke: rgba(255, 215, 0, 0.2);
}

.progress-ring__progress {
  stroke: gold;
  filter: drop-shadow(0 0 15px gold);
  transition: stroke-dashoffset 0.1s ease;
}

/* Image fills ~69% of the container (360/520 ≈ 69%) */
.quran-img {
  width: 69%;
  height: 69%;
  filter: drop-shadow(0 0 40px gold) drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
  animation: float 3s ease-in-out infinite;
  z-index: 2;
  border-radius: 50%;
  object-fit: inherit;
  position: relative;
}

@keyframes float {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(-15px); }
  100% { transform: translateY(0); }
}

/* Glow pulse behind the ring */
.svg-progress-container::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at center,
    rgba(255, 215, 0, 0.15) 0%,
    transparent 70%);
  z-index: -1;
  animation: containerPulse 3s infinite alternate;
}

@keyframes containerPulse {
  from { opacity: 0.5; transform: scale(0.98); }
  to   { opacity: 1;   transform: scale(1.02); }
}

/* Title */
.title {
  color: #f5d78e;
  font-size: clamp(20px, 5vw, 32px);
  margin: 16px 0 0;
  font-family: "Amiri", serif;
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}

.subtitle {
  color: white;
  font-weight: bold;
  font-size: clamp(18px, 4.5vw, 2.2rem);
  margin-top: 12px;
  font-family: "Amiri", serif;
}
</style>