<template>
  <div>
    <div class="header">
      <h1>الشيوخ</h1>
      <div class="controls">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ابحث عن شيخ..."
          class="search-input"
        />
      </div>
    </div>

    <v-data-table
      :headers="headers"
      :items="filteredSheikhs"
      :items-per-page="10"
      class="elevation-1"
      :items-per-page-text="'العناصر في الصفحة:'"
      :page-text="'{0}-{1} من {2}'"
      :first-icon="'mdi-chevron-right'"
      :prev-icon="'mdi-chevron-right'"
      :next-icon="'mdi-chevron-left'"
      :last-icon="'mdi-chevron-left'"
      :loading="loadingData"
    >
      <!-- Custom row -->
      <template #item.whatsapp_phone="{ item }">
        {{ formatPhone(item.whatsapp_phone ?? "") }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          prepend-icon="mdi-pencil"
          color="primary"
          @click="editSheikh(item)"
          class="me-2"
        >
          تعديل
        </v-btn>

        <v-btn
          prepend-icon="mdi-delete"
          color="error"
          @click="deleteSheikh(item)"
        >
          حذف
        </v-btn>
      </template>

      <!-- Empty state -->
      <template #no-data>
        <div class="text-center py-4">لا توجد بيانات</div>
      </template>
    </v-data-table>

    <!-- Edit Modal -->
     <v-dialog v-model="showEditModal" max-width="600">
         <div
           @click.self="closeEditModal"
         >
           <v-card class="modal-card">
             <v-card-title class="bg-green text-white pa-6">
               <div class="d-flex justify-space-between align-center">
                 <span>تعديل بيانات الشيخ</span>
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
             <v-card-text class="pa-6" v-if="editingSheikh">
               <v-form @submit.prevent="saveChanges">
                 <!-- Form fields remain the same -->
                 <v-text-field
                   v-model="editingSheikh.name"
                   label="اسم الطالب"
                   variant="outlined"
                   density="comfortable"
                   prepend-inner-icon="mdi-account"
                   dir="rtl"
                   class="mb-4"
                   required
                 ></v-text-field>
     
                 <v-text-field
                   v-model="editingSheikh.whatsapp_phone"
                   label="رقم الهاتف (واتس)"
                   variant="outlined"
                   density="comfortable"
                   prepend-inner-icon="mdi-whatsapp"
                   dir="rtl"
                   class="mb-4"
                   required
                 ></v-text-field>
     
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
     </v-dialog>

     <v-dialog v-model="showDeleteModal" max-width="600">
        <v-card class="modal-card">
            <v-card-title class="bg-green text-white pa-6">
                <div class="d-flex justify-space-between align-center">
                    <span>حذف بيانات الشيخ</span>
                    <v-btn
                    icon
                    variant="text"
                    @click="closeDeleteModal"
                    class="text-white"
                    >
                    <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
            </v-card-title>
            <v-card-text class="pa-6" v-if="deletingSheikh?.studentsCount">
                لا يمكن حذف الشيخ لان هناك متسابقين مسجلين عليه
            </v-card-text>
            <v-card-text class="pa-6" v-else>
                هل انت متأكد من حذف بيانات الشيخ
            </v-card-text>
            <v-card-actions v-if="!deletingSheikh?.studentsCount">
                <v-btn
                    prepend-icon="mdi-delete"
                    color="error"
                    variant="outlined"
                    @click="handleDeleteSheikh"
                >
                    حذف
                </v-btn>
            </v-card-actions>
        </v-card>
     </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { deleteSheikhData, editSheikhData, fetchSheikhsWithStudentCount } from "./../lib/api"; // your existing API
import { computed } from "vue";
import { useRoute } from "vue-router";
import { SheikhWithStudents } from "../shared/@types";

const route = useRoute();

const sheikhs = ref<SheikhWithStudents[]>([]);
const searchQuery = ref("");
const competitionId = computed(() => route.params.id as string); // Default ID, can be passed as prop
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const editingSheikh = ref<SheikhWithStudents | null>()
const deletingSheikh = ref<SheikhWithStudents | null>()
const loadingData = ref(false)

const headers = [
  { title: "اسم الشيخ", key: "name", align: "center" as const },
  { title: "رقم الواتساب", key: "whatsapp_phone", align: "center" as const },
  { title: "عدد المتسابقين", key: "studentsCount", align: "center" as const },
  {
    title: "الإجراءات",
    key: "actions",
    sortable: false,
    align: "center" as const,
  },
];

onMounted(async () => {
  try {
    loadingData.value = true
    sheikhs.value = await fetchSheikhsWithStudentCount(competitionId.value);
  } catch (error) {
    
  } finally {
    loadingData.value = false
  }
});

const formatPhone = (phone: string) => {
  return phone?.replace(/\D/g, "");
};

const editSheikh = (sheikh: SheikhWithStudents) => {
    showEditModal.value = true
    editingSheikh.value = JSON.parse(JSON.stringify(sheikh))
};

const deleteSheikh = (sheikh: SheikhWithStudents) => {
    showDeleteModal.value = true
    deletingSheikh.value = sheikh
};


const closeEditModal = () => {
  showEditModal.value = false;
  editingSheikh.value = null;
};
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deletingSheikh.value = null;
};

function normalizeArabic(text: string) {
  return text
    .replace(/[\u064B-\u065F]/g, "") // remove diacritics
    .replace(/[أإآ]/g, "ا") // unify hamza
    .replace(/ى/g, "ي") // replace final alef maqsura
    .replace(/ة/g, "ه") // optional: taa marbuta → ha
    .trim();
}

// Filter participants based on all criteria
const filteredSheikhs = computed(() => {
  let filtered = sheikhs.value;

  // Apply search query filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((sheikh) => {
      const sheikhName = sheikh?.name?.toLowerCase() || "";
      const phone = sheikh?.whatsapp_phone?.toLowerCase() || "";

      return (
        normalizeArabic(sheikhName).includes(normalizeArabic(query)) ||
        phone.includes(query)
      );
    });
  }

  return filtered;
});



const saveChanges = async () => {
  if (!editingSheikh.value) return;

  try {
    await editSheikhData(editingSheikh.value );


    sheikhs.value = await fetchSheikhsWithStudentCount(competitionId.value);
    closeEditModal();

  } catch (err: any) {
    console.error("Error saving changes:", err);
  }
};

const handleDeleteSheikh = async () => {
  if (!deletingSheikh.value) return;

  try {
    await deleteSheikhData(deletingSheikh.value?._id );


    sheikhs.value = await fetchSheikhsWithStudentCount(competitionId.value);
    closeDeleteModal();

  } catch (err: any) {
    console.error("Error saving changes:", err);
  }
};
</script>

<style scoped>
.actions {
  display: flex;
  gap: 8px;
}

.controls {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.search-input {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  min-width: 200px;
}

.search-input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.search-input {
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

.search-input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 20px;
  color: #333;
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

@media (max-width: 768px) {
  .header h1 {
    font-size: 20px;
  }
  .controls {
    flex-direction: column;
  }
  .search-input {
    min-width: 100%;
  }
}
</style>
