<template>
  <div class="participants-container">
    <div class="header">
      <h1>المشاركون</h1>
      <div class="controls">
        <input v-model="searchQuery" type="text" placeholder="ابحث عن مشارك..." class="search-input" />
        
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
          <option class='text-black' value="">جميع المستويات</option>
          <option class="text-black" v-for="level in 12" :key="level" :value="level">
            المستوى {{ level }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">جاري التحميل...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="table-wrapper">
      <p class="count">إجمالي المشاركين: {{ participants?.length }}</p>
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
            <td>{{ index + 1 }}</td>
            <td >
              <span v-if="item.accepted == true"> <span class="level-badge"> مقبول </span> </span>
              <span v-else> <span class="level-badge"> قيد المراجعة </span> </span>
            </td>
            <td class="student-name">{{ item.student.name }}</td>
            <td class="national-id">{{ item.student.national_ID }}</td>
            <td class="phone">{{ item.student.whatsapp_phone }}</td>
            <td class="phone">{{ item.student.cityId?.name }}</td>
            
            <!-- Birth Certificate Image -->
            <td class="image">
              <img 
                :src="item.student?.birth_certificate_img_github" 
                alt="لا يوجد صورة" 
                class="clickable"
                @click="openImage(item.student?.birth_certificate_img_github)"
              >
            </td>

            <td class="sheikh-name">{{ item.sheikh.name }}</td>
            <td class="sheikh-phone">
              {{ formatPhone(item.sheikh.whatsapp_phone ?? "") }}
            </td>
            <td class="level-number">
              <span class="level-badge">{{ item.levelNumber }}</span>
            </td>
            <td class="level-number">
              <span class="level-badge">{{ item.levelValue }}</span>
            </td>
            
            <!-- Actions column -->
            <td class="actions py-2">
              <v-select
                v-model="selectedAction[item?.student?._id]"
                :items="actionItems"
                item-title="title"
                item-value="value"
                label="اختر الاجراء"
                variant="outlined"
                density="comfortable"
                required
                dir="rtl"
                class="mb-1"
                hide-details
              ></v-select>
              <v-btn variant="text" :disabled="!selectedAction[item.student._id]" @click="handleAction(item)" class="edit-btn w-100">
                تنفيذ
              </v-btn>
            </td>
          </tr>
        </template>

        <!-- Empty state -->
        <template #no-data>
          <div class="text-center py-4">
            لا توجد بيانات
          </div>
        </template>
      </v-data-table>

      <!-- Image Dialog -->
      <v-dialog v-model="imageDialog" max-width="600">
        <v-card>
          <img 
            :src="selectedImage" 
            alt="لا يوجد صورة" 
          >
          <!-- <v-img :src="selectedImage" alt="لا يوجد صورة" contain >
            <template #error>
              <span> لا يوجد صورة </span>
            </template>
          </v-img> -->
          <v-card-actions>
            <v-spacer />
            <v-btn text color="primary" @click="imageDialog = false">
              إغلاق
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <v-card class="modal-card">
        <v-card-title class="bg-green text-white pa-6">
          <div class="d-flex justify-space-between align-center">
            <span>تعديل بيانات المشارك</span>
            <v-btn icon variant="text" @click="closeEditModal" class="text-white">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text class="pa-6" v-if="editingParticipant">
          <v-form @submit.prevent="saveChanges">
            <!-- Form fields remain the same -->
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
              :items="[...sheikhs.map(s => ({ title: s.name, value: s._id })), { title: 'شيخ اخر', value: 'other' }]"
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
                ></v-text-field>
              </div>
            </v-expand-transition>

            <v-text-field
              v-if="selectedSheikhId != 'other'"
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
              :items="levels.map((l) => ({
                title: l.value === 31 
                  ? 'المستوى 12 ( 30 جزء مكرر + التجويد)' 
                  : `المستوى ${l.levelNumber} ( ${l.value} اجزاء )`,
                value: l.levelNumber,
              }))"
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

    <div v-if="uploadImageModal" class="modal-overlay" @click.self="closeEditModal">
      <v-card class="modal-card">
        <v-card-title class="bg-green text-white pa-6">
          <div class="d-flex justify-space-between align-center">
            <span>رفع صورة شهادة الميلاد</span>
            <v-btn icon variant="text" @click="cancelUpload" class="text-white">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text class="pa-6">
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
        </v-card-text>

        <v-card-actions>
          <v-btn type="submit" variant="flat" color="green" @click="uploadImageFunction" :loading="uploading">
            حفظ
          </v-btn>
        </v-card-actions>
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
  uploadBirthCertificate,
  acceptStudentApi,
} from "../lib/api";

