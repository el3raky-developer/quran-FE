import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import RegistrationForm from '../components/RegistrationForm.vue'
import Participants from '../components/Participants.vue'

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
    {
        path: '/competitions/:id/participants',
        name: 'CompetitionParticipants',
        component: Participants,
        props: true,
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

export default router
