import createHistory from 'history/createBrowserHistory'
import * as env from '../App/common/env';

const history = createHistory({ basename: `${env.BUCKET_PATH ? env.BUCKET_PATH : '/'}` });

export default history;
