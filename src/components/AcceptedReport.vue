<template>
    <div class="header">
      <h1>كشف المقبولين</h1>
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Participant } from '../shared/@types';



const searchQuery = ref("");
const selectedSheikhFilter = ref('') // New: Sheikh filter
const selectedLevel = ref("");
const participants = ref<Participant[]>([]);



// function normalizeArabic(text: string) {
//   return text
//     .replace(/[\u064B-\u065F]/g, '') // remove diacritics
//     .replace(/[أإآ]/g, 'ا')           // unify hamza
//     .replace(/ى/g, 'ي')               // replace final alef maqsura
//     .replace(/ة/g, 'ه')               // optional: taa marbuta → ha
//     .trim();
// }


// // Filter participants based on all criteria
// const filteredParticipants = computed(() => {
//   let filtered = participants.value

//   // Apply sheikh filter
//   if (selectedSheikhFilter.value) {
//     filtered = filtered.filter(participant => 
//       participant.sheikh?._id === selectedSheikhFilter.value
//     )
//   }

//   // Apply level filter
//   if (selectedLevel.value) {
//     filtered = filtered.filter(participant => 
//       participant.levelNumber == Number(selectedLevel.value)
//     )
//   }

//   // Apply search query filter
//   if (searchQuery.value) {
//     const query = searchQuery.value.toLowerCase()
//     filtered = filtered.filter(participant => {
//       const studentName = participant.student?.name?.toLowerCase() || ''
//       const nationalId = participant.student?.national_ID?.toLowerCase() || ''
//       const phone = participant.student?.whatsapp_phone?.toLowerCase() || ''
//       const sheikhName = participant.sheikh?.name?.toLowerCase() || ''
      
//       return normalizeArabic(studentName).includes(normalizeArabic(query)) ||
//              nationalId.includes(query) ||
//              phone.includes(query) ||
//              sheikhName.includes(query)
//     })
//   }

//   return filtered
// })



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
.image img{
  width: 50px !important;
}

.sheikh-phone {
  font-family: monospace;
  font-size: 13px;
  color: #111;
  font-weight: bold;
}

</style>
