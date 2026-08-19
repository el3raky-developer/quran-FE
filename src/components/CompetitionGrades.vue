<template>
  <div class="grades-container">
    <h1 class="title">رصد الدرجات</h1>

    <div v-if="showBothCategoryToggle" class="category-toggle">
      <v-radio-group v-model="selectedCompetitionType" row dir="rtl">
        <v-radio label="قرآن" value="quran" />
        <v-radio label="قراءات" value="qraat" />
      </v-radio-group>
    </div>

    <div class="controls">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="ابحث باسم الطالب..."
      />

      <select
        v-if="showQuranLevelSelect"
        v-model="selectedLevel"
        class="level-select"
      >
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

      <select
        v-else-if="showQraatLevelSelect"
        v-model="selectedQraatLevel"
        class="level-select"
      >
        <option class="text-black" value="">اختر القراءة</option>
        <option
          v-for="level in qraatLevelItems"
          :key="level.value"
          class="text-black"
          :value="level.value"
        >
          {{ level.title }}
        </option>
      </select>

      <v-btn
        color="secondary"
        variant="outlined"
        class="top-btn"
        @click="openTopDialog"
      >
        تحديد الأوائل
      </v-btn>

      <v-btn
        color="secondary"
        variant="outlined"
        class="top-btn"
        @click="openMoneyDialog"
      >
        قيمة التبرعات
      </v-btn>

      <v-btn
        color="secondary"
        variant="outlined"
        class="top-btn"
        @click="openPrizeDialog"
      >
        توزيع الجوائز
      </v-btn>

      <v-btn
        color="secondary"
        variant="outlined"
        class="top-btn"
        @click="openAddPrizeDialog"
      >
        رفع الجائزة
      </v-btn>

      <v-btn
        v-if="hasActiveFilter"
        color="secondary"
        variant="outlined"
        class="top-btn"
        @click="printPrizesReport()"
      >
        كشف الجوائز
      </v-btn>

      <v-btn
        v-if="hasActiveFilter"
        color="secondary"
        variant="outlined"
        class="top-btn"
        @click="printStudentsReport()"
      >
        كشف الطلبة
      </v-btn>

      <v-btn
        v-if="hasActiveFilter"
        color="secondary"
        variant="outlined"
        class="top-btn"
        prepend-icon="mdi-printer"
        :loading="printingCertificates"
        :disabled="printingCertificates"
        @click="printCertificatesReport(false)"
      >
        طبع الشهادات
      </v-btn>
      <v-btn
        v-if="hasActiveFilter"
        color="secondary"
        variant="outlined"
        class="top-btn"
        prepend-icon="mdi-printer"
        :loading="printingTopCertificates"
        :disabled="printingTopCertificates"
        @click="printCertificatesReport(true)"
      >
        طبع شهادات الاوئل
      </v-btn>
    </div>

    <v-dialog v-model="topDialog" max-width="360">
      <v-card>
        <v-card-title class="text-h6 text-center">
          تحديد عدد الأوائل
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="topCount"
            type="number"
            label="عدد الأوائل"
            min="1"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="topDialog = false"> إلغاء </v-btn>
          <v-btn
            color="primary"
            @click="saveTopCount"
            :loading="savingTopCount"
          >
            حفظ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="moneyDialog" max-width="420">
      <v-card>
        <v-card-title class="text-h6 text-center">
          قيمة التبرعات للمسابقة
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="totalMoney"
            type="number"
            label="المبلغ "
            min="0"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-if="competitionCategory === 'quran' || competitionCategory === 'both'"
            v-model.number="quranPartValue"
            type="number"
            label="قيمة الجزء لمسابقة القرآن"
            min="0"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-if="competitionCategory === 'qraat' || competitionCategory === 'both'"
            v-model.number="qraatPartValue"
            type="number"
            label="قيمة الجزء لمسابقة القراءات"
            min="0"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="moneyDialog = false"> إلغاء </v-btn>
          <v-btn color="primary" @click="saveTotalMoney" :loading="savingMoney">
            حفظ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="prizeDialog" max-width="360">
      <v-card>
        <v-card-title class="text-h6 text-center"> توزيع الجوائز </v-card-title>
        <v-card-text class="text-center">
          <p>تأكد من ادخال قيمة التبرعات للمسابقة</p>
          <p>تأكد من ادخال درجات المتسابقين كامله</p>
          <p class="mt-4">
            إجمالي التبرعات:
            {{ displayTotalMoney !== null ? displayTotalMoney + " جنيه" : "-" }}
          </p>
          <p>
            المبلغ المتبقى بعد توزيع الجوائز على المتسابقين:
            {{ remainingAmount !== null ? remainingAmount + "جنيه" : "-" }}
          </p>
          <!-- banknote breakdown section (automatically calculated) -->
          <div class="banknote-breakdown mt-4">
            <h4>عدد الأوراق حسب الفئة</h4>
            <div
              v-for="note in noteCounts"
              :key="note.denom"
              class="banknote-row"
            >
              فئة {{ note.denom }} : {{ note.count }} ورقة
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="prizeDialog = false"> إلغاء </v-btn>
          <v-btn color="primary" @click="savePrizes" :loading="savingPrizes">
            حفظ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="addPrizeDialog" max-width="360">
      <v-card>
        <v-card-title class="text-h6 text-center">
          قيمة المضافة للجائزة
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="addedPrizeAmount"
            type="number"
            label="المبلغ المضاف"
            min="0"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="addPrizeDialog = false"> إلغاء </v-btn>
          <v-btn
            color="primary"
            @click="saveAddedPrize"
            :loading="savingAddedPrize"
          >
            حفظ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div v-if="loading" class="state-text">جاري تحميل البيانات...</div>
    <div v-else-if="error" class="state-text error">{{ error }}</div>

    <div v-else-if="hasActiveFilter" class="tables-stack">
      <div v-if="!isQraatMode" class="table-wrapper">
        <h2 class="table-section-title">طلاب القرآن</h2>
        <v-data-table
          :headers="headers"
          :items="filteredParticipants"
          :items-per-page="-1"
          class="elevation-1"
          hide-default-footer
          show-select
          item-value="student._id"
          v-model="selectedParticipants"
        >
          <template #item.student.name="{ item }">
            <span class="student-name text-black text-center">
              {{ item.student.name }}
            </span>
          </template>

          <template #item.index="{ index }">
            <span class="text-black text-center">
              {{ index + 1 }}
            </span>
          </template>

          <template #item.grade="{ item }">
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
          </template>

          <template #item.place="{ item }">
            <span class="text-center">
              {{ getPlace(item.student._id) ?? "-" }}
            </span>
          </template>

          <template #item.attendance="{ item }">
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
          </template>

          <template #item.actions="{ item }">
            <v-btn
              color="primary"
              @click="openEditDialog(item)"
              prepend-icon="mdi-pencil"
            >
              تعديل
            </v-btn>
          </template>

          <template #no-data>
            <div class="no-data">لا توجد بيانات لهذا المستوى</div>
          </template>
        </v-data-table>
      </div>

      <div v-else class="table-wrapper">
        <h2 class="table-section-title">طلاب القراءات</h2>
        <v-data-table
          :headers="qraatHeaders"
          :items="filteredParticipants"
          :items-per-page="-1"
          class="elevation-1"
          hide-default-footer
          show-select
          item-value="student._id"
          v-model="selectedParticipants"
        >
          <template #item.student.name="{ item }">
            <span class="student-name text-black text-center">
              {{ item.student.name }}
            </span>
          </template>

          <template #item.index="{ index }">
            <span class="text-black text-center">
              {{ index + 1 }}
            </span>
          </template>

          <template #item.qraatTitle="{ item }">
            <span class="text-black text-center">
              {{ getParticipantQraatTitle(item, competition) }}
            </span>
          </template>

          <template #item.grade="{ item }">
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
          </template>

          <template #item.place="{ item }">
            <span class="text-center">
              {{ getPlace(item.student._id) ?? "-" }}
            </span>
          </template>

          <template #item.attendance="{ item }">
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
          </template>

          <template #item.actions="{ item }">
            <v-btn
              color="primary"
              @click="openEditDialog(item)"
              prepend-icon="mdi-pencil"
            >
              تعديل
            </v-btn>
          </template>

          <template #no-data>
            <div class="no-data">لا توجد بيانات لهذه القراءة</div>
          </template>
        </v-data-table>
      </div>

      <v-dialog v-model="editDialog" max-width="400">
        <v-card>
          <v-card-title class="text-h6 text-center">
            تعديل درجة الطالب
          </v-card-title>
          <v-card-text>
            <div class="mb-4 text-center" v-if="editingParticipant">
              <strong>{{ editingParticipant.student.name }}</strong>
            </div>
            <v-text-field
              v-model.number="editingGrade"
              type="number"
              label="الدرجة"
              variant="outlined"
              density="comfortable"
              min="0"
              max="100"
            />
            <v-radio-group
              v-model="editingAttendance"
              class="mt-4"
              label="الحضور"
              inline
            >
              <v-radio label="حاضر" value="present" />
              <v-radio label="غائب" value="absent" />
            </v-radio-group>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="editDialog = false"> إلغاء </v-btn>
            <v-btn
              color="primary"
              @click="saveEditDialog"
              :loading="updatingGrade"
            >
              حفظ
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <div class="actions">
        <v-btn
          color="primary"
          @click="saveGrades"
          :disabled="!hasAnyGrade"
          :loading="savingGrades"
        >
          حفظ الدرجات
        </v-btn>
        <v-btn color="red" @click="clearGrades"> مسح الدرجات </v-btn>
      </div>
    </div>

    <div v-else class="state-text">{{ emptyFilterMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  fetchCompetitionById,
  getCompetitionParticipants,
  getCompetitionTopStudents,
  saveCompetitionGrades,
  type CompetitionLevel,
  type CompetitionData,
  saveLevelTopStudents,
  type TopStudentsByLevel,
  type TopStudent,
  setTotalCompetitionMoney,
  calculatePrizes,
  addPrizeToParticipants,
} from "../lib/api";
import { printData } from "../utils/printById";
import { printCertificates } from "../utils/print";
import {
  isQraat,
  qraatLevelItems as buildQraatLevelItems,
  getParticipantQraatLevelId,
  getParticipantQraatTitle,
} from "../utils/reportHelpers";

// loading state for print buttons
const printingCertificates = ref(false);
const printingTopCertificates = ref(false);

interface Student {
  _id: string;
  name: string;
  national_ID?: string;
  gender?: string;
  // certificate helper may need level value
  levelValue?: number;
}

interface Participant {
  student: Student;
  levelNumber: number;
  status: string;
  grade: number;
  attended: boolean;
  prize?: number;
  qraatLevel?: { _id: string; title: string } | string | null;
  qraat_level?: string | null;
  category?: string;
}

const route = useRoute();
const competitionId = computed(() => route.params.id as string);

const savingGrades = ref(false);
const savingTopCount = ref(false);
const updatingGrade = ref(false);
const topDialog = ref(false);
const topCount = ref<number | null>(null);
const moneyDialog = ref(false);
const totalMoney = ref<number | null>(null);
const quranPartValue = ref<number | null>(null);
const qraatPartValue = ref<number | null>(null);
const savingMoney = ref(false);
const prizeDialog = ref(false);
const savingPrizes = ref(false);
const selectedItems = ref<any[]>([]);

const selectedParticipants = ref<string[]>([]);

const addPrizeDialog = ref(false);
const addedPrizeAmount = ref<number | null>(null);
const savingAddedPrize = ref(false);

// denominations used for note counting
// expand per user request to include additional denominations
const denominations = [200, 100, 50, 20, 10, 5];

const noteCounts = computed(() => {
  // for each participant prize, compute its own breakdown then accumulate
  const totals: Record<number, number> = {};
  denominations.forEach((d) => (totals[d] = 0));
  participants.value.forEach((p) => {
    const prize = Number(p.prize ?? 0);
    if (isNaN(prize) || prize <= 0) return;
    let rem = prize;
    denominations.forEach((d) => {
      const cnt = Math.floor(rem / d);
      totals[d] += cnt;
      rem -= cnt * d;
    });
  });
  return denominations.map((d) => ({ denom: d, count: totals[d] }));
});

const displayTotalMoney = computed<number | null>(() => {
  if (
    competition.value &&
    competition.value.totalCompetitionMoney !== undefined
  ) {
    return competition.value.totalCompetitionMoney;
  }
  return totalMoney.value;
});

const distributedAmount = computed(() => {
  return participants.value.reduce((sum, p) => sum + (p.prize ?? 0), 0);
});

const remainingAmount = computed(() => {
  const total = displayTotalMoney.value ?? 0;
  return total - distributedAmount.value;
});

const editDialog = ref(false);
const editingParticipant = ref<Participant | null>(null);
const editingGrade = ref<number | null>(null);
const editingAttendance = ref<"present" | "absent" | null>(null);
const loading = ref(false);
const error = ref("");
const levels = ref<CompetitionLevel[]>([]);
const competition = ref<CompetitionData | null>(null);
const participants = ref<Participant[]>([]);

const searchQuery = ref("");
const selectedLevel = ref<number | "">("");
const selectedQraatLevel = ref("");
const selectedCompetitionType = ref<"quran" | "qraat">("quran");
const grades = ref<Record<string, number | null>>({});
const attendance = ref<Record<string, "present" | "absent" | null>>({});

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
const isQraatMode = computed(
  () => effectiveCompetitionCategory.value === "qraat"
);
const showQuranLevelSelect = computed(() => !isQraatMode.value);
const showQraatLevelSelect = computed(() => isQraatMode.value);
const qraatLevelItems = computed(() =>
  buildQraatLevelItems(competition.value)
);
const hasActiveFilter = computed(() =>
  isQraatMode.value ? !!selectedQraatLevel.value : !!selectedLevel.value
);
const emptyFilterMessage = computed(() =>
  isQraatMode.value
    ? "من فضلك اختر القراءة لعرض الطلاب."
    : "من فضلك اختر المستوى لعرض الطلاب."
);
const currentGroupLabel = computed(() => {
  if (isQraatMode.value) {
    const item = qraatLevelItems.value.find(
      (l) => String(l.value) === String(selectedQraatLevel.value)
    );
    return item?.title ? `القراءة ${item.title}` : "القراءات";
  }
  return `المستوى ${selectedLevel.value}`;
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
  if (!hasActiveFilter.value) {
    return [];
  }

  let list = participants.value.filter((p) => p.status === "accepted");

  if (isQraatMode.value) {
    list = list.filter(
      (p) =>
        isQraat(p) &&
        String(getParticipantQraatLevelId(p)) ===
          String(selectedQraatLevel.value)
    );
  } else {
    list = list.filter(
      (p) => !isQraat(p) && p.levelNumber === Number(selectedLevel.value)
    );
  }

  if (searchQuery.value) {
    const query = normalizeArabic(searchQuery.value);
    list = list.filter((p) => normalizeArabic(p.student.name).includes(query));
  }

  return list;
});

// hold the top‑students data for every level
const topStudentsByLevel = ref<TopStudentsByLevel[]>([]);

const topStudentsForSelectedLevel = computed(() => {
  if (isQraatMode.value) {
    if (!selectedQraatLevel.value) return [] as TopStudent[];
    const byQraat = topStudentsByLevel.value.find((l: any) => {
      const qraatId =
        l.qraatLevel?._id ?? l.qraat_level ?? l.qraatLevel ?? null;
      return (
        String(qraatId) === String(selectedQraatLevel.value) ||
        String(l.levelNumber) === String(selectedQraatLevel.value)
      );
    });
    if (byQraat) return byQraat.topStudents || [];

    const ids = new Set(filteredParticipants.value.map((p) => p.student._id));
    return topStudentsByLevel.value
      .flatMap((l) => l.topStudents || [])
      .filter((s) => ids.has(s.student._id));
  }

  if (!selectedLevel.value) return [] as TopStudent[];
  return (
    topStudentsByLevel.value.find(
      (l) => l.levelNumber === Number(selectedLevel.value)
    )?.topStudents || []
  );
});

const getPlace = (studentId: string): number | null => {
  const t = topStudentsForSelectedLevel.value.find(
    (s) => s.student._id === studentId
  );
  return t ? t.place : null;
};

watch([selectedLevel, selectedQraatLevel, selectedCompetitionType], () => {
  grades.value = {};
  attendance.value = {};
  selectedParticipants.value = [];
});

watch(effectiveCompetitionCategory, () => {
  selectedLevel.value = "";
  selectedQraatLevel.value = "";
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
    width: "35%",
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
    title: "المركز",
    key: "place",
    sortable: true,
    width: "10%",
    align: "center" as const,
  },
  {
    title: "الجائزة",
    key: "prize",
    sortable: false,
    width: "10%",
    align: "center" as const,
  },
  {
    title: "الحضور",
    key: "attendance",
    sortable: false,
    width: "20%",
    align: "center" as const,
  },
  {
    title: "إجراءات",
    key: "actions",
    sortable: false,
    width: "10%",
    align: "center" as const,
  },
]);

