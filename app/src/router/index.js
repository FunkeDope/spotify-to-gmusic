import Vue from 'vue';
import Router from 'vue-router';
import Main from '@/pages/Main';
import Login from '@/pages/Login';

Vue.use(Router)

export default new Router({
    mode: 'history',
    base: __dirname,
    routes: [
        {
            path: '/',
            name: 'Main',
            component: Main
        },
        {
            path: '/login',
            name: 'Login',
            component: Login
        }
  ]
});
