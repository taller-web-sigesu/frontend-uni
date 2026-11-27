const PATHS = {
  menu: 'M3 5h18M3 12h18M3 19h18',
  sidebar: 'M3 4h18v16H3zM9 4v16',
  home: 'm3 10 9-7 9 7v10h-6v-6H9v6H3z',
  chart: 'M4 4v16h16M8 16v-4m5 4V8m5 8V5',
  users: 'M15 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-4M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m7-8a4 4 0 0 1 0 8',
  catalog: 'M3 4h7v7H3zm11 0h7v7h-7zM3 15h7v5H3zm11 0h7v5h-7z',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  building: 'M3 21h18M6 21V4h12v17M10 8h4m-4 4h4m-4 4h4',
  calendar: 'M3 5h18v16H3zm0 5h18M7 3v4m10-4v4m-8 9 2 2 4-4',
  profile: 'M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  list: 'M7 5h14M7 12h14M7 19h14M3 5h.01M3 12h.01M3 19h.01',
  logout: 'M10 4H4v16h6m-1-8h12m-4-4 4 4-4 4',
  eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
};

export function Icon({ name }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}
