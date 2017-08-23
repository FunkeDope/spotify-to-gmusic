// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from './App';
import VueMaterial from 'vue-material';
import router from './router';
import VueLocalStorage from 'vue-localstorage';
import Login from '@/components/Login';

Vue.use(VueMaterial);
Vue.use(VueLocalStorage, {
    name: 'ls'
});

Vue.config.productionTip = false;


/* eslint-disable no-new */
new Vue({
    el: '#app',
    router,
    template: '<App/>',
    components: {
        App,
        Login
    }
});
