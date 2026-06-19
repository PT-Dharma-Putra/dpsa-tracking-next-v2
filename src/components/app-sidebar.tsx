'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import {
  SquareTerminal,
  FileBox,
  Files,
  Users,
  PieChart,
  LogOut,
  Settings,
  User as UserIcon,
  ChevronsUpDown,
  Building2,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authService } from '@/features/auth/api/auth-service';
import { useAuthStore } from '@/lib/auth-store';
// import { CollapsibleContent } from "./ui/collapsible"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { isMobile } = useSidebar();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout failed', e);
    }
    logout();
    router.push('/auth/internal/login');
  };

  // Define menu items based on Role (Can be refined later)
  const userRoles = [
    ...(user?.role ? [user.role] : []),
    ...(user?.roles?.map((r) => r.name) || []),
  ];
  const isAdmin = userRoles.includes('Super-Admin');

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const data = {
    versions: ['1.0.1', '1.1.0-alpha', '2.0.0-beta1'],
    navMain: [
      {
        title: 'Marketing',
        url: '#',
        allowedRoles: ['Super-Admin', 'Marketing'],
        items: [
          {
            title: 'Projects V2',
            url: '/dashboard/projects-v2/marketing',
          },
          {
            title: 'Mdl',
            url: '/dashboard/mdl',
          },
        ],
      },
      {
        title: 'Studio',
        url: '#',
        allowedRoles: ['Super-Admin', 'Studio'],
        items: [
          {
            title: 'Desainer',
            url: '/dashboard/projects-v2/perintah-kerja',
            icon: (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 120 120'
                className='h-5 w-5 shrink-0 mr-1.5'
              >
                <defs>
                  <linearGradient
                    id='bgRoom'
                    x1='0%'
                    y1='0%'
                    x2='100%'
                    y2='100%'
                  >
                    <stop offset='0%' stopColor='#2c3e50' />
                    <stop offset='100%' stopColor='#1a252f' />
                  </linearGradient>

                  <linearGradient
                    id='goldAccent'
                    x1='0%'
                    y1='0%'
                    x2='100%'
                    y2='100%'
                  >
                    <stop offset='0%' stopColor='#E5C07B' />
                    <stop offset='100%' stopColor='#D4AF37' />
                  </linearGradient>
                </defs>

                <rect width='120' height='120' rx='28' fill='url(#bgRoom)' />

                <path
                  d='M 60 15 L 60 75'
                  stroke='#405872'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
                <path
                  d='M 15 50 L 60 75 L 105 50'
                  stroke='#405872'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
                <path
                  d='M 15 50 L 15 110'
                  stroke='#405872'
                  strokeWidth='1.5'
                  strokeDasharray='4 4'
                />
                <path
                  d='M 105 50 L 105 110'
                  stroke='#405872'
                  strokeWidth='1.5'
                  strokeDasharray='4 4'
                />

                <g id='Armchair'>
                  <path
                    d='M 45 60 L 45 45 Q 45 38 50 38 L 70 38 Q 75 38 75 45 L 75 60 Z'
                    fill='url(#goldAccent)'
                  />
                  <path
                    d='M 40 60 L 80 60 Q 82 60 82 65 L 82 68 Q 82 72 78 72 L 42 72 Q 38 72 38 68 L 38 65 Q 38 60 40 60 Z'
                    fill='#F1C40F'
                  />
                  <line
                    x1='45'
                    y1='72'
                    x2='42'
                    y2='85'
                    stroke='url(#goldAccent)'
                    strokeWidth='3'
                    strokeLinecap='round'
                  />
                  <line
                    x1='75'
                    y1='72'
                    x2='78'
                    y2='85'
                    stroke='url(#goldAccent)'
                    strokeWidth='3'
                    strokeLinecap='round'
                  />
                  <line
                    x1='52'
                    y1='72'
                    x2='52'
                    y2='82'
                    stroke='#B8860B'
                    strokeWidth='3'
                    strokeLinecap='round'
                  />
                  <line
                    x1='68'
                    y1='72'
                    x2='68'
                    y2='82'
                    stroke='#B8860B'
                    strokeWidth='3'
                    strokeLinecap='round'
                  />
                  <rect
                    x='37'
                    y='52'
                    width='8'
                    height='12'
                    rx='3'
                    fill='#D4AF37'
                  />
                  <rect
                    x='75'
                    y='52'
                    width='8'
                    height='12'
                    rx='3'
                    fill='#D4AF37'
                  />
                </g>

                <g id='PendantLamp'>
                  <line
                    x1='88'
                    y1='15'
                    x2='88'
                    y2='35'
                    stroke='#E5C07B'
                    strokeWidth='2'
                  />
                  <path
                    d='M 81 35 L 95 35 L 91 42 L 85 42 Z'
                    fill='url(#goldAccent)'
                  />
                  <circle cx='88' cy='43' r='2.5' fill='#FFF' />
                  <path
                    d='M 81 48 L 95 48'
                    stroke='#FFF'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    opacity='0.5'
                  />
                  <path
                    d='M 84 52 L 92 52'
                    stroke='#FFF'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    opacity='0.3'
                  />
                </g>

                <g id='Plant'>
                  <path d='M 26 65 L 34 65 L 32 75 L 28 75 Z' fill='#95a5a6' />
                  <rect
                    x='25'
                    y='63'
                    width='10'
                    height='3'
                    rx='1'
                    fill='#7f8c8d'
                  />
                  <path
                    d='M 30 63 Q 18 53 25 43 Q 33 53 30 63 Z'
                    fill='#2ecc71'
                  />
                  <path
                    d='M 30 63 Q 40 48 43 45 Q 38 60 30 63 Z'
                    fill='#27ae60'
                  />
                  <path
                    d='M 30 63 Q 20 58 15 62 Q 25 65 30 63 Z'
                    fill='#1e8449'
                  />
                </g>
              </svg>
            ),
          },
          {
            title: 'Engineer',
            url: '/dashboard/projects-v2/engineer',
            icon: (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 120 120'
                className='h-5 w-5 shrink-0 mr-1.5'
              >
                <defs>
                  <pattern
                    id='grid'
                    width='10'
                    height='10'
                    patternUnits='userSpaceOnUse'
                  >
                    <path
                      d='M 10 0 L 0 0 0 10'
                      fill='none'
                      stroke='#e0e0e0'
                      strokeWidth='0.5'
                    />
                  </pattern>
                </defs>

                <path
                  d='M 15,60 A 45,45 0 0,1 70,16'
                  fill='none'
                  stroke='#0a4b85'
                  strokeWidth='7'
                  strokeLinecap='round'
                />
                <path
                  d='M 78,19 A 45,45 0 0,1 102,70'
                  fill='none'
                  stroke='#fa6d01'
                  strokeWidth='5'
                  strokeLinecap='round'
                />
                <path
                  d='M 98,78 A 45,45 0 0,1 40,103'
                  fill='none'
                  stroke='#1a1a1a'
                  strokeWidth='7'
                  strokeLinecap='round'
                />
                <path
                  d='M 32,100 A 45,45 0 0,1 12,68'
                  fill='none'
                  stroke='#a1a3a6'
                  strokeWidth='4'
                  strokeLinecap='round'
                />

                <polygon points='30,28 22,85 26,85 34,28' fill='#1a1a1a' />
                <polygon points='30,28 55,85 51,85 26,28' fill='#0a4b85' />
                <circle cx='30' cy='30' r='6' fill='#0a4b85' />
                <circle cx='30' cy='30' r='3' fill='#ffffff' />
                <line
                  x1='24'
                  y1='55'
                  x2='44'
                  y2='55'
                  stroke='#1a1a1a'
                  strokeWidth='2'
                />

                <g transform='translate(50, 35)'>
                  <rect
                    x='0'
                    y='0'
                    width='35'
                    height='50'
                    fill='#ffffff'
                    stroke='#1a1a1a'
                    strokeWidth='2'
                  />
                  <rect x='2' y='2' width='31' height='20' fill='#0a4b85' />
                  <rect x='2' y='26' width='31' height='12' fill='#fa6d01' />
                  <line
                    x1='12'
                    y1='32'
                    x2='23'
                    y2='32'
                    stroke='#1a1a1a'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <rect x='2' y='40' width='31' height='8' fill='#a1a3a6' />
                </g>

                <line
                  x1='10'
                  y1='85'
                  x2='110'
                  y2='85'
                  stroke='#1a1a1a'
                  strokeWidth='0.5'
                  strokeDasharray='2 2'
                />
                <line
                  x1='50'
                  y1='10'
                  x2='50'
                  y2='100'
                  stroke='#1a1a1a'
                  strokeWidth='0.5'
                  strokeDasharray='2 2'
                />
                <line
                  x1='85'
                  y1='20'
                  x2='85'
                  y2='100'
                  stroke='#1a1a1a'
                  strokeWidth='0.5'
                  strokeDasharray='2 2'
                />
                <line
                  x1='40'
                  y1='35'
                  x2='100'
                  y2='35'
                  stroke='#1a1a1a'
                  strokeWidth='0.5'
                  strokeDasharray='2 2'
                />
              </svg>
            ),
          },
        ],
      },
      {
        title: 'PPIC',
        url: '#',
        allowedRoles: ['Super-Admin', 'PPIC'],
        items: [
          {
            title: 'Project V2 | PPIC',
            url: '/dashboard/projects-v2/perencanaan',
          },
          {
            title: 'Project V2 | Pengiriman',
            url: '/dashboard/projects-v2/pengiriman',
          },
          {
            title: 'Project V2 | QC',
            url: '/dashboard/projects-v2/qc',
          },
        ],
      },
      {
        title: 'Produksi',
        url: '#',
        allowedRoles: ['Super-Admin', 'Produksi'],
        items: [
          {
            title: 'Project V2 | Produksi',
            url: '/dashboard/projects-v2/produksi',
          },
        ],
      },
      {
        title: 'Keuangan',
        url: '#',
        allowedRoles: ['Super-Admin', 'Keuangan', 'Piutang', 'Purchasing'],
        items: [
          {
            title: 'Project V2 | Piutang',
            url: '/dashboard/projects-v2/piutang',
          },
          {
            title: 'Project V2 | Purchasing',
            url: '/dashboard/projects-v2/purchasing',
          },
        ],
      },
      {
        title: 'Task IT',
        url: '#',
        allowedRoles: ['Super-Admin'],
        items: [
          {
            title: 'Task IT',
            url: '/dashboard/task-it',
          },
        ],
      },
    ].filter((group) => {
      if (!user) return false;

      // Collect all user roles into a single list
      const userRoles = [
        ...(user.role ? [user.role] : []),
        ...(user.roles?.map((r) => r.name) || []),
      ];

      // Check if any user role is in the group's allowedRoles
      return group.allowedRoles.some((allowed) => userRoles.includes(allowed));
    }),
  };

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-600 text-sidebar-primary-foreground'>
                <Building2 className='size-4' />
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold uppercase'>
                  DPSA System
                </span>
                <span className='truncate text-xs text-muted-foreground'>
                  Internal Ops
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Group */}
        {/* <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip='Dashboard'
                  isActive={isActive('/dashboard')}
                >
                  <Link href='/dashboard'>
                    <SquareTerminal />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip='Tracking'
                  isActive={isActive('/dashboard/projects')}
                >
                  <Link href='/dashboard/projects'>
                    <FileBox />
                    <span>Project Tracking</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip='MDL Catalog'
                  isActive={isActive('/dashboard/mdl')}
                >
                  <Link href='/dashboard/mdl'>
                    <Files />
                    <span>Master Data List</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}

        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip='Dashboard V2'
                  isActive={isActive('/dashboard/all')}
                >
                  <Link href='/dashboard/all'>
                    <Users />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip='MDL Catalog'
                  isActive={isActive('/dashboard/mdl')}
                >
                  <Link href='/dashboard/mdl'>
                    <Files />
                    <span>Master Data List</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem> */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip='User Management'
                    isActive={isActive('/dashboard/admin/users')}
                  >
                    <Link href='/dashboard/admin/users'>
                      <Users />
                      <span>User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip='Reports'
                    isActive={isActive('/dashboard/reports')}
                  >
                    <Link href='/dashboard/reports'>
                      <PieChart />
                      <span>Analytics & Reports</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Master Data</SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip='User Management'
                    isActive={isActive('/dashboard/admin/users')}
                  >
                    <Link href='/dashboard/master-data/divisi'>
                      <Users />
                      <span>Divisi</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>

            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip='User Management'
                    isActive={isActive('/dashboard/master-data/clients')}
                  >
                    <Link href='/dashboard/master-data/clients'>
                      <Users />
                      <span>Client</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>

            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip='Kategori MDL'
                    isActive={isActive('/dashboard/master-data/kategori-mdl')}
                  >
                    <Link href='/dashboard/master-data/kategori-mdl'>
                      <Users />
                      <span>Kategori MDL</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip='Sub Kategori'
                    isActive={isActive('/dashboard/master-data/sub-kategori')}
                  >
                    <Link href='/dashboard/master-data/sub-kategori-mdl'>
                      <Users />
                      <span>Sub Kategori MDL</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip='Lokasi'
                    isActive={isActive('/dashboard/master-data/lokasi-mdl')}
                  >
                    <Link href='/dashboard/master-data/lokasi-mdl'>
                      <Users />
                      <span>Lokasi MDL</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip='User Management'
                    isActive={isActive('/dashboard/master-data/barang')}
                  >
                    <Link href='/dashboard/master-data/barang'>
                      <Users />
                      <span>Barang</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip='MDL V2'
                    isActive={isActive('/dashboard/master-data/mdl-v2')}
                  >
                    <Link href='/dashboard/master-data/mdl-v2'>
                      <Users />
                      <span>MDL V2</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* add sidebar collapse  */}
        {data.navMain.map((item) => (
          <Collapsible
            key={item.title}
            title={item.title}
            defaultOpen
            className='group/collapsible'
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className='group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              >
                <CollapsibleTrigger>
                  {item.title}{' '}
                  <ChevronRight className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90' />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map((subItem: any) => (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(subItem.url)}
                        >
                          <a href={subItem.url} className='flex items-center'>
                            {subItem.icon && subItem.icon}
                            <span className='truncate'>{subItem.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <Avatar className='h-8 w-8 rounded-lg'>
                    {/* Placeholder Avatar */}
                    <AvatarImage
                      src={`https://ui-avatars.com/api/?name=${
                        user?.name || 'User'
                      }&background=f97316&color=fff`}
                      alt={user?.name}
                    />
                    <AvatarFallback className='rounded-lg'>CN</AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>
                      {user?.name || 'Guest'}
                    </span>
                    <span className='truncate text-xs'>
                      {user?.email || 'guest@example.com'}
                    </span>
                  </div>
                  <ChevronsUpDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
                side={isMobile ? 'bottom' : 'right'}
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                    <Avatar className='h-8 w-8 rounded-lg'>
                      <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${
                          user?.name || 'User'
                        }&background=f97316&color=fff`}
                        alt={user?.name}
                      />
                      <AvatarFallback className='rounded-lg'>CN</AvatarFallback>
                    </Avatar>
                    <div className='grid flex-1 text-left text-sm leading-tight'>
                      <span className='truncate font-semibold'>
                        {user?.name || 'Guest'}
                      </span>
                      <span className='truncate text-xs text-muted-foreground'>
                        {user?.roles?.[0]?.name || 'Staff'}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className='mr-2 h-4 w-4' />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className='text-red-500 hover:text-red-600'
                >
                  <LogOut className='mr-2 h-4 w-4' />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
