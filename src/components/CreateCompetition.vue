<template>
  <div class="create-competition-page pa-6">
    <v-card class="pa-6 w-50" elevation="2">
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h2 class="text-h5 mb-2">إنشاء مسابقة جديدة</h2>
          <p class="text-subtitle-2">املأ بيانات المسابقة ثم اضغط حفظ.</p>
        </div>
        <v-btn icon variant="tonal" color="primary" @click="router.back()">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </div>

      <v-form ref="formRef" @submit.prevent="submitForm">
        <v-text-field
          v-model="form.title"
          label="عنوان المسابقة"
          required
          variant="outlined"
          density="comfortable"
          class="mb-4"
          dir="rtl"
        />

        <v-select
          v-model="form.category"
          :items="categories"
          item-title="title"
          item-value="value"
          label="نوع المسابقة"
          required
          variant="outlined"
          density="comfortable"
          class="mb-4"
          dir="rtl"
          @update:model-value="onCategoryChange"
        />

        <v-text-field
          v-model="form.sponsor"
          label="الراعي"
          required
          variant="outlined"
          density="comfortable"
          class="mb-4"
          dir="rtl"
        />

        <v-text-field
          v-model="form.startDate"
          label="تاريخ وقت بداية المسابقة"
          type="datetime-local"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          dir="rtl"
          required
        />

        <v-text-field
          v-model="form.endDate"
          label="تاريخ وقت نهاية المسابقة"
          type="datetime-local"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          dir="rtl"
          required
        />

        <v-text-field
          v-model="form.registrationStartDate"
          label="تاريخ وقت بداية التسجيل"
          type="datetime-local"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          dir="rtl"
          required
        />

        <v-text-field
          v-model="form.registrationEndDate"
          label="تاريخ وقت نهاية التسجيل"
          type="datetime-local"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          dir="rtl"
          required
        />

        <v-text-field
          v-model.number="form.totalCompetitionMoney"
          label="قيمة الجائزة الإجمالية"
          type="number"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          dir="rtl"
          required
        />

        <v-select
          v-if="form.category === 'qraat' || form.category === 'both'"
          v-model="form.qraat_levels"
          :items="qraatList"
          item-title="title"
          item-value="_id"
          label="القراءات"
          multiple
          chips
          required
          variant="outlined"
          density="comfortable"
          class="mb-4"
          dir="rtl"
        />

        <div v-if="showLevels">
          <v-text-field
            v-model.number="form.numOfLevels"
            label="عدد المستويات"
            type="number"
            min="1"
            variant="outlined"
            density="comfortable"
            class="mb-4"
            dir="rtl"
            required
          />

          <v-card class="pa-4 mb-4" variant="outlined">
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="text-subtitle-1">قيم المستويات</div>
              <v-btn
                color="secondary"
                small
                @click="addLevel"
              >
                إضافة مستوى
              </v-btn>
            </div>

            <div v-for="(level, index) in form.levels" :key="level.levelNumber" class="mb-4">
              <div class="d-flex align-center gap-3 mb-2">
                <div class="text-body-1 font-weight-medium">المستوى {{ level.levelNumber }}</div>
                <v-btn
                  v-if="form.levels.length > 1"
                  color="error"
                  variant="tonal"
                  small
                  @click="removeLevel(index)"
                >
                  حذف
                </v-btn>
              </div>
              <v-text-field
                v-model.number="level.value"
                label="قيمة المستوى"
                type="number"
                min="0"
                variant="outlined"
                density="comfortable"
                dir="rtl"
                required
              />
            </div>
          </v-card>
        </div>

        <v-alert v-if="message" type="error" variant="tonal" class="mb-4" role="alert">
          {{ message }}
        </v-alert>

        <v-btn
          type="submit"
          color="primary"
          block
          height="48"
          :loading="isSubmitting"
        >
          حفظ المسابقة
        </v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { createCompetition, fetchQraat, type Qraat } from "../lib/api";

const router = useRouter();

const categories = [
  { title: "قرآن", value: "quran" },
  { title: "قراءات", value: "qraat" },
  { title: "كلاهما", value: "both" },
];

const isSubmitting = ref(false);
const message = ref("");
const qraatList = ref<Qraat[]>([]);

const form = reactive({
  title: "",
  category: "quran",
  sponsor: "",
  startDate: "",
  endDate: "",
  registrationStartDate: "",
  registrationEndDate: "",
  totalCompetitionMoney: 0,
  numOfLevels: 1,
  levels: [
    { levelNumber: 1, value: null },
  ],
  qraat_levels: [] as string[],
});

const showLevels = ref(true);

const ensureLevels = () => {
  const target = form.category === "qraat" ? 0 : Math.max(1, form.numOfLevels);
  form.numOfLevels = target;
  while (form.levels.length < target) {
    form.levels.push({ levelNumber: form.levels.length + 1, value: 0 });
  }
  while (form.levels.length > target) {
    form.levels.pop();
  }
  form.levels.forEach((level, index) => {
    level.levelNumber = index + 1;
  });
};

const onCategoryChange = () => {
  showLevels.value = form.category !== "qraat";
  if (!showLevels.value) {
    form.numOfLevels = 0;
    form.levels = [];
  } else {
    form.qraat_levels = [];
  }

  if (showLevels.value && !form.numOfLevels) {
    form.numOfLevels = 1;
    ensureLevels();
  } else {
    ensureLevels();
  }
};

watch(
  () => form.numOfLevels,
  () => {
    if (form.category !== "qraat") {
      ensureLevels();
    }
  }
);

const addLevel = () => {
  form.numOfLevels += 1;
  ensureLevels();
};

const removeLevel = (index: number) => {
  form.levels.splice(index, 1);
  form.numOfLevels = form.levels.length;
  ensureLevels();
};

const toIso = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date.toISOString();
};

const submitForm = async () => {
  message.value = "";
  isSubmitting.value = true;

  try {
    const payload: any = {
      title: form.title,
      category: form.category,
      sponsor: form.sponsor,
      startDate: toIso(form.startDate),
      endDate: toIso(form.endDate),
      registrationStartDate: toIso(form.registrationStartDate),
      registrationEndDate: toIso(form.registrationEndDate),
      totalCompetitionMoney: Number(form.totalCompetitionMoney),
    };

    if (form.category === "qraat") {
      payload.qraat_levels = form.qraat_levels;
    } else if(form.category === "both") {
      payload.qraat_levels = form.qraat_levels;
      payload.numOfLevels = Number(form.numOfLevels);
      payload.levels = form.levels.map((level) => ({
        levelNumber: level.levelNumber,
        value: Number(level.value),
      }));
    } else {
      payload.numOfLevels = Number(form.numOfLevels);
      payload.levels = form.levels.map((level) => ({
        levelNumber: level.levelNumber,
        value: Number(level.value),
      }));
    }

    const result = await createCompetition(payload);
    const createdId = result?.data?._id || result?._id;

    if (createdId) {
      router.push({ name: "Competition", params: { id: createdId } });
      return;
    }

    message.value = "تم إنشاء المسابقة بنجاح.";
  } catch (err: any) {
    message.value = err.response?.data?.message || err.message || "فشل في إنشاء المسابقة";
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  try {
    qraatList.value = await fetchQraat();
  } catch (err: any) {
    message.value = err.response?.data?.message || err.message || "فشل تحميل القراءات";
  }
});
</script>

<style scoped>
.create-competition-page {
  display: flex;
  justify-content: center;
}
</style>