interface Student {
  _id: string;
  name: string;
  national_ID: string;
  whatsapp_phone: string;
  birth_certificate_img?: string;
  birth_certificate_img_github?: string;
  cityId: {
    _id: string;
    name: string;
  }
}

interface Participant {
  student: Student;
  sheikh: Sheikh;
  levelNumber: number;
  levelValue: number,
  accepted: boolean
}

const headers = computed(() => {
  return [
  { title: '#', key: 'index', sortable: false, width: "3%" , align: "center" as const  },
  { title: 'الحالة', key: 'accepted', sortable: false, width: "7%" , align: "center" as const  },
  { title: 'اسم الطالب', key: 'student.name', sortable: true, width: "15%" , align: "center" as const  },
  { title: 'الرقم القومي', key: 'student.national_ID', sortable: true, width: "10%" , align: "center" as const  },
  { title: 'رقم الهاتف', key: 'student.whatsapp_phone', sortable: true, width: "8%" , align: "center" as const  },
  { title: 'البلد', key: 'student.cityId.name', sortable: true, width: "5%" , align: "center" as const  },
  { title: 'شهادة الميلاد', key: 'student.birth_certificate_img_github', sortable: false, width: "10%" , align: "center" as const },
  { title: 'الشيخ/الشيخة', key: 'sheikh.name', sortable: true, width: "10%" , align: "center" as const  },
  { title: 'رقم الشيخ', key: 'sheikh.whatsapp_phone', sortable: true, width: "8%" , align: "center" as const  },
  { title: 'المستوى', key: 'levelNumber', sortable: true, width: "3%" , align: "center" as const  },
  { title: 'عدد الأجزاء', key: 'levelValue', sortable: true, width: "3%" , align: "center" as const  },
  { title: 'الإجراءات', key: 'actions', sortable: false, width: "13%" , align: "center" as const  }
]

})

const customSheikhName = ref('')
const customSheikhPhone = ref('')
const showCustomSheikh = computed(() => selectedSheikhId.value === 'other')
const birthCertificate = ref<File | null>(null)
const birthCertificatePreview = ref<string | null>(null)
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
const imageDialog = ref(false)
const selectedImage = ref('')
const selectedSheikhFilter = ref('') // New: Sheikh filter
const uploadImageModal = ref(false)
const uploadStudentImage = ref()
const uploading = ref(false)
const actionItems = computed(() => {
  return [
    {
      title: "رفص الصورة",
      value: "IMAGE_UPLOAD"
    },
    {
      title: "تعديل",
      value: "EDIT"
    },
    {
      title: "قبول",
      value: "ACCEPT"
    },
  ]
})
const selectedAction = ref<Record<string, string>>({})
const handleAction = (item: any) => {
  const action = selectedAction.value[item.student._id]

  if (!action) {
    alert("من فضلك اختر إجراء أولاً")
    return
  }

  switch (action) {
    case "IMAGE_UPLOAD":
      uploadImage(item)
      break

    case "EDIT":
      openEditModal(item)
      break

    case "ACCEPT":
      acceptStudent(item)
      break
  }
}
function cancelUpload() {
  uploadImageModal.value = false
  uploadStudentImage.value = null
  birthCertificate.value = null
  birthCertificatePreview.value = null
}
function uploadImage(item: Participant) {
  uploadImageModal.value = true
  uploadStudentImage.value = item.student._id
}

