// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from './App';
import VueMaterial from 'vue-material';
import router from './router';
import Login from '@/pages/Login';

Vue.use(VueMaterial);

Vue.config.productionTip = false;


//basic user store from localstorage
let user = JSON.parse(localStorage.getItem('user')) || undefined;
if(!user || !user.isAuthd) {
    user = {
        email: undefined,
        isAuthd: false,
        androidID: undefined,
        masterToken: undefined
    };
    localStorage.setItem('user', JSON.stringify(user));
}
const store = {
    user: user,
    spotify: {
        info: {},
        tracks: []
    },
    google: {
        info: {},
        tracks: [],
        errors: []
    }
};

/* eslint-disable no-new */
new Vue({
    el: '#app',
    data: store,
    router,
    template: '<App/>',
    components: {
        App,
        Login
    }
});
