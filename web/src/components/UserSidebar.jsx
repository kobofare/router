import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon, Menu } from 'semantic-ui-react';
import { useTranslation } from 'react-i18next';
import {
  buildUserWorkspaceMenuItems,
  isUserRouteActive,
} from '../constants/userMenu';

const UserSidebar = ({ compact = false }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const includeChat = Boolean(localStorage.getItem('chat_link'));
  const menuItems = useMemo(
    () => buildUserWorkspaceMenuItems({ includeChat }),
    [includeChat],
  );
  const groupActiveMap = useMemo(() => {
    return menuItems.reduce((accumulator, item) => {
      if (item.type === 'group' && Array.isArray(item.items)) {
        accumulator[item.key] = item.items.some((child) =>
          isUserRouteActive(location, child.to),
        );
      }
      return accumulator;
    }, {});
  }, [location, menuItems]);
  const [openGroups, setOpenGroups] = useState(() => {
    return Object.entries(groupActiveMap).reduce((accumulator, [key, active]) => {
      accumulator[key] = Boolean(active);
      return accumulator;
    }, {});
  });
  const previousGroupActiveRef = useRef(groupActiveMap);

  useEffect(() => {
    const previousActiveMap = previousGroupActiveRef.current;
    setOpenGroups((previous) => {
      const next = { ...previous };
      let changed = false;
      Object.entries(groupActiveMap).forEach(([key, active]) => {
        const wasActive = Boolean(previousActiveMap?.[key]);
        if (active && !wasActive && !next[key]) {
          next[key] = true;
          changed = true;
        }
        if (!(key in next)) {
          next[key] = Boolean(active);
          changed = true;
        }
      });
      return changed ? next : previous;
    });
    previousGroupActiveRef.current = groupActiveMap;
  }, [groupActiveMap]);

  return (
    <Menu vertical fluid className='router-admin-sidebar-menu'>
      {menuItems.map((item) => {
        if (item.type === 'group' && Array.isArray(item.items)) {
          const groupActive = Boolean(groupActiveMap[item.key]);
          const groupOpen = Boolean(openGroups[item.key]);
          return (
            <Menu.Item
              key={item.key}
              active={groupActive}
              className={`router-admin-sidebar-group ${groupActive ? 'active' : ''}`}
            >
              <div
                className='router-admin-sidebar-group-header'
                role='button'
                tabIndex={0}
                onClick={() => {
                  setOpenGroups((previous) => ({
                    ...previous,
                    [item.key]: !previous[item.key],
                  }));
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setOpenGroups((previous) => ({
                      ...previous,
                      [item.key]: !previous[item.key],
                    }));
                  }
                }}
                title={t(item.name)}
              >
                <span className='router-admin-sidebar-group-title'>
                  <Icon
                    name={item.icon}
                    className='router-admin-sidebar-item-icon'
                  />
                  {!compact ? (
                    <span className='router-admin-sidebar-group-label'>
                      {t(item.name)}
                    </span>
                  ) : null}
                </span>
                <Icon name={groupOpen ? 'angle down' : 'angle right'} />
              </div>
              {groupOpen ? (
                <Menu.Menu>
                  {item.items.map((child) => {
                    const active = isUserRouteActive(location, child.to);
                    return (
                      <Menu.Item
                        key={child.to}
                        active={active}
                        onClick={() => navigate(child.to)}
                        className={`router-admin-sidebar-item ${active ? 'active' : ''}`}
                        title={t(child.name)}
                      >
                        <span className='router-admin-sidebar-item-content'>
                          <Icon
                            name={child.icon}
                            className='router-admin-sidebar-item-icon'
                          />
                          {!compact ? (
                            <span className='router-admin-sidebar-item-label'>
                              {t(child.name)}
                            </span>
                          ) : null}
                        </span>
                      </Menu.Item>
                    );
                  })}
                </Menu.Menu>
              ) : null}
            </Menu.Item>
          );
        }

        const active = isUserRouteActive(location, item.to);
        return (
          <Menu.Item
            key={item.to}
            active={active}
            onClick={() => navigate(item.to)}
            className={`router-admin-sidebar-group router-user-sidebar-item ${active ? 'active' : ''}`}
            title={t(item.name)}
          >
            <span className='router-admin-sidebar-item-content'>
              <Icon
                name={item.icon}
                className='router-admin-sidebar-item-icon'
              />
              {!compact ? (
                <span className='router-admin-sidebar-item-label'>
                  {t(item.name)}
                </span>
              ) : null}
            </span>
          </Menu.Item>
        );
      })}
    </Menu>
  );
};

export default UserSidebar;
