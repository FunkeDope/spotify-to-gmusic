<template>
    <div class="container">
        <br>
        <md-card>
            <md-card-header>
                <div class="md-title">Sign into Google
                    <md-icon>library_music</md-icon>
                </div>
                <div class="md-subhead">We don't store <i>anything</i> on our servers, but Google doesn't offer OAuth login or an official API for GMusic. This info is stored locally and sent with each server request.</div>
                <div class="md-subhead">We recommend using a <strong><a href="https://support.google.com/accounts/answer/185833?hl=en" target="_blank">Single App Password</a></strong> just to be on the safe side (which is <i>required</i> if you use 2fa.)</div>
                <br>
                <md-divider></md-divider>
                <br>
                <div class="md-subhead">If you already have access to your Android Mater Token you can use that in leiu of a password. AndroidID can be auto-generated as well, however it will count towards your registered device limit. </div>
                <div class="md-subhead">You can get your current Android DeviceID with <a href="https://play.google.com/store/apps/details?id=com.redphx.deviceid&hl=en" target="_blank">this app</a> (which is recommended.)</div>
            </md-card-header>
            <md-card-content>
                <form novalidate @submit.stop.prevent="submit">
                    <md-input-container>
                        <label>Email</label>
                        <md-input name="email" required type="email" v-model="user.email"></md-input>
                    </md-input-container>
                    <md-input-container md-has-password>
                         <label>Password</label>
                         <md-input name="password" type="password" v-model="user.pass"></md-input>
                    </md-input-container>
                    <md-input-container>
                         <label>AndroidID</label>
                         <md-input name="androidid" type="text" v-model="user.androidID"></md-input>
                    </md-input-container>
                    <md-input-container>
                         <label>Android Mater Token</label>
                         <md-input name="mastertoken" type="text" v-model="user.masterToken"></md-input>
                    </md-input-container>
                </form>
                
                <md-card-actions>
                    <md-button @click="auth()" class="md-primary md-raised">Authenticate <md-icon>arrow_forward</md-icon></md-button>
                </md-card-actions>
            </md-card-content>

        </md-card>
        <md-dialog-alert
          md-content="Error authenticating! Try again."
          md-ok-text="OK"
          ref="auth-error">
        </md-dialog-alert>
    </div>
</template>

<script>
    import config from '@/js/globals.js';
    import axios from 'axios';
    import router from '@/router';
    
    export default {
        name: 'Login',
        data() {
            return {
                 user: {
                    email: undefined,
                    isAuthd: false,
                    androidID: undefined,
                    masterToken: undefined,
                    pass: undefined
                }
            }
        },
        methods: {
            auth: function() {
                let vm = this;
                let payload = {
                    user: vm.user 
                };

                axios.post(config.api.v1 + 'authgpm/', payload).then(function(resp) {
                    console.log(resp);
                    if(resp.status === 200 && resp.data.masterToken) {                        
                        let authdUser = {
                            email: vm.user.email,
                            androidID: resp.data.androidId,
                            masterToken: resp.data.masterToken,
                            pass: vm.user.pass,
                            isAuthd: true
                        };
                        
                        vm.$ls.set('user', JSON.stringify(authdUser));
                        router.push('/');
                    }
                    else {
                        console.error('bad news bears!', resp);
                        vm.$refs['auth-error'].open();
                    }
                }).catch(function(err){
                    console.log(err);
                    vm.$refs['auth-error'].open();
                });
            }
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>