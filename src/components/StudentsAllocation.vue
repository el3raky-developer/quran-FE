<template>
  <div class="students-allocation pa-4" dir="rtl">
    <div class="no-print">
    <h1 class="text-h4 mb-6 font-weight-bold text-center">
      توزيع المتسابقين على لجنة الاختبار
    </h1>

    <v-card elevation="4" class="rounded-lg mx-auto" max-width="600">
      <v-card-text class="pa-6">
        <v-form @submit.prevent="submitForm">
          <!-- تاريخ ووقت الاختبار -->
          <v-text-field
            v-model="testDateTime"
            label="تاريخ ووقت الاختبار"
            type="datetime-local"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-calendar-clock"
            class="mb-4"
            :rules="[validators.required]"
            hint="اختر اليوم والوقت المناسب للاختبار"
            persistent-hint
          />

          <!-- مدة الاختبار (دقائق) -->
          <v-text-field
            v-model.number="testDurationMinutes"
            label="مدة الاختبار (دقائق)"
            type="number"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-timer-outline"
            min="1"
            max="480"
            class="mb-4"
            :rules="[validators.required, validators.minDuration]"
            hint="مدة الاختبار بالدقائق لكل متسابق"
            persistent-hint
          />

          <!-- عدد لجان الاختبار -->
          <v-text-field
            v-model.number="numCommittees"
            label="عدد لجان الاختبار"
            type="number"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-account-group"
            min="1"
            max="99"
            class="mb-4"
            :rules="[validators.required, validators.minCommittees]"
            hint="كم لجنة اختبار تريد إنشاءها؟"
            persistent-hint
          />

          <!-- المستوى المراد اختباره -->
          <v-select
            v-model="selectedLevel"
            :items="levelItems"
            item-title="title"
            item-value="value"
            label="المستوى المراد اختباره"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-medal"
            class="mb-4"
            :rules="[validators.required]"
            :loading="loadingLevels"
            hint="اختر المستوى الذي سيتم توزيع المتسابقين عليه"
            persistent-hint
          />

          <v-alert
            v-if="success"
            type="success"
            variant="tonal"
            class="mb-4"
          >
            تم حفظ إعدادات التوزيع بنجاح.
          </v-alert>

          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ error }}
          </v-alert>

          <v-btn
            type="submit"
            color="primary"
            size="large"
            block
            :loading="loading"
            class="text-h6"
          >
            تنفيذ التوزيع
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- لجان الاختبار (مجموعة حسب اليوم) -->
    <div v-if="committeesByDay.length > 0" class="committees-section mt-8">
      <h2 class="text-h5 mb-6 font-weight-bold">
        لجان الاختبار
      </h2>
      <div
        v-for="dayGroup in committeesByDay"
        :key="dayGroup.dateKey"
        class="day-group mb-8"
      >
        <div class="d-flex align-center mb-4">
          <v-icon color="primary" class="ml-2">mdi-calendar</v-icon>
          <h3 class="text-h6 font-weight-bold ma-0">
            {{ dayGroup.dateLabel }}
          </h3>
          <v-chip size="small" variant="tonal" class="mr-2">
            {{ dayGroup.committees.length }} لجنة
          </v-chip>
        </div>
        <v-row>
          <v-col
            v-for="(committee, index) in dayGroup.committees"
            :key="committee._id"
            cols="12"
            sm="6"
            lg="4"
          >
            <v-card elevation="3" class="committee-card rounded-lg" dir="rtl">
              <v-card-title class="d-flex align-center ga-2">
                <v-icon color="primary">mdi-account-group</v-icon>
                <span>لجنة {{ index + 1 }} — المستوى {{ committee.levelNumber }}</span>
              </v-card-title>
              <v-card-subtitle class="text-body2 mt-1">
                {{ formatTestDateTime(committee.testDateTime) }}
              </v-card-subtitle>
              <v-divider />
              <v-card-text class="pa-3">
                <div class="participants-list">
                  <div
                    v-for="(p, i) in committee.participants"
                    :key="p._id"
                    class="participant-row d-flex align-center py-2"
                    :class="{ 'border-t': i > 0 }"
                  >
                    <span class="participant-order text-caption text-medium-emphasis ml-2">
                      {{ i + 1 }}
                    </span>
                    <div class="flex-grow-1">
                      <div class="font-weight-medium">{{ p.studentId?.name }}</div>
                      <div class="text-caption text-medium-emphasis">
                        {{ p.studentId?.national_ID }}
                      </div>
                      <div class="text-caption text-secondary">
                        {{ formatTestDateTime(p.testDateTime) }}
                      </div>
                    </div>
                  </div>
                </div>
                <p v-if="committee.participants.length === 0" class="text-caption text-medium-emphasis">
                  لا يوجد متسابقون في هذه اللجنة
                </p>
              </v-card-text>
              <v-card-actions class="pt-0">
                <v-chip size="small" color="primary" variant="tonal">
                  {{ committee.participants.length }} متسابق
                </v-chip>
                <v-spacer />
                <v-btn
                  prepend-icon="mdi-printer"
                  class="bg-primary text-white"
                  @click="printAttendanceReport(committee.participants , index + 1 , committee.levelNumber)"
                >
                  كشف الحضور 
                </v-btn>
                <v-btn
                  prepend-icon="mdi-printer"
                  class="bg-primary text-white"
                  @click="printGradesReport(committee.participants , index + 1 , committee.levelNumber , committee.levelValue)"
                >
                  كشف الدرجات 
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <div v-else-if="loadingCommittees" class="mt-8 text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-3 text-body2">جاري تحميل لجان الاختبار...</p>
    </div>
    </div>

    <!-- طباعة بطاقات المتسابقين -->
    <div v-if="committees.length > 0" class="print-section mt-8">
      <div class="print-hide d-flex flex-wrap align-center gap-4 mb-4">
        <v-select
          v-model="selectedSheikhForPrint"
          :items="sheikhOptionsForPrint"
          item-title="title"
          item-value="value"
          label="اختر الشيخ لطباعة بطاقات المتسابقين"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-account-tie"
          class="flex-grow-1"
          style="max-width: 360px;"
          clearable
          hide-details
        />
        <v-btn
          color="primary"
          :disabled="!selectedSheikhForPrint || studentCardsForPrint.length === 0"
          @click="printStudentCards"
          prepend-icon="mdi-printer"
        >
          طباعة البطاقات
        </v-btn>
      </div>
      <div v-if="selectedSheikhForPrint && studentCardsForPrint.length > 0" class="cards-for-print print-only">
        <div
          v-for="(card, i) in studentCardsForPrint"
          :key="i"
          class="student-card"
          dir="rtl"
        >
          <div class="student-card__title">{{ card.competitionTitle }} بالمسجد الكبير </div>
          <div class="student-card__level">{{ card.levelLabel }}<br/> المحفظ :{{ card.sheikhName }}</div>
          <div class="student-card__name">الاسم :{{ card.studentName }}</div>
          <div class="student-card__datetime">
            اليوم {{ card.dayName }} التاريخ {{ card.dateStr }} الموعد {{ card.timeStr }}
          </div>
        </div>
      </div>
      <p v-else-if="selectedSheikhForPrint && studentCardsForPrint.length === 0" class="text-body2 text-medium-emphasis print-hide">
        لا يوجد متسابقون لهذا الشيخ في لجان الاختبار.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  fetchCompetitionById,
  allocateStudentsToCommittees,
  getCompetitionTestCommittees,
  fetchSheikhs,
  type CompetitionData,
  type CompetitionLevel,
  type TestCommittee,
  type Sheikh,
} from '../lib/api'
import { printData } from '../utils/printById'

