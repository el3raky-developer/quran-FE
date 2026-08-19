<template>
  <div class="participants-container">
    <div class="header">
      <h1>كشف المقبولين</h1>
      <div v-if="showBothCategoryToggle" class="category-toggle mb-4">
        <v-radio-group v-model="selectedCompetitionType" row dir="rtl">
          <v-radio label="قرآن" value="quran" />
          <v-radio label="قراءات" value="qraat" />
        </v-radio-group>
      </div>
      <div class="controls">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ابحث عن مشارك..."
          class="search-input"
        />

        <!-- Sheikh Filter Dropdown -->
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

        <select
          v-if="showQuranLevelSelect"
          v-model="selectedLevel"
          class="level-filter"
        >
          <option class="text-black" value="">جميع المستويات</option>
          <option
            class="text-black"
            v-for="level in 12"
            :key="level"
            :value="level"
          >
            المستوى {{ level }}
          </option>
        </select>
        <select
          v-else-if="showQraatLevelSelect"
          v-model="selectedLevel"
          class="level-filter"
        >
          <option class="text-black" value="">جميع القراءات</option>
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
          إجمالي المشاركين: {{ filteredParticipants?.length }}
        </p>
        <v-btn color="primary" @click="handlePrint" prepend-icon="mdi-printer">
          طباعة
        </v-btn>
      </div>
      <div id="accepted-report">
        <v-data-table
          :headers="headers"
          :items="filteredParticipants"
          :items-per-page="10"
          class="elevation-1"
          :items-per-page-text="'العناصر في الصفحة:'"
          :page-text="'{0}-{1} من {2}'"
          :first-icon="'mdi-chevron-right'"
          :prev-icon="'mdi-chevron-right'"
          :next-icon="'mdi-chevron-left'"
          :last-icon="'mdi-chevron-left'"
        >
          <!-- Table rows -->
          <template #item="{ item, index }">
            <tr>
              <td class="text-black">{{ index + 1 }}</td>
              <td class="student-name">{{ item.student.name }}</td>
              <template v-if="showQraatLevelSelect">
                <td class="level-number">
                  <span class="level-badge">{{
                    getParticipantQraatTitle(item)
                  }}</span>
                </td>
              </template>
              <template v-else>
                <td class="level-number">
                  <span class="level-badge">{{ item.levelNumber }}</span>
                </td>
                <td class="level-number">
                  <span class="level-badge">{{ item.levelValue }}</span>
                </td>
              </template>
            </tr>
          </template>

          <!-- Empty state -->
          <template #no-data>
            <div class="text-center py-4">لا توجد بيانات</div>
          </template>
        </v-data-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { printData } from "../utils/printById";
import { computed, ref, onMounted, watch } from "vue";
import { Participant } from "../shared/@types";
import {
  getStudentsByStatus,
  fetchSheikhs,
  fetchCompetitionById,
  type Sheikh,
  type CompetitionData,
} from "../lib/api";
import { useRoute } from "vue-router";
import { isQraat } from "../utils/reportHelpers";

const route = useRoute();

const competitionId = computed(() => route.params.id as string); // Default ID, can be passed as prop
const searchQuery = ref("");
const selectedSheikhFilter = ref(""); // New: Sheikh filter
const selectedLevel = ref("");
const participants = ref<Participant[]>([]);
const loading = ref(false);
const error = ref("");
const sheikhs = ref<Sheikh[]>([]);
const competition = ref<CompetitionData | null>(null);
const selectedCompetitionType = ref<"quran" | "qraat">("quran");
const competitionCategory = computed(
  () => competition.value?.category?.toString().toLowerCase() ?? ""
);
const effectiveCompetitionCategory = computed(() =>
  competitionCategory.value === "both"
    ? selectedCompetitionType.value
    : competitionCategory.value
);
const showBothCategoryToggle = computed(
  () => competitionCategory.value === "both"
);
const showQuranLevelSelect = computed(
  () => effectiveCompetitionCategory.value !== "qraat"
);
const showQraatLevelSelect = computed(
  () => effectiveCompetitionCategory.value === "qraat"
);

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
const quranParticipants = computed(() =>
  participants.value.filter((p) => !isQraat(p))
);
const displayedBase = computed(() =>
  effectiveCompetitionCategory.value === "qraat"
    ? qraatParticipants.value
    : quranParticipants.value
);

watch(effectiveCompetitionCategory, () => {
  selectedLevel.value = "";
});

const headers = computed(() => {
  if (effectiveCompetitionCategory.value === "qraat") {
    return [
      { title: "#", key: "index", sortable: false },
      { title: "اسم الطالب", key: "student.name", sortable: true },
      { title: "القراءة", key: "qraatTitle", sortable: true },
    ];
  }

  // quran or default
  return [
    { title: "#", key: "index", sortable: false },
    { title: "اسم الطالب", key: "student.name", sortable: true },
    { title: "المستوى", key: "levelNumber", sortable: true },
    { title: "عدد الأجزاء", key: "levelValue", sortable: true },
  ];
});

