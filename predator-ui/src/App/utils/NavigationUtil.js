import PermissionUtil from './PermissionUtil';
import history from '../../store/history'

class NavigationUtil {
    verifyAndGo = (requestURI, allRolesPermissions, permission) => {
      if (PermissionUtil.findPermission(allRolesPermissions, permission)) {
        history.push(requestURI);
        return true;
      } else {
        return false
      }
    }
}

export default new NavigationUtil()