const route = useRoute()
const competitionId = computed(() => route.params.id as string)

const testDateTime = ref('')
const testDurationMinutes = ref<number | ''>('')
const numCommittees = ref<number | ''>('')
const selectedLevel = ref<number | ''>('')
const loading = ref(false)
const success = ref(false)
const error = ref('')
const loadingLevels = ref(true)

const competition = ref<CompetitionData | null>(null)
const levels = ref<CompetitionLevel[]>([])
const committees = ref<TestCommittee[]>([])
const loadingCommittees = ref(false)
const sheikhsList = ref<Sheikh[]>([])
const selectedSheikhForPrint = ref<string>('')

const levelItems = computed(() =>
  levels.value.map((l) => ({
    title:
      l.value === 31
        ? 'المستوى 12 (30 جزء مكرر + التجويد)'
        : `المستوى ${l.levelNumber} (${l.value} أجزاء)`,
    value: l.levelNumber,
  }))
)

/** Group committees by test date (each day gets its own section) */
const committeesByDay = computed(() => {
  const list = committees.value
  if (!list.length) return []
  const map = new Map<string, TestCommittee[]>()
  for (const c of list) {
    const d = new Date(c.testDateTime)
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!map.has(dateKey)) map.set(dateKey, [])
    map.get(dateKey)!.push(c)
  }
  const sortedKeys = Array.from(map.keys()).sort()
  return sortedKeys.map((dateKey) => ({
    dateKey,
    dateLabel: formatDateLabel(dateKey),
    committees: map.get(dateKey)!,
  }))
})

