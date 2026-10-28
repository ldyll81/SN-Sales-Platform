import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/employee',
    redirect: '/employee/tianqi',
    component: () => import('../views/Employee/Dashboard.vue'),
    meta: { role: 'employee' },
    children: [
      {
        path: 'tianqi',
        component: { template: '<div class="tianqi-child"></div>' },
        meta: { tab: 'tianqi' }
      },
      {
        path: 'upload',
        component: () => import('../views/Employee/Upload.vue'),
        meta: { tab: 'upload' }
      },
      {
        path: 'profile',
        component: () => import('../views/Employee/Profile.vue'),
        meta: { tab: 'profile' }
      }
    ]
  },
  {
    path: '/supervisor',
    redirect: '/supervisor/tianqi',
    component: () => import('../views/Supervisor/Dashboard.vue'),
    meta: { role: 'supervisor' },
    children: [
      {
        path: 'tianqi',
        component: { template: '<div class="tianqi-child"></div>' },
        meta: { tab: 'tianqi' }
      },
      {
        path: 'info-process',
        component: () => import('../views/Supervisor/InfoProcess.vue'),
        meta: { tab: 'info-process' }
      },
      {
        path: 'profile',
        component: () => import('../views/Supervisor/Profile.vue'),
        meta: { tab: 'profile' }
      }
    ]
  },
  {
    path: '/executive',
    redirect: '/executive/tianqi',
    component: () => import('../views/Executive/Dashboard.vue'),
    meta: { role: 'executive' },
    children: [
      {
        path: 'tianqi',
        component: { template: '<div class="tianqi-child"></div>' },
        meta: { tab: 'tianqi' }
      },
      {
        path: 'info-summary',
        component: () => import('../views/Executive/InfoSummary.vue'),
        meta: { tab: 'info-summary' }
      },
      {
        path: 'profile',
        component: () => import('../views/Executive/Profile.vue'),
        meta: { tab: 'profile' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStr = sessionStorage.getItem('currentUser')
  if (to.path !== '/login' && !userStr) {
    next('/login')
    return
  }
  if (to.path === '/login' && userStr) {
    const user = JSON.parse(userStr)
    const roleMap = {
      employee: '/employee/tianqi',
      supervisor: '/supervisor/tianqi',
      executive: '/executive/tianqi'
    }
    next(roleMap[user.role] || '/')
    return
  }
  next()
})

export default router
