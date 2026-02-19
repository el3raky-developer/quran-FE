import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import RegistrationForm from '../components/RegistrationForm.vue'
import Participants from '../components/Participants.vue'
import Competition from '../components/Competition.vue'
import Sheikhs from '../components/Sheikhs.vue'
import Reports from '../components/Reports.vue'
import AcceptedReport from '../components/AcceptedReport.vue'
import HangedReport from '../components/HangedReport.vue'
import AttendanceReport from '../components/AttendanceReport.vue'
import GradesReport from '../components/GradesReport.vue'
import StudentsAllocation from '../components/StudentsAllocation.vue'

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'RegistrationForm',
        component: RegistrationForm,
    },
    {
        path: '/participants',
        name: 'Participants',
        component: Participants,
    },
    // {
    //     path: '/competitions/:id/participants',
    //     name: 'CompetitionParticipants',
    //     component: Participants,
    //     props: true,
    // },
    {
        path: '/competitions/:id',
        name: 'Competition',
        component: Competition,
        props: true,
        children: [
            {
                path: '',
                name: 'CompetitionParticipants',
                component: Participants,
                props: true,
            },
            {
                path: 'sheikhs',
                name: 'SheikhsComponents',
                component: Sheikhs,
                props: true,
            },
            {
                path: 'reports',
                name: 'CompetitionReports',
                component: Reports,
                props: true,
                children: [
                    {
                    path: 'accepted',
                    name: 'AcceptedReport',
                    component: AcceptedReport,
                    },
                    {
                    path: 'hanged',
                    name: 'HangedReport',
                    component: HangedReport,
                    },
                    {
                    path: 'attendance',
                    name: 'AttendanceReport',
                    component: AttendanceReport,
                    },
                    {
                    path: 'grades',
                    name: 'GradesReport',
                    component: GradesReport,
                    },
                ],
            },
            {
                path: 'students-allocation',
                name: 'studentsAllocationComponent',
                component: StudentsAllocation,
                props: true,
            },
        ]
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

export default router