const qraatHeaders = computed(() => [
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
    width: "25%",
    align: "center" as const,
  },
  {
    title: "القراءة",
    key: "qraatTitle",
    sortable: true,
    width: "15%",
    align: "center" as const,
  },
  {
    title: "الدرجة",
    key: "grade",
    sortable: true,
    width: "15%",
    align: "center" as const,
  },
  {
    title: "المركز",
    key: "place",
    sortable: true,
    width: "8%",
    align: "center" as const,
  },
  {
    title: "الجائزة",
    key: "prize",
    sortable: false,
    width: "10%",
    align: "center" as const,
  },
  {
    title: "الحضور",
    key: "attendance",
    sortable: false,
    width: "15%",
    align: "center" as const,
  },
  {
    title: "إجراءات",
    key: "actions",
    sortable: false,
    width: "10%",
    align: "center" as const,
  },
]);

const hasAnyGrade = computed(() =>
  Object.values(grades.value).some(
    (g) => g !== null && g !== undefined && !Number.isNaN(g as number)
  )
);

const loadTopStudents = async () => {
  try {
    const resp = await getCompetitionTopStudents(competitionId.value);
    // the API returns { success, data: [...] }
    topStudentsByLevel.value = resp?.data ?? [];
  } catch (err: any) {
    console.error("unable to load top students", err);
  }
};

