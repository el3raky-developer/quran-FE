<template>
  <div class="participants-container">
    <div class="header">
      <h1>المشاركون (القراءات)</h1>
      <div class="controls">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ابحث عن مشارك..."
          class="search-input"
        />
        <select v-model="selectedSheikhFilter" class="sheikh-filter">
          <option class="text-black" value="">جميع المشايخ</option>
          <option
            class="text-black"
            v-for="sheikh in uniqueSheikhs"
            :key="sheikh._id"
            :value="sheikh._id"
          >
            {{ sheikh.name }}
          </option>
        </select>

        <select v-model="selectedLevel" class="level-filter">
          <option class="text-black" value="">جميع المستويات</option>
          <option
            class="text-black"
            v-for="level in qraatLevelItems"
            :key="level.value"
            :value="level.value"
          >
            {{ level.title }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">جاري التحميل...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="table-wrapper">
      <div class="d-flex justify-space-between align-center mb-3">
        <p class="count">
          إجمالي المشاركين (القراءات): {{ filteredParticipants?.length }}
        </p>
      </div>

      <v-data-table
        :headers="headers"
        :items="filteredParticipants"
        :items-per-page="10"
        class="elevation-1"
      >
        <template #item="{ item, index }">
          <tr>
            <td>{{ index + 1 }}</td>
            <td class="student-name">{{ item.student.name }}</td>
            <td class="national-id">{{ item.student.national_ID }}</td>
            <td class="phone">
              <a
                :href="getWhatsAppLink(item.student.whatsapp_phone)"
                target="_blank"
                class="whatsapp-link"
              >
                {{ item.student.whatsapp_phone }}
              </a>
            </td>
            <td class="phone">{{ item.student.cityId?.name }}</td>
            <td class="image text-center">
              <template v-if="item.student?.birth_certificate_img_github">
                <v-btn
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-image"
                  @click="openImage(item.student.birth_certificate_img_github)"
                >
                  عرض
                </v-btn>
              </template>
              <template v-else>
                <span class="text-grey">لا يوجد صورة</span>
              </template>
            </td>
            <td class="sheikh-name">{{ item.sheikh.name }}</td>
            <td class="sheikh-phone">
              {{ formatPhone(item.sheikh.whatsapp_phone ?? "") }}
            </td>
            <td class="level-number">
              <!-- <span class="level-badge">{{
                getQraatTitleForParticipant(item)
              }}</span> -->
              <span class="level-badge">{{ item.qraatLevel.title }}</span>
            </td>
          </tr>
        </template>

        <template #no-data>
          <div class="text-center py-4">لا توجد بيانات</div>
        </template>
      </v-data-table>

      <v-dialog v-model="imageDialog" max-width="600">
        <v-card>
          <img :src="selectedImage" alt="لا يوجد صورة" />
          <v-card-actions>
            <v-spacer />
            <v-btn text color="primary" @click="imageDialog = false"
              >إغلاق</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  getCompetitionParticipants,
  fetchCompetitionById,
  fetchSheikhs,
  fetchCities,
} from "../lib/api";
import type {
  CompetitionLevel,
  Sheikh,
  City,
  CompetitionData,
} from "../lib/api";

const route = useRoute();
const competitionId = computed(() => route.params.id as string);
const participants = ref<any[]>([]);
const loading = ref(false);
const error = ref("");
const searchQuery = ref("");
const selectedLevel = ref("");
const selectedSheikhFilter = ref("");
const sheikhs = ref<Sheikh[]>([]);
const cities = ref<City[]>([]);
const competition = ref<CompetitionData | null>(null);
const imageDialog = ref(false);
const selectedImage = ref("");

const headers = computed(() => [
  {
    title: "#",
    key: "index",
    sortable: false,
    width: "3%",
    align: "center" as const,
  },
  {
    title: "اسم الطالب",
    key: "student.name",
    sortable: true,
    width: "15%",
    align: "center" as const,
  },
  {
    title: "الرقم القومي",
    key: "student.national_ID",
    sortable: true,
    width: "10%",
    align: "center" as const,
  },
  {
    title: "رقم الهاتف",
    key: "student.whatsapp_phone",
    sortable: true,
    width: "8%",
    align: "center" as const,
  },
  {
    title: "البلد",
    key: "student.cityId.name",
    sortable: true,
    width: "4%",
    align: "center" as const,
  },
  {
    title: "شهادة الميلاد",
    key: "student.birth_certificate_img_github",
    sortable: false,
    width: "8%",
    align: "center" as const,
  },
  {
    title: "الشيخ/الشيخة",
    key: "sheikh.name",
    sortable: true,
    width: "10%",
    align: "center" as const,
  },
  {
    title: "رقم الشيخ",
    key: "sheikh.whatsapp_phone",
    sortable: true,
    width: "8%",
    align: "center" as const,
  },
  {
    title: "مستوى القراءة",
    key: "qraatLevelTitle",
    sortable: true,
    width: "6%",
    align: "center" as const,
  },
]);

