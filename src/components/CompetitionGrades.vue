<template>
  <div class="grades-container">
    <h1 class="title">رصد الدرجات</h1>

    <div class="controls">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="ابحث باسم الطالب..."
      />

      <select v-model="selectedLevel" class="level-select">
        <option class="text-black" value="">اختر المستوى</option>
        <option
          v-for="level in levels"
          :key="level.levelNumber"
          class="text-black"
          :value="level.levelNumber"
        >
          المستوى {{ level.levelNumber }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="state-text">جاري تحميل البيانات...</div>
    <div v-else-if="error" class="state-text error">{{ error }}</div>

    <div v-else-if="selectedLevel" class="table-wrapper">
      <v-data-table
        :headers="headers"
        :items="filteredParticipants"
        :items-per-page="-1"
        class="elevation-1"
        hide-default-footer
      >
        <template #item="{ item, index }">
          <tr>
            <td class="text-black">{{ index + 1 }}</td>
            <td class="student-name text-black">
              {{ item.student.name }}
            </td>
            <td>
              <input
                v-if="!item.grade && item.grade !== 0"
                type="number"
                v-model.number="grades[item.student._id]"
                min="0"
                max="100"
                class="grade-input-native"
                placeholder="ادخل الدرجة"
              />
              <span v-else class="text-black">{{ item.grade }}</span>
            </td>
            <td>
              <div v-if="!item.attended" class="attendance-group-native">
                <label class="radio-label">
                  <input
                    type="radio"
                    value="present"
                    v-model="attendance[item.student._id]"
                    class="radio-input"
                  />
                  <span>حاضر</span>
                </label>
                <label class="radio-label">
                  <input
                    type="radio"
                    value="absent"
                    v-model="attendance[item.student._id]"
                    class="radio-input"
                  />
                  <span>غائب</span>
                </label>
              </div>
              <span v-else class="text-black">
                {{ item.attended ? "حاضر" : "غائب" }}
              </span>
            </td>
          </tr>
        </template>

        <template #no-data>
          <div class="no-data">
            لا توجد بيانات لهذا المستوى
          </div>
        </template>
      </v-data-table>

      <div class="actions">
        <v-btn
          color="primary"
          @click="saveGrades"
          :disabled="!hasAnyGrade"
          :loading="savingGrades"
        >
          حفظ الدرجات
        </v-btn>
        <v-btn
          color="red"
          @click="clearGrades"
        >
          مسح الدرجات
        </v-btn>
      </div>
    </div>

    <div v-else class="state-text">
      من فضلك اختر المستوى لعرض الطلاب.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  fetchCompetitionById,
  getCompetitionParticipants,
  saveCompetitionGrades,
  type CompetitionLevel,
  type CompetitionData,
} from "../lib/api";

interface Student {
  _id: string;
  name: string;
}

interface Participant {
  student: Student;
  levelNumber: number;
  status: string;
  grade: number;
  attended: boolean;
}

const route = useRoute();
const competitionId = computed(() => route.params.id as string);


const savingGrades = ref(false);
const loading = ref(false);
const error = ref("");
const levels = ref<CompetitionLevel[]>([]);
const competition = ref<CompetitionData | null>(null);
const participants = ref<Participant[]>([]);

const searchQuery = ref("");
const selectedLevel = ref<number | "">("");
const grades = ref<Record<string, number | null>>({});
const attendance = ref<Record<string, "present" | "absent" | null>>({});

// Reset grades and attendance when level changes
watch(selectedLevel, () => {
  grades.value = {};
  attendance.value = {};
});

function normalizeArabic(text: string) {
  return text
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim()
    .toLowerCase();
}

const filteredParticipants = computed(() => {
  if (!selectedLevel.value) {
    return [];
  }

  let list = participants.value.filter(
    (p) => p.levelNumber === Number(selectedLevel.value) && p.status === 'accepted'
  );

  if (searchQuery.value) {
    const query = normalizeArabic(searchQuery.value);
    list = list.filter((p) =>
      normalizeArabic(p.student.name).includes(query)
    );
  }

  return list;
});