function normalizeArabic(text: string) {
  return text
    .replace(/[\u064B-\u065F]/g, "") // remove diacritics
    .replace(/[أإآ]/g, "ا") // unify hamza
    .replace(/ى/g, "ي") // replace final alef maqsura
    .replace(/ة/g, "ه") // optional: taa marbuta → ha
    .trim();
}

// Filter participants based on all criteria
const filteredParticipants = computed(() => {
  let filtered = displayedBase.value;

  // Apply sheikh filter
  if (selectedSheikhFilter.value) {
    filtered = filtered.filter(
      (participant) => participant.sheikh?._id === selectedSheikhFilter.value
    );
  }

  // Apply level filter
  if (selectedLevel.value) {
    if (effectiveCompetitionCategory.value === "qraat") {
      filtered = filtered.filter((participant) => {
        const p: any = participant;
        const id = p.qraatLevel?._id ?? p.qraat_level ?? p.qraatLevel ?? null;
        return id == selectedLevel.value;
      });
    } else {
      filtered = filtered.filter(
        (participant) => participant.levelNumber == Number(selectedLevel.value)
      );
    }
  }

  // Apply search query filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((participant) => {
      const studentName = participant.student?.name?.toLowerCase() || "";
      const nationalId = participant.student?.national_ID?.toLowerCase() || "";
      const phone = participant.student?.whatsapp_phone?.toLowerCase() || "";
      const sheikhName = participant.sheikh?.name?.toLowerCase() || "";
      return (
        normalizeArabic(studentName).includes(normalizeArabic(query)) ||
        nationalId.includes(query) ||
        phone.includes(query) ||
        sheikhName.includes(query)
      );
    });
  }

  return filtered;
});

const uniqueSheikhs = computed(() => {
  const sheikhsMap = new Map();
  participants.value.forEach((participant) => {
    const sheikh = participant.sheikh;
    if (sheikh && !sheikhsMap.has(sheikh._id)) {
      sheikhsMap.set(sheikh._id, sheikh);
    }
  });
  return Array.from(sheikhsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "ar")
  );
});

function getParticipantQraatTitle(p: any) {
  if (!p) return "-";
  if (p.qraatLevel && typeof p.qraatLevel === "object" && p.qraatLevel.title)
    return p.qraatLevel.title;
  const raw =
    (competition.value as any)?.qraat_levels ??
    (competition.value as any)?.qraatLevels ??
    [];
  const id = p.qraatLevel?._id ?? p.qraat_level ?? p.qraatLevel ?? null;
  if (!id) return "-";
  if (Array.isArray(raw) && raw.length) {
    const found = (raw as any[]).find((r) =>
      typeof r === "object" ? r._id === id : r === id
    );
    if (found)
      return typeof found === "object"
        ? found.title ?? String(found)
        : String(found);
  }
  return String(id);
}

const loadParticipants = async () => {
  loading.value = true;
  error.value = "";
  try {
    // Load competition
    competition.value = await fetchCompetitionById(competitionId.value);

    // Load sheikhs
    sheikhs.value = await fetchSheikhs();

    // Load participants
    const response = await getStudentsByStatus("accepted", competitionId.value);
    console.log("Full API Response:", response);

    participants.value = response?.data?.sort(
      (a: Participant, b: Participant) => a.levelNumber - b.levelNumber
    );
    console.log("Extracted participants array:", participants.value);
  } catch (err: any) {
    console.error("Error loading participants:", err);
    error.value = err.message || "فشل تحميل البيانات";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadParticipants();
});

function handlePrint() {
  const isQraatReport = effectiveCompetitionCategory.value === "qraat";
  const printColumns = isQraatReport
    ? [
        { title: "#", key: "index" },
        { title: "اسم الطالب", key: "studentName" },
        { title: "القراءة", key: "qraatTitle" },
        { title: "الشيخ", key: "sheikhName" },
      ]
    : [
        { title: "#", key: "index" },
        { title: "اسم الطالب", key: "studentName" },
        { title: "المستوى", key: "levelNumber" },
        { title: "عدد الأجزاء", key: "levelValue" },
        { title: "الشيخ", key: "sheikhName" },
      ];

  const printRows = filteredParticipants.value.map((p, index) => ({
    index: index + 1,
    studentName: p.student.name,
    nationalId: p.student.national_ID,
    qraatTitle: isQraatReport ? getParticipantQraatTitle(p) : undefined,
    levelNumber: p.levelNumber,
    levelValue: p.levelValue,
    sheikhName: p.sheikh?.name || "-",
  }));

  const printOptions = {
    title: "كشف المقبولين",
    headerData: {
      "إجمالي المشاركين": filteredParticipants.value.length.toString(),
      "تاريخ التقرير": new Date().toLocaleDateString("ar-EG"),
    },
    styles: `
      th { background-color: #f3f3f3 !important; font-weight: bold; }
      td, th { border: 1px solid #ccc; padding: 8px; text-align: right; }
      td:first-child { width: 50px; text-align: center; } /* Index column */
    `,
  };

  printData({ columns: printColumns, rows: printRows }, printOptions);
}
</script>