const loadData = async () => {
  loading.value = true;
  error.value = "";
  try {
    competition.value = await fetchCompetitionById(competitionId.value);
    levels.value = competition.value.levels;

    const response = await getCompetitionParticipants(competitionId.value);
    participants.value = response?.data?.studentsData ?? [];

    // fetch the current top‑students list as well
    await loadTopStudents();
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
  if (!hasActiveFilter.value) {
    alert(
      isQraatMode.value
        ? "من فضلك اختر القراءة أولاً"
        : "من فضلك اختر المستوى أولاً"
    );
    return;
  }

  const payload = Object.entries(grades.value)
    .filter(
      ([, value]) =>
        value !== null && value !== undefined && !Number.isNaN(value as number)
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
    savingGrades.value = true;
    await saveCompetitionGrades(competitionId.value, payload);
    const response = await getCompetitionParticipants(competitionId.value);
    participants.value = response?.data?.studentsData ?? participants.value;
  } catch (err: any) {
    console.error(err);
  } finally {
    savingGrades.value = false;
  }
};

const openTopDialog = () => {
  topDialog.value = true;
};

const saveTopCount = async () => {
  if (
    topCount.value === null ||
    topCount.value === undefined ||
    Number.isNaN(Number(topCount.value)) ||
    Number(topCount.value) <= 0 ||
    !hasActiveFilter.value
  ) {
    alert("من فضلك أدخل رقمًا صحيحًا لعدد الأوائل");
    return;
  }

  const levelNumberForApi = isQraatMode.value
    ? filteredParticipants.value.find((p) => p.levelNumber != null)
        ?.levelNumber ?? selectedQraatLevel.value
    : Number(selectedLevel.value);

  try {
    savingTopCount.value = true;
    await saveLevelTopStudents(
      competitionId.value,
      levelNumberForApi,
      Number(topCount.value)
    );
    const response = await getCompetitionParticipants(competitionId.value);
    participants.value = response?.data?.studentsData ?? participants.value;

    // reload top‑students so the place column updates immediately
    await loadTopStudents();
  } catch (err: any) {
    console.error(err);
  } finally {
    savingTopCount.value = false;
    topDialog.value = false;
  }
};

const openMoneyDialog = () => {
  // preload with stored competition total if available
  totalMoney.value = displayTotalMoney.value;
  quranPartValue.value = competition.value?.quranPartValue ?? null;
  qraatPartValue.value = competition.value?.qraatPartValue ?? null;
  moneyDialog.value = true;
};

const openPrizeDialog = () => {
  prizeDialog.value = true;
};

const saveTotalMoney = async () => {
  if (
    totalMoney.value === null ||
    totalMoney.value === undefined ||
    Number.isNaN(Number(totalMoney.value)) ||
    Number(totalMoney.value) < 0
  ) {
    alert("من فضلك أدخل مبلغًا صحيحًا");
    return;
  }

  const showQuranPart =
    competitionCategory.value === "quran" ||
    competitionCategory.value === "both";
  const showQraatPart =
    competitionCategory.value === "qraat" ||
    competitionCategory.value === "both";

  const quranValue = showQuranPart
    ? quranPartValue.value === null || quranPartValue.value === undefined
      ? null
      : Number(quranPartValue.value)
    : undefined;
  const qraatValue = showQraatPart
    ? qraatPartValue.value === null || qraatPartValue.value === undefined
      ? null
      : Number(qraatPartValue.value)
    : undefined;

  if (
    (quranValue !== undefined &&
      quranValue !== null &&
      (Number.isNaN(quranValue) || quranValue < 0)) ||
    (qraatValue !== undefined &&
      qraatValue !== null &&
      (Number.isNaN(qraatValue) || qraatValue < 0))
  ) {
    alert("من فضلك أدخل قيمة جزء صحيحة");
    return;
  }

  try {
    savingMoney.value = true;
    const amt = Number(totalMoney.value);
    await setTotalCompetitionMoney(competitionId.value, amt, {
      ...(showQuranPart ? { quranPartValue: quranValue } : {}),
      ...(showQraatPart ? { qraatPartValue: qraatValue } : {}),
    });
    // reflect back in competition object so dialog can show it
    if (competition.value) {
      competition.value.totalCompetitionMoney = amt;
      if (showQuranPart) {
        competition.value.quranPartValue = quranValue ?? undefined;
      }
      if (showQraatPart) {
        competition.value.qraatPartValue = qraatValue ?? undefined;
      }
    }
  } catch (err: any) {
    console.error(err);
  } finally {
    savingMoney.value = false;
    moneyDialog.value = false;
  }
};

const savePrizes = async () => {
  try {
    savingPrizes.value = true;
    await calculatePrizes(competitionId.value);
    const response = await getCompetitionParticipants(competitionId.value);
    participants.value = response?.data?.studentsData ?? participants.value;
  } catch (err: any) {
    console.error(err);
  } finally {
    savingPrizes.value = false;
    prizeDialog.value = false;
  }
};

const openAddPrizeDialog = () => {
  if (selectedParticipants.value.length === 0) {
    alert("من فضلك اختر متسابقين أولاً");
    return;
  }
  addedPrizeAmount.value = null;
  addPrizeDialog.value = true;
};

const saveAddedPrize = async () => {
  if (
    addedPrizeAmount.value === null ||
    addedPrizeAmount.value === undefined ||
    Number.isNaN(Number(addedPrizeAmount.value))
  ) {
    alert("من فضلك أدخل قيمة صحيحة للمضافة");
    return;
  }

  try {
    savingAddedPrize.value = true;
    await addPrizeToParticipants(
      competitionId.value,
      selectedParticipants.value,
      Number(addedPrizeAmount.value)
    );
    const response = await getCompetitionParticipants(competitionId.value);
    participants.value = response?.data?.studentsData ?? participants.value;
    // clear selection after update
    selectedItems.value = [];
    selectedParticipants.value = [];
  } catch (err: any) {
    console.error(err);
  } finally {
    savingAddedPrize.value = false;
    addPrizeDialog.value = false;
  }
};

const openEditDialog = (item: Participant) => {
  editingParticipant.value = item;
  const studentId = item.student._id;
  const currentGrade =
    grades.value[studentId] !== undefined && grades.value[studentId] !== null
      ? grades.value[studentId]
      : item.grade;
  editingGrade.value = currentGrade ?? null;

  const currentAttendance =
    attendance.value[studentId] ??
    (item.attended ? "present" : ("absent" as "present" | "absent"));
  editingAttendance.value = currentAttendance;

  editDialog.value = true;
};

const saveEditDialog = async () => {
  if (!editingParticipant.value) return;

  const item = editingParticipant.value;
  const studentId = item.student._id;

  if (
    editingGrade.value === null ||
    editingGrade.value === undefined ||
    Number.isNaN(Number(editingGrade.value))
  ) {
    alert("من فضلك ادخل درجة صحيحة لهذا الطالب");
    return;
  }

  const attended =
    editingAttendance.value !== null && editingAttendance.value !== undefined
      ? editingAttendance.value !== "absent"
      : item.attended;

  const payload = [
    {
      studentId,
      grade: Number(editingGrade.value),
      attended,
    },
  ];

  try {
    updatingGrade.value = true;
    await saveCompetitionGrades(competitionId.value, payload);
    const response = await getCompetitionParticipants(competitionId.value);
    participants.value = response?.data?.studentsData ?? participants.value;
    // reflect changes in local maps
    grades.value[studentId] = Number(editingGrade.value);
    attendance.value[studentId] = attended ? "present" : "absent";
    editDialog.value = false;
  } catch (err: any) {
    console.error(err);
  } finally {
    updatingGrade.value = false;
  }
};

function printPrizesReport() {
  const printColumns = [
    { title: "#", key: "index", width: "7%" },
    { title: "اسم الطالب", key: "studentName", width: "45%" },
    { title: "الجائزة", key: "prize", width: "15%" },
    { title: "التوقيع", key: "", width: "33%" },
  ];

  const printRows = filteredParticipants.value
    .filter((p) => p.attended)
    .sort((a, b) => b.grade - a.grade)
    .map((p, index) => {
      return {
        index: index + 1,
        studentName: p.student.name,
        prize: p.prize,
      };
    });

  const totalPrize = filteredParticipants.value.reduce(
    (sum, p) => sum + (Number(p.prize) || 0),
    0
  );

  const printOptions = {
    title: `كشف الجوائز - ${currentGroupLabel.value}`,
    headerData: {
      "إجمالي الجوائز": `${totalPrize}`,
    },
    styles: `
      th { background-color: #f3f3f3 !important; font-weight: bold; }
      td, th { border: 1px solid #ccc; padding: 8px; text-align: right; }
      td:first-child { width: 50px; text-align: center; } /* Index column */
    `,
  };

  printData({ columns: printColumns, rows: printRows }, printOptions);
}

function printStudentsReport() {
  const printColumns = isQraatMode.value
    ? [
        { title: "#", key: "index", width: "7%" },
        { title: "اسم الطالب", key: "studentName", width: "35%" },
        { title: "القراءة", key: "qraatTitle", width: "15%" },
        { title: "الدرجة", key: "grade", width: "13%" },
        { title: "المركز", key: "place", width: "10%" },
        { title: "الجائزة", key: "prize", width: "20%" },
      ]
    : [
        { title: "#", key: "index", width: "7%" },
        { title: "اسم الطالب", key: "studentName", width: "45%" },
        { title: "الدرجة", key: "grade", width: "15%" },
        { title: "المركز", key: "place", width: "10%" },
        { title: "الجائزة", key: "prize", width: "23%" },
      ];

  const printRows = filteredParticipants.value
    .filter((p) => p.attended)
    .sort((a, b) => b.grade - a.grade)
    .map((p, index) => ({
      index: index + 1,
      studentName: p.student.name,
      prize: p.prize,
      grade: p.grade,
      place: getPlace(p.student._id),
      qraatTitle: isQraatMode.value
        ? getParticipantQraatTitle(p, competition.value)
        : undefined,
    }));

  const printOptions = {
    title: `كشف الطلبة - ${currentGroupLabel.value}`,
    styles: `
      th { background-color: #f3f3f3 !important; font-weight: bold; }
      td, th { border: 1px solid #ccc; padding: 8px; text-align: right; }
      td:first-child { width: 50px; text-align: center; } /* Index column */
    `,
  };

  printData({ columns: printColumns, rows: printRows }, printOptions);
}

async function printCertificatesReport(topStudents: boolean) {
  if (printingCertificates.value) return; // prevent double clicks
  if (topStudents) {
    printingTopCertificates.value = true;
  } else {
    printingCertificates.value = true;
  }

  try {
    const sourceParticipants = isQraatMode.value
      ? filteredParticipants.value
      : filteredParticipants.value.filter((p) => p.attended);

    // deduplicate by student ID to avoid repeated certificates
    const seen = new Set<string>();
    const uniqueParticipants = sourceParticipants.filter((p) => {
      if (seen.has(p.student._id)) return false;
      seen.add(p.student._id);
      return true;
    });

    const studentsForCerts = uniqueParticipants
      .filter((p) => {
        if (!topStudents) {
          if (!getPlace(p.student._id)) {
            return p;
          }
        } else {
          if (getPlace(p.student._id)) {
            return p;
          }
        }
      })
      .map((p) => ({
        student: {
          name: p.student.name,
          gender: p.student.gender,
          national_ID: p.student.national_ID,
        },
        grade: p.grade,
        passed: (p.grade ?? 0) >= 50,
        place: getPlace(p.student._id),
        levelNumber: p.levelNumber,
        levelValue: isQraatMode.value
          ? undefined
          : competition.value?.levels.find(
              (l) => l.levelNumber === p.levelNumber
            )?.value,
        rank: getPlace(p.student._id),
        isQraat: isQraatMode.value,
        qraatTitle: isQraatMode.value
          ? getParticipantQraatTitle(p, competition.value)
          : undefined,
      }));

    const title = competition.value?.title || "";
    const filename = `شهادات ${topStudents ? "الاوائل" : ""} ${currentGroupLabel.value}`;
    await printCertificates(studentsForCerts as any[], title, filename);
  } catch (err) {
    console.error("error printing certificates", err);
  } finally {
    if (topStudents) {
      printingTopCertificates.value = false;
    } else {
      printingCertificates.value = false;
    }
  }
}
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

.category-toggle {
  margin-bottom: 12px;
}

.table-section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  padding: 12px 16px 0;
  color: #333;
}

.tables-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.banknote-breakdown {
  text-align: right;
}

.banknote-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.banknote-input {
  width: 80px;
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