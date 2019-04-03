import createHistory from 'history/createBrowserHistory'
import * as env from '../App/common/env';
console.log('history',`${env.BUCKET_PATH ? env.BUCKET_PATH : '/'}`)
const history = createHistory({ basename: `${env.BUCKET_PATH ? env.BUCKET_PATH : '/'}` });

export default history;
