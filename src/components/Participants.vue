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
            <!-- <th> شهادة الميلاد</th> -->
            <th>الشيخ/الشيخة</th>
            <th>رقم الشيخ</th>
            <th>المستوى</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(participant, index) in filteredParticipants" :key="participant.student._id">
            <td>{{ index + 1 }}</td>
            <td class="student-name">{{ participant.student.name }}</td>
            <td class="national-id">{{ participant.student.national_ID }}</td>
            <td class="phone">{{ participant.student.whatsapp_phone }}</td>
            <!-- <td class="image">
                <img :src="`https://quran-be-production.up.railway.app/birth_certificates/${participant.student.birth_certificate_img}`" alt="لا يوجد">
            </td> -->
            <td class="sheikh-name">{{ participant.sheikh.name }}</td>
            <td class="sheikh-phone">{{ formatPhone(participant.sheikh.whatsapp_phone) }}</td>
            <td class="level-number">
              <span class="level-badge">{{ participant.levelNumber }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getCompetitionParticipants } from '../lib/api'

interface Student {
  _id: string
  name: string
  national_ID: string
  whatsapp_phone: string
  birth_certificate_img?: string
}

interface Sheikh {
  _id: string
  name: string
  whatsapp_phone: string
}

interface Participant {
  student: Student
  sheikh: Sheikh
  levelNumber: number
}

const participants = ref<Participant[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const selectedLevel = ref('')
const competitionId = ref('6977c02bf3a39b6f96016944') // Default ID, can be passed as prop

const filteredParticipants = computed(() => {
  if (!Array.isArray(participants.value)) {
    return []
  }
  return participants.value.filter(participant => {
    const matchesSearch =
      participant.student.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      participant.student.national_ID.includes(searchQuery.value) ||
      participant.sheikh.name.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesLevel = selectedLevel.value === '' || participant.levelNumber === parseInt(selectedLevel.value)

    return matchesSearch && matchesLevel
  })
})

const formatPhone = (phone: string): string => {
  return phone || '-'
}

const loadParticipants = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await getCompetitionParticipants(competitionId.value)
    console.log('Full API Response:', response)
    
    // Extract the participants array from the response
    // let data: Participant[] = []
    
    // if (response.data?.data && Array.isArray(response.data.data)) {
    //   // Structure: { data: { data: [...] } }
    //   data = response.data.data
    // } else if (Array.isArray(response.data)) {
    //   // Structure: { data: [...] }
    //   data = response.data
    // } else if (Array.isArray(response)) {
    //   // Direct array response
    //   data = response
    // }
    
    participants.value = response?.data?.studentsData
    console.log('Extracted participants array:', participants.value)
  } catch (err: any) {
    console.error('Error loading participants:', err)
    error.value = err.message || 'فشل تحميل البيانات'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadParticipants()
})
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
}

.participants-table tbody tr:hover {
  background-color: #f5f5f5;
}

.participants-table tbody tr:last-child td {
  border-bottom: none;
}

.student-name {
  font-weight: 600;
  color: #333;
}

.national-id {
  font-family: monospace;
  color: #666;
}

.phone {
  font-family: monospace;
  font-size: 13px;
  color: black !important;
}

.sheikh-name {
  color: #555;
  font-weight: 500;
}

.sheikh-phone {
  font-family: monospace;
  font-size: 13px;
  color: #888;
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
