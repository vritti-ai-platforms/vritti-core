import { Avatar, AvatarFallback, AvatarImage } from '@vritti/quantum-ui/Avatar';
import { DropdownMenu, type MenuItem } from '@vritti/quantum-ui/DropdownMenu';
import { ThemeToggle, useTheme } from '@vritti/quantum-ui/theme';
import { Lock, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../hooks';
import { useAuth } from '../../providers/AuthProvider';

export const UserMenu = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const logoutMutation = useLogout({
    onSuccess: () => {
      logout();
      window.location.href = '/';
    },
  });

  // Build display name from user data
  const displayName = user?.displayName || 'User';
  const displayEmail = user?.email ?? '';

  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleProfileClick = () => {
    navigate('/account/profile');
  };

  const handleSecurityClick = () => {
    navigate('/account/security');
  };

  const handleSignOut = () => {
    logoutMutation.mutate();
  };

  // Define menu items using declarative structure
  const menuItems: MenuItem[] = [
    {
      type: 'custom',
      id: 'user-info',
      render: (
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-10 w-10">
            {user?.profilePictureUrl && <AvatarImage src={user.profilePictureUrl} alt={displayName} />}
            <AvatarFallback className="text-sm">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 min-w-0">
            <div className="flex flex-col space-y-1 min-w-0">
              <p className="text-sm font-semibold leading-none truncate">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">{displayEmail}</p>
            </div>
          </div>
        </div>
      ),
    },
    { type: 'separator' },
    {
      type: 'group',
      id: 'account-group',
      label: 'Account',
      items: [
        {
          type: 'item',
          id: 'profile',
          label: 'Profile',
          icon: User,
          onClick: handleProfileClick,
        },
        {
          type: 'item',
          id: 'password-auth',
          label: 'Password & Authentication',
          icon: Lock,
          onClick: handleSecurityClick,
        },
      ],
    },

    { type: 'separator' },
    {
      type: 'group',
      id: 'appearance-group',
      label: 'Appearance',
      items: [
        {
          type: 'custom',
          id: 'theme-toggle',
          asMenuItem: false,
          render: (
            <div className="flex items-center justify-between w-full px-2 py-1.5">
              <span className="text-sm">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              <ThemeToggle size="sm" />
            </div>
          ),
        },
      ],
    },

    { type: 'separator' },
    {
      type: 'item',
      id: 'signout',
      label: 'Sign out',
      icon: LogOut,
      onClick: handleSignOut,
      variant: 'destructive',
      shortcut: '⇧⌘Q',
    },
  ];

  return (
    <DropdownMenu
      trigger={{
        children: (
          <Avatar className="h-8 w-8 cursor-pointer transition-opacity hover:opacity-80" aria-label="User menu">
            {user?.profilePictureUrl && <AvatarImage src={user.profilePictureUrl} alt={displayName} />}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{userInitials}</AvatarFallback>
          </Avatar>
        ),
      }}
      items={menuItems}
      contentClassName="w-64"
      align="end"
    />
  );
};