const headers = computed(() => [
  {
    title: "#",
    key: "index",
    sortable: false,
    width: "5%",
    align: "center" as const,
  },
  {
    title: "اسم الطالب",
    key: "student.name",
    sortable: true,
    width: "45%",
    align: "center" as const,
  },
  {
    title: "الدرجة",
    key: "grade",
    sortable: true,
    width: "20%",
    align: "center" as const,
  },
  {
    title: "الحضور",
    key: "attendance",
    sortable: false,
    width: "20%",
    align: "center" as const,
  },
]);

const hasAnyGrade = computed(() =>
  Object.values(grades.value).some(
    (g) => g !== null && g !== undefined && !Number.isNaN(g as number)
  )
);

const loadData = async () => {
  loading.value = true;
  error.value = "";
  try {
    competition.value = await fetchCompetitionById(competitionId.value);
    levels.value = competition.value.levels;

    const response = await getCompetitionParticipants(competitionId.value);
    participants.value = response?.data?.studentsData ?? [];
  } catch (err: any) {
    error.value = err?.message || "فشل تحميل البيانات";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const clearGrades = () => {
  grades.value = {};
  attendance.value = {};
};

const saveGrades = async () => {
  if (!selectedLevel.value) {
    alert("من فضلك اختر المستوى أولاً");
    return;
  }

  

  const payload = Object.entries(grades.value)
    .filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        !Number.isNaN(value as number)
    )
    .map(([studentId, grade]) => ({
      studentId,
      grade: Number(grade),
      attended: attendance.value[studentId] !== "absent",
    }));

  if (!payload.length) {
    alert("لا توجد درجات لحفظها");
    return;
  }

  try {
    savingGrades.value = true
    await saveCompetitionGrades(competitionId.value, payload);
    const response = await getCompetitionParticipants(competitionId.value);
    participants.value = response?.data?.studentsData ?? participants.value;
  } catch (err: any) {
    console.error(err);
  } finally {
    savingGrades.value = false
  }
};
</script>

<style scoped>
.grades-container {
  padding: 20px;
  direction: rtl;
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 26px;
  margin-bottom: 20px;
  color: #333;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
}

.search-input,
.level-select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  min-width: 220px;
  font-size: 14px;
  background-color: white;
  color: #333;
}

.search-input:focus,
.level-select:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.table-wrapper {
  overflow-x: auto;
  /* background: white; */
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.grades-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}

.grades-table th,
.grades-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  text-align: right;
}

.grades-table thead {
  background-color: #4caf50;
  color: white;
}

.grades-table th {
  font-weight: 600;
}

.grades-table tbody tr:hover {
  background-color: #f5f5f5;
}

.student-name {
  font-weight: 600;
  color: #333;
}

.grade-input-native {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
  background-color: white;
  color: #333;
}

.grade-input-native:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.grade-input-native::-webkit-inner-spin-button,
.grade-input-native::-webkit-outer-spin-button {
  opacity: 0.5;
  height: 20px;
}

.attendance-group-native {
  display: flex;
  gap: 15px;
  align-items: center;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: #333;
}

.radio-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #4caf50;
}

.state-text {
  margin-top: 20px;
  text-align: center;
  color: #555;
  padding: 20px;
}

.state-text.error {
  color: #d32f2f;
}

.no-data {
  text-align: center;
  color: #888;
  padding: 30px !important;
}

.actions {
  background-color: white;
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  padding: 16px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #4caf50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-secondary {
  background-color: white;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f5f5f5;
}

@media (max-width: 768px) {
  .grades-container {
    padding: 10px;
  }

  .controls {
    flex-direction: column;
  }

  .search-input,
  .level-select {
    width: 100%;
  }

  .grade-input-native {
    width: 80px;
  }

  .attendance-group-native {
    flex-direction: column;
    gap: 5px;
    align-items: flex-start;
  }
}
</style>