<style scoped>
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
  font-size: 14px;
  min-width: 200px;
}

.search-input:focus,
.level-filter:focus,
.sheikh-filter:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.participants-container {
  padding: 20px;
  direction: rtl;
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 20px;
  color: #333;
}

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input,
.level-filter {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.whatsapp-link {
  color: black;
  text-decoration: none;
  font-weight: 500;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.search-input:focus,
.level-filter:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

.loading,
.error {
  text-align: center;
  padding: 20px;
  font-size: 16px;
}

.error {
  color: #d32f2f;
  background-color: #ffebee;
  border-radius: 4px;
}

.loading {
  color: #4caf50;
}

.count {
  font-weight: bold;
  color: #555;
}

.table-wrapper {
  overflow-x: auto;
}

.participants-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.participants-table thead {
  background-color: #4caf50;
  color: white;
}

.participants-table th {
  padding: 15px;
  text-align: right;
  font-weight: 600;
}

.participants-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  color: #111;
  font-weight: bold;
}

.participants-table tbody tr:hover {
  background-color: #f5f5f5;
}

.participants-table tbody tr:last-child td {
  border-bottom: none;
}

.student-name {
  font-weight: 600;
  color: #111;
}

.national-id {
  font-family: monospace;
  color: #111;
  font-weight: bold;
}

.phone {
  font-family: monospace;
  font-size: 13px;
  color: #111;
  font-weight: bold;
}

.sheikh-name {
  color: #111;
  font-weight: bold;
}
.image img {
  width: 50px !important;
}

.sheikh-phone {
  font-family: monospace;
  font-size: 13px;
  color: #111;
  font-weight: bold;
}

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
  font-size: 14px;
  min-width: 200px;
}

.search-input:focus,
.level-filter:focus,
.sheikh-filter:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.participants-container {
  padding: 20px;
  direction: rtl;
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 20px;
  color: #333;
}

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input,
.level-filter {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.whatsapp-link {
  color: black;
  text-decoration: none;
  font-weight: 500;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.search-input:focus,
.level-filter:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

.loading,
.error {
  text-align: center;
  padding: 20px;
  font-size: 16px;
}

.error {
  color: #d32f2f;
  background-color: #ffebee;
  border-radius: 4px;
}

.loading {
  color: #4caf50;
}

.count {
  font-weight: bold;
  color: #555;
}

.table-wrapper {
  overflow-x: auto;
}

.participants-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.participants-table thead {
  background-color: #4caf50;
  color: white;
}

.participants-table th {
  padding: 15px;
  text-align: right;
  font-weight: 600;
}

.participants-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  color: #111;
  font-weight: bold;
}

.participants-table tbody tr:hover {
  background-color: #f5f5f5;
}

.participants-table tbody tr:last-child td {
  border-bottom: none;
}

.student-name {
  font-weight: 600;
  color: #111;
}

.national-id {
  font-family: monospace;
  color: #111;
  font-weight: bold;
}

.phone {
  font-family: monospace;
  font-size: 13px;
  color: #111;
  font-weight: bold;
}

.sheikh-name {
  color: #111;
  font-weight: bold;
}
.image img {
  width: 50px !important;
}

.sheikh-phone {
  font-family: monospace;
  font-size: 13px;
  color: #111;
  font-weight: bold;
}

:deep(.level-badge),
:deep(.accept-badge),
:deep(.reject-badge),
:deep(.review-badge),
:deep(.hang-badge) {
  display: inline-block;
  background-color: #2196f3;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

:deep(.accept-badge) {
  background-color: #068b25;
}
:deep(.reject-badge) {
  background-color: #c50d0a;
}
:deep(.review-badge) {
  background-color: #2196f3;
}
:deep(.hang-badge) {
  background-color: #968107;
}

.actions {
  text-align: center;
}

.edit-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

.edit-btn:hover {
  background-color: #45a049;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-card {
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  direction: rtl;
}

.clickable {
  cursor: pointer;
}

@media (max-width: 768px) {
  .participants-container {
    padding: 10px;
  }

  .header h1 {
    font-size: 20px;
  }

  .controls {
    flex-direction: column;
  }

  .search-input {
    min-width: 100%;
  }

  .participants-table {
    font-size: 12px;
  }

  .participants-table th,
  .participants-table td {
    padding: 8px;
  }
}
</style>
