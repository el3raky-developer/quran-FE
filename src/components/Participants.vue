<template>
  <div class="participants-container">
    <div class="header">
      <h1>المشاركون</h1>
      <div class="controls">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ابحث عن مشارك..."
          class="search-input"
        />
        <select v-model="selectedLevel" class="level-filter">
          <option value="">جميع المستويات</option>
          <option v-for="level in 7" :key="level" :value="level">
            المستوى {{ level }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">جاري التحميل...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="table-wrapper">
      <p class="count">إجمالي المشاركين: {{ participants?.length }}</p>
      <table class="participants-table">
        <thead>
          <tr>
            <th>#</th>
            <th>اسم الطالب</th>
            <th>الرقم القومي</th>
            <th>رقم الهاتف</th>
            <th>البلد</th>
            <!-- <th>شهادة الميلاد</th> -->
            <th>الشيخ/الشيخة</th>
            <th>رقم الشيخ</th>
            <th>المستوى</th>
            <th>عدد الاجزاء</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(participant, index) in filteredParticipants"
            :key="participant.student._id"
          >
            <td>{{ index + 1 }}</td>
            <td class="student-name">{{ participant.student.name }}</td>
            <td class="national-id">{{ participant.student.national_ID }}</td>
            <td class="phone">{{ participant.student.whatsapp_phone }}</td>
            <td class="phone">{{ participant.student.cityId?.name }}</td>
            <!-- <td class="image">
              <img
                :src="`https://quran-be-production.up.railway.app/birth_certificates/${participant.student.birth_certificate_img}`"
                alt="لا يوجد"
              />
            </td> -->
            <td class="sheikh-name">{{ participant.sheikh.name }}</td>
            <td class="sheikh-phone">
              {{ formatPhone(participant.sheikh.whatsapp_phone ?? "") }}
            </td>
            <td class="level-number">
              <span class="level-badge">{{ participant.levelNumber }}</span>
            </td>
            <td class="level-number">
              <span class="level-badge">{{ participant.levelValue }}</span>
            </td>
            <td class="actions">
              <button class="edit-btn" @click="openEditModal(participant)">
                تعديل
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="showEditModal"
      class="modal-overlay"
      @click.self="closeEditModal"
    >
      <v-card class="modal-card">
        <v-card-title class="bg-green text-white pa-6">
          <div class="d-flex justify-space-between align-center">
            <span>تعديل بيانات المشارك</span>
            <v-btn
              icon
              variant="text"
              @click="closeEditModal"
              class="text-white"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>

        <v-card-text class="pa-6" v-if="editingParticipant">
          <v-form @submit.prevent="saveChanges">
            <v-text-field
              v-model="editingParticipant.student.name"
              label="اسم الطالب"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-account"
              dir="rtl"
              class="mb-4"
              required
            ></v-text-field>

            <v-text-field
              v-model="editingParticipant.student.national_ID"
              label="الرقم القومي"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-card-account-details"
              dir="rtl"
              class="mb-4"
              required
            ></v-text-field>

            <v-text-field
              v-model="editingParticipant.student.whatsapp_phone"
              label="رقم الهاتف (واتس)"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-whatsapp"
              dir="rtl"
              class="mb-4"
              required
            ></v-text-field>

            <v-select
              v-model="selectedCityId"
              :items="cities.map((c) => ({ title: c.name, value: c._id }))"
              item-title="title"
              item-value="value"
              label="اختر المدينة"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-map-marker"
              dir="rtl"
              class="mb-4"
              @update:model-value="handleCityChange"
            ></v-select>

            <v-select
              v-model="selectedSheikhId"
              :items="[
                ...sheikhs.map((s) => ({ title: s.name, value: s._id })),
              ]"
              item-title="title"
              item-value="value"
              label="اختر اسم الشيخ/الشيخة"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-account-tie"
              required
              dir="rtl"
              class="mb-4"
              @update:model-value="handleSheikhChange"
            ></v-select>

            <v-text-field
              v-model="editingParticipant.sheikh.whatsapp_phone"
              label="رقم الشيخ (واتس)"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-whatsapp"
              dir="rtl"
              class="mb-4"
            ></v-text-field>

            <v-select
              v-model.number="editingParticipant.levelNumber"
              :items="
                levels.map((l) => ({
                  title:
                    l.value === 31
                      ? 'المستوى 12 (  30 جزء مكرر  + التجويد)'
                      : `المستوى ${l.levelNumber} ( ${l.value} اجزاء )`,
                  value: l.levelNumber,
                }))
              "
              item-title="title"
              item-value="value"
              label="المستوى"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-medal"
              dir="rtl"
              class="mb-6"
              required
            ></v-select>

            <div class="d-flex gap-3 justify-end">
              <v-btn variant="outlined" color="red" @click="closeEditModal">
                إلغاء
              </v-btn>
              <v-btn type="submit" variant="flat" color="green">
                حفظ التغييرات
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  getCompetitionParticipants,
  fetchCompetitionById,
  fetchSheikhs,
  fetchCities,
  editStudent,
  type CompetitionLevel,
  type Sheikh,
  type City,
  type CompetitionData,
} from "../lib/api";