function formatDateLabel(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const levelOrdinals: Record<number, string> = {
  1: 'الأول', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع', 5: 'الخامس',
  6: 'السادس', 7: 'السابع', 8: 'الثامن', 9: 'التاسع', 10: 'العاشر',
  11: 'الحادي عشر', 12: 'الثاني عشر',
}

/** Sheikhs that have students in current committees (for print dropdown) */
const sheikhOptionsForPrint = computed(() => {
  const ids = new Set<string>()
  for (const c of committees.value) {
    for (const p of c.participants) {
      if (p.sheikhId) ids.add(p.sheikhId)
    }
  }
  const sheikhs = sheikhsList.value
  return Array.from(ids)
    .map((id) => {
      const s = sheikhs.find((sh) => sh._id === id)
      return s ? { title: s.name, value: s._id } : null
    })
    .filter(Boolean) as { title: string; value: string }[]
})

interface StudentCardData {
  competitionTitle: string
  levelLabel: string
  sheikhName: string
  studentName: string
  dayName: string
  dateStr: string
  timeStr: string
}

const studentCardsForPrint = computed((): StudentCardData[] => {
  const sheikhId = selectedSheikhForPrint.value
  if (!sheikhId) return []
  const nameById = new Map(sheikhsList.value.map((s) => [s._id, s.name]))
  const sheikhName = nameById.get(sheikhId) ?? ''
  const cards: StudentCardData[] = []
  for (const committee of committees.value) {
    const title = committee.competitionId?.title ?? ''
    const levelLabel = levelOrdinals[committee.levelNumber]
      ? `المستوى ${levelOrdinals[committee.levelNumber]}`
      : `المستوى ${committee.levelNumber}`
    for (const p of committee.participants) {
      if (p.sheikhId !== sheikhId) continue
      const d = new Date(p.testDateTime)
      cards.push({
        competitionTitle: title,
        levelLabel,
        sheikhName,
        studentName: p.studentId?.name ?? '',
        dayName: d.toLocaleDateString('ar-EG', { weekday: 'long' }),
        dateStr: `${d.getDate()} ${d.getMonth() + 1} ${d.getFullYear()}`,
        timeStr: d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true }),
      })
    }
  }
  return cards
})

function printStudentCards() {
  window.print()
}


function printAttendanceReport(students: any , testComitteeNumber: number , levelNumber: number) {

  console.log("studetns" ,students) 
  const printColumns = [
    { title: '#', key: 'index' },
    { title: 'اسم الطالب', key: 'studentName' },
    { title: 'ح', key: '' },
    { title: 'غ', key: '' },
  ];

  const printRows = students?.map((p: any, index: any) => ({
    index: index + 1,
    studentName: p.studentId.name,
  }));

  const printOptions = {
    title:  `كشف الحضور - لجنة ${testComitteeNumber} - المستوى ${levelNumber}`,
    headerData: {
      'إجمالي المشاركين': students?.length.toString(),
    },
    styles: `
      th { background-color: #f3f3f3 !important; font-weight: bold; }
      td, th { border: 1px solid #ccc; padding: 8px; text-align: right; }
      td:first-child { width: 50px; text-align: center; } /* Index column */
    `,
  };

  printData({ columns: printColumns, rows: printRows }, printOptions);
}

function printGradesReport(students: any , testComitteeNumber: number , levelNumber: number , levelValue: number) {

  let gradeColumns;
  if(levelValue < 5) {
    gradeColumns = [
      {title: 'الحفظ', key: ''},
    ]
  } else if(levelValue > 5 && levelValue < 31) {
    gradeColumns = [
      {title: 'الحفظ', key: ''},
      {title: 'الأداء', key: ''},
    ]
  } else {
    gradeColumns = [
      {title: 'الحفظ', key: ''},
      {title: 'الأداء', key: ''},
      {title: 'التجويد', key: ''},
    ]
  }
  const printColumns = [
    { title: '#', key: 'index' },
    { title: 'اسم الطالب', key: 'studentName' },
    ...gradeColumns,
    { title: 'عدد الأخطاء', key: '' },
    { title: 'المجموع', key: '' },
    { title: 'التوقيع', key: '' },
  ];

  const printRows = students?.map((p: any, index: any) => ({
    index: index + 1,
    studentName: p.studentId.name,
  }));

  const printOptions = {
    title:  `كشف الدرجات - لجنة ${testComitteeNumber} - المستوى ${levelNumber}`,
    headerData: {
      'إجمالي المشاركين': students?.length.toString(),
    },
    styles: `
      th { background-color: #f3f3f3 !important; font-weight: bold; }
      td, th { border: 1px solid #ccc; padding: 8px; text-align: right; }
      td:first-child { width: 50px; text-align: center; } /* Index column */
    `,
  };

  printData({ columns: printColumns, rows: printRows }, printOptions);
}

