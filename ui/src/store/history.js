import createHistory from 'history/createBrowserHistory'
import * as env from '../App/common/env';
const history = createHistory({ basename: `/${env.PERFORMANCE_FRAMEWORK_BUCKET_PATH}` });

export default history;
