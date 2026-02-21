// const API_BASE_URL = 'https://quran-be-production.up.railway.app'
// // const API_BASE_URL = 'https://quran-be-6rgt.onrender.com'
// const API_BASE_URL = 'http://localhost:5000'

export interface Level {
  levelNumber: number
  value: number
  _id: string
}

export interface Sheikh {
  _id: string
  name: string
  whatsapp_phone?: string
}

export interface City {
  _id: string
  name: string
}

export interface CompetitionLevel {
  levelNumber: number
  value: number
  _id: string
}

export interface CompetitionData {
  _id: string
  title: string
  category: string
  registrationEndDate: string
  numOfLevels: number
  levels: CompetitionLevel[]
  participants: any[]
}

export interface Competition {
  _id: string
  name: string
}

export interface AllocateStudentsPayload {
  competitionId: string
  testDateTime: string
  testDurationMinutes: number
  numCommittees: number
  levelNumber: number
}

/** Participant slot in a test committee */
export interface TestCommitteeParticipant {
  _id: string
  studentId: { _id: string; name: string; national_ID: string }
  sheikhId: string
  testDateTime: string
}

/** Test committee (لجنة اختبار) for a competition level */
export interface TestCommittee {
  _id: string
  competitionId: { _id: string; title: string; category: string }
  levelNumber: number
  levelValue: number
  testDateTime: string
  participants: TestCommitteeParticipant[]
  createdAt?: string
  updatedAt?: string
}

export interface StudentRegistrationData {
  name: string
  national_ID: string
  birth_certificate_img: string
  competition_id: string | null
  sheikh_id: string | null
  city_id: string | null
  level: number,
  custom_sheikh_name: string | null,
  custom_sheikh_phone: string | null
}

export interface StudentResponse {
  _id: string
  name: string
  national_ID: string
  level: number
}

export interface EditStudentPayloadSheikh {
  _id: string | null
  name: string
  whatsapp_phone: string
}

export interface EditStudentPayloadStudent {
  _id: string
  name: string
  national_ID: string
  whatsapp_phone: string
  birth_certificate_img?: string
  city_id?: string
}

export interface EditStudentData {
  competition_id: string
  levelNumber: number
  sheikh: EditStudentPayloadSheikh
  student: EditStudentPayloadStudent
}

import { SheikhWithStudents } from "../shared/@types"
// // Fetch competitions
// export const fetchCompetitions = async (): Promise<Competition[]> => {
//     const response = await fetch(`${API_BASE_URL}/api/v1/competitions`)
//     if (!response.ok) throw new Error('Failed to fetch competitions')
//     return response.json()
// }

// // Fetch competition by ID
// export const fetchCompetitionById = async (competitionId: string): Promise<CompetitionData> => {
//     const response = await fetch(`${API_BASE_URL}/api/v1/competitions/${competitionId}`)
//     if (!response.ok) throw new Error('Failed to fetch competition')
//     const result = await response.json()
//     return result.data
// }

// // Fetch levels
// export const fetchLevels = async (): Promise<Level[]> => {
//     const response = await fetch(`${API_BASE_URL}/api/v1/levels`)
//     if (!response.ok) throw new Error('Failed to fetch levels')
//     return response.json()
// }

// // Fetch sheikhs
// export const fetchSheikhs = async (): Promise<Sheikh[]> => {
//     const response = await fetch(`${API_BASE_URL}/api/v1/sheikhs`)
//     if (!response.ok) throw new Error('Failed to fetch sheikhs')
//     const result = await response.json()
//     return result.data || result
// }

// // Fetch cities
// export const fetchCities = async (): Promise<City[]> => {
//     const response = await fetch(`${API_BASE_URL}/api/v1/cities`)
//     if (!response.ok) throw new Error('Failed to fetch cities')
//     const result = await response.json()
//     return result.data || result
// }

// // Register student
// export const registerStudent = async (data: StudentRegistrationData): Promise<StudentResponse> => {
//     const response = await fetch(`${API_BASE_URL}/api/v1/students`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data),
//     })