function isQraat(p: any) {
  return p?.qraatLevel != null
}

const uniqueSheikhs = computed(() => {
  const map = new Map();
  participants.value.forEach((p) => {
    const s = p.sheikh;
    if (s && !map.has(s._id)) map.set(s._id, s);
  });
  return Array.from(map.values()).sort((a: any, b: any) =>
    a.name.localeCompare(b.name, "ar")
  );
});

const qraatLevelItems = computed(() => {
  const raw =
    (competition.value as any)?.qraat_levels ??
    (competition.value as any)?.qraatLevels ??
    [];

  if (!raw || !raw.length) return [];

  if (typeof raw[0] === "object" && raw[0] !== null && "title" in raw[0]) {
    return (raw as any[]).map((level) => ({
      title: level.title,
      value: level._id,
    }));
  }

  return (raw as string[]).map((id) => ({ title: id, value: id }));
});

const qraatParticipants = computed(() => participants.value.filter(isQraat));

function getParticipantQraatLevelId(p: any) {
  if (!p) return null;
  // If qraatLevel is an object return its id
  if (p.qraatLevel && typeof p.qraatLevel === "object")
    return p.qraatLevel._id ?? null;
  if (p.qraat_level && typeof p.qraat_level === "string") return p.qraat_level;
  if (p.qraatLevel && typeof p.qraatLevel === "string") return p.qraatLevel;
  if (p.level && typeof p.level === "string") return p.level;
  if (p.levelNumber != null) {
    const raw =
      (competition.value as any)?.qraat_levels ??
      (competition.value as any)?.qraatLevels ??
      [];
    if (Array.isArray(raw) && raw.length >= p.levelNumber) {
      const item = raw[p.levelNumber - 1];
      return typeof item === "object" ? item._id : item;
    }
    return String(p.levelNumber);
  }
  return null;
}

function getQraatTitleForParticipant(p: any) {
  if (!p) return "-";
  // If participant already carries the qraatLevel object with title
  if (p.qraatLevel && typeof p.qraatLevel === "object" && p.qraatLevel.title)
    return p.qraatLevel.title;

  const id = getParticipantQraatLevelId(p);
  if (!id) return "-";
  const raw =
    (competition.value as any)?.qraat_levels ??
    (competition.value as any)?.qraatLevels ??
    [];
  if (Array.isArray(raw) && raw.length) {
    const found = (raw as any[]).find((r) =>
      typeof r === "object" ? r._id === id : r === id
    );
    if (found)
      return typeof found === "object"
        ? found.title ?? String(found)
        : String(found);
  }
  const num = Number(id);
  if (!isNaN(num) && Array.isArray(raw) && raw[num - 1]) {
    const item = raw[num - 1];
    return typeof item === "object" ? item.title ?? String(item) : String(item);
  }
  return String(id);
}

const filteredParticipants = computed(() => {
  let filtered = qraatParticipants.value;

  if (selectedSheikhFilter.value) {
    filtered = filtered.filter(
      (p) => p.sheikh?._id === selectedSheikhFilter.value
    );
  }

  if (selectedLevel.value) {
    filtered = filtered.filter((p) => {
      const id = getParticipantQraatLevelId(p) ?? "";
      return id == selectedLevel.value;
    });
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter((p) => {
      const name = p.student?.name?.toLowerCase() || "";
      const nid = p.student?.national_ID || "";
      const phone = p.student?.whatsapp_phone || "";
      const sheikhName = p.sheikh?.name?.toLowerCase() || "";
      return (
        name.includes(q) ||
        nid.includes(q) ||
        phone.includes(q) ||
        sheikhName.includes(q)
      );
    });
  }

  return filtered;
});

const getWhatsAppLink = (phone?: string) => {
  if (!phone) return "#";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("01")) cleaned = "20" + cleaned.substring(1);
  return `https://wa.me/${cleaned}`;
};

const formatPhone = (phone: string) => phone || "-";

function openImage(src: any) {
  selectedImage.value = src;
  imageDialog.value = true;
}

const loadParticipants = async () => {
  loading.value = true;
  try {
    competition.value = await fetchCompetitionById(competitionId.value);
    sheikhs.value = await fetchSheikhs();
    cities.value = await fetchCities();

    const response = await getCompetitionParticipants(competitionId.value);
    participants.value = response?.data?.studentsData ?? [];
  } catch (err: any) {
    console.error(err);
    error.value = err?.message || "فشل تحميل البيانات";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadParticipants();
});
</script>

<style scoped>
/* reuse styles from Participants.vue (kept minimal) */
.controls {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}
.search-input,
.level-filter,
.sheikh-filter {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  min-width: 200px;
}
.participants-container {
  padding: 20px;
  direction: rtl;
}
.count {
  font-weight: bold;
}
</style>
