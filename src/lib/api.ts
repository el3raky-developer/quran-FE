const API_BASE_URL = 'https://quran-be-production.up.railway.app'

export interface Level {
    levelNumber: number
    value: number
    _id: string
}

export interface Sheikh {
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

export interface StudentRegistrationData {
    name: string
    national_ID: string
    birth_certificate_img: string
    competition_id: string
    sheikh_id: string | null
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

// Fetch competitions
export const fetchCompetitions = async (): Promise<Competition[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/competitions`)
    if (!response.ok) throw new Error('Failed to fetch competitions')
    return response.json()
}

// Fetch competition by ID
export const fetchCompetitionById = async (competitionId: string): Promise<CompetitionData> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/competitions/${competitionId}`)
    if (!response.ok) throw new Error('Failed to fetch competition')
    const result = await response.json()
    return result.data
}

// Fetch levels
export const fetchLevels = async (): Promise<Level[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/levels`)
    if (!response.ok) throw new Error('Failed to fetch levels')
    return response.json()
}

// Fetch sheikhs
export const fetchSheikhs = async (): Promise<Sheikh[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/sheikhs`)
    if (!response.ok) throw new Error('Failed to fetch sheikhs')
    const result = await response.json()
    return result.data || result
}

// Register student
export const registerStudent = async (data: StudentRegistrationData): Promise<StudentResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/students`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const errorData = await response.json()
        const error: any = new Error(errorData.message || 'Failed to register student')
        error.response = { data: errorData, status: response.status }
        throw error
    }
    const result = await response.json()
    return result.data || result
}

// Upload birth certificate
export const uploadBirthCertificate = async (studentId: string, file: File): Promise<void> => {
    const formData = new FormData()
    formData.append('birth_certificate_img', file)

    const response = await fetch(`${API_BASE_URL}/api/v1/students/${studentId}/upload-certificate`, {
        method: 'PUT',
        body: formData,
    })

    if (!response.ok) throw new Error('Failed to upload certificate')
}
