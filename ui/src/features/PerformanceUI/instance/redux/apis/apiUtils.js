
import store from '../../../../../store';

export const getHeaders = ()=>{
    const token = store.getState().authReducer.get('token');
    console.log('get headers',token);
    if(token){
        return {
            Authorization: `Bearer ${token}`
        }
    }

};