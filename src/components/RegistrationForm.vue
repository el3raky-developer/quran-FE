<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import {
  fetchSheikhs,
  fetchCities,
  fetchCompetitionById,
  fetchQraat,
  registerStudent,
  uploadBirthCertificate,
  type CompetitionLevel,
  type Sheikh,
  type City,
  type CompetitionData,
  type Qraat,
  checkStudentByNationalId,
  inquiryStudentResult,
} from "../lib/api";
import LoadingScreen from "./LoadingScreen.vue";

const nationalId = ref<string | null>("");
const inquiryNationalId = ref<string | null>("");
const studentName = ref<string | null>("");
const studentPhone = ref("");
const birthCertificate = ref<File | null>(null);
const birthCertificatePreview = ref<string | null>(null);
const selectedLevel = ref("");
const selectedCity = ref("");
const selectedSheikh = ref("");
const customSheikhName = ref("");
const customSheikhPhone = ref("");
const selectedCompetition = ref("");
const loading = ref(false);
const success = ref(false);
const checkingStudentResult = ref(false);
const error = ref("");
const inquiryResponse = ref<{
  success: boolean;
  studentName?: string;
  message: string;
} | null>(null);

const levels = ref<CompetitionLevel[]>([]);
const sheikhs = ref<Sheikh[]>([]);
const cities = ref<City[]>([]);
type QraatLevel = { _id: string; title: string };
const allQraat = ref<Qraat[]>([]);
const competition = ref<
  | (CompetitionData & {
      qraat_levels?: Array<QraatLevel | string>;
      qraatLevels?: Array<QraatLevel | string>;
    })
  | null
>(null);
const competitionLoading = ref(true);
const responseMessage = ref("");
const studentStatus = ref("");
const checkingStudentStatus = ref(false);

const competitionCategory = computed(
  () => competition.value?.category?.toString().toLowerCase() ?? ""
);
const selectedCompetitionType = ref<"quran" | "qraat">("quran");
const effectiveCompetitionCategory = computed(() =>
  competitionCategory.value === "both"
    ? selectedCompetitionType.value
    : competitionCategory.value
);
const showBothCategoryToggle = computed(
  () => competitionCategory.value === "both"
);
const showCustomSheikh = computed(() => selectedSheikh.value === "other");
const showQuranLevelSelect = computed(
  () => effectiveCompetitionCategory.value !== "qraat"
);
const showQraatLevelSelect = computed(
  () => effectiveCompetitionCategory.value === "qraat"
);
const qraatLevelItems = computed(() => {
  const raw =
    competition.value?.qraat_levels ?? competition.value?.qraatLevels ?? [];

  if (!raw.length) {
    return allQraat.value.map((qraat) => ({
      title: qraat.title,
      value: qraat._id,
    }));
  }

  if (typeof raw[0] === "object" && raw[0] !== null && "title" in raw[0]) {
    return (raw as QraatLevel[]).map((level) => ({
      title: level.title,
      value: level._id,
    }));
  }

  const ids = raw as string[];
  const matched = allQraat.value
    .filter((qraat) => ids.includes(qraat._id))
    .map((qraat) => ({
      title: qraat.title,
      value: qraat._id,
    }));

  return matched.length ? matched : allQraat.value.map((qraat) => ({
    title: qraat.title,
    value: qraat._id,
  }));
});

const levelItems = computed(() =>
  levels.value.map((level) => ({
    title:
      level.value === 31
        ? "المستوى 12 (  30 جزء مكرر  + التجويد)"
        : `المستوى ${level.levelNumber} ( ${level.value} اجزاء )`,
    value: level.levelNumber,
  }))
);

const cityItems = computed(() =>
  cities.value.map((city) => ({
    title: city.name,
    value: city._id,
  }))
);

const sheikhItems = computed(() => [
  ...sheikhs.value.map((sheikh) => ({
    title: sheikh.name,
    value: sheikh._id,
  })),
  { title: "شيخ اخر", value: "other" },
]);

const selectMenuProps = {
  zIndex: 10001,
  contentClass: "registration-select-menu",
};

