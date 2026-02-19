<template>
  <div class="participants-container">
    <div class="header">
      <h1>كشف الموقوفين</h1>
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

        <select v-model="selectedLevel" class="level-filter">
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
      </div>
    </div>
    <div v-if="loading" class="loading">جاري التحميل...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="table-wrapper">
      <p class="count">إجمالي المشاركين: {{ filteredParticipants?.length }}</p>
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
            <td class="level-number">
              <span class="level-badge">{{ item.levelNumber }}</span>
            </td>
            <td class="level-number">
              <span class="level-badge">{{ item.levelValue }}</span>
            </td>
          </tr>
        </template>

        <!-- Empty state -->
        <template #no-data>
          <div class="text-center py-4">لا توجد بيانات</div>
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { Participant } from '../shared/@types';
import {
  getCompetitionParticipants,
  getStudentsByStatus,
  fetchCompetitionById,
  fetchSheikhs,
  fetchCities,
  editStudent,
  type CompetitionLevel,
  type Sheikh,
  type City,
  type CompetitionData,
  uploadBirthCertificate,
  handleStudentStatus,
} from '../lib/api';
import { useRoute } from 'vue-router';

const searchQuery = ref('');
const selectedSheikhFilter = ref(''); // New: Sheikh filter
const selectedLevel = ref('');
const participants = ref<Participant[]>([]);
const loading = ref(false);
const error = ref('');
const competition = ref<CompetitionData | null>(null);
const levels = ref<CompetitionLevel[]>([]);
const sheikhs = ref<Sheikh[]>([]);

const headers = computed(() => {
  return [
    {
      title: '#',
      key: 'index',
      sortable: false,
    },
    {
      title: 'اسم الطالب',
      key: 'student.name',
      sortable: true,
    },
    {
      title: 'المستوى',
      key: 'levelNumber',
      sortable: true,
    },
    {
      title: 'عدد الأجزاء',
      key: 'levelValue',
      sortable: true,
    },
  ];
});

// Filter participants based on all criteria
const filteredParticipants = computed(() => {
  let filtered = participants.value;

  // Apply sheikh filter
  if (selectedSheikhFilter.value) {
    filtered = filtered.filter(
      (participant) => participant.sheikh?._id === selectedSheikhFilter.value,
    );
  }

  // Apply level filter
  if (selectedLevel.value) {
    filtered = filtered.filter(
      (participant) => participant.levelNumber == Number(selectedLevel.value),
    );
  }

  // Apply search query filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((participant) => {
      const studentName = participant.student?.name?.toLowerCase() || '';
      const nationalId = participant.student?.national_ID?.toLowerCase() || '';
      const phone = participant.student?.whatsapp_phone?.toLowerCase() || '';
      const sheikhName = participant.sheikh?.name?.toLowerCase() || '';
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
    a.name.localeCompare(b.name, 'ar'),
  );
});

const loadParticipants = async () => {
  loading.value = true;
  error.value = '';
  try {
    // Load sheikhs and cities
    sheikhs.value = await fetchSheikhs();

    // Load participants
    const response = await getStudentsByStatus("hanged");
    console.log('Full API Response:', response);

    participants.value = response?.data;
    console.log('Extracted participants array:', participants.value);
  } catch (err: any) {
    console.error('Error loading participants:', err);
    error.value = err.message || 'فشل تحميل البيانات';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadParticipants();
});
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
  margin-bottom: 15px;
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
  margin-bottom: 15px;
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