//     if (!response.ok) {
//         const errorData = await response.json()
//         const error: any = new Error(errorData.message || 'Failed to register student')
//         error.response = { data: errorData, status: response.status }
//         throw error
//     }
//     const result = await response.json()
//     return result.data || result
// }

// // Upload birth certificate
// export const uploadBirthCertificate = async (studentId: string, file: File): Promise<void> => {
//     const formData = new FormData()
//     formData.append('birth_certificate_img', file)

//     const response = await fetch(`${API_BASE_URL}/api/v1/students/${studentId}/upload-certificate`, {
//         method: 'PUT',
//         body: formData,
//     })

//     if (!response.ok) throw new Error('Failed to upload certificate')
// }

// // Fetch competition participants
// export const getCompetitionParticipants = async (competitionId: string): Promise<any> => {
//     const response = await fetch(`${API_BASE_URL}/api/v1/competitions/${competitionId}/participants`)
//     if (!response.ok) throw new Error('Failed to fetch participants')
//     return response.json()
// }

// // Edit student
// export const editStudent = async (data: EditStudentData): Promise<any> => {
//     const response = await fetch(`${API_BASE_URL}/api/v1/students/edit`, {
//         method: 'PUT',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data),
//     })

//     if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}))
//         const error: any = new Error(errorData.message || 'Failed to edit student')
//         error.response = { data: errorData, status: response.status }
//         throw error
//     }
//     return response.json()
// }


import api from "./axios"; // axios instance

// Fetch competitions
export const fetchCompetitions = async (): Promise<Competition[]> => {
  const response = await api.get("/api/v1/competitions");
  return response.data;
};

// Fetch competition by ID
export const fetchCompetitionById = async (
  competitionId: string
): Promise<CompetitionData> => {
  const response = await api.get(`/api/v1/competitions/${competitionId}`);
  return response.data.data;
};

// Fetch levels
export const fetchLevels = async (): Promise<Level[]> => {
  const response = await api.get("/api/v1/levels");
  return response.data;
};

// Fetch sheikhs
export const fetchSheikhs = async (): Promise<Sheikh[]> => {
  const response = await api.get("/api/v1/sheikhs");
  return response.data.data || response.data;
};

// Fetch sheikhs
export const fetchSheikhsWithStudentCount = async (competitionId: string): Promise<SheikhWithStudents[]> => {
  const response = await api.get(`/api/v1/sheikhs/sheikhsWithStudents/${competitionId}`);
  return response.data.data || response.data;
};

// edit sheikh
export const editSheikhData = async (data: any): Promise<any> => {
  const response = await api.put(`/api/v1/sheikhs/`, data);
  return response.data.data || response.data;
};
// delete sheikh
export const deleteSheikhData = async (id: string): Promise<any> => {
  const response = await api.delete(`/api/v1/sheikhs/${id}`);
  return response.data.data || response.data;
};

// Fetch cities
export const fetchCities = async (): Promise<City[]> => {
  const response = await api.get("/api/v1/cities");
  return response.data.data || response.data;
};

// Register student
export const registerStudent = async (
  data: StudentRegistrationData
): Promise<StudentResponse> => {
  try {
    const response = await api.post("/api/v1/students", data);
    return response.data.data || response.data;
  } catch (err: any) {
    const error = new Error(
      err.response?.data?.message || "Failed to register student"
    ) as any;

    error.response = {
      data: err.response?.data,
      status: err.response?.status,
    };

    throw error;
  }
};

