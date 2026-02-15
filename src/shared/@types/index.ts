
export interface SheikhWithStudents {
    _id: string,
    name: string,
    whatsapp_phone: string,
    studentsCount: number
}


enum ParticipantStatus {
  accepted = 'accepted',
  rejected = 'rejected',
  under_review = 'under_review',
  hanged = 'hanged',
  baned = 'baned'
}

export interface Student {
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
export interface Sheikh {
    _id: string
    name: string
    whatsapp_phone?: string
}

export interface Participant {
  student: Student;
  sheikh: Sheikh;
  levelNumber: number;
  levelValue: number,
  status: ParticipantStatus
}