watch(effectiveCompetitionCategory, () => {
  selectedLevel.value = "";
});

// Check if registration has ended
const isRegistrationClosed = computed(() => {
  if (!competition.value?.registrationEndDate) return false;
  const endDate = new Date(competition.value.registrationEndDate);
  const now = new Date();
  // Compare dates (ignore time, or include time if needed)
  // If registrationEndDate is a date string, compare dates only
  return now > endDate;
});

// Validation functions
const isValidEgyptianNationalId = (id: string): boolean => {
  // Must be exactly 14 digits
  if (!/^\d{14}$/.test(id)) return false;

  // Century check
  const centuryDigit = id[0];
  if (centuryDigit !== "2" && centuryDigit !== "3") return false;

  // Extract birth date parts
  const year = parseInt(id.substring(1, 3));
  const month = parseInt(id.substring(3, 5));
  const day = parseInt(id.substring(5, 7));

  const fullYear = centuryDigit === "2" ? 1900 + year : 2000 + year;

  // Validate date
  const birthDate = new Date(fullYear, month - 1, day);
  if (
    birthDate.getFullYear() !== fullYear ||
    birthDate.getMonth() + 1 !== month ||
    birthDate.getDate() !== day
  ) {
    return false;
  }

  // Governorate code (01–35)
  const governorateCode = parseInt(id.substring(7, 9));
  if (governorateCode < 1 || governorateCode > 35) return false;

  return true;
};

const isValidName = (name: string): boolean => {
  // Name should consist of at least 4 words
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  return words.length >= 4;
};
// const requiredField = (v: any) => !!v?.trim() || 'هذا الحقل مطلوب'

