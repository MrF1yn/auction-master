// assets
import UserOutlined from '@ant-design/icons/UserOutlined';
import SettingOutlined from '@ant-design/icons/SettingOutlined';
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';

// type
import { NavItemType } from 'types/menu';

// icons
const icons = {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined
};

// ==============================|| MENU ITEMS - ACCOUNT ||============================== //

const account: NavItemType = {
  id: 'account',
  title: 'Account',
  type: 'group',
  children: [
    {
      id: 'profile',
      title: 'Profile',
      type: 'item',
      url: '/profile',
      icon: icons.UserOutlined
    },
    {
      id: 'settings',
      title: 'Settings',
      type: 'item',
      url: '/settings',
      icon: icons.SettingOutlined
    }
  ]
};

export default account;