const validators = {
  required: (v: any) =>
    (typeof v === 'string' ? !!v?.trim() : v !== '' && v != null) ||
    'هذا الحقل مطلوب',
  minCommittees: (v: any) => {
    const n = Number(v)
    if (isNaN(n) || n < 1) return 'يجب أن يكون العدد 1 على الأقل'
    if (n > 99) return 'الحد الأقصى 99 لجنة'
    return true
  },
  minDuration: (v: any) => {
    const n = Number(v)
    if (isNaN(n) || n < 1) return 'يجب أن تكون المدة دقيقة واحدة على الأقل'
    if (n > 480) return 'الحد الأقصى 480 دقيقة (8 ساعات)'
    return true
  },
}

async function loadCompetition() {
  if (!competitionId.value) return
  try {
    loadingLevels.value = true
    competition.value = await fetchCompetitionById(competitionId.value)
    levels.value = competition.value?.levels ?? []
  } catch (e) {
    error.value = 'فشل تحميل بيانات المسابقة'
    console.error(e)
  } finally {
    loadingLevels.value = false
  }
}

async function loadCommittees() {
  if (!competitionId.value) return
  try {
    loadingCommittees.value = true
    const [committeesData, sheikhsData] = await Promise.all([
      getCompetitionTestCommittees(competitionId.value),
      fetchSheikhs(),
    ])
    committees.value = committeesData
    sheikhsList.value = sheikhsData ?? []
  } catch (e) {
    committees.value = []
    console.error('Failed to load committees:', e)
  } finally {
    loadingCommittees.value = false
  }
}

function formatTestDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ar-EG', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

async function submitForm() {
  error.value = ''
  success.value = false

  const num = Number(numCommittees.value)
  if (!testDateTime.value?.trim()) {
    error.value = 'يرجى اختيار تاريخ ووقت الاختبار'
    return
  }
  const duration = Number(testDurationMinutes.value)
  if (isNaN(duration) || duration < 1) {
    error.value = 'يرجى إدخال مدة الاختبار بالدقائق (1 أو أكثر)'
    return
  }
  if (isNaN(num) || num < 1) {
    error.value = 'يرجى إدخال عدد لجان صحيح (1 أو أكثر)'
    return
  }
  if (selectedLevel.value === '' || selectedLevel.value == null) {
    error.value = 'يرجى اختيار المستوى المراد اختباره'
    return
  }

  try {
    loading.value = true
    const payload = {
      competitionId: competitionId.value,
      testDateTime: new Date(testDateTime.value).toISOString(),
      testDurationMinutes: duration,
      numCommittees: num,
      levelNumber: Number(selectedLevel.value),
    }
    await allocateStudentsToCommittees(payload)
    success.value = true
    await loadCommittees()
  } catch (e: any) {
    error.value = e?.message || 'حدث خطأ أثناء التوزيع'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadCompetition()
  await loadCommittees()
})
</script>

<style scoped>
.students-allocation {
  max-width: 100%;
}
.committee-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.participant-row.border-t {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.participants-list {
  max-height: 320px;
  overflow-y: auto;
}

/* Student card for print */
.student-card {
  padding: 24px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 16px;
  background: #fff;
  font-family: inherit;
  color: black;
}
.student-card__title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 12px;
  text-align: center;
}
.student-card__level {
  font-size: 1.1rem;
  margin-bottom: 8px;
}
.student-card__name {
  font-size: 1.1rem;
  margin-bottom: 8px;
}
.student-card__datetime {
  font-size: 1rem;
  /* color: #000000; */
}
</style>

<style>
/* Cards visible only when printing */
.print-only {
  display: none !important;
}

/* Print: hide main UI, show only cards; cards stack and fill each page */
@media print {
  .no-print,
  .print-hide {
    display: none !important;
  }
  .print-only {
    display: block !important;
  }
  .print-section {
    padding: 0 !important;
  }
  .cards-for-print {
    padding: 0 !important;
  }
  .student-card {
    page-break-inside: avoid;
    margin-bottom: 12px !important;
    border: 1px solid #ccc !important;
    box-shadow: none !important;
  }
}
</style>