async function uploadImageFunction() {
  if(!birthCertificate.value) return
  try{ 
    uploading.value = true
    const res = await uploadBirthCertificate(uploadStudentImage.value, birthCertificate.value)
    
    participants.value.find(participant => participant.student._id == uploadStudentImage.value)!.student.birth_certificate_img_github = res?.data?.imageUrl
    uploading.value = false
    cancelUpload()
  } catch {

  }
}

async function acceptStudent(item: Participant) {

  try {
    await acceptStudentApi(item.student._id , competitionId.value)
  } catch (error) {
    
  }
}


const uniqueSheikhs = computed(() => {
  const sheikhsMap = new Map()
  participants.value.forEach(participant => {
    const sheikh = participant.sheikh
    if (sheikh && !sheikhsMap.has(sheikh._id)) {
      sheikhsMap.set(sheikh._id, sheikh)
    }
  })
  return Array.from(sheikhsMap.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
})


function openImage(src: any) {
  // if (!src) return;
  selectedImage.value = src;
  imageDialog.value = true;
}


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

// const filteredParticipants = computed(() => {
//   if (!Array.isArray(participants.value)) {
//     return [];
//   }
//   return participants.value.filter((participant) => {
//     const matchesSearch =
//       participant.student.name
//         .toLowerCase()
//         .includes(searchQuery.value.toLowerCase()) ||
//       participant.student.national_ID.includes(searchQuery.value) ||
//       participant.sheikh.name
//         .toLowerCase()
//         .includes(searchQuery.value.toLowerCase());

//     const matchesLevel =
//       selectedLevel.value === "" ||
//       participant.levelNumber === parseInt(selectedLevel.value);

//     return matchesSearch && matchesLevel;
//   });
// });


function normalizeArabic(text: string) {
  return text
    .replace(/[\u064B-\u065F]/g, '') // remove diacritics
    .replace(/[أإآ]/g, 'ا')           // unify hamza
    .replace(/ى/g, 'ي')               // replace final alef maqsura
    .replace(/ة/g, 'ه')               // optional: taa marbuta → ha
    .trim();
}


// Filter participants based on all criteria
const filteredParticipants = computed(() => {
  let filtered = participants.value

  // Apply sheikh filter
  if (selectedSheikhFilter.value) {
    filtered = filtered.filter(participant => 
      participant.sheikh?._id === selectedSheikhFilter.value
    )
  }

  // Apply level filter
  if (selectedLevel.value) {
    filtered = filtered.filter(participant => 
      participant.levelNumber == Number(selectedLevel.value)
    )
  }

  // Apply search query filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(participant => {
      const studentName = participant.student?.name?.toLowerCase() || ''
      const nationalId = participant.student?.national_ID?.toLowerCase() || ''
      const phone = participant.student?.whatsapp_phone?.toLowerCase() || ''
      const sheikhName = participant.sheikh?.name?.toLowerCase() || ''
      
      return normalizeArabic(studentName).includes(normalizeArabic(query)) ||
             nationalId.includes(query) ||
             phone.includes(query) ||
             sheikhName.includes(query)
    })
  }

  return filtered
})

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
        _id: selectedSheikhId.value == 'other' ? null : p.sheikh._id,
        name: selectedSheikhId.value == 'other'? customSheikhName.value : p.sheikh.name,
        whatsapp_phone: selectedSheikhId.value == 'other'? customSheikhPhone.value : p.sheikh.whatsapp_phone || "",
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
  border-color: #4CAF50;
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
.image img{
  width: 50px !important;
}

.sheikh-phone {
  font-family: monospace;
  font-size: 13px;
  color: #111;
  font-weight: bold;
}

:deep(.level-badge) {
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
