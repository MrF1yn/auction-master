// assets
import ShoppingOutlined from '@ant-design/icons/ShoppingOutlined';
import HistoryOutlined from '@ant-design/icons/HistoryOutlined';
import TrophyOutlined from '@ant-design/icons/TrophyOutlined';

// type
import { NavItemType } from 'types/menu';

// icons
const icons = {
  ShoppingOutlined,
  HistoryOutlined,
  TrophyOutlined
};

// ==============================|| MENU ITEMS - AUCTION ||============================== //

const auction: NavItemType = {
  id: 'auction',
  title: 'Auction',
  type: 'group',
  children: [
    {
      id: 'live-auctions',
      title: 'Live Auctions',
      type: 'item',
      url: '/auctions',
      icon: icons.ShoppingOutlined,
      breadcrumbs: false
    },
    {
      id: 'my-bids',
      title: 'My Bids',
      type: 'item',
      url: '/my-bids',
      icon: icons.HistoryOutlined
    },
    {
      id: 'won-items',
      title: 'Won Items',
      type: 'item',
      url: '/won-items',
      icon: icons.TrophyOutlined
    }
  ]
};

export default auction;