interface Student {
  _id: string;
  name: string;
  national_ID: string;
  whatsapp_phone: string;
  birth_certificate_img?: string;
  cityId: {
    _id: string;
    name: string;
  }
}

interface Participant {
  student: Student;
  sheikh: Sheikh;
  levelNumber: number;
  levelValue: number
}

const participants = ref<Participant[]>([]);
const loading = ref(false);
const error = ref("");
const searchQuery = ref("");
const selectedLevel = ref("");
const competitionId = ref("6977c02bf3a39b6f96016944"); // Default ID, can be passed as prop
const showEditModal = ref(false);
const editingParticipant = ref<Participant | null>(null);
const levels = ref<CompetitionLevel[]>([]);
const sheikhs = ref<Sheikh[]>([]);
const cities = ref<City[]>([]);
const competition = ref<CompetitionData | null>(null);
const selectedSheikhId = ref<string | null>(null);
const selectedCityId = ref<string | null>(null);

const filteredParticipants = computed(() => {
  if (!Array.isArray(participants.value)) {
    return [];
  }
  return participants.value.filter((participant) => {
    const matchesSearch =
      participant.student.name
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      participant.student.national_ID.includes(searchQuery.value) ||
      participant.sheikh.name
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase());

    const matchesLevel =
      selectedLevel.value === "" ||
      participant.levelNumber === parseInt(selectedLevel.value);

    return matchesSearch && matchesLevel;
  });
});

const formatPhone = (phone: string): string => {
  return phone || "-";
};

const openEditModal = (participant: Participant) => {
  // Create a deep copy to avoid modifying the original
  editingParticipant.value = JSON.parse(JSON.stringify(participant));

  // Set the selected sheikh based on the participant's sheikh
  const sheikhMatch = sheikhs.value.find(
    (s) => s._id === participant.sheikh._id
  );
  if (sheikhMatch) {
    selectedSheikhId.value = participant.sheikh._id;
  } else {
    // If sheikh not found in the list, treat as 'other'
    selectedSheikhId.value = "other";
  }

  selectedCityId.value = participant.student.cityId?._id ?? null;

  showEditModal.value = true;
};

const handleSheikhChange = (sheikhId: string | null) => {
  if (sheikhId === "other") {
    // For custom sheikh, fields are editable
    selectedSheikhId.value = "other";
  } else {
    // Find the selected sheikh and populate the fields
    const selectedSheikh = sheikhs.value.find((s) => s._id === sheikhId);
    if (selectedSheikh && editingParticipant.value) {
      editingParticipant.value.sheikh.name = selectedSheikh.name;
      editingParticipant.value.sheikh._id = selectedSheikh._id;
      editingParticipant.value.sheikh.whatsapp_phone = selectedSheikh.whatsapp_phone;
      selectedSheikhId.value = sheikhId;
    }
  }
};

const handleCityChange = (cityId: string | null) => {
  selectedCityId.value = cityId;
  if (editingParticipant.value && cityId) {
    const city = cities.value.find((c) => c._id === cityId);
    if (city) {
      editingParticipant.value.student.cityId = { _id: city._id, name: city.name };
    }
  }
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingParticipant.value = null;
};

const saveChanges = async () => {
  if (!editingParticipant.value) return;

  const p = editingParticipant.value;

  try {
    await editStudent({
      competition_id: competitionId.value,
      levelNumber: p.levelNumber,
      sheikh: {
        _id: p.sheikh._id,
        name: p.sheikh.name,
        whatsapp_phone: p.sheikh.whatsapp_phone || "",
      },
      student: {
        _id: p.student._id,
        name: p.student.name,
        national_ID: p.student.national_ID,
        whatsapp_phone: p.student.whatsapp_phone,
        birth_certificate_img: p.student.birth_certificate_img,
        city_id: p.student.cityId?._id ?? selectedCityId.value ?? undefined,
      },
    });

    closeEditModal();

    // Refetch all students/participants data from the API
    const response = await getCompetitionParticipants(competitionId.value);
    participants.value = response?.data?.studentsData ?? participants.value;
  } catch (err: any) {
    console.error("Error saving changes:", err);
    error.value = err.response?.data?.message || err.message || "فشل حفظ التغييرات";
  }
};

const loadParticipants = async () => {
  loading.value = true;
  error.value = "";
  try {
    // Load competition data
    competition.value = await fetchCompetitionById(competitionId.value);
    levels.value = competition.value.levels;

    // Load sheikhs and cities
    sheikhs.value = await fetchSheikhs();
    cities.value = await fetchCities();

    // Load participants
    const response = await getCompetitionParticipants(competitionId.value);
    console.log("Full API Response:", response);

    participants.value = response?.data?.studentsData;
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
</script>

<style scoped>
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

.sheikh-phone {
  font-family: monospace;
  font-size: 13px;
  color: #111;
  font-weight: bold;
}

.level-badge {
  display: inline-block;
  background-color: #2196f3;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
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
