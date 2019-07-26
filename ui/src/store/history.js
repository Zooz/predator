import {createBrowserHistory} from 'history'
import * as env from '../App/common/env';

const history = createBrowserHistory({ basename: `${env.BUCKET_PATH ? env.BUCKET_PATH : '/'}` });

export default history;