const handleFileChange = (files: File | File[] | null) => {
  if (!files) {
    birthCertificatePreview.value = null;
    return;
  }

  const file = Array.isArray(files) ? files[0] : files;
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      birthCertificatePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const loadData = async () => {
  try {
    competitionLoading.value = true;
    // Get competition ID from query string
    const params = new URLSearchParams(window.location.search);
    const competitionId = params.get("competition_id");

    if (!competitionId) {
      error.value = "معرف المسابقة مفقود. يرجى الوصول عبر رابط صحيح.";
      return;
    }

    // Fetch competition data
    competition.value = await fetchCompetitionById(competitionId);
    selectedCompetition.value = competitionId;

    // Set levels from competition data
    levels.value = competition.value?.levels ?? [];
    selectedCompetitionType.value =
      competition.value?.category === "qraat" ? "qraat" : "quran";

    const [sheikhsData, citiesData, qraatData] = await Promise.all([
      fetchSheikhs(),
      fetchCities(),
      fetchQraat(),
    ]);

    sheikhs.value = sheikhsData;
    cities.value = citiesData;
    allQraat.value = qraatData;
  } catch (err) {
    error.value = "عطل فنى";
    console.error("Failed to load data:", err);
  } finally {
    competitionLoading.value = false;
  }
};

const submitForm = async () => {
  try {
    loading.value = true;
    error.value = "";
    success.value = false;

    // Check if registration has ended
    if (isRegistrationClosed.value) {
      error.value = "انتهت فترة التسجيل في هذه المسابقة";
      return;
    }

    // Validation
    if (!nationalId.value?.trim()) {
      error.value = "يرجى إدخال الرقم القومي";
      return;
    }

    if (!isValidEgyptianNationalId(nationalId.value.trim())) {
      error.value = "الرقم القومي غير صحيح. يجب أن يكون 14 رقم صحيح";
      return;
    }

    if (!studentName.value?.trim()) {
      error.value = "يرجى إدخال اسم المتسابق";
      return;
    }

    if (!studentPhone.value?.trim()) {
      error.value = "يرجى إدخال رقم تليفون المتسابق";
      return;
    }

    if (!isValidName(studentName?.value)) {
      error.value = "اسم المتسابق يجب أن يتكون من 4 كلمات على الأقل";
      return;
    }

    if (!birthCertificate.value) {
      error.value = "يرجى رفع شهادة الميلاد";
      return;
    }

    if (!selectedCity.value) {
      error.value = "يرجى اختيار البلد";
      return;
    }

    if (!selectedLevel.value) {
      error.value = "يرجى اختيار المستوى";
      return;
    }

    if (!selectedSheikh.value) {
      error.value = "يرجى اختيار الشيخ";
      return;
    }

    if (selectedSheikh.value === "other") {
      if (!customSheikhName.value.trim()) {
        error.value = "يرجى إدخال اسم الشيخ";
        return;
      }
      if (!customSheikhPhone.value.trim()) {
        error.value = "يرجى إدخال رقم الواتس اب للشيخ";
        return;
      }
    }

    const params = new URLSearchParams(window.location.search);
    const competitionId = params.get("competition_id");

    // Step 1: Register student with filename (not actual upload yet)
    const birthCertificateFilename = birthCertificate.value.name;
    const registrationData = {
      name: studentName.value,
      national_ID: nationalId.value,
      whatsapp_phone: studentPhone.value,
      birth_certificate_img: birthCertificateFilename,
      competition_id: competitionId,
      sheikh_id: selectedSheikh.value === "other" ? null : selectedSheikh.value,
      city_id: selectedCity.value || null,
      custom_sheikh_name:
        selectedSheikh.value === "other" ? customSheikhName.value : null,
      custom_sheikh_phone:
        selectedSheikh.value === "other" ? customSheikhPhone.value : null,
      level:
        effectiveCompetitionCategory.value === "qraat"
          ? selectedLevel.value
          : parseInt(selectedLevel.value as string),
    };

    const studentResponse = await registerStudent(registrationData);

    // Step 2: Upload the certificate file
    await uploadBirthCertificate(studentResponse._id, birthCertificate.value);

    // Reset validation state for all inputs
    formRef.value?.resetValidation();

    // Success - reset form
    nationalId.value = null;
    studentName.value = null;
    studentPhone.value = "";
    birthCertificate.value = null;
    birthCertificatePreview.value = null;
    selectedLevel.value = "";
    selectedCity.value = "";
    selectedSheikh.value = "";
    selectedCompetition.value = "";
    customSheikhName.value = "";
    customSheikhPhone.value = "";

    // Show success message after clearing form
    success.value = true;
  } catch (err: any) {
    console.log(err?.response?.data?.message);
    // Check if error response contains a message from backend
    if (err?.response?.data?.message) {
      error.value = err.response.data.message;
    } else if (err?.message) {
      error.value = err.message;
    } else {
      error.value = "حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.";
    }
    console.error("Form submission error:", err);
  } finally {
    loading.value = false;
    sheikhs.value = await fetchSheikhs();
  }
};

const validators = computed(() => {
  return {
    validName: (v: any) => isValidName(v) || "الاسم يجب ان يكون رباعى",
    isValidNID: (v: any) =>
      isValidEgyptianNationalId(v) || "ادخل رقم قومى صحيح",
    required: (v: any) =>
      (typeof v === "string" ? !!v?.trim() : !!v) || "هذا الحقل مطلوب",
  };
});

const searchByNationalId = async () => {
  if (!nationalId.value) return;

  try {
    checkingStudentStatus.value = true;
    console.log("Searching for:", nationalId.value);

    // Call your API here
    const res = await checkStudentByNationalId(
      nationalId.value,
      competition.value?._id!
    );

    responseMessage.value = res.message;
    studentStatus.value = res.status;
  } catch (error: any) {
    console.error(error);
    responseMessage.value =
      error?.response?.data?.message || "حدث خطأ أثناء الاستعلام";
    studentStatus.value = "";
  } finally {
    checkingStudentStatus.value = false;
  }
};

const inquiryResult = async () => {
  if (!inquiryNationalId.value) return;

  inquiryResponse.value = null;

  try {
    checkingStudentResult.value = true;
    const res = await inquiryStudentResult(
      inquiryNationalId.value,
      competition.value?._id!
    );
    inquiryResponse.value = {
      success: res.success,
      studentName: res.studentName,
      message: res.message,
    };
  } catch (error: any) {
    inquiryResponse.value = {
      success: false,
      message: error?.response?.data?.message || "حدث خطأ أثناء الاستعلام",
    };
  } finally {
    checkingStudentResult.value = false;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "accepted":
      return "success"; // green
    case "under_review":
      return "info"; // blue
    case "rejected":
      return "error"; // red
    case "hanged":
      return "warning"; // orange
    case "baned":
      return "error"; // red
    default:
      return "info";
  }
};

onMounted(async () => {
  await loadData();
});

const formRef = ref();
const mode = ref<"register" | "inquiry">("register");
</script>

<template>
  <v-app>
    <LoadingScreen v-if="competitionLoading" />

    <v-container v-else fluid class="pa-0 registration-page">
      <v-main>
        <v-container class="py-8">
          <v-row justify="center">
            <v-col cols="12" md="8" lg="6">
              <v-card elevation="8" class="rounded-lg">
                <v-card-text class="pa-8">
                  <div class="text-center mb-8">
                    <v-icon size="80" color="primary" class="mb-4"
                      >mdi-book-open-page-variant</v-icon
                    >
                    <h1 class="text-h4 font-weight-bold text-primary mb-6">
                      {{ competition?.title }}
                    </h1>

                    <!-- Mode Toggle Buttons -->
                    <div class="btn-group-responsive mb-2">
                      <v-btn
                        :color="mode === 'register' ? 'primary' : 'default'"
                        :variant="mode === 'register' ? 'elevated' : 'text'"
                        size="large"
                        @click="mode = 'register'"
                        prepend-icon="mdi-account-plus"
                        class="group-btn"
                        rounded="lg"
                      >
                        تسجيل
                      </v-btn>
                      <v-btn
                        :color="mode === 'inquiry' ? 'primary' : 'default'"
                        :variant="mode === 'inquiry' ? 'elevated' : 'text'"
                        size="large"
                        @click="mode = 'inquiry'"
                        prepend-icon="mdi-magnify"
                        class="group-btn"
                        rounded="lg"
                      >
                        استعلام عن النتيجة
                      </v-btn>
                    </div>
                  </div>

                  <v-divider class="mb-6"></v-divider>

                  <!-- ───────────── INQUIRY MODE ───────────── -->
                  <!-- <div v-if="mode === 'inquiry'">
                    <v-text-field
                      v-model="inquiryNationalId"
                      label="الرقم القومي"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-card-account-details"
                      required
                      dir="rtl"
                      class="mb-4"
                      validate-on="input"
                      :rules="[validators.isValidNID]"
                    ></v-text-field>

                    <v-btn
                      color="primary"
                      block
                      height="48"
                      :disabled="!nationalId"
                      @click="inquiryResult()"
                      :loading="checkingStudentStatus"
                    >
                      استعلام
                    </v-btn>

                    <v-alert
                      v-if="responseMessage"
                      :type="getStatusColor(studentStatus)"
                      variant="tonal"
                      class="mt-4"
                    >
                      {{ responseMessage }}
                    </v-alert>
                  </div> -->

                  <!-- Inquiry Mode -->
                  <div v-if="mode === 'inquiry'">
                    <v-text-field
                      v-model="inquiryNationalId"
                      label="الرقم القومي"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-card-account-details"
                      required
                      dir="rtl"
                      class="mb-4"
                      validate-on="input"
                      :rules="[validators.isValidNID]"
                    ></v-text-field>

                    <v-btn
                      color="primary"
                      block
                      height="48"
                      :disabled="!inquiryNationalId"
                      @click="inquiryResult()"
                      :loading="checkingStudentResult"
                    >
                      استعلام
                    </v-btn>

                    <!-- Result Card -->
                    <v-card
                      v-if="inquiryResponse"
                      class="mt-6 pa-4 rounded-lg"
                      :color="inquiryResponse.success ? 'success' : 'error'"
                      variant="tonal"
                      dir="rtl"
                    >
                      <div class="d-flex align-center gap-3 mb-3">
                        <v-icon size="32">
                          {{
                            inquiryResponse.success
                              ? "mdi-check-circle"
                              : "mdi-close-circle"
                          }}
                        </v-icon>
                        <span
                          v-if="inquiryResponse.studentName"
                          class="text-h6 font-weight-bold"
                        >
                          {{ inquiryResponse.studentName }}
                        </span>
                      </div>
                      <v-divider class="mb-3" />
                      <p class="text-body-1 font-weight-medium">
                        {{ inquiryResponse.message }}
                      </p>
                    </v-card>
                  </div>

                  <!-- ───────────── REGISTER MODE ───────────── -->
                  <div v-if="mode === 'register'">
                    <v-alert
                      v-if="isRegistrationClosed"
                      type="error"
                      variant="tonal"
                      class="mb-6"
                      dir="rtl"
                      prominent
                    >
                      <v-alert-title>التسجيل مغلق</v-alert-title>
                      انتهت فترة التسجيل في هذه المسابقة. لم يعد بإمكانك تقديم
                      طلبات جديدة.
                    </v-alert>

                    <v-form ref="formRef" @submit.prevent="submitForm">
                      <v-text-field
                        v-model="nationalId"
                        label="الرقم القومي للطالب (14 رقم)"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-card-account-details"
                        required
                        dir="rtl"
                        class="mb-4"
                        validate-on="input"
                        :rules="[validators.isValidNID]"
                        :disabled="isRegistrationClosed"
                      ></v-text-field>

                      <v-btn
                        color="primary"
                        block
                        height="48"
                        :disabled="!nationalId || isRegistrationClosed"
                        @click="searchByNationalId"
                        class="mb-4"
                        :loading="checkingStudentStatus"
                      >
                        استعلام
                      </v-btn>

                      <v-alert
                        v-if="responseMessage"
                        :type="getStatusColor(studentStatus)"
                        variant="tonal"
                        class="mt-3 mb-4"
                      >
                        {{ responseMessage }}
                      </v-alert>

                      <v-text-field
                        v-model="studentName"
                        label="اسم المتسابق"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-account"
                        required
                        dir="rtl"
                        class="mb-4"
                        validate-on="input"
                        :rules="[validators.validName]"
                        :disabled="isRegistrationClosed"
                      ></v-text-field>

                      <v-text-field
                        v-model="studentPhone"
                        label="رقم الواتس اب (ولى الامر)"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-whatsapp"
                        dir="rtl"
                        class="mb-4"
                        :rules="[validators.required]"
                        :disabled="isRegistrationClosed"
                      ></v-text-field>

                      <v-file-input
                        v-model="birthCertificate"
                        label="شهادة الميلاد كمبيوتر (صورة واضحة)"
                        variant="outlined"
                        density="comfortable"
                        prepend-icon=""
                        prepend-inner-icon="mdi-file-image"
                        accept="image/*,application/pdf"
                        required
                        dir="rtl"
                        class="mb-4"
                        @update:model-value="handleFileChange"
                        hint="يرجى رفع صورة شهادة الميلاد"
                        persistent-hint
                        :rules="[validators.required]"
                        :disabled="isRegistrationClosed"
                      ></v-file-input>

                      <v-card
                        v-if="birthCertificatePreview"
                        class="mb-4 pa-4"
                        variant="outlined"
                      >
                        <div class="text-center">
                          <p class="text-subtitle-2 mb-3">
                            معاينة شهادة الميلاد:
                          </p>
                          <v-img
                            :src="birthCertificatePreview"
                            max-height="300"
                            contain
                            class="rounded"
                          ></v-img>
                        </div>
                      </v-card>

                      <v-radio-group
                        v-if="showBothCategoryToggle"
                        v-model="selectedCompetitionType"
                        row
                        class="mb-4"
                        dir="rtl"
                      >
                        <v-radio label="قرآن" value="quran" />
                        <v-radio label="قراءات" value="qraat" />
                      </v-radio-group>

                      <v-select
                        v-if="showQuranLevelSelect"
                        v-model="selectedLevel"
                        :items="levelItems"
                        :menu-props="selectMenuProps"
                        item-title="title"
                        item-value="value"
                        label="اختر المستوى"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-medal"
                        required
                        dir="rtl"
                        class="mb-4 registration-select"
                        :rules="[validators.required]"
                        :disabled="isRegistrationClosed"
                      ></v-select>

                      <v-select
                        v-else-if="showQraatLevelSelect"
                        v-model="selectedLevel"
                        :items="qraatLevelItems"
                        :menu-props="selectMenuProps"
                        item-title="title"
                        item-value="value"
                        label="اختر القراءة"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-book-education"
                        required
                        dir="rtl"
                        class="mb-4 registration-select"
                        :rules="[validators.required]"
                        :disabled="isRegistrationClosed"
                      ></v-select>

                      <v-select
                        v-model="selectedCity"
                        :items="cityItems"
                        :menu-props="selectMenuProps"
                        item-title="title"
                        item-value="value"
                        label="اختر البلد"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-map-marker"
                        required
                        dir="rtl"
                        class="mb-4 registration-select"
                        :rules="[validators.required]"
                        :disabled="isRegistrationClosed"
                      ></v-select>

                      <v-select
                        v-model="selectedSheikh"
                        :items="sheikhItems"
                        :menu-props="selectMenuProps"
                        item-title="title"
                        item-value="value"
                        label="اختر اسم الشيخ"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-account-tie"
                        required
                        dir="rtl"
                        class="mb-4 registration-select"
                        :rules="[validators.required]"
                        :disabled="isRegistrationClosed"
                      ></v-select>

                      <v-expand-transition>
                        <div v-if="showCustomSheikh">
                          <v-text-field
                            v-model="customSheikhName"
                            label="اسم الشيخ"
                            variant="outlined"
                            density="comfortable"
                            prepend-inner-icon="mdi-account"
                            required
                            dir="rtl"
                            class="mb-4"
                            :rules="[validators.required]"
                            :disabled="isRegistrationClosed"
                          ></v-text-field>

                          <v-text-field
                            v-model="customSheikhPhone"
                            label="رقم الواتس اب"
                            variant="outlined"
                            density="comfortable"
                            prepend-inner-icon="mdi-whatsapp"
                            required
                            dir="rtl"
                            class="mb-4"
                            :rules="[validators.required]"
                            :disabled="isRegistrationClosed"
                          ></v-text-field>
                        </div>
                      </v-expand-transition>

                      <v-alert
                        v-if="success"
                        type="success"
                        variant="tonal"
                        class="mb-4"
                        dir="rtl"
                      >
                        تم تسجيل بيانات المتسابق بنجاح. برجاء انتظار مراجعة
                        البيانات
                      </v-alert>

                      <v-alert
                        v-if="error"
                        type="error"
                        variant="tonal"
                        class="mb-4"
                        dir="rtl"
                      >
                        {{ error }}
                      </v-alert>

                      <v-btn
                        type="submit"
                        color="primary"
                        size="large"
                        block
                        :loading="loading"
                        :disabled="isRegistrationClosed"
                        class="text-h6"
                      >
                        تسجيل
                      </v-btn>
                    </v-form>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </v-container>
  </v-app>
</template>

<style scoped>
.registration-page {
  min-height: 100vh;
  background: radial-gradient(circle at center, #1a1208, #000);
  position: relative;
  overflow: visible;
}

/* floating particles */
.registration-page::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  background: url("https://www.transparenttextures.com/patterns/stardust.png");
  opacity: 0.25;
  animation: starsMove 40s linear infinite;
}

@keyframes starsMove {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-1000px);
  }
}

.btn-group-responsive {
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: 100%;
}

.group-btn {
  flex: 1;
  white-space: normal !important;
  word-break: break-word;
  height: auto !important;
  min-height: 48px;
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  border: 1px solid;
}

@media (max-width: 480px) {
  .btn-group-responsive {
    flex-direction: column;
  }

  .group-btn {
    width: 100% !important;
  }
}

.registration-select :deep(.v-field__input),
.registration-select :deep(.v-select__selection-text) {
  color: rgba(0, 0, 0, 0.87);
}
</style>