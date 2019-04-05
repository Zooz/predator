
import store from '../../../../../store';

export const getAuthorizationHeader = ()=>{
    const token = store.getState().authReducer.get('token');
    if(token){
        return {
            Authorization: `Bearer ${token}`
        }
    }

};