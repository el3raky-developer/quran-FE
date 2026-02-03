<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { fetchSheikhs, fetchCities, fetchCompetitionById, registerStudent, uploadBirthCertificate, type CompetitionLevel, type Sheikh, type City, type CompetitionData } from '../lib/api'

const nationalId = ref<string | null>('')
const studentName = ref<string | null>('')
const studentPhone = ref('')
const birthCertificate = ref<File | null>(null)
const birthCertificatePreview = ref<string | null>(null)
const selectedLevel = ref('')
const selectedCity = ref('')
const selectedSheikh = ref('')
const customSheikhName = ref('')
const customSheikhPhone = ref('')
const selectedCompetition = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')

const levels = ref<CompetitionLevel[]>([])
const sheikhs = ref<Sheikh[]>([])
const cities = ref<City[]>([])
const competition = ref<CompetitionData | null>(null)
const competitionLoading = ref(true)

const showCustomSheikh = computed(() => selectedSheikh.value === 'other')

// Validation functions
const isValidEgyptianNationalId = (id: string): boolean => {
  // Must be exactly 14 digits
  if (!/^\d{14}$/.test(id)) return false

  // Century check
  const centuryDigit = id[0]
  if (centuryDigit !== '2' && centuryDigit !== '3') return false

  // Extract birth date parts
  const year = parseInt(id.substring(1, 3))
  const month = parseInt(id.substring(3, 5))
  const day = parseInt(id.substring(5, 7))

  const fullYear = centuryDigit === '2' ? 1900 + year : 2000 + year

  // Validate date
  const birthDate = new Date(fullYear, month - 1, day)
  if (
    birthDate.getFullYear() !== fullYear ||
    birthDate.getMonth() + 1 !== month ||
    birthDate.getDate() !== day
  ) {
    return false
  }

  // Governorate code (01–35)
  const governorateCode = parseInt(id.substring(7, 9))
  if (governorateCode < 1 || governorateCode > 35) return false

  return true
}


const isValidName = (name: string): boolean => {
  // Name should consist of at least 4 words
  const words = name.trim().split(/\s+/).filter(word => word.length > 0)
  return words.length >= 4
}
// const requiredField = (v: any) => !!v?.trim() || 'هذا الحقل مطلوب'