// Upload birth certificate
export const uploadBirthCertificate = async (
  studentId: string,
  file: File
): Promise<any> => {
  const formData = new FormData();
  formData.append("birth_certificate_img", file);

  const res = await api.put(`/api/v1/students/${studentId}/upload-certificate`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data
};

// Fetch competition participants
export const getCompetitionParticipants = async (
  competitionId: string
): Promise<any> => {
  const response = await api.get(
    `/api/v1/competitions/${competitionId}/participants`
  );
  return response.data;
};

// Allocate students to testing committees
export const allocateStudentsToCommittees = async (
  payload: AllocateStudentsPayload
): Promise<any> => {
  try {
    const response = await api.post(
      `/api/v1/test-committees`,
      payload
    );
    return response.data;
  } catch (err: any) {
    const error = new Error(
      err.response?.data?.message || "Failed to allocate students to committees"
    ) as any;
    error.response = {
      data: err.response?.data,
      status: err.response?.status,
    };
    throw error;
  }
};

// Get competition test committees (لجان الاختبار)
export const getCompetitionTestCommittees = async (
  competitionId: string
): Promise<TestCommittee[]> => {
  try {
    const response = await api.get(
      `/api/v1/test-committees/competition/${competitionId}`
    );
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    const error = new Error(
      err.response?.data?.message || "Failed to get test committees"
    ) as any;
    error.response = {
      data: err.response?.data,
      status: err.response?.status,
    };
    throw error;
  }
};

// delete competition test committees (لجان الاختبار)
export const deleteCompetitionTestCommittees = async (
  competitionId: string
): Promise<TestCommittee[]> => {
  try {
    const response = await api.delete(
      `/api/v1/test-committees/competition/${competitionId}`
    );
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    const error = new Error(
      err.response?.data?.message || "Failed to delete test committees"
    ) as any;
    error.response = {
      data: err.response?.data,
      status: err.response?.status,
    };
    throw error;
  }
};

// Edit student
export const editStudent = async (data: EditStudentData): Promise<any> => {
  try {
    const response = await api.put("/api/v1/students/edit", data);
    return response.data;
  } catch (err: any) {
    const error = new Error(
      err.response?.data?.message || "Failed to edit student"
    ) as any;

    error.response = {
      data: err.response?.data,
      status: err.response?.status,
    };

    throw error;
  }
};

export const handleStudentStatus = async (id: string , competitionId: string , status: string , statusReason: string | null): Promise<any> => {
  try {
    const response = await api.put(`/api/v1/students/${id}/${competitionId}/${status}/${statusReason}`);
    return response.data;
  } catch (err: any) {
    const error = new Error(
      err.response?.data?.message || "Failed to change student status"
    ) as any;

    error.response = {
      data: err.response?.data,
      status: err.response?.status,
    };

    throw error;
  }
};


// Fetch competition participants
export const getStudentsByStatus = async (
  status: string,
  competitionId: string
): Promise<any> => {
  const response = await api.get(
    `/api/v1/students/${competitionId}/status/${status}`
  );
  return response.data;
};
export const addStudentReason = async (id: string , competitionId: string , reasonType: string , reasonText: string): Promise<any> => {
  try {
    const response = await api.put(`/api/v1/students/${id}/${competitionId}/reason/${reasonType}/${reasonText}`);
    return response.data;
  } catch (err: any) {
    const error = new Error(
      err.response?.data?.message || "Failed to add student reason"
    ) as any;

    error.response = {
      data: err.response?.data,
      status: err.response?.status,
    };

    throw error;
  }
};

export const checkStudentByNationalId = async (nid: string , competitionId: string): Promise<any> => {
  try {
    const response = await api.put(`/api/v1/students/${nid}/${competitionId}/status`);
    return response.data;
  } catch (err: any) {
    const error = new Error(
      err.response?.data?.message || "Failed to check student status"
    ) as any;

    error.response = {
      data: err.response?.data,
      status: err.response?.status,
    };

    throw error;
  }
};

export const deleteStudentData = async (id: string , competitionId: string): Promise<any> => {
  try {
    const response = await api.delete(`/api/v1/students/${id}/${competitionId}`);
    return response.data;
  } catch (err: any) {
    const error = new Error(
      err.response?.data?.message || "Failed to delete student data"
    ) as any;

    error.response = {
      data: err.response?.data,
      status: err.response?.status,
    };

    throw error;
  }
};