const handleFileChange = (files: File | File[] | null) => {
  if (!files) {
    birthCertificatePreview.value = null
    return
  }
  
  const file = Array.isArray(files) ? files[0] : files
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      birthCertificatePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const loadData = async () => {
  try {
    competitionLoading.value = true
    // Get competition ID from query string
    const params = new URLSearchParams(window.location.search)
    const competitionId = params.get('competition_id')

    if (!competitionId) {
      error.value = 'معرف المسابقة مفقود. يرجى الوصول عبر رابط صحيح.'
      return
    }

    // Fetch competition data
    competition.value = await fetchCompetitionById(competitionId)
    selectedCompetition.value = competitionId
    
    // Set levels from competition data
    levels.value = competition.value.levels

    // Fetch sheikhs and cities
    sheikhs.value = await fetchSheikhs()
    cities.value = await fetchCities()
  } catch (err) {
    error.value = "عطل فنى"
    console.error('Failed to load data:', err)
  } finally {
    competitionLoading.value = false
  }
}

const submitForm = async () => {
  try {
    loading.value = true
    error.value = ''
    success.value = false

    // Validation
    if (!nationalId.value?.trim()) {
      error.value = 'يرجى إدخال الرقم القومي'
      return
    }

    if (!isValidEgyptianNationalId(nationalId.value.trim())) {
      error.value = 'الرقم القومي غير صحيح. يجب أن يكون 14 رقم صحيح'
      return
    }

    if (!studentName.value?.trim()) {
      error.value = 'يرجى إدخال اسم المتسابق'
      return
    }

    if (!studentPhone.value?.trim()) {
      error.value = 'يرجى إدخال رقم تليفون المتسابق'
      return
    }

    if (!isValidName(studentName?.value)) {
      error.value = 'اسم المتسابق يجب أن يتكون من 4 كلمات على الأقل'
      return
    }

    if (!birthCertificate.value) {
      error.value = 'يرجى رفع شهادة الميلاد'
      return
    }

    if (!selectedCity.value) {
      error.value = 'يرجى اختيار البلد'
      return
    }

    if (!selectedLevel.value) {
      error.value = 'يرجى اختيار المستوى'
      return
    }

    if (!selectedSheikh.value) {
      error.value = 'يرجى اختيار الشيخ'
      return
    }

    if (selectedSheikh.value === 'other') {
      if (!customSheikhName.value.trim()) {
        error.value = 'يرجى إدخال اسم الشيخ'
        return
      }
      if (!customSheikhPhone.value.trim()) {
        error.value = 'يرجى إدخال رقم الواتس اب للشيخ'
        return
      }
    }

    const params = new URLSearchParams(window.location.search)
    const competitionId = params.get('competition_id')

    // Step 1: Register student with filename (not actual upload yet)
    const birthCertificateFilename = birthCertificate.value.name
    const registrationData = {
      name: studentName.value,
      national_ID: nationalId.value,
      whatsapp_phone: studentPhone.value,
      birth_certificate_img: birthCertificateFilename,
      competition_id: competitionId,
      sheikh_id: selectedSheikh.value === 'other' ? null : selectedSheikh.value,
      city_id: selectedCity.value || null,
      custom_sheikh_name: selectedSheikh.value === 'other' ? customSheikhName.value : null,
      custom_sheikh_phone: selectedSheikh.value === 'other' ? customSheikhPhone.value : null,
      level: parseInt(selectedLevel.value),
    }

    const studentResponse = await registerStudent(registrationData)

    // Step 2: Upload the certificate file
    await uploadBirthCertificate(studentResponse._id, birthCertificate.value)
    
    // Reset validation state for all inputs
    formRef.value?.resetValidation()

    // Success - reset form
    nationalId.value = null
    studentName.value = null
    studentPhone.value = ''
    birthCertificate.value = null
    birthCertificatePreview.value = null
    selectedLevel.value = ''
    selectedCity.value = ''
    selectedSheikh.value = ''
    selectedCompetition.value = ''
    customSheikhName.value = ''
    customSheikhPhone.value = ''
    

    // Show success message after clearing form
    success.value = true
  } catch (err: any) {

    console.log(err?.response?.data?.message)
    // Check if error response contains a message from backend
    if (err?.response?.data?.message) {
      error.value = err.response.data.message
    } else if (err?.message) {
      error.value = err.message
    } else {
      error.value = 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.'
    }
    console.error('Form submission error:', err)
  } finally {
    loading.value = false
    sheikhs.value = await fetchSheikhs()
  }
}

const validators = computed(() => {
  return {
    validName: (v: any) => isValidName(v) || 'الاسم يجب ان يكون رباعى',
    isValidNID: (v: any) => isValidEgyptianNationalId(v) || "ادخل رقم قومى صحيح",
    required: (v: any) => (typeof v === 'string' ? !!v?.trim() : !!v) || 'هذا الحقل مطلوب'
  }
})

onMounted(() => {
  loadData()
})

const formRef = ref()
</script>

<template>
  <v-app>
    <v-container fluid class="pa-0">
      <v-main>
        <v-container class="py-8">
          <v-row justify="center">
            <v-col cols="12" md="8" lg="6">
              <v-card elevation="8" class="rounded-lg">
                <v-card-text class="pa-8">
                  <div class="text-center mb-8">
                    <v-icon size="80" color="primary" class="mb-4">mdi-book-open-page-variant</v-icon>
                    <h1 class="text-h4 font-weight-bold text-primary mb-2">
                      {{ competition?.title }}
                    </h1>
                    <p class="text-subtitle-1 text-grey-darken-1 mt-5">
                      نموذج التسجيل
                    </p>
                  </div>

                  <v-divider class="mb-6"></v-divider>

                  <v-form ref="formRef" @submit.prevent="submitForm">
                    <v-text-field
                      v-model="nationalId"
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
                    ></v-text-field>

                    <v-text-field
                      v-model="studentPhone"
                      label="رقم الواتس اب"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-whatsapp"
                      dir="rtl"
                      class="mb-4"
                      :rules="[validators.required]"
                    ></v-text-field>

                    <v-file-input
                      v-model="birthCertificate"
                      label="شهادة الميلاد"
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
                    ></v-file-input>

                    <v-card 
                      v-if="birthCertificatePreview" 
                      class="mb-4 pa-4"
                      variant="outlined"
                    >
                      <div class="text-center">
                        <p class="text-subtitle-2 mb-3">معاينة شهادة الميلاد:</p>
                        <v-img
                          :src="birthCertificatePreview"
                          max-height="300"
                          contain
                          class="rounded"
                        ></v-img>
                      </div>
                    </v-card>

                    <v-select
                      v-model="selectedLevel"
                      :items="levels.map(l => ({ title: l.value === 31 ? 'المستوى 12 (  30 جزء مكرر  + التجويد)' : `المستوى ${l.levelNumber} ( ${l.value} اجزاء )`, value: l.levelNumber }))"
                      item-title="title"
                      item-value="value"
                      label="اختر المستوى"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-medal"
                      required
                      dir="rtl"
                      class="mb-4"
                      :rules="[validators.required]"
                    ></v-select>

                    <v-select
                      v-model="selectedCity"
                      :items="cities.map(c => ({ title: c.name, value: c._id }))"
                      item-title="title"
                      item-value="value"
                      label="اختر البلد"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-map-marker"
                      required
                      dir="rtl"
                      class="mb-4"
                      :rules="[validators.required]"
                    ></v-select>

                    <v-select
                      v-model="selectedSheikh"
                      :items="[...sheikhs.map(s => ({ title: s.name, value: s._id })), { title: 'شيخ اخر', value: 'other' }]"
                      label="اختر اسم الشيخ"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-account-tie"
                      required
                      dir="rtl"
                      class="mb-4"
                      :rules="[validators.required]"
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
                      تم تسجيل بيانات المتسابق بنجاح. برجاء انتظار مراجعة البيانات
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
                      class="text-h6"
                    >
                      تسجيل
                    </v-btn>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </v-container>
  </v-app>
</template>
